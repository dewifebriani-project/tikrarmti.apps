import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    // Delete authentication cookies with the EXACT same properties as when they were set
    // This is critical - domain, path, secure, sameSite must match the login cookies
    cookieStore.set({
      name: 'sb-access-token',
      value: '',
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
      // Add domain for production to match login cookies
      ...(isProduction && {
        domain: '.markaztikrar.id'
      })
    });

    cookieStore.set({
      name: 'sb-refresh-token',
      value: '',
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
      // Add domain for production to match login cookies
      ...(isProduction && {
        domain: '.markaztikrar.id'
      })
    });

    // Also clear fallback cookies
    cookieStore.set({
      name: 'sb-access-token-fallback',
      value: '',
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 0,
      path: '/',
      // Add domain for production
      ...(isProduction && {
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
