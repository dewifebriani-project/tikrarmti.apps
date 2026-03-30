import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

/**
 * @deprecated Use `requireAdmin()` from `@/lib/rbac` instead.
 * This function is kept for backward compatibility only.
 *
 * Require admin authentication for API routes.
 * Uses `roles` array (not deprecated single `role` field).
 */
export async function requireAdmin(request: NextRequest) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Use admin client to bypass RLS for role lookup
  const adminClient = createSupabaseAdmin();
  const { data: userData } = await adminClient
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin =
    userData?.roles?.includes('admin') ||
    user.app_metadata?.roles?.includes('admin');

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  // Return void to indicate success
  return;
}

/**
 * Require authentication for API routes
 * @param request NextRequest object
 * @returns NextResponse if unauthorized, void otherwise
 */
export async function requireAuth(request: NextRequest) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return;
}
