import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/halaqah/available-for-thalibah - List halaqah available for thalibah to join
const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const eligiblePrograms = searchParams.get('eligible_programs');
    const preferredJuz = searchParams.get('preferred_juz');
    const thalibahId = searchParams.get('thalibah_id');

    // If thalibah_id is provided, check their enrollment to avoid showing halaqah they're already in
    const enrolledHalaqahIds: string[] = [];
    if (thalibahId) {
      const { data: enrollments } = await supabase
        .from('halaqah_students')
        .select('halaqah_id')
        .eq('thalibah_id', thalibahId)
        .in('status', ['active', 'waitlist']);

      if (enrollments) {
        enrolledHalaqahIds.push(...enrollments.map(e => e.halaqah_id));
      }
    }

    // Build query
    let query = supabase
      .from('halaqah')
      .select(`
        *,
        program:programs(*, batch:batches(*)),
        muallimah:users!left(id, full_name, email)
      `)
      .eq('status', 'active')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    // Filter by batch if provided
    if (batchId) {
      query = query.eq('program.batch_id', batchId);
    }

    // Filter by eligible programs if provided
    if (eligiblePrograms) {
      const programTypes = eligiblePrograms.split(',');
      query = query.in('program.class_type', programTypes);
    }

    // Filter by preferred juz if provided
    if (preferredJuz) {
      query = query.eq('preferred_juz', preferredJuz);
    }

    const { data: halaqah, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Enrich with capacity info for each halaqah
    const halaqahWithCapacity = await Promise.all(
      (halaqah || []).map(async (h: any) => {
        // Count active students
        const { count: activeCount } = await supabase
          .from('halaqah_students')
          .select('*', { count: 'exact', head: true })
          .eq('halaqah_id', h.id)
          .eq('status', 'active');

        // Count waitlist students
        const { count: waitlistCount } = await supabase
          .from('halaqah_students')
          .select('*', { count: 'exact', head: true })
          .eq('halaqah_id', h.id)
          .eq('status', 'waitlist');

        const capacity = h.max_students || 20;
        const maxWaitlist = h.waitlist_max || 5;
        const active = activeCount || 0;
        const waitlist = waitlistCount || 0;

        // Check if user is enrolled
        const isEnrolled = enrolledHalaqahIds.includes(h.id);
        let enrollmentStatus = null;
        if (isEnrolled) {
          const { data: enrollment } = await supabase
            .from('halaqah_students')
            .select('status, joined_waitlist_at')
            .eq('halaqah_id', h.id)
            .eq('thalibah_id', thalibahId)
            .single();

          if (enrollment) {
            enrollmentStatus = {
              status: enrollment.status,
              joined_waitlist_at: enrollment.joined_waitlist_at
            };
          }
        }

        return {
          ...h,
          capacity_info: {
            max_students: capacity,
            active_students: active,
            waitlist_students: waitlist,
            max_waitlist: maxWaitlist,
            spots_available: Math.max(0, capacity - active),
            is_full: active >= capacity,
            waitlist_full: waitlist >= maxWaitlist,
            can_join: !isEnrolled && active < capacity,
            can_join_waitlist: !isEnrolled && active >= capacity && waitlist < maxWaitlist
          },
          is_enrolled: isEnrolled,
          enrollment_status: enrollmentStatus
        };
      })
    );

    return NextResponse.json({ data: halaqahWithCapacity });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
