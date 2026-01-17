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

    // Get all registrations from different tables in parallel
    const [
      directRegistrations,
      muallimahRegistrations,
      daftarUlangSubmissions,
      allBatches
    ] = await Promise.all([
      supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('*')
        .eq('user_id', user.id),

      supabase
        .from('muallimah_registrations')
        .select('*, batch:batches(*)')
        .eq('user_id', user.id),

      supabase
        .from('daftar_ulang_submissions')
        .select('*, batch:batches(*)')
        .eq('user_id', user.id),

      supabase
        .from('batches')
        .select('id, name, status, start_date, end_date')
        .order('start_date', { ascending: false })
    ])

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
        email: user.email,
        roles: user.user_metadata?.roles || []
      },
      registrationsByUserId: {
        count: directRegistrations?.length || 0,
        data: directRegistrations?.map((r: any) => ({
          id: r.id,
          status: r.status,
          selection_status: r.selection_status,
          batch_id: r.batch_id,
          batch_name: r.batch?.name || null,
          batch_status: r.batch?.status || null
        }))
      },
      muallimahRegistrations: {
        count: muallimahRegistrations?.length || 0,
        data: muallimahRegistrations?.map((r: any) => ({
          id: r.id,
          status: r.status,
          batch_id: r.batch_id,
          batch_name: r.batch?.name || null,
          batch_status: r.batch?.status || null,
          preferred_juz: r.preferred_juz
        }))
      },
      daftarUlangSubmissions: {
        count: daftarUlangSubmissions?.length || 0,
        data: daftarUlangSubmissions?.map((d: any) => ({
          id: d.id,
          status: d.status,
          registration_id: d.registration_id,
          batch_id: d.batch_id,
          batch_name: d.batch?.name || null,
          tashih_halaqah_id: d.tashih_halaqah_id,
          ujian_halaqah_id: d.ujian_halaqah_id,
          akad_files_count: d.akad_files?.length || 0
        }))
      },
      allBatches: {
        count: allBatches?.length || 0,
        data: allBatches?.map((b: any) => ({
          id: b.id,
          name: b.name,
          status: b.status,
          start_date: b.start_date,
          end_date: b.end_date
        }))
      },
      apiResponse: {
        status: apiResponse.status,
        dataLength: apiData.data?.length || 0,
        firstItem: apiData.data?.[0] ? {
          id: apiData.data[0].id,
          status: apiData.data[0].status,
          role: apiData.data[0].role,
          registration_type: apiData.data[0].registration_type,
          batch_status: apiData.data[0].batch?.[0]?.status
        } : null
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      error: 'Error fetching debug info',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
