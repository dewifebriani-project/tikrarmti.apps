import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/pairing
 *
 * Fetch all pairing requests for admin review
 *
 * Query params:
 * - batch_id: Filter by batch (optional)
 * - status: Filter by status (optional) - 'pending', 'approved', 'rejected', 'paired'
 */
export async function GET(request: Request) {
  const supabase = createClient()

  // 1. Verify admin access
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.roles || !profile.roles.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Parse query params
  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batch_id')
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    // 3. Fetch pairing requests with pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // First, get total count for all partner types (both submitted and approved)
    const { count: totalCount, error: countError } = await supabase
      .from('daftar_ulang_submissions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['submitted', 'approved'])
      .eq('batch_id', batchId || '')

    if (countError) throw countError

    console.log('[PAIRING API] Total submissions count:', totalCount)

    // Fetch paginated data for ALL partner types
    let query = supabase
      .from('daftar_ulang_submissions')
      .select(`
        id,
        user_id,
        batch_id,
        registration_id,
        status,
        pairing_status,
        partner_type,
        partner_user_id,
        partner_name,
        partner_relationship,
        partner_notes,
        submitted_at,
        users!daftar_ulang_submissions_user_id_fkey (
          id,
          full_name,
          email,
          zona_waktu,
          whatsapp
        ),
        registrations:pendaftaran_tikrar_tahfidz!daftar_ulang_submissions_registration_id_fkey (
          id,
          chosen_juz,
          main_time_slot,
          backup_time_slot,
          timezone
        ),
        batch:batches!daftar_ulang_submissions_batch_id_fkey (
          id,
          name
        )
      `)
      .in('status', ['submitted', 'approved']) // Get both submitted and approved daftar ulang

    if (batchId) {
      query = query.eq('batch_id', batchId)
    }

    // Fetch ALL submissions without pagination for filtering
    const { data: submissions, error } = await query
      .order('submitted_at', { ascending: false })

    if (error) throw error

    // DEBUG: Log the raw submission data to see structure
    console.log('[PAIRING API] Raw submissions data (first 2):', JSON.stringify(submissions?.slice(0, 2), null, 2))

    // 4. Filter to keep only the latest submission per user (same as statistics API)
    const uniqueUserSubmissions = new Map<string, any>()

    for (const submission of submissions || []) {
      const userId = submission.user_id

      // Skip if already approved and paired (should not appear in pending list)
      if (submission.status === 'approved' && submission.pairing_status === 'paired') {
        continue
      }

      // Only keep the latest submission for each user
      if (!uniqueUserSubmissions.has(userId)) {
        uniqueUserSubmissions.set(userId, submission)
      }
    }

    console.log('[PAIRING API] Filtered to unique users:', uniqueUserSubmissions.size, 'from', submissions?.length)

    // Count per partner type after filtering
    const partnerTypeCounts: Record<string, number> = { self_match: 0, system_match: 0, tarteel: 0, family: 0 }
    uniqueUserSubmissions.forEach((sub: any) => {
      const type = sub.partner_type
      if (type && partnerTypeCounts.hasOwnProperty(type)) {
        partnerTypeCounts[type] = (partnerTypeCounts[type] || 0) + 1
      }
    })
    console.log('[PAIRING API] Unique users per partner type:', JSON.stringify(partnerTypeCounts, null, 2))

    // Convert Map to Array for iteration
    const uniqueSubmissionsArray = Array.from(uniqueUserSubmissions.values())

    // 5. Build a map of all self-match requests for mutual match detection
    const selfMatchMap = new Map<string, any>()
    const processedMutualMatches = new Set<string>() // Track processed mutual matches to avoid duplicates

    for (const submission of uniqueSubmissionsArray) {
      if (submission.partner_type === 'self_match' && submission.partner_user_id) {
        selfMatchMap.set(submission.user_id, {
          submission_id: submission.id,
          partner_user_id: submission.partner_user_id,
          batch_id: submission.batch_id
        })
      }
    }

    // 6. Transform data for frontend with mutual match detection
    const selfMatchRequests = []
    const systemMatchRequests = []
    const tarteelRequests = []
    const familyRequests = []

    console.log('[PAIRING API] Starting to process', uniqueSubmissionsArray.length, 'unique submissions')

    for (const submission of uniqueSubmissionsArray) {
      // Supabase returns nested relations - check if array or object
      // Try both structures to handle different Supabase response formats
      const users = (Array.isArray(submission.users) ? submission.users : (submission.users ? [submission.users] : [])) as any
      const registrations = (Array.isArray(submission.registrations) ? submission.registrations : (submission.registrations ? [submission.registrations] : [])) as any
      const batch = (Array.isArray(submission.batch) ? submission.batch : (submission.batch ? [submission.batch] : [])) as any

      // Use timezone from registration (pendaftaran_tikrar_tahfidz) if available,
      // otherwise fall back to zona_waktu from users table
      const userTimezone = registrations?.[0]?.timezone || users?.[0]?.zona_waktu || 'WIB'

      // DEBUG: Log individual submission structure
      console.log('[PAIRING API] Processing submission:', {
        submission_id: submission.id,
        user_id: submission.user_id,
        has_users: !!submission.users,
        users_type: typeof submission.users,
        users_value: submission.users,
        has_registrations: !!submission.registrations,
        registrations_type: typeof submission.registrations,
        registrations_value: submission.registrations,
      })

      const requestData = {
        id: submission.id,
        user_id: submission.user_id,
        user_name: users?.[0]?.full_name,
        user_email: users?.[0]?.email,
        user_zona_waktu: userTimezone,
        user_wa_phone: users?.[0]?.whatsapp,
        chosen_juz: registrations?.[0]?.chosen_juz,
        main_time_slot: registrations?.[0]?.main_time_slot,
        backup_time_slot: registrations?.[0]?.backup_time_slot,
        partner_type: submission.partner_type,
        partner_user_id: submission.partner_user_id,
        partner_name: submission.partner_name,
        partner_relationship: submission.partner_relationship,
        partner_notes: submission.partner_notes,
        submitted_at: submission.submitted_at,
        batch_id: submission.batch_id,
        batch_name: batch?.[0]?.name,
      }

      console.log('[PAIRING API] requestData built:', JSON.stringify(requestData, null, 2))

      if (submission.partner_type === 'self_match') {
        // Skip if this is the second half of a mutual match (already processed)
        if (processedMutualMatches.has(submission.user_id)) {
          continue
        }

        // Fetch partner details and check for mutual match
        if (submission.partner_user_id) {
          const { data: partnerUser } = await supabase
            .from('users')
            .select('id, full_name, email, zona_waktu, whatsapp')
            .eq('id', submission.partner_user_id)
            .single()

          let partnerRegistration = null
          if (partnerUser) {
            const { data } = await supabase
              .from('pendaftaran_tikrar_tahfidz')
              .select('chosen_juz, main_time_slot, backup_time_slot, timezone')
              .eq('user_id', submission.partner_user_id)
              .eq('batch_id', submission.batch_id)
              .maybeSingle()

            partnerRegistration = data
          }

          // Check for mutual match: does the partner also choose this user?
          const partnerChoice = selfMatchMap.get(submission.partner_user_id)
          const isMutualMatch = partnerChoice?.partner_user_id === submission.user_id

          // Get partner's submission if mutual match exists
          let partnerSubmissionId = null
          if (isMutualMatch && partnerChoice) {
            partnerSubmissionId = partnerChoice.submission_id
            // Mark the partner as processed so we don't show them again
            processedMutualMatches.add(submission.partner_user_id)
          }

          selfMatchRequests.push({
            ...requestData,
            partner_details: partnerUser ? {
              id: partnerUser.id,
              full_name: partnerUser.full_name,
              email: partnerUser.email,
              zona_waktu: partnerRegistration?.timezone || partnerUser.zona_waktu || 'WIB',
              wa_phone: partnerUser.whatsapp,
              chosen_juz: partnerRegistration?.chosen_juz || 'N/A',
              main_time_slot: partnerRegistration?.main_time_slot || 'N/A',
              backup_time_slot: partnerRegistration?.backup_time_slot || 'N/A',
              is_registered_in_batch: !!partnerRegistration,
            } : null,
            is_mutual_match: isMutualMatch,
            partner_submission_id: partnerSubmissionId,
          })
        }
      } else if (submission.partner_type === 'system_match') {
        systemMatchRequests.push(requestData)
      } else if (submission.partner_type === 'tarteel') {
        tarteelRequests.push(requestData)
      } else if (submission.partner_type === 'family') {
        familyRequests.push(requestData)
      }
    }

    // Count mutual matches vs non-mutual
    const mutualMatchCount = selfMatchRequests.filter((r: any) => r.is_mutual_match).length
    const nonMutualMatchCount = selfMatchRequests.length - mutualMatchCount
    console.log('[PAIRING API] Final counts - Self:', selfMatchRequests.length, `(${mutualMatchCount} mutual + ${nonMutualMatchCount} non-mutual)`, 'System:', systemMatchRequests.length, 'Tarteel:', tarteelRequests.length, 'Family:', familyRequests.length)

    return NextResponse.json({
      success: true,
      data: {
        self_match_requests: selfMatchRequests,
        system_match_requests: systemMatchRequests,
        tarteel_requests: tarteelRequests,
        family_requests: familyRequests,
      },
      debug: {
        totalSubmissions: totalCount,
        uniqueUsersCount: uniqueSubmissionsArray.length,
        partnerTypeCounts: partnerTypeCounts,
        finalCounts: {
          selfMatch: selfMatchRequests.length,
          systemMatch: systemMatchRequests.length,
          tarteel: tarteelRequests.length,
          family: familyRequests.length,
        },
        selfMatchBreakdown: {
          totalUsers: partnerTypeCounts.self_match,
          mutualMatchPairs: mutualMatchCount,
          nonMutualUsers: nonMutualMatchCount,
          totalEntriesShown: selfMatchRequests.length,
          explanation: `${partnerTypeCounts.self_match} unique users = ${mutualMatchCount} mutual pairs (${mutualMatchCount * 2} users) + ${nonMutualMatchCount} non-mutual users = ${selfMatchRequests.length} entries displayed`
        },
        logs: {
          totalSubmissionsCount: totalCount,
          filteredToUniqueUsers: `${uniqueSubmissionsArray.length} from ${submissions?.length}`,
          uniqueUsersPerPartnerType: partnerTypeCounts,
          finalCounts: {
            selfMatch: selfMatchRequests.length,
            systemMatch: systemMatchRequests.length,
            tarteel: tarteelRequests.length,
            family: familyRequests.length,
          },
        },
      },
      pagination: {
        page,
        limit,
        total: uniqueSubmissionsArray.length, // Use unique users count
        totalPages: 1, // All data shown on one page
        originalTotal: totalCount || 0, // Original submission count for reference
      },
    })
  } catch (error: any) {
    console.error('Error fetching pairing requests:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pairing requests' },
      { status: 500 }
    )
  }
}
