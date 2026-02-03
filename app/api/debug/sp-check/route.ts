import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to calculate first week start from batch start_date
// First week starts 3 weeks after batch start_date
function getFirstWeekStart(batch: any): Date | null {
  const startDate = batch.start_date ? new Date(batch.start_date) : null;
  if (!startDate) return null;

  // First week starts 3 weeks after batch start_date
  const firstWeekStart = new Date(startDate);
  firstWeekStart.setDate(firstWeekStart.getDate() + (3 * 7)); // +3 weeks
  return firstWeekStart;
}

// Helper function to get current week based on batch timeline
function getCurrentWeekNumber(batch: any): number {
  const firstWeekStart = getFirstWeekStart(batch);
  const now = new Date();

  if (!firstWeekStart) return 1;

  // Calculate week difference from first week start
  const weekDiff = Math.floor((now.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

  // Week numbers are 1-based, Week 1 is the first learning week (3 weeks after batch start)
  return Math.max(1, Math.min(weekDiff + 1, 10)); // Max 10 weeks
}

// Helper function to check if week has ended (Sunday passed)
function hasWeekEnded(batch: any, weekNumber: number): boolean {
  const firstWeekStart = getFirstWeekStart(batch);
  if (!firstWeekStart) return false;

  // Calculate the end of the specified week (Sunday)
  // Week 1 = firstWeekStart to firstWeekStart + 6 days
  const weekEnd = new Date(firstWeekStart);
  weekEnd.setDate(weekEnd.getDate() + ((weekNumber - 1) * 7) + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const now = new Date();
  return now > weekEnd;
}

// Debug API to check why SP list is empty
export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Get active batch
    const { data: activeBatch } = await supabase
      .from('batches')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!activeBatch) {
      return NextResponse.json({
        success: true,
        debug: {
          batch_info: 'No active batch found',
        }
      });
    }

    // Calculate current week using batch start_date
    const now = new Date();
    const firstWeekStart = getFirstWeekStart(activeBatch);
    const currentWeek = getCurrentWeekNumber(activeBatch);

    // Check which weeks have ended
    const weeksStatus: any[] = [];
    for (let week = 1; week <= 10; week++) {
      let hasEnded = false;
      let weekEndDate = null;
      let weekStartDate = null;

      if (firstWeekStart) {
        // Week start date
        const weekStart = new Date(firstWeekStart);
        weekStart.setDate(weekStart.getDate() + ((week - 1) * 7));
        weekStartDate = weekStart.toISOString();

        // Week end date (Sunday, 6 days after week start)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        weekEndDate = weekEnd.toISOString();
        hasEnded = now > weekEnd;
      }

      weeksStatus.push({
        week,
        week_start_date: weekStartDate,
        has_ended: hasEnded,
        week_end_date: weekEndDate,
      });
    }

    // Get daftar_ulang submissions count
    const { data: daftarUlangUsers, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, status')
      .eq('batch_id', activeBatch.id);

    const statusCounts = {
      approved: 0,
      submitted: 0,
      other: 0,
    };

    daftarUlangUsers?.forEach((d: any) => {
      if (d.status === 'approved') statusCounts.approved++;
      else if (d.status === 'submitted') statusCounts.submitted++;
      else statusCounts.other++;
    });

    // Get jurnal records count
    const { data: jurnalRecords } = await supabase
      .from('jurnal_records')
      .select('user_id, id')
      .in('user_id', daftarUlangUsers?.map((d: any) => d.user_id) || []);

    // Get SP records count
    const { data: spRecords } = await supabase
      .from('surat_peringatan')
      .select('id, thalibah_id, sp_level, week_number, status')
      .eq('batch_id', activeBatch.id);

    return NextResponse.json({
      success: true,
      debug: {
        batch_info: {
          id: activeBatch.id,
          name: activeBatch.name,
          status: activeBatch.status,
          start_date: activeBatch.start_date,
          calculated_first_week_start_date: firstWeekStart?.toISOString() || null,
          // Show old fields for comparison
          old_first_week_start_date: activeBatch.first_week_start_date,
          old_first_week_end_date: activeBatch.first_week_end_date,
        },
        current_date: now.toISOString(),
        calculated_current_week: currentWeek,
        timeline_explanation: {
          note: 'First week starts 3 weeks (21 days) after batch start_date',
          start_date: activeBatch.start_date,
          first_week_start: firstWeekStart?.toISOString() || null,
          week_1_ends: firstWeekStart ? new Date(firstWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString() : null,
          sp1_can_be_issued_after: firstWeekStart ? new Date(firstWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString() : null,
        },
        weeks_status: weeksStatus,
        daftar_ulang: {
          total: daftarUlangUsers?.length || 0,
          status_counts: statusCounts,
          sample_users: daftarUlangUsers?.slice(0, 5).map((d: any) => ({
            user_id: d.user_id,
            status: d.status,
          })),
        },
        jurnal: {
          total_records: jurnalRecords?.length || 0,
          unique_thalibah: new Set(jurnalRecords?.map((j: any) => j.user_id)).size || 0,
        },
        sp: {
          total_records: spRecords?.length || 0,
          records: spRecords?.slice(0, 5).map((sp: any) => ({
            id: sp.id,
            thalibah_id: sp.thalibah_id,
            sp_level: sp.sp_level,
            week_number: sp.week_number,
            status: sp.status,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error('Error in debug API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
