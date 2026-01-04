import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

// POST /api/admin/halaqah/auto-create-simple
// Auto-create halaqah for approved muallimah WITHOUT program assignment
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { batch_id } = body;

    if (!batch_id) {
      return NextResponse.json(
        { error: 'Missing required field: batch_id' },
        { status: 400 }
      );
    }

    console.log('[AutoCreateSimple] Starting auto-create for batch:', batch_id);

    // Get all approved muallimah for this batch
    const { data: muallimahs, error: muallimaError } = await supabaseAdmin
      .from('muallimah_registrations')
      .select('*')
      .eq('batch_id', batch_id)
      .eq('status', 'approved');

    if (muallimaError) {
      console.error('[AutoCreateSimple] Error fetching muallimah:', muallimaError);
      return NextResponse.json(
        { error: 'Failed to fetch muallimah data', details: muallimaError.message },
        { status: 500 }
      );
    }

    if (!muallimahs || muallimahs.length === 0) {
      console.log('[AutoCreateSimple] No approved muallimah found');
      return NextResponse.json({
        success: true,
        created: 0,
        skipped: 0,
        message: 'No approved muallimah found for this batch'
      });
    }

    console.log('[AutoCreateSimple] Found', muallimahs.length, 'approved muallimah');

    let created = 0;
    let skipped = 0;
    const details: string[] = [];

    // Create halaqah for each muallimah (without program assignment)
    for (const muallimah of muallimahs) {
      try {
        // Check if halaqah already exists for this muallimah (without program)
        const { data: existingHalaqahs } = await supabaseAdmin
          .from('halaqah')
          .select('id, name')
          .eq('muallimah_id', muallimah.user_id)
          .is('program_id', null);

        if (existingHalaqahs && existingHalaqahs.length > 0) {
          details.push(`⚠️ Halaqah already exists for ${muallimah.full_name}`);
          skipped++;
          continue;
        }

        // Create halaqah (without program assignment)
        // Clean up the name to avoid double "Halaqah" prefix
        let cleanName = muallimah.full_name;
        if (cleanName.startsWith('Halaqah ')) {
          cleanName = cleanName.substring(8); // Remove "Halaqah " prefix
        }
        if (cleanName.startsWith('Ustadzah ')) {
          cleanName = cleanName.substring(9); // Remove "Ustadzah " prefix
        }
        const halaqahName = `Halaqah Ustadzah ${cleanName}`;

        const { data: newHalaqah, error: createError } = await supabaseAdmin
          .from('halaqah')
          .insert({
            program_id: null,
            muallimah_id: muallimah.user_id,
            name: halaqahName,
            description: `Halaqah diampu oleh ${muallimah.full_name}`,
            day_of_week: null,
            start_time: null,
            end_time: null,
            max_students: muallimah.preferred_max_thalibah || 20,
            waitlist_max: 5,
            preferred_juz: muallimah.preferred_juz,
            status: 'active',
          })
          .select()
          .single();

        if (createError) {
          console.error('[AutoCreateSimple] Error creating halaqah:', createError);
          details.push(`✗ Failed to create halaqah for ${muallimah.full_name}: ${createError.message}`);
          skipped++;
          continue;
        }

        // Add muallimah as mentor
        const { error: mentorError } = await supabaseAdmin
          .from('halaqah_mentors')
          .insert({
            halaqah_id: newHalaqah.id,
            mentor_id: muallimah.user_id,
            role: 'ustadzah',
            is_primary: true,
          });

        if (mentorError) {
          console.error('[AutoCreateSimple] Error adding mentor:', mentorError);
        }

        details.push(`✓ Created halaqah for ${muallimah.full_name}`);
        created++;
      } catch (error: any) {
        console.error(`[AutoCreateSimple] Error creating halaqah for ${muallimah.full_name}:`, error);
        details.push(`✗ Failed to create halaqah for ${muallimah.full_name}: ${error.message}`);
        skipped++;
      }
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'CREATE',
      resource: 'halaqah',
      details: {
        batch_id,
        created,
        skipped,
        total_muallimah: muallimahs.length
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    console.log('[AutoCreateSimple] Completed:', { created, skipped });

    return NextResponse.json({
      success: true,
      created,
      skipped,
      details,
      message: `Created ${created} halaqah${skipped > 0 ? `, skipped ${skipped}` : ''}`
    });

  } catch (error: any) {
    console.error('[AutoCreateSimple] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
