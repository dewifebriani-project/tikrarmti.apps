import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';

/**
 * POST /api/admin/daftar-ulang/revert
 * Revert a submitted daftar ulang back to draft status
 * This allows thalibah to re-select halaqah if needed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const supabaseAdmin = createSupabaseAdmin();
    // Check if user is admin
    const authError = await requireAdmin();
    if (authError) return authError;

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

    // Update to draft status but keep halaqah
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .update({
        status: 'draft',
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
