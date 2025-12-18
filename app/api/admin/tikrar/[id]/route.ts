import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const { id } = await params;

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

    // Fetch single tikrar application with all details using admin client
    // Step 1: Get the basic application data first
    let { data: appData, error: appError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('id', id)
      .single();

    if (appError) {
      console.error('Error fetching application data:', appError);
      return NextResponse.json(
        {
          error: 'Failed to fetch application',
          details: appError.message
        },
        { status: 500 }
      );
    }

    // Step 2: Fetch related data separately if needed
    const data: any = { ...appData };

    // Get user data if user_id exists
    if (appData.user_id) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email, tanggal_lahir, whatsapp, telegram, alamat, kota, provinsi, zona_waktu')
        .eq('id', appData.user_id)
        .single();

      if (!userError && userData) {
        data.user = userData;
      }
    }

    // Get batch data if batch_id exists
    if (appData.batch_id) {
      const { data: batchData, error: batchError } = await supabaseAdmin
        .from('batches')
        .select('id, name, start_date, end_date')
        .eq('id', appData.batch_id)
        .single();

      if (!batchError && batchData) {
        data.batch = batchData;
      }
    }

    // Get program data if program_id exists
    if (appData.program_id) {
      const { data: programData, error: programError } = await supabaseAdmin
        .from('programs')
        .select('id, name, description')
        .eq('id', appData.program_id)
        .single();

      if (!programError && programData) {
        data.program = programData;
      }
    }

    // Get approver data if approved_by exists
    if (appData.approved_by) {
      const { data: approverData, error: approverError } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email')
        .eq('id', appData.approved_by)
        .single();

      if (!approverError && approverData) {
        data.approver = approverData;
      }
    }

    
    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}