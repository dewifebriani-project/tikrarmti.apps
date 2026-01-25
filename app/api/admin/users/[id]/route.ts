import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user has related data that would prevent deletion
    const { data: registrations, error: checkError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (checkError) {
      console.error('Error checking user relations:', checkError);
      return NextResponse.json(
        { error: 'Failed to check user relations' },
        { status: 500 }
      );
    }

    // If user has registrations, use soft delete (mark as inactive)
    if (registrations && registrations.length > 0) {
      console.log(`User ${userId} has registrations, performing soft delete`);

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
          // Optional: Add a deleted_at timestamp if the column exists
          // deleted_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error performing soft delete:', updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'User deactivated successfully (soft delete)',
          softDelete: true
        },
        { status: 200 }
      );
    }

    // If no related data, perform hard delete
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: deleteError.message, details: deleteError },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in delete user API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
