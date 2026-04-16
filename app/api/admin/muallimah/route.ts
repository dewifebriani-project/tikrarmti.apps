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

    // Fetch muallimah data with admin client (bypasses RLS)
    console.log('Starting muallimah data fetch at', new Date().toISOString());

    // Since user_id references auth.users, we need to fetch user data separately
    // or use the full_name and email stored in muallimah_registrations
    let query = supabaseAdmin
      .from('muallimah_registrations')
      .select(`
        *,
        batch:batches(name)
      `)
      .order('submitted_at', { ascending: false });

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

    // Get total count for pagination
    let totalCount = data?.length || 0;
    if (!skipCount) {
      let countQuery = supabaseAdmin
        .from('muallimah_registrations')
        .select('*', { count: 'estimated', head: true });

      if (batchId && batchId !== 'all') {
        countQuery = countQuery.eq('batch_id', batchId);
      }

      if (userIdArg) {
        countQuery = countQuery.eq('user_id', userIdArg);
      }

      const { count } = await countQuery;
      totalCount = count || 0;
      console.log('Total count:', totalCount);
    }

    return ApiResponses.success({
      data: data || [],
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
