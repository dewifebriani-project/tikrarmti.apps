import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    console.log('[Daftar Ulang Halaqah Stats] Fetching statistics with params:', { batchId });

    // Build base query - fetch all submissions with halaqah info
    let query = supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('ujian_halaqah_id, tashih_halaqah_id, is_tashih_umum, confirmed_chosen_juz, status, user_id');

    // Apply batch filter (only if batchId is not 'all')
    if (batchId && batchId !== 'all') {
      query = query.eq('batch_id', batchId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Daftar Ulang Halaqah Stats] Error fetching statistics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statistics', details: error.message },
        { status: 500 }
      );
    }

    // Track unique halaqah and thalibah
    const halaqahSet = new Set<string>();
    const thalibahSet = new Set<string>();

    // Count by type (ujian, tashih, both)
    let bothCount = 0;
    let ujianCount = 0;
    let tashihCount = 0;
    const thalibahTypeMap = new Map<string, 'ujian' | 'tashih' | 'both'>(); // Track each thalibah's type

    // Count by Juz
    const juzCount: Record<string, number> = {};

    // Map halaqah ID to day of week for schedule counting
    const halaqahScheduleMap = new Map<string, { day_of_week?: number; start_time?: string; end_time?: string }>();

    // First pass: collect all halaqah IDs and thalibah info
    data?.forEach((s: any) => {
      // Track unique thalibah
      thalibahSet.add(s.user_id);

      // Track juz count
      const juz = s.confirmed_chosen_juz || 'Unknown';
      juzCount[juz] = (juzCount[juz] || 0) + 1;

      // Process ujian halaqah
      if (s.ujian_halaqah_id) {
        halaqahSet.add(s.ujian_halaqah_id);

        const currentType = thalibahTypeMap.get(s.user_id);
        if (currentType === 'tashih') {
          thalibahTypeMap.set(s.user_id, 'both');
        } else if (!currentType) {
          thalibahTypeMap.set(s.user_id, 'ujian');
        }
      }

      // Process tashih halaqah (exclude umum)
      if (s.tashih_halaqah_id && !s.is_tashih_umum) {
        halaqahSet.add(s.tashih_halaqah_id);

        const currentType = thalibahTypeMap.get(s.user_id);
        if (currentType === 'ujian') {
          thalibahTypeMap.set(s.user_id, 'both');
        } else if (!currentType) {
          thalibahTypeMap.set(s.user_id, 'tashih');
        }
      }
    });

    // Count by type based on thalibah type map
    thalibahTypeMap.forEach((type) => {
      if (type === 'both') bothCount++;
      else if (type === 'ujian') ujianCount++;
      else if (type === 'tashih') tashihCount++;
    });

    // Fetch halaqah details for schedule counting
    if (halaqahSet.size > 0) {
      const { data: halaqahData } = await supabaseAdmin
        .from('halaqah')
        .select('id, day_of_week, start_time, end_time')
        .in('id', Array.from(halaqahSet));

      halaqahData?.forEach((h: any) => {
        halaqahScheduleMap.set(h.id, {
          day_of_week: h.day_of_week,
          start_time: h.start_time,
          end_time: h.end_time
        });
      });
    }

    // Count by Schedule (day of week) - count thalibah per schedule
    const scheduleCount: Record<string, number> = {};
    const thalibahPerSchedule = new Map<string, Set<string>>(); // Track unique thalibah per schedule

    data?.forEach((s: any) => {
      // Process ujian halaqah
      if (s.ujian_halaqah_id) {
        const schedule = halaqahScheduleMap.get(s.ujian_halaqah_id);
        if (schedule?.day_of_week !== undefined && schedule.day_of_week >= 1) {
          const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
          const day = DAY_NAMES[schedule.day_of_week];
          if (!thalibahPerSchedule.has(day)) {
            thalibahPerSchedule.set(day, new Set());
          }
          thalibahPerSchedule.get(day)!.add(s.user_id);
        }
      }

      // Process tashih halaqah (exclude umum)
      if (s.tashih_halaqah_id && !s.is_tashih_umum) {
        const schedule = halaqahScheduleMap.get(s.tashih_halaqah_id);
        if (schedule?.day_of_week !== undefined && schedule.day_of_week >= 1) {
          const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
          const day = DAY_NAMES[schedule.day_of_week];
          if (!thalibahPerSchedule.has(day)) {
            thalibahPerSchedule.set(day, new Set());
          }
          thalibahPerSchedule.get(day)!.add(s.user_id);
        }
      }
    });

    // Convert sets to counts
    thalibahPerSchedule.forEach((thalibahSet, day) => {
      scheduleCount[day] = thalibahSet.size;
    });

    const stats = {
      totalHalaqah: halaqahSet.size,
      totalThalibah: thalibahSet.size,
      bothCount,
      ujianCount,
      tashihCount,
      juzCount,
      scheduleCount
    };

    console.log('[Daftar Ulang Halaqah Stats] Success:', stats);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[Daftar Ulang Halaqah Stats] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
