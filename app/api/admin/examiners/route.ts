import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    // Fetch all users with 'muallimah' in their roles array
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .contains('roles', ['muallimah'])
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
