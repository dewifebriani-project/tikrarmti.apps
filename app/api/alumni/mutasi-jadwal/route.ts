import { createSupabaseAdmin } from '@/lib/supabase';
import { getAuthorizationContext, requireAuth } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';
import { generalApiRateLimit } from '@/lib/rate-limiter';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: Request) {
  try {
    // 1. Authorization check
    const authError = await requireAuth();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    // 2. Rate limit
    if (generalApiRateLimit) {
      const { success } = await generalApiRateLimit.limit(`alumni:mutasi:${context.userId}`);
      if (!success) return ApiResponses.rateLimit('Terlalu banyak permintaan. Coba lagi nanti.');
    }

    const body = await request.json();
    const { batch_id, program_id, from_halaqah_id, to_halaqah_id } = body;

    if (!batch_id || !program_id || !to_halaqah_id) {
      return ApiResponses.customValidationError([
        { field: 'general', message: 'Missing required fields', code: 'REQUIRED' }
      ]);
    }

    // 3. Check if there's already a pending request
    const { data: existingRequest } = await supabaseAdmin
      .from('transfer_schedule_requests')
      .select('id')
      .eq('user_id', context.userId)
      .eq('batch_id', batch_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      return ApiResponses.badRequest('Anda sudah memiliki pengajuan pindah jadwal yang sedang diproses.');
    }

    // 4. Verify batch timeline
    const { data: batch } = await supabaseAdmin
      .from('batches')
      .select('transfer_schedule_end_date')
      .eq('id', batch_id)
      .single();

    if (!batch || !batch.transfer_schedule_end_date || new Date() > new Date(batch.transfer_schedule_end_date)) {
      return ApiResponses.badRequest('Periode pindah jadwal untuk batch ini sudah ditutup.');
    }

    // 5. Check target halaqah quota
    const { data: targetHalaqah } = await supabaseAdmin
      .from('halaqah')
      .select(`
        max_students,
        students:halaqah_students(id, status)
      `)
      .eq('id', to_halaqah_id)
      .single();

    if (!targetHalaqah) {
      return ApiResponses.notFound('Halaqah tujuan tidak ditemukan.');
    }

    const activeCount = targetHalaqah.students?.filter((s: any) => s.status === 'active').length || 0;
    if (activeCount >= (targetHalaqah.max_students || 999)) {
      return ApiResponses.badRequest('Halaqah tujuan sudah penuh.');
    }

    // 6. Insert request
    const { data: newRequest, error } = await supabaseAdmin
      .from('transfer_schedule_requests')
      .insert({
        user_id: context.userId,
        batch_id,
        program_id,
        from_halaqah_id: from_halaqah_id || null,
        to_halaqah_id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // 7. Audit log
    await logAudit({
      userId: context.userId,
      action: 'CREATE',
      resource: 'transfer_schedule_requests',
      details: { request_id: newRequest.id, from_halaqah_id, to_halaqah_id },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return ApiResponses.success(newRequest, 'Mutasi jadwal berhasil diajukan', 201);
  } catch (error) {
    console.error('[Mutasi Jadwal API] Error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
