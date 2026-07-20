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
      .select('roles')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || !userData.roles?.includes('admin')) {
      console.error('Admin check failed:', dbError, userData);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get batch_id and mode from query parameter
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const mode = searchParams.get('mode') || 'daftar_ulang';

    if (!batchId) {
      return NextResponse.json(
        { error: 'Missing required parameter: batch_id' },
        { status: 400 }
      );
    }

    console.log('[Halaqah Availability API] Loading halaqah availability for batch:', batchId);

    // Fetch muallimah akads for this batch (approved only)
    const { data: muallimahRegsRaw } = await supabaseAdmin
      .from('muallimah_akads')
      .select(`
        user_id, 
        class_type, 
        preferred_juz, 
        preferred_schedule, 
        backup_schedule,
        preferred_max_thalibah,
        exclude_from_capacity,
        user:users!muallimah_akads_user_id_fkey(full_name, whatsapp)
      `)
      .eq('batch_id', batchId)
      .eq('status', 'approved');

    // Fetch memorized_juz from muallimah_registrations
    const { data: muallimahProfiles } = await supabaseAdmin
      .from('muallimah_registrations')
      .select('user_id, memorized_juz')
      .eq('batch_id', batchId);
      
    const profileMap = new Map((muallimahProfiles || []).map(p => [p.user_id, p]));

    const muallimahRegs = (muallimahRegsRaw || []).map(reg => ({
      ...reg,
      full_name: (reg.user as any)?.full_name || 'Unknown',
      wa_phone: (reg.user as any)?.whatsapp || '',
      memorized_juz: profileMap.get(reg.user_id)?.memorized_juz || '',
      exclude_from_capacity: reg.exclude_from_capacity,
      preferred_max_thalibah: reg.preferred_max_thalibah
    }));

    // Create muallimah map for quick lookup
    const muallimahMap = new Map(
      (muallimahRegs || []).map(reg => [reg.user_id, reg])
    );

    const approvedMuallimahIds = (muallimahRegs || [])
      .filter(reg => !reg.exclude_from_capacity)
      .map(reg => reg.user_id);

    if (mode === 'pendaftar') {
      // Helper function to extract base juz, e.g. "30A" -> "30", "1" -> "1"
      const getBaseJuz = (juz: string): string => {
        const match = juz.trim().match(/^\d+/);
        return match ? match[0] : juz.trim();
      };

      const pendaftarPerJuz = new Map<string, number>();
      const { data: pendaftarList } = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .select('chosen_juz')
        .eq('batch_id', batchId)
        .in('status', ['pending', 'approved']);
      
      if (pendaftarList) {
        pendaftarList.forEach(p => {
          const juz = (p.chosen_juz || 'Unknown').trim();
          const baseJuz = getBaseJuz(juz);
          pendaftarPerJuz.set(baseJuz, (pendaftarPerJuz.get(baseJuz) || 0) + 1);
        });
      }

      const displayGroups = Array.from(new Set<string>(pendaftarPerJuz.keys()));
      const muallimahRegsFiltered = muallimahRegs.filter(m => !m.exclude_from_capacity);

      const availability: any[] = [];

      // 1. Build juz demands and capacities mapping
      const juzThalibahMap = new Map<string, number>();
      const juzAllocatedCapacity = new Map<string, number>();
      for (const juz of displayGroups) {
        juzThalibahMap.set(juz, pendaftarPerJuz.get(juz) || 0);
        juzAllocatedCapacity.set(juz, 0);
      }

      // 2. Parse all active muallimahs and their available schedules
      const muallimahsWithSchedules = muallimahRegsFiltered.map(m => {
        const schedulesList: any[] = [];
        try {
          const parsedPref = typeof m.preferred_schedule === 'string' ? JSON.parse(m.preferred_schedule) : m.preferred_schedule;
          const programKeys = ['tikrar', 'pra_tahfidz', 'berbayar', 'tahfidz', 'tashih'];
          
          if (parsedPref) {
            for (const key of programKeys) {
              if (parsedPref[key] && parsedPref[key].day) {
                const d = parsedPref[key].day;
                schedulesList.push({
                  type: key === 'pra_tahfidz' ? 'Pra-Tikrar' : key.charAt(0).toUpperCase() + key.slice(1),
                  is_backup: false,
                  day_name: d.charAt(0).toUpperCase() + d.slice(1),
                  start_time: parsedPref[key].time_start || '-',
                  end_time: parsedPref[key].time_end || '-'
                });
              }
            }
            if (schedulesList.length === 0 && parsedPref.day) {
              const d = parsedPref.day;
              schedulesList.push({
                type: 'Utama',
                is_backup: false,
                day_name: d.charAt(0).toUpperCase() + d.slice(1),
                start_time: parsedPref.time_start || '-',
                end_time: parsedPref.time_end || '-'
              });
            }
          }

          if (m.backup_schedule) {
            const parsedBack = typeof m.backup_schedule === 'string' ? JSON.parse(m.backup_schedule) : m.backup_schedule;
            if (parsedBack) {
              for (const key of programKeys) {
                if (parsedBack[key] && parsedBack[key].day) {
                  const d = parsedBack[key].day;
                  schedulesList.push({
                    type: key === 'pra_tahfidz' ? 'Pra-Tikrar' : key.charAt(0).toUpperCase() + key.slice(1),
                    is_backup: true,
                    day_name: d.charAt(0).toUpperCase() + d.slice(1),
                    start_time: parsedBack[key].time_start || '-',
                    end_time: parsedBack[key].time_end || '-'
                  });
                }
              }
              if (schedulesList.filter((s: any) => s.is_backup).length === 0 && parsedBack.day) {
                const d = parsedBack.day;
                schedulesList.push({
                  type: 'Cadangan',
                  is_backup: true,
                  day_name: d.charAt(0).toUpperCase() + d.slice(1),
                  start_time: parsedBack.time_start || '-',
                  end_time: parsedBack.time_end || '-'
                });
              }
            }
          }
        } catch (e) {
          console.error('Error parsing schedule:', e);
        }

        if (schedulesList.length === 0) {
          schedulesList.push({
            type: 'Utama',
            is_backup: false,
            day_name: '-',
            start_time: '-',
            end_time: '-'
          });
        }

        let juzStr = '';
        if (m.preferred_juz && String(m.preferred_juz).trim() !== '') {
          juzStr = String(m.preferred_juz).trim();
        } else if (m.memorized_juz) {
          if (Array.isArray(m.memorized_juz)) {
            // Extracts numbers from elements like "Juz 30", "1", etc.
            juzStr = m.memorized_juz.map(j => {
              if (typeof j === 'object' && j !== null && j.juz) return j.juz;
              return String(j);
            }).join(',');
          } else if (typeof m.memorized_juz === 'string') {
            try {
              // Try to parse if it's a JSON string array
              const parsed = JSON.parse(m.memorized_juz);
              if (Array.isArray(parsed)) {
                juzStr = parsed.map(j => {
                  if (typeof j === 'object' && j !== null && j.juz) return j.juz;
                  return String(j);
                }).join(',');
              } else {
                juzStr = String(m.memorized_juz).trim();
              }
            } catch (e) {
              juzStr = String(m.memorized_juz).trim();
            }
          } else {
            juzStr = String(m.memorized_juz).trim();
          }
        }
        
        const preferredJuzs = juzStr.split(',').map(s => getBaseJuz(s.trim())).filter(Boolean);

        return {
          user_id: m.user_id,
          full_name: m.full_name,
          wa_phone: m.wa_phone,
          memorized_juz: m.memorized_juz,
          class_type: m.class_type,
          preferred_max_thalibah: m.preferred_max_thalibah || 10,
          preferred_juz: preferredJuzs,
          raw_preferred_juz: m.preferred_juz,
          schedules: schedulesList
        };
      });

      // 3. Create schedule slots flat list
      const slots: any[] = [];
      for (const m of muallimahsWithSchedules) {
        for (let i = 0; i < m.schedules.length; i++) {
          slots.push({
            muallimah_id: m.user_id,
            schedule_index: i,
            preferred_juz: m.preferred_juz,
            capacity: m.preferred_max_thalibah,
            allocated_juz: null as string | null
          });
        }
      }

      // 4. Greedy Allocation algorithm:
      // Phase 4a: Allocate slots for Muallimahs who only have 1 preferred Juz (non-flexible)
      for (const slot of slots) {
        if (slot.preferred_juz.length === 1) {
          const targetJuz = slot.preferred_juz[0];
          slot.allocated_juz = targetJuz;
          const curAlloc = juzAllocatedCapacity.get(targetJuz) || 0;
          juzAllocatedCapacity.set(targetJuz, curAlloc + slot.capacity);
        }
      }

      // Phase 4b: Allocate remaining slots to the Juz among their preferred list that needs it most (highest shortage)
      let allocationChanged = true;
      while (allocationChanged) {
        allocationChanged = false;
        let bestSlot = null;
        let bestJuz = null;
        let maxShortage = -Infinity;

        const unallocatedSlots = slots.filter(s => !s.allocated_juz);
        if (unallocatedSlots.length === 0) break;

        for (const slot of unallocatedSlots) {
          for (const j of slot.preferred_juz) {
            const demanded = juzThalibahMap.get(j) || 0;
            const allocated = juzAllocatedCapacity.get(j) || 0;
            const shortage = demanded - allocated;
            if (shortage > maxShortage) {
              maxShortage = shortage;
              bestSlot = slot;
              bestJuz = j;
            }
          }
        }

        if (bestSlot && bestJuz) {
          bestSlot.allocated_juz = bestJuz;
          const curAlloc = juzAllocatedCapacity.get(bestJuz) || 0;
          juzAllocatedCapacity.set(bestJuz, curAlloc + bestSlot.capacity);
          allocationChanged = true;
        } else {
          break;
        }
      }

      // Phase 4c: Fallback - allocate any remaining slots to the first preferred Juz
      for (const slot of slots) {
        if (!slot.allocated_juz && slot.preferred_juz.length > 0) {
          slot.allocated_juz = slot.preferred_juz[0];
        }
      }

      // 5. Build final availability list per Juz group
      for (const juz of displayGroups) {
        const totalThalibah = pendaftarPerJuz.get(juz) || 0;
        
        // Find all muallimahs that match this base group
        const matchedMuallimahs = muallimahsWithSchedules.filter(m => 
          m.preferred_juz.includes(juz)
        );

        const totalMuallimah = matchedMuallimahs.length;
        const totalCapacity = matchedMuallimahs.reduce((sum, m) => sum + m.preferred_max_thalibah, 0);
        const neededHalaqah = Math.max(0, Math.ceil((totalThalibah - totalCapacity) / 10));
        const utilizationPercentage = totalCapacity > 0 ? Math.round((totalThalibah / totalCapacity) * 100) : (totalThalibah > 0 ? 100 : 0);

        let totalSchedules = 0;
        const halaqahDetails = matchedMuallimahs.map(m => {
          totalSchedules += m.schedules.length;

          // Check which schedules are allocated to this Juz group
          const schedulesWithAllocation = m.schedules.map((s, idx) => {
            const isAllocatedHere = slots.some(slot => 
              slot.muallimah_id === m.user_id && 
              slot.schedule_index === idx && 
              slot.allocated_juz === juz
            );
            return {
              ...s,
              is_allocated_here: isAllocatedHere
            };
          });

          const hasAnyAllocationHere = schedulesWithAllocation.some(s => s.is_allocated_here);

          return {
            id: m.user_id,
            name: `${m.full_name}`,
            day_of_week: null,
            day_name: m.schedules[0]?.day_name || '-',
            start_time: m.schedules[0]?.start_time || '-',
            end_time: m.schedules[0]?.end_time || '-',
            location: '-',
            max_students: m.preferred_max_thalibah,
            current_students: 0,
            available_slots: m.preferred_max_thalibah,
            utilization_percent: 0,
            is_full: false,
            muallimah_name: m.full_name,
            class_type: m.class_type,
            preferred_juz: m.raw_preferred_juz,
            wa_phone: m.wa_phone,
            memorized_juz: m.memorized_juz,
            schedules: schedulesWithAllocation,
            is_allocated: hasAnyAllocationHere
          };
        });

        availability.push({
          juz_number: juz,
          juz_name: juz.startsWith('Juz') ? juz : `Juz ${juz}`,
          total_halaqah: totalMuallimah,
          total_schedules: totalSchedules,
          total_capacity: totalCapacity,
          total_filled: totalThalibah,
          total_available: Math.max(0, totalCapacity - totalThalibah),
          total_thalibah: totalThalibah,
          utilization_percentage: utilizationPercentage,
          needed_halaqah: neededHalaqah,
          thalibah_breakdown: {},
          halaqah_details: halaqahDetails
        });
      }

      availability.sort((a, b) => {
        const aNum = parseInt(a.juz_number) || 0;
        const bNum = parseInt(b.juz_number) || 0;
        if (aNum !== bNum) return aNum - bNum;
        return String(a.juz_number).localeCompare(String(b.juz_number));
      });

      const { data: batchData } = await supabaseAdmin.from('batches').select('name, id').eq('id', batchId).single();

      await logAudit({
        userId: user.id,
        action: 'READ',
        resource: 'halaqah_availability_analysis',
        details: { batch_id: batchId, batch_name: batchData?.name, mode: 'pendaftar' },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        level: 'INFO'
      });

      return NextResponse.json({
        success: true,
        data: { batch: batchData, availability }
      });
    }


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
        muallimah_id,
        programs!inner(batch_id)
      `)
      .eq('status', 'active')
      .eq('programs.batch_id', batchId)
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

    // Fetch pendaftaran if mode is pendaftar
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

    // Convert Map entries to array for iteration
    const juzEntries = Array.from(juzMap.entries());

    for (const [juzNumber, halaqahList] of juzEntries) {
      const totalHalaqah = halaqahList.length;
      const totalCapacity = halaqahList.reduce((sum, h) => sum + h.max_students, 0);
      const totalFilled = halaqahList.reduce((sum, h) => sum + h.current_students, 0);
      
      const totalThalibah = totalFilled;

      let neededHalaqah = 0;
      if (mode === 'pendaftar') {
        neededHalaqah = Math.max(0, Math.ceil(totalThalibah / 10) - totalHalaqah); // Assuming 10 students per halaqah average
      } else {
        const totalAvailable = Math.max(0, totalCapacity - totalFilled);
        neededHalaqah = totalAvailable === 0 && totalHalaqah > 0 ? 1 : 0; // Simplified - could be more sophisticated
      }
      
      const totalAvailable = Math.max(0, totalCapacity - totalFilled);
      const utilizationPercentage = totalCapacity > 0 ? Math.round((totalFilled / totalCapacity) * 100) : 0;

      const juzData: any = {
        juz_number: juzNumber,
        juz_name: juzNumber === 0 ? 'Campuran' : `Juz ${juzNumber}`,
        total_halaqah: totalHalaqah,
        total_capacity: totalCapacity,
        total_filled: totalFilled,
        total_available: totalAvailable,
        total_thalibah: totalThalibah,
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
          muallimah_name: h.muallimah_name,
          class_type: h.class_type
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
