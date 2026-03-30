import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, requireAdmin } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

const supabaseAdmin = createSupabaseAdmin();

/**
 * GET /api/halaqah
 * 
 * List all halaqah with filters and enriched student counts.
 */
export async function GET(request: Request) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const queryBatchId = searchParams.get('batch_id');
    const programId = searchParams.get('program_id');
    const muallimahId = searchParams.get('muallimah_id');
    const preferredJuz = searchParams.get('preferred_juz');

    const supabase = createServerClient();

    let query = supabase
      .from('halaqah')
      .select(`
        *,
        program:programs(*, batch:batches(*)),
        muallimah:users!left(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    const VALID_HALAQAH_STATUSES = ['active', 'inactive', 'suspended'];
    if (status && VALID_HALAQAH_STATUSES.includes(status)) query = query.eq('status', status);
    if (queryBatchId) query = query.eq('program.batch_id', queryBatchId);
    if (programId) query = query.eq('program_id', programId);
    if (muallimahId) query = query.eq('muallimah_id', muallimahId);
    if (preferredJuz) query = query.eq('preferred_juz', preferredJuz);

    const { data: halaqah, error } = await query;

    if (error) {
      console.error('[Halaqah API] Database error (GET):', error);
      return ApiResponses.databaseError(error);
    }

    // Enrich with student counts using admin client for data integrity
    const enrichedData = await Promise.all(
      (halaqah || []).map(async (h: any) => {
        // Count active students
        const { count: activeCount } = await supabaseAdmin
          .from('halaqah_students')
          .select('*', { count: 'exact', head: true })
          .eq('halaqah_id', h.id)
          .eq('status', 'active');

        // Count waitlist students
        const { count: waitlistCount } = await supabaseAdmin
          .from('halaqah_students')
          .select('*', { count: 'exact', head: true })
          .eq('halaqah_id', h.id)
          .eq('status', 'waitlist');

        // Count submissions (pending/approved)
        const { data: submissions } = await supabaseAdmin
          .from('daftar_ulang_submissions')
          .select('user_id, status')
          .in('status', ['submitted', 'approved', 'draft'])
          .or(`ujian_halaqah_id.eq.${h.id},tashih_halaqah_id.eq.${h.id}`);

        const uniqueSubmissions = new Set(submissions?.filter(s => s.status !== 'draft').map(s => s.user_id) || []);
        const uniqueDrafts = new Set(submissions?.filter(s => s.status === 'draft').map(s => s.user_id) || []);

        return {
          ...h,
          students_count: (activeCount || 0) + uniqueSubmissions.size,
          waitlist_count: waitlistCount || 0,
          quota_details: {
            active: activeCount || 0,
            waitlist: waitlistCount || 0,
            submitted: uniqueSubmissions.size,
            draft: uniqueDrafts.size,
            total_used: (activeCount || 0) + uniqueSubmissions.size
          }
        };
      })
    );

    return ApiResponses.success(enrichedData);
  } catch (error) {
    console.error('[Halaqah API] Unexpected error (GET):', error);
    return ApiResponses.handleUnknown(error);
  }
}

/**
 * POST /api/halaqah
 * 
 * Create new halaqah. Restricted to admins.
 */
export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const {
      program_id,
      muallimah_id,
      name,
      description,
      day_of_week,
      start_time,
      end_time,
      preferred_juz,
      max_students,
      max_thalibah_override,
      waitlist_max = 5,
      location,
      status = 'active'
    } = body;

    if (!program_id || !muallimah_id || !name || day_of_week === undefined || !start_time || !end_time) {
      return ApiResponses.customValidationError([{ field: 'general', message: 'Missing required fields', code: 'REQUIRED' }]);
    }

    const supabase = createServerClient();

    const { data: newHalaqah, error } = await supabase
      .from('halaqah')
      .insert({
        program_id,
        muallimah_id,
        name,
        description,
        day_of_week,
        start_time,
        end_time,
        preferred_juz,
        max_students: max_thalibah_override || max_students,
        max_thalibah_override,
        waitlist_max,
        location,
        status
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[Halaqah API] Database error (POST):', error);
      return ApiResponses.databaseError(error);
    }

    // Assign muallimah as primary mentor
    await supabase.from('halaqah_mentors').insert({
      halaqah_id: newHalaqah.id,
      mentor_id: muallimah_id,
      role: 'ustadzah',
      is_primary: true
    });

    return ApiResponses.success(newHalaqah, 'Halaqah berhasil dibuat', 201);
  } catch (error) {
    console.error('[Halaqah API] Unexpected error (POST):', error);
    return ApiResponses.handleUnknown(error);
  }
}
