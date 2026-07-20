'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PilihPasanganFormData {
  // Halaqah selection
  ujian_halaqah_id: string
  tashih_halaqah_id: string

  // Partner selection
  partner_type: 'self_match' | 'system_match' | 'family' | 'tarteel' | ''
  partner_user_id?: string
  partner_name?: string
  partner_relationship?: string
  partner_wa_phone?: string
  partner_notes?: string
}

export async function submitPilihPasangan(
  registrationId: string,
  data: PilihPasanganFormData
) {
  const supabase = createClient()

  // 1. Validasi Auth
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (!authUser || authError) {
    return { success: false, error: 'Unauthorized. Silakan login kembali.' }
  }

  // 2. Verify registration belongs to user and is selected
  const { data: registration, error: regError } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, user_id, batch_id, selection_status')
    .eq('id', registrationId)
    .single()

  if (regError || !registration || registration.user_id !== authUser.id) {
    return { success: false, error: 'Pendaftaran tidak valid.' }
  }

  if (registration.selection_status !== 'selected') {
    return { success: false, error: 'Anda belum lolos seleksi.' }
  }

  // 3. Validate required fields
  if (!data.ujian_halaqah_id) {
    return { success: false, error: 'Pilih paket kelas halaqah.' }
  }

  if (!data.partner_type) {
    return { success: false, error: 'Pilih jenis pasangan belajar.' }
  }

  if (data.partner_type === 'self_match' && !data.partner_user_id) {
    return { success: false, error: 'Pilih pasangan belajar.' }
  }

  if ((data.partner_type === 'family' || data.partner_type === 'tarteel') && !data.partner_name) {
    return { success: false, error: 'Isi nama pasangan belajar.' }
  }

  if (data.partner_type === 'family' && !data.partner_relationship) {
    return { success: false, error: 'Pilih hubungan dengan pasangan belajar.' }
  }

  try {
    // 4. CHECK QUOTA FOR SELECTED HALAQAH
    const selectedHalaqahIds = [data.ujian_halaqah_id]
    if (data.tashih_halaqah_id && data.tashih_halaqah_id !== data.ujian_halaqah_id) {
      selectedHalaqahIds.push(data.tashih_halaqah_id)
    }

    const { data: halaqahInfo } = await supabase
      .from('halaqah')
      .select('id, name, max_students')
      .in('id', selectedHalaqahIds)

    if (!halaqahInfo || halaqahInfo.length === 0) {
      return {
        success: false,
        error: 'Halaqah tidak ditemukan'
      }
    }

    // Check how many students are in the halaqah right now
    const { data: submittedSubmissions } = await supabase
      .from('daftar_ulang_submissions')
      .select('ujian_halaqah_id, tashih_halaqah_id, user_id')
      .eq('batch_id', registration.batch_id)

    const { data: halaqahStudents } = await supabase
      .from('halaqah_students')
      .select('halaqah_id, thalibah_id')
      .eq('status', 'active')
      .in('halaqah_id', selectedHalaqahIds)

    const halaqahStudentMap = new Map<string, Set<string>>()

    if (submittedSubmissions) {
      for (const sub of submittedSubmissions) {
        if (sub.user_id === authUser.id) continue

        const uniqueHalaqahIds: string[] = []
        if (sub.ujian_halaqah_id) uniqueHalaqahIds.push(sub.ujian_halaqah_id)
        if (sub.tashih_halaqah_id && !uniqueHalaqahIds.includes(sub.tashih_halaqah_id)) {
          uniqueHalaqahIds.push(sub.tashih_halaqah_id)
        }

        for (const halaqahId of uniqueHalaqahIds) {
          if (!halaqahStudentMap.has(halaqahId)) {
            halaqahStudentMap.set(halaqahId, new Set())
          }
          halaqahStudentMap.get(halaqahId)!.add(sub.user_id)
        }
      }
    }

    if (halaqahStudents) {
      for (const student of halaqahStudents) {
        if (student.thalibah_id === authUser.id) continue

        if (!halaqahStudentMap.has(student.halaqah_id)) {
          halaqahStudentMap.set(student.halaqah_id, new Set())
        }
        halaqahStudentMap.get(student.halaqah_id)!.add(student.thalibah_id)
      }
    }

    for (const halaqah of halaqahInfo) {
      const currentStudents = halaqahStudentMap.get(halaqah.id)?.size || 0
      const maxStudents = halaqah.max_students || 20

      if (currentStudents >= maxStudents) {
        return {
          success: false,
          error: `Maaf, kelas "${halaqah.name}" sudah penuh. Silakan pilih kelas lain.`
        }
      }
    }

    // 5. Update daftar_ulang_submissions
    const { data: existing, error: existingError } = await supabase
      .from('daftar_ulang_submissions')
      .select('id, status')
      .eq('user_id', authUser.id)
      .eq('registration_id', registrationId)
      .maybeSingle()
      
    if (existingError || !existing) {
        return { success: false, error: 'Data daftar ulang tidak ditemukan. Silakan selesaikan Review Akad terlebih dahulu.' }
    }

    const submissionData = {
      ujian_halaqah_id: data.ujian_halaqah_id,
      tashih_halaqah_id: data.tashih_halaqah_id || data.ujian_halaqah_id,
      partner_type: data.partner_type,
      partner_user_id: data.partner_user_id || null,
      partner_name: data.partner_name || null,
      partner_relationship: data.partner_relationship || null,
      partner_wa_phone: data.partner_wa_phone || null,
      partner_notes: data.partner_notes || null,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('daftar_ulang_submissions')
      .update(submissionData)
      .eq('id', existing.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/perjalanan-saya')
    revalidatePath('/pilih-pasangan')

    return {
      success: true,
      message: 'Halaqah dan Pasangan berhasil dipilih!'
    }
  } catch (error: any) {
    console.error('Submit pilih pasangan error:', error)
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan tidak terduga'
    }
  }
}
