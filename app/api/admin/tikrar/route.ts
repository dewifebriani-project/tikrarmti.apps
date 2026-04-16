import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin, getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

const supabaseAdmin = createSupabaseAdmin();

/**
 * GET /api/admin/tikrar
 * 
 * Lists Tikrar registrations with enrichment and automated selection processing.
 */
export async function GET(request: Request) {
  try {
    // 1. Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const skipCount = searchParams.get('skipCount') === 'true';
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.max(Math.min(parseInt(searchParams.get('limit') || '1000'), 1000), 1);
    const offset = (page - 1) * limit;

    // 3. Fetch base registrations
    let query = supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*', { count: skipCount ? undefined : 'exact' })
      .order('submission_date', { ascending: false });

    if (!skipCount) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: rawData, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('[Admin Tikrar API] Database error (GET):', fetchError);
      return ApiResponses.databaseError(fetchError);
    }

    if (!rawData || rawData.length === 0) {
      return ApiResponses.success([], 'No records found');
    }

    // 4. Enrichment: Fetch exam attempts for written scores
    const registrationIds = rawData.map((r: any) => r.id);
    const { data: examAttempts } = await supabaseAdmin
      .from('exam_attempts')
      .select('id, registration_id, score, status, submitted_at, created_at')
      .in('registration_id', registrationIds)
      .order('created_at', { ascending: false });

    const latestAttemptsMap = new Map();
    if (examAttempts) {
      for (const attempt of examAttempts) {
        if (!latestAttemptsMap.has(attempt.registration_id)) {
          latestAttemptsMap.set(attempt.registration_id, attempt);
        }
      }
    }

    let enrichedData = rawData.map((tikrar: any) => {
      const examAttempt = latestAttemptsMap.get(tikrar.id);
      return {
        ...tikrar,
        written_quiz_score: examAttempt?.score ?? tikrar.written_quiz_score,
        written_exam_submitted_at: examAttempt?.submitted_at ?? tikrar.written_exam_submitted_at,
        written_exam_status: examAttempt?.status ?? tikrar.written_exam_status,
      };
    });

    // 5. Automated Selection Processing (Lazy Updates)
    const updates: string[] = [];
    for (const tikrar of enrichedData) {
      const oralScore = tikrar.oral_total_score;
      const writtenScore = tikrar.written_quiz_score;

      const isJuz30 = tikrar.chosen_juz?.toLowerCase().includes('30');

      const hasPassingScore = isJuz30
        ? (oralScore !== null && oralScore !== undefined && oralScore >= 70)
        : (oralScore !== null && oralScore !== undefined && oralScore >= 70 &&
           writtenScore !== null && writtenScore !== undefined && writtenScore >= 70);

      if (hasPassingScore && tikrar.selection_status === 'pending') {
        updates.push(tikrar.id);
      }
    }

    if (updates.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .update({ selection_status: 'selected' })
        .in('id', updates);

      if (!updateError) {
        enrichedData = enrichedData.map((item: any) => {
          if (updates.includes(item.id)) {
            return { ...item, selection_status: 'selected' };
          }
          return item;
        });
      }
    }

    return ApiResponses.success({
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: count || rawData.length,
        totalPages: Math.ceil((count || rawData.length) / limit)
      }
    });

  } catch (error) {
    console.error('[Admin Tikrar API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}