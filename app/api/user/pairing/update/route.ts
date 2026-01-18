import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * PATCH /api/user/pairing/update
 *
 * Update partner data for family or tarteel pairing
 *
 * Body:
 * - submission_id: Submission ID
 * - partner_name: Partner name
 * - partner_relationship: Partner relationship (for family)
 * - partner_notes: Partner notes
 * - partner_wa_phone: Partner WhatsApp phone
 */
export async function PATCH(request: Request) {
  const supabase = createClient()

  // 1. Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse request body
  const body = await request.json()
  const { submission_id, partner_name, partner_relationship, partner_notes, partner_wa_phone } = body

  if (!submission_id) {
    return NextResponse.json(
      { error: 'submission_id is required' },
      { status: 400 }
    )
  }

  try {
    // 3. Verify submission belongs to current user
    const { data: submission, error: submissionError } = await supabase
      .from('daftar_ulang_submissions')
      .select('id, user_id, partner_type, status')
      .eq('id', submission_id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 4. Verify partner_type is family or tarteel
    if (submission.partner_type !== 'family' && submission.partner_type !== 'tarteel') {
      return NextResponse.json(
        { error: 'Only family and tarteel pairings can be edited' },
        { status: 400 }
      )
    }

    // 5. Update submission
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (partner_name !== undefined) updateData.partner_name = partner_name
    if (partner_relationship !== undefined) updateData.partner_relationship = partner_relationship
    if (partner_notes !== undefined) updateData.partner_notes = partner_notes
    if (partner_wa_phone !== undefined) updateData.partner_wa_phone = partner_wa_phone

    const { data: updatedSubmission, error: updateError } = await supabase
      .from('daftar_ulang_submissions')
      .update(updateData)
      .eq('id', submission_id)
      .select()
      .single()

    if (updateError) throw updateError

    // 6. Revalidate paths
    revalidatePath('/perjalanan-saya')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      message: 'Data pasangan berhasil diperbarui',
      data: updatedSubmission
    })
  } catch (error: any) {
    console.error('Error updating partner data:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update partner data' },
      { status: 500 }
    )
  }
}
