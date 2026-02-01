'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * MUALLIMAH SERVER ACTIONS
 *
 * SECURITY ARCHITECTURE COMPLIANCE:
 * - Server Actions for muallimah mutations
 * - Muallimah validation in server-side
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
})

/**
 * Verify muallimah role - MUST be called before any muallimah action
 */
async function verifyMuallimah() {
  const supabase = createClient()

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Unauthorized - Invalid session')
  }

  // Verify muallimah role from database
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (dbError || !userData || !userData.roles?.includes('muallimah')) {
    throw new Error('Forbidden - Muallimah access required')
  }

  return { user, supabase }
}

/**
 * Create a new halaqah (Muallimah only)
 *
 * @param data Halaqah data to create
 * @returns Success status and optional error
 */
export async function createHalaqah(data: CreateHalaqahData) {
  try {
    // Verify muallimah role first
    const { user, supabase } = await verifyMuallimah()

    // Validate input
    const validationResult = createHalaqahSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Validation error',
      }
    }

    const validatedData = validationResult.data

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
        muallimah_id: user.id,
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
 * Update halaqah (Muallimah only - can only update their own halaqah)
 *
 * @param halaqahId Halaqah ID to update
 * @param data Halaqah data to update
 * @returns Success status and optional error
 */
export async function updateHalaqah(halaqahId: string, data: Partial<CreateHalaqahData>) {
  try {
    // Verify muallimah role first
    const { user, supabase } = await verifyMuallimah()

    // Validate input
    const validationResult = createHalaqahSchema.partial().safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Validation error',
      }
    }

    const validatedData = validationResult.data

    // Update halaqah (RLS will ensure they can only update their own)
    const { data: halaqah, error } = await supabase
      .from('halaqah')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', halaqahId)
      .eq('muallimah_id', user.id) // Extra security: ensure they own this halaqah
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
      error: error instanceof Error ? error.message : 'Failed to update halaqah',
    }
  }
}

/**
 * Delete halaqah (Muallimah only - can only delete their own halaqah)
 *
 * @param halaqahId Halaqah ID to delete
 * @returns Success status and optional error
 */
export async function deleteHalaqah(halaqahId: string) {
  try {
    // Verify muallimah role first
    const { user, supabase } = await verifyMuallimah()

    // Delete halaqah (RLS will ensure they can only delete their own)
    const { error } = await supabase
      .from('halaqah')
      .delete()
      .eq('id', halaqahId)
      .eq('muallimah_id', user.id) // Extra security: ensure they own this halaqah

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
