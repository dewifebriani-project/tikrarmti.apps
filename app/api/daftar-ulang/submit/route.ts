import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

/**
 * POST /api/daftar-ulang/submit
 *
 * Complete the daftar ulang (re-enrollment) process
 * This marks the re-enrollment as completed and transitions the user to thalibah
 *
 * Body: {
 *   batch_id: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { batch_id } = body;

    // Validate required fields
    if (!batch_id) {
      return NextResponse.json(
        { error: 'batch_id is required' },
        { status: 400 }
      );
    }

    // Get user's registration
    const { data: registration } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, selection_status, re_enrollment_completed')
      .eq('user_id', user.id)
      .eq('batch_id', batch_id)
      .single();

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    if (registration.selection_status !== 'selected') {
      return NextResponse.json(
        { error: 'Only selected thalibah can complete daftar ulang' },
        { status: 403 }
      );
    }

    if (registration.re_enrollment_completed) {
      return NextResponse.json(
        { error: 'Re-enrollment already completed' },
        { status: 400 }
      );
    }

    // Verify all required components are completed

    // Check schedule preference exists
    const { data: schedulePreference } = await supabaseAdmin
      .from('ustadzah_preferences')
      .select('preferred_muallimah_tashih, preferred_muallimah_ujian')
      .eq('user_id', user.id)
      .eq('batch_id', batch_id)
      .maybeSingle();

    if (!schedulePreference || !schedulePreference.preferred_muallimah_tashih || !schedulePreference.preferred_muallimah_ujian) {
      return NextResponse.json(
        { error: 'Please select your tashih and ujian schedule preferences first' },
        { status: 400 }
      );
    }

    const { data: akad } = await supabaseAdmin
      .from('akad_commitments')
      .select('agreed')
      .eq('user_id', user.id)
      .eq('batch_id', batch_id)
      .maybeSingle();

    if (!akad || !akad.agreed) {
      return NextResponse.json(
        { error: 'Please complete the akad agreement first' },
        { status: 400 }
      );
    }

    // Check partner preference exists
    const { data: partner } = await supabaseAdmin
      .from('study_partner_preferences')
      .select('partner_type')
      .eq('user_id', user.id)
      .eq('batch_id', batch_id)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json(
        { error: 'Please select your study partner preference first' },
        { status: 400 }
      );
    }

    // Check if assigned to halaqah
    const { data: halaqahAssignment } = await supabaseAdmin
      .from('halaqah_students')
      .select('halaqah_id')
      .eq('thalibah_id', user.id)
      .maybeSingle();

    if (!halaqahAssignment) {
      return NextResponse.json(
        { error: 'Please wait for admin to assign you to a halaqah' },
        { status: 400 }
      );
    }

    // Complete re-enrollment
    const { data: updatedRegistration, error: updateError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update({
        re_enrollment_completed: true,
        re_enrollment_completed_at: new Date().toISOString(),
        re_enrollment_confirmed_by: user.id // Self-confirmation for now
      })
      .eq('id', registration.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Daftar Ulang Submit] Error updating registration:', updateError);
      throw updateError;
    }

    // Update user role - add 'thalibah' to roles array
    // First get current roles
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (currentUser?.roles) {
      const currentRoles = (currentUser.roles as string[]) || [];
      if (!currentRoles.includes('thalibah')) {
        await supabaseAdmin
          .from('users')
          .update({
            roles: [...currentRoles, 'thalibah'],
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'CREATE',
      resource: 're_enrollment',
      details: {
        batch_id: batch_id,
        registration_id: registration.id,
        partner_type: partner.partner_type,
        akad_completed: true
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({
      success: true,
      data: {
        registration: updatedRegistration,
        message: 'Daftar ulang completed successfully! You are now a thalibah.'
      }
    });

  } catch (error: any) {
    console.error('[Daftar Ulang Submit] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/daftar-ulang/submit?batch_id={batch_id}
 *
 * Check daftar ulang completion status and requirements
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    if (!batchId) {
      return NextResponse.json(
        { error: 'batch_id is required' },
        { status: 400 }
      );
    }

    // Get registration status
    const { data: registration } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, selection_status, re_enrollment_completed, re_enrollment_completed_at')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .single();

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Check requirements
    const { data: schedulePreference } = await supabaseAdmin
      .from('ustadzah_preferences')
      .select('preferred_muallimah_tashih, preferred_muallimah_ujian')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .maybeSingle();

    const { data: akad } = await supabaseAdmin
      .from('akad_commitments')
      .select('agreed, signed_at')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .maybeSingle();

    const { data: partner } = await supabaseAdmin
      .from('study_partner_preferences')
      .select('partner_type, partner_status, preferred_partner_id')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .maybeSingle();

    const { data: halaqahAssignment } = await supabaseAdmin
      .from('halaqah_students')
      .select('halaqah_id, halaqah: halaqah!inner(name, program_id)')
      .eq('thalibah_id', user.id)
      .maybeSingle();

    // Calculate completion status
    const scheduleSelected = !!(schedulePreference && schedulePreference.preferred_muallimah_tashih && schedulePreference.preferred_muallimah_ujian);
    const requirements = {
      schedule_selected: scheduleSelected,
      akad_completed: !!(akad && akad.agreed),
      partner_selected: !!partner,
      halaqah_assigned: !!halaqahAssignment,
      can_submit: scheduleSelected && !!(akad && akad.agreed) && !!partner && !!halaqahAssignment
    };

    return NextResponse.json({
      success: true,
      data: {
        registration: {
          selection_status: registration.selection_status,
          re_enrollment_completed: registration.re_enrollment_completed,
          re_enrollment_completed_at: registration.re_enrollment_completed_at
        },
        requirements,
        details: {
          schedule: schedulePreference,
          akad,
          partner,
          halaqah: halaqahAssignment
        }
      }
    });

  } catch (error: any) {
    console.error('[Daftar Ulang Status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
