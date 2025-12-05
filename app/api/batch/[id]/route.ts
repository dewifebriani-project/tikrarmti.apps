import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth-middleware';

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
      .from('batches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching batch:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch batch' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in batch GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { name, description, start_date, end_date, registration_start_date, registration_end_date, status } = body;

    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('batches')
      .update({
        name,
        description,
        start_date,
        end_date,
        registration_start_date,
        registration_end_date,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating batch:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update batch' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in batch PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      .from('batches')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting batch:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to delete batch' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error in batch DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}