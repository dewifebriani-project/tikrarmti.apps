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

    // CRITICAL: User MUST already exist in users table with complete profile
    // Following architecture: Users must register first via /auth/register before submitting program registration
    logger.info('Validating user exists and has complete profile', {
      userId: filteredBody.user_id.substring(0, 8) + '...',
      ip: clientIP
    });

    try {
      // Check if user exists in users table with all required fields
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id, full_name, negara, kota, alamat, whatsapp, zona_waktu, tanggal_lahir, tempat_lahir, pekerjaan, alasan_daftar, jenis_kelamin')
        .eq('id', filteredBody.user_id)
        .maybeSingle()

      if (checkError) {
        logger.error('Error checking user existence', {
          error: checkError.message,
          code: checkError.code,
          details: checkError.details,
          userId: filteredBody.user_id.substring(0, 8) + '...'
        })
        return ApiResponses.serverError('Failed to verify user. Please try again.')
      }

      if (!existingUser) {
        logger.warn('User not found in users table - redirecting to complete profile', {
          userId: filteredBody.user_id.substring(0, 8) + '...',
          ip: clientIP,
          authEmail: user.email
        })
        return NextResponse.json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Profil Anda belum terdaftar di database. Silakan lengkapi profil terlebih dahulu.',
            redirect: '/lengkapi-profile',
            details: {
              userId: filteredBody.user_id.substring(0, 8) + '...',
              email: user.email
            }
          }
        }, { status: 400 })
      }

      // Log user data for debugging
      logger.info('User found in database', {
        userId: existingUser.id.substring(0, 8) + '...',
        hasFullName: !!existingUser.full_name,
        hasTanggalLahir: !!existingUser.tanggal_lahir,
        hasTempatLahir: !!existingUser.tempat_lahir,
        hasPekerjaan: !!existingUser.pekerjaan,
        hasAlasanDaftar: !!existingUser.alasan_daftar,
        hasJenisKelamin: !!existingUser.jenis_kelamin,
        hasNegara: !!existingUser.negara
      })

      // Validate that user has all required fields (NOT NULL constraints)
      const requiredFields = {
        full_name: existingUser.full_name,
        tanggal_lahir: existingUser.tanggal_lahir,
        tempat_lahir: existingUser.tempat_lahir,
        pekerjaan: existingUser.pekerjaan,
        alasan_daftar: existingUser.alasan_daftar,
        jenis_kelamin: existingUser.jenis_kelamin,
        negara: existingUser.negara
      }

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([field, _]) => field)

      if (missingFields.length > 0) {
        logger.warn('User profile incomplete - missing required fields', {
          userId: filteredBody.user_id.substring(0, 8) + '...',
          missingFields,
          ip: clientIP
        })
        return NextResponse.json({
          success: false,
          error: {
            code: 'INCOMPLETE_PROFILE',
            message: `Profil Anda belum lengkap. Field yang masih kosong: ${missingFields.join(', ')}. Silakan lengkapi profil terlebih dahulu.`,
            missingFields,
            redirect: '/lengkapi-profile'
          }
        }, { status: 400 })
      }

      logger.info('User validation passed - profile is complete', {
        userId: filteredBody.user_id.substring(0, 8) + '...'
      })

    } catch (validationError) {
      logger.error('Error validating user', {
        error: validationError as Error,
        ip: clientIP,
        errorMessage: (validationError as Error).message,
        userId: filteredBody.user_id.substring(0, 8) + '...'
      })
      return ApiResponses.serverError(`Failed to validate user: ${(validationError as Error).message}. Please try again.`)
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
      logger.error('=== TIKRAR SUBMIT ERROR DETAILS ===', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        table: error.table,
        column: error.column,
        constraint: error.constraint,
        ip: clientIP,
        fullError: JSON.stringify(error, null, 2)
      });
      logger.error('Submission data that failed:', {
        submissionData: JSON.stringify(submissionData, null, 2)
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