import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Helper function to calculate week number from blok code
// Same logic as tashih: H1A/H1B/H1C/H1D = week 1, H2A/H2B/H2C/H2D = week 2, etc.
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
    return blockNumber; // Juz 1: H1 = pekan 1, H2 = pekan 2, etc.
  } else if (blockNumber >= 11 && blockNumber <= 20) {
    return blockNumber - 10; // Juz 2: H11 = pekan 1, H12 = pekan 2, etc.
  }

  return null;
}

// Helper to generate all blocks (10 weeks, 4 blocks per week) for a juz - LIKE TASHIH
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
        jurnal_count: 0
      });
    }
  }

  return allBlocks;
}

// Helper to calculate weekly status - LIKE TASHIH but for jurnal
function calculateWeeklyStatus(allBlocks: any[], jurnalRecords: any[]) {
  const blockStatus = new Map<string, { is_completed: boolean; jurnal_count: number; jurnal_date?: string }>();

  // Initialize all blocks as not completed
  allBlocks.forEach(block => {
    blockStatus.set(block.block_code, { is_completed: false, jurnal_count: 0 });
  });

  // Mark blocks that have jurnal records
  jurnalRecords.forEach(record => {
    if (record.blok) {
      const blokCode = record.blok;
      const current = blockStatus.get(blokCode);
      if (current) {
        current.is_completed = true;
        current.jurnal_count += 1;
        if (!current.jurnal_date || new Date(record.tanggal_setor || record.created_at) > new Date(current.jurnal_date)) {
          current.jurnal_date = record.tanggal_setor || record.created_at;
        }
        blockStatus.set(blokCode, current);
      }
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
        jurnal_count: blockStatus.get(b.block_code)?.jurnal_count || 0
      }))
    });
  }

  return weeklyStatus;
}

// Validation schema for jurnal record (pekan is optional, will be calculated from blok)
const jurnalRecordSchema = z.object({
  user_id: z.string().uuid(),
  tanggal_jurnal: z.string().optional(),
  tanggal_setor: z.string().optional(),
  juz_code: z.string().nullable().optional(),
  blok: z.string().nullable().optional(),
  pekan: z.number().nullable().optional(), // Optional for backward compatibility
  tashih_completed: z.boolean().optional(),
  rabth_completed: z.boolean().optional(),
  murajaah_count: z.number().optional(),
  simak_murattal_count: z.number().optional(),
  tikrar_bi_an_nadzar_completed: z.boolean().optional(),
  tasmi_record_count: z.number().optional(),
  simak_record_completed: z.boolean().optional(),
  tikrar_bi_al_ghaib_count: z.number().optional(),
  tafsir_completed: z.boolean().optional(),
  menulis_completed: z.boolean().optional(),
  total_duration_minutes: z.number().optional(),
  catatan_tambahan: z.string().nullable().optional(),
});

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
    const pekan = searchParams.get('pekan');
    const batchId = searchParams.get('batch_id');

    // Get active batch if not specified
    let activeBatchId = batchId;
    if (!activeBatchId) {
      const { data: activeBatch } = await supabase
        .from('batches')
        .select('id')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      activeBatchId = activeBatch?.id;
    }

    // =====================================================
    // APPROACH LIKE TASHIH: Get users from daftar_ulang first
    // =====================================================

    // Get all thalibah from daftar_ulang_submissions with approved or submitted status
    const { data: daftarUlangUsers, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, confirmed_chosen_juz, status, submitted_at, reviewed_at')
      .in('status', ['approved', 'submitted']);

    if (daftarUlangError) {
      throw daftarUlangError;
    }

    const daftarUlangUserIds = daftarUlangUsers?.map((d: any) => d.user_id) || [];

    // Build query for jurnal_records - filter by user IDs from daftar_ulang (like tashih)
    let query = supabase
      .from('jurnal_records')
      .select(`
        id,
        user_id,
        tanggal_jurnal,
        tanggal_setor,
        juz_code,
        blok,
        tashih_completed,
        rabth_completed,
        murajaah_count,
        simak_murattal_count,
        tikrar_bi_an_nadzar_completed,
        tasmi_record_count,
        simak_record_completed,
        tikrar_bi_al_ghaib_count,
        tafsir_completed,
        menulis_completed,
        total_duration_minutes,
        catatan_tambahan,
        created_at,
        updated_at
      `)
      .in('user_id', daftarUlangUserIds)
      .order('tanggal_setor', { ascending: false });

    // Apply filters if provided
    if (blok) {
      query = query.eq('blok', blok);
    }

    const { data: entries, error } = await query;

    if (error) {
      // If table doesn't exist, treat as no entries
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        // Continue with empty entries array
      } else {
        throw error;
      }
    }

    // =====================================================
    // LIKE TASHIH: Create entry for ALL users from daftar_ulang
    // =====================================================

    // Fetch user data for ALL daftar_ulang users
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, nama_kunyah, whatsapp')
      .in('id', daftarUlangUserIds);

    // Create user map for quick lookup
    const userMap = new Map();
    usersData?.forEach((u: any) => {
      userMap.set(u.id, u);
    });

    // Create daftar ulang map for quick lookup
    const daftarUlangMap = new Map();
    daftarUlangUsers?.forEach((d: any) => {
      daftarUlangMap.set(d.user_id, d);
    });

    // Group jurnal entries by user
    const jurnalByUser = new Map();
    (entries || []).forEach((record: any) => {
      if (!jurnalByUser.has(record.user_id)) {
        jurnalByUser.set(record.user_id, []);
      }
      jurnalByUser.get(record.user_id).push(record);
    });

    // Get all unique bloks from jurnal records
    const allBloks = new Set<string>();
    (entries || []).forEach((record: any) => {
      if (record.blok) {
        // Handle both string and array format
        const bloks = typeof record.blok === 'string' && record.blok.startsWith('[')
          ? JSON.parse(record.blok)
          : [record.blok];
        bloks.forEach((b: any) => allBloks.add(b));
      }
    });

    // Get all unique juz codes from daftar ulang (like tashih)
    const uniqueJuzCodes = new Set(
      daftarUlangUsers?.map((d: any) => d.confirmed_chosen_juz).filter(Boolean) || []
    );

    // Fetch juz info for all unique juz codes (like tashih)
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

    // Fetch active SP records for all thalibah
    const { data: spRecords } = await supabase
      .from('surat_peringatan')
      .select('thalibah_id, sp_level, week_number, status, issued_at, reason, is_blacklisted')
      .eq('status', 'active')
      .in('thalibah_id', daftarUlangUserIds);

    // Group SP by user and by week
    const spByUser = new Map();
    const spByUserAndWeek = new Map();
    spRecords?.forEach((sp: any) => {
      if (!spByUser.has(sp.thalibah_id)) {
        spByUser.set(sp.thalibah_id, []);
      }
      spByUser.get(sp.thalibah_id).push(sp);

      // Also group by user and week for easy lookup
      const key = `${sp.thalibah_id}-${sp.week_number}`;
      spByUserAndWeek.set(key, sp);
    });

    // Build combined entries for ALL users (like tashih)
    const combinedEntries = daftarUlangUserIds.map((userId: string) => {
      const daftarUlang = daftarUlangMap.get(userId);
      const userJurnalRecords = jurnalByUser.get(userId) || [];
      const latestJurnal = userJurnalRecords.length > 0
        ? userJurnalRecords.sort((a: any, b: any) =>
            new Date(b.tanggal_setor || b.created_at).getTime() -
            new Date(a.tanggal_setor || a.created_at).getTime()
          )[0]
        : null;
      const juzCode = daftarUlang?.confirmed_chosen_juz;
      const juzInfo = juzCode ? juzInfoMap.get(juzCode) : null;

      // Calculate weekly status (P1-P10) using NEW block-based approach like tashih
      let weeklyStatus: any[] = [];
      let totalBlocks = 0;
      let completedBlocks = 0;

      if (juzInfo) {
        // Generate all expected blocks for this juz (like tashih)
        const allBlocks = generateAllBlocks(juzInfo);
        weeklyStatus = calculateWeeklyStatus(allBlocks, userJurnalRecords);
        totalBlocks = allBlocks.length;
        completedBlocks = allBlocks.filter(b => {
          const hasJurnal = userJurnalRecords.some((record: any) => record.blok === b.block_code);
          return hasJurnal;
        }).length;

        // Add SP info to each week (preserve existing SP integration)
        weeklyStatus.forEach((week: any) => {
          const spKey = `${userId}-${week.week_number}`;
          const spForWeek = spByUserAndWeek.get(spKey);

          // Add sp_info to the week
          week.sp_info = spForWeek ? {
            sp_level: spForWeek.sp_level,
            status: spForWeek.status,
            issued_at: spForWeek.issued_at,
            reason: spForWeek.reason,
            is_blacklisted: spForWeek.is_blacklisted,
          } : null;

          // Also add entries for backward compatibility (optional)
          week.entries = userJurnalRecords.filter((e: any) => {
            const pekan = calculateWeekFromBlok(e.blok);
            return pekan === week.week_number;
          }).map((e: any) => ({
            ...e,
            pekan: calculateWeekFromBlok(e.blok),
          }));
        });
      } else {
        // Fallback for users without juz info (should not happen normally)
        for (let week = 1; week <= 10; week++) {
          const spKey = `${userId}-${week}`;
          const spForWeek = spByUserAndWeek.get(spKey);

          weeklyStatus.push({
            week_number: week,
            total_blocks: 0,
            completed_blocks: 0,
            is_completed: false,
            blocks: [],
            sp_info: spForWeek ? {
              sp_level: spForWeek.sp_level,
              status: spForWeek.status,
              issued_at: spForWeek.issued_at,
              reason: spForWeek.reason,
              is_blacklisted: spForWeek.is_blacklisted,
            } : null,
            entries: [],
          });
        }
      }

      const weeksWithJurnal = weeklyStatus.filter((w: any) => w.completed_blocks > 0).length;

      // Get SP summary for this user
      const userSPRecords = spByUser.get(userId) || [];
      const latestSP = userSPRecords.length > 0
        ? userSPRecords.reduce((latest: any, current: any) =>
            current.sp_level > latest.sp_level ? current : latest
          )
        : null;

      return {
        user_id: userId,
        confirmed_chosen_juz: juzCode || null,
        juz_info: juzInfo || null,
        daftar_ulang_status: daftarUlang?.status,
        submitted_at: daftarUlang?.submitted_at,
        reviewed_at: daftarUlang?.reviewed_at,
        user: userMap.get(userId) || null,
        weekly_status: weeklyStatus,
        // NEW: Add summary like tashih
        summary: {
          total_blocks: totalBlocks,
          completed_blocks: completedBlocks,
          pending_blocks: totalBlocks - completedBlocks,
          completion_percentage: totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0
        },
        jurnal_count: userJurnalRecords.length,
        weeks_with_jurnal: weeksWithJurnal,
        has_jurnal: userJurnalRecords.length > 0,
        latest_jurnal: latestJurnal ? {
          id: latestJurnal.id,
          tanggal_setor: latestJurnal.tanggal_setor,
          blok: latestJurnal.blok,
          pekan: calculateWeekFromBlok(latestJurnal.blok),
          juz_code: latestJurnal.juz_code,
        } : null,
        jurnal_records: userJurnalRecords.map((r: any) => ({
          ...r,
          pekan: calculateWeekFromBlok(r.blok),
        })),
        // SP summary
        sp_summary: latestSP ? {
          sp_level: latestSP.sp_level,
          week_number: latestSP.week_number,
          issued_at: latestSP.issued_at,
          reason: latestSP.reason,
          is_blacklisted: latestSP.is_blacklisted,
          total_active_sp: userSPRecords.length,
        } : null,
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
    console.error('Error in musyrifah jurnal API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new jurnal record
export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Verify musyrifah access
    const authResult = await verifyMusyrifahAccess(supabase);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();

    // Validate request body
    const validatedData = jurnalRecordSchema.parse(body);

    // Check if user exists
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', validatedData.user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create jurnal record
    const { data: newRecord, error } = await supabase
      .from('jurnal_records')
      .insert({
        ...validatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: newRecord,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating jurnal record:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update an existing jurnal record
export async function PUT(request: Request) {
  try {
    const supabase = createClient();

    // Verify musyrifah access
    const authResult = await verifyMusyrifahAccess(supabase);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    // Validate request body (partial validation for update)
    const validatedData = jurnalRecordSchema.partial().parse(updateData);

    // Check if record exists
    const { data: existingRecord } = await supabase
      .from('jurnal_records')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingRecord) {
      return NextResponse.json({ error: 'Jurnal record not found' }, { status: 404 });
    }

    // Update jurnal record
    const { data: updatedRecord, error } = await supabase
      .from('jurnal_records')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate paths to refresh cache
    revalidatePath('/panel-musyrifah');
    revalidatePath('/dashboard');

    return NextResponse.json({
      success: true,
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error('Error updating jurnal record:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a jurnal record
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
      .from('jurnal_records')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingRecord) {
      return NextResponse.json({ error: 'Jurnal record not found' }, { status: 404 });
    }

    // Delete jurnal record
    const { error } = await supabase
      .from('jurnal_records')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Revalidate paths to refresh cache
    revalidatePath('/panel-musyrifah');
    revalidatePath('/dashboard');

    return NextResponse.json({
      success: true,
      message: 'Jurnal record deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting jurnal record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
