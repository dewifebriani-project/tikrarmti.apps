'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Verify that the current user has musyrifah role
 * Throws an error if not authorized
 */
async function verifyMusyrifah() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: No valid session');
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error('Unauthorized: User not found');
  }

  const roles = userData?.roles || [];
  if (!roles.includes('musyrifah')) {
    throw new Error('Forbidden: Musyrifah access required');
  }

  return user;
}

/**
 * Verify that the current user has musyrifah or admin role
 * Throws an error if not authorized
 */
async function verifyMusyrifahOrAdmin() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: No valid session');
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, roles')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error('Unauthorized: User not found');
  }

  const roles = userData?.roles || [];
  if (!roles.includes('musyrifah') && !roles.includes('admin')) {
    throw new Error('Forbidden: Musyrifah or Admin access required');
  }

  return userData;
}

/**
 * Get statistics for musyrifah dashboard
 */
export async function getMusyrifahStats() {
  try {
    await verifyMusyrifah();

    const supabase = createClient();

    // Get current active batch
    const { data: activeBatch } = await supabase
      .from('batches')
      .select('id')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Placeholder stats - you should implement actual queries based on your data model
    const stats = {
      totalThalibah: 0,
      activeHalaqah: 0,
      pendingJurnalReview: 0,
      pendingTashihReview: 0,
      pendingUjianReview: 0,
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('Error getting musyrifah stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get thalibah assigned to this musyrifah
 */
export async function getMusyrifahThalibah() {
  try {
    const user = await verifyMusyrifah();

    const supabase = createClient();

    // Get active batch
    const { data: activeBatch } = await supabase
      .from('batches')
      .select('id')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get thalibah assigned to this musyrifah
    // This is a placeholder - you need to implement the actual query based on your assignment logic
    const { data: thalibah, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        whatsapp,
        halaqah_assignments:halaqah_students(
          halaqah:halaqah(id, name)
        ),
        tikrar_registrations(
          id,
          batch_id,
          status,
          selection_status,
          batch:batches(name)
        )
      `)
      .contains('roles', ['thalibah']);

    if (error) throw error;

    return { success: true, data: thalibah || [] };
  } catch (error: any) {
    console.error('Error getting musyrifah thalibah:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get jurnal entries for review by this musyrifah
 */
export async function getMusyrifahJurnal() {
  try {
    await verifyMusyrifah();

    const supabase = createClient();

    const { data: entries, error } = await supabase
      .from('jurnal_harian')
      .select(`
        id,
        thalibah_id,
        tanggal,
        juz,
        halaman_mulai,
        halaman_selesai,
        catatan,
        created_at,
        thalibah:users(full_name)
      `)
      .order('tanggal', { ascending: false })
      .limit(50);

    if (error) throw error;

    return { success: true, data: entries || [] };
  } catch (error: any) {
    console.error('Error getting musyrifah jurnal:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get tashih entries for review by this musyrifah
 * Only fetches records with approved or submitted status
 */
export async function getMusyrifahTashih() {
  try {
    await verifyMusyrifah();

    const supabase = createClient();

    const { data: entries, error } = await supabase
      .from('tashih')
      .select(`
        id,
        thalibah_id,
        tanggal_tashih,
        jenis_kesalahan,
        ayat,
        keterangan,
        status,
        created_at,
        thalibah:users(full_name)
      `)
      .in('status', ['approved', 'submitted'])
      .order('tanggal_tashih', { ascending: false })
      .limit(50);

    if (error) throw error;

    return { success: true, data: entries || [] };
  } catch (error: any) {
    console.error('Error getting musyrifah tashih:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get ujian results for thalibah assigned to this musyrifah
 */
export async function getMusyrifahUjian() {
  try {
    await verifyMusyrifah();

    const supabase = createClient();

    const { data: results, error } = await supabase
      .from('exam_attempts')
      .select(`
        id,
        thalibah_id,
        juz_number,
        score,
        status,
        submitted_at,
        thalibah:users(full_name)
      `)
      .order('submitted_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return { success: true, data: results || [] };
  } catch (error: any) {
    console.error('Error getting musyrifah ujian:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Approve a tashih entry
 */
export async function approveTashih(tashihId: string) {
  try {
    const user = await verifyMusyrifah();

    const supabase = createClient();

    const { error } = await supabase
      .from('tashih')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', tashihId);

    if (error) throw error;

    revalidatePath('/panel-musyrifah');

    return { success: true };
  } catch (error: any) {
    console.error('Error approving tashih:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject a tashih entry
 */
export async function rejectTashih(tashihId: string, reason: string) {
  try {
    const user = await verifyMusyrifah();

    const supabase = createClient();

    const { error } = await supabase
      .from('tashih')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', tashihId);

    if (error) throw error;

    revalidatePath('/panel-musyrifah');

    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting tashih:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// SP (Surat Peringatan) Server Actions
// =====================================================

/**
 * Create a new SP record
 */
export async function createSP(data: {
  thalibah_id: string;
  batch_id: string;
  week_number: number;
  reason: 'tidak_lapor_jurnal' | 'laporan_tidak_lengkap' | 'lainnya';
  notes?: string;
}) {
  try {
    const currentUser = await verifyMusyrifahOrAdmin();

    const supabase = createClient();

    // Check if thalibah exists
    const { data: thalibah } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', data.thalibah_id)
      .single();

    if (!thalibah) {
      return { success: false, error: 'Thalibah not found' };
    }

    // Auto-calculate SP level
    const { data: latestSP } = await supabase
      .from('surat_peringatan')
      .select('sp_level')
      .eq('thalibah_id', data.thalibah_id)
      .eq('batch_id', data.batch_id)
      .eq('status', 'active')
      .order('sp_level', { ascending: false })
      .limit(1)
      .maybeSingle();

    let spLevel = 1;
    if (latestSP) {
      spLevel = Math.min(latestSP.sp_level + 1, 3);
    }

    // Create SP record
    const { data: newSP, error } = await supabase
      .from('surat_peringatan')
      .insert({
        thalibah_id: data.thalibah_id,
        batch_id: data.batch_id,
        week_number: data.week_number,
        sp_level: spLevel,
        reason: data.reason,
        notes: data.notes,
        issued_by: currentUser.id,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/panel-musyrifah');
    revalidatePath('/panel-musyrifah?tab=sp');

    return { success: true, data: newSP, message: `SP${spLevel} berhasil diterbitkan` };
  } catch (error: any) {
    console.error('Error creating SP:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an SP record
 */
export async function updateSP(
  id: string,
  data: {
    status?: 'active' | 'cancelled' | 'expired';
    notes?: string;
    sp_type?: 'permanent_do' | 'temporary_do';
    udzur_type?: 'sakit' | 'merawat_orang_tua' | 'lainnya';
    udzur_notes?: string;
    is_blacklisted?: boolean;
  }
) {
  try {
    const currentUser = await verifyMusyrifahOrAdmin();

    const supabase = createClient();

    // Check if SP exists
    const { data: existingSP } = await supabase
      .from('surat_peringatan')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingSP) {
      return { success: false, error: 'SP record not found' };
    }

    // Update SP record
    const { data: updatedSP, error } = await supabase
      .from('surat_peringatan')
      .update({
        ...data,
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If this is SP3 with sp_type set, create history record
    if (existingSP.sp_level === 3 && data.sp_type) {
      const { data: existingHistory } = await supabase
        .from('sp_history')
        .select('id')
        .eq('thalibah_id', existingSP.thalibah_id)
        .eq('batch_id', existingSP.batch_id)
        .eq('final_action', data.is_blacklisted ? 'blacklisted' : data.sp_type)
        .maybeSingle();

      if (!existingHistory) {
        await supabase.from('sp_history').insert({
          thalibah_id: existingSP.thalibah_id,
          batch_id: existingSP.batch_id,
          final_action: data.is_blacklisted ? 'blacklisted' : data.sp_type,
          total_sp_count: 3,
          udzur_type: data.udzur_type,
          udzur_notes: data.udzur_notes,
          action_taken_by: currentUser.id,
          notes: data.notes,
        });
      }
    }

    revalidatePath('/panel-musyrifah');
    revalidatePath('/panel-musyrifah?tab=sp');

    return { success: true, data: updatedSP };
  } catch (error: any) {
    console.error('Error updating SP:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel (delete) an SP record
 */
export async function cancelSP(id: string) {
  try {
    const currentUser = await verifyMusyrifahOrAdmin();

    const supabase = createClient();

    // Check if SP exists
    const { data: existingSP } = await supabase
      .from('surat_peringatan')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingSP) {
      return { success: false, error: 'SP record not found' };
    }

    // Soft delete by setting status to cancelled
    const { error } = await supabase
      .from('surat_peringatan')
      .update({
        status: 'cancelled',
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/panel-musyrifah');
    revalidatePath('/panel-musyrifah?tab=sp');

    return { success: true, message: 'SP berhasil dibatalkan' };
  } catch (error: any) {
    console.error('Error cancelling SP:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process SP3 to DO (Drop Out)
 */
export async function processSP3ToDO(
  spId: string,
  doType: 'permanent_do' | 'temporary_do',
  udzurType?: 'sakit' | 'merawat_orang_tua' | 'lainnya',
  udzurNotes?: string,
  temporaryUntil?: string
) {
  try {
    const currentUser = await verifyMusyrifahOrAdmin();

    const supabase = createClient();

    // Get SP record
    const { data: spRecord } = await supabase
      .from('surat_peringatan')
      .select('*')
      .eq('id', spId)
      .single();

    if (!spRecord) {
      return { success: false, error: 'SP record not found' };
    }

    // Check if this is SP3
    if (spRecord.sp_level !== 3) {
      return { success: false, error: 'Hanya SP3 yang dapat diproses menjadi DO' };
    }

    // Update SP record
    await supabase
      .from('surat_peringatan')
      .update({
        sp_type: doType,
        udzur_type: udzurType,
        udzur_notes: udzurNotes,
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', spId);

    // Create history record
    const { data: existingHistory } = await supabase
      .from('sp_history')
      .select('id')
      .eq('thalibah_id', spRecord.thalibah_id)
      .eq('batch_id', spRecord.batch_id)
      .eq('final_action', doType)
      .maybeSingle();

    if (!existingHistory) {
      await supabase.from('sp_history').insert({
        thalibah_id: spRecord.thalibah_id,
        batch_id: spRecord.batch_id,
        final_action: doType,
        total_sp_count: 3,
        udzur_type: udzurType,
        udzur_notes: udzurNotes,
        temporary_until: temporaryUntil,
        action_taken_by: currentUser.id,
        notes: `SP3 diproses menjadi ${doType === 'permanent_do' ? 'DO Permanent' : 'DO Temporary'}`,
      });
    }

    revalidatePath('/panel-musyrifah');
    revalidatePath('/panel-musyrifah?tab=sp');

    return {
      success: true,
      message: `SP3 berhasil diproses menjadi ${doType === 'permanent_do' ? 'DO Permanent' : 'DO Temporary'}`,
    };
  } catch (error: any) {
    console.error('Error processing SP3 to DO:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Blacklist a thalibah
 */
export async function blacklistThalibah(thalibahId: string, batchId: string, notes: string) {
  try {
    const currentUser = await verifyMusyrifahOrAdmin();

    const supabase = createClient();

    // Update all active SP for this thalibah
    const { data: activeSPs } = await supabase
      .from('surat_peringatan')
      .select('*')
      .eq('thalibah_id', thalibahId)
      .eq('batch_id', batchId)
      .eq('status', 'active');

    if (activeSPs && activeSPs.length > 0) {
      for (const sp of activeSPs) {
        await supabase
          .from('surat_peringatan')
          .update({
            is_blacklisted: true,
            reviewed_by: currentUser.id,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sp.id);
      }
    }

    // Create history record
    const { data: existingHistory } = await supabase
      .from('sp_history')
      .select('id')
      .eq('thalibah_id', thalibahId)
      .eq('batch_id', batchId)
      .eq('final_action', 'blacklisted')
      .maybeSingle();

    if (!existingHistory) {
      await supabase.from('sp_history').insert({
        thalibah_id: thalibahId,
        batch_id: batchId,
        final_action: 'blacklisted',
        total_sp_count: activeSPs?.length || 0,
        action_taken_by: currentUser.id,
        notes: notes || 'Diblacklist karena tidak serius dalam program',
      });
    }

    revalidatePath('/panel-musyrifah');
    revalidatePath('/panel-musyrifah?tab=sp');

    return { success: true, message: 'Thalibah berhasil diblacklist' };
  } catch (error: any) {
    console.error('Error blacklisting thalibah:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get SP data for the SP tab
 */
export async function getSPData(batchId?: string) {
  try {
    await verifyMusyrifahOrAdmin();

    const supabase = createClient();

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

    if (!activeBatchId) {
      return {
        success: true,
        data: { active: [], history: [], pending: [] },
      };
    }

    // Get active SP
    const { data: activeSP } = await supabase
      .from('surat_peringatan')
      .select(`
        *,
        thalibah:users(id, full_name, nama_kunyah, whatsapp, email),
        batch:batches(id, name)
      `)
      .eq('batch_id', activeBatchId)
      .eq('status', 'active')
      .order('issued_at', { ascending: false });

    // Get SP history
    const { data: history } = await supabase
      .from('sp_history')
      .select(`
        *,
        thalibah:users(id, full_name, nama_kunyah, whatsapp, email),
        batch:batches(id, name)
      `)
      .eq('batch_id', activeBatchId)
      .order('action_taken_at', { ascending: false });

    // Get pending SP (from check-weekly logic)
    const pendingResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/musyrifah/sp/check-weekly?batch_id=${activeBatchId}`,
      {
        cache: 'no-store',
      }
    );

    let pending: any[] = [];
    if (pendingResponse.ok) {
      const pendingData = await pendingResponse.json();
      pending = pendingData.data || [];
    }

    return {
      success: true,
      data: {
        active: activeSP || [],
        history: history || [],
        pending,
        batch_id: activeBatchId,
      },
    };
  } catch (error: any) {
    console.error('Error getting SP data:', error);
    return { success: false, error: error.message };
  }
}
