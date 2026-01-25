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

    // Get pagination and filter parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');
    const batchId = searchParams.get('batch_id');
    const programType = searchParams.get('program_type');

    // Build query for programs with batch details
    let query = supabaseAdmin
      .from('programs')
      .select(`
        *,
        batch:batches(id, name, start_date, end_date, status)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (batchId && batchId !== 'all') {
      query = query.eq('batch_id', batchId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching programs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch programs', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination with same filters
    let countQuery = supabaseAdmin
      .from('programs')
      .select('*', { count: 'estimated', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (batchId && batchId !== 'all') {
      countQuery = countQuery.eq('batch_id', batchId);
    }

    const { count } = await countQuery;
    const totalCount = count || 0;

    // Enrich data with registration counts for each program
    const programIds = data?.map(p => p.id) || [];
    const registrationCounts = programIds.length > 0 ? await Promise.all(
      programIds.map(async (programId) => {
        // For tikrar programs, count from pendaftaran_tikrar_tahfidz
        const { count: tikrarCount } = await supabaseAdmin
          .from('pendaftaran_tikrar_tahfidz')
          .select('*', { count: 'estimated', head: true })
          .eq('program_id', programId);

        // For muallimah programs, count from muallimah_registrations
        const { count: muallimahCount } = await supabaseAdmin
          .from('muallimah_registrations')
          .select('*', { count: 'estimated', head: true })
          .eq('batch_id', data?.find(p => p.id === programId)?.batch_id);

        // For musyrifah programs, count from musyrifah_registrations
        const { count: musyrifahCount } = await supabaseAdmin
          .from('musyrifah_registrations')
          .select('*', { count: 'estimated', head: true })
          .eq('batch_id', data?.find(p => p.id === programId)?.batch_id);

        return {
          programId,
          tikrar_count: tikrarCount || 0,
          muallimah_count: muallimahCount || 0,
          musyrifah_count: musyrifahCount || 0,
          total_count: (tikrarCount || 0) + (muallimahCount || 0) + (musyrifahCount || 0)
        };
      })
    ) : [];

    // Enrich program data with registration counts
    const enrichedData = data?.map(program => {
      const counts = registrationCounts.find(rc => rc.programId === program.id);
      return {
        ...program,
        registration_count: counts?.total_count || 0,
        tikrar_count: counts?.tikrar_count || 0,
        muallimah_count: counts?.muallimah_count || 0,
        musyrifah_count: counts?.musyrifah_count || 0,
        max_students: program.max_thalibah || 30,
        enrollment_percentage: program.max_thalibah
          ? Math.round(((counts?.total_count || 0) / program.max_thalibah) * 100)
          : null
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: enrichedData,
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

// POST endpoint for creating/updating programs
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.batch_id || !body.name) {
      return NextResponse.json({
        error: 'Missing required fields: batch_id, name'
      }, { status: 400 });
    }

    // Verify batch exists
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('id')
      .eq('id', body.batch_id)
      .single();

    if (batchError || !batch) {
      return NextResponse.json({
        error: 'Batch not found'
      }, { status: 404 });
    }

    // Insert or update program
    const { data, error } = await supabaseAdmin
      .from('programs')
      .upsert({
        id: body.id,
        batch_id: body.batch_id,
        name: body.name,
        description: body.description,
        target_level: body.target_level,
        duration_weeks: body.duration_weeks || 13,
        max_thalibah: body.max_thalibah || 30,
        status: body.status || 'draft',
        is_free: body.is_free ?? true,
        price: body.price || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting program:', error);
      return NextResponse.json(
        { error: 'Failed to save program', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
