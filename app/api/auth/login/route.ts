import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      let errorMessage = error.message;

      // Provide more specific error messages for common issues
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'Email atau password salah. Silakan periksa kembali.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Email belum dikonfirmasi. Silakan cek inbox Anda.';
      }

      return NextResponse.json({
        error: errorMessage,
        originalError: error.message,
        type: 'auth_error'
      }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json({ error: 'No session created' }, { status: 500 });
    }

    // Check if user exists in users table, create if not
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User not found in database, create profile
      console.log('Creating user profile for authenticated user:', data.user.email);

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
          role: data.user.user_metadata?.role || 'calon_thalibah',
          password_hash: 'managed_by_auth_system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        // Still allow login even if profile creation fails
      } else {
        userData = newUser;
        console.log('User profile created successfully');
      }
    } else if (userError) {
      console.error('Database error checking user:', userError);
    }

    // Get the origin/hostname to determine if we're on production domain
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    const isProductionDomain = host.includes('markaztikrar.id') || origin.includes('markaztikrar.id');
    const isSecure = isProductionDomain || process.env.NODE_ENV === 'production';

    // Create response and set auth cookies properly
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: userData?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        role: userData?.role || data.user.user_metadata?.role || 'calon_thalibah',
        created_at: userData?.created_at,
        profile_created: !!userData,
      },
      // Include tokens for client-side auth (in addition to server-side cookies)
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      // Add user data for immediate state update
      user_data: {
        id: data.user.id,
        email: data.user.email,
        full_name: userData?.full_name || data.user.user_metadata?.full_name || '',
        role: userData?.role || data.user.user_metadata?.role || 'calon_thalibah',
        created_at: userData?.created_at,
      },
      // Add production domain info for client-side handling
      domain_info: {
        isProductionDomain,
        host,
        origin
      }
    });

    // Check if the request is from a mobile device
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

    // Enhanced cookie options for mobile and cross-domain compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: isProductionDomain ? 'none' as const : 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      // Add domain for production domains
      ...(isProductionDomain && {
        domain: '.markaztikrar.id'
      })
    };

    console.log('Setting auth cookies on response:', {
      accessToken: data.session.access_token.substring(0, 20) + '...',
      refreshToken: data.session.refresh_token.substring(0, 20) + '...',
      cookieOptions,
      environment: process.env.NODE_ENV,
      isMobile,
      isSafari,
      isProductionDomain,
      isSecure,
      host,
      origin,
      userAgent: userAgent.substring(0, 50)
    });

    // Set access token cookie
    response.cookies.set({
      name: 'sb-access-token',
      value: data.session.access_token,
      ...cookieOptions,
    });

    // Set refresh token cookie with longer expiry
    response.cookies.set({
      name: 'sb-refresh-token',
      value: data.session.refresh_token,
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // For mobile Safari or production domains, add additional non-httpOnly cookies as fallback
    if ((isMobile && isSafari) || isMobile || isProductionDomain) {
      // Set fallback cookies that client-side can access if httpOnly cookies fail
      response.cookies.set({
        name: 'sb-access-token-fallback',
        value: data.session.access_token,
        secure: isSecure,
        sameSite: isProductionDomain ? 'none' as const : 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        // Note: httpOnly is false for fallback
        // Add domain for production domains
        ...(isProductionDomain && {
          domain: '.markaztikrar.id'
        })
      });

      console.log(`Setting fallback cookies - Mobile: ${isMobile}, Production Domain: ${isProductionDomain}`);
    }

    return response;

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}