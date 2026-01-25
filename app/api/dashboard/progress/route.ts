import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserProgress } from '@/hooks/useDashboard'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user using Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's registrations for progress calculation
    const { data: registrations, error: registrationsError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        id,
        status,
        selection_status,
        created_at,
        batches (
          id,
          name,
          start_date,
          end_date
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (registrationsError) {
      console.error('Error fetching registrations:', registrationsError)
      throw registrationsError
    }

    // Calculate progress based on registrations
    const totalDays = registrations?.length || 0
    const completedDays = registrations?.filter(r =>
      r.status === 'approved' && r.selection_status === 'selected'
    ).length || 0
    const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

    // Get last activity (latest registration)
    const lastActivity = registrations?.[0]?.created_at || new Date().toISOString()

    // Build weekly progress (simplified - can be enhanced with actual weekly data)
    const weeklyProgress = [
      { week: 'Minggu 1', target: 7, actual: completedDays, percentage: Math.min(100, percentage) },
    ]

    // Build milestones based on registration statuses
    const milestones = registrations?.map((reg: any) => ({
      id: reg.id,
      title: `Pendaftaran ${reg.batches?.name || 'Program'}`,
      description: `Status: ${reg.status}`,
      completed: reg.status === 'approved' && reg.selection_status === 'selected',
      dueDate: reg.batches?.end_date || new Date().toISOString().split('T')[0],
    })) || []

    const progress: UserProgress = {
      totalDays,
      completedDays,
      percentage,
      currentStreak: completedDays > 0 ? 1 : 0,
      longestStreak: completedDays,
      lastActivity,
      milestones,
      weeklyProgress,
    }

    return NextResponse.json({
      success: true,
      data: progress,
    })

  } catch (error) {
    console.error('Dashboard progress error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user progress',
      },
      { status: 500 }
    )
  }
}
