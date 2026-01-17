import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * DELETE /api/admin/pairing/delete
 *
 * Delete a pairing to allow re-pairing
 *
 * Query params:
 * - user_id: User ID to delete pairing for
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
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
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

    // 4. Get both users' details
    const { data: user1Data } = await supabase
      .from('users')
      .select('id, full_name, email, zona_waktu, whatsapp')
      .eq('id', pairing.user_1_id)
      .single()

    const { data: user2Data } = await supabase
      .from('users')
      .select('id, full_name, email, zona_waktu, whatsapp')
      .eq('id', pairing.user_2_id)
      .single()

    // 5. Get registration data for both users
    const { data: user1Reg } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('chosen_juz, main_time_slot, backup_time_slot, timezone')
      .eq('user_id', pairing.user_1_id)
      .eq('batch_id', batchId)
      .maybeSingle()

    const { data: user2Reg } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('chosen_juz, main_time_slot, backup_time_slot, timezone')
      .eq('user_id', pairing.user_2_id)
      .eq('batch_id', batchId)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      data: {
        pairing: {
          id: pairing.id,
          pairing_type: pairing.pairing_type,
          paired_at: pairing.paired_at,
          paired_by: pairing.paired_by,
        },
        user_1: {
          id: user1Data?.id,
          full_name: user1Data?.full_name,
          email: user1Data?.email,
          zona_waktu: user1Reg?.timezone || user1Data?.zona_waktu || 'WIB',
          whatsapp: user1Data?.whatsapp,
          chosen_juz: user1Reg?.chosen_juz || 'N/A',
          main_time_slot: user1Reg?.main_time_slot || 'N/A',
          backup_time_slot: user1Reg?.backup_time_slot || 'N/A',
        },
        user_2: {
          id: user2Data?.id,
          full_name: user2Data?.full_name,
          email: user2Data?.email,
          zona_waktu: user2Reg?.timezone || user2Data?.zona_waktu || 'WIB',
          whatsapp: user2Data?.whatsapp,
          chosen_juz: user2Reg?.chosen_juz || 'N/A',
          main_time_slot: user2Reg?.main_time_slot || 'N/A',
          backup_time_slot: user2Reg?.backup_time_slot || 'N/A',
        },
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
