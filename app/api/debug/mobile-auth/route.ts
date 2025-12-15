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

    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

    // Check auth cookies
    const authCookies = allCookies.filter(c => c.name.includes('sb-') || c.name.includes('auth'));

    const debugInfo = {
      timestamp: new Date().toISOString(),
      device: {
        userAgent: userAgent.substring(0, 200),
        isMobile,
        isSafari,
        referer: referer.substring(0, 100),
        origin: origin.substring(0, 100),
      },
      cookies: {
        total: allCookies.length,
        auth: authCookies.map(c => ({
          name: c.name,
          value: c.value.substring(0, 50) + '...',
        })),
      },
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