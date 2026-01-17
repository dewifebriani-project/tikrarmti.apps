import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * DELETE /api/admin/pairing/delete
 *
 * Delete a pairing to allow re-pairing
 *
 * Query params:
 * - user_id: User ID to delete pairing for, or 'all' to delete all pairings
 * - batch_id: Batch ID
 */
export async function DELETE(request: Request) {
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
    // Check if deleting all pairings
    if (userId === 'all') {
      // 3. Fetch all active pairings for this batch
      const { data: allPairings, error: fetchError } = await supabase
        .from('study_partners')
        .select('*')
        .eq('batch_id', batchId)
        .eq('pairing_status', 'active')

      if (fetchError) throw fetchError

      if (!allPairings || allPairings.length === 0) {
        return NextResponse.json(
          { error: 'No active pairings found for this batch' },
          { status: 404 }
        )
      }

      // 4. Delete all pairings
      const pairingIds = allPairings.map(p => p.id)
      const { error: deleteError } = await supabase
        .from('study_partners')
        .delete()
        .in('id', pairingIds)

      if (deleteError) throw deleteError

      // 5. Update all submissions to remove pairing status
      const allUserIds = new Set<string>()
      allPairings.forEach(pairing => {
        allUserIds.add(pairing.user_1_id)
        allUserIds.add(pairing.user_2_id)
      })

      await supabase
        .from('daftar_ulang_submissions')
        .update({ pairing_status: null })
        .eq('batch_id', batchId)
        .in('user_id', Array.from(allUserIds))

      // 6. Revalidate paths
      revalidatePath('/admin')
      revalidatePath('/dashboard')

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${allPairings.length} pairing(s)`,
        data: {
          deleted_count: allPairings.length,
          deleted_pairing_ids: pairingIds,
        }
      })
    }

    // Delete single pairing
    // 3. Find the pairing for this user
    const { data: pairing, error: findError } = await supabase
      .from('study_partners')
      .select('*')
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
      .eq('batch_id', batchId)
      .eq('pairing_status', 'active')
      .single()

    if (findError || !pairing) {
      return NextResponse.json(
        { error: 'No active pairing found for this user' },
        { status: 404 }
      )
    }

    // 4. Delete the pairing
    const { error: deleteError } = await supabase
      .from('study_partners')
      .delete()
      .eq('id', pairing.id)

    if (deleteError) throw deleteError

    // 5. Update both submissions to remove pairing status
    await supabase
      .from('daftar_ulang_submissions')
      .update({ pairing_status: null })
      .eq('user_id', pairing.user_1_id)
      .eq('batch_id', batchId)

    await supabase
      .from('daftar_ulang_submissions')
      .update({ pairing_status: null })
      .eq('user_id', pairing.user_2_id)
      .eq('batch_id', batchId)

    // 6. Revalidate paths
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      message: 'Pairing deleted successfully',
      data: {
        deleted_pairing_id: pairing.id,
        user_1_id: pairing.user_1_id,
        user_2_id: pairing.user_2_id,
      }
    })
  } catch (error: any) {
    console.error('Error deleting pairing:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete pairing' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/pairing/delete
 *
 * Get pairing details for a user
 *
 * Query params:
 * - user_id: User ID to get pairing details for
 * - batch_id: Batch ID
 */
export async function GET(request: Request) {
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
    // 3. Find the pairing for this user
    const { data: pairing, error: findError } = await supabase
      .from('study_partners')
      .select('*')
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId},user_3_id.eq.${userId}`)
      .eq('batch_id', batchId)
      .eq('pairing_status', 'active')
      .maybeSingle()

    if (findError) throw findError

    if (!pairing) {
      return NextResponse.json(
        { error: 'No active pairing found for this user' },
        { status: 404 }
      )
    }

    // 4. Get all users' details (including user_3 if exists)
    const userIds = [pairing.user_1_id, pairing.user_2_id, pairing.user_3_id].filter(Boolean)

    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email, zona_waktu, whatsapp')
      .in('id', userIds)

    const usersMap = new Map((usersData || []).map(u => [u.id, u]))

    // 5. Get registration data for all users
    const { data: registrations } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('user_id, chosen_juz, main_time_slot, backup_time_slot, timezone')
      .eq('batch_id', batchId)
      .in('user_id', userIds)

    const regMap = new Map((registrations || []).map(r => [r.user_id, r]))

    const buildUserData = (userId: string) => {
      const userData = usersMap.get(userId)
      const userReg = regMap.get(userId)
      return {
        id: userData?.id,
        full_name: userData?.full_name,
        email: userData?.email,
        zona_waktu: userReg?.timezone || userData?.zona_waktu || 'WIB',
        whatsapp: userData?.whatsapp,
        chosen_juz: userReg?.chosen_juz || 'N/A',
        main_time_slot: userReg?.main_time_slot || 'N/A',
        backup_time_slot: userReg?.backup_time_slot || 'N/A',
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        pairing: {
          id: pairing.id,
          pairing_type: pairing.pairing_type,
          paired_at: pairing.paired_at,
          paired_by: pairing.paired_by,
          is_group_of_3: !!pairing.user_3_id,
        },
        user_1: buildUserData(pairing.user_1_id),
        user_2: buildUserData(pairing.user_2_id),
        user_3: pairing.user_3_id ? buildUserData(pairing.user_3_id) : null,
      }
    })
  } catch (error: any) {
    console.error('Error fetching pairing details:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pairing details' },
      { status: 500 }
    )
  }
}
