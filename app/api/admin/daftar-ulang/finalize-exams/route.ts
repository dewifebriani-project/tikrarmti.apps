import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logger';
import { logAudit } from '@/lib/audit-log';

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!user || !adminRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdmin();

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
        logError(err as Error, { context: `Failed to downgrade user ${p.user_id}` });
        failedCount++;
      }
    }

    // Log the bulk action
    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      resource: 'pendaftaran_tikrar_tahfidz',
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
    logError(error as Error, { context: 'Error in POST /api/admin/daftar-ulang/finalize-exams' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
