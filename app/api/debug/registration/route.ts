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
      musyrifahRegistrations,
      daftarUlangSubmissions,
      allBatches
    ] = await Promise.all([
      supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('*, batch:batches(*), program:programs(*)')
        .eq('user_id', user.id),

      supabase
        .from('muallimah_registrations')
        .select('*, batch:batches(*)')
        .eq('user_id', user.id),

      supabase
        .from('musyrifah_registrations')
        .select('*, batch:batches(*), program:programs(*)')
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

    // Process tikrar registrations with batch info
    const tikrarData = (directRegistrations.data || []).map((r: any) => {
      const batch = Array.isArray(r.batch) ? r.batch[0] : r.batch
      return {
        id: r.id,
        user_id: r.user_id,
        full_name: r.full_name,
        email: r.email,
        status: r.status,
        selection_status: r.selection_status,
        batch_id: r.batch_id,
        batch_name: batch?.name || null,
        batch_status: batch?.status || null,
        program_name: r.program?.name || null,
        re_enrollment_completed: r.re_enrollment_completed
      }
    })

    // Process muallimah registrations with batch info
    const muallimahData = (muallimahRegistrations.data || []).map((r: any) => {
      const batch = Array.isArray(r.batch) ? r.batch[0] : r.batch
      return {
        id: r.id,
        user_id: r.user_id,
        status: r.status,
        batch_id: r.batch_id,
        batch_name: batch?.name || null,
        batch_status: batch?.status || null,
        preferred_juz: r.preferred_juz
      }
    })

    // Process musyrifah registrations with batch info
    const musyrifahData = (musyrifahRegistrations.data || []).map((r: any) => {
      const batch = Array.isArray(r.batch) ? r.batch[0] : r.batch
      return {
        id: r.id,
        user_id: r.user_id,
        status: r.status,
        batch_id: r.batch_id,
        batch_name: batch?.name || null,
        batch_status: batch?.status || null
      }
    })

    return NextResponse.json({
      userInfo: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        roles: user.user_metadata?.roles || []
      },
      tikrarRegistrations: {
        count: tikrarData.length,
        data: tikrarData
      },
      muallimahRegistrations: {
        count: muallimahData.length,
        data: muallimahData
      },
      musyrifahRegistrations: {
        count: musyrifahData.length,
        data: musyrifahData
      },
      daftarUlangSubmissions: {
        count: daftarUlangSubmissions.data?.length || 0,
        data: daftarUlangSubmissions.data?.map((d: any) => {
          const batch = Array.isArray(d.batch) ? d.batch[0] : d.batch
          return {
            id: d.id,
            status: d.status,
            registration_id: d.registration_id,
            batch_id: d.batch_id,
            batch_name: batch?.name || null,
            batch_status: batch?.status || null,
            tashih_halaqah_id: d.tashih_halaqah_id,
            ujian_halaqah_id: d.ujian_halaqah_id,
            akad_files_count: d.akad_files?.length || 0
          }
        }) || []
      },
      allBatches: {
        count: allBatches.data?.length || 0,
        data: allBatches.data?.map((b: any) => ({
          id: b.id,
          name: b.name,
          status: b.status,
          start_date: b.start_date,
          end_date: b.end_date
        })) || []
      },
      apiResponse: {
        status: apiResponse.status,
        dataLength: apiData.data?.length || 0,
        data: apiData.data?.map((item: any) => ({
          id: item.id,
          registration_type: item.registration_type,
          role: item.role,
          status: item.status,
          batch_id: item.batch_id,
          batch_name: item.batch_name,
          batch_status: item.batch?.status
        })) || []
      },
      summary: {
        totalRegistrations: tikrarData.length + muallimahData.length + musyrifahData.length,
        hasOpenBatch: tikrarData.some((r: any) => r.batch_status === 'open') ||
                      muallimahData.some((r: any) => r.batch_status === 'open') ||
                      musyrifahData.some((r: any) => r.batch_status === 'open'),
        hasAnyValidBatch: tikrarData.some((r: any) => r.batch_status && r.batch_status !== 'draft') ||
                          muallimahData.some((r: any) => r.batch_status && r.batch_status !== 'draft') ||
                          musyrifahData.some((r: any) => r.batch_status && r.batch_status !== 'draft')
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
