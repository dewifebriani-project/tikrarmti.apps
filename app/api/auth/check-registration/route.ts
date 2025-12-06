import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Simple in-memory cache for registration check results
const registrationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache - increased for better performance

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = registrationCache.get(email);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    const supabase = createServerClient();

    // Check if user exists with optimized query
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        whatsapp,
        telegram,
        provinsi,
        kota,
        alamat,
        zona_waktu,
        role
      `)
      .eq('email', email)
      .maybeSingle();

  
    if (userError) {
      console.error('[API] Database error checking user:', userError);
      return NextResponse.json({
        registered: false,
        reason: 'Terjadi kesalahan saat memeriksa data user'
      });
    }

    if (!user) {
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

  
    const responseData = missingFields.length > 0 ? {
      registered: false,
      reason: `Data profil belum lengkap. Mohon lengkapi: ${missingFields.join(', ')}`,
      user
    } : {
      registered: true,
      user
    };

    // Cache the result
    registrationCache.set(email, {
      data: responseData,
      timestamp: now
    });

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('[API] Error checking user registration:', error);
    return NextResponse.json({
      registered: false,
      reason: 'Terjadi kesalahan sistem. Silakan coba lagi.'
    }, { status: 500 });
  }
}
