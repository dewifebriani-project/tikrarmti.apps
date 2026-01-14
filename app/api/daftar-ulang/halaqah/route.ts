import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/daftar-ulang/halaqah
 * Fetch available halaqah for daftar ulang
 * Now uses shared quota calculation API for consistency
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

    // ===== CHECK RE-ENROLLMENT DATE =====
    // Fetch batch data to check if re-enrollment is open
    const { data: batch } = await supabase
      .from('batches')
      .select('id, re_enrollment_date, status')
      .eq('id', registration.batch_id)
      .single()

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    // Check if re-enrollment has started
    if (batch.re_enrollment_date) {
      const now = new Date()
      const reEnrollDate = new Date(batch.re_enrollment_date)

      // Set reEnrollDate to start of day (00:00:00) for comparison
      reEnrollDate.setHours(0, 0, 0, 0)
      now.setHours(0, 0, 0, 0)

      if (now < reEnrollDate) {
        const formattedDate = reEnrollDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
        return NextResponse.json(
          {
            error: 'Daftar ulang belum dibuka',
            message: `Daftar ulang akan dibuka pada tanggal ${formattedDate}`
          },
          { status: 403 }
        )
      }
    }
    // ===== END CHECK RE-ENROLLMENT DATE =====

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

    // Fetch user's existing daftar ulang submission if any
    // For submitted or approved status, include related halaqah and partner data
    const { data: existingSubmission } = await supabase
      .from('daftar_ulang_submissions')
      .select(`
        *,
        ujian_halaqah_obj:halaqah!daftar_ulang_submissions_ujian_halaqah_id_fkey (
          id,
          name,
          day_of_week,
          start_time,
          end_time,
          location
        ),
        tashih_halaqah_obj:halaqah!daftar_ulang_submissions_tashih_halaqah_id_fkey (
          id,
          name,
          day_of_week,
          start_time,
          end_time,
          location
        ),
        partner_user_obj:users!daftar_ulang_submissions_partner_user_id_fkey (
          id,
          full_name,
          whatsapp
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle()

    // Call shared quota calculation API
    // Pass user_id to exclude current user from count
    const quotaUrl = new URL('/api/shared/halaqah-quota', request.url)
    quotaUrl.searchParams.set('batch_id', registration.batch_id)
    quotaUrl.searchParams.set('user_id', user.id)

    const quotaResponse = await fetch(quotaUrl.toString(), {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    })

    if (!quotaResponse.ok) {
      const errorData = await quotaResponse.json()
      return NextResponse.json(
        { error: 'Failed to fetch quota data', details: errorData.error },
        { status: quotaResponse.status }
      )
    }

    const quotaData = await quotaResponse.json()

    // Filter halaqah by thalibah's juz and filter out tashih_only classes
    const processedHalaqah = (quotaData.data.halaqah || [])
      .map((h: any) => ({
        ...h,
        mentors: h.muallimah_name ? [{
          mentor_id: h.muallimah_id,
          role: 'muallimah',
          is_primary: true,
          users: {
            full_name: h.muallimah_name
          }
        }] : []
      }))
      .filter((h: any) => {
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
      .filter((h: any) => h.class_type !== 'tashih_only')

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
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
