import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/reports/thalibah
 * Get all thalibah for musyrifah/admin panel
 * Only accessible by users with 'musyrifah' or 'admin' role
 * Returns thalibah data from daftar_ulang_submissions (approved only)
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has musyrifah or admin role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role, roles')
      .eq('id', user.id)
      .single()

    if (roleError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User data not found' },
        { status: 404 }
      )
    }

    const isAdmin = userData.role === 'admin' || userData.roles?.includes('admin')
    const isMusyrifah = userData.role === 'musyrifah' || userData.roles?.includes('musyrifah')

    if (!isAdmin && !isMusyrifah) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Musyrifah or Admin role required' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batch_id')

    // First get the active batch if not specified
    let targetBatchId = batchId
    if (!targetBatchId) {
      const { data: activeBatch } = await supabase
        .from('batches')
        .select('id, name, start_date, status')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      targetBatchId = activeBatch?.id || null
    }

    if (!targetBatchId) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No active batch found'
      })
    }

    // Get batch info
    const { data: batchInfo } = await supabase
      .from('batches')
      .select('id, name, start_date, status')
      .eq('id', targetBatchId)
      .single()

    // Fetch all approved thalibah from daftar_ulang_submissions
    const { data: submissions, error: subError } = await supabase
      .from('daftar_ulang_submissions')
      .select(`
        id,
        user_id,
        registration_id,
        batch_id,
        confirmed_full_name,
        confirmed_chosen_juz,
        confirmed_wa_phone,
        status,
        submitted_at
      `)
      .eq('batch_id', targetBatchId)
      .eq('status', 'approved')
      .order('confirmed_full_name', { ascending: true })

    if (subError) {
      console.error('[Reports Thalibah] Query error:', subError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch thalibah data' },
        { status: 500 }
      )
    }

    // Get additional user data (email, whatsapp fallback from users table)
    const userIds = Array.from(new Set(submissions?.map((s: any) => s.user_id) || []))

    let usersData: Record<string, any> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email, whatsapp, phone')
        .in('id', userIds)

      if (users) {
        usersData = Object.fromEntries(users.map((u: any) => [u.id, u]))
      }
    }

    // Combine submission data with user data
    const thalibahData = (submissions || []).map((sub: any) => {
      const userInfo = usersData[sub.user_id] || {}
      return {
        id: sub.id,
        user_id: sub.user_id,
        registration_id: sub.registration_id,
        batch_id: sub.batch_id,
        full_name: sub.confirmed_full_name,
        chosen_juz: sub.confirmed_chosen_juz,
        wa_phone: sub.confirmed_wa_phone,
        whatsapp: sub.confirmed_wa_phone || userInfo.whatsapp || userInfo.phone || null,
        email: userInfo.email || null,
        status: sub.status,
        submitted_at: sub.submitted_at,
        user_data: {
          id: sub.user_id,
          full_name: sub.confirmed_full_name || userInfo.full_name,
          email: userInfo.email,
          whatsapp: sub.confirmed_wa_phone || userInfo.whatsapp || userInfo.phone || null
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: thalibahData,
      batch: batchInfo || null,
      summary: {
        total_thalibah: thalibahData.length
      }
    })

  } catch (error) {
    console.error('[Reports Thalibah] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
