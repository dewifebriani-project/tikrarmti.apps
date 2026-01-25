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
    console.log('[APPROVE] Starting approve process:', { submission_id, user_1_id, user_2_id })

    // 3. Verify the submission exists and is for self_match
    const { data: submission, error: submissionError } = await supabase
      .from('daftar_ulang_submissions')
      .select('*, batch_id')
      .eq('id', submission_id)
      .eq('partner_type', 'self_match')
      .single()

    console.log('[APPROVE] Submission lookup result:', { data: submission, error: submissionError })

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

    console.log('[APPROVE] Existing pairing check:', existingPairing)

    if (existingPairing) {
      // If pairing already exists, just update the submissions to approved
      console.log('[APPROVE] Pairing already exists, updating submissions to approved:', existingPairing)

      const { data: updateResult1, error: updateError1 } = await supabase
        .from('daftar_ulang_submissions')
        .update({
          status: 'approved',
          pairing_status: 'paired'
        })
        .eq('user_id', user_1_id)
        .eq('batch_id', submission.batch_id) // Only update in current batch
        .select()

      console.log('[APPROVE] User 1 update result:', { data: updateResult1, error: updateError1 })

      const { data: updateResult2, error: updateError2 } = await supabase
        .from('daftar_ulang_submissions')
        .update({
          status: 'approved',
          pairing_status: 'paired'
        })
        .eq('user_id', user_2_id)
        .eq('batch_id', submission.batch_id) // Only update in current batch
        .select()

      console.log('[APPROVE] User 2 update result:', { data: updateResult2, error: updateError2 })

      if (updateError1) throw updateError1
      if (updateError2) throw updateError2

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

    console.log('[APPROVE] Creating new pairing:', { batch_id: submission.batch_id, user_1_id: smallerUserId, user_2_id: largerUserId })

    const { data: pairingData, error: pairingError } = await supabase
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
      .select()

    console.log('[APPROVE] Pairing creation result:', { data: pairingData, error: pairingError })

    if (pairingError) throw pairingError

    // 6. Update both submissions to approved status
    const { data: updateResult3, error: updateError3 } = await supabase
      .from('daftar_ulang_submissions')
      .update({
        status: 'approved',
        pairing_status: 'paired'
      })
      .eq('user_id', user_1_id)
      .eq('batch_id', submission.batch_id) // Only update in current batch
      .select()

    console.log('[APPROVE] User 1 update result (new pairing):', { data: updateResult3, error: updateError3 })

    const { data: updateResult4, error: updateError4 } = await supabase
      .from('daftar_ulang_submissions')
      .update({
        status: 'approved',
        pairing_status: 'paired'
      })
      .eq('user_id', user_2_id)
      .eq('batch_id', submission.batch_id) // Only update in current batch
      .select()

    console.log('[APPROVE] User 2 update result (new pairing):', { data: updateResult4, error: updateError4 })

    if (updateError3) throw updateError3
    if (updateError4) throw updateError4

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
