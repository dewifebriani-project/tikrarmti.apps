import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createSupabaseAdmin } from '@/lib/supabase';

// Create admin client
const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    console.log('=== Simple Stats API Called at', new Date().toISOString(), '===');

    // Get access token from cookies
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

    // Simple queries one by one to avoid Promise.all issues
    const stats: any = {
      totalBatches: 0,
      totalPrograms: 0,
      totalHalaqah: 0,
      totalUsers: 0,
      totalThalibah: 0,
      totalMentors: 0,
      pendingRegistrations: 0,
      pendingTikrar: 0
    };

    // Get batches count
    try {
      const { count } = await supabaseAdmin
        .from('batches')
        .select('*', { count: 'exact', head: true });
      stats.totalBatches = count || 0;
      console.log('Batches count:', count);
    } catch (e: any) {
      console.error('Error getting batches:', e.message);
    }

    // Get programs count
    try {
      const { count } = await supabaseAdmin
        .from('programs')
        .select('*', { count: 'exact', head: true });
      stats.totalPrograms = count || 0;
      console.log('Programs count:', count);
    } catch (e: any) {
      console.error('Error getting programs:', e.message);
    }

    // Get halaqah count
    try {
      const { count } = await supabaseAdmin
        .from('halaqah')
        .select('*', { count: 'exact', head: true });
      stats.totalHalaqah = count || 0;
      console.log('Halaqah count:', count);
    } catch (e: any) {
      console.error('Error getting halaqah:', e.message);
    }

    // Get users count
    try {
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });
      stats.totalUsers = count || 0;
      console.log('Users count:', count);
    } catch (e: any) {
      console.error('Error getting users:', e.message);
    }

    // Get thalibah count
    try {
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'thalibah');
      stats.totalThalibah = count || 0;
      console.log('Thalibah count:', count);
    } catch (e: any) {
      console.error('Error getting thalibah:', e.message);
    }

    // Get mentors count
    try {
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('role', ['ustadzah', 'musyrifah']);
      stats.totalMentors = count || 0;
      console.log('Mentors count:', count);
    } catch (e: any) {
      console.error('Error getting mentors:', e.message);
    }

    // Get pending registrations
    try {
      const { count } = await supabaseAdmin
        .from('pendaftaran')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      stats.pendingRegistrations = count || 0;
      console.log('Pending registrations count:', count);
    } catch (e: any) {
      console.error('Error getting pending registrations:', e.message);
    }

    // Get pending tikrar
    try {
      const { count } = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      stats.pendingTikrar = count || 0;
      console.log('Pending tikrar count:', count);
    } catch (e: any) {
      console.error('Error getting pending tikrar:', e.message);
    }

    console.log('Final stats:', stats);

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Error in simple stats API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}