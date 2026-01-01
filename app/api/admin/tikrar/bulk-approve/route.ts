import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    console.log('=== Bulk Approve Tikrar API Started ===');

    // Use Supabase SSR client to get session
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('Auth error:', userError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Check if user is admin using admin client
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get request body
    const { ids, action, rejectionReason, applicationIds, reason } = await request.json();

    console.log('=== Bulk Approve Tikrar API Called ===');
    console.log('Request body:', {
      idsCount: ids?.length || applicationIds?.length,
      action,
      userId: user.id,
      hasApplicationIds: !!applicationIds
    });

    // Support both old format (ids) and new format (applicationIds)
    const targetIds = ids || applicationIds;
    const actualReason = rejectionReason || reason;

    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      console.error('Missing or invalid ids array');
      return NextResponse.json({ error: 'Missing or invalid ids array' }, { status: 400 });
    }

    if (!action || !['approve', 'reject', 'unapprove'].includes(action)) {
      console.error('Invalid action. Must be "approve", "reject", or "unapprove"');
      return NextResponse.json({ error: 'Invalid action. Must be "approve", "reject", or "unapprove"' }, { status: 400 });
    }

    // Prepare update data based on action
    const now = new Date().toISOString();
    let updateData: any = {
      updated_at: now
    };

    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.approved_by = userData.id;
      updateData.approved_at = now;
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.approved_by = userData.id;
      updateData.approved_at = now;
      if (actualReason) {
        updateData.rejection_reason = actualReason;
      }
    } else if (action === 'unapprove') {
      updateData.status = 'pending';
      updateData.approved_by = null;
      updateData.approved_at = null;
      // Use rejection_reason field to store unapprove reason for simplicity
      if (actualReason) {
        updateData.rejection_reason = `UNAPPROVED: ${actualReason}`;
      }
    }

    console.log('Update data:', updateData);

    // Update all applications in bulk using admin client (bypasses RLS)
    let query = supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update(updateData)
      .in('id', targetIds);

    // Only filter by status for approve/reject, not for unapprove
    if (action !== 'unapprove') {
      query = query.eq('status', 'pending'); // Only update pending applications
    }

    console.log('Executing query with updateData:', JSON.stringify(updateData, null, 2));
    console.log('Target IDs:', targetIds);
    console.log('Action:', action);

    const { error, data } = await query.select();

    console.log('Bulk update result:', {
      error: error ? { message: error.message, code: error.code, details: error.details } : null,
      updatedCount: data?.length,
      data: data ? data.slice(0, 2) : null // Show first 2 records for debugging
    });

    if (error) {
      console.error('Error bulk updating tikrar applications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Tikrar applications bulk updated successfully');
    return NextResponse.json({
      success: true,
      updatedCount: data?.length || 0,
      data
    });
  } catch (error: any) {
    console.error('Error in bulk approve tikrar API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
