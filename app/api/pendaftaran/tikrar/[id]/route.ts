import { NextResponse } from 'next/server';
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

    // Verify that the user_id in the request matches the authenticated user
    if (body.user_id !== user.id) {
      logger.warn('User ID mismatch in registration update', {
        requestUserId: body.user_id,
        sessionUserId: user.id,
        ip: clientIP
      });

      return NextResponse.json({
        error: 'Invalid user session. Please login again.'
      }, { status: 401 });
    }

    // First, check if the registration exists and belongs to the user
    const { data: existingRegistration, error: fetchError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

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

    // Check if registration is already approved - don't allow updates to approved registrations
    if (existingRegistration.status === 'approved') {
      logger.warn('Attempted to update approved registration', {
        registrationId: id,
        userId: user.id
      });

      return NextResponse.json({
        error: 'Cannot update approved registration. Please contact admin for changes.'
      }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {
      understands_commitment: body.understands_commitment ?? false,
      tried_simulation: body.tried_simulation ?? false,
      no_negotiation: body.no_negotiation ?? false,
      has_telegram: body.has_telegram ?? false,
      saved_contact: body.saved_contact ?? false,
      has_permission: body.has_permission || '',
      permission_name: body.permission_name || '',
      permission_phone: body.permission_phone || '',
      chosen_juz: body.chosen_juz || '',
      no_travel_plans: body.no_travel_plans ?? false,
      motivation: body.motivation || '',
      ready_for_team: body.ready_for_team || '',
      main_time_slot: body.main_time_slot || '',
      backup_time_slot: body.backup_time_slot || '',
      time_commitment: body.time_commitment ?? false,
      understands_program: body.understands_program ?? false,
      questions: body.questions || '',
      updated_at: new Date().toISOString()
    };

    // Perform the update
    const { data: result, error } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

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
