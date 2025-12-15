import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client
    const supabase = createServerClient();

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch registration data
    const { data: registration, error } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching registration:', error);
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Check if the registration belongs to the current user
    if (registration.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(registration);

  } catch (error) {
    console.error('Error in GET /api/pendaftaran/[id]:', error);
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
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client
    const supabase = createServerClient();

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the update data from request body
    const updateData = await request.json();

    // First, verify the registration exists and belongs to the user
    const { data: existingRegistration, error: fetchError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRegistration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Check if the registration belongs to the current user
    if (existingRegistration.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if registration is already approved - prevent edits after approval
    if (existingRegistration.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot edit registration after approval' },
        { status: 400 }
      );
    }

    // Prepare update data
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // Update the registration
    const { data: updatedRegistration, error } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating registration:', error);
      return NextResponse.json(
        { error: 'Failed to update registration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registration updated successfully',
      registration: updatedRegistration
    });

  } catch (error) {
    console.error('Error in PUT /api/pendaftaran/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}