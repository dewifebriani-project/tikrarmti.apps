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

    // Debug: Log raw request body
    logger.debug('Raw request body received', {
      bodyKeys: Object.keys(body),
      bodyPreview: {
        user_id: body.user_id ? body.user_id.substring(0, 8) + '...' : undefined,
        batch_id: body.batch_id,
        program_id: body.program_id,
        phone: body.phone,
        gender: body.gender,
        birth_date: body.birth_date,
        has_permission: body.has_permission
      }
    });

    // Validate request body with Zod schema
    // Use submitWithPhoneSupport because frontend sends 'phone' field, not 'wa_phone'
    const validation = pendaftaranSchemas.submitWithPhoneSupport.safeParse(body);
    if (!validation.success) {
      logger.warn('Validation failed', {
        errors: validation.error.issues,
        ip: clientIP,
        receivedBody: body
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

    // Fetch batch name for batch_name field (required by schema)
    let batchName = 'Unknown Batch';
    try {
      const { data: batch } = await supabaseAdmin
        .from('batches')
        .select('name')
        .eq('id', filteredBody.batch_id)
        .single();
      if (batch) {
        batchName = batch.name;
      }
    } catch (e) {
      logger.warn('Failed to fetch batch name', { error: e as Error });
    }

    // Fetch user's domicile and timezone from users table
    let userDomicile = '';
    let userTimezone = 'WIB';
    try {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('kota, zona_waktu')
        .eq('id', filteredBody.user_id)
        .single();
      if (userData) {
        userDomicile = userData.kota || '';
        userTimezone = userData.zona_waktu || 'WIB';
      }
    } catch (e) {
      logger.warn('Failed to fetch user data', { error: e as Error });
    }

    // Prepare submission data
    const submissionData: PendaftaranData = {
      user_id: filteredBody.user_id,
      batch_id: filteredBody.batch_id,
      program_id: filteredBody.program_id,
      batch_name: batchName, // Required by schema
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
      // ready_for_team: validate against allowed enum values
      ready_for_team: ((filteredBody.ready_for_team === 'ready' || filteredBody.ready_for_team === 'not_ready' ||
                        filteredBody.ready_for_team === 'considering' || filteredBody.ready_for_team === 'infaq')
                       ? filteredBody.ready_for_team : 'not_ready') as 'ready' | 'not_ready' | 'considering' | 'infaq',
      main_time_slot: filteredBody.main_time_slot || '',
      backup_time_slot: filteredBody.backup_time_slot || '',
      time_commitment: filteredBody.time_commitment || false,
      understands_program: filteredBody.understands_program || false,
      // Optional fields - map 'phone' from frontend to 'wa_phone' for database
      email: filteredBody.email,
      full_name: filteredBody.full_name,
      address: filteredBody.address,
      wa_phone: filteredBody.phone || filteredBody.wa_phone || '', // Use phone from frontend, fallback to wa_phone
      telegram_phone: filteredBody.telegram_phone,
      birth_date: filteredBody.birth_date,
      // NOTE: birth_place is NOT in pendaftaran_tikrar_tahfidz table - removed
      age: filteredBody.age,
      domicile: userDomicile,
      timezone: userTimezone,
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
    // Following architecture: Use Supabase auth as single truth, sync to users table
    logger.debug('Ensuring user exists in database before submission');

    try {
      // First check if user exists in users table
      // Use maybeSingle() to avoid error when no rows returned
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', filteredBody.user_id)
        .maybeSingle()

      if (existingUser) {
        logger.info('User already exists in users table', {
          userId: filteredBody.user_id.substring(0, 8) + '...'
        })
      } else {
        // User doesn't exist in users table, need to create from auth data
        logger.info('User not in users table, creating from auth data', {
          userId: filteredBody.user_id.substring(0, 8) + '...'
        })

        // Get user data from Supabase auth (single truth)
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(filteredBody.user_id)

        if (authError || !authUser?.user) {
          logger.error('Failed to get user from Supabase auth', {
            error: authError?.message,
            userId: filteredBody.user_id.substring(0, 8) + '...'
          })
          return ApiResponses.customValidationError([{
            field: 'user',
            message: 'User not found in authentication system. Please logout and login again.',
            code: 'AUTH_USER_NOT_FOUND'
          }])
        }

        const userMetadata = authUser.user.user_metadata || {}
        const userEmail = authUser.user.email

        // Create user in users table
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: filteredBody.user_id,
            email: userEmail,
            full_name: filteredBody.full_name || userMetadata.full_name || userEmail?.split('@')[0] || '',
            role: userMetadata.role || 'calon_thalibah',
            whatsapp: filteredBody.phone || userMetadata.whatsapp,
            telegram: filteredBody.telegram_phone || userMetadata.telegram,
            negara: userMetadata.negara,
            provinsi: userMetadata.provinsi,
            kota: filteredBody.domicile || userMetadata.kota,
            alamat: filteredBody.address || userMetadata.alamat,
            zona_waktu: userMetadata.zona_waktu || 'WIB',
            jenis_kelamin: userMetadata.jenis_kelamin,
            pekerjaan: userMetadata.pekerjaan,
            alasan_daftar: userMetadata.alasan_daftar,
            provider: filteredBody.provider || user.app_metadata?.provider || 'email',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          logger.error('Failed to create user in users table', {
            error: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            userId: filteredBody.user_id.substring(0, 8) + '...'
          })
          // Don't continue - return error to user
          return ApiResponses.serverError(`Failed to create user record: ${insertError.message} (Code: ${insertError.code}). Please contact support.`)
        }

        logger.info('User created successfully in users table', {
          userId: filteredBody.user_id.substring(0, 8) + '...'
        })
      }
    } catch (ensureError) {
      logger.error('Error ensuring user exists', {
        error: ensureError as Error,
        ip: clientIP,
        errorMessage: (ensureError as Error).message,
        userId: filteredBody.user_id.substring(0, 8) + '...'
      })
      // Don't continue - return error to user
      return ApiResponses.serverError(`Failed to verify user: ${(ensureError as Error).message}. Please logout and login again.`)
    }

    // Final check: verify user exists before inserting registration
    const { data: finalUserCheck } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', filteredBody.user_id)
      .maybeSingle()

    if (!finalUserCheck) {
      logger.error('User still does not exist after ensure-user process', {
        userId: filteredBody.user_id.substring(0, 8) + '...'
      })
      return ApiResponses.customValidationError([{
        field: 'user',
        message: 'User record could not be created. Please logout and login again, or contact support.',
        code: 'USER_CREATION_FAILED'
      }])
    }

    // Debug: Log data to be inserted
    logger.debug('Attempting database insert', {
      table: 'pendaftaran_tikrar_tahfidz',
      dataKeys: Object.keys(submissionData),
      dataPreview: {
        user_id: submissionData.user_id.substring(0, 8) + '...',
        batch_id: submissionData.batch_id,
        program_id: submissionData.program_id,
        wa_phone: submissionData.wa_phone,
        chosen_juz: submissionData.chosen_juz,
        has_permission: submissionData.has_permission,
        ready_for_team: submissionData.ready_for_team
      }
    });

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

      // Return detailed error for debugging
      return ApiResponses.serverError(`Database error: ${error.message} (Code: ${error.code})`);
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
      errorMessage: (error as Error).message,
      errorStack: (error as Error).stack,
      ip: clientIP
    });
    return ApiResponses.serverError((error as Error).message || 'Internal server error');
  }
}