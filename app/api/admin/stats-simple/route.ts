import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { ApiResponses } from '@/lib/api-responses'
import { requireAdmin } from '@/lib/rbac'
import { getCachedAdminStats } from '@/lib/queries/stats'

const supabaseAdmin = createSupabaseAdmin()

/**
 * GET /api/admin/stats-simple
 *
 * Get simple admin statistics.
 * Cached for 30 seconds since stats change frequently.
 */
export async function GET(request: NextRequest) {
  // Authorization check
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    // Use cached stats query for better performance
    const stats = await getCachedAdminStats(supabaseAdmin)

    return ApiResponses.success({ stats })

  } catch (error) {
    return ApiResponses.handleUnknown(error)
  }
}
