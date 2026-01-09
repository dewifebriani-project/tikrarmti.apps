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

    // Admin check - FIXED: Use roles array instead of role string (per arsitektur.md)
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || !userData.roles?.includes('admin')) {
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
    // FIXED: Fetch oral_assessment_status instead of oral_total_score (per DATABASE_SCHEMA.md)
    let query = supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, chosen_juz, oral_assessment_status, exam_score, selection_status, exam_juz_number')
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

    // NEW SELECTION LOGIC (per user requirements):
    // 1. All who pass oral test are automatically selected (regardless of written test score)
    // 2. Oral test failers go to Pra-Tikrar (not_selected status)
    // 3. Written test is only for halaqah placement (juz adjustment)
    // 4. Juz adjustment rules (if written test score < 70):
    //    - Juz 28A/28B → Juz 29A
    //    - Juz 1A/1B or Juz 29A/29B → Juz 30A
    const idsToSelect: string[] = [];
    const idsToPraTikrar: string[] = [];
    const juzAdjustments: { id: string; original_juz: string; adjusted_juz: string; reason: string }[] = [];
    const details: any[] = [];

    for (const reg of registrations) {
      const oralStatus = reg.oral_assessment_status;
      const examScore = reg.exam_score;
      const chosenJuz = reg.chosen_juz?.toUpperCase() || '';
      const examJuzNumber = reg.exam_juz_number;

      // RULE 1: All who pass oral test are automatically SELECTED
      // (regardless of written test score)
      if (oralStatus === 'pass') {
        let finalJuz = chosenJuz;
        let adjustmentReason = null;

        // Check if juz adjustment is needed (written test score < 70)
        if (examScore !== null && examScore !== undefined && examScore < 70) {
          // Juz 28A/28B → Juz 29A
          if (chosenJuz === '28A' || chosenJuz === '28B' || chosenJuz === '28') {
            finalJuz = '29A';
            adjustmentReason = `Nilai pilihan ganda ${examScore} < 70, juz disesuaikan dari ${chosenJuz} ke ${finalJuz}`;
          }
          // Juz 1A/1B or Juz 29A/29B → Juz 30A
          else if (chosenJuz === '1A' || chosenJuz === '1B' || chosenJuz === '29A' || chosenJuz === '29B' || chosenJuz === '29' || chosenJuz === '1') {
            finalJuz = '30A';
            adjustmentReason = `Nilai pilihan ganda ${examScore} < 70, juz disesuaikan dari ${chosenJuz} ke ${finalJuz}`;
          }

          // Track adjustment
          if (adjustmentReason && finalJuz !== chosenJuz) {
            juzAdjustments.push({
              id: reg.id,
              original_juz: chosenJuz,
              adjusted_juz: finalJuz,
              reason: adjustmentReason
            });
          }
        }

        idsToSelect.push(reg.id);
        details.push({
          id: reg.id,
          chosen_juz: reg.chosen_juz,
          final_juz: finalJuz,
          oral_assessment_status: oralStatus,
          exam_score: examScore,
          final_placement: 'Tikrar Tahfidz MTI',
          reason: 'Passed oral test',
          juz_adjusted: finalJuz !== chosenJuz,
          adjustment_reason: adjustmentReason
        });
      }
      // RULE 2: All who fail oral test go to Pra-Tikrar
      else if (oralStatus === 'fail') {
        idsToPraTikrar.push(reg.id);
        details.push({
          id: reg.id,
          chosen_juz: reg.chosen_juz,
          oral_assessment_status: oralStatus,
          exam_score: examScore,
          final_placement: 'Pra-Tikrar',
          reason: 'Failed oral test - needs preparation class'
        });
      }
      // RULE 3: Pending oral assessment - skip for now
      else {
        console.log('[UpdateSelectionStatus] Skipping registration with pending oral assessment:', reg.id);
      }
    }

    // Update selected registrations to Tikrar Tahfidz MTI
    let updateError;
    let updatedSelectedCount = 0;
    let updatedPraTikrarCount = 0;

    if (idsToSelect.length > 0) {
      console.log('[UpdateSelectionStatus] Updating', idsToSelect.length, 'registrations to "selected" (Tikrar Tahfidz MTI)');
      const result = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .update({ selection_status: 'selected' })
        .in('id', idsToSelect);
      updateError = result.error;
      updatedSelectedCount = idsToSelect.length;
    }

    // Update juz adjustments separately (if any)
    if (juzAdjustments.length > 0 && !updateError) {
      console.log('[UpdateSelectionStatus] Applying juz adjustments for', juzAdjustments.length, 'registrations');
      for (const adjustment of juzAdjustments) {
        const result = await supabaseAdmin
          .from('pendaftaran_tikrar_tahfidz')
          .update({ chosen_juz: adjustment.adjusted_juz })
          .eq('id', adjustment.id);
        if (result.error) {
          console.error('[UpdateSelectionStatus] Error updating juz for registration', adjustment.id, ':', result.error);
          updateError = result.error;
        }
      }
    }

    // Update Pra-Tikrar registrations (using waitlist status to indicate Pra-Tikrar placement)
    if (idsToPraTikrar.length > 0 && !updateError) {
      console.log('[UpdateSelectionStatus] Updating', idsToPraTikrar.length, 'registrations to "waitlist" (Pra-Tikrar class)');
      const result = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .update({ selection_status: 'waitlist' })
        .in('id', idsToPraTikrar);
      updateError = result.error;
      updatedPraTikrarCount = idsToPraTikrar.length;
    }

    if (updateError) {
      console.error('[UpdateSelectionStatus] Error updating selection_status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update selection_status', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[UpdateSelectionStatus] Successfully updated:', {
      selected: updatedSelectedCount,
      pra_tikrar: updatedPraTikrarCount,
      juz_adjustments: juzAdjustments.length,
      total: updatedSelectedCount + updatedPraTikrarCount
    });

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      resource: 'selection_status',
      details: {
        batch_id: batch_id || 'all',
        selected_count: updatedSelectedCount,
        pra_tikrar_count: updatedPraTikrarCount,
        juz_adjustments_count: juzAdjustments.length,
        total_updated: updatedSelectedCount + updatedPraTikrarCount,
        juz_adjustments: juzAdjustments,
        details: details
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedSelectedCount + updatedPraTikrarCount} registrations (${updatedSelectedCount} selected, ${updatedPraTikrarCount} Pra-Tikrar${juzAdjustments.length > 0 ? `, ${juzAdjustments.length} juz adjustments` : ''})`,
      selected_count: updatedSelectedCount,
      pra_tikrar_count: updatedPraTikrarCount,
      juz_adjustments_count: juzAdjustments.length,
      juz_adjustments: juzAdjustments,
      total_updated: updatedSelectedCount + updatedPraTikrarCount,
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
