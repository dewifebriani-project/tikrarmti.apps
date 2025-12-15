import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Get request headers
    const userAgent = request.headers.get('user-agent') || '';

    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

    // Check auth cookies
    const accessToken = allCookies.find(c => c.name === 'sb-access-token');
    const refreshToken = allCookies.find(c => c.name === 'sb-refresh-token');
    const accessTokenFallback = allCookies.find(c => c.name === 'sb-access-token-fallback');

    // Determine which tokens to use
    const finalAccessToken = accessToken?.value || accessTokenFallback?.value;
    const finalRefreshToken = refreshToken?.value;

    let supabaseUser = null;
    let supabaseError = null;
    let sessionData = null;

    // Try to get user with tokens
    if (finalAccessToken && finalRefreshToken) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${finalAccessToken}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

      const { data: { session }, error } = await supabase.auth.getSession();
      sessionData = session;
      supabaseError = error;

      if (!error && session?.user) {
        supabaseUser = {
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at,
          last_sign_in_at: session.user.last_sign_in_at,
        };
      }
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      device: {
        userAgent: userAgent.substring(0, 200),
        isMobile,
        isSafari,
      },
      cookies: {
        total: allCookies.length,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasAccessTokenFallback: !!accessTokenFallback,
        accessTokenPresent: !!finalAccessToken,
        refreshTokenPresent: !!finalRefreshToken,
      },
      authentication: {
        hasUser: !!supabaseUser,
        user: supabaseUser,
        error: supabaseError?.message,
        session: sessionData ? {
          hasSession: !!sessionData,
          userId: sessionData.user?.id,
          expiresAt: sessionData.expires_at,
        } : null,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
      }
    };

    console.log('Auth status debug info:', debugInfo);

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Auth status debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}