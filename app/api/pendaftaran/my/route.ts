import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const allRegistrations: any[] = []

    // Get user's tikrar registrations with program and batch details
    const { data: tikrarRegistrations, error: tikrarError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        *,
        program:programs(*),
        batch:batches(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (tikrarError) {
      console.error('Error fetching tikrar registrations:', tikrarError)
    } else if (tikrarRegistrations) {
      // Add role type to each registration
      tikrarRegistrations.forEach(reg => {
        allRegistrations.push({
          ...reg,
          registration_type: 'calon_thalibah',
          role: 'calon_thalibah'
        })
      })
    }

    // Get user's muallimah registrations
    const { data: muallimahRegistrations, error: muallimahError } = await supabase
      .from('muallimah_registrations')
      .select(`
        *,
        batch:batches(*)
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })

    if (muallimahError) {
      console.error('Error fetching muallimah registrations:', muallimahError)
    } else if (muallimahRegistrations) {
      // Add role type to each registration
      muallimahRegistrations.forEach(reg => {
        allRegistrations.push({
          ...reg,
          registration_type: 'muallimah',
          role: 'muallimah',
          // Map submitted_at to created_at for consistency
          created_at: reg.submitted_at
        })
      })
    }

    // Get user's musyrifah registrations
    const { data: musyrifahRegistrations, error: musyrifahError } = await supabase
      .from('musyrifah_registrations')
      .select(`
        *,
        batch:batches(*)
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })

    if (musyrifahError) {
      console.error('Error fetching musyrifah registrations:', musyrifahError)
    } else if (musyrifahRegistrations) {
      // Add role type to each registration
      musyrifahRegistrations.forEach(reg => {
        allRegistrations.push({
          ...reg,
          registration_type: 'musyrifah',
          role: 'musyrifah',
          // Map submitted_at to created_at for consistency
          created_at: reg.submitted_at
        })
      })
    }

    // Sort all registrations by created_at
    allRegistrations.sort((a, b) => {
      const dateA = new Date(a.created_at || a.submitted_at || 0)
      const dateB = new Date(b.created_at || b.submitted_at || 0)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json({
      success: true,
      data: allRegistrations,
    })

  } catch (error) {
    console.error('Pendaftaran/my API error:', error)
    // Return empty array on error instead of failing
    return NextResponse.json({
      success: true,
      data: [],
    })
  }
}