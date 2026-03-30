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
      .select('roles')
      .eq('id', user.id)
      .single();

    if (!userData?.roles?.includes('admin')) {
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

    // Ensure user has 'thalibah' role and legacy roles are removed
    const userRoles = submission.user?.roles || [];
    const uniqueRoles = Array.from(new Set(
      userRoles
        .filter((r: string) => !['calon_thalibah', 'muallimah', 'musyrifah'].includes(r))
        .concat('thalibah')
    ));

    await supabaseAdmin
      .from('users')
      .update({
        roles: uniqueRoles,
        updated_at: new Date().toISOString(),
        role: 'thalibah' // Canonical single role
      })
      .eq('id', submission.user_id);

    return NextResponse.json({
      success: true,
      message: `Pendaftaran ulang "${submission.user?.full_name}" berhasil disetujui.`,
      data: updated
    });

  } catch (error: any) {
    console.error('[Approve Daftar Ulang] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
