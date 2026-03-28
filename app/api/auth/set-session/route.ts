import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger-secure';

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      );
    }

    logger.info('Setting auth session via cookies', {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Session set successfully'
    });

    // Create server client using the standard helper
    // This ensures correct cookie name 'sb-mti-session' is used
    const supabase = createClient();

    // Set session with provided tokens
    const { data: sessionData, error: sessionError } = 
      await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || '',
      });

    if (sessionError) {
      logger.error('Failed to set auth session', {
        error: sessionError.message,
      });
      return NextResponse.json(
        { error: 'Failed to set session', details: sessionError.message },
        { status: 401 }
      );
    }

    logger.info('Auth session set successfully', {
      userId: sessionData.user?.id,
      email: sessionData.user?.email,
    });

    return response;
  } catch (error: any) {
    logger.error('Error in set-session endpoint', {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
    });

    return NextResponse.json(
      { error: error.message || 'Failed to set session' },
      { status: 500 }
    );
  }
}
