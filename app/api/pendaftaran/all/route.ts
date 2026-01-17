import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/pendaftaran/all
 *
 * API for perjalanan-saya page - shows thalibah registrations from OPEN batches
 * Only queries pendaftaran_tikrar_tahfidz (thalibah registrations)
 * muallimah_registrations and musyrifah_registrations are NOT included
 * because they're unrelated to thalibah learning journey
 */
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

    // Get tikrar registrations and daftar ulang submissions
    const [tikrarResult, daftarUlangResult] = await Promise.all([
      supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select(`
          *,
          batch:batches(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      supabase
        .from('daftar_ulang_submissions')
        .select(`
          *,
          batch:batches(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ])

    // Combine registrations - only from OPEN batches (current active batch)
    const allRegistrations = [
      // Tikrar registrations from OPEN batches
      ...(tikrarResult.data || [])
        .filter((reg: any) => reg.batch?.status === 'open')
        .map((reg: any) => ({
          ...reg,
          registration_type: 'calon_thalibah',
          role: 'calon_thalibah',
          status: reg.status || 'pending',
          batch_name: reg.batch?.name || null
        })),
      // Daftar ulang submissions from OPEN batches
      ...(daftarUlangResult.data || [])
        .filter((submission: any) => submission.batch?.status === 'open')
        .map((submission: any) => ({
          ...submission,
          registration_type: 'daftar_ulang',
          role: 'thalibah',
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
