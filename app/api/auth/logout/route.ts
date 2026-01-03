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
    const allCookies = cookieStore.getAll();
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      redirect: '/login'
    });

    // Clear ALL cookies starting with 'sb-' (not just auth cookies)
    // This ensures we catch all variations including .0, .1, etc
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-')) {
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
