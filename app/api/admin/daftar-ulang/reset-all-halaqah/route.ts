import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    console.log('[Reset All Halaqah] Starting reset, batch:', batchId);

    // Build query to find draft submissions with halaqah selection
    let query = supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('id')
      .eq('status', 'draft');

    // Only reset halaqah if it's selected (not null)
    query = query.or('ujian_halaqah_id.not.is.null,tashih_halaqah_id.not.is.null');

    if (batchId && batchId !== 'all') {
      query = query.eq('batch_id', batchId);
    }

    const { data: submissions, error: fetchError } = await query;

    if (fetchError) {
      console.error('[Reset All Halaqah] Error fetching submissions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!submissions || submissions.length === 0) {
      console.log('[Reset All Halaqah] No draft submissions with halaqah found');
      return NextResponse.json({
        success: true,
        data: { reset_count: 0 }
      });
    }

    const submissionIds = submissions.map(s => s.id);
    console.log('[Reset All Halaqah] Resetting', submissionIds.length, 'submissions');

    // Reset all halaqah selections
    const { error: updateError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .update({
        ujian_halaqah_id: null,
        tashih_halaqah_id: null,
        updated_at: new Date().toISOString()
      })
      .in('id', submissionIds);

    if (updateError) {
      console.error('[Reset All Halaqah] Error updating submissions:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset halaqah', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[Reset All Halaqah] Success, reset', submissionIds.length, 'submissions');

    return NextResponse.json({
      success: true,
      message: `Successfully reset halaqah selection for ${submissionIds.length} draft submissions`,
      data: { reset_count: submissionIds.length }
    });

  } catch (error) {
    console.error('[Reset All Halaqah] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
