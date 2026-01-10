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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 1. Check registrations by user_id
    const { data: byUserId } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, user_id, full_name, status, selection_status, batch_id')
      .eq('user_id', user.id)

    // 2. Check if wa_phone contains user's email
    const { data: byEmail } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, user_id, full_name, wa_phone, status, selection_status, batch_id')
      .ilike('wa_phone', `%${user.email}%`)

    // 3. Get batch info for registrations
    const registrationIds = [...(byUserId || []), ...(byEmail || [])].map(r => r.id)
    const { data: withBatch } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, user_id, batch_id, batch:batches(*)')
      .in('id', registrationIds.length > 0 ? registrationIds : ['00000000-0000-0000-0000-000000000000'])

    // 4. Call the actual API to see what it returns
    const apiResponse = await fetch(new URL('/api/pendaftaran/my', request.url), {
      headers: { cookie: request.headers.get('cookie') || '' }
    })
    const apiData = await apiResponse.json()

    return NextResponse.json({
      userInfo: {
        id: user.id,
        email: user.email
      },
      debug: {
        registrationsByUserId: {
          count: byUserId?.length || 0,
          data: byUserId
        },
        registrationsByEmail: {
          count: byEmail?.length || 0,
          data: byEmail
        },
        registrationsWithBatch: {
          count: withBatch?.length || 0,
          data: withBatch?.map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            batch_id: r.batch_id,
            batch_status: r.batch?.[0]?.status,
            has_batch: !!r.batch?.[0]
          }))
        }
      },
      apiResponse: {
        status: apiResponse.status,
        hasData: 'data' in apiData,
        dataLength: apiData.data?.length || 0,
        firstItem: apiData.data?.[0] || null
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
