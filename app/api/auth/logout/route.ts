import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Get the origin/hostname to determine if we're on production domain
    const host = request.headers.get('host') || '';
    const origin = request.headers.get('origin') || '';
    const isProductionDomain = host.includes('markaztikrar.id') || origin.includes('markaztikrar.id');
    const isSecure = isProductionDomain || process.env.NODE_ENV === 'production';

    // Delete authentication cookies with the EXACT same properties as when they were set
    // This is critical - domain, path, secure, sameSite must match the login cookies
    cookieStore.set({
      name: 'sb-access-token',
      value: '',
      httpOnly: true,
      secure: isSecure,
      sameSite: isProductionDomain ? 'none' : 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
      // Add domain for production to match login cookies
      ...(isProductionDomain && {
        domain: '.markaztikrar.id'
      })
    });

    cookieStore.set({
      name: 'sb-refresh-token',
      value: '',
      httpOnly: true,
      secure: isSecure,
      sameSite: isProductionDomain ? 'none' : 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
      // Add domain for production to match login cookies
      ...(isProductionDomain && {
        domain: '.markaztikrar.id'
      })
    });

    // Also clear fallback cookies
    cookieStore.set({
      name: 'sb-access-token-fallback',
      value: '',
      httpOnly: false,
      secure: isSecure,
      sameSite: isProductionDomain ? 'none' : 'lax',
      maxAge: 0,
      path: '/',
      // Add domain for production
      ...(isProductionDomain && {
        domain: '.markaztikrar.id'
      })
    });

    console.log('Logout: Server-side cookies cleared successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
