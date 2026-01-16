import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/pairing/approve-tarteel
 *
 * Approve a tarteel pairing request
 * Creates a study_partners record with pairing_type = 'tarteel'
 */
export async function POST(request: Request) {
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

  try {
    const body = await request.json()
    const { submission_id, user_id, partner_name, partner_relationship, partner_notes, partner_wa_phone } = body

    if (!submission_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the submission details
    const { data: submission, error: submissionError } = await supabase
      .from('daftar_ulang_submissions')
      .select('*')
      .eq('id', submission_id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Update submission status to approved
    const { error: updateError } = await supabase
      .from('daftar_ulang_submissions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        pairing_status: 'paired',
      })
      .eq('id', submission_id)

    if (updateError) {
      console.error('Error updating submission:', updateError)
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
    }

    // Create study_partners record with tarteel pairing type
    // For tarteel, we don't have a user_2_id since the partner might not be in the system
    // We'll use a placeholder or null for user_2_id
    const { error: partnerError } = await supabase
      .from('study_partners')
      .insert({
        user_1_id: user_id,
        user_2_id: null, // Tarteel partner might not be a registered user
        batch_id: submission.batch_id,
        pairing_type: 'tarteel',
        pairing_status: 'active',
        paired_by: user.id,
        notes: `Tarteel pairing: ${partner_name}${partner_relationship ? ` (${partner_relationship})` : ''}${partner_notes ? ` - ${partner_notes}` : ''}`,
      })

    if (partnerError) {
      console.error('Error creating study partner:', partnerError)
      // Don't fail the request if study partner creation fails
      // The submission is already approved
    }

    return NextResponse.json({
      success: true,
      message: 'Tarteel pairing approved successfully',
    })
  } catch (error: any) {
    console.error('Error approving tarteel pairing:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to approve tarteel pairing' },
      { status: 500 }
    )
  }
}
