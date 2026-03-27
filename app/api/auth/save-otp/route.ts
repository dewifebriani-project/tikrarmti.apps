import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger-secure';

export async function POST(request: NextRequest) {
  try {
    const { email, code, expires_at } = await request.json();

    if (!email || !code || !expires_at) {
      return NextResponse.json(
        { error: 'Email, code, dan expires_at diperlukan' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Clean up old OTPs untuk email ini
    await supabase
      .from('password_reset_otps')
      .delete()
      .eq('email', email)
      .lt('expires_at', new Date().toISOString());

    // Insert new OTP
    const { error: insertError } = await supabase
      .from('password_reset_otps')
      .insert({
        email: email.toLowerCase().trim(),
        code,
        expires_at,
      });

    if (insertError) {
      logger.error('Failed to save OTP', { error: insertError.message });
      return NextResponse.json(
        { error: 'Gagal menyimpan kode OTP' },
        { status: 500 }
      );
    }

    logger.info('OTP saved for password reset', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in save-otp', { error });
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
