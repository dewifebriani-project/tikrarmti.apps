import { ApiResponses, HTTP_STATUS } from '@/lib/api-responses'
import { createSupabaseAdmin } from '@/lib/supabase'

/**
 * Health Check Endpoint
 *
 * Checks database connectivity and returns system status.
 * This endpoint is used for monitoring and load balancer health checks.
 */
export async function GET() {
  try {
    const startTime = Date.now()
    const supabase = createSupabaseAdmin()

    // Check Supabase connection
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    const responseTime = Date.now() - startTime

    if (error) {
      return ApiResponses.serverError('Database connection failed')
    }

    return ApiResponses.success({
      status: 'ok',
      database: 'connected',
      responseTime
    }, 'All systems operational')
  } catch {
    return ApiResponses.serverError('Health check failed')
  }
}