import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/daftar-ulang/partners
 * Fetch eligible partners for self-matching
 * Returns users who also selected them as partner
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

    // Get users who have selected current user as partner
    const { data: selectedByOthers, error: prefError } = await supabase
      .from('partner_preferences')
      .select(`
        id,
        user_id,
        status,
        created_at,
        users!partner_preferences_user_id_fkey (
          id,
          full_name,
          email,
          whatsapp
        ),
        registrations:pendaftaran_tikrar_tahfidz!partner_preferences_registration_id_fkey (
          chosen_juz,
          main_time_slot,
          backup_time_slot
        )
      `)
      .eq('preferred_partner_id', user.id)
      .eq('registration_id', registration.id)
      .in('status', ['pending', 'accepted'])

    if (prefError) {
      console.error('Error fetching partner preferences:', prefError)
    }

    // Get users that current user has selected
    const { data: selectedByUser } = await supabase
      .from('partner_preferences')
      .select(`
        id,
        preferred_partner_id,
        status,
        created_at,
        users:partner_preferences_preferred_partner_id_fkey (
          id,
          full_name,
          email,
          whatsapp
        ),
        registrations (
          chosen_juz,
          main_time_slot,
          backup_time_slot
        )
      `)
      .eq('user_id', user.id)
      .eq('registration_id', registration.id)

    if (prefError) {
      console.error('Error fetching user preferences:', prefError)
    }

    // Check for mutual matches
    const mutualMatches = (selectedByUser || [])
      .filter((pref: any) => {
        return (selectedByOthers || []).some((other: any) =>
          other.user_id === pref.preferred_partner_id &&
          other.preferred_partner_id === user.id &&
          pref.status === 'accepted' &&
          other.status === 'accepted'
        )
      })
      .map((pref: any) => ({
        ...pref,
        is_mutual_match: true
      }))

    // Build partner list with compatibility info
    const partners = (selectedByOthers || []).map((pref: any) => ({
      ...pref,
      is_mutual_match: mutualMatches.some((m: any) => m.user_id === pref.user_id),
      has_user_selected_them: (selectedByUser || []).some((u: any) => u.preferred_partner_id === pref.user_id),
      // Calculate schedule compatibility
      schedule_compatible: checkScheduleCompatibility(
        registration,
        pref.registrations?.[0] // Supabase returns arrays for joined data
      ),
      juz_compatible: registration.chosen_juz === pref.registrations?.[0]?.chosen_juz
    }))

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
        partners_selected_by_others: partners,
        partners_selected_by_user: selectedByUser || [],
        mutual_matches: mutualMatches
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
