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

    // Get user's registration to find batch_id and calculate final juz
    const { data: registration, error: regError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('batch_id, chosen_juz, exam_score, main_time_slot, backup_time_slot')
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

    // Calculate final juz placement based on exam score
    const examScore = registration.exam_score || null
    const chosenJuz = (registration.chosen_juz || '').toUpperCase()
    let finalJuz = chosenJuz

    if (examScore !== null && examScore < 70) {
      if (chosenJuz === '28A' || chosenJuz === '28B' || chosenJuz === '28') {
        finalJuz = '29A'
      } else if (chosenJuz === '1A' || chosenJuz === '1B' || chosenJuz === '29A' || chosenJuz === '29B' || chosenJuz === '29' || chosenJuz === '1') {
        finalJuz = '30A'
      }
    }

    // Fetch halaqah without joining to users table (to avoid RLS issues)
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
        muallimah_id
      `)
      .eq('status', 'active')
      .order('day_of_week', { ascending: true })

    if (halaqahError) {
      console.error('Error fetching halaqah:', halaqahError)
      return NextResponse.json(
        { error: 'Failed to fetch halaqah data', details: halaqahError.message },
        { status: 500 }
      )
    }

    // Fetch muallimah registrations separately for this batch
    // Include full_name to get muallimah name without querying users table
    const { data: muallimahRegs } = await supabase
      .from('muallimah_registrations')
      .select('user_id, class_type, preferred_juz, preferred_schedule, full_name')
      .eq('batch_id', registration.batch_id)
      .eq('status', 'approved')

    // Create a map for quick lookup
    const muallimahMap = new Map(
      (muallimahRegs || []).map(reg => [reg.user_id, reg])
    )

    // Fetch user's existing daftar ulang submission if any (to exclude from quota calculation)
    const { data: existingSubmission } = await supabase
      .from('daftar_ulang_submissions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Fetch all submissions for this batch to count students per halaqah
    // IMPORTANT: Only count 'submitted' and 'approved' status - 'draft' does NOT reduce quota
    // This matches what admin sees in the per halaqah tab
    const { data: submissions } = await supabase
      .from('daftar_ulang_submissions')
      .select('ujian_halaqah_id, tashih_halaqah_id, is_tashih_umum, status, user_id')
      .eq('batch_id', registration.batch_id)
      .in('status', ['submitted', 'approved'])

    // Fetch halaqah_students (assigned thalibah with active status only)
    // IMPORTANT: waitlist does NOT reduce quota, only active status counts
    const { data: halaqahStudents } = await supabase
      .from('halaqah_students')
      .select('halaqah_id, thalibah_id, status')
      .eq('status', 'active')

    // Count students per halaqah
    // Use a Set to track unique users per halaqah
    const halaqahStudentMap = new Map<string, Set<string>>()

    if (submissions) {
      for (const sub of submissions) {
        // Skip current user's existing submission when counting quota
        // (they will be updating their choice, not taking an additional slot)
        if (sub.user_id === user.id) continue

        // For tashih_ujian classes, ujian_halaqah_id and tashih_halaqah_id are the same
        // We need to count each user only once per halaqah, even if they selected both ujian and tashih
        const uniqueHalaqahIds: string[] = []

        if (sub.ujian_halaqah_id) {
          uniqueHalaqahIds.push(sub.ujian_halaqah_id)
        }
        if (sub.tashih_halaqah_id && !sub.is_tashih_umum) {
          // Only add if not already in the list (for tashih_ujian case)
          if (!uniqueHalaqahIds.includes(sub.tashih_halaqah_id)) {
            uniqueHalaqahIds.push(sub.tashih_halaqah_id)
          }
        }

        // Add user to each unique halaqah
        for (let i = 0; i < uniqueHalaqahIds.length; i++) {
          const halaqahId = uniqueHalaqahIds[i]
          if (!halaqahStudentMap.has(halaqahId)) {
            halaqahStudentMap.set(halaqahId, new Set())
          }
          halaqahStudentMap.get(halaqahId)!.add(sub.user_id)
        }
      }
    }

    // Also count students from halaqah_students table (active only)
    // Waitlist does NOT reduce quota, only active status counts
    if (halaqahStudents) {
      for (const student of halaqahStudents) {
        // Skip current user if they're already in halaqah_students
        if (student.thalibah_id === user.id) continue

        const halaqahId = student.halaqah_id
        if (!halaqahStudentMap.has(halaqahId)) {
          halaqahStudentMap.set(halaqahId, new Set())
        }
        halaqahStudentMap.get(halaqahId)!.add(student.thalibah_id)
      }
    }

    // Convert Set to count
    const halaqahStudentCount = new Map<string, number>()
    const entries = Array.from(halaqahStudentMap.entries())
    for (let i = 0; i < entries.length; i++) {
      const [halaqahId, userSet] = entries[i]
      halaqahStudentCount.set(halaqahId, userSet.size)
    }

    // Process halaqah data and filter by thalibah's juz
    const processedHalaqah = (halaqahData || [])
      .map(h => {
        // Get current student count from submissions map
        const currentStudents = halaqahStudentCount.get(h.id) || 0
        const maxStudents = h.max_students || 20
        const isFull = currentStudents >= maxStudents
        const availableSlots = maxStudents - currentStudents

        // Get muallimah registration data from the map using muallimah_id
        // No longer using users relation join - get data directly from muallimah_registrations
        const muallimahReg = h.muallimah_id ? muallimahMap.get(h.muallimah_id) : null
        const classType = muallimahReg?.class_type || 'tashih_ujian' // Default to both
        const muallimahPreferredJuz = muallimahReg?.preferred_juz || h.preferred_juz
        const muallimahName = muallimahReg?.full_name || 'Muallimah'

        // Use halaqah schedule first, fallback to muallimah_registrations schedule
        const halaqahSchedule = (h.day_of_week !== null && h.start_time && h.end_time)
          ? JSON.stringify({
              day: ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][h.day_of_week],
              time_start: h.start_time,
              time_end: h.end_time
            })
          : muallimahReg?.preferred_schedule || null

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
          muallimah_schedule: halaqahSchedule, // Use halaqah or muallimah schedule
          mentors: muallimahReg ? [{
            mentor_id: h.muallimah_id,
            role: 'muallimah',
            is_primary: true,
            users: {
              full_name: muallimahName
            }
          }] : [] // Use muallimah name from muallimah_registrations
        }
      })
      // Filter halaqah: only show those matching thalibah's FINAL juz with muallimah's preferred_juz
      // If muallimah_preferred_juz is null or empty, include it (means muallimah teaches all juz)
      .filter(h => {
        if (!h.muallimah_preferred_juz) return true // Muallimah teaches all juz

        // Use finalJuz (adjusted based on written quiz score) instead of chosen_juz
        const thalibahJuz = finalJuz

        // Parse muallimah's preferred_juz (could be comma-separated like "30,29" or single "30")
        const muallimahJuzList = h.muallimah_preferred_juz.split(',').map((j: string) => j.trim())

        // Check if there's a match
        return muallimahJuzList.some((muallimahJuz: string) => {
          // Exact match
          if (muallimahJuz === thalibahJuz) return true

          // Check base juz (e.g., "30" matches "30A", "30B", "30")
          if (thalibahJuz.startsWith(muallimahJuz)) return true

          // Check if muallimah's juz starts with thalibah's juz (e.g., "30A" matches "30")
          if (muallimahJuz.startsWith(thalibahJuz)) return true

          return false
        })
      })
      // Filter out tashih_only classes from daftar ulang page
      .filter(h => h.class_type !== 'tashih_only')

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
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
