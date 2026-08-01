import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const supabaseAdmin = createSupabaseAdmin();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (!userData?.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { submissionIds, action } = body;

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({ error: 'Invalid submissionIds' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get all selected submissions
    const { data: submissions, error: fetchError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('*, user:users!daftar_ulang_submissions_user_id_fkey(id, full_name, roles)')
      .in('id', submissionIds);

    if (fetchError || !submissions) {
      return NextResponse.json({ error: 'Submissions not found' }, { status: 404 });
    }

    const targetStatus = action === 'approve' ? 'approved' : 'rejected';

    for (const submission of submissions) {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        akad_status: targetStatus,
        partner_status: targetStatus,
        status: targetStatus
      };

      if (action === 'approve' && submission.status !== 'approved') {
        updateData.approved_at = new Date().toISOString();
      }

      // Update submission status
      const { error: updateError } = await supabaseAdmin
        .from('daftar_ulang_submissions')
        .update(updateData)
        .eq('id', submission.id);

      if (updateError) {
        console.error(`[Bulk Action] Error updating submission ${submission.id}:`, updateError);
        continue;
      }

      // If fully approved, ensure user has 'thalibah' role
      if (action === 'approve' && submission.status !== 'approved') {
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
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil ${action === 'approve' ? 'menyetujui' : 'menolak'} ${submissionIds.length} data`
    });

  } catch (error: any) {
    console.error('[Bulk Action] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
