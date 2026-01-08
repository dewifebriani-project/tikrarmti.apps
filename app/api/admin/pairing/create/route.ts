import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/admin/pairing/create
 *
 * Create a pairing for system_match requests
 *
 * Body:
 * - user_1_id: First user ID
 * - user_2_id: Second user ID
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
  const { user_1_id, user_2_id, batch_id } = body

  if (!user_1_id || !user_2_id || !batch_id) {
    return NextResponse.json(
      { error: 'user_1_id, user_2_id, and batch_id are required' },
      { status: 400 }
    )
  }

  if (user_1_id === user_2_id) {
    return NextResponse.json(
      { error: 'Cannot pair user with themselves' },
      { status: 400 }
    )
  }

  try {
    // 3. Check if pairing already exists
    const { data: existingPairing } = await supabase
      .from('study_partners')
      .select('id')
      .or(`user_1_id.eq.${user_1_id},user_2_id.eq.${user_1_id},user_1_id.eq.${user_2_id},user_2_id.eq.${user_2_id}`)
      .maybeSingle()

    if (existingPairing) {
      return NextResponse.json(
        { error: 'Pairing already exists for these users' },
        { status: 400 }
      )
    }

    // 4. Create the pairing (ensure user_1_id < user_2_id for unique constraint)
    const [smallerUserId, largerUserId] = user_1_id < user_2_id
      ? [user_1_id, user_2_id]
      : [user_2_id, user_1_id]

    const { error: pairingError } = await supabase
      .from('study_partners')
      .insert({
        batch_id,
        user_1_id: smallerUserId,
        user_2_id: largerUserId,
        pairing_type: 'system_match',
        pairing_status: 'active',
        paired_by: user.id, // Admin who created the pairing
        paired_at: new Date().toISOString(),
      })

    if (pairingError) throw pairingError

    // 5. Update both submissions with pairing status
    await supabase
      .from('daftar_ulang_submissions')
      .update({ pairing_status: 'paired' })
      .eq('user_id', user_1_id)

    await supabase
      .from('daftar_ulang_submissions')
      .update({ pairing_status: 'paired' })
      .eq('user_id', user_2_id)

    // 6. Revalidate paths
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      message: 'Pairing created successfully',
    })
  } catch (error: any) {
    console.error('Error creating pairing:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create pairing' },
      { status: 500 }
    )
  }
}
