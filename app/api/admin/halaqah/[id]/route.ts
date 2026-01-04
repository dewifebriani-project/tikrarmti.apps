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
    const { status } = body;

    // Get halaqah data for audit
    const { data: existingHalaqah } = await supabaseAdmin
      .from('halaqah')
      .select('*')
      .eq('id', params.id)
      .single();

    const { error } = await supabaseAdmin
      .from('halaqah')
      .update({ status })
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
        old_status: existingHalaqah?.status,
        new_status: status
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({
      success: true,
      message: `Status updated to ${status}`
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
      level: 'WARNING'
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
