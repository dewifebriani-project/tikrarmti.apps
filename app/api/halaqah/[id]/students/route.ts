import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/halaqah/[id]/students
 * Fetch students in a halaqah with their user info
 * Uses service role to bypass RLS and get user data for halaqah students
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const supabaseAdmin = createSupabaseAdmin()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const halaqahId = params.id

    // Fetch the halaqah to verify the user has permission (muallimah or admin)
    const { data: halaqah, error: halaqahError } = await supabase
      .from('halaqah')
      .select('id, muallimah_id')
      .eq('id', halaqahId)
      .single()

    if (halaqahError || !halaqah) {
      return NextResponse.json(
        { error: 'Halaqah not found' },
        { status: 404 }
      )
    }

    // Check if user is the muallimah or admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, roles')
      .eq('id', user.id)
      .single()

    const isAdmin = currentUser?.role === 'admin' || currentUser?.roles?.includes?.('admin')
    const isMuallimah = halaqah.muallimah_id === user.id

    if (!isAdmin && !isMuallimah) {
      return NextResponse.json(
        { error: 'Forbidden - You must be the muallimah or admin' },
        { status: 403 }
      )
    }

    // Fetch students using admin client (bypasses RLS)
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('halaqah_students')
      .select('*')
      .eq('halaqah_id', halaqahId)
      .order('created_at', { ascending: true })

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json(
        { error: 'Failed to fetch students', details: studentsError.message },
        { status: 500 }
      )
    }

    // Get user IDs from students
    const userIds = students?.map(s => s.thalibah_id).filter(Boolean) || []

    // Fetch user data using admin client
    const { data: usersData } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)

    // Create a map for quick lookup
    const userMap = new Map(
      (usersData || []).map(u => [u.id, u])
    )

    // Combine student data with user data
    const studentsWithUsers = (students || []).map(student => ({
      ...student,
      thalibah: userMap.get(student.thalibah_id) || null
    }))

    // Fetch halaqah capacity info
    const { data: halaqahWithCapacity } = await supabaseAdmin
      .from('halaqah')
      .select('max_students')
      .eq('id', halaqahId)
      .single()

    const activeCount = students?.filter(s => s.status === 'active').length || 0
    const waitlistCount = students?.filter(s => s.status === 'waitlist').length || 0
    const maxStudents = halaqahWithCapacity?.max_students || 20

    return NextResponse.json({
      students: studentsWithUsers,
      capacity: {
        active_students: activeCount,
        waitlist_students: waitlistCount,
        max_students: maxStudents,
        spots_available: Math.max(0, maxStudents - activeCount),
        is_full: activeCount >= maxStudents,
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
