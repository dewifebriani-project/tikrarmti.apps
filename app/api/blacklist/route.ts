import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger-secure'
import { getClientIP } from '@/lib/rate-limiter'
import { ApiResponses } from '@/lib/api-responses'

/**
 * GET /api/blacklist
 * Get list of all blacklisted users
 * Only accessible by admins
 */
export async function GET(request: NextRequest) {
  const ip = getClientIP(request)

  try {
    // Verify admin authentication
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return ApiResponses.unauthorized('Please login first')
    }

    // Check if user is admin
    const supabaseAdmin = createSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return ApiResponses.unauthorized('User not found')
    }

    const userRoles = userData?.roles || []
    if (!userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      logger.warn('Unauthorized blacklist list access attempt', {
        userId: user.id.substring(0, 8) + '...',
        ip
      })
      return ApiResponses.forbidden('Only admins can access blacklist data')
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    logger.debug('Fetching blacklist data', {
      userId: user.id.substring(0, 8) + '...',
      page,
      limit,
      search
    })

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select('id, email, full_name, whatsapp, blacklist_reason, blacklisted_at, blacklist_notes, blacklist_by, created_at', { count: 'exact' })
      .eq('is_blacklisted', true)

    // Add search filter if provided
    if (search) {
      query = query.or(`email.ilike.%${search}%,whatsapp.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Add pagination
    query = query
      .order('blacklisted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      logger.error('Failed to fetch blacklist data', {
        userId: user.id.substring(0, 8) + '...',
        error: error.message
      })
      return ApiResponses.serverError('Failed to fetch blacklist data')
    }

    return ApiResponses.success({
      blacklist: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    logger.error('Unhandled error in blacklist GET API', {
      error: error as Error,
      ip
    })
    return ApiResponses.serverError('Terjadi kesalahan server. Silakan coba lagi.')
  }
}

/**
 * POST /api/blacklist
 * Add a user to blacklist
 * Only accessible by admins
 */
export async function POST(request: NextRequest) {
  const ip = getClientIP(request)

  try {
    // Verify admin authentication
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return ApiResponses.unauthorized('Please login first')
    }

    // Check if user is admin
    const supabaseAdmin = createSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return ApiResponses.unauthorized('User not found')
    }

    const userRoles = userData?.roles || []
    if (!userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      logger.warn('Unauthorized blacklist add attempt', {
        userId: user.id.substring(0, 8) + '...',
        ip
      })
      return ApiResponses.forbidden('Only admins can blacklist users')
    }

    // Parse request body
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      return ApiResponses.validationError([{ field: 'body', message: 'Invalid request body' }])
    }

    const { targetUserId, reason, notes } = body

    // Validate required fields
    if (!targetUserId) {
      return ApiResponses.validationError([{ field: 'targetUserId', message: 'Target user ID is required' }])
    }

    if (!reason || reason.trim().length === 0) {
      return ApiResponses.validationError([{ field: 'reason', message: 'Reason is required' }])
    }

    // Check if target user exists
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, whatsapp, is_blacklisted')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetUser) {
      return ApiResponses.notFound('Target user not found')
    }

    if (targetUser.is_blacklisted) {
      return ApiResponses.badRequest('User is already blacklisted')
    }

    // Update user to blacklisted
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_blacklisted: true,
        blacklist_reason: reason.trim(),
        blacklist_notes: notes?.trim() || null,
        blacklisted_at: new Date().toISOString(),
        blacklist_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)

    if (updateError) {
      logger.error('Failed to blacklist user', {
        userId: user.id.substring(0, 8) + '...',
        targetUserId: targetUserId.substring(0, 8) + '...',
        error: updateError.message
      })
      return ApiResponses.serverError('Failed to blacklist user')
    }

    // Create audit log
    const { error: auditError } = await supabaseAdmin
      .from('blacklist_audit_logs')
      .insert({
        user_id: user.id,
        target_user_id: targetUserId,
        action: 'blacklist',
        reason: reason.trim(),
        notes: notes?.trim() || null
      })

    if (auditError) {
      logger.warn('Failed to create audit log for blacklist action', {
        userId: user.id.substring(0, 8) + '...',
        error: auditError.message
      })
    }

    logger.info('User blacklisted successfully', {
      userId: user.id.substring(0, 8) + '...',
      targetUserId: targetUserId.substring(0, 8) + '...',
      reason,
      ip
    })

    return ApiResponses.success({
      message: 'User successfully blacklisted',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name,
        whatsapp: targetUser.whatsapp
      }
    }, 'User berhasil di-blacklist')

  } catch (error) {
    logger.error('Unhandled error in blacklist POST API', {
      error: error as Error,
      ip
    })
    return ApiResponses.serverError('Terjadi kesalahan server. Silakan coba lagi.')
  }
}
