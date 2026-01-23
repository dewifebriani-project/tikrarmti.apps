import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for jurnal record
const jurnalRecordSchema = z.object({
  user_id: z.string().uuid(),
  tanggal_jurnal: z.string().optional(),
  tanggal_setor: z.string().optional(),
  juz_code: z.string().nullable().optional(),
  blok: z.string().nullable().optional(),
  pekan: z.number().nullable().optional(),
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

    // Build query for jurnal_records - get ALL records (not filtered by daftar_ulang)
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
      .order('tanggal_setor', { ascending: false });

    // Apply filters if provided
    if (blok) {
      query = query.eq('blok', blok);
    }
    if (pekan) {
      query = query.eq('pekan', pekan);
    }

    const { data: entries, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    // Extract unique user IDs from entries for fetching user data
    const userIds = entries?.map((e: any) => e.user_id) || [];

    // Fetch user data separately (from public.users)
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, nama_kunyah, whatsapp')
      .in('id', userIds);

    // Create a map for quick user lookup
    const userMap = new Map();
    usersData?.forEach((u: any) => {
      userMap.set(u.id, u);
    });

    // Merge jurnal entries with user data
    const entriesWithUsers = (entries || []).map((entry: any) => ({
      ...entry,
      user: userMap.get(entry.user_id) || null,
    }));

    // Get unique bloks and pekans for filter options
    const { data: bloksData } = await supabase
      .from('jurnal_records')
      .select('blok')
      .not('blok', 'is', null)
      .order('blok', { ascending: true });

    const uniqueBloks = Array.from(new Set(bloksData?.map((d: any) => d.blok).filter((b: any) => b) || []));

    return NextResponse.json({
      success: true,
      data: entriesWithUsers,
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

    return NextResponse.json({
      success: true,
      message: 'Jurnal record deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting jurnal record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
