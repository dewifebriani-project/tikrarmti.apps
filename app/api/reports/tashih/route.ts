import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/reports/tashih
 * Get all tashih records for musyrifah/admin panel
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
    const dateFrom = searchParams.get('date_from')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '1000')

    // Build query - use service role to bypass RLS for admin/musyrifah
    // Since we've verified the user's role above, we can fetch all records
    let query = supabase
      .from('tashih_records')
      .select('*')
      .order('waktu_tashih', { ascending: false })
      .limit(limit)

    // Apply date filter (week range)
    if (dateFrom) {
      const startDate = new Date(dateFrom)
      const endDate = new Date(dateFrom)
      endDate.setDate(endDate.getDate() + 7) // One week range

      query = query
        .gte('waktu_tashih', startDate.toISOString())
        .lte('waktu_tashih', endDate.toISOString())
    }

    // Apply user filter
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: records, error } = await query

    if (error) {
      console.error('[Reports Tashih] Query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tashih records' },
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

    // Attach user data to records and normalize blok field
    const recordsWithUserData = (records || []).map(record => {
      // Handle blok field - can be string or array
      let blokList: string[] = []
      if (record.blok) {
        if (typeof record.blok === 'string') {
          blokList = record.blok.split(',').map(b => b.trim()).filter(b => b)
        } else if (Array.isArray(record.blok)) {
          blokList = record.blok
        }
      }

      return {
        ...record,
        user_data: usersData[record.user_id] || null,
        blok_list: blokList
      }
    })

    return NextResponse.json({
      success: true,
      data: recordsWithUserData,
      summary: {
        total_records: recordsWithUserData.length,
        unique_users: userIds.length
      }
    })

  } catch (error) {
    console.error('[Reports Tashih] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reports/tashih?id=xxx
 * Delete a tashih record (admin only)
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

    // Check if user has admin role (only admin can delete)
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
        { success: false, error: 'Forbidden - Admin role required to delete records' },
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
      .from('tashih_records')
      .delete()
      .eq('id', recordId)

    if (error) {
      console.error('[Reports Tashih] Delete error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tashih record deleted successfully'
    })

  } catch (error) {
    console.error('[Reports Tashih] Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
