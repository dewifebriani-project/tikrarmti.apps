import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/admin/pairing/add-to-pair
 *
 * Add a third user to an existing pair (making it a group of 3)
 *
 * Body:
 * - pairing_id: The existing study_partners record ID
 * - user_id: The user to add as user_3
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
  const { pairing_id, user_id } = body

  if (!pairing_id || !user_id) {
    return NextResponse.json(
      { error: 'pairing_id and user_id are required' },
      { status: 400 }
    )
  }

  try {
    // 3. Get the existing pairing
    const { data: existingPairing, error: pairingError } = await supabase
      .from('study_partners')
      .select('id, user_1_id, user_2_id, user_3_id, batch_id')
      .eq('id', pairing_id)
      .single()

    if (pairingError || !existingPairing) {
      return NextResponse.json(
        { error: 'Pairing not found' },
        { status: 404 }
      )
    }

    // 4. Check if user_3 slot is already filled
    if (existingPairing.user_3_id) {
      return NextResponse.json(
        { error: 'This pair already has 3 members' },
        { status: 400 }
      )
    }

    // 5. Check if user is already in this pair
    if (existingPairing.user_1_id === user_id || existingPairing.user_2_id === user_id) {
      return NextResponse.json(
        { error: 'User is already in this pair' },
        { status: 400 }
      )
    }

    // 6. Check if user is already paired elsewhere
    const { data: userExistingPair } = await supabase
      .from('study_partners')
      .select('id')
      .eq('batch_id', existingPairing.batch_id)
      .eq('pairing_status', 'active')
      .or(`user_1_id.eq.${user_id},user_2_id.eq.${user_id},user_3_id.eq.${user_id}`)
      .maybeSingle()

    if (userExistingPair) {
      return NextResponse.json(
        { error: 'User is already paired in another group' },
        { status: 400 }
      )
    }

    // 7. Update the pairing to add user_3
    const { error: updateError } = await supabase
      .from('study_partners')
      .update({ user_3_id: user_id })
      .eq('id', pairing_id)

    if (updateError) throw updateError

    // 8. Update the user's submission with pairing status
    await supabase
      .from('daftar_ulang_submissions')
      .update({ pairing_status: 'paired' })
      .eq('user_id', user_id)
      .eq('batch_id', existingPairing.batch_id)

    // 9. Revalidate paths
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      message: 'User added to pair successfully',
    })
  } catch (error: any) {
    console.error('Error adding user to pair:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to add user to pair' },
      { status: 500 }
    )
  }
}
