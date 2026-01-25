import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/admin/pairing/reject
 *
 * Reject a self_match request
 *
 * Body:
 * - submission_id: ID of the daftar_ulang_submission
 * - reason: Rejection reason (optional)
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
  const { submission_id, reason } = body

  if (!submission_id) {
    return NextResponse.json(
      { error: 'submission_id is required' },
      { status: 400 }
    )
  }

  try {
    // 3. Update submission: change partner_type to system_match
    // This moves the user to the "Dipasangkan Sistem" tab
    const { error: updateError } = await supabase
      .from('daftar_ulang_submissions')
      .update({
        partner_type: 'system_match',
        partner_user_id: null, // Clear the chosen partner
        partner_name: null,
        partner_relationship: null,
        partner_notes: null,
        pairing_status: null, // Reset pairing status
        rejection_reason: reason || null,
      })
      .eq('id', submission_id)

    if (updateError) throw updateError

    // 4. Revalidate paths
    revalidatePath('/admin')

    return NextResponse.json({
      success: true,
      message: 'Pairing request rejected and moved to system match',
    })
  } catch (error: any) {
    console.error('Error rejecting pairing:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to reject pairing' },
      { status: 500 }
    )
  }
}
