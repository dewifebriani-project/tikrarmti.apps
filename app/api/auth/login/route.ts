import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Create Supabase client with cookie handling
    const cookieStore = cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            // Forward cookies to Supabase
            cookie: cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
          }
        }
      } as any
    );

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json({ error: 'No session created' }, { status: 500 });
    }

    // Set auth cookies for server-side use (middleware and API routes)
    cookieStore.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    cookieStore.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

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

    return NextResponse.json({
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
      }
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}