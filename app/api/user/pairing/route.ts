import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/user/pairing
 *
 * Get current user's pairing information for the Perjalanan Saya page
 *
 * Query params:
 * - batch_id: Batch ID (optional, will use latest if not provided)
 */
export async function GET(request: Request) {
  const supabase = createClient()

  // 1. Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse query params
  const { searchParams } = new URL(request.url)
  const batchIdParam = searchParams.get('batch_id')

  try {
    // 3. Get user's batch_id from registration if not provided
    let batchId = batchIdParam
    if (!batchId) {
      const { data: registration } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('batch_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!registration) {
        return NextResponse.json(
          { error: 'No registration found' },
          { status: 404 }
        )
      }
      batchId = registration.batch_id
    }

    // 4. Find user's pairing
    const { data: pairing, error: pairingError } = await supabase
      .from('study_partners')
      .select('*')
      .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id},user_3_id.eq.${user.id}`)
      .eq('batch_id', batchId)
      .eq('pairing_status', 'active')
      .maybeSingle()

    if (pairingError) throw pairingError

    if (!pairing) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No pairing found'
      })
    }

    // 5. Get all user IDs in the pairing
    const userIds = [pairing.user_1_id, pairing.user_2_id, pairing.user_3_id].filter(Boolean) as string[]

    // 6. Get all users' details
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email, zona_waktu, whatsapp, tanggal_lahir')
      .in('id', userIds)

    const usersMap = new Map((usersData || []).map(u => [u.id, u]))

    // 7. Get registration data for all users
    const { data: registrations } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('user_id, chosen_juz, main_time_slot, backup_time_slot, timezone')
      .eq('batch_id', batchId)
      .in('user_id', userIds)

    const regMap = new Map((registrations || []).map(r => [r.user_id, r]))

    // 8. Build user data objects
    const buildUserData = (userId: string) => {
      const userData = usersMap.get(userId)
      const userReg = regMap.get(userId)
      return {
        id: userData?.id,
        full_name: userData?.full_name,
        email: userData?.email,
        zona_waktu: userReg?.timezone || userData?.zona_waktu || 'WIB',
        whatsapp: userData?.whatsapp,
        tanggal_lahir: userData?.tanggal_lahir,
        chosen_juz: userReg?.chosen_juz || 'N/A',
        main_time_slot: userReg?.main_time_slot || 'N/A',
        backup_time_slot: userReg?.backup_time_slot || 'N/A',
      }
    }

    // 9. Determine current user's role in the pairing
    const userRole = pairing.user_1_id === user.id ? 'user_1' :
                     pairing.user_2_id === user.id ? 'user_2' :
                     pairing.user_3_id === user.id ? 'user_3' : null

    return NextResponse.json({
      success: true,
      data: {
        pairing: {
          id: pairing.id,
          pairing_type: pairing.pairing_type,
          paired_at: pairing.paired_at,
          is_group_of_3: !!pairing.user_3_id,
          user_role: userRole,
        },
        user_1: buildUserData(pairing.user_1_id),
        user_2: buildUserData(pairing.user_2_id),
        user_3: pairing.user_3_id ? buildUserData(pairing.user_3_id) : null,
      }
    })
  } catch (error: any) {
    console.error('Error fetching user pairing:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pairing details' },
      { status: 500 }
    )
  }
}
