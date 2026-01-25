import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger-secure';
import { createServerClient } from '@/lib/supabase/server';

// Supabase admin client (service role) for database operations with admin privileges
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get client IP for logging
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   '127.0.0.1';

  try {
    // Await params (Next.js 15+ requirement)
    const { id } = await params;

    // Simple authentication using Supabase SSR client
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.warn('Unauthorized update attempt', {
        ip: clientIP,
        endpoint: `/api/pendaftaran/tikrar/${id}`,
        userError: userError?.message
      });

      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    logger.info('Starting tikrar registration update', {
      ip: clientIP,
      endpoint: `/api/pendaftaran/tikrar/${id}`,
      userId: user.id,
      registrationId: id
    });

    const body = await request.json();

    // Check if user is admin
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.roles?.includes('admin');

    // Verify that the user_id in the request matches the authenticated user
    // Skip this check for oral submission updates (they don't need user_id in body)
    // Skip this check for admin users
    const isOralSubmissionUpdate = body.oral_submission_url !== undefined ||
                                    body.oral_submission_file_name !== undefined ||
                                    body.oral_submitted_at !== undefined;
    const isOralAssessmentUpdate = body.oral_makhraj_errors !== undefined || body.oral_sifat_errors !== undefined ||
                                    body.oral_mad_errors !== undefined || body.oral_ghunnah_errors !== undefined ||
                                    body.oral_harakat_errors !== undefined || body.oral_itmamul_harakat_errors !== undefined ||
                                    body.oral_total_score !== undefined || body.oral_assessment_status !== undefined ||
                                    body.oral_assessment_notes !== undefined;

    // For non-admin users doing regular updates (not oral submission), verify they own the registration
    // Note: user_id in body is optional, so we only check if it's provided
    if (!isAdmin && !isOralSubmissionUpdate && !isOralAssessmentUpdate) {
      // If user_id is provided in body, it must match the authenticated user
      if (body.user_id !== undefined && body.user_id !== user.id) {
        logger.warn('User ID mismatch in registration update', {
          requestUserId: body.user_id,
          sessionUserId: user.id,
          ip: clientIP
        });

        return NextResponse.json({
          error: 'Invalid user session. Please login again.'
        }, { status: 401 });
      }
      // The actual ownership check is done below (lines 91-93) by filtering the query
    }

    // First, check if the registration exists
    // For regular users, also check if it belongs to them
    let query = supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('id', id);

    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: existingRegistration, error: fetchError } = await query.single();

    if (fetchError || !existingRegistration) {
      logger.warn('Registration not found or access denied', {
        registrationId: id,
        userId: user.id,
        error: fetchError?.message
      });

      return NextResponse.json({
        error: 'Registration not found or access denied'
      }, { status: 404 });
    }

    // Check if trying to delete oral submission (null values)
    const isDeletingOralSubmission = body.oral_submission_url === null &&
                                      body.oral_submission_file_name === null &&
                                      body.oral_submitted_at === null;

    // Prevent deletion if already assessed (non-admin users only)
    if (!isAdmin && isDeletingOralSubmission) {
      const assessmentStatus = existingRegistration.oral_assessment_status;

      // Allow deletion only if status is 'pending' or 'not_submitted'
      if (assessmentStatus === 'pass' || assessmentStatus === 'fail') {
        logger.warn('Attempted to delete assessed oral submission', {
          registrationId: id,
          userId: user.id,
          assessmentStatus
        });

        return NextResponse.json({
          error: 'Rekaman sudah dinilai oleh admin. Tidak bisa dihapus.'
        }, { status: 403 });
      }
    }

    // Check if registration is already approved
    // Allow ONLY oral submission updates and oral assessment updates for approved registrations
    // Also ALLOW updating chosen_juz, main_time_slot, backup_time_slot for approved registrations
    // Admin can always update

    // Check if this is a schedule/juz update (allowed even for approved registrations)
    const isScheduleUpdate = body.chosen_juz !== undefined ||
                             body.main_time_slot !== undefined ||
                             body.backup_time_slot !== undefined;

    if (!isAdmin && existingRegistration.status === 'approved' && !isOralSubmissionUpdate && !isOralAssessmentUpdate && !isScheduleUpdate) {
      logger.warn('Attempted to update approved registration (non-allowed fields)', {
        registrationId: id,
        userId: user.id,
        fields: Object.keys(body)
      });

      return NextResponse.json({
        error: 'Cannot update approved registration. Please contact admin for changes.'
      }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};

    // If oral submission update, only update oral fields
    if (isOralSubmissionUpdate) {
      if (body.oral_submission_url !== undefined) updateData.oral_submission_url = body.oral_submission_url;
      if (body.oral_submission_file_name !== undefined) updateData.oral_submission_file_name = body.oral_submission_file_name;
      if (body.oral_submitted_at !== undefined) updateData.oral_submitted_at = body.oral_submitted_at;
      if (body.oral_assessment_status !== undefined) updateData.oral_assessment_status = body.oral_assessment_status;
      updateData.updated_at = new Date().toISOString();
    } else if (isOralAssessmentUpdate) {
      // Admin updating oral assessment
      if (body.oral_makhraj_errors !== undefined) updateData.oral_makhraj_errors = body.oral_makhraj_errors;
      if (body.oral_sifat_errors !== undefined) updateData.oral_sifat_errors = body.oral_sifat_errors;
      if (body.oral_mad_errors !== undefined) updateData.oral_mad_errors = body.oral_mad_errors;
      if (body.oral_ghunnah_errors !== undefined) updateData.oral_ghunnah_errors = body.oral_ghunnah_errors;
      if (body.oral_harakat_errors !== undefined) updateData.oral_harakat_errors = body.oral_harakat_errors;
      if (body.oral_total_score !== undefined) updateData.oral_total_score = body.oral_total_score;
      if (body.oral_assessment_status !== undefined) updateData.oral_assessment_status = body.oral_assessment_status;
      if (body.oral_assessed_by !== undefined) updateData.oral_assessed_by = body.oral_assessed_by;
      if (body.oral_assessed_at !== undefined) updateData.oral_assessed_at = body.oral_assessed_at;
      if (body.oral_assessment_notes !== undefined) updateData.oral_assessment_notes = body.oral_assessment_notes;
      if (body.selection_status !== undefined) updateData.selection_status = body.selection_status;
      updateData.updated_at = new Date().toISOString();
    } else if (isScheduleUpdate) {
      // Schedule/juz update (allowed even for approved registrations)
      if (body.chosen_juz !== undefined) updateData.chosen_juz = body.chosen_juz;
      if (body.main_time_slot !== undefined) updateData.main_time_slot = body.main_time_slot;
      if (body.backup_time_slot !== undefined) updateData.backup_time_slot = body.backup_time_slot;
      updateData.updated_at = new Date().toISOString();
    } else {
      // Regular registration update (only for non-approved registrations)
      updateData.understands_commitment = body.understands_commitment ?? false;
      updateData.tried_simulation = body.tried_simulation ?? false;
      updateData.no_negotiation = body.no_negotiation ?? false;
      updateData.has_telegram = body.has_telegram ?? false;
      updateData.saved_contact = body.saved_contact ?? false;
      updateData.has_permission = body.has_permission || '';
      updateData.permission_name = body.permission_name || '';
      updateData.permission_phone = body.permission_phone || '';
      updateData.chosen_juz = body.chosen_juz || '';
      updateData.no_travel_plans = body.no_travel_plans ?? false;
      updateData.motivation = body.motivation || '';
      updateData.ready_for_team = body.ready_for_team || '';
      updateData.main_time_slot = body.main_time_slot || '';
      updateData.backup_time_slot = body.backup_time_slot || '';
      updateData.time_commitment = body.time_commitment ?? false;
      updateData.understands_program = body.understands_program ?? false;
      updateData.questions = body.questions || '';
      updateData.updated_at = new Date().toISOString();
    }

    // Perform the update
    let updateQuery = supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update(updateData)
      .eq('id', id);

    // For regular users, also verify user_id
    if (!isAdmin) {
      updateQuery = updateQuery.eq('user_id', user.id);
    }

    const { data: result, error } = await updateQuery.select().single();

    if (error) {
      logger.error('Error updating registration', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        ip: clientIP,
        registrationId: id
      });

      return NextResponse.json({
        error: 'Failed to update registration'
      }, { status: 500 });
    }

    logger.info('Registration updated successfully', {
      registrationId: result.id,
      ip: clientIP
    });

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 200 });

  } catch (error) {
    logger.error('Unhandled error in update tikrar registration API', {
      error: error as Error,
      ip: clientIP
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  try {
    const { id } = await params;

    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (!userData || !userData.roles?.includes('admin')) {
      return NextResponse.json({
        error: 'Forbidden - Admin access required'
      }, { status: 403 });
    }

    logger.info('Starting tikrar registration deletion', {
      ip: clientIP,
      endpoint: `/api/pendaftaran/tikrar/${id}`,
      userId: user.id,
      registrationId: id
    });

    // Delete the registration
    const { error: deleteError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('Error deleting registration', {
        code: deleteError.code,
        message: deleteError.message,
        details: deleteError.details,
        ip: clientIP,
        registrationId: id
      });

      return NextResponse.json({
        error: 'Failed to delete registration'
      }, { status: 500 });
    }

    logger.info('Registration deleted successfully', {
      registrationId: id,
      ip: clientIP
    });

    return NextResponse.json({
      success: true,
      message: 'Registration deleted successfully'
    }, { status: 200 });

  } catch (error) {
    logger.error('Unhandled error in delete tikrar registration API', {
      error: error as Error,
      ip: clientIP
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
