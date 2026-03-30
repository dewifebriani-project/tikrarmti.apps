import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';
import { getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

const supabaseAdmin = createSupabaseAdmin();

/**
 * POST /api/pendaftaran/tikrar/re-enroll
 * 
 * Confirm re-enrollment (daftar ulang) for calon thalibah who passed selection.
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    const body = await request.json();
    const { registrationId } = body;

    if (!registrationId) {
      return ApiResponses.error('VALIDATION_ERROR', 'Registration ID is required', {}, 400);
    }

    // Get the registration details using admin client
    const { data: registration, error: regError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('id', registrationId)
      .maybeSingle();

    if (regError) {
      logger.error('[Pendaftaran Re-enroll] Database error (GET):', { error: regError, registrationId });
      return ApiResponses.databaseError(regError);
    }

    if (!registration) return ApiResponses.notFound('Pendaftaran tidak ditemukan');

    // Verify ownership
    if (registration.user_id !== context.userId) {
      logger.warn('[Pendaftaran Re-enroll] Ownership mismatch', {
        userId: context.userId,
        registrationId,
        registrationUserId: registration.user_id
      });
      return ApiResponses.forbidden('Akses ditolak');
    }

    // Check if already re-enrolled
    if (registration.re_enrollment_completed) {
      return ApiResponses.success(registration, 'Daftar ulang sudah selesai.');
    }

    // Check eligibility
    if (registration.status !== 'approved' && registration.selection_status !== 'passed') {
      return ApiResponses.error('NOT_ELIGIBLE', 'Ukhti harus lulus seleksi sebelum daftar ulang.', {
        currentStatus: registration.status,
        selectionStatus: registration.selection_status
      }, 400);
    }

    // Update registration to mark re-enrollment as completed
    const { data: updatedRegistration, error: updateError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update({
        re_enrollment_completed: true,
        re_enrollment_completed_at: new Date().toISOString(),
        re_enrollment_confirmed_by: context.userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', registrationId)
      .select()
      .maybeSingle();

    if (updateError) {
      logger.error('[Pendaftaran Re-enroll] Database error (POST update):', { error: updateError, registrationId });
      return ApiResponses.databaseError(updateError);
    }

    logger.info('[Pendaftaran Re-enroll] Success', { registrationId, userId: context.userId });

    return ApiResponses.success(updatedRegistration, '🎉 Daftar ulang berhasil! Selamat datang, Thalibah.');

  } catch (error) {
    logger.error('[Pendaftaran Re-enroll] Unexpected error (POST):', { error: error as Error });
    return ApiResponses.handleUnknown(error);
  }
}

/**
 * GET /api/pendaftaran/tikrar/re-enroll
 * 
 * Check re-enrollment eligibility.
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registration_id');

    if (!registrationId) {
      return ApiResponses.error('VALIDATION_ERROR', 'Registration ID is required', {}, 400);
    }

    const { data: registration, error: regError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*, batch:batches(*)')
      .eq('id', registrationId)
      .maybeSingle();

    if (regError) {
      logger.error('[Pendaftaran Re-enroll] Database error (GET check):', { error: regError, registrationId });
      return ApiResponses.databaseError(regError);
    }

    if (!registration) return ApiResponses.notFound('Pendaftaran tidak ditemukan');

    if (registration.user_id !== context.userId) {
      return ApiResponses.forbidden('Akses ditolak');
    }

    const canReEnroll = registration.status === 'approved' || registration.selection_status === 'passed';
    const alreadyReEnrolled = registration.re_enrollment_completed === true;

    return ApiResponses.success({
      eligible: canReEnroll && !alreadyReEnrolled,
      alreadyReEnrolled,
      status: registration.status,
      selectionStatus: registration.selection_status,
      batch: registration.batch
    });

  } catch (error) {
    logger.error('[Pendaftaran Re-enroll] Unexpected error (GET):', { error: error as Error });
    return ApiResponses.handleUnknown(error);
  }
}
