import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    console.log('=== Unapprove Tikrar API Started ===');

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
      console.log('No token found - unauthorized');
      return NextResponse.json({
        error: 'Unauthorized - No token found. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // First try to use the token directly
    let session, sessionError;

    try {
      const result = await supabase.auth.setSession({
        access_token: tokenToUse,
        refresh_token: refreshToken || ''
      });
      session = result.data.session;
      sessionError = result.error;
    } catch (e) {
      console.error('Session setting error:', e);
      sessionError = e;
    }

    // If session setting fails, try to get user from token
    if (sessionError || !session) {
      console.log('Session setting failed, trying getUser...')
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser(tokenToUse);

        if (userError || !userData.user) {
          console.error('User retrieval failed:', userError);
          return NextResponse.json({
            error: 'Unauthorized - Invalid token. Please login again.',
            needsLogin: true
          }, { status: 401 });
        }

        // Create a minimal session-like object for the user
        session = { user: userData.user };
      } catch (e) {
        console.error('User retrieval exception:', e);
        return NextResponse.json({
          error: 'Unauthorized - Token validation failed. Please login again.',
          needsLogin: true
        }, { status: 401 });
      }
    }

    const user = session.user;
    if (!user) {
      console.log('No user in session');
      return NextResponse.json({
        error: 'Unauthorized - No user found. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Check if user is admin using admin client
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get request body
    const { applicationId, reason } = await request.json();

    console.log('=== Unapprove Tikrar API Called ===');
    console.log('Request body:', { applicationId, reason, userId: user.id });

    if (!applicationId) {
      console.error('Missing application ID');
      return NextResponse.json({ error: 'Missing application ID' }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      console.error('Missing reason for unapproval');
      return NextResponse.json({ error: 'Reason for unapproval is required' }, { status: 400 });
    }

    // Prepare update data
    const updateData = {
      status: 'pending',
      approved_by: null,
      approved_at: null,
      rejection_reason: `UNAPPROVED: ${reason.trim()}`,
      updated_at: new Date().toISOString()
    };

    console.log('Update data:', updateData);

    // Update the tikrar application using admin client (bypasses RLS)
    const { error, data } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update(updateData)
      .eq('id', applicationId)
      .select();

    console.log('Unapprove result:', { error, data });

    if (error) {
      console.error('Error unapproving tikrar application:', error);
      return NextResponse.json({
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint,
          details: error.details
        }
      }, { status: 500 });
    }

    console.log('Tikrar application unapproved successfully');
    return NextResponse.json({
      success: true,
      data,
      message: 'Application unapproved successfully'
    });
  } catch (error: any) {
    console.error('Error in unapprove tikrar API:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}