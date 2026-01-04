import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { status, ...updateData } = body;

    // Get halaqah data for audit
    const { data: existingHalaqah } = await supabaseAdmin
      .from('halaqah')
      .select('*')
      .eq('id', params.id)
      .single();

    // Prepare update data
    const dataToUpdate: any = {};

    if (status) {
      dataToUpdate.status = status;
    }

    // Add other fields if provided
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
    if (updateData.program_id !== undefined) dataToUpdate.program_id = updateData.program_id;
    if (updateData.day_of_week !== undefined) dataToUpdate.day_of_week = updateData.day_of_week;
    if (updateData.start_time !== undefined) dataToUpdate.start_time = updateData.start_time;
    if (updateData.end_time !== undefined) dataToUpdate.end_time = updateData.end_time;
    if (updateData.location !== undefined) dataToUpdate.location = updateData.location;
    if (updateData.max_students !== undefined) dataToUpdate.max_students = updateData.max_students;
    if (updateData.waitlist_max !== undefined) dataToUpdate.waitlist_max = updateData.waitlist_max;
    if (updateData.preferred_juz !== undefined) dataToUpdate.preferred_juz = updateData.preferred_juz;
    if (updateData.zoom_link !== undefined) dataToUpdate.zoom_link = updateData.zoom_link;

    const { error } = await supabaseAdmin
      .from('halaqah')
      .update(dataToUpdate)
      .eq('id', params.id);

    if (error) {
      console.error('[Halaqah API] Error updating halaqah:', error);
      return NextResponse.json(
        { error: 'Failed to update halaqah', details: error.message },
        { status: 500 }
      );
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      resource: 'halaqah',
      details: {
        halaqah_id: params.id,
        old_data: existingHalaqah,
        new_data: dataToUpdate
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({
      success: true,
      message: status ? `Status updated to ${status}` : 'Halaqah updated successfully'
    });

  } catch (error) {
    console.error('[Halaqah API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get halaqah data for audit
    const { data: existingHalaqah } = await supabaseAdmin
      .from('halaqah')
      .select('*')
      .eq('id', params.id)
      .single();

    const { error } = await supabaseAdmin
      .from('halaqah')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('[Halaqah API] Error deleting halaqah:', error);
      return NextResponse.json(
        { error: 'Failed to delete halaqah', details: error.message },
        { status: 500 }
      );
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'DELETE',
      resource: 'halaqah',
      details: {
        halaqah_id: params.id,
        halaqah_name: existingHalaqah?.name,
        program_id: existingHalaqah?.program_id
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'WARN'
    });

    return NextResponse.json({
      success: true,
      message: 'Halaqah deleted successfully'
    });

  } catch (error) {
    console.error('[Halaqah API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
