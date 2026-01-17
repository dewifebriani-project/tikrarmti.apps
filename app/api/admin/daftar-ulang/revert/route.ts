import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/daftar-ulang/revert
 * Revert a submitted daftar ulang back to draft status
 * This allows thalibah to re-select halaqah if needed
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { submission_id } = body;

    if (!submission_id) {
      return NextResponse.json({ error: 'submission_id is required' }, { status: 400 });
    }

    // Get current submission
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('id, status, user_id, confirmed_full_name')
      .eq('id', submission_id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Only allow reverting from 'submitted' or 'approved' to 'draft'
    if (submission.status !== 'submitted' && submission.status !== 'approved') {
      return NextResponse.json({
        error: `Cannot revert submission with status "${submission.status}". Only "submitted" or "approved" can be reverted to "draft".`
      }, { status: 400 });
    }

    // Update to draft status and reset halaqah selection (but keep akad_files)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .update({
        status: 'draft',
        submitted_at: null,
        ujian_halaqah_id: null,
        tashih_halaqah_id: null,
        // Keep akad_files intact - thalibah doesn't need to re-upload
        updated_at: new Date().toISOString()
      })
      .eq('id', submission_id)
      .select()
      .single();

    if (updateError) {
      console.error('[Revert Daftar Ulang] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Submission for "${submission.confirmed_full_name}" has been reverted to draft. Halaqah selection has been reset. They can now re-select their halaqah (akad files preserved).`,
      data: updated
    });

  } catch (error: any) {
    console.error('[Revert Daftar Ulang] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
