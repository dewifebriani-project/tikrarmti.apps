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

    // Get user's tikrar registrations with program and batch details
    // This API is specifically for perjalanan-saya page which should ONLY show tikrar registrations
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
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Map registrations to add role type for consistency
    const registrations = (tikrarRegistrations || []).map(reg => ({
      ...reg,
      registration_type: 'calon_thalibah',
      role: 'calon_thalibah'
    }))

    return NextResponse.json({
      success: true,
      data: registrations,
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
