'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * MUALLIMAH SERVER ACTIONS
 *
 * SECURITY ARCHITECTURE COMPLIANCE:
 * - Server Actions for muallimah mutations
 * - Muallimah/Admin validation in server-side
 * - RLS policies handle data access control
 */

// Types
interface CreateHalaqahData {
  name: string
  description?: string
  day_of_week?: number
  start_time?: string
  end_time?: string
  location?: string
  max_students?: number
  zoom_link?: string
  preferred_juz?: string
  waitlist_max?: number
  muallimah_id?: string // For admin to assign to specific muallimah
}

const createHalaqahSchema = z.object({
  name: z.string().min(1, 'Nama halaqah wajib diisi'),
  description: z.string().optional(),
  day_of_week: z.number().min(1).max(7).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  max_students: z.number().min(1).default(20),
  zoom_link: z.string().url().optional().or(z.literal('')),
  preferred_juz: z.string().optional(),
  waitlist_max: z.number().min(0).default(5),
  muallimah_id: z.string().optional(),
})

/**
 * Verify muallimah or admin role - MUST be called before any action
 */
async function verifyAccess() {
  const supabase = createClient()

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Unauthorized - Invalid session')
  }

  // Verify role from database
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (dbError || !userData) {
    throw new Error('User not found')
  }

  const roles = userData?.roles || []
  const isAdmin = roles.includes('admin')
  const isMuallimah = roles.includes('muallimah')

  if (!isAdmin && !isMuallimah) {
    throw new Error('Forbidden - Muallimah or Admin access required')
  }

  return { user, supabase, isAdmin, isMuallimah }
}

/**
 * Create a new halaqah (Muallimah or Admin)
 *
 * @param data Halaqah data to create
 * @returns Success status and optional error
 */
export async function createHalaqah(data: CreateHalaqahData) {
  try {
    // Verify access first
    const { user, supabase, isAdmin, isMuallimah } = await verifyAccess()

    // Validate input
    const validationResult = createHalaqahSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Validation error',
      }
    }

    const validatedData = validationResult.data

    // Determine muallimah_id:
    // - Muallimah can only create for themselves
    // - Admin can create for any muallimah (if specified)
    let targetMuallimahId = user.id
    if (isAdmin && validatedData.muallimah_id) {
      // Verify the target muallimah exists and has muallimah role
      const { data: targetUser } = await supabase
        .from('users')
        .select('roles')
        .eq('id', validatedData.muallimah_id)
        .single()

      if (!targetUser || !targetUser.roles?.includes('muallimah')) {
        return {
          success: false,
          error: 'Target user is not a muallimah',
        }
      }
      targetMuallimahId = validatedData.muallimah_id
    }

    // Create halaqah
    const { data: halaqah, error } = await supabase
      .from('halaqah')
      .insert({
        name: validatedData.name,
        description: validatedData.description || null,
        day_of_week: validatedData.day_of_week || null,
        start_time: validatedData.start_time || null,
        end_time: validatedData.end_time || null,
        location: validatedData.location || null,
        max_students: validatedData.max_students,
        zoom_link: validatedData.zoom_link || null,
        muallimah_id: targetMuallimahId,
        preferred_juz: validatedData.preferred_juz || null,
        waitlist_max: validatedData.waitlist_max,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate panel page cache
    revalidatePath('/panel-muallimah')

    return {
      success: true,
      data: halaqah,
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create halaqah',
    }
  }
}

/**
 * Update halaqah (Muallimah can only update their own, Admin can update any)
 *
 * @param halaqahId Halaqah ID to update
 * @param data Halaqah data to update
 * @returns Success status and optional error
 */
export async function updateHalaqah(halaqahId: string, data: Partial<CreateHalaqahData>) {
  try {
    // Verify access first
    const { user, supabase, isAdmin } = await verifyAccess()

    // Validate input
    const validationResult = createHalaqahSchema.partial().safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Validation error',
      }
    }

    const validatedData = validationResult.data

    // Build update query
    let query = supabase
      .from('halaqah')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', halaqahId)

    // Muallimah can only update their own halaqah, Admin can update any
    if (!isAdmin) {
      query = query.eq('muallimah_id', user.id)
    }

    const { data: halaqah, error } = await query.select().single()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate panel page cache
    revalidatePath('/panel-muallimah')

    return {
      success: true,
      data: halaqah,
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update halaqah',
    }
  }
}

/**
 * Delete halaqah (Muallimah can only delete their own, Admin can delete any)
 *
 * @param halaqahId Halaqah ID to delete
 * @returns Success status and optional error
 */
export async function deleteHalaqah(halaqahId: string) {
  try {
    // Verify access first
    const { user, supabase, isAdmin } = await verifyAccess()

    // Build delete query
    let query = supabase
      .from('halaqah')
      .delete()
      .eq('id', halaqahId)

    // Muallimah can only delete their own halaqah, Admin can delete any
    if (!isAdmin) {
      query = query.eq('muallimah_id', user.id)
    }

    const { error } = await query

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate panel page cache
    revalidatePath('/panel-muallimah')

    return {
      success: true,
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete halaqah',
    }
  }
}
