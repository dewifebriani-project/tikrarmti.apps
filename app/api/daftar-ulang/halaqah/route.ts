import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/daftar-ulang/halaqah
 * Fetch available halaqah for daftar ulang
 * Sorted by day_of_week
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

    // Fetch halaqah with muallimah information and their class types
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
        max_students,
        status,
        zoom_link,
        preferred_juz,
        muallimah_id,
        users!halaqah_muallimah_id_fkey (
          id,
          full_name,
          email
        ),
        muallimah_registrations!inner (
          class_type,
          preferred_juz,
          preferred_schedule
        )
      `)
      .eq('status', 'active')
      .eq('muallimah_registrations.batch_id', registration.batch_id)
      .eq('muallimah_registrations.status', 'approved')
      .order('day_of_week', { ascending: true })

    if (halaqahError) {
      console.error('Error fetching halaqah:', halaqahError)
      return NextResponse.json(
        { error: 'Failed to fetch halaqah data' },
        { status: 500 }
      )
    }

    // Process halaqah data
    const processedHalaqah = (halaqahData || []).map(h => {
      // For now, calculate current students from halaqah_students table
      // TODO: Add proper student count tracking from daftar_ulang_submissions
      const currentStudents = 0 // Default to 0 since we don't have real-time tracking
      const maxStudents = h.max_students || 20
      const isFull = currentStudents >= maxStudents
      const availableSlots = maxStudents - currentStudents

      // Handle muallimah from users relation (comes as single object, not array)
      const muallimah = (h as any).users

      // Get muallimah registration data for class type and preferred juz
      const muallimahReg = (h as any).muallimah_registrations?.[0]
      const classType = muallimahReg?.class_type || 'tashih_ujian' // Default to both
      const muallimahPreferredJuz = muallimahReg?.preferred_juz || h.preferred_juz
      const muallimahSchedule = muallimahReg?.preferred_schedule

      // Determine class types from muallimah registration
      // class_type can be: 'tashih_ujian', 'tashih_only', 'ujian_only'
      let classTypes: Array<{ class_type: string; label: string }> = []
      if (classType === 'tashih_ujian' || classType === 'tashih_only') {
        classTypes.push({ class_type: 'tashih', label: 'Tashih' })
      }
      if (classType === 'tashih_ujian' || classType === 'ujian_only') {
        classTypes.push({ class_type: 'ujian', label: 'Ujian' })
      }

      return {
        ...h,
        total_current_students: currentStudents,
        total_max_students: maxStudents,
        available_slots: availableSlots,
        is_full: isFull,
        class_type: classType, // 'tashih_ujian', 'tashih_only', or 'ujian_only'
        class_types: classTypes,
        muallimah_preferred_juz: muallimahPreferredJuz,
        muallimah_schedule: muallimahSchedule,
        mentors: muallimah ? [{
          mentor_id: muallimah.id,
          role: 'muallimah',
          is_primary: true,
          users: {
            full_name: muallimah.full_name
          }
        }] : [] // Use muallimah from users table
      }
    })

    // Get user's existing daftar ulang submission if any
    const { data: existingSubmission } = await supabase
      .from('daftar_ulang_submissions')
      .select('*')
      .eq('user_id', user.id)
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
