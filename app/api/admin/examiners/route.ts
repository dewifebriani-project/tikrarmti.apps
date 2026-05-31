import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    // 1. Get all approved muallimah from registrations
    const { data: regs } = await supabaseAdmin
      .from('muallimah_registrations')
      .select('user_id')
      .eq('status', 'approved');

    // 2. Get all muallimah from halaqah
    const { data: halaqahs } = await supabaseAdmin
      .from('halaqah')
      .select('muallimah_id')
      .not('muallimah_id', 'is', null);

    // 3. Combine unique IDs
    const userIds = new Set<string>();
    regs?.forEach((r: any) => userIds.add(r.user_id));
    halaqahs?.forEach((h: any) => userIds.add(h.muallimah_id));

    if (userIds.size === 0) {
      return ApiResponses.success([]);
    }

    // 4. Fetch user details
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .in('id', Array.from(userIds))
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
