import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

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

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const skipCount = searchParams.get('skipCount') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 1000); // Increased max to 1000
    const offset = (page - 1) * limit;

    // Fetch tikrar data with admin client (bypasses RLS)
    console.log('Starting tikrar data fetch at', new Date().toISOString());
    console.log('Query parameters:', { skipCount, page, limit, offset });

    // If skipCount is true, load ALL data without pagination
    let query = supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .order('submission_date', { ascending: false });

    // Only apply range if NOT skipping count (i.e., if using pagination)
    if (!skipCount) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    console.log('Query completed at', new Date().toISOString());
    console.log('Data length:', data?.length || 0);

    if (error) {
      console.error('Error fetching tikrar data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let totalCount = data?.length || 0;
    if (!skipCount) {
      console.log('Starting count query at', new Date().toISOString());
      const { count } = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .select('*', { count: 'estimated', head: true });
      totalCount = count || 0;
      console.log('Count query completed at', new Date().toISOString());
      console.log('Total count:', totalCount);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}