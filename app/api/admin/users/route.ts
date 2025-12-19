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
    // Try with extended fields first
    let users: any[] | null = null;
    let error: any = null;

    try {
      const result = await supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          full_name,
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
          tanggal_lahir,
          tempat_lahir,
          pekerjaan,
          alasan_daftar,
          jenis_kelamin,
          negara,
          zona_waktu,
          tikrar_registrations:pendaftaran_tikrar_tahfidz(
            id,
            batch_id,
            batch_name,
            status,
            selection_status,
            batch:batches(name, status)
          )
        `)
        .order('created_at', { ascending: false });

      users = result.data;
      error = result.error;
    } catch (err: any) {
      console.error('Error fetching users with extended fields:', err);
      error = err;
    }

    // If error due to missing columns, fallback to basic fields
    if (error && (error.message?.includes('column') || error.code === 'PGRST116')) {
      console.log('Retrying with basic fields only...');
      const { data: usersBasic, error: errorBasic } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          is_active,
          created_at,
          updated_at,
          avatar_url,
          tikrar_registrations:pendaftaran_tikrar_tahfidz(
            id,
            batch_id,
            batch_name,
            status,
            selection_status,
            batch:batches(name, status)
          )
        `)
        .order('created_at', { ascending: false });

      if (errorBasic) {
        console.error('Error fetching users with basic fields:', errorBasic);
        return NextResponse.json({
          error: 'Failed to fetch users',
          details: errorBasic.message,
          code: errorBasic.code
        }, { status: 500 });
      }

      users = usersBasic;
    } else if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
