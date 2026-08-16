import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin, getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';
import { adminRateLimit } from '@/lib/rate-limiter';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    // 2. Rate limit
    if (adminRateLimit) {
      const { success } = await adminRateLimit.limit(`admin:mutasi:${context.userId}`);
      if (!success) return ApiResponses.rateLimit('Terlalu banyak permintaan.');
    }

    const { id } = params;
    const body = await request.json();
    const { action } = body; // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return ApiResponses.badRequest('Aksi tidak valid (harus approve atau reject)');
    }

    // 3. Fetch request
    const { data: transferReq, error: reqError } = await supabaseAdmin
      .from('transfer_schedule_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (reqError || !transferReq) {
      return ApiResponses.notFound('Pengajuan tidak ditemukan atau sudah diproses.');
    }

    if (action === 'reject') {
      const { error: updateError } = await supabaseAdmin
        .from('transfer_schedule_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
    } else if (action === 'approve') {
      // Begin transaction-like operations

      // 1. Check target halaqah quota
      const { data: targetHalaqah } = await supabaseAdmin
        .from('halaqah')
        .select(`
          max_students,
          students:halaqah_students(id, status)
        `)
        .eq('id', transferReq.to_halaqah_id)
        .single();

      if (!targetHalaqah) return ApiResponses.notFound('Halaqah tujuan tidak ditemukan.');

      const activeCount = targetHalaqah.students?.filter((s: any) => s.status === 'active').length || 0;
      if (activeCount >= (targetHalaqah.max_students || 999)) {
        return ApiResponses.badRequest('Halaqah tujuan sudah penuh.');
      }

      // 2. Find registration ID
      const { data: studentReg } = await supabaseAdmin
        .from('daftar_ulang_submissions')
        .select('id')
        .eq('user_id', transferReq.user_id)
        .eq('batch_id', transferReq.batch_id)
        .eq('program_id', transferReq.program_id)
        .single();

      if (!studentReg) {
        return ApiResponses.badRequest('Data daftar ulang (registration) tidak ditemukan.');
      }

      // 3. Delete from old halaqah if any
      if (transferReq.from_halaqah_id) {
        await supabaseAdmin
          .from('halaqah_students')
          .delete()
          .eq('halaqah_id', transferReq.from_halaqah_id)
          .eq('student_id', studentReg.id)
          .eq('user_id', transferReq.user_id);
      } else {
        // Just in case they are enrolled in any other active halaqah in this program
        const { data: existingEnrolls } = await supabaseAdmin
          .from('halaqah_students')
          .select('id, halaqah_id')
          .eq('student_id', studentReg.id)
          .eq('user_id', transferReq.user_id)
          .eq('status', 'active');
          
        if (existingEnrolls && existingEnrolls.length > 0) {
          for (const enroll of existingEnrolls) {
            await supabaseAdmin
              .from('halaqah_students')
              .delete()
              .eq('id', enroll.id);
          }
        }
      }

      // 4. Insert to new halaqah
      const { error: insertError } = await supabaseAdmin
        .from('halaqah_students')
        .insert({
          halaqah_id: transferReq.to_halaqah_id,
          student_id: studentReg.id,
          user_id: transferReq.user_id,
          status: 'active'
        });

      if (insertError) throw insertError;

      // 5. Update submission reference
      await supabaseAdmin
        .from('daftar_ulang_submissions')
        .update({ halaqah_id: transferReq.to_halaqah_id })
        .eq('id', studentReg.id);

      // 6. Mark request as approved
      await supabaseAdmin
        .from('transfer_schedule_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    // Audit log
    await logAudit({
      userId: context.userId,
      action: 'UPDATE',
      resource: 'transfer_schedule_requests',
      details: { request_id: id, action },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return ApiResponses.success({ message: `Pengajuan berhasil di${action === 'approve' ? 'setujui' : 'tolak'}` });
  } catch (error) {
    console.error('[Admin Mutasi API] Error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
