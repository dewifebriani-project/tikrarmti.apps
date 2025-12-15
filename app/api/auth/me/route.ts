import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Debug: Log all cookies to see what we're receiving
    const allCookies = cookieStore.getAll();
    console.log('All cookies received by /api/auth/me:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));

    // Check specifically for auth cookies
    const accessToken = allCookies.find(c => c.name === 'sb-access-token');
    const refreshToken = allCookies.find(c => c.name === 'sb-refresh-token');
    console.log('Auth cookies found:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenValue: accessToken?.value?.substring(0, 20) + '...'
    });

    // If we have tokens, create a Supabase client with them directly
    let supabase;
    if (accessToken?.value && refreshToken?.value) {
      console.log('Creating Supabase client with direct tokens');

      // Debug: Decode JWT token to check expiration
      try {
        const tokenPayload = JSON.parse(atob(accessToken.value.split('.')[1]));
        console.log('Token payload decoded:', {
          exp: tokenPayload.exp,
          expDate: new Date(tokenPayload.exp * 1000).toISOString(),
          now: new Date().toISOString(),
          isExpired: Date.now() > (tokenPayload.exp * 1000),
          userId: tokenPayload.sub,
          email: tokenPayload.email
        });
      } catch (error) {
        console.error('Error decoding token:', error);
      }

      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken.value}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );
    } else {
      console.log('No auth tokens found, creating default client');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }

    // Try both getSession and getUser to debug
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;
    console.log('Supabase session result:', {
      hasSession: !!session,
      hasSessionUser: !!session?.user,
      sessionUserId: session?.user?.id,
      sessionError: sessionError?.message
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('Supabase getUser result:', {
      hasUser: !!user,
      userId: user?.id,
      error: userError?.message,
      errorCode: userError?.status
    });

    // Use session if available, otherwise fall back to getUser
    const authenticatedUser = session?.user || user;
    const authError = sessionError || userError;

    if (authError || !authenticatedUser) {
      console.error('Detailed auth error:', {
        sessionError: sessionError?.message,
        userError: userError?.message,
        sessionData: session,
        userData: user,
        cookiesPresent: allCookies.map(c => c.name),
        accessTokenLength: accessToken?.value?.length || 0
      });
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