'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log'
import { headers } from 'next/headers'

/**
 * DAFTAR ULANG SERVER ACTIONS
 *
 * ARCHITECTURE V3 COMPLIANCE:
 * - Server Actions untuk re-enrollment mutations
 * - Auth validation via getUser() (not getSession)
 * - Uses admin client safely (server-only)
 * - Proper error handling and validation
 *
 * Migrated from: app/api/daftar-ulang/submit/route.ts
 * Date: 2026-01-06
 */

// Types
interface ReEnrollmentStatus {
  selection_status: string
  re_enrollment_completed: boolean
  re_enrollment_completed_at?: string
}

interface Requirements {
  schedule_selected: boolean
  akad_completed: boolean
  partner_selected: boolean
  halaqah_assigned: boolean
  can_submit: boolean
}

interface ReEnrollmentStatusResponse {
  success: boolean
  error?: string
  data?: {
    registration: ReEnrollmentStatus
    requirements: Requirements
    details: {
      schedule: any
      akad: any
      partner: any
      halaqah: any
    }
  }
}

interface SubmitReEnrollmentResponse {
  success: boolean
  error?: string
  data?: {
    registration: any
    message: string
  }
}

/**
 * Get re-enrollment status and requirements
 *
 * @param batch_id Batch ID to check status for
 * @returns Status and requirements object
 */
export async function getReEnrollmentStatus(
  batch_id: string
): Promise<ReEnrollmentStatusResponse> {
  try {
    // Validate input
    if (!batch_id) {
      return {
        success: false,
        error: 'batch_id is required'
      }
    }

    // Get authenticated user
    const supabase = createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Unauthorized - Invalid session. Please login again.'
      }
    }

    // Use admin client for queries (bypasses RLS)
    const supabaseAdmin = createSupabaseAdmin()

    // Get registration status
    const { data: registration } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, selection_status, re_enrollment_completed, re_enrollment_completed_at')
      .eq('user_id', user.id)
      .eq('batch_id', batch_id)
      .single()

    if (!registration) {
      return {
        success: false,
        error: 'Registration not found'
      }
    }

    // Check all requirements in parallel for better performance
    const [
      { data: schedulePreference },
      { data: akad },
      { data: partner },
      { data: halaqahAssignment }
    ] = await Promise.all([
      supabaseAdmin
        .from('ustadzah_preferences')
        .select('preferred_muallimah_tashih, preferred_muallimah_ujian')
        .eq('user_id', user.id)
        .eq('batch_id', batch_id)
        .maybeSingle(),
      supabaseAdmin
        .from('akad_commitments')
        .select('agreed, signed_at')
        .eq('user_id', user.id)
        .eq('batch_id', batch_id)
        .maybeSingle(),
      supabaseAdmin
        .from('study_partner_preferences')
        .select('partner_type, partner_status, preferred_partner_id')
        .eq('user_id', user.id)
        .eq('batch_id', batch_id)
        .maybeSingle(),
      supabaseAdmin
        .from('halaqah_students')
        .select('halaqah_id, halaqah: halaqah!inner(name, program_id)')
        .eq('thalibah_id', user.id)
        .maybeSingle()
    ])

    // Calculate completion status
    const scheduleSelected = !!(
      schedulePreference &&
      schedulePreference.preferred_muallimah_tashih &&
      schedulePreference.preferred_muallimah_ujian
    )

    const requirements: Requirements = {
      schedule_selected: scheduleSelected,
      akad_completed: !!(akad && akad.agreed),
      partner_selected: !!partner,
      halaqah_assigned: !!halaqahAssignment,
      can_submit: scheduleSelected && !!(akad && akad.agreed) && !!partner && !!halaqahAssignment
    }

    return {
      success: true,
      data: {
        registration: {
          selection_status: registration.selection_status,
          re_enrollment_completed: registration.re_enrollment_completed,
          re_enrollment_completed_at: registration.re_enrollment_completed_at
        },
        requirements,
        details: {
          schedule: schedulePreference,
          akad,
          partner,
          halaqah: halaqahAssignment
        }
      }
    }

  } catch (error) {
    console.error('[getReEnrollmentStatus] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }
  }
}

/**
 * Submit and complete the re-enrollment process
 *
 * This function:
 * 1. Validates user authentication
 * 2. Checks registration eligibility
 * 3. Verifies all requirements are completed
 * 4. Marks re-enrollment as completed
 * 5. Updates user role to include 'thalibah'
 * 6. Logs audit trail
 *
 * @param batch_id Batch ID to complete re-enrollment for
 * @returns Success status and registration data
 */
export async function submitReEnrollment(
  batch_id: string
): Promise<SubmitReEnrollmentResponse> {
  try {
    // Validate input
    if (!batch_id) {
      return {
        success: false,
        error: 'batch_id is required'
      }
    }

    // Get authenticated user
    const supabase = createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Unauthorized - Invalid session. Please login again.'
      }
    }

    // Use admin client for queries (bypasses RLS for validation)
    const supabaseAdmin = createSupabaseAdmin()

    // Get user's registration
    const { data: registration } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, selection_status, re_enrollment_completed')
      .eq('user_id', user.id)
      .eq('batch_id', batch_id)
      .single()

    if (!registration) {
      return {
        success: false,
        error: 'Registration not found'
      }
    }

    // Validate eligibility
    if (registration.selection_status !== 'selected') {
      return {
        success: false,
        error: 'Only selected thalibah can complete daftar ulang'
      }
    }

    if (registration.re_enrollment_completed) {
      return {
        success: false,
        error: 'Re-enrollment already completed'
      }
    }

    // Verify all required components are completed (parallel queries)
    const [
      { data: schedulePreference },
      { data: akad },
      { data: partner },
      { data: halaqahAssignment }
    ] = await Promise.all([
      supabaseAdmin
        .from('ustadzah_preferences')
        .select('preferred_muallimah_tashih, preferred_muallimah_ujian')
        .eq('user_id', user.id)
        .eq('batch_id', batch_id)
        .maybeSingle(),
      supabaseAdmin
        .from('akad_commitments')
        .select('agreed')
        .eq('user_id', user.id)
        .eq('batch_id', batch_id)
        .maybeSingle(),
      supabaseAdmin
        .from('study_partner_preferences')
        .select('partner_type')
        .eq('user_id', user.id)
        .eq('batch_id', batch_id)
        .maybeSingle(),
      supabaseAdmin
        .from('halaqah_students')
        .select('halaqah_id')
        .eq('thalibah_id', user.id)
        .maybeSingle()
    ])

    // Validate schedule preference
    if (
      !schedulePreference ||
      !schedulePreference.preferred_muallimah_tashih ||
      !schedulePreference.preferred_muallimah_ujian
    ) {
      return {
        success: false,
        error: 'Please select your tashih and ujian schedule preferences first'
      }
    }

    // Validate akad agreement
    if (!akad || !akad.agreed) {
      return {
        success: false,
        error: 'Please complete the akad agreement first'
      }
    }

    // Validate partner preference
    if (!partner) {
      return {
        success: false,
        error: 'Please select your study partner preference first'
      }
    }

    // Validate halaqah assignment
    if (!halaqahAssignment) {
      return {
        success: false,
        error: 'Please wait for admin to assign you to a halaqah'
      }
    }

    // All requirements met - complete re-enrollment
    const { data: updatedRegistration, error: updateError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update({
        re_enrollment_completed: true,
        re_enrollment_completed_at: new Date().toISOString(),
        re_enrollment_confirmed_by: user.id // Self-confirmation
      })
      .eq('id', registration.id)
      .select()
      .single()

    if (updateError) {
      console.error('[submitReEnrollment] Error updating registration:', updateError)
      return {
        success: false,
        error: 'Failed to update registration'
      }
    }

    // Update user role - add 'thalibah' to roles array
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (currentUser?.roles) {
      const currentRoles = (currentUser.roles as string[]) || []
      if (!currentRoles.includes('thalibah')) {
        await supabaseAdmin
          .from('users')
          .update({
            roles: [...currentRoles, 'thalibah'],
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
      }
    }

    // Audit log - get request context
    const headersList = headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await logAudit({
      userId: user.id,
      action: 'CREATE',
      resource: 're_enrollment',
      details: {
        batch_id: batch_id,
        registration_id: registration.id,
        partner_type: partner.partner_type,
        akad_completed: true
      },
      ipAddress,
      userAgent,
      level: 'INFO'
    })

    // Revalidate paths that display re-enrollment data
    revalidatePath('/daftar-ulang')
    revalidatePath('/perjalanan-saya')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: {
        registration: updatedRegistration,
        message: 'Daftar ulang completed successfully! You are now a thalibah.'
      }
    }

  } catch (error) {
    console.error('[submitReEnrollment] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }
  }
}
