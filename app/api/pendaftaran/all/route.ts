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

    // Get tikrar registrations with daftar ulang data embedded (with halaqah details)
    const { data: tikrarRegistrations, error: tikrarError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        *,
        batch:batches(*),
        program:programs(*),
        daftar_ulang:daftar_ulang_submissions(
          id,
          user_id,
          batch_id,
          registration_id,
          confirmed_full_name,
          confirmed_chosen_juz,
          confirmed_main_time_slot,
          confirmed_backup_time_slot,
          status,
          submitted_at,
          reviewed_at,
          akad_files,
          ujian_halaqah_id,
          tashih_halaqah_id,
          ujian_halaqah:halaqah!daftar_ulang_submissions_ujian_halaqah_id_fkey(
            id,
            name,
            day_of_week,
            start_time,
            end_time,
            location
          ),
          tashih_halaqah:halaqah!daftar_ulang_submissions_tashih_halaqah_id_fkey(
            id,
            name,
            day_of_week,
            start_time,
            end_time,
            location
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (tikrarError) {
      console.error('Error fetching tikrar registrations:', tikrarError)
      throw tikrarError
    }

    // Process registrations and embed daftar ulang data
    const allRegistrations = (tikrarRegistrations || [])
      .filter((reg: any) => reg.batch?.status === 'open') // Only from OPEN batches
      .map((reg: any) => {
        // Get daftar ulang submission for this batch
        const daftarUlang = reg.daftar_ulang && Array.isArray(reg.daftar_ulang)
          ? reg.daftar_ulang.find((du: any) => du.batch_id === reg.batch_id)
          : null

        return {
          ...reg,
          registration_type: 'calon_thalibah',
          role: 'calon_thalibah',
          status: reg.status || 'pending',
          batch_name: reg.batch?.name || null,
          daftar_ulang: daftarUlang || null,
          // For backwards compatibility, set re_enrollment_completed if daftar ulang is approved
          re_enrollment_completed: daftarUlang?.status === 'approved' ? true : reg.re_enrollment_completed
        }
      })

    // Sort by created_at descending
    allRegistrations.sort((a, b) => {
      const dateA = new Date(a.created_at || 0)
      const dateB = new Date(b.created_at || 0)
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
