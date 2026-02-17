import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import fs from 'fs';

// Helper function to calculate week number from blok code
function calculateWeekFromBlok(blok: string | null): number | null {
  if (!blok) return null;

  let blokCode: string | null = blok;

  // Handle array format like "[\"H11A\"]"
  if (blokCode.startsWith('[')) {
    try {
      const parsed = JSON.parse(blokCode);
      if (Array.isArray(parsed) && parsed.length > 0) {
        blokCode = parsed[0];
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  if (!blokCode) return null;

  // Extract number from blok code (e.g., "H1A" -> 1, "H11B" -> 11)
  const match = blokCode.match(/H(\d+)/);
  if (!match) return null;

  const blockNumber = parseInt(match[1], 10);

  // Map block number to week (H1-H10 = pekan 1-10, H11-H20 = pekan 1-10 for juz 2)
  if (blockNumber >= 1 && blockNumber <= 10) {
    return blockNumber;
  } else if (blockNumber >= 11 && blockNumber <= 20) {
    return blockNumber - 10;
  }

  return null;
}

// Helper function to get the first week start date from batch
// First week starts 3 weeks after batch start_date
function getFirstWeekStart(batch: any): Date | null {
  const startDate = batch.start_date ? new Date(batch.start_date) : null;
  if (!startDate) return null;

  // First week starts 1 week after batch start_date (Pekan Tashih)
  const firstWeekStart = new Date(startDate);
  firstWeekStart.setDate(firstWeekStart.getDate() + (1 * 7)); // +1 week
  return firstWeekStart;
}

// Helper function to get the current week number based on batch timeline
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

// Helper function to verify musyrifah or admin access
async function verifyMusyrifahOrAdminAccess(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, roles')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return { error: 'User not found', status: 404 };
  }

  const roles = userData?.roles || [];
  if (!roles.includes('musyrifah') && !roles.includes('admin')) {
    return { error: 'Forbidden: Musyrifah or Admin access required', status: 403 };
  }

  return { user: userData };
}

// =====================================================
// GET - Check weekly jurnal compliance and return pending SP list
// =====================================================
export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Verify musyrifah or admin access
    const authResult = await verifyMusyrifahOrAdminAccess(supabase);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const weekNumber = searchParams.get('week_number');
    const checkAllWeeks = searchParams.get('check_all_weeks') === 'true';

    // Get active batch if not specified
    let activeBatchId = batchId;
    let activeBatch: any = null;

    if (!activeBatchId) {
      const { data: batchData } = await supabase
        .from('batches')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (batchData) {
        activeBatch = batchData;
        activeBatchId = batchData.id;
      }
    } else {
      const { data: batchData } = await supabase
        .from('batches')
        .select('*')
        .eq('id', activeBatchId)
        .single();

      activeBatch = batchData;
    }

    if (!activeBatch) {
      return NextResponse.json({ error: 'No active batch found' }, { status: 404 });
    }

    // Determine which week to check
    let targetWeek = weekNumber ? parseInt(weekNumber) : getCurrentWeekNumber(activeBatch);

    // Get all thalibah from daftar_ulang_submissions
    const { data: daftarUlangUsers, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, confirmed_chosen_juz, status, submitted_at, reviewed_at')
      .eq('batch_id', activeBatchId)
      .in('status', ['approved', 'submitted']);

    if (daftarUlangError) {
      throw daftarUlangError;
    }

    const daftarUlangUserIds = daftarUlangUsers?.map((d: any) => d.user_id) || [];

    // DEBUG LOGGING
    try {
      const debugInfo = `
Timestamp: ${new Date().toISOString()}
Target Week: ${targetWeek}
Active Batch: ${activeBatch?.name}
Batch Start: ${activeBatch?.start_date}
First Week Start (Calculated): ${getFirstWeekStart(activeBatch)?.toISOString()}
Current Week Number (Calculated): ${getCurrentWeekNumber(activeBatch)}
Has Week ${targetWeek} Ended?: ${hasWeekEnded(activeBatch, targetWeek)}
Daftar Ulang Users: ${daftarUlangUserIds.length}
Check All Weeks: ${checkAllWeeks}
`;
      fs.writeFileSync('public/debug-check-weekly.txt', debugInfo);
    } catch (e) {
      console.error('Debug log failed', e);
    }

    if (daftarUlangUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          batch_id: activeBatchId,
          batch_name: activeBatch.name,
          week_number: targetWeek,
          total_thalibah: 0,
          pending_sp_count: 0,
        },
      });
    }

    // Fetch user data
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, nama_kunyah, whatsapp, email')
      .in('id', daftarUlangUserIds);

    const userMap = new Map();
    usersData?.forEach((u: any) => {
      userMap.set(u.id, u);
    });

    // Create daftar ulang map
    const daftarUlangMap = new Map();
    daftarUlangUsers?.forEach((d: any) => {
      daftarUlangMap.set(d.user_id, d);
    });

    // Get jurnal records for all thalibah with pagination
    let allJurnalRecords: any[] = [];
    let page = 0;
    let hasMore = true;
    const pageSize = 1000;

    while (hasMore) {
      const { data: chunk, error: chunkError } = await supabase
        .from('jurnal_records')
        .select('id, user_id, blok, tanggal_setor, created_at')
        .in('user_id', daftarUlangUserIds)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (chunkError) {
        throw chunkError;
      }

      if (chunk && chunk.length > 0) {
        allJurnalRecords = [...allJurnalRecords, ...chunk];
        if (chunk.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    const jurnalRecords = allJurnalRecords;

    // Group jurnal by user
    const jurnalByUser = new Map();
    (jurnalRecords || []).forEach((record: any) => {
      if (!jurnalByUser.has(record.user_id)) {
        jurnalByUser.set(record.user_id, []);
      }
      jurnalByUser.get(record.user_id).push(record);
    });

    // Get active SP records
    const { data: activeSPRecords } = await supabase
      .from('surat_peringatan')
      .select('*')
      .eq('batch_id', activeBatchId)
      .eq('status', 'active');

    // Group SP by user
    const spByUser = new Map();
    activeSPRecords?.forEach((sp: any) => {
      if (!spByUser.has(sp.thalibah_id)) {
        spByUser.set(sp.thalibah_id, []);
      }
      spByUser.get(sp.thalibah_id).push(sp);
    });

    // Build pending SP list
    const pendingSPList: any[] = [];
    const weeksToCheck = checkAllWeeks ? Array.from({ length: 10 }, (_, i) => i + 1) : [targetWeek];

    for (const userId of daftarUlangUserIds) {
      const userJurnal = jurnalByUser.get(userId) || [];
      const userSP = spByUser.get(userId) || [];
      const daftarUlang = daftarUlangMap.get(userId);
      const user = userMap.get(userId);

      // Calculate weekly status
      const weeklyStatus = new Map<number, { has_jurnal: boolean; entry_count: number }>();
      for (let week = 1; week <= 10; week++) {
        const weekEntries = userJurnal.filter((e: any) => {
          const pekan = calculateWeekFromBlok(e.blok);
          return pekan === week;
        });
        weeklyStatus.set(week, {
          has_jurnal: weekEntries.length > 0,
          entry_count: weekEntries.length,
        });
      }

      // Check for pending SP
      for (const week of weeksToCheck) {
        const status = weeklyStatus.get(week);
        const hasJurnal = status?.has_jurnal || false;

        // Only check if week has ended
        if (!hasWeekEnded(activeBatch, week)) {
          continue;
        }

        // Check if SP already exists for this week
        const existingSPForWeek = userSP.find((sp: any) => sp.week_number === week);

        if (!hasJurnal && !existingSPForWeek) {
          // Get latest SP level for this user
          const latestSP = userSP.length > 0
            ? userSP.reduce((latest: any, current: any) =>
              current.sp_level > latest.sp_level ? current : latest
            )
            : null;

          const nextSPLevel = latestSP ? Math.min(latestSP.sp_level + 1, 3) : 1;

          // Calculate weeks with jurnal
          const weeksWithJurnal = Array.from(weeklyStatus.values()).filter(w => w.has_jurnal).length;

          pendingSPList.push({
            thalibah_id: userId,
            thalibah: user,
            batch_id: activeBatchId,
            week_number: week,
            has_jurnal: false,
            weeks_with_jurnal: weeksWithJurnal,
            confirmed_chosen_juz: daftarUlang?.confirmed_chosen_juz,
            current_active_sp: latestSP,
            next_sp_level: nextSPLevel,
            latest_jurnal_date: userJurnal.length > 0
              ? userJurnal[0].tanggal_setor || userJurnal[0].created_at
              : null,
          });
        }
      }
    }

    // Sort by week number, then by next SP level
    pendingSPList.sort((a, b) => {
      if (a.week_number !== b.week_number) {
        return a.week_number - b.week_number;
      }
      return b.next_sp_level - a.next_sp_level;
    });

    return NextResponse.json({
      success: true,
      data: pendingSPList,
      meta: {
        batch_id: activeBatchId,
        batch_name: activeBatch.name,
        week_number: targetWeek,
        total_thalibah: daftarUlangUserIds.length,
        pending_sp_count: pendingSPList.length,
        current_week: getCurrentWeekNumber(activeBatch),
      },
    });
  } catch (error: any) {
    console.error('Error in SP check-weekly API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
