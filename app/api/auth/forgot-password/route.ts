import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger-secure';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email diperlukan' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Generate password reset link
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      logger.error('Password reset request failed', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error: error.message
      });

      // Always return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, Ukhti akan menerima link reset password'
      });
    }

    logger.info('Password reset email sent', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
    });

    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, Anda akan menerima link reset password'
    });

  } catch (error) {
    logger.error('Error in forgot password', {
      error: error as Error
    });

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, Anda akan menerima link reset password'
    });
  }
}