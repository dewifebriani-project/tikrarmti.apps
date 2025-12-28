import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      console.error('Admin check failed:', dbError, userData);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const skipCount = searchParams.get('skipCount') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 1000);
    const offset = (page - 1) * limit;
    const batchId = searchParams.get('batchId');

    // Fetch muallimah data with admin client (bypasses RLS)
    console.log('Starting muallimah data fetch at', new Date().toISOString());

    let query = supabaseAdmin
      .from('muallimah_registrations')
      .select(`
        *,
        user:users!muallimah_registrations_user_id_fkey(full_name, email),
        batch:batches(name)
      `)
      .order('submitted_at', { ascending: false });

    // Filter by batch if specified
    if (batchId && batchId !== 'all') {
      query = query.eq('batch_id', batchId);
    }

    // Only apply range if NOT skipping count
    if (!skipCount) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    console.log('Muallimah query completed at', new Date().toISOString());
    console.log('Data length:', data?.length || 0);

    if (error) {
      console.error('Error fetching muallimah data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let totalCount = data?.length || 0;
    if (!skipCount) {
      let countQuery = supabaseAdmin
        .from('muallimah_registrations')
        .select('*', { count: 'estimated', head: true });

      if (batchId && batchId !== 'all') {
        countQuery = countQuery.eq('batch_id', batchId);
      }

      const { count } = await countQuery;
      totalCount = count || 0;
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
