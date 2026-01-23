import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/reports/thalibah
 * Get all thalibah for musyrifah/admin panel
 * Only accessible by users with 'musyrifah' or 'admin' role
 * Returns thalibah data with wa_phone for WhatsApp contact
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
        .select('id')
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

    // Fetch all thalibah registrations for this batch with user data
    const { data: registrations, error: regError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        id,
        user_id,
        full_name,
        email,
        wa_phone,
        chosen_juz,
        status,
        selection_status,
        batch_id,
        batch:batches(id, name, start_date, status)
      `)
      .eq('batch_id', targetBatchId)
      .or('status.eq.approved,selection_status.eq.selected')
      .order('full_name', { ascending: true })

    if (regError) {
      console.error('[Reports Thalibah] Query error:', regError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch thalibah data' },
        { status: 500 }
      )
    }

    // Get additional user data (whatsapp from users table as fallback)
    const userIds = Array.from(new Set(registrations?.map(r => r.user_id) || []))

    let usersData: Record<string, any> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email, whatsapp, phone')
        .in('id', userIds)

      if (users) {
        usersData = Object.fromEntries(users.map(u => [u.id, u]))
      }
    }

    // Combine registration data with user data
    const thalibahData = (registrations || []).map(reg => {
      const userData = usersData[reg.user_id] || {}
      return {
        ...reg,
        // Use wa_phone from registration, fallback to user's whatsapp or phone
        whatsapp: reg.wa_phone || userData.whatsapp || userData.phone || null,
        user_data: {
          id: reg.user_id,
          full_name: reg.full_name || userData.full_name,
          email: reg.email || userData.email,
          whatsapp: reg.wa_phone || userData.whatsapp || userData.phone || null
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: thalibahData,
      batch: registrations?.[0]?.batch || null,
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
