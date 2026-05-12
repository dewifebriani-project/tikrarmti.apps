import { NextRequest } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    // 1. Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const skipCount = searchParams.get('skipCount') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 1000);
    const offset = (page - 1) * limit;
    const batchId = searchParams.get('batchId');
    const userIdArg = searchParams.get('userId');

    // Fetch from muallimah_akads (the batch contract)
    // Joined with muallimah_registrations (the profile)
    // We join on user_id
    let query = supabaseAdmin
      .from('muallimah_akads')
      .select(`
        *,
        profile:muallimah_registrations!inner(*),
        batch:batches(name)
      `)
      .order('akad_signed_at', { ascending: false });

    // Filter by batch if specified
    if (batchId && batchId !== 'all') {
      query = query.eq('batch_id', batchId);
    }

    // Filter by user if specified
    if (userIdArg) {
      query = query.eq('user_id', userIdArg);
    }

    // Only apply range if NOT skipping count
    if (!skipCount) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Muallimah API] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    // Map data to maintain backward compatibility if needed, 
    // or just pass it as is to the new MuallimahTab
    const mappedData = data?.map(item => ({
      ...item.profile,
      ...item, // Akad data overrides profile data for fields like status, preferred_juz, etc.
      id: item.id, // Use akad ID as primary
      profile_id: item.profile?.id,
      batch: item.batch,
    })) || [];

    // Get total count for pagination
    let totalCount = mappedData.length;
    if (!skipCount) {
      let countQuery = supabaseAdmin
        .from('muallimah_akads')
        .select('*', { count: 'estimated', head: true });

      if (batchId && batchId !== 'all') {
        countQuery = countQuery.eq('batch_id', batchId);
      }

      if (userIdArg) {
        countQuery = countQuery.eq('user_id', userIdArg);
      }

      const { count } = await countQuery;
      totalCount = count || 0;
    }

    return ApiResponses.success({
      data: mappedData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('[Muallimah API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
