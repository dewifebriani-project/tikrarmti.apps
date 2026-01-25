import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has musyrifah role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userData?.roles || [];
    if (!roles.includes('musyrifah')) {
      return NextResponse.json({ error: 'Forbidden: Musyrifah access required' }, { status: 403 });
    }

    // Get the current active batch
    const { data: activeBatch } = await supabase
      .from('batches')
      .select('id')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!activeBatch) {
      return NextResponse.json({ success: true, data: createEmptyStats() });
    }

    // Calculate Jurnal Statistics
    const jurnalStats = await calculateJurnalStats(supabase, activeBatch.id);

    // Calculate Tashih Statistics
    const tashihStats = await calculateTashihStats(supabase, activeBatch.id);

    // Get total thalibah count (approved daftar ulang submissions)
    const { count: totalThalibah } = await supabase
      .from('daftar_ulang_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id', activeBatch.id)
      .in('status', ['approved', 'submitted']);

    // Get active halaqah count
    const { count: activeHalaqah } = await supabase
      .from('halaqah')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    const stats = {
      // Overview stats
      totalThalibah: totalThalibah || 0,
      activeHalaqah: activeHalaqah || 0,
      pendingJurnalReview: 0,
      pendingTashihReview: 0,
      pendingUjianReview: 0,

      // Jurnal statistics
      jurnal: jurnalStats,

      // Tashih statistics
      tashih: tashihStats,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error in musyrifah stats API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function createEmptyStats() {
  return {
    totalThalibah: 0,
    activeHalaqah: 0,
    pendingJurnalReview: 0,
    pendingTashihReview: 0,
    pendingUjianReview: 0,
    jurnal: {
      totalEntries: 0,
      uniqueThalibah: 0,
      thalibahWithJurnal: 0,
      thalibahWithoutJurnal: 0,
      averageEntriesPerThalibah: 0,
      weeksWithJurnal: 0,
      totalBlocksCompleted: 0,
      completionPercentage: 0,
      thisWeekEntries: 0,
    },
    tashih: {
      totalRecords: 0,
      uniqueThalibah: 0,
      thalibahWithTashih: 0,
      thalibahWithoutTashih: 0,
      averageRecordsPerThalibah: 0,
      totalBlocksCompleted: 0,
      totalBlocks: 0,
      completionPercentage: 0,
      thisWeekRecords: 0,
    },
  };
}

async function calculateJurnalStats(supabase: any, batchId: string) {
  // Get all jurnal records for this batch
  const { data: jurnalRecords, error } = await supabase
    .from('jurnal_records')
    .select('user_id, blok, tanggal_setor')
    .eq('batch_id', batchId);

  if (error || !jurnalRecords || jurnalRecords.length === 0) {
    return {
      totalEntries: 0,
      uniqueThalibah: 0,
      thalibahWithJurnal: 0,
      thalibahWithoutJurnal: 0,
      averageEntriesPerThalibah: 0,
      weeksWithJurnal: 0,
      totalBlocksCompleted: 0,
      completionPercentage: 0,
      thisWeekEntries: 0,
    };
  }

  // Calculate unique thalibah from daftar_ulang_submissions
  const { data: daftarUlangSubmissions } = await supabase
    .from('daftar_ulang_submissions')
    .select('user_id')
    .eq('batch_id', batchId)
    .in('status', ['approved', 'submitted']);

  const totalThalibah = daftarUlangSubmissions?.length || 0;
  const thalibahIds = new Set(daftarUlangSubmissions?.map((d: any) => d.user_id) || []);
  const jurnalUserIds = new Set(jurnalRecords.map((r: any) => r.user_id));

  // Count blocks completed
  const totalBlocksCompleted = jurnalRecords.reduce((count: number, record: any) => {
    if (record.blok) {
      // blok can be comma-separated string or array
      const blocks = typeof record.blok === 'string'
        ? record.blok.split(',').filter((b: string) => b.trim())
        : (Array.isArray(record.blok) ? record.blok : []);
      return count + blocks.length;
    }
    return count;
  }, 0);

  // Total expected blocks (40 blocks per thalibah: 4 blocks/week * 10 weeks)
  const totalExpectedBlocks = totalThalibah * 40;

  // Get this week's entries (current week)
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const thisWeekEntries = jurnalRecords.filter((r: any) => {
    const tanggal = new Date(r.tanggal_setor);
    return tanggal >= startOfWeek && tanggal <= endOfWeek;
  }).length;

  return {
    totalEntries: jurnalRecords.length,
    uniqueThalibah: jurnalUserIds.size,
    thalibahWithJurnal: jurnalUserIds.size,
    thalibahWithoutJurnal: Math.max(0, totalThalibah - jurnalUserIds.size),
    averageEntriesPerThalibah: totalThalibah > 0 ? (jurnalRecords.length / totalThalibah) : 0,
    weeksWithJurnal: 0, // Could be calculated from weekly data
    totalBlocksCompleted: totalBlocksCompleted,
    completionPercentage: totalExpectedBlocks > 0 ? Math.round((totalBlocksCompleted / totalExpectedBlocks) * 100) : 0,
    thisWeekEntries: thisWeekEntries,
  };
}

async function calculateTashihStats(supabase: any, batchId: string) {
  // Get all tashih records for this batch
  const { data: tashihRecords, error } = await supabase
    .from('tashih_records')
    .select('user_id, blok, waktu_tashih')
    .eq('batch_id', batchId);

  if (error || !tashihRecords || tashihRecords.length === 0) {
    return {
      totalRecords: 0,
      uniqueThalibah: 0,
      thalibahWithTashih: 0,
      thalibahWithoutTashih: 0,
      averageRecordsPerThalibah: 0,
      totalBlocksCompleted: 0,
      totalBlocks: 0,
      completionPercentage: 0,
      thisWeekRecords: 0,
    };
  }

  // Calculate unique thalibah from daftar_ulang_submissions
  const { data: daftarUlangSubmissions } = await supabase
    .from('daftar_ulang_submissions')
    .select('user_id')
    .eq('batch_id', batchId)
    .in('status', ['approved', 'submitted']);

  const totalThalibah = daftarUlangSubmissions?.length || 0;
  const thalibahIds = new Set(daftarUlangSubmissions?.map((d: any) => d.user_id) || []);
  const tashihUserIds = new Set(tashihRecords.map((r: any) => r.user_id));

  // Count blocks completed
  const totalBlocksCompleted = tashihRecords.reduce((count: number, record: any) => {
    if (record.blok) {
      // blok is comma-separated string in tashih_records
      const blocks = typeof record.blok === 'string'
        ? record.blok.split(',').filter((b: string) => b.trim())
        : (Array.isArray(record.blok) ? record.blok : []);
      return count + blocks.length;
    }
    return count;
  }, 0);

  // Total expected blocks (40 blocks per thalibah: 4 blocks/week * 10 weeks)
  const totalExpectedBlocks = totalThalibah * 40;

  // Get this week's records (current week)
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const thisWeekRecords = tashihRecords.filter((r: any) => {
    const waktu = new Date(r.waktu_tashih);
    return waktu >= startOfWeek && waktu <= endOfWeek;
  }).length;

  return {
    totalRecords: tashihRecords.length,
    uniqueThalibah: tashihUserIds.size,
    thalibahWithTashih: tashihUserIds.size,
    thalibahWithoutTashih: Math.max(0, totalThalibah - tashihUserIds.size),
    averageRecordsPerThalibah: totalThalibah > 0 ? (tashihRecords.length / totalThalibah) : 0,
    totalBlocksCompleted: totalBlocksCompleted,
    totalBlocks: totalExpectedBlocks,
    completionPercentage: totalExpectedBlocks > 0 ? Math.round((totalBlocksCompleted / totalExpectedBlocks) * 100) : 0,
    thisWeekRecords: thisWeekRecords,
  };
}
