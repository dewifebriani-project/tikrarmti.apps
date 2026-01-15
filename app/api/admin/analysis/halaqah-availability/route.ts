import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

const DAY_NAMES = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export async function GET(request: NextRequest) {
  try {
    // Use Supabase SSR client to get session
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Check if user is admin using admin client
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      console.error('Admin check failed:', dbError, userData);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get batch_id from query parameter
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    if (!batchId) {
      return NextResponse.json(
        { error: 'Missing required parameter: batch_id' },
        { status: 400 }
      );
    }

    console.log('[Halaqah Availability API] Loading halaqah availability for batch:', batchId);

    // Fetch muallimah registrations for this batch (approved only)
    const { data: muallimahRegs } = await supabaseAdmin
      .from('muallimah_registrations')
      .select('user_id, class_type, preferred_juz, preferred_schedule, full_name')
      .eq('batch_id', batchId)
      .eq('status', 'approved');

    // Create muallimah map for quick lookup
    const muallimahMap = new Map(
      (muallimahRegs || []).map(reg => [reg.user_id, reg])
    );

    const approvedMuallimahIds = (muallimahRegs || []).map(reg => reg.user_id);

    // Fetch all active halaqah (filter by muallimah from this batch)
    const { data: halaqahData, error: halaqahError } = await supabaseAdmin
      .from('halaqah')
      .select(`
        id,
        name,
        description,
        day_of_week,
        start_time,
        end_time,
        location,
        max_students,
        status,
        zoom_link,
        preferred_juz,
        muallimah_id
      `)
      .eq('status', 'active')
      .order('day_of_week', { ascending: true });

    if (halaqahError) {
      console.error('[Halaqah Availability API] Error fetching halaqah:', halaqahError);
      return NextResponse.json(
        { error: 'Failed to fetch halaqah data', details: halaqahError.message },
        { status: 500 }
      );
    }

    // Filter halaqah by muallimah from this batch
    const batchHalaqahs = (halaqahData || []).filter(h =>
      h.muallimah_id && approvedMuallimahIds.includes(h.muallimah_id)
    );

    console.log('[Halaqah Availability API] Filtered halaqahs:', {
      total: halaqahData?.length,
      batch: batchHalaqahs.length
    });

    // Fetch all submissions for this batch (only submitted and approved count towards quota)
    // IMPORTANT: Draft submissions do NOT reduce quota
    const { data: submissions } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('ujian_halaqah_id, tashih_halaqah_id, is_tashih_umum, status, user_id')
      .eq('batch_id', batchId)
      .in('status', ['submitted', 'approved']);

    // Fetch halaqah_students (assigned thalibah with active status only)
    // IMPORTANT: waitlist does NOT reduce quota, only active status counts
    const { data: halaqahStudents } = await supabaseAdmin
      .from('halaqah_students')
      .select('halaqah_id, thalibah_id, status')
      .eq('status', 'active');

    // Count students per halaqah using the SAME logic as /api/shared/halaqah-quota
    // Use a Set to track unique users per halaqah
    const halaqahStudentMap = new Map<string, Set<string>>();

    // Count from daftar_ulang_submissions (only submitted and approved)
    if (submissions) {
      for (const sub of submissions) {
        // For tashih_ujian classes, ujian_halaqah_id and tashih_halaqah_id are the same
        // We need to count each user only once per halaqah, even if they selected both ujian and tashih
        const uniqueHalaqahIds: string[] = [];

        if (sub.ujian_halaqah_id) {
          uniqueHalaqahIds.push(sub.ujian_halaqah_id);
        }
        if (sub.tashih_halaqah_id && !sub.is_tashih_umum) {
          // Only add if not already in the list (for tashih_ujian case)
          if (!uniqueHalaqahIds.includes(sub.tashih_halaqah_id)) {
            uniqueHalaqahIds.push(sub.tashih_halaqah_id);
          }
        }

        // Add user to each unique halaqah
        for (let i = 0; i < uniqueHalaqahIds.length; i++) {
          const halaqahId = uniqueHalaqahIds[i];
          if (!halaqahStudentMap.has(halaqahId)) {
            halaqahStudentMap.set(halaqahId, new Set());
          }
          halaqahStudentMap.get(halaqahId)!.add(sub.user_id);
        }
      }
    }

    // Also count students from halaqah_students table (active only)
    // Waitlist does NOT reduce quota, only active status counts
    if (halaqahStudents) {
      for (const student of halaqahStudents) {
        const halaqahId = student.halaqah_id;
        if (!halaqahStudentMap.has(halaqahId)) {
          halaqahStudentMap.set(halaqahId, new Set());
        }
        halaqahStudentMap.get(halaqahId)!.add(student.thalibah_id);
      }
    }

    // Group halaqah by juz
    const juzMap = new Map<number, any[]>();

    // Process halaqah data and add quota information
    const processedHalaqahs = batchHalaqahs.map(h => {
      // Get current student count from submissions map
      const currentStudents = halaqahStudentMap.get(h.id)?.size || 0;
      const maxStudents = h.max_students || 20;
      const isFull = currentStudents >= maxStudents;
      const availableSlots = Math.max(0, maxStudents - currentStudents);
      const utilizationPercent = maxStudents > 0 ? Math.round((currentStudents / maxStudents) * 100) : 0;

      // Get muallimah registration data from the map using muallimah_id
      const muallimahReg = h.muallimah_id ? muallimahMap.get(h.muallimah_id) : null;
      const classType = muallimahReg?.class_type || 'tashih_ujian';
      const muallimahPreferredJuz = muallimahReg?.preferred_juz || h.preferred_juz;
      const muallimahName = muallimahReg?.full_name || 'Muallimah';

      // Use halaqah schedule first, fallback to muallimah_registrations schedule
      let schedule = null;
      if (h.day_of_week !== null && h.start_time && h.end_time) {
        schedule = {
          day: DAY_NAMES[h.day_of_week],
          time_start: h.start_time,
          time_end: h.end_time
        };
      } else if (muallimahReg?.preferred_schedule) {
        try {
          schedule = typeof muallimahReg.preferred_schedule === 'string'
            ? JSON.parse(muallimahReg.preferred_schedule)
            : muallimahReg.preferred_schedule;
        } catch (e) {
          schedule = null;
        }
      }

      return {
        id: h.id,
        name: h.name,
        description: h.description,
        day_of_week: h.day_of_week,
        day_name: h.day_of_week !== null ? DAY_NAMES[h.day_of_week] : null,
        start_time: h.start_time,
        end_time: h.end_time,
        location: h.location,
        max_students: maxStudents,
        preferred_juz: muallimahPreferredJuz,
        muallimah_id: h.muallimah_id,
        muallimah_name: muallimahName,
        class_type: classType,
        schedule: schedule,
        current_students: currentStudents,
        available_slots: availableSlots,
        is_full: isFull,
        utilization_percent: utilizationPercent
      };
    });

    // Group by juz
    processedHalaqahs.forEach(h => {
      const juz = h.preferred_juz || 0;
      if (!juzMap.has(juz)) {
        juzMap.set(juz, []);
      }
      juzMap.get(juz)!.push(h);
    });

    // Build availability response grouped by juz
    const availability: any[] = [];

    for (const [juzNumber, halaqahList] of juzMap.entries()) {
      const totalHalaqah = halaqahList.length;
      const totalCapacity = halaqahList.reduce((sum, h) => sum + h.max_students, 0);
      const totalFilled = halaqahList.reduce((sum, h) => sum + h.current_students, 0);
      const totalAvailable = Math.max(0, totalCapacity - totalFilled);
      const utilizationPercentage = totalCapacity > 0 ? Math.round((totalFilled / totalCapacity) * 100) : 0;

      // Calculate needed halaqah (assuming 5 students per halaqah minimum)
      // If there are no available slots and still have demand, need more halaqah
      const neededHalaqah = totalAvailable === 0 ? 1 : 0; // Simplified - could be more sophisticated

      const juzData: any = {
        juz_number: juzNumber,
        juz_name: juzNumber === 0 ? 'Campuran' : `Juz ${juzNumber}`,
        total_halaqah: totalHalaqah,
        total_capacity: totalCapacity,
        total_filled: totalFilled,
        total_available: totalAvailable,
        total_thalibah: totalFilled, // This could be refined with actual thalibah data
        utilization_percentage: utilizationPercentage,
        needed_halaqah: neededHalaqah,
        thalibah_breakdown: {}, // Could be enhanced with actual breakdown
        halaqah_details: halaqahList.map(h => ({
          id: h.id,
          name: h.name,
          day_of_week: h.day_of_week,
          day_name: h.day_name,
          start_time: h.start_time,
          end_time: h.end_time,
          location: h.location,
          max_students: h.max_students,
          current_students: h.current_students,
          available_slots: h.available_slots,
          utilization_percent: h.utilization_percent,
          is_full: h.is_full,
          muallimah_name: h.muallimah_name
        }))
      };

      availability.push(juzData);
    }

    // Sort by juz number
    availability.sort((a, b) => a.juz_number - b.juz_number);

    // Get batch info
    const { data: batchData, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('name, id')
      .eq('id', batchId)
      .single();

    console.log('[Halaqah Availability API] Processed availability:', {
      juzCount: availability.length,
      totalHalaqah: processedHalaqahs.length
    });

    // Audit log for halaqah availability access
    await logAudit({
      userId: user.id,
      action: 'READ',
      resource: 'halaqah_availability_analysis',
      details: {
        batch_id: batchId,
        batch_name: batchData?.name,
        juz_analyzed: availability.length
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({
      success: true,
      data: {
        batch: batchData,
        availability: availability
      }
    });

  } catch (error) {
    console.error('[Halaqah Availability API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
