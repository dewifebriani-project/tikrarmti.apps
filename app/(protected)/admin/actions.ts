'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

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
  role?: string
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
    const { supabaseAdmin } = await verifyAdmin()

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
      console.error('[createUser] Error:', error)
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
    console.error('[createUser] Exception:', error)
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
    const { supabaseAdmin } = await verifyAdmin()

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
      console.error('[updateUser] Error:', error)
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
    console.error('[updateUser] Exception:', error)
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
    const { supabaseAdmin } = await verifyAdmin()

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
      console.error('[deleteUser] Error:', error)
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
    console.error('[deleteUser] Exception:', error)
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
    const { supabaseAdmin } = await verifyAdmin()

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
      console.error('[bulkUpdateUsers] Some updates failed:', errors)
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
    console.error('[bulkUpdateUsers] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update users'
    }
  }
}
