import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authRateLimit, getClientIP } from '@/lib/rate-limiter';
import {
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
  sanitizeAddress,
  sanitizeCity,
  sanitizeGeneric
} from '@/lib/utils/sanitize';
import { logUser, logSecurity, logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Get client IP once for the entire function
  const ip = getClientIP(request);

  let body: any;

  try {
    // Parse request body early so it's available in catch block
    body = await request.json();

    // Apply rate limiting
    if (authRateLimit) {
      const { success } = await authRateLimit.limit(ip);

      if (!success) {
        // Log rate limit exceeded
        await logSecurity.rateLimitExceeded(
          ip,
          '/api/auth/register',
          request.headers.get('user-agent') || undefined
        );

        return NextResponse.json(
          { error: 'Too many registration attempts. Please try again later.' },
          { status: 429 }
        );
      }
    }

    const {
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

    // Validation - semua field wajib (kecuali provinsi untuk non-Indonesia)
    if (!email || !password || !full_name || !negara || !kota || !alamat || !whatsapp || !telegram || !zona_waktu || !tanggal_lahir || !tempat_lahir || !jenis_kelamin || !pekerjaan || !alasan_daftar) {
      return NextResponse.json(
        { message: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Validasi provinsi hanya untuk Indonesia
    if (negara === 'Indonesia' && !provinsi) {
      return NextResponse.json(
        { message: 'Provinsi wajib diisi untuk pendaftar dari Indonesia' },
        { status: 400 }
      );
    }

    try {
      // Sanitize all inputs
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedFullName = sanitizeName(full_name);
      const sanitizedNegara = sanitizeCity(negara);
      const sanitizedProvinsi = provinsi ? sanitizeCity(provinsi) : null;
      const sanitizedKota = sanitizeCity(kota);
      const sanitizedAlamat = sanitizeAddress(alamat);
      const sanitizedWhatsApp = sanitizePhone(whatsapp, negara);
      const sanitizedTelegram = telegram ? sanitizePhone(telegram, negara) : null;
      const sanitizedZonaWaktu = sanitizeGeneric(zona_waktu, 10);

      // Check timezone validity (extended for international)
      const validTimezones = [
        'WIB', 'WITA', 'WIT', // Indonesia
        'MYT', 'PHT', 'ICT', // Southeast Asia
        'IST', 'PKT', 'BST', // South Asia
        'CST', 'JST', 'KST', // East Asia
        'GMT', 'CET', 'EET', 'MSK', // Europe & Middle East
        'GST', 'TRT', // Gulf & Turkey
        'AWST', 'ACST', 'AEST', 'AEDT', 'NZST', // Australia & NZ
        'EST', 'CST', 'MST', 'PST', 'HST', 'AST' // Americas
      ];
      if (!validTimezones.includes(sanitizedZonaWaktu)) {
        return NextResponse.json(
          { message: 'Zona waktu tidak valid' },
          { status: 400 }
        );
      }

      // Check role validity
      const validRoles = ['calon_thalibah', 'thalibah', 'musyrifah', 'muallimah', 'admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { message: 'Role tidak valid' },
          { status: 400 }
        );
      }

      // Update body with sanitized values
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
      return NextResponse.json(
        { message: error.message || 'Input tidak valid' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerClient();

    // Check if email already exists in auth system using signUp check
    const { data: authCheckData, error: authCheckError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: 'dummy-password-check'
    });

    // If there's no error about invalid credentials, user might exist
    if (authCheckError && !authCheckError.message.includes('Invalid login credentials')) {
      // User exists in auth system
      return NextResponse.json(
        { message: 'Email sudah terdaftar. Silakan login.' },
        { status: 409 }
      );
    }

    // Check if email already exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email, full_name, negara, provinsi, kota, alamat, whatsapp, zona_waktu, role')
      .eq('email', body.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json(
        { message: 'Terjadi kesalahan saat memeriksa email' },
        { status: 500 }
      );
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
        return NextResponse.json(
          { message: 'Email sudah terdaftar dan profil lengkap' },
          { status: 409 }
        );
      }
    }

    let newUser;
    let authUser;

    // Create user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email for simplicity
      user_metadata: {
        full_name: body.full_name,
        role: body.role
      }
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      return NextResponse.json(
        { message: 'Gagal membuat akun: ' + signUpError.message },
        { status: 400 }
      );
    }

    authUser = signUpData.user;

    if (existingUser) {
      // Update existing incomplete user profile
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
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
        console.error('Update error:', updateError);
        // Clean up auth user if profile update fails
        await supabase.auth.admin.deleteUser(authUser.id);
        return NextResponse.json(
          { message: 'Gagal memperbarui data pengguna' },
          { status: 500 }
        );
      }

      newUser = updatedUser;
    } else {
      // Insert new user
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.id, // Use auth user ID
            email: body.email,
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
        console.error('Insert error:', insertError);
        // Clean up auth user if profile insert fails
        await supabase.auth.admin.deleteUser(authUser.id);
        return NextResponse.json(
          { message: 'Gagal mendaftarkan pengguna baru' },
          { status: 500 }
        );
      }

      newUser = insertedUser;
    }

    // Log registration/update
    if (existingUser) {
      await logUser.profileUpdate(newUser.id, body, ip);
    } else {
      await logUser.register(newUser.id, newUser.email, newUser.role, ip);
    }

    return NextResponse.json(
      {
        message: existingUser ? 'Profil berhasil diperbarui' : 'Pendaftaran berhasil',
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);

    // Log error
    await logError(error as Error, {
      endpoint: '/api/auth/register',
      ip,
      body: body // Only for debugging, remove in production
    });

    return NextResponse.json(
      { message: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}