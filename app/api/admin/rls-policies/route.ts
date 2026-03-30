import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { ApiResponses, HTTP_STATUS } from '@/lib/api-responses'
import { NextRequest, NextResponse } from 'next/server'

/**
 * RLS Policies Management API
 *
 * SECURITY NOTES:
 * - GET: Fetches RLS policies - requires admin access
 * - POST: DISABLED for security reasons (SQL injection risk)
 *
 * The POST endpoint that allowed arbitrary SQL execution has been removed.
 * Use direct database migrations or Supabase dashboard for schema changes.
 */

// List of allowed predefined SQL operations (if needed in the future)
const ALLOWED_SQL_OPERATIONS = {
  // Example: Only specific, pre-validated SQL can be executed
  // 'fix_user_rls': 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;',
} as const

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get RLS policies from system catalog
    const { data: policies, error } = await supabase.rpc('admin_get_rls_policies')

    if (error) {
      console.error('Error fetching RLS policies:', error)
      return ApiResponses.databaseError(error)
    }

    return ApiResponses.success({ policies })
  } catch (error) {
    return ApiResponses.handleUnknown(error)
  }
}

/**
 * POST endpoint - DISABLED for security
 *
 * Previously allowed arbitrary SQL execution which is a critical security risk.
 * If you need to execute SQL, use one of these secure alternatives:
 * 1. Supabase Dashboard SQL Editor
 * 2. Database migrations (supabase/migrations/*.sql)
 * 3. Create a specific RPC function with parameterized queries
 */
export async function POST(request: NextRequest) {
  // Security: Reject any POST requests to prevent SQL injection
  return ApiResponses.forbidden(
    'SQL execution via API is disabled for security. ' +
    'Use Supabase Dashboard or database migrations instead.'
  )
}
