import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger-secure';

// Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      logger.warn('Forgot password request without email');
      return NextResponse.json(
        { error: 'Email diperlukan' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Forgot password request with invalid email format', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      });
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

    // Validate and construct redirect URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      logger.error('Missing NEXT_PUBLIC_APP_URL environment variable');
      return NextResponse.json(
        { 
          success: true,
          message: 'Jika email terdaftar, Ukhti akan menerima link reset password'
        }
      );
    }

    if (!isValidUrl(appUrl)) {
      logger.error('Invalid NEXT_PUBLIC_APP_URL', {
        appUrl,
        nodeEnv: process.env.NODE_ENV
      });
      return NextResponse.json(
        { 
          success: true,
          message: 'Jika email terdaftar, Ukhti akan menerima link reset password'
        }
      );
    }

    const redirectUrl = `${appUrl}/auth/callback?type=recovery`;
    logger.info('Password reset attempt', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      redirectUrl,
      nodeEnv: process.env.NODE_ENV
    });

    // Generate password reset link
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      logger.error('Password reset request failed', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error: error.message,
        errorStatus: (error as any)?.status
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
      message: 'Jika email terdaftar, Ukhti akan menerima link reset password'
    });

  } catch (error) {
    logger.error('Error in forgot password', {
      error: error as Error
    });

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, Ukhti akan menerima link reset password'
    });
  }
}