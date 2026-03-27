import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger-secure'
import { getClientIP } from '@/lib/rate-limiter'
import { ApiResponses } from '@/lib/api-responses'

/**
 * DELETE /api/blacklist/[id]
 * Remove a user from blacklist (whitelist)
 * Only accessible by admins
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIP(request)
  const targetUserId = params.id

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
      logger.warn('Unauthorized whitelist attempt', {
        userId: user.id.substring(0, 8) + '...',
        targetUserId: targetUserId.substring(0, 8) + '...',
        ip
      })
      return ApiResponses.forbidden('Only admins can remove users from blacklist')
    }

    // Check if target user exists and is blacklisted
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, whatsapp, is_blacklisted')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetUser) {
      return ApiResponses.notFound('Target user not found')
    }

    if (!targetUser.is_blacklisted) {
      return ApiResponses.badRequest('User is not blacklisted')
    }

    // Update user to remove from blacklist
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_blacklisted: false,
        blacklist_reason: null,
        blacklist_notes: null,
        blacklisted_at: null,
        blacklist_by: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)

    if (updateError) {
      logger.error('Failed to remove user from blacklist', {
        userId: user.id.substring(0, 8) + '...',
        targetUserId: targetUserId.substring(0, 8) + '...',
        error: updateError.message
      })
      return ApiResponses.serverError('Failed to remove user from blacklist')
    }

    // Create audit log
    const { error: auditError } = await supabaseAdmin
      .from('blacklist_audit_logs')
      .insert({
        user_id: user.id,
        target_user_id: targetUserId,
        action: 'remove_blacklist',
        reason: 'Removed from blacklist by admin',
        notes: null
      })

    if (auditError) {
      logger.warn('Failed to create audit log for whitelist action', {
        userId: user.id.substring(0, 8) + '...',
        error: auditError.message
      })
    }

    logger.info('User removed from blacklist successfully', {
      userId: user.id.substring(0, 8) + '...',
      targetUserId: targetUserId.substring(0, 8) + '...',
      ip
    })

    return ApiResponses.success({
      message: 'User successfully removed from blacklist',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name,
        whatsapp: targetUser.whatsapp
      }
    }, 'User berhasil dihapus dari blacklist')

  } catch (error) {
    logger.error('Unhandled error in blacklist DELETE API', {
      error: error as Error,
      ip
    })
    return ApiResponses.serverError('Terjadi kesalahan server. Silakan coba lagi.')
  }
}

/**
 * GET /api/blacklist/[id]
 * Get details of a specific blacklisted user
 * Only accessible by admins
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIP(request)
  const targetUserId = params.id

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
      return ApiResponses.forbidden('Only admins can access blacklist details')
    }

    // Get target user details
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, whatsapp, is_blacklisted, blacklist_reason, blacklisted_at, blacklist_notes, created_at')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetUser) {
      return ApiResponses.notFound('User not found')
    }

    // Get audit logs for this user
    const { data: auditLogs } = await supabaseAdmin
      .from('blacklist_audit_logs')
      .select('action, reason, notes, created_at')
      .eq('target_user_id', targetUserId)
      .order('created_at', { ascending: false })

    return ApiResponses.success({
      user: targetUser,
      auditLogs: auditLogs || []
    })

  } catch (error) {
    logger.error('Unhandled error in blacklist GET [id] API', {
      error: error as Error,
      ip
    })
    return ApiResponses.serverError('Terjadi kesalahan server. Silakan coba lagi.')
  }
}
