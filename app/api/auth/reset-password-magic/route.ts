import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger-secure';

/**
 * Password Reset with Magic Code (OTP)
 * This is more reliable than hash fragment for password reset
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email diperlukan' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.markaztikrar.id';

    // Generate OTP and send email
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${appUrl}/reset-password`,
      }
    });

    if (error) {
      logger.error('OTP password reset failed', { error: error.message });
      // Always return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, kode reset password akan dikirim'
      });
    }

    logger.info('OTP password reset sent', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
    });

    return NextResponse.json({
      success: true,
      message: 'Kode reset password telah dikirim ke email. Cek inbox Ukhti.'
    });

  } catch (error) {
    logger.error('Error in OTP password reset', { error });

    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, kode reset password akan dikirim'
    });
  }
}
