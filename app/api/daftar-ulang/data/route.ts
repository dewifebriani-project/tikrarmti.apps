import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponses } from '@/lib/api-responses'


export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return ApiResponses.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    let batchId = searchParams.get('batchId')

    let query = supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('user_id', user.id)
      .eq('selection_status', 'selected')
      .order('created_at', { ascending: false })

    if (batchId) {
      query = query.eq('batch_id', batchId)
    }

    const { data: registrations, error: regError } = await query

    if (regError || !registrations || registrations.length === 0) {
      return ApiResponses.error('NOT_FOUND', 'Pendaftaran tidak ditemukan atau belum lulus seleksi', undefined, 404)
    }

    const registration = registrations[0]
    batchId = registration.batch_id

    const { data: existingSubmission } = await supabase
      .from('daftar_ulang_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('registration_id', registration.id)
      .maybeSingle()

    // Ambil Halaqah yang sesuai
    const { data: rawHalaqah, error: halaqahError } = await supabase
      .from('halaqah')
      .select(`
        id, name, description, class_type, 
        day_of_week, start_time, end_time, location, max_students,
        muallimah_preferred_juz, muallimah_schedule,
        mentors:halaqah_mentors(
          mentor_id, role, is_primary,
          users:users!halaqah_mentors_mentor_id_fkey(full_name)
        )
      `)
      .eq('batch_id', batchId)
      .eq('status', 'active')

    if (halaqahError) {
      console.error('Error fetching halaqah:', halaqahError)
      return ApiResponses.databaseError(halaqahError)
    }

    let halaqahData = []
    if (rawHalaqah && rawHalaqah.length > 0) {
      const finalJuz = (registration.chosen_juz || '').toUpperCase()
      
      const quotaUrl = new URL('/api/shared/halaqah-quota', request.url)
      quotaUrl.searchParams.set('batch_id', batchId || '')
      quotaUrl.searchParams.set('user_id', user.id)

      const quotaResponse = await fetch(quotaUrl.toString(), {
        headers: {
          'Cookie': request.headers.get('Cookie') || ''
        }
      })

      let halaqahWithQuotas = rawHalaqah as any[]
      if (quotaResponse.ok) {
        const quotaResult = await quotaResponse.json()
        if (quotaResult.data) {
          halaqahWithQuotas = quotaResult.data
        }
      }
      
      halaqahData = halaqahWithQuotas.filter((h: any) => {
        if (!finalJuz || finalJuz === 'N/A') return true
        
        if (h.muallimah_preferred_juz || h.preferred_juz) {
          const pref = h.muallimah_preferred_juz || h.preferred_juz
          const preferredJuzs = pref.split(',').map((j: string) => j.trim().toUpperCase())
          return preferredJuzs.includes(finalJuz)
        }
        return true
      })
    }

    return ApiResponses.success({
      registration,
      existingSubmission,
      halaqah: halaqahData
    })

  } catch (error) {
    console.error('API /api/daftar-ulang/data error:', error)
    return ApiResponses.handleUnknown(error)
  }
}
