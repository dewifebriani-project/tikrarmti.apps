import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { auditBatchOperation, getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

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

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');

    // Build query for batches
    let query = supabaseAdmin
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching batches:', error);
      return NextResponse.json(
        { error: 'Failed to fetch batches', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('batches')
      .select('*', { count: 'estimated', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;
    const totalCount = count || 0;

    // Get program count for each batch
    const batchIds = data?.map(b => b.id) || [];
    const programCounts = batchIds.length > 0 ? await Promise.all(
      batchIds.map(async (batchId) => {
        const { count } = await supabaseAdmin
          .from('programs')
          .select('*', { count: 'estimated', head: true })
          .eq('batch_id', batchId);
        return { batchId, count: count || 0 };
      })
    ) : [];

    // Enrich batch data with program counts
    const enrichedData = data?.map(batch => ({
      ...batch,
      program_count: programCounts.find(pc => pc.batchId === batch.id)?.count || 0,
      registered_percentage: batch.total_quota
        ? Math.round(((batch.registered_count || 0) / batch.total_quota) * 100)
        : null
    })) || [];

    // Audit log for batch list access
    await logAudit({
      userId: user.id,
      action: 'READ',
      resource: 'batches',
      details: {
        count: enrichedData.length,
        page,
        limit,
        status_filter: status || 'all'
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

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

// POST endpoint for creating/updating batches
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
    if (!body.name || !body.start_date || !body.end_date) {
      return NextResponse.json({
        error: 'Missing required fields: name, start_date, end_date'
      }, { status: 400 });
    }

    // Helper function to convert empty string to null for date fields
    const toDateOrNull = (value: any) => {
      if (value === '' || value === null || value === undefined) return null;
      return value;
    };

    // Prepare batch data
    const batchData: any = {
      name: body.name,
      description: body.description || null,
      start_date: body.start_date,
      end_date: body.end_date,
      registration_start_date: toDateOrNull(body.registration_start_date),
      registration_end_date: toDateOrNull(body.registration_end_date),
      status: body.status || 'draft',
      duration_weeks: body.duration_weeks || 13,
      program_type: body.program_type || null,
      total_quota: body.total_quota || 100,
      is_free: body.is_free ?? true,
      price: body.price || 0,

      // Timeline phase dates for perjalanan-saya (convert empty strings to null)
      selection_start_date: toDateOrNull(body.selection_start_date),
      selection_end_date: toDateOrNull(body.selection_end_date),
      selection_result_date: toDateOrNull(body.selection_result_date),
      re_enrollment_date: toDateOrNull(body.re_enrollment_date),
      opening_class_date: toDateOrNull(body.opening_class_date),
      first_week_start_date: toDateOrNull(body.first_week_start_date),
      first_week_end_date: toDateOrNull(body.first_week_end_date),
      review_week_start_date: toDateOrNull(body.review_week_start_date),
      review_week_end_date: toDateOrNull(body.review_week_end_date),
      final_exam_start_date: toDateOrNull(body.final_exam_start_date),
      final_exam_end_date: toDateOrNull(body.final_exam_end_date),
      graduation_start_date: toDateOrNull(body.graduation_start_date),
      graduation_end_date: toDateOrNull(body.graduation_end_date),
    };

    // Only include id if updating existing batch
    if (body.id) {
      batchData.id = body.id;
    } else {
      // Only set registered_count for new batches
      batchData.registered_count = 0;
    }

    // Insert or update batch
    const { data, error } = await supabaseAdmin
      .from('batches')
      .upsert(batchData)
      .select()
      .single();

    if (error) {
      console.error('Error upserting batch:', error);
      console.error('Batch data being sent:', batchData);
      console.error('Full error details:', JSON.stringify(error, null, 2));

      // Audit log for failed operation
      await logAudit({
        userId: user.id,
        action: body.id ? 'UPDATE' : 'CREATE',
        resource: 'batches',
        details: {
          batch_id: body.id,
          batch_name: body.name,
          error: error.message,
          error_details: error.details,
          error_hint: error.hint,
          error_code: error.code,
          attempted_changes: batchData
        },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        level: 'ERROR'
      });

      return NextResponse.json(
        {
          error: 'Failed to save batch',
          details: error.message,
          hint: error.hint,
          code: error.code
        },
        { status: 500 }
      );
    }

    // Audit log for successful batch create/update
    await auditBatchOperation(
      user.id,
      body.id ? 'UPDATE' : 'CREATE',
      data.id,
      data.name,
      {
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
        selection_start_date: data.selection_start_date,
        selection_end_date: data.selection_end_date,
        timeline_configured: !!(data.selection_start_date && data.selection_end_date)
      },
      request
    );

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
