import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin, getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: Request) {
  try {
    // 1. Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.max(Math.min(parseInt(searchParams.get('limit') || '50'), 100), 1);
    const offset = (page - 1) * limit;
    const rawStatus = searchParams.get('status');
    const VALID_PROGRAM_STATUSES = ['draft', 'open', 'ongoing', 'completed', 'cancelled'] as const;
    const status = rawStatus && rawStatus !== 'all' && VALID_PROGRAM_STATUSES.includes(rawStatus as any) ? rawStatus : null;
    const batchId = searchParams.get('batch_id');

    // 3. Build query for programs
    let query = supabaseAdmin
      .from('programs')
      .select(`
        *,
        batch:batches(id, name, start_date, end_date, status)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (batchId && batchId !== 'all') query = query.eq('batch_id', batchId);

    const { data: programs, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('[Admin Programs API] Query error (GET):', error);
      return ApiResponses.databaseError(error);
    }

    // 4. Enrich data with registration counts
    const programIds = programs?.map(p => p.id) || [];
    const registrationCounts = programIds.length > 0 ? await Promise.all(
      programIds.map(async (programId) => {
        const { count: tikrarCount } = await supabaseAdmin
          .from('pendaftaran_tikrar_tahfidz')
          .select('*', { count: 'estimated', head: true })
          .eq('program_id', programId);

        const currentProgram = programs?.find(p => p.id === programId);
        
        const { count: muallimahCount } = await supabaseAdmin
          .from('muallimah_registrations')
          .select('*', { count: 'estimated', head: true })
          .eq('batch_id', currentProgram?.batch_id);

        const { count: musyrifahCount } = await supabaseAdmin
          .from('musyrifah_registrations')
          .select('*', { count: 'estimated', head: true })
          .eq('batch_id', currentProgram?.batch_id);

        return {
          programId,
          tikrar_count: tikrarCount || 0,
          muallimah_count: muallimahCount || 0,
          musyrifah_count: musyrifahCount || 0,
          total_count: (tikrarCount || 0) + (muallimahCount || 0) + (musyrifahCount || 0)
        };
      })
    ) : [];

    const enrichedData = programs?.map(program => {
      const counts = registrationCounts.find(rc => rc.programId === program.id);
      return {
        ...program,
        registration_count: counts?.total_count || 0,
        tikrar_count: counts?.tikrar_count || 0,
        muallimah_count: counts?.muallimah_count || 0,
        musyrifah_count: counts?.musyrifah_count || 0,
        max_students: program.max_thalibah || 30,
        enrollment_percentage: program.max_thalibah
          ? Math.round(((counts?.total_count || 0) / program.max_thalibah) * 100)
          : null
      };
    }) || [];

    return ApiResponses.success(enrichedData, undefined, 200, {
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('[Admin Programs API] Unexpected error (GET):', error);
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

    const body = await request.json();

    // 2. Validate required fields
    if (!body.batch_id || !body.name) {
      return ApiResponses.customValidationError([{ field: 'general', message: 'Missing required fields: batch_id, name', code: 'REQUIRED' }]);
    }

    // 3. Verify batch exists
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('id')
      .eq('id', body.batch_id)
      .maybeSingle();

    if (batchError || !batch) return ApiResponses.notFound('Batch not found');

    // 4. Upsert program
    const { data: result, error: insertError } = await supabaseAdmin
      .from('programs')
      .upsert({
        id: body.id,
        batch_id: body.batch_id,
        name: body.name,
        description: body.description,
        target_level: body.target_level,
        duration_weeks: body.duration_weeks || 13,
        max_thalibah: body.max_thalibah || 30,
        status: body.status || 'draft',
        is_free: body.is_free ?? true,
        price: body.price || 0,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('[Admin Programs API] Upsert error (POST):', insertError);
      return ApiResponses.databaseError(insertError);
    }

    revalidatePath('/panel-admin/programs');

    return ApiResponses.success(result, body.id ? 'Program berhasil diperbarui' : 'Program berhasil dibuat', body.id ? 200 : 201);

  } catch (error) {
    console.error('[Admin Programs API] Unexpected error (POST):', error);
    return ApiResponses.handleUnknown(error);
  }
}
