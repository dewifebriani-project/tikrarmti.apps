import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/hooks/useDashboard'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total batches count
    const { count: totalBatches, error: batchesError } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })

    // Get active batches count
    const { count: activeBatches, error: activeBatchesError } = await supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    // Get total programs count
    const { count: totalPrograms, error: programsError } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true })

    // Get active programs count
    const { count: activePrograms, error: activeProgramsError } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'ongoing'])

    // Get total registrations count
    const { count: totalRegistrations, error: registrationsError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*', { count: 'exact', head: true })

    // Get pending approvals count
    const { count: pendingApprovals, error: pendingError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get completed registrations count
    const { count: completedRegistrations, error: completedError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    // Get user growth stats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: newUsers, error: newUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('created_at', thirtyDaysAgo.toISOString())

    const stats: DashboardStats = {
      totalRegistrations: totalRegistrations || 0,
      activeBatches: activeBatches || 0,
      activePrograms: activePrograms || 0,
      pendingApprovals: pendingApprovals || 0,
      completedRegistrations: completedRegistrations || 0,
      totalUsers: totalUsers || 0,
      userGrowth: {
        new: newUsers || 0,
        active: totalUsers || 0,
        total: totalUsers || 0,
      },
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics',
      },
      { status: 500 }
    )
  }
}