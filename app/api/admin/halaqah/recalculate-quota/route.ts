import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

/**
 * POST /api/admin/halaqah/recalculate-quota
 * Recalculate student counts for all halaqah
 * This ensures quota counts are accurate after data changes
 */
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

    console.log('[Recalculate Quota] Starting quota recalculation...');

    // Get all halaqah
    const { data: halaqahList, error: halaqahError } = await supabaseAdmin
      .from('halaqah')
      .select('id');

    if (halaqahError) {
      console.error('[Recalculate Quota] Error fetching halaqah:', halaqahError);
      return NextResponse.json(
        { error: 'Failed to fetch halaqah list', details: halaqahError.message },
        { status: 500 }
      );
    }

    if (!halaqahList || halaqahList.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No halaqah found to recalculate',
        data: { recalculated: 0, results: [] }
      });
    }

    // Recalculate quota for each halaqah
    const results: Array<{
      halaqahId: string;
      activeCount: number;
      submittedCount: number;
      totalCount: number;
      maxStudents: number;
      spotsAvailable: number;
    }> = [];

    for (const halaqah of halaqahList) {
      // Count from halaqah_students - ONLY active status (waitlist does NOT reduce quota)
      const { data: activeStudents } = await supabaseAdmin
        .from('halaqah_students')
        .select('thalibah_id')
        .eq('halaqah_id', halaqah.id)
        .eq('status', 'active');

      const uniqueActiveIds = new Set(activeStudents?.map(s => s.thalibah_id) || []);

      // Count from daftar_ulang_submissions - ONLY submitted status (draft does NOT reduce quota)
      const { data: submissions } = await supabaseAdmin
        .from('daftar_ulang_submissions')
        .select('user_id')
        .eq('status', 'submitted')
        .or(`ujian_halaqah_id.eq.${halaqah.id},tashih_halaqah_id.eq.${halaqah.id}`);

      const uniqueSubmissionIds = new Set(submissions?.map(s => s.user_id) || []);

      // Combine both sets to get total unique students
      const allStudentIds = new Set<string>();

      uniqueActiveIds.forEach(id => allStudentIds.add(id));
      uniqueSubmissionIds.forEach(id => allStudentIds.add(id));

      const totalCount = allStudentIds.size;

      // Get max_students for this halaqah
      const { data: halaqahInfo } = await supabaseAdmin
        .from('halaqah')
        .select('max_students')
        .eq('id', halaqah.id)
        .single();

      const maxStudents = halaqahInfo?.max_students || 20;
      const spotsAvailable = Math.max(0, maxStudents - totalCount);

      results.push({
        halaqahId: halaqah.id,
        activeCount: uniqueActiveIds.size,
        submittedCount: uniqueSubmissionIds.size,
        totalCount,
        maxStudents,
        spotsAvailable
      });
    }

    console.log('[Recalculate Quota] Completed. Recalculated', results.length, 'halaqah');

    return NextResponse.json({
      success: true,
      message: `Successfully recalculated quota for ${results.length} halaqah`,
      data: {
        recalculated: results.length,
        results
      }
    });

  } catch (error) {
    console.error('[Recalculate Quota] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
