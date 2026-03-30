import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

/**
 * PATCH /api/admin/users/[id]/role
 * Update user role(s) and status (blacklist)
 * Body: { role?: string, roles?: string[], is_blacklisted?: boolean, blacklist_reason?: string, blacklist_notes?: string }
 */
export async function PATCH(
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

    // Check if requester is admin
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role, roles')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || !userData.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { 
      role, 
      roles, 
      is_blacklisted, 
      blacklist_reason, 
      blacklist_notes,
      blacklist_at 
    } = body;

    // Validate roles array
    const validRoles = ['admin', 'thalibah'];
    if (roles) {
      const invalidRoles = roles.filter((r: string) => !validRoles.includes(r));
      if (invalidRoles.length > 0) {
        return NextResponse.json(
          { error: `Invalid roles: ${invalidRoles.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate primary role
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid primary role: ${role}` },
        { status: 400 }
      );
    }

    // Update user role(s) and status
    const updateData: any = { updated_at: new Date().toISOString() };

    if (role !== undefined) updateData.role = role;
    if (roles !== undefined) updateData.roles = roles;
    if (is_blacklisted !== undefined) updateData.is_blacklisted = is_blacklisted;
    if (blacklist_reason !== undefined) updateData.blacklist_reason = blacklist_reason;
    if (blacklist_notes !== undefined) updateData.blacklist_notes = blacklist_notes;
    if (blacklist_at !== undefined) updateData.blacklisted_at = blacklist_at;

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, full_name, role, roles, is_blacklisted, updated_at')
      .single();

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User role updated successfully'
    });

  } catch (error: any) {
    console.error('Error in update user role API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
