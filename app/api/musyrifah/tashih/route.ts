import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to parse blok field (can be string or array)
function parseBlokField(blok: any): string[] {
  if (!blok) return [];
  if (typeof blok === 'string') {
    return blok.split(',').map(b => b.trim()).filter(b => b);
  }
  if (Array.isArray(blok)) {
    return blok;
  }
  return [];
}

// Helper to generate all blocks (10 weeks, 4 blocks per week) for a juz
function generateAllBlocks(juzInfo: any) {
  const allBlocks: any[] = [];
  const parts = ['A', 'B', 'C', 'D'];
  const blockOffset = juzInfo.part === 'B' ? 10 : 0;

  for (let week = 1; week <= 10; week++) {
    const blockNumber = week + blockOffset;
    const weekStartPage = juzInfo.start_page + (week - 1);

    for (let i = 0; i < 4; i++) {
      const part = parts[i];
      const blockCode = `H${blockNumber}${part}`;
      const blockPage = Math.min(weekStartPage + i, juzInfo.end_page);

      allBlocks.push({
        block_code: blockCode,
        week_number: week,
        part,
        start_page: blockPage,
        end_page: blockPage,
        is_completed: false,
        tashih_count: 0
      });
    }
  }

  return allBlocks;
}

// Helper to calculate weekly status
function calculateWeeklyStatus(allBlocks: any[], tashihRecords: any[]) {
  const blockStatus = new Map<string, { is_completed: boolean; tashih_count: number; tashih_date?: string }>();

  allBlocks.forEach(block => {
    blockStatus.set(block.block_code, { is_completed: false, tashih_count: 0 });
  });

  tashihRecords.forEach(record => {
    if (record.blok) {
      const blocksInRecord = parseBlokField(record.blok);
      blocksInRecord.forEach(blockCode => {
        const current = blockStatus.get(blockCode);
        if (current) {
          current.is_completed = true;
          current.tashih_count += 1;
          if (!current.tashih_date || new Date(record.waktu_tashih) > new Date(current.tashih_date)) {
            current.tashih_date = record.waktu_tashih;
          }
          blockStatus.set(blockCode, current);
        }
      });
    }
  });

  const weeklyStatus: any[] = [];
  for (let week = 1; week <= 10; week++) {
    const weekBlocks = allBlocks.filter(b => b.week_number === week);
    const completedBlocks = weekBlocks.filter(b => {
      const status = blockStatus.get(b.block_code);
      return status?.is_completed || false;
    });

    weeklyStatus.push({
      week_number: week,
      total_blocks: weekBlocks.length,
      completed_blocks: completedBlocks.length,
      is_completed: completedBlocks.length === weekBlocks.length,
      blocks: weekBlocks.map(b => ({
        ...b,
        is_completed: blockStatus.get(b.block_code)?.is_completed || false,
        tashih_count: blockStatus.get(b.block_code)?.tashih_count || 0
      }))
    });
  }

  return weeklyStatus;
}

// Helper function to verify musyrifah access
async function verifyMusyrifahAccess(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return { error: 'User not found', status: 404 };
  }

  const roles = userData?.roles || [];
  if (!roles.includes('musyrifah')) {
    return { error: 'Forbidden: Musyrifah access required', status: 403 };
  }

  return { user };
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Verify musyrifah access
    const authResult = await verifyMusyrifahAccess(supabase);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const blok = searchParams.get('blok');

    // Get all thalibah from daftar_ulang_submissions with approved or submitted status
    const { data: daftarUlangUsers, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, confirmed_chosen_juz, status, submitted_at, reviewed_at')
      .in('status', ['approved', 'submitted']);

    if (daftarUlangError) {
      throw daftarUlangError;
    }

    const userIds = daftarUlangUsers?.map((d: any) => d.user_id) || [];
    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: { bloks: [] }
      });
    }

    // Fetch user data separately
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, nama_kunyah, whatsapp')
      .in('id', userIds);

    const userMap = new Map();
    usersData?.forEach((u: any) => {
      userMap.set(u.id, u);
    });

    const daftarUlangMap = new Map();
    daftarUlangUsers?.forEach((d: any) => {
      daftarUlangMap.set(d.user_id, d);
    });

    // Fetch all tashih_records for these users
    let tashihQuery = supabase
      .from('tashih_records')
      .select('*')
      .in('user_id', userIds)
      .order('waktu_tashih', { ascending: false });

    const { data: allTashihRecords, error: tashihError } = await tashihQuery;

    let tashihRecords = allTashihRecords || [];
    if (blok) {
      tashihRecords = tashihRecords.filter((record: any) => {
        const bloks = parseBlokField(record.blok);
        return bloks.includes(blok);
      });
    }

    const tashihByUser = new Map();
    tashihRecords.forEach((record: any) => {
      if (!tashihByUser.has(record.user_id)) {
        tashihByUser.set(record.user_id, []);
      }
      tashihByUser.get(record.user_id).push(record);
    });

    const allBloks = new Set<string>();
    tashihRecords.forEach((record: any) => {
      const bloks = parseBlokField(record.blok);
      bloks.forEach(b => allBloks.add(b));
    });

    // Get all unique juz codes from daftar ulang
    const uniqueJuzCodes = new Set(
      daftarUlangUsers?.map((d: any) => d.confirmed_chosen_juz).filter(Boolean) || []
    );

    // Fetch juz info for all unique juz codes
    const juzInfoMap = new Map();
    if (uniqueJuzCodes.size > 0) {
      const { data: juzOptions } = await supabase
        .from('juz_options')
        .select('*')
        .in('code', Array.from(uniqueJuzCodes));

      juzOptions?.forEach((juz: any) => {
        juzInfoMap.set(juz.code, juz);
      });
    }

    // Build combined entries with weekly status
    const combinedEntries = userIds.map((userId: string) => {
      const daftarUlang = daftarUlangMap.get(userId);
      const userTashihRecords = tashihByUser.get(userId) || [];
      const latestTashih = userTashihRecords.length > 0 ? userTashihRecords[0] : null;
      const juzCode = daftarUlang?.confirmed_chosen_juz;
      const juzInfo = juzCode ? juzInfoMap.get(juzCode) : null;

      let weeklyStatus: any[] = [];
      let totalBlocks = 0;
      let completedBlocks = 0;

      if (juzInfo) {
        const allBlocks = generateAllBlocks(juzInfo);
        weeklyStatus = calculateWeeklyStatus(allBlocks, userTashihRecords);
        totalBlocks = allBlocks.length;
        completedBlocks = allBlocks.filter(b => {
          const hasTashih = userTashihRecords.some((record: any) => {
            const blocksInRecord = parseBlokField(record.blok);
            return blocksInRecord.includes(b.block_code);
          });
          return hasTashih;
        }).length;
      }

      return {
        user_id: userId,
        confirmed_chosen_juz: juzCode || null,
        daftar_ulang_status: daftarUlang?.status,
        submitted_at: daftarUlang?.submitted_at,
        reviewed_at: daftarUlang?.reviewed_at,
        user: userMap.get(userId) || null,
        juz_info: juzInfo || null,
        weekly_status: weeklyStatus,
        summary: {
          total_blocks: totalBlocks,
          completed_blocks: completedBlocks,
          pending_blocks: totalBlocks - completedBlocks,
          completion_percentage: totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0
        },
        has_tashih: userTashihRecords.length > 0,
        tashih_count: userTashihRecords.length,
        latest_tashih: latestTashih ? {
          id: latestTashih.id,
          lokasi: latestTashih.lokasi,
          lokasi_detail: latestTashih.lokasi_detail,
          nama_pemeriksa: latestTashih.nama_pemeriksa,
          jumlah_kesalahan_tajwid: latestTashih.jumlah_kesalahan_tajwid,
          waktu_tashih: latestTashih.waktu_tashih,
          blok: latestTashih.blok,
        } : null,
        tashih_records: userTashihRecords,
      };
    });

    const uniqueBloks = Array.from(allBloks).sort();

    return NextResponse.json({
      success: true,
      data: combinedEntries,
      meta: {
        bloks: uniqueBloks,
      }
    });
  } catch (error: any) {
    console.error('Error in musyrifah tashih API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a tashih record
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();

    // Verify musyrifah access
    const authResult = await verifyMusyrifahAccess(supabase);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    // Check if record exists
    const { data: existingRecord } = await supabase
      .from('tashih_records')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existingRecord) {
      return NextResponse.json({ error: 'Tashih record not found' }, { status: 404 });
    }

    // Delete tashih record
    const { error } = await supabase
      .from('tashih_records')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Tashih record berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting tashih record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
