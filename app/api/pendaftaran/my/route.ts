import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { Batch } from '@/types/database'

// Type for Supabase query result with nested relations (batch comes as array)
interface SupabaseRegistrationResult {
  id: string
  batch_id: string
  batch?: Batch[] | null
  [key: string]: any
}

// Type for processed registration with batch as object
interface RegistrationWithBatch {
  id: string
  batch_id: string
  batch?: Batch | null
  created_at?: string
  submitted_at?: string
  [key: string]: any
}

// Type for final registration with additional fields
interface FinalRegistration {
  id: string
  created_at?: string
  submitted_at?: string
  [key: string]: any
}

// Helper to convert Supabase result to registration with batch
function toRegistrationWithBatch(reg: SupabaseRegistrationResult): RegistrationWithBatch {
  // Handle both array and object format
  // Supabase sometimes returns batch as array, sometimes as object
  const batch = Array.isArray(reg.batch) ? reg.batch[0] : reg.batch
  return {
    ...reg,
    batch: batch || null
  }
}

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
    // First try by user_id, if empty, try by email (for cases where user_id doesn't match)
    let tikrarRegistrations: any[] | null = null
    let tikrarError: any = null

    const { data: tikrarById, error: errorById } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        *,
        program:programs(*),
        batch:batches(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log('[API] Query by user_id result:', tikrarById?.length || 0, 'error:', errorById?.message)

    // If no results by user_id, try by email (for legacy data or user_id mismatches)
    // IMPORTANT: Use admin client to bypass RLS policies that block viewing by email
    if (!tikrarById || tikrarById.length === 0) {
      console.log('[API] No registrations found by user_id, trying by email...')
      console.log('[API] User ID:', user.id)
      console.log('[API] User email for search:', user.email)
      const supabaseAdmin = createSupabaseAdmin()

      const { data: tikrarByEmail, error: errorByEmail } = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .select(`
          *,
          program:programs(*),
          batch:batches(*)
        `)
        .ilike('email', user.email || '') // Use case-insensitive match
        .order('created_at', { ascending: false })

      console.log('[API] Email search result:', tikrarByEmail?.length || 0, 'error:', errorByEmail?.message)

      if (tikrarByEmail && tikrarByEmail.length > 0) {
        tikrarRegistrations = tikrarByEmail
        console.log('[API] Found registrations by email, updating user_id...')
        // Update the user_id to fix mismatch using admin client
        for (const reg of tikrarByEmail) {
          const { error: updateError } = await supabaseAdmin
            .from('pendaftaran_tikrar_tahfidz')
            .update({ user_id: user.id })
            .eq('id', reg.id)
          console.log('[API] Updated registration', reg.id, 'error:', updateError?.message)
        }
      } else {
        // Fallback: Try matching by user.email from users table (full_name match)
        console.log('[API] No registrations found by email, trying by user profile...')
        const { data: userProfile } = await supabaseAdmin
          .from('users')
          .select('id, full_name, email')
          .eq('id', user.id)
          .single()

        console.log('[API] User profile:', userProfile)

        if (userProfile?.full_name) {
          console.log('[API] User profile found, searching by full_name:', userProfile.full_name)
          const { data: tikrarByName, error: errorByName } = await supabaseAdmin
            .from('pendaftaran_tikrar_tahfidz')
            .select(`
              *,
              program:programs(*),
              batch:batches(*)
            `)
            .ilike('full_name', `%${userProfile.full_name}%`)
            .order('created_at', { ascending: false })

          console.log('[API] Full_name search result:', tikrarByName?.length || 0, 'error:', errorByName?.message)

          if (tikrarByName && tikrarByName.length > 0) {
            tikrarRegistrations = tikrarByName
            console.log('[API] Found registrations by name, updating user_id...')
            // Update the user_id to fix mismatch using admin client
            for (const reg of tikrarByName) {
              await supabaseAdmin
                .from('pendaftaran_tikrar_tahfidz')
                .update({ user_id: user.id })
                .eq('id', reg.id)
            }
          } else {
            tikrarRegistrations = tikrarById
            tikrarError = errorById
          }
        } else {
          tikrarRegistrations = tikrarById
          tikrarError = errorById
        }
      }
    } else {
      tikrarRegistrations = tikrarById
    }

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
        batch:batches(*),
        ujian_halaqah:halaqahs!daftar_ulang_submissions_ujian_halaqah_id_fkey(*),
        tashih_halaqah:halaqahs!daftar_ulang_submissions_tashih_halaqah_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Debug logging
    console.log('=== /api/pendaftaran/my DEBUG ===')
    console.log('User ID:', user.id, 'Email:', user.email)
    console.log('Tikrar registrations by user_id:', tikrarById?.length || 0, 'error:', errorById?.message)
    console.log('Tikrar registrations raw:', tikrarRegistrations?.length || 0)
    console.log('Tikrar registrations data:', tikrarRegistrations?.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      email: r.email,
      full_name: r.full_name,
      status: r.status,
      selection_status: r.selection_status,
      batch_id: r.batch_id,
      batch_is_array: Array.isArray(r.batch),
      batch_status: Array.isArray(r.batch) ? r.batch?.[0]?.status : r.batch?.status,
      will_pass_filter: (Array.isArray(r.batch) ? r.batch?.[0]?.status : r.batch?.status) === 'open'
    })))
    console.log('Muallimah registrations:', muallimahRegistrations?.length || 0, 'error:', muallimahError?.message)
    console.log('Musyrifah registrations:', musyrifahRegistrations?.length || 0, 'error:', musyrifahError?.message)
    console.log('Daftar ulang submissions:', daftarUlangSubmissions?.length || 0, 'error:', daftarUlangError?.message)

    // Combine all registrations into a single array
    // FILTER: Only include registrations with batch status = 'open'
    const allRegistrations: FinalRegistration[] = [
      ...((tikrarRegistrations || []) as SupabaseRegistrationResult[])
        .map(toRegistrationWithBatch)
        .filter(reg => {
          const passes = reg.batch?.status === 'open'
          console.log(`[Filter] Tikrar reg ${reg.id}: batch_status=${reg.batch?.status}, passes=${passes}`)
          return passes
        })
        .map(reg => {
          // Find matching daftar ulang submission for this registration
          const daftarUlang = daftarUlangSubmissions?.find(dus => dus.registration_id === reg.id)
          return {
            ...reg,
            registration_type: 'calon_thalibah',
            role: 'calon_thalibah',
            status: reg.status || 'pending',
            // Add batch_name for display in perjalanan-saya page
            batch_name: reg.batch?.name || null,
            // Add daftar ulang data
            daftar_ulang: daftarUlang || null
          }
        }),
      ...((muallimahRegistrations || []) as SupabaseRegistrationResult[])
        .map(toRegistrationWithBatch)
        .filter(reg => reg.batch?.status === 'open')
        .map(reg => ({
          ...reg,
          registration_type: 'muallimah',
          role: 'muallimah',
          status: reg.status || 'pending',
          batch_name: reg.batch?.name || null
        })),
      ...((musyrifahRegistrations || []) as SupabaseRegistrationResult[])
        .map(toRegistrationWithBatch)
        .filter(reg => reg.batch?.status === 'open')
        .map(reg => ({
          ...reg,
          registration_type: 'musyrifah',
          role: 'musyrifah',
          status: reg.status || 'pending',
          batch_name: reg.batch?.name || null
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

    // Return in format that fetcher expects: { data: [...] }
    // The fetcher will extract .data property (see lib/swr/fetchers.ts:112-113)
    return NextResponse.json({ data: allRegistrations })

  } catch (error) {
    console.error('Pendaftaran/my API error:', error)
    // Return empty array on error instead of failing
    return NextResponse.json({ data: [] })
  }
}
