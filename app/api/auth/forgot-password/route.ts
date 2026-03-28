import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    // Create Supabase client using the standard server client (SSR-compatible)
    const supabase = createClient();

    // Get dynamic origin from request headers for correct environment redirect
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const dynamicOrigin = `${protocol}://${host}`;
    
    // Standard callback URL
    const redirectUrl = `${dynamicOrigin}/auth/callback`;
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