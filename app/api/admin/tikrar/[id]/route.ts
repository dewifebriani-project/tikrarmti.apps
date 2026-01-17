import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const { id } = await params;

    // Use Supabase SSR client to get session
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Check if user is admin using admin client
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || !userData.roles?.includes('admin')) {
      console.error('Admin check failed:', dbError, userData);
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