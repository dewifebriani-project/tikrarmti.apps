import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    // Calculate current week
    const now = new Date();
    const firstWeekStart = activeBatch.first_week_start_date ? new Date(activeBatch.first_week_start_date) : null;

    let currentWeek = 1;
    if (firstWeekStart) {
      const weekDiff = Math.floor((now.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      currentWeek = Math.max(1, Math.min(weekDiff + 1, 10));
    }

    // Check which weeks have ended
    const weeksStatus: any[] = [];
    for (let week = 1; week <= 10; week++) {
      let hasEnded = false;
      let weekEndDate = null;

      if (firstWeekStart) {
        const weekEnd = new Date(firstWeekStart);
        weekEnd.setDate(weekEnd.getDate() + (week * 7) - 1);
        weekEnd.setHours(23, 59, 59, 999);
        weekEndDate = weekEnd.toISOString();
        hasEnded = now > weekEnd;
      }

      weeksStatus.push({
        week,
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
          first_week_start_date: activeBatch.first_week_start_date,
          first_week_end_date: activeBatch.first_week_end_date,
        },
        current_date: now.toISOString(),
        calculated_current_week: currentWeek,
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
