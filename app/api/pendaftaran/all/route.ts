import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/pendaftaran/all
 *
 * This API bypasses batch status filtering to show ALL registrations
 * Used for debugging perjalanan-saya page where muallimah users need to see their data
 * regardless of batch status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status:  }
      )
    }

    // Get ALL registrations from all tables WITHOUT batch status filter
    const [
      directRegistrations,
      muallimahRegistrations,
      musyrifahRegistrations,
      daftarUlangSubmissions
    ] = await Promise.all([
      supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select(`
          *,
          batch:batches(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      supabase
        .from('muallimah_registrations')
        .select('*, batch:batches(*)')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false }),

      supabase
        .from('musyrifah_registrations')
        .select(`
          *,
          program:programs(*),
          batch:batches(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      supabase
        .from('daftar_ulang_submissions')
        .select(`
          *,
          batch:batches(*),
          ujian_halaqah:halaqah!daftar_ulang_submissions_ujian_halaqah_id_fkey(*),
          tashih_halaqah:halaqah!daftar_ulang_submissions_tashih_halaqah_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ])

    // Combine all registrations without filter - include ALL statuses
    const allRegistrations = [
      ...(directRegistrations || []).map((reg: any) => ({
        ...reg,
        registration_type: 'calon_thalibah',
        role: 'calon_thalibah',
        status: reg.status || 'pending',
        batch_name: reg.batch?.name || null
      })),
      ...(muallimahRegistrations || []).map((reg: any) => ({
        ...reg,
        registration_type: 'muallimah',
        role: 'muallimah',
        status: reg.status || 'pending',
        batch_name: reg.batch?.name || null
      })),
      ...(musyrifahRegistrations || []).map((reg: any) => ({
        ...reg,
        registration_type: 'musyrifah',
        role: 'musyrifah',
        status: reg.status || 'pending',
        batch_name: reg.batch?.name || null
      })),
      ...(daftarUlangSubmissions || []).map((submission: any) => ({
        ...submission,
        registration_type: 'daftar_ulang',
        role: 'thalibah', // As thalibah in daftar ulang
        status: submission.status,
        batch_name: submission.batch?.name || null
      }))
    ]

    // Sort by created_at/submitted_at descending
    allRegistrations.sort((a, b) => {
      const dateA = new Date(a.created_at || a.submitted_at || 0)
      const dateB = new Date(b.created_at || b.submitted_at || 0)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json({ data: allRegistrations })

  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}
