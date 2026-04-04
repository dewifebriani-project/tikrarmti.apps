import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin, getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';
import { auditBatchOperation, getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';
import { adminRateLimit } from '@/lib/rate-limiter';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: Request) {
  try {
    // 1. Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    // 2. Rate limit
    if (adminRateLimit) {
      const { success } = await adminRateLimit.limit(`admin:batches:${context.userId}`);
      if (!success) return ApiResponses.rateLimit('Terlalu banyak permintaan.');
    }

    // 3. Parse parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.max(Math.min(parseInt(searchParams.get('limit') || '50'), 100), 1);
    const offset = (page - 1) * limit;
    const rawStatus = searchParams.get('status');
    const VALID_BATCH_STATUSES = ['draft', 'open', 'ongoing', 'closed', 'archived'] as const;
    const status = rawStatus && VALID_BATCH_STATUSES.includes(rawStatus as any) ? rawStatus : null;

    // 4. Query
    let query = supabaseAdmin
      .from('batches')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: batches, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('[Admin Batches API] Query error:', error);
      return ApiResponses.databaseError(error);
    }

    // Enrich with program counts
    const batchIds = batches?.map(b => b.id) || [];
    const programCounts = batchIds.length > 0 ? await Promise.all(
      batchIds.map(async (batchId) => {
        const { count } = await supabaseAdmin
          .from('programs')
          .select('*', { count: 'estimated', head: true })
          .eq('batch_id', batchId);
        return { batchId, count: count || 0 };
      })
    ) : [];

    const enrichedData = batches?.map((batch: any) => ({
      ...batch,
      program_count: programCounts.find(pc => pc.batchId === batch.id)?.count || 0,
    })) || [];

    // 5. Audit log
    await logAudit({
      userId: context.userId,
      action: 'READ',
      resource: 'batches',
      details: { count: enrichedData.length, page, limit, status_filter: status || 'all' },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return ApiResponses.paginated(enrichedData, {
      page,
      limit,
      total: count || 0
    }, undefined, 200);

  } catch (error) {
    console.error('[Admin Batches API] Unexpected error (GET):', error);
    return ApiResponses.handleUnknown(error);
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    // 2. Rate limit
    if (adminRateLimit) {
      const { success } = await adminRateLimit.limit(`admin:batches:${context.userId}`);
      if (!success) return ApiResponses.rateLimit('Terlalu banyak permintaan.');
    }

    const body = await request.json();

    // 3. Validation
    if (!body.name || !body.start_date || !body.end_date) {
      return ApiResponses.customValidationError([{ field: 'general', message: 'Missing required fields: name, start_date, end_date', code: 'REQUIRED' }]);
    }

    const toDateOrNull = (value: any) => (value === '' || value === null || value === undefined) ? null : value;

    // 4. Prepare data
    const batchData: any = {
      name: body.name,
      description: body.description || null,
      start_date: body.start_date,
      end_date: body.end_date,
      registration_start_date: toDateOrNull(body.registration_start_date),
      registration_end_date: toDateOrNull(body.registration_end_date),
      status: body.status || 'draft',
      duration_weeks: body.duration_weeks || 13,
      program_type: body.program_type || null,
      total_quota: body.total_quota || 100,
      is_free: body.is_free ?? true,
      price: body.price || 0,
      selection_start_date: toDateOrNull(body.selection_start_date),
      selection_end_date: toDateOrNull(body.selection_end_date),
      selection_result_date: toDateOrNull(body.selection_result_date),
      re_enrollment_date: toDateOrNull(body.re_enrollment_date),
      opening_class_date: toDateOrNull(body.opening_class_date),
      first_week_start_date: toDateOrNull(body.first_week_start_date),
      first_week_end_date: toDateOrNull(body.first_week_end_date),
      review_week_start_date: toDateOrNull(body.review_week_start_date),
      review_week_end_date: toDateOrNull(body.review_week_end_date),
      final_exam_start_date: toDateOrNull(body.final_exam_start_date),
      final_exam_end_date: toDateOrNull(body.final_exam_end_date),
      graduation_start_date: toDateOrNull(body.graduation_start_date),
      graduation_end_date: toDateOrNull(body.graduation_end_date),
      holiday_dates: body.holiday_dates || [],
    };

    if (body.id) {
      batchData.id = body.id;
    } else {
      batchData.registered_count = 0;
    }

    // 5. Upsert
    const { data: result, error: insertError } = await supabaseAdmin
      .from('batches')
      .upsert(batchData)
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('[Admin Batches API] Upsert error:', insertError);
      await logAudit({
        userId: context.userId,
        action: body.id ? 'UPDATE' : 'CREATE',
        resource: 'batches',
        details: { batch_id: body.id, name: body.name, error: insertError.message },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        level: 'ERROR'
      });
      return ApiResponses.databaseError(insertError);
    }

    // 6. Audit operation
    await auditBatchOperation(
      context.userId,
      body.id ? 'UPDATE' : 'CREATE',
      result.id,
      result.name,
      { status: result.status, start_date: result.start_date },
      request
    );

    revalidatePath('/panel-admin/batches');

    return ApiResponses.success(result, body.id ? 'Batch berhasil diperbarui' : 'Batch berhasil dibuat', body.id ? 200 : 201);

  } catch (error) {
    console.error('[Admin Batches API] Unexpected error (POST):', error);
    return ApiResponses.handleUnknown(error);
  }
}
