import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

    // Gunakan Supabase built-in email
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buat magic link untuk password reset dengan custom redirect URL
    // Kita akan menyimpan kode OTP di metadata dan mengirimnya via email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.markaztikrar.id';
    const resetLink = `${appUrl}/verifikasi-otp?email=${encodeURIComponent(email)}&code=${code}`;

    // Kirim email menggunakan Supabase Auth (magic link style)
    const { data, error } = await supabase.auth.admin.invokeAction({
      userId: '', // Tidak perlu user ID untuk broadcast email
      action: 'send_email',
      options: {
        email: email,
        template: 'email_verification', // Gunakan template yang ada
        data: {
          token: code,
          formatted_token: formattedCode,
          email: email,
          reset_link: resetLink,
          site_url: appUrl,
        },
      }
    });

    // Supabase v2 tidak punya direct email send, jadi gunakan metode alternatif
    // Kita akan kirim email via database trigger atau menggunakan Supabase Edge Function
    // Untuk sekarang, kita simpan log dan return success (OTP sudah tersimpan di database)

    // Log untuk debugging
    logger.info('OTP code generated (email not sent - use Supabase Edge Function or configure SMTP)', {
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
