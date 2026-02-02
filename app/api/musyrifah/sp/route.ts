import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Validation schema for creating SP
const createSPSchema = z.object({
  thalibah_id: z.string().uuid(),
  batch_id: z.string().uuid(),
  week_number: z.number().int().min(1).max(20),
  reason: z.enum(['tidak_lapor_jurnal', 'laporan_tidak_lengkap', 'lainnya']),
  notes: z.string().optional(),
});

// Validation schema for updating SP
const updateSPSchema = z.object({
  status: z.enum(['active', 'cancelled', 'expired']).optional(),
  notes: z.string().optional(),
  sp_type: z.enum(['permanent_do', 'temporary_do']).optional(),
  udzur_type: z.enum(['sakit', 'merawat_orang_tua', 'lainnya']).optional(),
  udzur_notes: z.string().optional(),
  is_blacklisted: z.boolean().optional(),
});

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
// GET - Fetch all SP records
// =====================================================
export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Verify musyrifah or admin access
    const authResult = await verifyMusyrifahOrAdminAccess(supabase);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const thalibahId = searchParams.get('thalibah_id');
    const spLevel = searchParams.get('sp_level');
    const status = searchParams.get('status');
    const includeHistory = searchParams.get('include_history') === 'true';

    // Build query
    // Use explicit FK constraint names to disambiguate multiple relationships to users table
    let query = supabase
      .from('surat_peringatan')
      .select(`
        id,
        thalibah_id,
        batch_id,
        week_number,
        sp_level,
        sp_type,
        reason,
        udzur_type,
        udzur_notes,
        is_blacklisted,
        status,
        issued_at,
        issued_by,
        reviewed_at,
        reviewed_by,
        notes,
        created_at,
        updated_at,
        thalibah:users!surat_peringatan_thalibah_id_fkey(id, full_name, nama_kunyah, whatsapp, email),
        batch:batches(id, name, first_week_start_date, first_week_end_date),
        issued_by_user:users!surat_peringatan_issued_by_fkey(id, full_name),
        reviewed_by_user:users!surat_peringatan_reviewed_by_fkey(id, full_name)
      `)
      .order('issued_at', { ascending: false });

    // Apply filters
    if (batchId) query = query.eq('batch_id', batchId);
    if (thalibahId) query = query.eq('thalibah_id', thalibahId);
    if (spLevel) query = query.eq('sp_level', parseInt(spLevel));
    if (status) query = query.eq('status', status);

    const { data: spRecords, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    // Fetch history if requested
    let spHistory: any[] = [];
    if (includeHistory) {
      let historyQuery = supabase
        .from('sp_history')
        .select(`
          id,
          thalibah_id,
          batch_id,
          final_action,
          total_sp_count,
          udzur_type,
          udzur_notes,
          temporary_until,
          action_taken_at,
          action_taken_by,
          notes,
          created_at,
          thalibah:users!sp_history_thalibah_id_fkey(id, full_name, nama_kunyah, whatsapp, email),
          batch:batches(id, name),
          action_taken_by_user:users!sp_history_action_taken_by_fkey(id, full_name)
        `)
        .order('action_taken_at', { ascending: false });

      if (batchId) historyQuery = historyQuery.eq('batch_id', batchId);
      if (thalibahId) historyQuery = historyQuery.eq('thalibah_id', thalibahId);

      const { data: historyData, error: historyError } = await historyQuery;
      if (!historyError && historyData) {
        spHistory = historyData;
      }
    }

    return NextResponse.json({
      success: true,
      data: spRecords || [],
      history: spHistory,
    });
  } catch (error: any) {
    console.error('Error in SP API GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =====================================================
// POST - Create a new SP record
// =====================================================
export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Verify musyrifah or admin access
    const authResult = await verifyMusyrifahOrAdminAccess(supabase);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();

    // Validate request body
    const validatedData = createSPSchema.parse(body);

    // Check if thalibah exists
    const { data: thalibah } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', validatedData.thalibah_id)
      .single();

    if (!thalibah) {
      return NextResponse.json({ error: 'Thalibah not found' }, { status: 404 });
    }

    // Check if batch exists
    const { data: batch } = await supabase
      .from('batches')
      .select('id, name')
      .eq('id', validatedData.batch_id)
      .single();

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Check if SP already exists for this thalibah, batch, week
    const { data: existingSP } = await supabase
      .from('surat_peringatan')
      .select('id, sp_level, status')
      .eq('thalibah_id', validatedData.thalibah_id)
      .eq('batch_id', validatedData.batch_id)
      .eq('week_number', validatedData.week_number)
      .eq('status', 'active')
      .maybeSingle();

    // Auto-calculate SP level based on existing active SP
    let spLevel = 1;
    if (existingSP) {
      // If SP exists for this week, update to next level
      spLevel = Math.min(existingSP.sp_level + 1, 3);
    } else {
      // Get latest SP level for this thalibah in this batch
      const { data: latestSP } = await supabase
        .from('surat_peringatan')
        .select('sp_level')
        .eq('thalibah_id', validatedData.thalibah_id)
        .eq('batch_id', validatedData.batch_id)
        .eq('status', 'active')
        .order('sp_level', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestSP) {
        spLevel = Math.min(latestSP.sp_level + 1, 3);
      }
    }

    // Create SP record
    const { data: newSP, error } = await supabase
      .from('surat_peringatan')
      .insert({
        thalibah_id: validatedData.thalibah_id,
        batch_id: validatedData.batch_id,
        week_number: validatedData.week_number,
        sp_level: spLevel,
        reason: validatedData.reason,
        notes: validatedData.notes,
        issued_by: authResult.user.id,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If this is SP3, check if we need to create history record
    if (spLevel === 3) {
      // This will be handled by a separate endpoint for proper DO processing
    }

    // Revalidate paths
    revalidatePath('/panel-musyrifah');
    revalidatePath('/panel-musyrifah?tab=sp');

    return NextResponse.json({
      success: true,
      data: newSP,
      message: `SP${spLevel} berhasil diterbitkan`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating SP:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =====================================================
// PUT - Update an existing SP record
// =====================================================
export async function PUT(request: Request) {
  try {
    const supabase = createClient();

    // Verify musyrifah or admin access
    const authResult = await verifyMusyrifahOrAdminAccess(supabase);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'SP ID is required' }, { status: 400 });
    }

    // Validate request body (partial validation for update)
    const validatedData = updateSPSchema.parse(updateData);

    // Check if SP exists
    const { data: existingSP } = await supabase
      .from('surat_peringatan')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingSP) {
      return NextResponse.json({ error: 'SP record not found' }, { status: 404 });
    }

    // Update SP record
    const { data: updatedSP, error } = await supabase
      .from('surat_peringatan')
      .update({
        ...validatedData,
        reviewed_by: authResult.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If this is SP3 with sp_type set, create history record
    if (existingSP.sp_level === 3 && validatedData.sp_type) {
      const { data: existingHistory } = await supabase
        .from('sp_history')
        .select('id')
        .eq('thalibah_id', existingSP.thalibah_id)
        .eq('batch_id', existingSP.batch_id)
        .eq('final_action', validatedData.is_blacklisted ? 'blacklisted' : validatedData.sp_type)
        .maybeSingle();

      if (!existingHistory) {
        await supabase
          .from('sp_history')
          .insert({
            thalibah_id: existingSP.thalibah_id,
            batch_id: existingSP.batch_id,
            final_action: validatedData.is_blacklisted ? 'blacklisted' : validatedData.sp_type,
            total_sp_count: 3,
            udzur_type: validatedData.udzur_type,
            udzur_notes: validatedData.udzur_notes,
            action_taken_by: authResult.user.id,
            notes: validatedData.notes,
          });
      }
    }

    // Revalidate paths
    revalidatePath('/panel-musyrifah');
    revalidatePath('/panel-musyrifah?tab=sp');

    return NextResponse.json({
      success: true,
      data: updatedSP,
    });
  } catch (error: any) {
    console.error('Error updating SP:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =====================================================
// DELETE - Delete (cancel) an SP record
// =====================================================
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();

    // Verify musyrifah or admin access
    const authResult = await verifyMusyrifahOrAdminAccess(supabase);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'SP ID is required' }, { status: 400 });
    }

    // Check if SP exists
    const { data: existingSP } = await supabase
      .from('surat_peringatan')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingSP) {
      return NextResponse.json({ error: 'SP record not found' }, { status: 404 });
    }

    // Soft delete by setting status to cancelled
    const { error } = await supabase
      .from('surat_peringatan')
      .update({
        status: 'cancelled',
        reviewed_by: authResult.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Revalidate paths
    revalidatePath('/panel-musyrifah');
    revalidatePath('/panel-musyrifah?tab=sp');

    return NextResponse.json({
      success: true,
      message: 'SP berhasil dibatalkan',
    });
  } catch (error: any) {
    console.error('Error cancelling SP:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
