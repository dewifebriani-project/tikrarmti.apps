import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email dan kode diperlukan' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Cari OTP yang valid
    const { data: otpData, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (otpError) {
      logger.error('OTP verification error', { error: otpError.message });
      return NextResponse.json(
        { error: 'Gagal memverifikasi kode' },
        { status: 500 }
      );
    }

    if (!otpData) {
      // Cek apakah ada OTP yang sudah kadaluarsa
      const { data: expiredOtp } = await supabase
        .from('password_reset_otps')
        .select('expires_at')
        .eq('email', email.toLowerCase().trim())
        .eq('code', code)
        .maybeSingle();

      if (expiredOtp) {
        return NextResponse.json(
          { error: 'Kode sudah kadaluarsa. Silakan minta kode baru.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Kode tidak valid' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await supabase
      .from('password_reset_otps')
      .update({ used: true })
      .eq('id', otpData.id);

    logger.info('OTP verified successfully', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
    });

    return NextResponse.json({
      success: true,
      email: email.toLowerCase().trim()
    });

  } catch (error) {
    logger.error('Error in verify-otp', { error });
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
