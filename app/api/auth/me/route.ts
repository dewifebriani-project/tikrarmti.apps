import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Get all cookies
    const allCookies = cookieStore.getAll();

    // Check specifically for auth cookies
    const accessToken = allCookies.find(c => c.name === 'sb-access-token');
    const refreshToken = allCookies.find(c => c.name === 'sb-refresh-token');

    // Check for fallback cookies (for mobile browsers)
    const accessTokenFallback = allCookies.find(c => c.name === 'sb-access-token-fallback');

    // Determine which tokens to use (prefer httpOnly, fallback to fallback cookies)
    const finalAccessToken = accessToken?.value || accessTokenFallback?.value;
    const finalRefreshToken = refreshToken?.value;

    // If we have tokens, create a Supabase client with them directly
    let supabase;
    if (finalAccessToken && finalRefreshToken) {
      // Check if token is expired
      try {
        const tokenPayload = JSON.parse(atob(finalAccessToken.split('.')[1]));
        if (Date.now() > (tokenPayload.exp * 1000)) {
          // Token is expired, but setSession will handle refresh
        }
      } catch (error) {
        // Token decode failed, but continue anyway
      }

      // Create client with both tokens
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: true,
          },
        }
      );

      // Manually set the session
      await supabase.auth.setSession({
        access_token: finalAccessToken,
        refresh_token: finalRefreshToken,
      });
    } else {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }

    // Try to get user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;

    // If session exists, use it; otherwise try getUser
    let user = session?.user;
    let userError = sessionError;

    if (!user) {
      const { data: userData, error: getUserError } = await supabase.auth.getUser();
      user = userData.user;
      userError = getUserError;
    }

    const authenticatedUser = user;
    const authError = userError;

    if (authError || !authenticatedUser) {
      // Minimal error logging for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth error:', authError?.message);
      }
      return NextResponse.json({ error: 'Invalid session', details: authError?.message }, { status: 401 });
    }

    // Fetch user data from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authenticatedUser.id)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('Database error:', dbError);
    }

    // Return user info (from database if available, otherwise from auth)
    return NextResponse.json({
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        full_name: userData?.full_name || authenticatedUser.user_metadata?.full_name || authenticatedUser.email?.split('@')[0],
        role: userData?.role || authenticatedUser.user_metadata?.role || 'calon_thalibah',
        avatar_url: userData?.avatar_url,
        created_at: userData?.created_at || authenticatedUser.created_at,
        whatsapp: userData?.whatsapp,
        telegram: userData?.telegram,
        negara: userData?.negara,
        provinsi: userData?.provinsi,
        kota: userData?.kota,
        alamat: userData?.alamat,
        zona_waktu: userData?.zona_waktu,
        tanggal_lahir: userData?.tanggal_lahir,
        tempat_lahir: userData?.tempat_lahir,
        jenis_kelamin: userData?.jenis_kelamin,
        pekerjaan: userData?.pekerjaan,
        alasan_daftar: userData?.alasan_daftar,
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}