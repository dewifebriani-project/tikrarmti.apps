// API Route: /api/pendaftaran/tikrar/re-enroll
// Confirm re-enrollment (daftar ulang) for calon thalibah who passed selection

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { registrationId } = body;

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    // Get the registration details
    const { data: registration, error: regError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('id', registrationId)
      .single();

    if (regError) {
      logger.error('Error fetching registration', { error: regError, registrationId });
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Verify this registration belongs to the authenticated user
    if (registration.user_id !== user.id) {
      logger.warn('User attempted to re-enroll for different registration', {
        userId: user.id,
        registrationId,
        registrationUserId: registration.user_id
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already re-enrolled
    if (registration.re_enrollment_completed) {
      return NextResponse.json({
        success: true,
        message: 'Already completed re-enrollment',
        data: registration
      });
    }

    // Check if status is approved (lulus seleksi)
    if (registration.status !== 'approved' && registration.selection_status !== 'passed') {
      return NextResponse.json({
        error: 'You must pass the selection process before re-enrolling',
        currentStatus: registration.status,
        selectionStatus: registration.selection_status
      }, { status: 400 });
    }

    // Update registration to mark re-enrollment as completed
    const { data: updatedRegistration, error: updateError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update({
        re_enrollment_completed: true,
        re_enrollment_completed_at: new Date().toISOString(),
        re_enrollment_confirmed_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', registrationId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating re-enrollment status', {
        error: updateError,
        registrationId,
        userId: user.id
      });
      return NextResponse.json({ error: 'Failed to complete re-enrollment' }, { status: 500 });
    }

    // The trigger will automatically update the user role to 'thalibah'

    logger.info('Re-enrollment completed successfully', {
      registrationId,
      userId: user.id,
      batchId: registration.batch_id
    });

    return NextResponse.json({
      success: true,
      message: 'Re-enrollment completed successfully! You are now a Thalibah.',
      data: updatedRegistration
    });

  } catch (error) {
    logger.error('Error in POST /api/pendaftaran/tikrar/re-enroll', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to check re-enrollment eligibility
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const registrationId = searchParams.get('registration_id');

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    // Get the registration details
    const { data: registration, error: regError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*, batch:batches(*)')
      .eq('id', registrationId)
      .single();

    if (regError) {
      logger.error('Error fetching registration', { error: regError, registrationId });
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Verify this registration belongs to the authenticated user
    if (registration.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check eligibility for re-enrollment
    const canReEnroll = registration.status === 'approved' || registration.selection_status === 'passed';
    const alreadyReEnrolled = registration.re_enrollment_completed === true;

    return NextResponse.json({
      success: true,
      eligible: canReEnroll && !alreadyReEnrolled,
      alreadyReEnrolled,
      status: registration.status,
      selectionStatus: registration.selection_status,
      batch: registration.batch
    });

  } catch (error) {
    logger.error('Error in GET /api/pendaftaran/tikrar/re-enroll', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
