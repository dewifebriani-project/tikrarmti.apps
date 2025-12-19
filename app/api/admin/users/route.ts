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
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      console.error('Admin check failed:', dbError, userData);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all users with their Tikrar batch info using admin client (bypasses RLS)
    console.log('Fetching users...');

    // Try to fetch with relationships first
    let users;
    let fetchError;

    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          full_name,
          nama_kunyah,
          phone,
          role,
          is_active,
          created_at,
          updated_at,
          avatar_url,
          provinsi,
          kota,
          alamat,
          whatsapp,
          telegram,
          zona_waktu,
          tanggal_lahir,
          tempat_lahir,
          pekerjaan,
          alasan_daftar,
          jenis_kelamin,
          negara,
          tikrar_registrations:pendaftaran_tikrar_tahfidz!pendaftaran_tikrar_tahfidz_user_id_fkey(
            id,
            batch_id,
            batch_name,
            status,
            selection_status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching users with relationships:', error);
        fetchError = error;
      } else {
        users = data;
        console.log(`Successfully fetched ${users?.length || 0} users with relationships`);
      }
    } catch (err: any) {
      console.warn('Exception fetching users with relationships:', err);
      fetchError = err;
    }

    // If relationship fetch failed, try without relationships
    if (fetchError || !users) {
      console.log('Retrying without relationships...');
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users (fallback):', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return NextResponse.json({
          error: 'Failed to fetch users',
          details: error.message,
          code: error.code,
          hint: error.hint
        }, { status: 500 });
      }

      users = data;
      console.log(`Successfully fetched ${users?.length || 0} users (without relationships)`);
    }

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
