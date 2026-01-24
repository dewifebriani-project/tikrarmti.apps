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
      .select('user_id, status, submitted_at, reviewed_at')
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

    // Build combined entries for ALL users (like tashih)
    const combinedEntries = daftarUlangUserIds.map((userId: string) => {
      const userJurnalRecords = jurnalByUser.get(userId) || [];
      const latestJurnal = userJurnalRecords.length > 0
        ? userJurnalRecords.sort((a: any, b: any) =>
            new Date(b.tanggal_setor || b.created_at).getTime() -
            new Date(a.tanggal_setor || a.created_at).getTime()
          )[0]
        : null;

      // Calculate weekly status (P1-P10)
      const weeklyStatus: any[] = [];
      for (let week = 1; week <= 10; week++) {
        const weekEntries = userJurnalRecords.filter((e: any) => {
          const pekan = calculateWeekFromBlok(e.blok);
          return pekan === week;
        });

        weeklyStatus.push({
          week_number: week,
          has_jurnal: weekEntries.length > 0,
          entry_count: weekEntries.length,
          entries: weekEntries.map((e: any) => ({
            ...e,
            pekan: calculateWeekFromBlok(e.blok),
          }))
        });
      }

      const weeksWithJurnal = weeklyStatus.filter(w => w.has_jurnal).length;

      return {
        user_id: userId,
        daftar_ulang_status: daftarUlangMap.get(userId)?.status,
        submitted_at: daftarUlangMap.get(userId)?.submitted_at,
        reviewed_at: daftarUlangMap.get(userId)?.reviewed_at,
        user: userMap.get(userId) || null,
        weekly_status: weeklyStatus,
        jurnal_count: userJurnalRecords.length,
        weeks_with_jurnal: weeksWithJurnal,
        latest_jurnal: latestJurnal ? {
          id: latestJurnal.id,
          tanggal_setor: latestJurnal.tanggal_setor,
          blok: latestJurnal.blok,
          pekan: calculateWeekFromBlok(latestJurnal.blok),
        } : null,
        jurnal_records: userJurnalRecords.map((r: any) => ({
          ...r,
          pekan: calculateWeekFromBlok(r.blok),
        })),
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
