import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    // Create Supabase client with the provided token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(access_token);

    if (error || !user) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Try to get the user from the database
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Try to refresh the session if refresh token is provided
    let sessionData = null;
    if (refresh_token) {
      try {
        const { data: session } = await supabase.auth.setSession({
          access_token: access_token,
          refresh_token: refresh_token,
        });
        sessionData = session;
      } catch (refreshError) {
        console.warn('Could not refresh session:', refreshError);
      }
    }

    // Get host and origin for domain detection
    const host = request.headers.get('host') || '';
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';

    // Enhanced production domain detection (check all possible sources)
    const isProductionDomain =
      host.includes('markaztikrar.id') ||
      origin.includes('markaztikrar.id') ||
      referer.includes('markaztikrar.id');

    // Create response
    const response = NextResponse.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: userData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
        role: userData?.role || user.user_metadata?.role || 'calon_thalibah',
        created_at: userData?.created_at || user.created_at,
      },
      session: sessionData?.session ? {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at,
      } : null,
    });

    // Set cookies as fallback for production domain
    if (isProductionDomain) {
      const isSecure = true; // Always use secure for production domain

      // Set access token cookie
      response.cookies.set({
        name: 'sb-access-token-fallback',
        value: access_token,
        httpOnly: false, // Client-side accessible for fallback
        secure: isSecure,
        sameSite: 'lax', // Use 'lax' for better mobile compatibility
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        domain: '.markaztikrar.id'
      });

      // Set refresh token cookie if available
      if (refresh_token) {
        response.cookies.set({
          name: 'sb-refresh-token-fallback',
          value: refresh_token,
          httpOnly: false, // Client-side accessible for fallback
          secure: isSecure,
          sameSite: 'lax', // Use 'lax' for better mobile compatibility
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          domain: '.markaztikrar.id'
        });
      }

      console.log('Set fallback token cookies for production domain');
    }

    return response;

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}