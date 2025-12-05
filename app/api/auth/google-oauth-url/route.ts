import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get the origin from request headers
    const origin = request.headers.get('origin') || request.headers.get('referer');
    const host = request.headers.get('host');

    // Determine if we're in development or production
    const isLocalhost = host?.includes('localhost') || host?.includes('127.0.0.1') || origin?.includes('localhost');

    // Set redirect URL based on environment
    const redirectUrl = isLocalhost
      ? `http://localhost:3003/auth/callback`
      : `${origin}/auth/callback`;

    // Create Supabase client
    const supabase = createServerClient();

    // Get OAuth URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Return the OAuth URL
    return NextResponse.json({
      url: data.url,
      redirectUrl,
      isLocalhost,
      host,
      origin
    });

  } catch (error: any) {
    console.error('OAuth URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}