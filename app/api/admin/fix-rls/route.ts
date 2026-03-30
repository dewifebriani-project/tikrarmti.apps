import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { ApiResponses } from '@/lib/api-responses'

/**
 * FIX RLS POLICIES
 *
 * This endpoint fixes RLS policies to allow admins to access user data.
 * Must be called by an admin user.
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const supabaseAdmin = createSupabaseAdmin()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return ApiResponses.unauthorized('Please login first')
    }

    // Get user data from database to check admin role
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.roles?.includes?.('admin') || false

    if (!isAdmin) {
      return ApiResponses.forbidden('This endpoint is for admin users only')
    }

    // Step 1: Drop existing policies
    await supabaseAdmin.rpc('query', {
      sql: `
        DROP POLICY IF EXISTS users_select_admin ON public.users;
        DROP POLICY IF EXISTS users_select_own ON public.users;
        DROP POLICY IF EXISTS users_update_own ON public.users;
      `
    })

    // Step 2: Create new policies with proper admin check
    await supabaseAdmin.rpc('query', {
      sql: `
        CREATE POLICY users_select_own ON public.users
          FOR SELECT
          USING (auth.uid() = id);
      `
    })

    await supabaseAdmin.rpc('query', {
      sql: `
        CREATE POLICY users_select_admin ON public.users
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE id = auth.uid()
              AND 'admin' = ANY(roles)
            )
          );
      `
    })

    // Step 3: Get stats
    const { data: adminUsers } = await supabaseAdmin
      .from('users')
      .select('id, email, roles')
      .eq('roles', ['admin'])

    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    return ApiResponses.success({
      message: 'RLS policies fixed successfully',
      stats: {
        total_admins: adminUsers?.length || 0,
        total_users: totalUsers || 0,
        admin_emails: adminUsers?.map((u: any) => u.email) || []
      }
    })

  } catch (error) {
    console.error('Error fixing RLS:', error)
    return ApiResponses.serverError('Failed to fix RLS policies')
  }
}
