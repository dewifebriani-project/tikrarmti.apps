import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LearningJourney } from '@/hooks/useDashboard'

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

    // Fetch user's registrations with batch and program details
    const { data: registrations, error: registrationsError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        id,
        status,
        selection_status,
        created_at,
        approved_at,
        batches (
          id,
          name,
          start_date,
          end_date,
          duration_weeks
        ),
        programs (
          id,
          name,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (registrationsError) {
      console.error('Error fetching registrations:', registrationsError)
      throw registrationsError
    }

    // Build registrations array for learning journey
    const journeyRegistrations = registrations?.map((reg: any) => {
      const isApproved = reg.status === 'approved'
      const isSelected = reg.selection_status === 'selected'

      let status: 'pending' | 'approved' | 'active' | 'completed' = 'pending'
      if (isApproved && isSelected) {
        // Check if batch has ended
        const batch = reg.batches
        const endDate = batch ? new Date(batch.end_date || '') : null
        const now = new Date()
        status = endDate && endDate < now ? 'completed' : 'active'
      } else if (isApproved) {
        status = 'approved'
      }

      return {
        id: reg.id,
        batchName: reg.batches?.name || 'Unknown Batch',
        programName: reg.programs?.name || 'Tikrar Tahfidz',
        status,
        startDate: reg.batches?.start_date || reg.created_at,
        endDate: reg.batches?.end_date,
        progress: status === 'completed' ? 100 : status === 'active' ? 50 : status === 'approved' ? 25 : 0,
      }
    }) || []

    // TODO: Fetch achievements and certificates when those tables are implemented
    const achievements: Array<{
      id: string
      title: string
      description: string
      icon: string
      earnedAt: string
    }> = []

    const certificates: Array<{
      id: string
      title: string
      programName: string
      issuedAt: string
      downloadUrl: string
    }> = []

    const journey: LearningJourney = {
      registrations: journeyRegistrations,
      achievements,
      certificates,
    }

    return NextResponse.json({
      success: true,
      data: journey,
    })

  } catch (error) {
    console.error('Dashboard journey error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch learning journey',
      },
      { status: 500 }
    )
  }
}
