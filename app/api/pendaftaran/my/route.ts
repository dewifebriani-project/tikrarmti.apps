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
    const { data: registrations, error } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        *,
        program:programs(*),
        batch:batches(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // If table or column doesn't exist, return empty array gracefully
    if (error) {
      console.error('Error fetching registrations:', error)
      // Return empty array instead of error - allows app to function
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    return NextResponse.json({
      success: true,
      data: registrations || [],
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