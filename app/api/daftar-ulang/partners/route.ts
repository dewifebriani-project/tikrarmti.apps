import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/daftar-ulang/partners
 * Fetch ALL eligible partners for self-matching
 * Returns all thalibah who passed selection (selection_status='selected')
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

    // Get user's registration data
    const { data: registration, error: regError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, batch_id, chosen_juz, main_time_slot, backup_time_slot, full_name')
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

    // Fetch ALL thalibah who passed selection in the same batch (for partner search)
    const { data: allSelectedThalibah } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('user_id, full_name, chosen_juz, main_time_slot, backup_time_slot')
      .eq('batch_id', registration.batch_id)
      .eq('selection_status', 'selected')
      .neq('user_id', user.id) // Exclude current user

    // Get users who have selected current user as partner (for showing who selected you)
    const { data: selectedByOthers } = await supabase
      .from('partner_preferences')
      .select(`
        user_id,
        status,
        created_at
      `)
      .eq('preferred_partner_id', user.id)
      .eq('registration_id', registration.id)
      .in('status', ['pending', 'accepted'])

    // Get users that current user has selected
    const { data: selectedByUser } = await supabase
      .from('partner_preferences')
      .select(`
        preferred_partner_id,
        status,
        created_at
      `)
      .eq('user_id', user.id)
      .eq('registration_id', registration.id)

    // Create Sets for quick lookup
    const selectedByOthersSet = new Set((selectedByOthers || []).map((p: any) => p.user_id))
    const selectedByUserSet = new Set((selectedByUser || []).map((p: any) => p.preferred_partner_id))

    // Check for mutual matches
    const mutualMatchesSet = new Set()
    ;(selectedByUser || []).forEach((pref: any) => {
      const isMutual = (selectedByOthers || []).some((other: any) =>
        other.user_id === pref.preferred_partner_id &&
        other.preferred_partner_id === user.id &&
        pref.status === 'accepted' &&
        other.status === 'accepted'
      )
      if (isMutual) {
        mutualMatchesSet.add(pref.preferred_partner_id)
      }
    })

    // Build partner list - ALL selected thalibah can be chosen as partners
    const partners = (allSelectedThalibah || []).map((reg: any) => {
      // Calculate schedule compatibility
      const schedule_compatible = checkScheduleCompatibility(
        registration,
        reg
      )

      return {
        user_id: reg.user_id,
        registration_id: registration.id, // Use current user's registration_id for creating preferences
        status: 'available', // All thalibah are available to be selected
        created_at: null,
        users: {
          id: reg.user_id,
          full_name: reg.full_name,
          email: null,
          whatsapp: null
        },
        registrations: [reg],
        is_mutual_match: mutualMatchesSet.has(reg.user_id),
        has_user_selected_them: selectedByOthersSet.has(reg.user_id),
        has_selected_them: selectedByUserSet.has(reg.user_id),
        schedule_compatible: schedule_compatible,
        juz_compatible: registration.chosen_juz === reg.chosen_juz
      }
    })

    // Separate lists for display purposes
    const partners_selected_by_others = partners.filter(p => p.has_user_selected_them)
    const partners_selected_by_user = (selectedByUser || []).map((pref: any) => {
      const partnerReg = (allSelectedThalibah || []).find(r => r.user_id === pref.preferred_partner_id)
      return {
        ...pref,
        users: partnerReg ? {
          id: partnerReg.user_id,
          full_name: partnerReg.full_name
        } : null,
        registrations: partnerReg ? [partnerReg] : []
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        current_user: {
          id: user.id,
          registration_id: registration.id,
          chosen_juz: registration.chosen_juz,
          main_time_slot: registration.main_time_slot,
          backup_time_slot: registration.backup_time_slot
        },
        all_available_partners: partners, // ALL selected thalibah
        partners_selected_by_others: partners_selected_by_others,
        partners_selected_by_user: partners_selected_by_user,
        mutual_matches: Array.from(mutualMatchesSet)
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

/**
 * Helper function to check schedule compatibility
 * Two users are compatible if their main or backup time slots match
 */
function checkScheduleCompatibility(
  userReg: { main_time_slot: string; backup_time_slot: string },
  partnerReg: { chosen_juz?: string; main_time_slot?: string; backup_time_slot?: string } | null | undefined
): boolean {
  if (!partnerReg) return false

  const userSlots = [userReg.main_time_slot, userReg.backup_time_slot]
  const partnerSlots = [partnerReg.main_time_slot || '', partnerReg.backup_time_slot || '']

  return userSlots.some(slot => slot && partnerSlots.includes(slot))
}

/**
 * POST /api/daftar-ulang/partners
 * Create or update partner preference
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { preferred_partner_id, registration_id, action } = body

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!preferred_partner_id || !registration_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if registration belongs to user
    const { data: registration } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, user_id')
      .eq('id', registration_id)
      .eq('user_id', user.id)
      .single()

    if (!registration) {
      return NextResponse.json(
        { error: 'Invalid registration' },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      // Update existing preference to accepted
      const { data, error } = await supabase
        .from('partner_preferences')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('preferred_partner_id', preferred_partner_id)
        .eq('registration_id', registration_id)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    } else if (action === 'reject') {
      // Update existing preference to rejected
      const { data, error } = await supabase
        .from('partner_preferences')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('preferred_partner_id', preferred_partner_id)
        .eq('registration_id', registration_id)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    } else {
      // Create new preference (pending)
      const { data, error } = await supabase
        .from('partner_preferences')
        .insert({
          user_id: user.id,
          preferred_partner_id,
          registration_id,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
