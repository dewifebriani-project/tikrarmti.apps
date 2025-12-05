import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user exists in users table with all required fields
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, whatsapp, telegram, provinsi, kota, alamat, zona_waktu, role')
      .eq('email', email)
      .maybeSingle();

    console.log('[API] User query result:', { email, found: !!user, error: userError });

    if (userError) {
      console.error('[API] Database error checking user:', userError);
      return NextResponse.json({
        registered: false,
        reason: 'Terjadi kesalahan saat memeriksa data user'
      });
    }

    if (!user) {
      console.log('[API] User not found in database');
      return NextResponse.json({
        registered: false,
        reason: 'User tidak ditemukan. Silakan registrasi terlebih dahulu.'
      });
    }

    // Check if user has admin role - admin can login without full registration
    if (user.role === 'admin') {
      if (!user.full_name) {
        return NextResponse.json({
          registered: false,
          reason: 'Nama lengkap admin belum diisi',
          user
        });
      }
      return NextResponse.json({
        registered: true,
        user
      });
    }

    // For other roles, check if all required fields from registration form are filled
    const missingFields = [];
    if (!user.full_name) missingFields.push('nama lengkap');
    if (!user.provinsi) missingFields.push('provinsi');
    if (!user.kota) missingFields.push('kota');
    if (!user.alamat) missingFields.push('alamat');
    if (!user.whatsapp) missingFields.push('nomor WhatsApp');
    if (!user.telegram) missingFields.push('nomor Telegram');
    if (!user.zona_waktu) missingFields.push('zona waktu');

    console.log('[API] Field validation:', {
      email: user.email,
      has_full_name: !!user.full_name,
      has_provinsi: !!user.provinsi,
      has_kota: !!user.kota,
      has_alamat: !!user.alamat,
      has_whatsapp: !!user.whatsapp,
      has_telegram: !!user.telegram,
      has_zona_waktu: !!user.zona_waktu,
      missing: missingFields
    });

    if (missingFields.length > 0) {
      return NextResponse.json({
        registered: false,
        reason: `Data profil belum lengkap. Mohon lengkapi: ${missingFields.join(', ')}`,
        user
      });
    }

    return NextResponse.json({
      registered: true,
      user
    });

  } catch (error: any) {
    console.error('[API] Error checking user registration:', error);
    return NextResponse.json({
      registered: false,
      reason: 'Terjadi kesalahan sistem. Silakan coba lagi.'
    }, { status: 500 });
  }
}
