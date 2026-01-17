import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use Supabase SSR client to get session
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Check if user is admin using admin client
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || !userData.roles?.includes('admin')) {
      console.error('Admin check failed:', dbError, userData);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const submissionId = params.id;

    // Check if submission exists and is draft
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('id, status, ujian_halaqah_id, tashih_halaqah_id')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      console.error('[Reset Halaqah] Submission not found:', submissionError);
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft submissions can be reset' },
        { status: 400 }
      );
    }

    // Reset halaqah selection (set to null), preserve other data
    const { error: updateError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .update({
        ujian_halaqah_id: null,
        tashih_halaqah_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('[Reset Halaqah] Error updating submission:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset halaqah', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[Reset Halaqah] Success, submission:', submissionId);

    return NextResponse.json({
      success: true,
      message: 'Halaqah selection reset successfully'
    });

  } catch (error) {
    console.error('[Reset Halaqah] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
