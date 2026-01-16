import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/pairing/statistics
 *
 * Get pairing statistics for admin dashboard
 * Returns submitted and approved counts for each partner type
 * Counts UNIQUE users (thalibah) not submissions
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

    // Get ALL daftar ulang submissions for this batch (to calculate total unique users)
    const { data: allSubmissions, error: allError } = await supabase
      .from('daftar_ulang_submissions')
      .select('user_id, partner_type, status')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false }) // Order by created_at DESC to get latest submission first

    if (allError) throw allError

    // Calculate statistics counting UNIQUE users per partner type and status
    const statistics = {
      selfMatch: { submitted: 0, approved: 0 },
      systemMatch: { submitted: 0, approved: 0 },
      tarteel: { submitted: 0, approved: 0 },
      family: { submitted: 0, approved: 0 },
    }

    // Track unique users - key: user_id, value: { partner_type, status }
    const userSubmissions = new Map<string, { partner_type: string, status: string }>()

    // Process submissions in order (latest first)
    for (const submission of allSubmissions || []) {
      const userId = submission.user_id

      // Only keep the latest submission for each user
      if (!userSubmissions.has(userId)) {
        userSubmissions.set(userId, {
          partner_type: submission.partner_type,
          status: submission.status,
        })
      }
    }

    // Count unique users per partner type and status
    userSubmissions.forEach((submission, userId) => {
      const partnerType = submission.partner_type
      const status = submission.status

      if (partnerType === 'self_match') {
        if (status === 'submitted') statistics.selfMatch.submitted++
        if (status === 'approved') statistics.selfMatch.approved++
      } else if (partnerType === 'system_match') {
        if (status === 'submitted') statistics.systemMatch.submitted++
        if (status === 'approved') statistics.systemMatch.approved++
      } else if (partnerType === 'tarteel') {
        if (status === 'submitted') statistics.tarteel.submitted++
        if (status === 'approved') statistics.tarteel.approved++
      } else if (partnerType === 'family') {
        if (status === 'submitted') statistics.family.submitted++
        if (status === 'approved') statistics.family.approved++
      }
    })

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
