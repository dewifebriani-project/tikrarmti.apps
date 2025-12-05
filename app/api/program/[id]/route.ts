import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth-middleware';

// GET /api/program/[id] - Get specific program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is admin
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { id } = await params;
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        batches (
          id,
          name,
          description,
          start_date,
          end_date,
          status,
          registration_start_date,
          registration_end_date
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching program:', error);
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in program GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/program/[id] - Update program
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is admin
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { id } = await params;
    const body = await request.json();
    const { name, description, target_level, duration_weeks, max_thalibah, status } = body;

    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('programs')
      .update({
        name,
        description,
        target_level,
        duration_weeks,
        max_thalibah,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating program:', error);
      return NextResponse.json(
        { error: 'Failed to update program' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in program PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/program/[id] - Delete program
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is admin
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { id } = await params;
    const supabase = supabaseAdmin;

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting program:', error);
      return NextResponse.json(
        { error: 'Failed to delete program' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Error in program DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}