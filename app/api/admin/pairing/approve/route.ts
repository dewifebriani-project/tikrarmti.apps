import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/admin/pairing/approve
 *
 * Approve a self_match request and create the pairing
 *
 * Body:
 * - submission_id: ID of the daftar_ulang_submission
 * - user_1_id: First user ID (requester)
 * - user_2_id: Second user ID (requested partner)
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
  const { submission_id, user_1_id, user_2_id } = body

  if (!submission_id || !user_1_id || !user_2_id) {
    return NextResponse.json(
      { error: 'submission_id, user_1_id, and user_2_id are required' },
      { status: 400 }
    )
  }

  try {
    // 3. Verify the submission exists and is for self_match
    const { data: submission, error: submissionError } = await supabase
      .from('daftar_ulang_submissions')
      .select('*, batch_id')
      .eq('id', submission_id)
      .eq('partner_type', 'self_match')
      .single()

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found or not a self_match request' },
        { status: 404 }
      )
    }

    // 4. Check if pairing already exists
    const { data: existingPairing } = await supabase
      .from('study_partners')
      .select('*')
      .or(`and(user_1_id.eq.${user_1_id},user_2_id.eq.${user_2_id}),and(user_1_id.eq.${user_2_id},user_2_id.eq.${user_1_id})`)
      .maybeSingle()

    if (existingPairing) {
      // If pairing already exists, just update the submissions to approved
      console.log('[APPROVE] Pairing already exists, updating submissions to approved:', existingPairing)

      await supabase
        .from('daftar_ulang_submissions')
        .update({
          status: 'approved',
          pairing_status: 'paired'
        })
        .eq('user_id', user_1_id)

      await supabase
        .from('daftar_ulang_submissions')
        .update({
          status: 'approved',
          pairing_status: 'paired'
        })
        .eq('user_id', user_2_id)

      // Revalidate paths
      revalidatePath('/admin')
      revalidatePath('/dashboard')

      return NextResponse.json({
        success: true,
        message: 'Pairing already exists, submissions updated to approved',
        already_paired: true,
      })
    }

    // 5. Create the pairing (ensure user_1_id < user_2_id for unique constraint)
    const [smallerUserId, largerUserId] = user_1_id < user_2_id
      ? [user_1_id, user_2_id]
      : [user_2_id, user_1_id]

    const { error: pairingError } = await supabase
      .from('study_partners')
      .insert({
        batch_id: submission.batch_id,
        user_1_id: smallerUserId,
        user_2_id: largerUserId,
        pairing_type: 'self_match',
        pairing_status: 'active',
        paired_by: user.id, // Admin who approved
        paired_at: new Date().toISOString(),
      })

    if (pairingError) throw pairingError

    // 6. Update both submissions to approved status
    await supabase
      .from('daftar_ulang_submissions')
      .update({
        status: 'approved',
        pairing_status: 'paired'
      })
      .eq('user_id', user_1_id)

    await supabase
      .from('daftar_ulang_submissions')
      .update({
        status: 'approved',
        pairing_status: 'paired'
      })
      .eq('user_id', user_2_id)

    // 7. Revalidate paths
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      message: 'Pairing approved successfully',
    })
  } catch (error: any) {
    console.error('Error approving pairing:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to approve pairing' },
      { status: 500 }
    )
  }
}
