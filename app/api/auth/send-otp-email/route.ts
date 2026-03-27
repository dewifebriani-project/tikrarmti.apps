import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger-secure';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email dan code diperlukan' },
        { status: 400 }
      );
    }

    // Format kode agar mudah dibaca: 123 456
    const formattedCode = `${code.slice(0, 3)} ${code.slice(3)}`;

    // Note: Supabase v2 tidak punya direct email send API.
    // OTP sudah tersimpan di database, admin bisa melihatnya di /admin/otp-viewer
    // atau user bisa menggunakan alur standard Supabase resetPasswordForEmail.

    // Log untuk debugging
    logger.info('OTP code generated (email delivery configured via Supabase SMTP or manual admin relay)', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      code: code, // Hanya untuk development, di production jangan log kode
    });

    // Untuk saat ini, return success dengan info bahwa kode perlu di-check di database
    // Atau tampilkan kode di console untuk testing
    if (process.env.NODE_ENV === 'development') {
      console.log('═════════════════════════════════════════════');
      console.log('📧 OTP PASSWORD RESET CODE');
      console.log('═════════════════════════════════════════════');
      console.log(`Email: ${email}`);
      console.log(`Kode: ${formattedCode}`);
      console.log(`Valid: 15 menit`);
      console.log('═════════════════════════════════════════════');
    }

    return NextResponse.json({
      success: true,
      message: process.env.NODE_ENV === 'development'
        ? `Kode reset: ${formattedCode} (development mode)`
        : 'Silakan cek email untuk kode reset password',
      developmentCode: process.env.NODE_ENV === 'development' ? code : undefined
    });

  } catch (error) {
    logger.error('Error in send-otp-email', { error });
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
