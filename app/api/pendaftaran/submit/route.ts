import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PendaftaranData } from '@/lib/pendaftaran';
import { logger } from '@/lib/logger-secure';
import { z } from 'zod';
import { ApiResponses } from '@/lib/api-responses';
import { pendaftaranSchemas } from '@/lib/schemas';
import { createServerClient } from '@/lib/supabase/server';

// Supabase admin client (service role) for database operations with admin privileges
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // Get client IP for logging
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   '127.0.0.1';

  try {
    // Simple authentication using Supabase SSR client
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.warn('Unauthorized form submission attempt', {
        ip: clientIP,
        endpoint: '/api/pendaftaran/submit',
        userError: userError?.message
      });

      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    logger.info('Starting form submission', {
      ip: clientIP,
      endpoint: '/api/pendaftaran/submit',
      userId: user.id
    });

    const body = await request.json();

    // Validate request body with Zod schema
    const validation = pendaftaranSchemas.submit.safeParse(body);
    if (!validation.success) {
      logger.warn('Validation failed', {
        errors: validation.error.issues,
        ip: clientIP
      });
      return ApiResponses.validationError(validation.error.issues);
    }

    const validatedBody = validation.data;

    // Don't log full body in production for security
    logger.debug('Received submission data', {
      userId: validatedBody.user_id ? validatedBody.user_id.substring(0, 8) + '...' : undefined,
      batchId: validatedBody.batch_id,
      programId: validatedBody.program_id
    });

    // Verify that the user_id in the request matches the authenticated user
    if (validatedBody.user_id !== user.id) {
      logger.warn('User ID mismatch in form submission', {
        requestUserId: validatedBody.user_id,
        sessionUserId: user.id,
        ip: clientIP
      });

      return ApiResponses.unauthorized('Invalid user session. Please login again.');
    }

    // Use validated body - no need for manual filtering since Zod handles validation
    const filteredBody = validatedBody;

    // Prepare submission data
    const submissionData: PendaftaranData = {
      user_id: filteredBody.user_id,
      batch_id: filteredBody.batch_id,
      program_id: filteredBody.program_id,
      understands_commitment: filteredBody.understands_commitment || false,
      tried_simulation: filteredBody.tried_simulation || false,
      no_negotiation: filteredBody.no_negotiation || false,
      has_telegram: filteredBody.has_telegram || false,
      saved_contact: filteredBody.saved_contact || false,
      has_permission: (filteredBody.has_permission as 'yes' | 'janda' | '') || '',
      permission_name: filteredBody.permission_name || '',
      permission_phone: filteredBody.permission_phone || '',
      chosen_juz: filteredBody.chosen_juz || '',
      no_travel_plans: filteredBody.no_travel_plans || false,
      motivation: filteredBody.motivation || '',
      ready_for_team: filteredBody.ready_for_team || '',
      main_time_slot: filteredBody.main_time_slot || '',
      backup_time_slot: filteredBody.backup_time_slot || '',
      time_commitment: filteredBody.time_commitment || false,
      understands_program: filteredBody.understands_program || false,
      // Optional fields
      full_name: filteredBody.full_name,
      address: filteredBody.address,
      wa_phone: filteredBody.phone, // Map phone to wa_phone
      telegram_phone: filteredBody.telegram_phone,
      birth_date: filteredBody.birth_date,
      birth_place: filteredBody.birth_place,
      questions: filteredBody.questions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending',
      selection_status: 'pending',
      submission_date: new Date().toISOString()
    };

    logger.debug('Prepared submission data', {
      userId: filteredBody.user_id ? filteredBody.user_id.substring(0, 8) + '...' : undefined,
      batchId: filteredBody.batch_id,
      programId: filteredBody.program_id
    });

    // CRITICAL: Always ensure user exists before submitting form
    logger.debug('Ensuring user exists in database before submission');

    try {
      const ensureResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/ensure-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: filteredBody.user_id,
          email: filteredBody.email || '',
          full_name: filteredBody.full_name || '',
          provider: filteredBody.provider || 'unknown'
        })
      });

      if (ensureResponse.ok) {
        const ensureResult = await ensureResponse.json();
        logger.debug('User ensure result', {
          success: ensureResult.success || false
        });
      } else {
        logger.warn('Failed to ensure user exists', {
          status: ensureResponse.status,
          ip: clientIP
        });
        // Continue anyway - the insert will fail if user truly doesn't exist
      }
    } catch (ensureError) {
      logger.warn('Error ensuring user', {
        error: ensureError as Error,
        ip: clientIP
      });
      // Continue anyway - user might already exist
    }

    const { data: result, error } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      logger.error('Error inserting registration', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        ip: clientIP
      });

      // If it's a foreign key constraint error, provide more helpful message
      if (error.code === '23503' || error.message.includes('foreign key constraint')) {
        return ApiResponses.customValidationError([{
          field: 'user',
          message: 'User authentication error. Please try logging out and logging back in, then submit the form again.',
          code: 'FOREIGN_KEY_VIOLATION'
        }]);
      }

      // Check if table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return ApiResponses.serverError('Database configuration error. The registration table does not exist.');
      }

      return ApiResponses.serverError('Failed to submit registration');
    }

    logger.info('Registration submitted successfully', {
      registrationId: result.id,
      ip: clientIP
    });

    return ApiResponses.success({
      id: result.id
    }, 'Registration submitted successfully');

  } catch (error) {
    logger.error('Unhandled error in submit registration API', {
      error: error as Error,
      ip: clientIP
    });
    return ApiResponses.serverError('Internal server error');
  }
}