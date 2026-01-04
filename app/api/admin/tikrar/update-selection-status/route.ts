import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Admin check
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get optional batch_id filter from request body
    const body = await request.json().catch(() => ({}));
    const { batch_id } = body;

    console.log('[UpdateSelectionStatus] Starting auto-update for batch:', batch_id || 'all');

    // Build query to get registrations that need update
    let query = supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, chosen_juz, oral_total_score, written_quiz_score, selection_status')
      .eq('selection_status', 'pending')
      .eq('status', 'approved'); // Only update approved registrations

    if (batch_id) {
      query = query.eq('batch_id', batch_id);
    }

    const { data: registrations, error: fetchError } = await query;

    if (fetchError) {
      console.error('[UpdateSelectionStatus] Error fetching registrations:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch registrations', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!registrations || registrations.length === 0) {
      console.log('[UpdateSelectionStatus] No pending registrations to update');
      return NextResponse.json({
        success: true,
        message: 'No registrations to update',
        updated_count: 0
      });
    }

    console.log('[UpdateSelectionStatus] Found', registrations.length, 'pending registrations');

    // Find registrations that should be selected
    const idsToSelect: string[] = [];
    const details: any[] = [];

    for (const reg of registrations) {
      const oralScore = reg.oral_total_score;
      const writtenScore = reg.written_quiz_score;

      // Check if Juz 30 (no written quiz required)
      const isJuz30 = reg.chosen_juz?.toLowerCase().includes('30a') ||
                     reg.chosen_juz?.toLowerCase().includes('30 a') ||
                     reg.chosen_juz?.toLowerCase().includes('30b') ||
                     reg.chosen_juz?.toLowerCase().includes('30 b') ||
                     reg.chosen_juz?.toLowerCase() === '30a' ||
                     reg.chosen_juz?.toLowerCase() === '30b' ||
                     reg.chosen_juz?.toLowerCase() === '30';

      // For Juz 30: only need oral score >= 70
      // For other juz: need both oral AND written score >= 70
      const hasPassingScore = isJuz30
        ? (oralScore !== null && oralScore !== undefined && oralScore >= 70)
        : (oralScore !== null && oralScore !== undefined && oralScore >= 70 &&
           writtenScore !== null && writtenScore !== undefined && writtenScore >= 70);

      if (hasPassingScore) {
        idsToSelect.push(reg.id);
        details.push({
          id: reg.id,
          chosen_juz: reg.chosen_juz,
          oral_score: oralScore,
          written_score: writtenScore,
          is_juz30: isJuz30
        });
      }
    }

    if (idsToSelect.length === 0) {
      console.log('[UpdateSelectionStatus] No registrations meet the passing criteria');
      return NextResponse.json({
        success: true,
        message: 'No registrations meet the passing criteria',
        updated_count: 0,
        checked_count: registrations.length
      });
    }

    console.log('[UpdateSelectionStatus] Updating', idsToSelect.length, 'registrations to "selected"');

    // Batch update
    const { error: updateError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update({ selection_status: 'selected' })
      .in('id', idsToSelect);

    if (updateError) {
      console.error('[UpdateSelectionStatus] Error updating selection_status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update selection_status', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[UpdateSelectionStatus] Successfully updated', idsToSelect.length, 'registrations');

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      resource: 'selection_status',
      details: {
        batch_id: batch_id || 'all',
        updated_count: idsToSelect.length,
        updated_ids: idsToSelect
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${idsToSelect.length} registrations to "selected"`,
      updated_count: idsToSelect.length,
      checked_count: registrations.length,
      details: details
    });

  } catch (error) {
    console.error('[UpdateSelectionStatus] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
