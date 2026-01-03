import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = createClient();
    const cookieStore = cookies();

    // Use Supabase Auth to sign out - this clears cookies on server
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase signOut error:', error);
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      );
    }

    console.log('Logout: User signed out successfully');

    // MANUALLY clear ALL Supabase cookies to ensure they're removed
    // Supabase SSR uses cookies with these patterns:
    // - sb-<project-ref>-auth-token
    // - sb-<project-ref>-auth-token-code-verifier
    // - sb-<project-ref>-auth-refresh-token
    // - sb-<project-ref>-auth-token.0, .1, etc (chunked tokens)
    // - sb-refresh-token
    // - sb-access-token
    const allCookies = cookieStore.getAll();
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      redirect: '/login'
    });

    // Clear ALL cookies related to Supabase auth
    // This catches: sb-*, sb-refresh-token, sb-access-token, etc
    for (const cookie of allCookies) {
      const cookieName = cookie.name.toLowerCase();

      // Match any cookie starting with 'sb-' or containing supabase auth patterns
      if (
        cookieName.startsWith('sb-') ||
        cookieName === 'sb-refresh-token' ||
        cookieName === 'sb-access-token' ||
        cookieName.includes('supabase') ||
        cookieName.includes('auth-token')
      ) {
        console.log('Clearing cookie:', cookie.name);
        response.cookies.delete(cookie.name);
      }
    }

    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
