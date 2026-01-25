import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/admin/pairing/bulk-pair
 *
 * Bulk pair users automatically based on priority order
 *
 * Body:
 * - batch_id: Batch ID
 */
export async function POST(request: Request) {
  const supabase = createClient()

  // 1. Verify admin access
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.roles || !profile.roles.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Parse request body
  const body = await request.json()
  const { batch_id } = body

  if (!batch_id) {
    return NextResponse.json(
      { error: 'batch_id is required' },
      { status: 400 }
    )
  }

  try {
    // 3. Fetch all system_match users who are not yet paired (both submitted and approved)
    const { data: submissions, error: submissionsError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, id, status')
      .eq('batch_id', batch_id)
      .eq('partner_type', 'system_match')
      .in('status', ['submitted', 'approved'])

    if (submissionsError) throw submissionsError

    if (!submissions || submissions.length === 0) {
      return NextResponse.json(
        { error: 'No system_match users found' },
        { status: 404 }
      )
    }

    // 4. Fetch existing pairings to exclude already paired users
    const { data: existingPairings } = await supabase
      .from('study_partners')
      .select('user_1_id, user_2_id, user_3_id')
      .eq('batch_id', batch_id)
      .eq('pairing_status', 'active')

    const pairedUserIds = new Set<string>()
    for (const pairing of existingPairings || []) {
      pairedUserIds.add(pairing.user_1_id)
      pairedUserIds.add(pairing.user_2_id)
      if (pairing.user_3_id) pairedUserIds.add(pairing.user_3_id)
    }

    // Filter out already paired users
    const availableSubmissions = submissions.filter(s => !pairedUserIds.has(s.user_id))
    const availableUserIds = availableSubmissions.map(s => s.user_id)

    console.log('[BULK PAIR] Available users:', availableUserIds.length)

    if (availableUserIds.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 available users to create pairings' },
        { status: 400 }
      )
    }

    // 5. Fetch all users and registrations for available users
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email, zona_waktu, whatsapp')
      .in('id', availableUserIds)

    const { data: registrationsData } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('user_id, chosen_juz, main_time_slot, backup_time_slot, timezone')
      .eq('batch_id', batch_id)
      .in('user_id', availableUserIds)

    // Create maps
    const usersMap = new Map((usersData || []).map(u => [u.id, u]))
    const registrationsMap = new Map((registrationsData || []).map(r => [r.user_id, r]))

    // 6. Group matches by priority level
    interface UserMatch {
      user1_id: string
      user2_id: string
      score: number
      zona_match: boolean
      juz_match: boolean
      main_time_match: boolean
      backup_time_match: boolean
      priority: number
    }

    // Priority buckets (1-8)
    const priorityBuckets: UserMatch[][] = [[], [], [], [], [], [], [], []]

    for (let i = 0; i < availableUserIds.length; i++) {
      for (let j = i + 1; j < availableUserIds.length; j++) {
        const user1Id = availableUserIds[i]
        const user2Id = availableUserIds[j]

        const user1 = usersMap.get(user1Id)
        const user2 = usersMap.get(user2Id)
        const reg1 = registrationsMap.get(user1Id)
        const reg2 = registrationsMap.get(user2Id)

        if (!user1 || !user2 || !reg1 || !reg2) continue

        const user1Timezone = reg1.timezone || user1.zona_waktu || 'WIB'
        const user2Timezone = reg2.timezone || user2.zona_waktu || 'WIB'
        const user1Juz = reg1.chosen_juz
        const user2Juz = reg2.chosen_juz

        // Calculate match criteria
        const zonaMatch = user1Timezone === user2Timezone
        const juzMatch = user1Juz === user2Juz
        const mainTimeMatch = hasTimeSlotOverlap(reg1.main_time_slot, reg2.main_time_slot)
        const backupTimeMatch = hasTimeSlotOverlap(reg1.main_time_slot, reg2.backup_time_slot) ||
                               hasTimeSlotOverlap(reg1.backup_time_slot, reg2.main_time_slot) ||
                               hasTimeSlotOverlap(reg1.backup_time_slot, reg2.backup_time_slot)

        // Determine priority and score
        let priority = 0
        let score = 0

        if (zonaMatch && mainTimeMatch && juzMatch) {
          // Priority 1: Zona Sama + Waktu Utama + Juz Sama
          priority = 1
          score = 150
        } else if (zonaMatch && mainTimeMatch && !juzMatch) {
          // Priority 2: Zona Sama + Waktu Utama + Juz Beda
          priority = 2
          score = 100
        } else if (zonaMatch && !mainTimeMatch && backupTimeMatch && juzMatch) {
          // Priority 3: Zona Sama + Waktu Cadangan + Juz Sama
          priority = 3
          score = 85
        } else if (zonaMatch && !mainTimeMatch && backupTimeMatch && !juzMatch) {
          // Priority 4: Zona Sama + Waktu Cadangan + Juz Beda
          priority = 4
          score = 70
        } else if (!zonaMatch && mainTimeMatch && juzMatch) {
          // Priority 5: Lintas Zona + Waktu Utama + Juz Sama
          priority = 5
          score = 60
        } else if (!zonaMatch && mainTimeMatch && !juzMatch) {
          // Priority 6: Lintas Zona + Waktu Utama + Juz Beda
          priority = 6
          score = 40
        } else if (!zonaMatch && !mainTimeMatch && backupTimeMatch && juzMatch) {
          // Priority 7: Lintas Zona + Waktu Cadangan + Juz Sama
          priority = 7
          score = 30
        } else if (!zonaMatch && !mainTimeMatch && backupTimeMatch && !juzMatch) {
          // Priority 8: Lintas Zona + Waktu Cadangan + Juz Beda
          priority = 8
          score = 20
        } else {
          // No valid match, skip
          continue
        }

        const match: UserMatch = {
          user1_id: user1Id,
          user2_id: user2Id,
          score,
          zona_match: zonaMatch,
          juz_match: juzMatch,
          main_time_match: mainTimeMatch,
          backup_time_match: backupTimeMatch,
          priority,
        }

        // Add to corresponding priority bucket (index 0 = priority 1)
        priorityBuckets[priority - 1].push(match)
      }
    }

    // Log summary of matches per priority
    for (let i = 0; i < 8; i++) {
      console.log(`[BULK PAIR] Priority ${i + 1}: ${priorityBuckets[i].length} matches`)
    }

    // 7. Create pairings by priority level (not greedy)
    const pairedUsers = new Set<string>()
    const createdPairings = []
    const pairingAnalysis = []

    // Process each priority level in order
    for (let priority = 1; priority <= 8; priority++) {
      const bucket = priorityBuckets[priority - 1]

      // Shuffle within bucket to ensure fairness when multiple pairs have same priority
      // (otherwise the first ones in the list would always get priority)
      const shuffled = [...bucket].sort(() => Math.random() - 0.5)

      for (const match of shuffled) {
        if (pairedUsers.has(match.user1_id) || pairedUsers.has(match.user2_id)) {
          continue // Skip if either user is already paired
        }

        // Create the pairing
        const [smallerUserId, largerUserId] = match.user1_id < match.user2_id
          ? [match.user1_id, match.user2_id]
          : [match.user2_id, match.user1_id]

        const { error: pairingError } = await supabase
          .from('study_partners')
          .insert({
            batch_id,
            user_1_id: smallerUserId,
            user_2_id: largerUserId,
            pairing_type: 'system_match',
            pairing_status: 'active',
            paired_by: user.id,
            paired_at: new Date().toISOString(),
          })

        if (pairingError) {
          console.error('[BULK PAIR] Error creating pairing:', pairingError)
          continue
        }

        // Update both submissions
        await supabase
          .from('daftar_ulang_submissions')
          .update({ pairing_status: 'paired' })
          .eq('user_id', match.user1_id)
          .eq('batch_id', batch_id)

        await supabase
          .from('daftar_ulang_submissions')
          .update({ pairing_status: 'paired' })
          .eq('user_id', match.user2_id)
          .eq('batch_id', batch_id)

        // Mark users as paired
        pairedUsers.add(match.user1_id)
        pairedUsers.add(match.user2_id)

        createdPairings.push({
          user_1_id: match.user1_id,
          user_2_id: match.user2_id,
          score: match.score,
        })

        pairingAnalysis.push({
          user1_name: usersMap.get(match.user1_id)?.full_name,
          user2_name: usersMap.get(match.user2_id)?.full_name,
          zona_match: match.zona_match,
          juz_match: match.juz_match,
          main_time_match: match.main_time_match,
          backup_time_match: match.backup_time_match,
          score: match.score,
          match_type: getMatchType(match),
        })

        console.log('[BULK PAIR] Created pairing:', {
          user1: usersMap.get(match.user1_id)?.full_name,
          user2: usersMap.get(match.user2_id)?.full_name,
          score: match.score,
          priority,
          match_type: getMatchType(match),
        })
      }
    }

    // Log unpaired users
    const unpairedUsers = availableUserIds.filter(id => !pairedUsers.has(id))
    console.log('[BULK PAIR] Unpaired users:', unpairedUsers.length, unpairedUsers.map(id => usersMap.get(id)?.full_name))

    // 8. Revalidate paths
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdPairings.length} pairing(s)`,
      data: {
        created_count: createdPairings.length,
        total_users: availableUserIds.length,
        unpaired_count: unpairedUsers.length,
        pairings: createdPairings,
        analysis: pairingAnalysis,
      }
    })
  } catch (error: any) {
    console.error('Error creating bulk pairings:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create bulk pairings' },
      { status: 500 }
    )
  }
}

function getMatchType(match: any): string {
  if (match.zona_match && match.juz_match && match.main_time_match) {
    return 'Priority 1: Zona Sama + Waktu Utama + Juz Sama'
  }
  if (match.zona_match && match.main_time_match && !match.juz_match) {
    return 'Priority 2: Zona Sama + Waktu Utama + Juz Beda'
  }
  if (match.zona_match && match.juz_match && !match.main_time_match && match.backup_time_match) {
    return 'Priority 3: Zona Sama + Waktu Cadangan + Juz Sama'
  }
  if (match.zona_match && match.backup_time_match && !match.main_time_match && !match.juz_match) {
    return 'Priority 4: Zona Sama + Waktu Cadangan + Juz Beda'
  }
  if (!match.zona_match && match.main_time_match && match.juz_match) {
    return 'Priority 5: Lintas Zona + Waktu Utama + Juz Sama'
  }
  if (!match.zona_match && match.main_time_match && !match.juz_match) {
    return 'Priority 6: Lintas Zona + Waktu Utama + Juz Beda'
  }
  if (!match.zona_match && !match.main_time_match && match.backup_time_match && match.juz_match) {
    return 'Priority 7: Lintas Zona + Waktu Cadangan + Juz Sama'
  }
  if (!match.zona_match && !match.main_time_match && match.backup_time_match && !match.juz_match) {
    return 'Priority 8: Lintas Zona + Waktu Cadangan + Juz Beda'
  }
  return 'Unknown Priority'
}

function hasTimeSlotOverlap(slot1: string, slot2: string): boolean {
  if (!slot1 || !slot2) return false

  const parseSlot = (slot: string) => {
    const [start, end] = slot.split('-').map(Number)
    return { start, end }
  }

  const s1 = parseSlot(slot1)
  const s2 = parseSlot(slot2)

  return s1.start < s2.end && s2.start < s1.end
}
