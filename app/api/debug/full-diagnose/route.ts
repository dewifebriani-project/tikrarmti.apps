import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const supabaseAdmin = createSupabaseAdmin()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Check user profile
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // 2. Check registrations by user_id (direct query, no API)
    const { data: regsById } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, user_id, full_name, email, status, selection_status, batch_id')
      .eq('user_id', user.id)

    // 3. Check registrations by email
    const { data: regsByEmail } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, user_id, full_name, email, status, selection_status, batch_id')
      .ilike('email', `%${user.email}%`)

    // 4. Get batch info
    const batchIds = [...(regsById || []), ...(regsByEmail || [])].map(r => r.batch_id)
    const { data: batches } = await supabaseAdmin
      .from('batches')
      .select('*')
      .in('id', batchIds.length > 0 ? batchIds : ['00000000-0000-0000-0000-000000000000'])

    // 5. Call the actual API endpoint
    const apiUrl = new URL('/api/pendaftaran/my', request.url)
    const apiResponse = await fetch(apiUrl, {
      headers: { cookie: request.headers.get('cookie') || '' }
    })

    let apiData
    let apiError = null
    try {
      apiData = await apiResponse.json()
    } catch (e) {
      apiError = (e as Error).message
    }

    return NextResponse.json({
      auth: {
        id: user.id,
        email: user.email
      },
      userProfile: userProfile ? {
        id: userProfile.id,
        full_name: userProfile.full_name,
        email: userProfile.email
      } : null,
      registrations: {
        byUserId: {
          count: regsById?.length || 0,
          data: regsById
        },
        byEmail: {
          count: regsByEmail?.length || 0,
          data: regsByEmail
        }
      },
      batches: batches?.map(b => ({
        id: b.id,
        name: b.name,
        status: b.status,
        hasTimeline: !!(b.registration_start_date || b.re_enrollment_date || b.opening_class_date),
        dates: {
          registration_start: b.registration_start_date,
          selection_start: b.selection_start_date,
          re_enrollment: b.re_enrollment_date,
          opening_class: b.opening_class_date
        }
      })),
      apiResponse: {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        hasData: 'data' in (apiData || {}),
        dataLength: apiData?.data?.length || 0,
        firstItem: apiData?.data?.[0] || null,
        error: apiError
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
