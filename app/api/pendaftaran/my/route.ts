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
    const { data: tikrarRegistrations, error: tikrarError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        id,
        user_id,
        batch_id,
        program_id,
        status,
        full_name,
        wa_phone,
        address,
        chosen_juz,
        main_time_slot,
        backup_time_slot,
        exam_score,
        written_quiz_submitted_at,
        oral_submission_url,
        oral_submitted_at,
        oral_score,
        oral_assessment_status,
        selection_status,
        re_enrollment_completed,
        created_at,
        updated_at,
        program:programs(*),
        batch:batches(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Get user's muallimah registrations with batch details
    const { data: muallimahRegistrations, error: muallimahError } = await supabase
      .from('muallimah_registrations')
      .select(`
        *,
        batch:batches(*)
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })

    // Get user's musyrifah registrations with program and batch details
    const { data: musyrifahRegistrations, error: musyrifahError } = await supabase
      .from('musyrifah_registrations')
      .select(`
        *,
        program:programs(*),
        batch:batches(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Get user's daftar ulang submissions
    const { data: daftarUlangSubmissions, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select(`
        *,
        batch:batches(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Debug logging
    console.log('=== /api/pendaftaran/my DEBUG ===')
    console.log('User ID:', user.id)
    console.log('Tikrar registrations:', tikrarRegistrations?.length || 0)
    console.log('Muallimah registrations:', muallimahRegistrations?.length || 0)
    console.log('Musyrifah registrations:', musyrifahRegistrations?.length || 0)
    console.log('Daftar ulang submissions:', daftarUlangSubmissions?.length || 0)

    // Combine all registrations into a single array
    const allRegistrations = [
      ...(tikrarRegistrations || []).map(reg => {
        // Find matching daftar ulang submission for this registration
        const daftarUlang = daftarUlangSubmissions?.find(dus => dus.registration_id === reg.id)
        return {
          ...reg,
          registration_type: 'calon_thalibah',
          role: 'calon_thalibah',
          status: reg.status || 'pending',
          // Add daftar ulang data
          daftar_ulang: daftarUlang || null
        }
      }),
      ...(muallimahRegistrations || []).map(reg => ({
        ...reg,
        registration_type: 'muallimah',
        role: 'muallimah',
        status: reg.status || 'pending'
      })),
      ...(musyrifahRegistrations || []).map(reg => ({
        ...reg,
        registration_type: 'musyrifah',
        role: 'musyrifah',
        status: reg.status || 'pending'
      }))
    ]

    console.log('Total registrations:', allRegistrations.length)
    console.log('Registrations by role:', {
      calon_thalibah: allRegistrations.filter(r => r.role === 'calon_thalibah').length,
      muallimah: allRegistrations.filter(r => r.role === 'muallimah').length,
      musyrifah: allRegistrations.filter(r => r.role === 'musyrifah').length,
    })
    console.log('===========================')

    // Sort by created_at/submitted_at descending
    allRegistrations.sort((a, b) => {
      const dateA = new Date(a.created_at || a.submitted_at || 0)
      const dateB = new Date(b.created_at || b.submitted_at || 0)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json({
      success: true,
      data: allRegistrations,
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
