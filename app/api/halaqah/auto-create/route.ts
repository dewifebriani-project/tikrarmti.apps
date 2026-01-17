import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/halaqah/auto-create - Auto-create halaqah for all approved muallimah in a batch
const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    // Auth check
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Admin check
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || !userData.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { batch_id, program_id } = body;

    // Validate required fields
    if (!batch_id || !program_id) {
      return NextResponse.json(
        { error: 'Missing required fields: batch_id, program_id' },
        { status: 400 }
      );
    }

    // Get all approved muallimah registrations for this batch
    const { data: approvedMuallimah, error: fetchError } = await supabaseAdmin
      .from('muallimah_registrations')
      .select(`
        id,
        user_id,
        full_name,
        preferred_juz,
        preferred_max_thalibah,
        class_type,
        batch_id
      `)
      .eq('batch_id', batch_id)
      .eq('status', 'approved');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    if (!approvedMuallimah || approvedMuallimah.length === 0) {
      return NextResponse.json({
        created: 0,
        skipped: 0,
        errors: ['No approved muallimah found for this batch']
      }, { status: 200 });
    }

    // Get program details
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('*')
      .eq('id', program_id)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    let created = 0;
    let skipped = 0;
    const errors: Array<{ muallimah: string; error: string }> = [];

    // Create halaqah for each muallimah
    for (const muallimah of approvedMuallimah) {
      try {
        // Get normalized schedules for this muallimah
        const { data: schedules, error: scheduleError } = await supabaseAdmin
          .from('muallimah_schedules')
          .select('*')
          .eq('muallimah_registration_id', muallimah.id)
          .eq('is_preferred', true);

        if (scheduleError || !schedules || schedules.length === 0) {
          skipped++;
          errors.push({
            muallimah: muallimah.full_name,
            error: 'No schedule found. Please normalize schedule first.'
          });
          continue;
        }

        // Create halaqah for each preferred schedule
        for (const schedule of schedules) {
          const halaqahName = `${program.name} - Juz ${muallimah.preferred_juz} - ${muallimah.full_name}`;

          const { data: newHalaqah, error: createError } = await supabaseAdmin
            .from('halaqah')
            .insert({
              program_id,
              muallimah_id: muallimah.user_id,
              name: halaqahName,
              day_of_week: schedule.day_of_week,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              preferred_juz: muallimah.preferred_juz,
              max_students: muallimah.preferred_max_thalibah || 15,
              waitlist_max: 5,
              status: 'active'
            })
            .select('id')
            .single();

          if (createError) {
            errors.push({
              muallimah: muallimah.full_name,
              error: createError.message
            });
            continue;
          }

          // Assign muallimah as primary mentor
          await supabaseAdmin
            .from('halaqah_mentors')
            .insert({
              halaqah_id: newHalaqah.id,
              mentor_id: muallimah.user_id,
              role: 'ustadzah',
              is_primary: true
            });

          created++;
        }
      } catch (err: any) {
        errors.push({
          muallimah: muallimah.full_name,
          error: err.message || 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
