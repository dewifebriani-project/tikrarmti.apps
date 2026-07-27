import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/daftar-ulang/unapprove
 * Revert an approved daftar ulang back to submitted status
 * This cancels the approval but doesn't make the user start over.
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

    const submission_id = params.id;

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

    // Update to submitted status
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .update({
        status: 'submitted',
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
      message: `Approval for "${submission.confirmed_full_name}" has been reverted to submitted.`,
      data: updated
    });

  } catch (error: any) {
    console.error('[Revert Daftar Ulang] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
