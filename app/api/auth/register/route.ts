import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { authRateLimit, getClientIP } from '@/lib/rate-limiter';
import {
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
  sanitizeAddress,
  sanitizeCity,
  sanitizeGeneric
} from '@/lib/utils/sanitize';
import { logUser } from '@/lib/logger';
import { logger } from '@/lib/logger-secure';
import { z } from 'zod';
import { ApiResponses } from '@/lib/api-responses';
import { authSchemas } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  // Get client IP once for the entire function
  const ip = getClientIP(request);

  let body: any;

  try {
    // Parse request body early so it's available in catch block
    body = await request.json();

    // Validate request body with Zod schema
    const validation = authSchemas.register.safeParse(body);
    if (!validation.success) {
      return ApiResponses.validationError(validation.error.issues);
    }

    // Update body with validated data
    body = validation.data;

    // reCAPTCHA validation - Only required if RECAPTCHA_SECRET_KEY is configured
    if (process.env.NODE_ENV === 'production' && process.env.RECAPTCHA_SECRET_KEY) {
      const recaptchaToken = body.recaptchaToken;
      if (!recaptchaToken) {
        return ApiResponses.customValidationError([{ field: 'recaptcha', message: 'reCAPTCHA verification is required', code: 'custom' }]);
      }

      const recaptchaResponse = await fetch(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET_KEY || '')}&response=${encodeURIComponent(recaptchaToken)}`,
        }
      );

      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success || recaptchaResult.score < 0.5) {
        logger.warn('reCAPTCHA verification failed', {
          ip,
          endpoint: '/api/auth/register',
          score: recaptchaResult.score
        });

        return ApiResponses.customValidationError([{ field: 'recaptcha', message: 'reCAPTCHA verification failed. Please try again.', code: 'custom' }]);
      }
    }

    // Apply rate limiting
    if (authRateLimit) {
      const { success } = await authRateLimit.limit(ip);

      if (!success) {
        // Log rate limit exceeded
        logger.warn('Rate limit exceeded', {
          ip,
          endpoint: '/api/auth/register'
        });

        return ApiResponses.rateLimit('Too many registration attempts. Please try again later.');
      }
    }

    const {
      nama_kunyah,
      email,
      password,
      full_name,
      negara,
      provinsi,
      kota,
      alamat,
      whatsapp,
      telegram,
      zona_waktu,
      tanggal_lahir,
      tempat_lahir,
      jenis_kelamin,
      pekerjaan,
      alasan_daftar,
      role = 'calon_thalibah'
    } = body;

    // Note: Validation is handled by Zod schema above

    try {
      // Sanitize all inputs
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedNamaKunyah = nama_kunyah ? sanitizeName(nama_kunyah) : null;
      const sanitizedFullName = sanitizeName(full_name);
      const sanitizedNegara = sanitizeCity(negara);
      const sanitizedProvinsi = provinsi ? sanitizeCity(provinsi) : null;
      const sanitizedKota = sanitizeCity(kota);
      const sanitizedAlamat = sanitizeAddress(alamat);

      const sanitizedWhatsApp = sanitizePhone(whatsapp, negara);
      const sanitizedTelegram = telegram ? sanitizePhone(telegram, negara) : null;

      const sanitizedZonaWaktu = sanitizeGeneric(zona_waktu, 10);

      // Note: Timezone and role validation is handled by Zod schema

      // Update body with sanitized values
      body.nama_kunyah = sanitizedNamaKunyah;
      body.email = sanitizedEmail;
      body.full_name = sanitizedFullName;
      body.negara = sanitizedNegara;
      body.provinsi = sanitizedProvinsi;
      body.kota = sanitizedKota;
      body.alamat = sanitizedAlamat;
      body.whatsapp = sanitizedWhatsApp;
      body.telegram = sanitizedTelegram;
      body.zona_waktu = sanitizedZonaWaktu;
      body.role = role;

    } catch (error: any) {
      return ApiResponses.customValidationError([{ field: 'general', message: error.message || 'Input tidak valid', code: 'custom' }]);
    }

    // Initialize Supabase clients
    const supabase = createServerClient();
    const supabaseAdmin = createSupabaseAdmin();

    // Check if email already exists in auth system using admin client
    // Note: listUsers is an admin method that bypasses RLS
    const { data: existingAuthUsers, error: authListError } = await (supabaseAdmin as any).auth.admin.listUsers();

    if (!authListError && existingAuthUsers.users) {
      const userExists = existingAuthUsers.users.some((user: any) => user.email === body.email);

      if (userExists) {
        // User exists in auth system
        return ApiResponses.conflict('Email sudah terdaftar. Silakan login.');
      }
    }

    // Check if email already exists in users table using admin client to bypass RLS
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('email, full_name, negara, provinsi, kota, alamat, whatsapp, zona_waktu, role')
      .eq('email', body.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return ApiResponses.serverError('Terjadi kesalahan saat memeriksa email');
    }

    if (existingUser) {
      // Check if user profile is incomplete
      const isProfileComplete = !!(
        existingUser.full_name &&
        existingUser.negara &&
        existingUser.kota &&
        existingUser.alamat &&
        existingUser.whatsapp &&
        existingUser.zona_waktu
      );

      if (isProfileComplete) {
        return ApiResponses.conflict('Email sudah terdaftar dan profil lengkap');
      }
    }

    let newUser;
    let authUser;

    // Create user with auto-confirmed email using admin client
    const { data: signUpData, error: signUpError } = await (supabaseAdmin as any).auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: body.full_name,
        role: body.role
      }
    });

    if (!signUpError) {
      logger.info('User created and auto-confirmed', {
        email: body.email,
        userId: signUpData.user.id,
        autoConfirmed: true
      });
    }

    if (signUpError) {
      logger.error('Sign up error', {
        email: body.email,
        errorType: signUpError.name,
        errorDetail: signUpError.message,
        errorStatus: signUpError.status,
        errorStack: signUpError.stack
      });

      // Provide more specific error messages based on the error
      let errorMessage = 'Gagal membuat akun. Silakan periksa data Ukhti.';
      let errorField = 'general';

      if (signUpError.message === 'User not allowed' || signUpError.message?.includes('already registered') || signUpError.message?.includes('already been registered')) {
        errorMessage = 'Email sudah terdaftar di sistem. Silakan login atau gunakan email lain.';
        errorField = 'email';
      } else if (signUpError.message?.includes('Password')) {
        errorMessage = 'Password tidak valid. Gunakan minimal 8 karakter.';
        errorField = 'password';
      } else if (signUpError.message?.includes('Invalid email')) {
        errorMessage = 'Format email tidak valid.';
        errorField = 'email';
      } else if (signUpError.message?.includes('A user with this email has already been registered')) {
        errorMessage = 'Email sudah terdaftar di sistem. Silakan login atau gunakan email lain.';
        errorField = 'email';
      }

      return ApiResponses.customValidationError([{ field: errorField, message: errorMessage, code: 'custom' }]);
    }

    authUser = signUpData.user;

    // Log successful user creation
    logger.info('User created successfully', {
      userId: authUser.id,
      email: body.email,
      emailConfirmed: authUser.email_confirmed_at
    });

    // Check if user was actually created and if email confirmation was sent
    if (authUser && !authUser.email_confirmed_at) {
      logger.info('Confirmation email sent', {
        userId: authUser.id,
        email: body.email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`
      });
    }

    if (existingUser) {
      // Update existing incomplete user profile using admin client to bypass RLS
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          nama_kunyah: body.nama_kunyah,
          full_name: body.full_name,
          negara: body.negara,
          provinsi: body.provinsi,
          kota: body.kota,
          alamat: body.alamat,
          whatsapp: body.whatsapp,
          telegram: body.telegram,
          zona_waktu: body.zona_waktu,
          tanggal_lahir: body.tanggal_lahir,
          tempat_lahir: body.tempat_lahir,
          jenis_kelamin: body.jenis_kelamin,
          pekerjaan: body.pekerjaan,
          alasan_daftar: body.alasan_daftar,
          role: body.role || existingUser.role,
          is_active: true,
        })
        .eq('email', body.email)
        .select('id, email, full_name, role')
        .single();

      if (updateError) {
        logger.error('Profile update error', {
          userId: authUser.id,
          email: body.email
        });

        // Clean up auth user if profile update fails
        await (supabaseAdmin as any).auth.admin.deleteUser(authUser.id);
        return ApiResponses.serverError('Gagal memperbarui data pengguna');
      }

      newUser = updatedUser;
    } else {
      // Insert new user using admin client to bypass RLS
      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            id: authUser.id, // Use auth user ID
            email: body.email,
            nama_kunyah: body.nama_kunyah,
            full_name: body.full_name,
            negara: body.negara,
            provinsi: body.provinsi,
            kota: body.kota,
            alamat: body.alamat,
            whatsapp: body.whatsapp,
            telegram: body.telegram,
            zona_waktu: body.zona_waktu,
            tanggal_lahir: body.tanggal_lahir,
            tempat_lahir: body.tempat_lahir,
            jenis_kelamin: body.jenis_kelamin,
            pekerjaan: body.pekerjaan,
            alasan_daftar: body.alasan_daftar,
            role: body.role,
            is_active: true,
          }
        ])
        .select('id, email, full_name, role')
        .single();

      if (insertError) {
        logger.error('Profile insert error', {
          userId: authUser.id,
          email: body.email,
          error: insertError
        });

        // Clean up auth user if profile insert fails
        await (supabaseAdmin as any).auth.admin.deleteUser(authUser.id);
        return ApiResponses.serverError('Gagal mendaftarkan pengguna baru');
      }

      newUser = insertedUser;
    }

    // Log registration/update
    if (existingUser) {
      logger.auth('Profile updated', newUser.id, {
        email: newUser.email,
        role: newUser.role,
        ip
      });
    } else {
      logger.auth('User registered', newUser.id, {
        email: newUser.email,
        role: newUser.role,
        ip
      });
    }

    const responseMessage = existingUser
      ? 'Profil berhasil diperbarui'
      : `🎉 Pendaftaran berhasil! *Ukhti* sudah dapat login menggunakan email dan password yang telah didaftarkan.`;

    logger.auth('Registration completed', newUser.id, {
      email: body.email,
      isUpdate: !!existingUser
    });

    const responseData = {
      requiresEmailVerification: false,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role
      }
    };

    return ApiResponses.success(responseData, responseMessage, 201);

  } catch (error) {
    logger.error('Registration error', {
      endpoint: '/api/auth/register',
      ip,
      error: error as Error
    });

    return ApiResponses.serverError('Terjadi kesalahan server. Silakan coba lagi.');
  }
}