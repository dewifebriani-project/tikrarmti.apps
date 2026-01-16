import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/pairing/statistics
 *
 * Get pairing statistics for admin dashboard
 * Returns submitted and approved counts for each partner type
 */
export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batch_id')

    if (!batchId) {
      return NextResponse.json({ error: 'batch_id is required' }, { status: 400 })
    }

    // Get count of submitted submissions for each partner type
    const { data: submittedStats, error: submittedError } = await supabase
      .from('daftar_ulang_submissions')
      .select('partner_type')
      .eq('batch_id', batchId)
      .eq('status', 'submitted')

    if (submittedError) throw submittedError

    // Get count of approved submissions for each partner type
    const { data: approvedStats, error: approvedError } = await supabase
      .from('daftar_ulang_submissions')
      .select('partner_type')
      .eq('batch_id', batchId)
      .eq('status', 'approved')

    if (approvedError) throw approvedError

    // Calculate statistics
    const partnerTypes = ['self_match', 'system_match', 'tarteel', 'family']
    const statistics = {
      selfMatch: { submitted: 0, approved: 0 },
      systemMatch: { submitted: 0, approved: 0 },
      tarteel: { submitted: 0, approved: 0 },
      family: { submitted: 0, approved: 0 },
    }

    // Count submitted
    for (const submission of submittedStats || []) {
      if (submission.partner_type === 'self_match') {
        statistics.selfMatch.submitted++
      } else if (submission.partner_type === 'system_match') {
        statistics.systemMatch.submitted++
      } else if (submission.partner_type === 'tarteel') {
        statistics.tarteel.submitted++
      } else if (submission.partner_type === 'family') {
        statistics.family.submitted++
      }
    }

    // Count approved
    for (const submission of approvedStats || []) {
      if (submission.partner_type === 'self_match') {
        statistics.selfMatch.approved++
      } else if (submission.partner_type === 'system_match') {
        statistics.systemMatch.approved++
      } else if (submission.partner_type === 'tarteel') {
        statistics.tarteel.approved++
      } else if (submission.partner_type === 'family') {
        statistics.family.approved++
      }
    }

    return NextResponse.json({
      success: true,
      data: statistics,
    })
  } catch (error: any) {
    console.error('Error fetching pairing statistics:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pairing statistics' },
      { status: 500 }
    )
  }
}
