import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies (same as middleware)
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const accessTokenCookie = allCookies.find(c => c.name === 'sb-access-token');
    const refreshTokenCookie = allCookies.find(c => c.name === 'sb-refresh-token');
    const accessToken = accessTokenCookie?.value;
    const refreshToken = refreshTokenCookie?.value;

    // Also try to get from Authorization header as fallback
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.replace('Bearer ', '');

    const tokenToUse = accessToken || headerToken;

    if (!tokenToUse) {
      console.error('No access token found in cookies or headers');
      return NextResponse.json({
        error: 'Unauthorized - No token. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Create Supabase client and set session from cookies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Set the session using the tokens from cookies or header
    const { data: { session }, error: sessionError } = await supabase.auth.setSession({
      access_token: tokenToUse,
      refresh_token: refreshToken || ''
    });

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    const user = session.user;
    if (!user) {
      console.error('No user in session');
      return NextResponse.json({
        error: 'Unauthorized - No user. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Check if user is admin using admin client
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      console.error('Admin check failed:', userError, userData);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch tikrar data with admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        *,
        user:users(id, full_name, email),
        batch:batches(id, name),
        program:programs(id, name)
      `)
      .order('submission_date', { ascending: false });

    if (error) {
      console.error('Error fetching tikrar data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}