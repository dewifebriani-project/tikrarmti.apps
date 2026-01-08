import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/pairing/match
 *
 * Get matching candidates for a specific user
 *
 * Query params:
 * - user_id: User ID to find matches for (required)
 * - batch_id: Batch ID (required)
 */
export async function GET(request: Request) {
  const supabase = createClient()

  // 1. Verify admin access
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Parse query params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const batchId = searchParams.get('batch_id')

  if (!userId || !batchId) {
    return NextResponse.json(
      { error: 'user_id and batch_id are required' },
      { status: 400 }
    )
  }

  try {
    // 3. Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        user_id,
        full_name,
        chosen_juz,
        main_time_slot,
        backup_time_slot,
        profiles!user_id (
          id,
          full_name,
          email,
          zona_waktu,
          wa_phone
        )
      `)
      .eq('user_id', userId)
      .eq('batch_id', batchId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found in this batch' },
        { status: 404 }
      )
    }

    // 4. Fetch all potential candidates (selected thalibah who requested system_match)
    const { data: candidates, error: candidatesError } = await supabase
      .from('daftar_ulang_submissions')
      .select(`
        user_id,
        profiles!daftar_ulang_submissions_user_id_fkey (
          id,
          full_name,
          email,
          zona_waktu,
          wa_phone
        ),
        registrations:pendaftaran_tikrar_tahfidz!daftar_ulang_submissions_registration_id_fkey (
          user_id,
          full_name,
          chosen_juz,
          main_time_slot,
          backup_time_slot
        )
      `)
      .eq('batch_id', batchId)
      .eq('partner_type', 'system_match')
      .eq('status', 'submitted')
      .neq('user_id', userId) // Exclude self

    if (candidatesError) throw candidatesError

    // 5. Calculate matches with scoring
    const matches = []

    for (const candidate of candidates || []) {
      const candidateData = {
        user_id: candidate.user_id,
        full_name: candidate.profiles?.full_name,
        email: candidate.profiles?.email,
        zona_waktu: candidate.profiles?.zona_waktu,
        wa_phone: candidate.profiles?.wa_phone,
        chosen_juz: candidate.registrations?.chosen_juz,
        main_time_slot: candidate.registrations?.main_time_slot,
        backup_time_slot: candidate.registrations?.backup_time_slot,
      }

      // Calculate matching score
      const score = calculateMatchScore(userData, candidateData)

      matches.push({
        ...candidateData,
        match_score: score,
        match_reasons: getMatchReasons(userData, candidateData),
      })
    }

    // 6. Sort by score (highest first)
    matches.sort((a, b) => b.match_score - a.match_score)

    // 7. Group by match type
    const perfectMatches = matches.filter(m => m.match_score >= 100)
    const zonaMatches = matches.filter(m => m.match_score >= 80 && m.match_score < 100)
    const juzMatches = matches.filter(m => m.match_score >= 60 && m.match_score < 80)
    const crossJuzMatches = matches.filter(m => m.match_score < 60)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          user_id: userData.user_id,
          full_name: userData.full_name,
          chosen_juz: userData.chosen_juz,
          zona_waktu: userData.profiles?.zona_waktu,
          main_time_slot: userData.main_time_slot,
          backup_time_slot: userData.backup_time_slot,
        },
        matches: {
          perfect: perfectMatches,    // Zona waktu + Juz sama
          zona_waktu: zonaMatches,    // Zona waktu sama, juz beda
          same_juz: juzMatches,       // Juz sama, zona beda
          cross_juz: crossJuzMatches, // Lintas juz dan zona
        },
        total_matches: matches.length,
      },
    })
  } catch (error: any) {
    console.error('Error calculating matches:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to calculate matches' },
      { status: 500 }
    )
  }
}

/**
 * Calculate match score between two users
 *
 * Scoring:
 * - Perfect match (zona waktu + juz option sama): 100+
 * - Zona waktu sama, juz beda: 80-99
 * - Juz sama, zona waktu beda: 60-79
 * - Lintas juz, zona waktu beda: <60
 */
function calculateMatchScore(user1: any, user2: any): number {
  let score = 0

  const user1Zona = user1.profiles?.zona_waktu || user1.zona_waktu
  const user2Zona = user2.zona_waktu

  const user1Juz = user1.chosen_juz
  const user2Juz = user2.chosen_juz

  // Priority 1: Zona waktu sama (+50 points)
  if (user1Zona && user2Zona && user1Zona === user2Zona) {
    score += 50
  }

  // Priority 2: Juz option sama (+50 points)
  if (user1Juz === user2Juz) {
    score += 50
  }

  // Priority 3: Time slot overlap (bonus +10 points)
  if (hasTimeSlotOverlap(user1.main_time_slot, user2.main_time_slot) ||
      hasTimeSlotOverlap(user1.main_time_slot, user2.backup_time_slot) ||
      hasTimeSlotOverlap(user1.backup_time_slot, user2.main_time_slot) ||
      hasTimeSlotOverlap(user1.backup_time_slot, user2.backup_time_slot)) {
    score += 10
  }

  return score
}

/**
 * Get human-readable match reasons
 */
function getMatchReasons(user1: any, user2: any): string[] {
  const reasons = []

  const user1Zona = user1.profiles?.zona_waktu || user1.zona_waktu
  const user2Zona = user2.zona_waktu

  const user1Juz = user1.chosen_juz
  const user2Juz = user2.chosen_juz

  if (user1Zona && user2Zona && user1Zona === user2Zona) {
    reasons.push(`Zona waktu sama: ${user1Zona}`)
  }

  if (user1Juz === user2Juz) {
    reasons.push(`Juz sama: ${user1Juz}`)
  }

  if (hasTimeSlotOverlap(user1.main_time_slot, user2.main_time_slot)) {
    reasons.push('Waktu utama cocok')
  }

  return reasons
}

/**
 * Check if two time slots overlap
 */
function hasTimeSlotOverlap(slot1: string, slot2: string): boolean {
  if (!slot1 || !slot2) return false

  // Extract hours from time slot (e.g., "04-06" -> [4, 6])
  const parseSlot = (slot: string) => {
    const [start, end] = slot.split('-').map(Number)
    return { start, end }
  }

  const s1 = parseSlot(slot1)
  const s2 = parseSlot(slot2)

  // Check for overlap
  return s1.start < s2.end && s2.start < s1.end
}
