import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminAPI } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit-log';

export async function POST(request: Request) {
  try {
    const adminAuth = await checkAdminAPI();
    if (!adminAuth.isAuthenticated || !adminAuth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active batch
    const { data: activeBatch } = await supabaseAdmin
      .from('batches')
      .select('id, name')
      .eq('is_active', true)
      .single();

    if (!activeBatch) {
      return NextResponse.json({ error: 'Tidak ada batch yang aktif' }, { status: 400 });
    }

    // Get config for passing score
    const { data: config } = await supabaseAdmin
      .from('exam_configurations')
      .select('passing_score')
      .eq('is_active', true)
      .single();

    const passingScore = config?.passing_score || 80;

    // Find all users in active batch who haven't passed the exam (and target is not 30A)
    const { data: pendaftarans, error: fetchError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        id, 
        user_id, 
        chosen_juz, 
        exam_score, 
        exam_status
      `)
      .eq('batch_id', activeBatch.id)
      .not('chosen_juz', 'eq', '30A');

    if (fetchError) {
      throw fetchError;
    }

    const toDowngrade = pendaftarans.filter(p => p.exam_score === null || p.exam_score < passingScore);

    if (toDowngrade.length === 0) {
      return NextResponse.json({ 
        message: 'Tidak ada thalibah yang perlu di-downgrade.',
        downgradedCount: 0
      });
    }

    // Start processing
    let successCount = 0;
    let failedCount = 0;

    for (const p of toDowngrade) {
      try {
        // 1. Update pendaftaran
        const { error: updatePendaftaranError } = await supabaseAdmin
          .from('pendaftaran_tikrar_tahfidz')
          .update({
            chosen_juz: '30A',
            exam_status: 'completed',
          })
          .eq('id', p.id);

        if (updatePendaftaranError) throw updatePendaftaranError;

        // 2. Update daftar_ulang_submissions if exists
        await supabaseAdmin
          .from('daftar_ulang_submissions')
          .update({
            confirmed_chosen_juz: '30A'
          })
          .eq('registration_id', p.id);

        successCount++;
      } catch (err) {
        logger.error(`Failed to downgrade user ${p.user_id}`, { error: err as Error });
        failedCount++;
      }
    }

    // Log the bulk action
    await logAudit({
      user_id: adminAuth.user.id,
      action: 'BULK_FINALIZE_EXAMS',
      entity_type: 'pendaftaran_tikrar_tahfidz',
      entity_id: activeBatch.id, // using batch id as reference
      details: {
        batchName: activeBatch.name,
        targetDowngradeCount: toDowngrade.length,
        successCount,
        failedCount,
        passingScore
      }
    });

    return NextResponse.json({
      message: `Berhasil men-downgrade ${successCount} thalibah ke Juz 30A. (Gagal: ${failedCount})`,
      downgradedCount: successCount
    });

  } catch (error) {
    logger.error('Error in POST /api/admin/daftar-ulang/finalize-exams', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
