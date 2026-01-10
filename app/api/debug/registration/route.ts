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

    // Get registrations directly from table
    const { data: directRegistrations, error: directError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('user_id', user.id)

    // Get registrations with batch relation
    const { data: withBatch, error: batchError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        *,
        batch:batches(*)
      `)
      .eq('user_id', user.id)

    // Call the main API
    const apiResponse = await fetch(new URL('/api/pendaftaran/my', request.url), {
        headers: {
          cookie: request.headers.get('cookie') || ''
        }
      })
    const apiData = await apiResponse.json()

    return NextResponse.json({
      userInfo: {
        id: user.id,
        email: user.email
      },
      registrationsByUserId: {
        count: directRegistrations?.length || 0,
        data: directRegistrations
      },
      registrationsWithBatch: {
        count: withBatch?.length || 0,
        data: withBatch?.map((r: any) => ({
          id: r.id,
          status: r.status,
          batch_id: r.batch_id,
          batch: r.batch,
          has_batch_array: Array.isArray(r.batch),
          batch_length: r.batch?.length,
          batch_status: r.batch?.[0]?.status
        }))
      },
      apiResponse: {
        status: apiResponse.status,
        isDataWrapped: 'data' in apiData,
        dataType: Array.isArray(apiData.data),
        dataLength: apiData.data?.length || 0,
        firstItem: apiData.data?.[0] ? {
          id: apiData.data[0].id,
          status: apiData.data[0].status,
          has_batch: 'batch' in apiData.data[0],
          batch: apiData.data[0].batch
        } : null
      },
      errors: {
        direct: directError?.message,
        batch: batchError?.message
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
