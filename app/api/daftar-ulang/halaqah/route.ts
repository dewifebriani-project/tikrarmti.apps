import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/daftar-ulang/halaqah
 * Fetch available halaqah for daftar ulang
 * Sorted by availability (most slots first)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's registration to find batch_id
    const { data: registration, error: regError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('batch_id, chosen_juz, main_time_slot, backup_time_slot')
      .eq('user_id', user.id)
      .eq('selection_status', 'selected')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'No valid registration found' },
        { status: 404 }
      )
    }

    // Fetch halaqah with their class types and availability
    const { data: halaqahData, error: halaqahError } = await supabase
      .from('halaqah')
      .select(`
        id,
        name,
        description,
        day_of_week,
        start_time,
        end_time,
        location,
        status,
        halaqah_class_types (
          id,
          class_type,
          current_students,
          max_students,
          is_active
        ),
        halaqah_mentors (
          mentor_id,
          role,
          is_primary,
          users (
            full_name
          )
        )
      `)
      .eq('status', 'active')
      .order('day_of_week', { ascending: true })

    if (halaqahError) {
      console.error('Error fetching halaqah:', halaqahError)
      return NextResponse.json(
        { error: 'Failed to fetch halaqah data' },
        { status: 500 }
      )
    }

    // Process and sort halaqah by availability
    // Full halaqah go to bottom, available halaqah sorted by most slots first
    const processedHalaqah = (halaqahData || [])
      .map(h => {
        const classTypes = h.halaqah_class_types || []
        const totalCurrent = classTypes.reduce((sum, ct) => sum + (ct.current_students || 0), 0)
        const totalMax = classTypes.reduce((sum, ct) => sum + (ct.max_students || 20), 0)
        const isFull = totalCurrent >= totalMax
        const availableSlots = totalMax - totalCurrent

        return {
          ...h,
          total_current_students: totalCurrent,
          total_max_students: totalMax,
          available_slots: availableSlots,
          is_full: isFull,
          class_types: classTypes,
          mentors: h.halaqah_mentors || []
        }
      })
      .sort((a, b) => {
        // Full halaqah go to bottom
        if (a.is_full && !b.is_full) return 1
        if (!a.is_full && b.is_full) return -1
        // Within same status, sort by available slots (descending)
        return b.available_slots - a.available_slots
      })

    // Get user's existing daftar ulang submission if any
    const { data: existingSubmission } = await supabase
      .from('daftar_ulang_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('registration_id', registration.batch_id) // Note: needs actual registration_id
      .maybeSingle()

    return NextResponse.json({
      success: true,
      data: {
        halaqah: processedHalaqah,
        user_schedule: {
          chosen_juz: registration.chosen_juz,
          main_time_slot: registration.main_time_slot,
          backup_time_slot: registration.backup_time_slot
        },
        existing_submission: existingSubmission
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
