import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Debug endpoint to test halaqah API
 * Access: /api/debug/halaqah-test
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

    // Get user's registration
    const { data: registration, error: regError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('batch_id, chosen_juz, exam_score, main_time_slot, backup_time_slot, selection_status, status, full_name')
      .eq('user_id', user.id)
      .eq('selection_status', 'selected')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (regError || !registration) {
      return NextResponse.json({
        error: 'No valid registration found',
        user: {
          id: user.id,
          email: user.email
        },
        registration_error: regError?.message,
        debug: 'User must have a registration with selection_status = selected'
      }, { status: 404 })
    }

    // Calculate final juz
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

    // Get total active halaqah count
    const { count: totalHalaqah } = await supabase
      .from('halaqah')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Fetch halaqah
    const { data: halaqahData, error: halaqahError } = await supabase
      .from('halaqah')
      .select(`
        id,
        name,
        status,
        preferred_juz,
        max_students,
        day_of_week,
        start_time,
        end_time,
        muallimah_id
      `)
      .eq('status', 'active')
      .limit(5)

    // Get muallimah registrations for this batch
    const { data: muallimahRegs } = await supabase
      .from('muallimah_registrations')
      .select('user_id, class_type, preferred_juz, preferred_schedule')
      .eq('batch_id', registration.batch_id)
      .eq('status', 'approved')

    // Check which halaqah match the juz filter
    const halaqahWithJuzCheck = (halaqahData || []).map(h => {
      const muallimahReg = (muallimahRegs || []).find(mr => mr.user_id === h.muallimah_id)
      const muallimahPreferredJuz = muallimahReg?.preferred_juz || h.preferred_juz

      let passesJuzFilter = false
      if (!muallimahPreferredJuz) {
        passesJuzFilter = true // No juz restriction
      } else {
        const muallimahJuzList = muallimahPreferredJuz.split(',').map((j: string) => j.trim())
        passesJuzFilter = muallimahJuzList.some((muallimahJuz: string) => {
          if (muallimahJuz === finalJuz) return true
          if (finalJuz.startsWith(muallimahJuz)) return true
          if (muallimahJuz.startsWith(finalJuz)) return true
          return false
        })
      }

      return {
        id: h.id,
        name: h.name,
        muallimah_preferred_juz: muallimahPreferredJuz,
        halaqah_preferred_juz: h.preferred_juz,
        passes_juz_filter: passesJuzFilter
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      registration: {
        full_name: registration.full_name,
        chosen_juz: registration.chosen_juz,
        exam_score: registration.exam_score,
        final_juz: finalJuz,
        selection_status: registration.selection_status,
        status: registration.status,
        batch_id: registration.batch_id
      },
      halaqah_stats: {
        total_active_halaqah: totalHalaqah,
        sample_count: halaqahData?.length || 0,
        muallimah_regs_count: muallimahRegs?.length || 0
      },
      sample_halaqah: halaqahWithJuzCheck,
      next_step: 'Check if any halaqah has passes_juz_filter = true'
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
