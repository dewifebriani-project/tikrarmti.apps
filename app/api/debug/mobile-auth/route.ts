import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Get request headers
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';

    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

    // Check auth cookies
    const authCookies = allCookies.filter(c => c.name.includes('sb-') || c.name.includes('auth'));

    // Try to validate the token with Supabase
    const accessToken = allCookies.find(c => c.name === 'sb-access-token');
    const fallbackToken = allCookies.find(c => c.name === 'sb-access-token-fallback');

    let tokenValidation: any = null;
    const tokenToValidate = accessToken?.value || fallbackToken?.value;

    if (tokenToValidate) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${tokenToValidate}`,
              },
            },
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          }
        );

        const { data: { user }, error } = await supabase.auth.getUser();

        tokenValidation = {
          isValid: !!user && !error,
          userId: user?.id,
          email: user?.email,
          error: error?.message,
          usedFallback: !accessToken && !!fallbackToken,
        };

        // Decode JWT to check expiration
        if (tokenToValidate) {
          try {
            const tokenPayload = JSON.parse(atob(tokenToValidate.split('.')[1]));
            tokenValidation.tokenExpiry = new Date(tokenPayload.exp * 1000).toISOString();
            tokenValidation.isExpired = Date.now() > (tokenPayload.exp * 1000);
          } catch (e) {
            tokenValidation.decodeError = 'Failed to decode token';
          }
        }
      } catch (error) {
        tokenValidation = {
          isValid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      device: {
        userAgent: userAgent.substring(0, 200),
        isMobile,
        isSafari,
        referer,
        origin,
        host,
      },
      cookies: {
        total: allCookies.length,
        auth: authCookies.map(c => ({
          name: c.name,
          value: c.value.substring(0, 50) + '...',
        })),
      },
      tokenValidation,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + '...',
      }
    };

    console.log('Mobile auth debug info:', debugInfo);

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}