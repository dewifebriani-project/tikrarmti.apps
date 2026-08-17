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

      // 2. Find daftar ulang submission (no program_id column, use batch_id only)
      const { data: studentReg } = await supabaseAdmin
        .from('daftar_ulang_submissions')
        .select('id')
        .eq('user_id', transferReq.user_id)
        .eq('batch_id', transferReq.batch_id)
        .maybeSingle();

      if (!studentReg) {
        return ApiResponses.badRequest('Data daftar ulang tidak ditemukan.');
      }

      // 3. Delete from old halaqah (uses thalibah_id, not user_id/student_id)
      if (transferReq.from_halaqah_id) {
        await supabaseAdmin
          .from('halaqah_students')
          .delete()
          .eq('halaqah_id', transferReq.from_halaqah_id)
          .eq('thalibah_id', transferReq.user_id);
      } else {
        // Remove from any active halaqah enrolment for this user
        const { data: existingEnrolls } = await supabaseAdmin
          .from('halaqah_students')
          .select('id, halaqah_id')
          .eq('thalibah_id', transferReq.user_id)
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
          thalibah_id: transferReq.user_id,
          assigned_by: context.userId,
          status: 'active'
        });

      if (insertError) throw insertError;

      // 5. Update ujian & tashih halaqah reference in submission
      await supabaseAdmin
        .from('daftar_ulang_submissions')
        .update({
          ujian_halaqah_id: transferReq.to_halaqah_id,
          tashih_halaqah_id: transferReq.to_halaqah_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentReg.id);

      // 6. Mark request as approved
      await supabaseAdmin
        .from('transfer_schedule_requests')
        .update({
          status: 'approved',
          reviewed_by: context.userId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
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
