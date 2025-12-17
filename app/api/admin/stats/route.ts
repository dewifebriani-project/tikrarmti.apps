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
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      console.error('Admin check failed:', dbError, userData);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all stats using admin client (bypasses RLS)
    const results = await Promise.allSettled([
      supabaseAdmin.from('batches').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('programs').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('halaqah').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'thalibah'),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).in('role', ['ustadzah', 'musyrifah']),
      supabaseAdmin.from('pendaftaran').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('pendaftaran_tikrar_tahfidz').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    const [
      batchResult,
      programResult,
      halaqahResult,
      userResult,
      thalibahResult,
      mentorResult,
      pendingResult,
      tikrarPendingResult
    ] = results;

    const batchCount = batchResult.status === 'fulfilled' ? batchResult.value.count : 0;
    const programCount = programResult.status === 'fulfilled' ? programResult.value.count : 0;
    const halaqahCount = halaqahResult.status === 'fulfilled' ? halaqahResult.value.count : 0;
    const userCount = userResult.status === 'fulfilled' ? userResult.value.count : 0;
    const thalibahCount = thalibahResult.status === 'fulfilled' ? thalibahResult.value.count : 0;
    const mentorCount = mentorResult.status === 'fulfilled' ? mentorResult.value.count : 0;
    const pendingCount = pendingResult.status === 'fulfilled' ? pendingResult.value.count : 0;
    const tikrarPendingCount = tikrarPendingResult.status === 'fulfilled' ? tikrarPendingResult.value.count : 0;

    const stats = {
      totalBatches: batchCount || 0,
      totalPrograms: programCount || 0,
      totalHalaqah: halaqahCount || 0,
      totalUsers: userCount || 0,
      totalThalibah: thalibahCount || 0,
      totalMentors: mentorCount || 0,
      pendingRegistrations: pendingCount || 0,
      pendingTikrar: tikrarPendingCount || 0
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Error in admin stats API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
