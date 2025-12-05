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
      full_name,
      provinsi,
      kota,
      alamat,
      whatsapp,
      telegram,
      zona_waktu,
      role = 'calon_thalibah'
    } = body;

    // Validation
    if (!email || !full_name || !provinsi || !kota || !alamat || !whatsapp || !zona_waktu) {
      return NextResponse.json(
        { message: 'Semua field kecuali telegram wajib diisi' },
        { status: 400 }
      );
    }

    try {
      // Sanitize all inputs
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedFullName = sanitizeName(full_name);
      const sanitizedProvinsi = sanitizeCity(provinsi);
      const sanitizedKota = sanitizeCity(kota);
      const sanitizedAlamat = sanitizeAddress(alamat);
      const sanitizedWhatsApp = sanitizePhone(whatsapp);
      const sanitizedTelegram = telegram ? sanitizePhone(telegram) : null;
      const sanitizedZonaWaktu = sanitizeGeneric(zona_waktu, 10);

      // Check timezone validity
      const validTimezones = ['WIB', 'WITA', 'WIT'];
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

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email, full_name, provinsi, kota, alamat, whatsapp, zona_waktu, role')
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
        existingUser.provinsi &&
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

    if (existingUser) {
      // Update existing incomplete user profile
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          full_name: body.full_name,
          provinsi: body.provinsi,
          kota: body.kota,
          alamat: body.alamat,
          whatsapp: body.whatsapp,
          telegram: body.telegram || null,
          zona_waktu: body.zona_waktu,
          role: body.role || existingUser.role,
          is_active: true,
        })
        .eq('email', body.email)
        .select('id, email, full_name, role')
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
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
            email: body.email,
            full_name: body.full_name,
            provinsi: body.provinsi,
            kota: body.kota,
            alamat: body.alamat,
            whatsapp: body.whatsapp,
            telegram: body.telegram || null,
            zona_waktu: body.zona_waktu,
            role: body.role,
            is_active: true,
          }
        ])
        .select('id, email, full_name, role')
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
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