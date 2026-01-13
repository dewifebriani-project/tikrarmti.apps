'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { logError, LogErrorContext } from '@/lib/logger'

/**
 * ADMIN SERVER ACTIONS
 *
 * SECURITY ARCHITECTURE V3 COMPLIANCE:
 * - Server Actions untuk admin mutations
 * - Admin validation di server-side
 * - Uses service role key safely (server-only)
 * - RLS bypassed only when necessary and validated
 *
 * CRITICAL: These functions are ONLY callable from server.
 * Service role key is NEVER exposed to client bundle.
 */

// Types
interface CreateUserData {
  email: string
  full_name?: string
  nama_kunyah?: string
  role?: string
  roles?: string[]
  phone?: string
  whatsapp?: string
  telegram?: string
  provinsi?: string
  kota?: string
  alamat?: string
  negara?: string
  zona_waktu?: string
  tanggal_lahir?: string
  tempat_lahir?: string
  jenis_kelamin?: string
  pekerjaan?: string
  alasan_daftar?: string
  is_active?: boolean
}

interface UpdateUserData extends Partial<CreateUserData> {
  id: string
}

/**
 * Verify admin role - MUST be called before any admin action
 */
async function verifyAdmin() {
  const supabase = createServerClient()

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    // Log auth failure
    await logError(userError || new Error('No user found'), {
      function: 'verifyAdmin',
      errorType: 'auth',
    } as LogErrorContext)
    throw new Error('Unauthorized - Invalid session')
  }

  // Verify admin role from database
  const supabaseAdmin = createSupabaseAdmin()
  const { data: userData, error: dbError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (dbError || !userData || userData.role !== 'admin') {
    // Log forbidden access attempt
    await logError(dbError || new Error(`User ${user.id} attempted admin access without admin role`), {
      userId: user.id,
      userEmail: user.email,
      function: 'verifyAdmin',
      errorType: 'auth',
    } as LogErrorContext)
    throw new Error('Forbidden - Admin access required')
  }

  return { user, supabaseAdmin }
}

/**
 * Create a new user (Admin only)
 *
 * @param data User data to create
 * @returns Success status and optional error
 */
export async function createUser(data: CreateUserData) {
  try {
    // CRITICAL: Verify admin role first
    const { user, supabaseAdmin } = await verifyAdmin()

    // Validate required fields
    if (!data.email) {
      return {
        success: false,
        error: 'Email is required'
      }
    }

    // Set defaults for new user
    const userData = {
      email: data.email.toLowerCase().trim(),
      full_name: data.full_name || '',
      role: data.role || 'calon_thalibah',
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      telegram: data.telegram || null,
      provinsi: data.provinsi || null,
      kota: data.kota || null,
      alamat: data.alamat || null,
      negara: data.negara || null,
      zona_waktu: data.zona_waktu || null,
      tanggal_lahir: data.tanggal_lahir || null,
      tempat_lahir: data.tempat_lahir || null,
      jenis_kelamin: data.jenis_kelamin || null,
      pekerjaan: data.pekerjaan || null,
      alasan_daftar: data.alasan_daftar || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Create user using admin client (bypasses RLS)
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) {
      // Log database error
      await logError(error, {
        userId: user.id,
        userEmail: user.email,
        function: 'createUser',
        errorType: 'database',
        context: { email: data.email },
      } as LogErrorContext)
      return {
        success: false,
        error: error.message
      }
    }

    // Revalidate admin page cache
    revalidatePath('/admin')

    return {
      success: true,
      data: newUser
    }

  } catch (error) {
    // Log unexpected error
    await logError(error, {
      function: 'createUser',
      errorType: 'runtime',
      context: { email: data.email },
    } as LogErrorContext)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    }
  }
}

/**
 * Update an existing user (Admin only)
 *
 * @param data User data to update (must include id)
 * @returns Success status and optional error
 */
export async function updateUser(data: UpdateUserData) {
  try {
    // CRITICAL: Verify admin role first
    const { user, supabaseAdmin } = await verifyAdmin()

    // Validate required fields
    if (!data.id) {
      return {
        success: false,
        error: 'User ID is required'
      }
    }

    // Extract id and prepare update data
    const { id, ...updateData } = data

    // Add updated timestamp
    const userData = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    // Remove undefined values
    Object.keys(userData).forEach(key => {
      if (userData[key as keyof typeof userData] === undefined) {
        delete userData[key as keyof typeof userData]
      }
    })

    // Update user using admin client (bypasses RLS)
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // Log database error
      await logError(error, {
        userId: user.id,
        userEmail: user.email,
        function: 'updateUser',
        errorType: 'database',
        context: { targetUserId: id },
      } as LogErrorContext)
      return {
        success: false,
        error: error.message
      }
    }

    // Revalidate admin page cache
    revalidatePath('/admin')

    return {
      success: true,
      data: updatedUser
    }

  } catch (error) {
    // Log unexpected error
    await logError(error, {
      function: 'updateUser',
      errorType: 'runtime',
      context: { targetUserId: data.id },
    } as LogErrorContext)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user'
    }
  }
}

/**
 * Delete a user (Admin only)
 *
 * @param userId User ID to delete
 * @returns Success status and optional error
 */
export async function deleteUser(userId: string) {
  try {
    // CRITICAL: Verify admin role first
    const { user, supabaseAdmin } = await verifyAdmin()

    // Validate required fields
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required'
      }
    }

    // Delete user using admin client (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      // Log database error
      await logError(error, {
        userId: user.id,
        userEmail: user.email,
        function: 'deleteUser',
        errorType: 'database',
        context: { targetUserId: userId },
      } as LogErrorContext)
      return {
        success: false,
        error: error.message
      }
    }

    // Revalidate admin page cache
    revalidatePath('/admin')

    return {
      success: true
    }

  } catch (error) {
    // Log unexpected error
    await logError(error, {
      function: 'deleteUser',
      errorType: 'runtime',
      context: { targetUserId: userId },
    } as LogErrorContext)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user'
    }
  }
}

/**
 * Bulk update users (Admin only)
 * Used for batch operations
 *
 * @param updates Array of user updates
 * @returns Success status and optional error
 */
export async function bulkUpdateUsers(updates: UpdateUserData[]) {
  try {
    // CRITICAL: Verify admin role first
    const { user, supabaseAdmin } = await verifyAdmin()

    // Validate input
    if (!updates || updates.length === 0) {
      return {
        success: false,
        error: 'No updates provided'
      }
    }

    // Perform bulk updates
    const results = await Promise.allSettled(
      updates.map(async (update) => {
        const { id, ...data } = update
        return supabaseAdmin
          .from('users')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
      })
    )

    // Check for errors
    const errors = results.filter(r => r.status === 'rejected')
    if (errors.length > 0) {
      // Log partial failure
      await logError(new Error(`${errors.length} out of ${updates.length} updates failed`), {
        userId: user.id,
        userEmail: user.email,
        function: 'bulkUpdateUsers',
        errorType: 'runtime',
        context: { failedCount: errors.length, totalCount: updates.length },
      } as LogErrorContext)
      return {
        success: false,
        error: `${errors.length} out of ${updates.length} updates failed`
      }
    }

    // Revalidate admin page cache
    revalidatePath('/admin')

    return {
      success: true,
      updatedCount: updates.length
    }

  } catch (error) {
    // Log unexpected error
    await logError(error, {
      function: 'bulkUpdateUsers',
      errorType: 'runtime',
      context: { updateCount: updates?.length },
    } as LogErrorContext)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update users'
    }
  }
}

// ============================================================================
// SYSTEM LOGS SERVER ACTIONS
// ============================================================================

export interface SystemLogFilter {
  limit?: number
  offset?: number
  severity?: ('DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL')[]
  errorType?: ('runtime' | 'auth' | 'database' | 'validation' | 'network' | 'unknown')[]
  isAuthError?: boolean
  isSupabaseGetUserError?: boolean
  userId?: string
  startDate?: string
  endDate?: string
  search?: string
}

export interface SystemLogEntry {
  id: string
  created_at: string
  error_message: string
  error_name?: string
  error_stack?: string
  context: Record<string, any>
  user_id?: string
  user_email?: string
  user_role?: string[]
  request_path?: string
  request_method?: string
  ip_address?: string
  user_agent?: string
  severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
  error_type: 'runtime' | 'auth' | 'database' | 'validation' | 'network' | 'unknown'
  is_auth_error: boolean
  is_supabase_getuser_error: boolean
  sentry_event_id?: string
  sentry_sent: boolean
}

export interface SystemLogsResponse {
  success: boolean
  data?: SystemLogEntry[]
  count?: number
  error?: string
}

/**
 * Get system logs (Admin only)
 *
 * SECURITY: Admin role validation is REQUIRED before returning any logs
 *
 * @param filter Filter options for logs
 * @returns System logs matching the filter
 */
export async function getSystemLogs(filter: SystemLogFilter = {}): Promise<SystemLogsResponse> {
  try {
    // CRITICAL: Verify admin role first
    const { user, supabaseAdmin } = await verifyAdmin()

    // Build query
    let query = supabaseAdmin
      .from('system_logs')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filter.severity && filter.severity.length > 0) {
      query = query.in('severity', filter.severity)
    }

    if (filter.errorType && filter.errorType.length > 0) {
      query = query.in('error_type', filter.errorType)
    }

    if (filter.isAuthError !== undefined) {
      query = query.eq('is_auth_error', filter.isAuthError)
    }

    if (filter.isSupabaseGetUserError !== undefined) {
      query = query.eq('is_supabase_getuser_error', filter.isSupabaseGetUserError)
    }

    if (filter.userId) {
      query = query.eq('user_id', filter.userId)
    }

    if (filter.startDate) {
      query = query.gte('created_at', filter.startDate)
    }

    if (filter.endDate) {
      query = query.lte('created_at', filter.endDate)
    }

    if (filter.search) {
      query = query.or(`error_message.ilike.%${filter.search}%,error_name.ilike.%${filter.search}%,request_path.ilike.%${filter.search}%`)
    }

    // Apply pagination and ordering
    const limit = Math.min(filter.limit || 100, 500) // Max 500 records
    const offset = filter.offset || 0

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Execute query
    const { data, error, count } = await query

    if (error) {
      // Log database error
      await logError(error, {
        userId: user.id,
        userEmail: user.email,
        function: 'getSystemLogs',
        errorType: 'database',
        context: { filter },
      } as LogErrorContext)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data as SystemLogEntry[],
      count: count || 0,
    }

  } catch (error) {
    // Log unexpected error
    await logError(error, {
      function: 'getSystemLogs',
      errorType: 'runtime',
      context: { filter },
    } as LogErrorContext)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch system logs',
    }
  }
}

/**
 * Get system logs statistics (Admin only)
 *
 * @param filter Filter options for statistics
 * @returns Statistics about system logs
 */
export async function getSystemLogsStats(filter: Omit<SystemLogFilter, 'limit' | 'offset'> = {}) {
  try {
    // CRITICAL: Verify admin role first
    const { user, supabaseAdmin } = await verifyAdmin()

    // Build base query with filters
    let query = supabaseAdmin
      .from('system_logs')
      .select('severity, error_type, is_auth_error, is_supabase_getuser_error', { count: 'exact', head: false })

    // Apply filters
    if (filter.severity && filter.severity.length > 0) {
      query = query.in('severity', filter.severity)
    }

    if (filter.errorType && filter.errorType.length > 0) {
      query = query.in('error_type', filter.errorType)
    }

    if (filter.isAuthError !== undefined) {
      query = query.eq('is_auth_error', filter.isAuthError)
    }

    if (filter.isSupabaseGetUserError !== undefined) {
      query = query.eq('is_supabase_getuser_error', filter.isSupabaseGetUserError)
    }

    if (filter.userId) {
      query = query.eq('user_id', filter.userId)
    }

    if (filter.startDate) {
      query = query.gte('created_at', filter.startDate)
    }

    if (filter.endDate) {
      query = query.lte('created_at', filter.endDate)
    }

    // Execute query
    const { data, error } = await query

    if (error) {
      // Log database error
      await logError(error, {
        userId: user.id,
        userEmail: user.email,
        function: 'getSystemLogsStats',
        errorType: 'database',
      } as LogErrorContext)
      return {
        success: false,
        error: error.message,
      }
    }

    // Calculate statistics
    const stats = {
      total: data?.length || 0,
      bySeverity: {} as Record<string, number>,
      byErrorType: {} as Record<string, number>,
      authErrors: 0,
      supabaseGetUserErrors: 0,
    }

    data?.forEach(log => {
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1
      stats.byErrorType[log.error_type] = (stats.byErrorType[log.error_type] || 0) + 1
      if (log.is_auth_error) stats.authErrors++
      if (log.is_supabase_getuser_error) stats.supabaseGetUserErrors++
    })

    return {
      success: true,
      data: stats,
    }

  } catch (error) {
    // Log unexpected error
    await logError(error, {
      function: 'getSystemLogsStats',
      errorType: 'runtime',
    } as LogErrorContext)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch system logs statistics',
    }
  }
}

/**
 * Reset user password to default (Admin only)
 *
 * @param userId User ID to reset password for
 * @returns Success status and optional error
 */
export async function resetUserPassword(userId: string) {
  try {
    // CRITICAL: Verify admin role first
    const { user, supabaseAdmin } = await verifyAdmin()

    // Validate required fields
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required'
      }
    }

    // Get user email first
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (fetchError || !targetUser) {
      // Log database error
      await logError(fetchError || new Error('User not found'), {
        userId: user.id,
        userEmail: user.email,
        function: 'resetUserPassword',
        errorType: 'database',
        context: { targetUserId: userId },
      } as LogErrorContext)
      return {
        success: false,
        error: fetchError?.message || 'User not found'
      }
    }

    // Update password using admin client (auth.users table)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: 'MTI123!' }
    )

    if (updateError) {
      // Log database error
      await logError(updateError, {
        userId: user.id,
        userEmail: user.email,
        function: 'resetUserPassword',
        errorType: 'database',
        context: { targetUserId: userId, targetUserEmail: targetUser.email },
      } as LogErrorContext)
      return {
        success: false,
        error: updateError.message
      }
    }

    // Log password reset action
    await logError(new Error(`Password reset for user ${targetUser.email}`), {
      userId: user.id,
      userEmail: user.email,
      function: 'resetUserPassword',
      errorType: 'runtime',
      context: { targetUserId: userId, targetUserEmail: targetUser.email },
    } as LogErrorContext)

    return {
      success: true,
      message: 'Password reset to default: MTI123!'
    }

  } catch (error) {
    // Log unexpected error
    await logError(error, {
      function: 'resetUserPassword',
      errorType: 'runtime',
      context: { userId },
    } as LogErrorContext)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password'
    }
  }
}
