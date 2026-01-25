import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/reports/jurnal
 * Get all jurnal records for musyrifah/admin panel
 * Only accessible by users with 'musyrifah' or 'admin' role
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
    const date = searchParams.get('date')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '1000')

    // Build query
    let query = supabase
      .from('jurnal_records')
      .select('*')
      .order('tanggal_setor', { ascending: false })
      .limit(limit)

    // Apply date filters
    if (date) {
      // Exact date match
      query = query.eq('tanggal_setor', date)
    } else if (dateFrom) {
      // Date range
      const startDate = new Date(dateFrom)
      const endDate = dateTo ? new Date(dateTo) : new Date(dateFrom)
      endDate.setDate(endDate.getDate() + 1) // Include the end date

      query = query
        .gte('tanggal_setor', startDate.toISOString().split('T')[0])
        .lt('tanggal_setor', endDate.toISOString().split('T')[0])
    }

    // Apply user filter
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: records, error } = await query

    if (error) {
      console.error('[Reports Jurnal] Query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch jurnal records' },
        { status: 500 }
      )
    }

    // Get unique user IDs and fetch their data
    const userIds = Array.from(new Set(records?.map(r => r.user_id) || []))

    let usersData: Record<string, any> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds)

      if (users) {
        usersData = Object.fromEntries(users.map(u => [u.id, u]))
      }
    }

    // Attach user data to records
    const recordsWithUserData = (records || []).map(record => ({
      ...record,
      user_data: usersData[record.user_id] || null
    }))

    return NextResponse.json({
      success: true,
      data: recordsWithUserData,
      summary: {
        total_records: recordsWithUserData.length,
        unique_users: userIds.length
      }
    })

  } catch (error) {
    console.error('[Reports Jurnal] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reports/jurnal?id=xxx
 * Delete a jurnal record (admin only)
 */
export async function DELETE(request: Request) {
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

    // Check if user has admin or musyrifah role
    const { data: userData } = await supabase
      .from('users')
      .select('role, roles')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const isAdmin = userData.role === 'admin' || userData.roles?.includes('admin')
    const isMusyrifah = userData.role === 'musyrifah' || userData.roles?.includes('musyrifah')

    if (!isAdmin && !isMusyrifah) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin or Musyrifah role required to delete records' },
        { status: 403 }
      )
    }

    // Get record ID from query params
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('id')

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: 'Record ID is required' },
        { status: 400 }
      )
    }

    // Delete the record
    const { error } = await supabase
      .from('jurnal_records')
      .delete()
      .eq('id', recordId)

    if (error) {
      console.error('[Reports Jurnal] Delete error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Jurnal record deleted successfully'
    })

  } catch (error) {
    console.error('[Reports Jurnal] Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reports/jurnal
 * Update a jurnal record (admin only)
 * For correcting data when needed
 */
export async function PATCH(request: Request) {
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

    // Check if user has admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role, roles')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const isAdmin = userData.role === 'admin' || userData.roles?.includes('admin')

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin role required to update records' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Record ID is required' },
        { status: 400 }
      )
    }

    // Update the record
    const { data, error } = await supabase
      .from('jurnal_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Reports Jurnal] Update error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Jurnal record updated successfully'
    })

  } catch (error) {
    console.error('[Reports Jurnal] Update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
