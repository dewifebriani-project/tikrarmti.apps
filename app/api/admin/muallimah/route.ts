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

    // Check if user is admin - more robust check
    const { data: userRecords, error: dbError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('email', user.email);

    const userData = userRecords && userRecords.length > 0 ? userRecords[0] : null;

    if (dbError || !userData || !userData.roles?.includes('admin')) {
      // Fallback to auth metadata roles
      const authRoles = user.app_metadata?.roles || user.user_metadata?.roles || [];
      if (!authRoles.includes('admin')) {
        console.error('[Muallimah API] Admin check failed:', {
          email: user.email,
          dbError: dbError?.message,
          count: userRecords?.length || 0,
          userData
        });
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }
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

    // Since user_id references auth.users, we need to fetch user data separately
    // or use the full_name and email stored in muallimah_registrations
    let query = supabaseAdmin
      .from('muallimah_registrations')
      .select(`
        *,
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
