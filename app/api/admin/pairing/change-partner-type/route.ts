import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/admin/pairing/change-partner-type
 *
 * Change a user's partner type (system_match <-> family <-> tarteel)
 *
 * Body:
 * - submission_id: Submission ID to update
 * - user_id: User ID
 * - new_partner_type: 'system_match' | 'family' | 'tarteel'
 * - partner_name: Partner name (required for family/tarteel)
 * - partner_relationship: Partner relationship (for family)
 * - partner_notes: Partner notes
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
    const {
      submission_id,
      user_id,
      new_partner_type,
      partner_name,
      partner_relationship,
      partner_notes
    } = body

    if (!submission_id || !user_id || !new_partner_type) {
      return NextResponse.json(
        { error: 'submission_id, user_id, and new_partner_type are required' },
        { status: 400 }
      )
    }

    // Validate new_partner_type
    if (!['system_match', 'family', 'tarteel'].includes(new_partner_type)) {
      return NextResponse.json(
        { error: 'new_partner_type must be system_match, family, or tarteel' },
        { status: 400 }
      )
    }

    // Validate required fields for family/tarteel
    if (new_partner_type !== 'system_match' && !partner_name?.trim()) {
      return NextResponse.json(
        { error: 'partner_name is required for family and tarteel' },
        { status: 400 }
      )
    }

    // Get the submission
    const { data: submission, error: submissionError } = await supabase
      .from('daftar_ulang_submissions')
      .select('*')
      .eq('id', submission_id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if user is already paired
    if (submission.pairing_status === 'paired') {
      // Delete existing pairing
      const { error: deletePairingError } = await supabase
        .from('study_partners')
        .delete()
        .or(`user_1_id.eq.${user_id},user_2_id.eq.${user_id},user_3_id.eq.${user_id}`)

      if (deletePairingError) {
        console.error('Error deleting existing pairing:', deletePairingError)
        // Continue anyway to update the submission
      }
    }

    // Update submission with new partner type
    const updateData: any = {
      partner_type: new_partner_type,
      pairing_status: 'pending',
      status: 'submitted', // Reset to submitted
      updated_at: new Date().toISOString()
    }

    // Set partner fields based on new type
    if (new_partner_type === 'system_match') {
      updateData.partner_name = null
      updateData.partner_relationship = null
      updateData.partner_notes = null
      updateData.partner_user_id = null
    } else if (new_partner_type === 'family') {
      updateData.partner_name = partner_name
      updateData.partner_relationship = partner_relationship || null
      updateData.partner_notes = partner_notes || null
      updateData.partner_user_id = null
    } else if (new_partner_type === 'tarteel') {
      updateData.partner_name = partner_name
      updateData.partner_relationship = null
      updateData.partner_notes = partner_notes || null
      updateData.partner_user_id = null
    }

    const { error: updateError } = await supabase
      .from('daftar_ulang_submissions')
      .update(updateData)
      .eq('id', submission_id)

    if (updateError) {
      console.error('Error updating submission:', updateError)
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
    }

    // Revalidate paths
    revalidatePath('/admin/pairing')
    revalidatePath('/dashboard')

    const typeLabel = new_partner_type === 'system_match' ? 'System Match' :
                     new_partner_type === 'family' ? 'Family' : 'Tarteel'

    return NextResponse.json({
      success: true,
      message: `Partner type berhasil diubah ke ${typeLabel}`,
      data: {
        submission_id,
        new_partner_type,
        old_partner_type: submission.partner_type
      }
    })
  } catch (error: any) {
    console.error('Error changing partner type:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to change partner type' },
      { status: 500 }
    )
  }
}
