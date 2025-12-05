import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Program } from '@/types/database';
import { requireAdmin } from '@/lib/auth-middleware';

// GET /api/program - Get all programs with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
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
          registration_end_date
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
    const transformedPrograms = data?.map(program => ({
      ...program,
      batchInfo: program.batch ? {
        batch: program.batch.name,
        period: `${formatDate(program.batch.start_date)} - ${formatDate(program.batch.end_date)}`,
        deadline: formatDate(program.batch.registration_end_date),
        status: program.batch.status
      } : undefined
    }));

    return NextResponse.json(transformedPrograms || []);
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
    // Check if user is authenticated and is admin
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
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

// Helper function to format date
function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}