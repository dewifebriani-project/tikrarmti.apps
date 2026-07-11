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
    // INCLUDING extra fields for the marketplace UI
    const { data: allSelectedThalibah } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('user_id, full_name, chosen_juz, main_time_slot, backup_time_slot, domicile, timezone, birth_date, wa_phone')
      .eq('batch_id', registration.batch_id)
      .eq('selection_status', 'selected')
      .neq('user_id', user.id) // Exclude current user

    // Fetch all submissions in this batch to determine who selected who
    const { data: allSubmissions } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, partner_user_id')
      .eq('batch_id', registration.batch_id)
      .eq('partner_type', 'self_match')
      .in('status', ['submitted', 'approved']) // Only locked submissions count

    const submissions = allSubmissions || []
    
    // Map of user_id -> partner_user_id they selected
    const userChoices = new Map<string, string>()
    submissions.forEach(sub => {
      if (sub.partner_user_id) {
        userChoices.set(sub.user_id, sub.partner_user_id)
      }
    })

    // Find mutual matches
    // A mutual match is when user A chose user B, and user B chose user A.
    const mutualMatchesSet = new Set<string>()
    userChoices.forEach((chosenPartnerId, userId) => {
      if (userChoices.get(chosenPartnerId) === userId) {
        mutualMatchesSet.add(userId)
        mutualMatchesSet.add(chosenPartnerId)
      }
    })

    // Check who selected the CURRENT user
    const selectedByOthersSet = new Set<string>()
    userChoices.forEach((chosenPartnerId, userId) => {
      if (chosenPartnerId === user.id) {
        selectedByOthersSet.add(userId)
      }
    })

    // Current user's own choice
    const currentUserChoice = userChoices.get(user.id)

    // Filter available partners based on logic
    const partners = (allSelectedThalibah || []).filter(reg => {
      const partnerId = reg.user_id
      
      // 1. If they are part of a mutual match (with ANYONE), exclude them entirely
      if (mutualMatchesSet.has(partnerId)) {
        return false
      }
      
      // 2. If they have submitted a choice that is NOT the current user, exclude them
      // (They are locked to someone else)
      const theirChoice = userChoices.get(partnerId)
      if (theirChoice && theirChoice !== user.id) {
        return false
      }
      
      // 3. Otherwise, they are available
      return true
    }).map(reg => {
      // Calculate schedule compatibility
      const schedule_compatible = checkScheduleCompatibility(
        registration,
        reg
      )

      return {
        user_id: reg.user_id,
        registration_id: registration.id,
        status: 'available',
        created_at: null,
        users: {
          id: reg.user_id,
          full_name: reg.full_name,
          email: null,
          whatsapp: null
        },
        registrations: [reg],
        is_mutual_match: false, // Since we filtered them out, this is technically false for all returned
        has_user_selected_them: selectedByOthersSet.has(reg.user_id),
        has_selected_them: currentUserChoice === reg.user_id,
        schedule_compatible: schedule_compatible,
        juz_compatible: registration.chosen_juz === reg.chosen_juz
      }
    })

    // Sort: Those who selected current user first, then those with matching juz/schedule
    partners.sort((a, b) => {
      if (a.has_user_selected_them && !b.has_user_selected_them) return -1
      if (!a.has_user_selected_them && b.has_user_selected_them) return 1
      if (a.juz_compatible && !b.juz_compatible) return -1
      if (!a.juz_compatible && b.juz_compatible) return 1
      if (a.schedule_compatible && !b.schedule_compatible) return -1
      if (!a.schedule_compatible && b.schedule_compatible) return 1
      return 0
    })

    const partners_selected_by_others = partners.filter(p => p.has_user_selected_them)
    const partners_selected_by_user = partners.filter(p => p.has_selected_them)

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
        all_available_partners: partners, // Now filtered based on marketplace logic
        partners_selected_by_others,
        partners_selected_by_user,
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

// Keep POST for backward compatibility or future use
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Deprecated' }, { status: 400 })
}
