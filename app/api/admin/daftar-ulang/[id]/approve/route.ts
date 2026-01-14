import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/daftar-ulang/[id]/approve
 * Approve a daftar ulang submission and update user role to thalibah
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const supabaseAdmin = createSupabaseAdmin();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin' && !userData?.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const submissionId = params.id;

    // Get current submission
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('*, user:users!daftar_ulang_submissions_user_id_fkey(id, full_name, roles)')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.status === 'approved') {
      return NextResponse.json({ error: 'Submission already approved' }, { status: 400 });
    }

    // Update submission status to approved
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      console.error('[Approve Daftar Ulang] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update user role: remove 'calon_thalibah' and add 'thalibah'
    const userRoles = submission.user?.roles || [];
    const updatedRoles = userRoles
      .filter((r: string) => r !== 'calon_thalibah')
      .filter((r: string) => r !== 'calon_thalibah') // Remove duplicates
      .concat('thalibah');

    // Remove 'thalibah' duplicates and ensure unique
    const uniqueRoles = Array.from(new Set(updatedRoles));

    await supabaseAdmin
      .from('users')
      .update({
        roles: uniqueRoles,
        updated_at: new Date().toISOString()
      })
      .eq('id', submission.user_id);

    console.log('[Approve Daftar Ulang] Updated user roles:', {
      user_id: submission.user_id,
      old_roles: userRoles,
      new_roles: uniqueRoles
    });

    return NextResponse.json({
      success: true,
      message: `Submission for "${submission.user?.full_name}" has been approved. Role updated from calon_thalibah to thalibah.`,
      data: updated
    });

  } catch (error: any) {
    console.error('[Approve Daftar Ulang] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
