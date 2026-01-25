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
