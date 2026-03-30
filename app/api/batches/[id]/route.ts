// API Route: /api/batches/[id]
// Fetch single batch by ID

import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { ApiResponses, CACHE_CONTROL } from '@/lib/api-responses'
import { setCacheHeaders } from '@/lib/cache'
import { getCachedBatch } from '@/lib/queries/batch'
import { commonSchemas } from '@/lib/schemas'

const supabaseAdmin = createSupabaseAdmin()

/**
 * GET /api/batches/[id]
 *
 * Fetch a single batch by ID.
 * Cached for 5 minutes since batches don't change frequently.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return ApiResponses.unauthorized()
    }

    const batchId = params.id

    if (!batchId) {
      return ApiResponses.error(
        'VALIDATION_ERROR',
        'Batch ID required',
        { field: 'id' },
        400
      )
    }

    const uuidValidation = commonSchemas.uuid.safeParse(batchId)
    if (!uuidValidation.success) {
      return ApiResponses.error('VALIDATION_ERROR', 'Invalid batch ID format', { field: 'id' }, 400)
    }

    // Use cached query for better performance
    const batch = await getCachedBatch(supabaseAdmin, batchId)

    if (!batch) {
      return ApiResponses.notFound('Batch not found')
    }

    const response = ApiResponses.success(batch)

    // Apply cache headers for 5-minute cache
    return setCacheHeaders(response, 'MEDIUM')

  } catch (error) {
    return ApiResponses.handleUnknown(error)
  }
}
