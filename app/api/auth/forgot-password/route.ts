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
    
    // Canonical origin detection:
    // 1. Prioritize environment variable if set
    // 2. Fallback to the SITE URL 'https://markaztikrar.id' (non-www) in production 
    //    to match Supabase Site URL setting exactly.
    // 3. Otherwise use the dynamic host header
    let dynamicOrigin = `${protocol}://${host}`;
    if (process.env.NODE_ENV === 'production') {
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        dynamicOrigin = process.env.NEXT_PUBLIC_SITE_URL;
      } else if (host?.includes('markaztikrar.id')) {
        // Use non-www as base for redirect to match the Site URL in Supabase
        dynamicOrigin = 'https://markaztikrar.id';
      }
    }
    
    // PHASE 4 SIMPLIFICATION:
    // We remove type=recovery and next=... from the redirectTo to see if Supabase
    // is rejecting the URL because of the query parameters.
    // If this works, we will land on the /dashboard (default) and know why it failed.
    const path = '/auth/callback';
    const redirectUrl = `${dynamicOrigin}${path}`;
    
    // Using console.error to ensure it shows up in production/local terminal logs
    console.error('[auth/forgot-password] PHASE 4 DIAGNOSTIC:', {
      constructedRedirectUrl: redirectUrl,
      rawHost: host,
      detectedProtocol: protocol,
      resolvedOrigin: dynamicOrigin,
      nodeEnv: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING'
    });

    logger.info('Password reset link requested', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      redirectUrl,
      host,
      protocol
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