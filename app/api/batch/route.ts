import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { Batch } from '@/types/database';
import { requireAdmin } from '@/lib/auth-middleware';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    // Temporarily disabled admin check for development
    // const authResult = await requireAdmin(request);
    // if (authResult instanceof NextResponse) {
    //   return authResult;
    // }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');

    const supabase = supabaseAdmin;

    let query = supabase
      .from('batches')
      .select('*');

    // Apply filters
    if (status) {
      const statusArray = status.split(',');
      query = query.in('status', statusArray);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching batches:', error);
      return NextResponse.json(
        { error: 'Failed to fetch batches' },
        { status: 500 }
      );
    }

    // Transform data to include calculated fields
    const transformedBatches = data?.map(batch => ({
      ...batch,
      duration_weeks: calculateDuration(batch.start_date, batch.end_date)
    }));

    return NextResponse.json(transformedBatches || []);
  } catch (error) {
    console.error('Error in batches GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Temporarily disabled admin check for development
    // const authResult = await requireAdmin(request);
    // if (authResult instanceof NextResponse) {
    //   return authResult;
    // }
    const body = await request.json();
    const { name, description, start_date, end_date, registration_start_date, registration_end_date } = body;

    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'name, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('batches')
      .insert({
        name,
        description,
        start_date,
        end_date,
        registration_start_date,
        registration_end_date,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating batch:', error);
      return NextResponse.json(
        { error: 'Failed to create batch' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in batches POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate duration in weeks
function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks;
}