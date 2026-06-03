import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

const supabaseAdmin = createSupabaseAdmin();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    // 1. Get all approved muallimah from V1 registrations
    const { data: regs } = await supabaseAdmin
      .from('muallimah_registrations')
      .select('user_id')
      .eq('status', 'approved');

    // 2. Get all approved muallimah from V2 akads
    const { data: akads } = await supabaseAdmin
      .from('muallimah_akads')
      .select('user_id')
      .eq('status', 'approved');

    const userIdsSet = new Set<string>();
    regs?.forEach((r: any) => userIdsSet.add(r.user_id));
    akads?.forEach((a: any) => userIdsSet.add(a.user_id));

    if (userIdsSet.size === 0) {
      return ApiResponses.success([]);
    }

    const userIds = Array.from(userIdsSet);

    // 2. Fetch user details
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .in('id', userIds)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('[Examiners API] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    return ApiResponses.success(users);
  } catch (error) {
    console.error('[Examiners API] Server error:', error);
    return ApiResponses.serverError('Failed to fetch examiners');
  }
}
