import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

// GET /api/program - Get all programs with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Temporarily disabled admin check for development
    // const authResult = await requireAdmin(request);
    // if (authResult instanceof NextResponse) {
    //   return authResult;
    // }
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    const supabase = supabaseAdmin;

    let query = supabase
      .from('programs')
      .select(`
        *,
        batch:batches (
          id,
          name,
          description,
          start_date,
          end_date,
          status,
          registration_start_date,
          registration_end_date,
          is_free,
          price,
          total_quota,
          duration_weeks
        )
      `);

    // Apply filters
    if (batchId) {
      query = query.eq('batch_id', batchId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching programs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch programs' },
        { status: 500 }
      );
    }

    // Transform data to match frontend expectations
    // No transformation needed - return raw data so frontend can handle it
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in programs GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/program - Create new program
export async function POST(request: NextRequest) {
  try {
    // Temporarily disabled admin check for development
    // const authResult = await requireAdmin(request);
    // if (authResult instanceof NextResponse) {
    //   return authResult;
    // }
    const body = await request.json();
    const { batch_id, name, description, target_level, duration_weeks, max_thalibah } = body;

    if (!batch_id || !name) {
      return NextResponse.json(
        { error: 'batch_id and name are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('programs')
      .insert({
        batch_id,
        name,
        description,
        target_level,
        duration_weeks,
        max_thalibah,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating program:', error);
      return NextResponse.json(
        { error: 'Failed to create program' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in programs POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}