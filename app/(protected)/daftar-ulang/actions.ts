'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface DaftarUlangFormData {
  // Confirmed data from registration
  confirmed_full_name: string
  confirmed_chosen_juz: string
  confirmed_main_time_slot: string
  confirmed_backup_time_slot: string
  confirmed_wa_phone?: string
  confirmed_address?: string

  // Partner selection
  partner_type: 'self_match' | 'system_match' | 'family' | 'tarteel'
  partner_user_id?: string
  partner_name?: string
  partner_relationship?: string
  partner_wa_phone?: string
  partner_notes?: string

  // Halaqah selection
  ujian_halaqah_id?: string
  tashih_halaqah_id?: string

  // Akad - Array of files
  akad_files?: Array<{ url: string; name: string }>
}

export async function saveDaftarUlangDraft(
  registrationId: string,
  data: Partial<DaftarUlangFormData>
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

  try {
    // Check for existing draft
    const { data: existing } = await supabase
      .from('daftar_ulang_submissions')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('registration_id', registrationId)
      .maybeSingle()

    // Convert empty strings to null for UUID and optional fields
    // IMPORTANT: For draft status, do NOT save halaqah data - only save partner and akad data
    // This ensures draft submissions don't accidentally reserve halaqah slots
    const cleanedData = {
      confirmed_full_name: data.confirmed_full_name,
      confirmed_chosen_juz: data.confirmed_chosen_juz,
      confirmed_main_time_slot: data.confirmed_main_time_slot,
      confirmed_backup_time_slot: data.confirmed_backup_time_slot,
      confirmed_wa_phone: data.confirmed_wa_phone || null,
      confirmed_address: data.confirmed_address || null,
      partner_type: data.partner_type,
      partner_user_id: data.partner_user_id || null,
      partner_name: data.partner_name || null,
      partner_relationship: data.partner_relationship || null,
      partner_wa_phone: data.partner_wa_phone || null,
      partner_notes: data.partner_notes || null,
      // DO NOT save halaqah data for draft - halaqah_id will be null
      ujian_halaqah_id: null,
      tashih_halaqah_id: null,
      akad_files: data.akad_files || null,
    }

    let result

    if (existing) {
      // Update existing draft
      result = await supabase
        .from('daftar_ulang_submissions')
        .update({
          ...cleanedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Create new draft
      result = await supabase
        .from('daftar_ulang_submissions')
        .insert({
          user_id: authUser.id,
          registration_id: registrationId,
          batch_id: registration.batch_id,
          status: 'draft',
          ...cleanedData
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('[saveDaftarUlangDraft] Error:', {
        error: result.error.message,
        code: result.error.code,
        existing: existing ? `id=${existing.id}` : 'none'
      })

      // Handle UNIQUE constraint violation specifically
      if (result.error.code === '23505') {
        return {
          success: false,
          error: 'Terjadi kesalahan pada data yang sudah ada. Silakan refresh halaman dan coba lagi.'
        }
      }

      // Handle RLS violations
      if (result.error.code === '42501') {
        return {
          success: false,
          error: 'Terjadi kesalahan keamanan. Silakan logout dan login kembali.'
        }
      }

      return { success: false, error: result.error.message }
    }

    return {
      success: true,
      data: result.data,
      message: 'Draft berhasil disimpan'
    }
  } catch (error: any) {
    console.error('Save draft error:', error)
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan tidak terduga'
    }
  }
}

export async function submitDaftarUlang(
  registrationId: string,
  data: DaftarUlangFormData
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
    .select(`
      id,
      user_id,
      batch_id,
      selection_status,
      full_name,
      chosen_juz,
      exam_score,
      main_time_slot,
      backup_time_slot,
      wa_phone,
      address
    `)
    .eq('id', registrationId)
    .single()

  if (regError || !registration || registration.user_id !== authUser.id) {
    return { success: false, error: 'Pendaftaran tidak valid.' }
  }

  if (registration.selection_status !== 'selected') {
    return { success: false, error: 'Anda belum lolos seleksi.' }
  }

  // 3. Validate required fields
  if (!data.partner_type) {
    return { success: false, error: 'Pilih jenis pasangan belajar.' }
  }

  if (!data.ujian_halaqah_id) {
    return { success: false, error: 'Pilih kelas ujian.' }
  }

  // If partner type is self_match, must have selected partner
  if (data.partner_type === 'self_match' && !data.partner_user_id) {
    return { success: false, error: 'Pilih pasangan belajar.' }
  }

  // If partner type is family or tarteel, must have name
  if ((data.partner_type === 'family' || data.partner_type === 'tarteel') && !data.partner_name) {
    return { success: false, error: 'Isi nama pasangan belajar.' }
  }

  // If partner type is family, must have relationship
  if (data.partner_type === 'family' && !data.partner_relationship) {
    return { success: false, error: 'Pilih hubungan dengan pasangan belajar.' }
  }

  // 4. Validate akad is uploaded
  if (!data.akad_files || data.akad_files.length === 0) {
    return { success: false, error: 'Upload akad daftar ulang terlebih dahulu.' }
  }

  // 5. Calculate final juz placement based on exam score
  const examScore = registration.exam_score || null
  const chosenJuz = (registration.chosen_juz || '').toUpperCase()
  let finalJuz = chosenJuz

  if (examScore !== null && examScore < 70) {
    if (chosenJuz === '28A' || chosenJuz === '28B' || chosenJuz === '28') {
      finalJuz = '29A'
    } else if (chosenJuz === '1A' || chosenJuz === '1B' || chosenJuz === '29A' || chosenJuz === '29B' || chosenJuz === '29' || chosenJuz === '1') {
      finalJuz = '30A'
    }
  }

  try {
    // 6. CHECK QUOTA FOR SELECTED HALAQAH (only for submitted status)
    // Get the selected halaqah IDs first
    const selectedHalaqahIds = [data.ujian_halaqah_id]
    if (data.tashih_halaqah_id && data.tashih_halaqah_id !== data.ujian_halaqah_id) {
      selectedHalaqahIds.push(data.tashih_halaqah_id)
    }

    // Get max_students for selected halaqah
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

    // Fetch all submissions with 'submitted' status for the selected halaqahs (draft doesn't count)
    const { data: submittedSubmissions } = await supabase
      .from('daftar_ulang_submissions')
      .select('ujian_halaqah_id, tashih_halaqah_id, user_id')
      .eq('batch_id', registration.batch_id)
      .eq('status', 'submitted')

    // Fetch halaqah_students with 'active' status only for selected halaqahs (waitlist does NOT reduce quota)
    const { data: halaqahStudents } = await supabase
      .from('halaqah_students')
      .select('halaqah_id, thalibah_id')
      .eq('status', 'active')
      .in('halaqah_id', selectedHalaqahIds)

    // Count students per halaqah using Set to avoid duplicates
    const halaqahStudentMap = new Map<string, Set<string>>()

    // Count from daftar_ulang_submissions (only submitted)
    if (submittedSubmissions) {
      for (const sub of submittedSubmissions) {
        // Skip current user's existing submission when counting quota
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

    // Count from halaqah_students (active only, waitlist does NOT reduce quota)
    if (halaqahStudents) {
      for (const student of halaqahStudents) {
        // Skip current user if they're already in halaqah_students
        if (student.thalibah_id === authUser.id) continue

        if (!halaqahStudentMap.has(student.halaqah_id)) {
          halaqahStudentMap.set(student.halaqah_id, new Set())
        }
        halaqahStudentMap.get(student.halaqah_id)!.add(student.thalibah_id)
      }
    }

    // Check if any selected halaqah is full
    for (const halaqah of halaqahInfo) {
      const currentStudents = halaqahStudentMap.get(halaqah.id)?.size || 0
      const maxStudents = halaqah.max_students || 20

      console.log('[submitDaftarUlang] Quota check for halaqah:', {
        halaqahId: halaqah.id,
        halaqahName: halaqah.name,
        currentStudents,
        maxStudents,
        isFull: currentStudents >= maxStudents
      })

      if (currentStudents >= maxStudents) {
        return {
          success: false,
          error: `Maaf, kelas "${halaqah.name}" sudah penuh. Silakan pilih kelas lain.`
        }
      }
    }

    // Check for existing submission
    const { data: existing, error: existingError } = await supabase
      .from('daftar_ulang_submissions')
      .select('id, status, ujian_halaqah_id, tashih_halaqah_id')
      .eq('user_id', authUser.id)
      .eq('registration_id', registrationId)
      .maybeSingle()

    // Debug logging
    console.log('[submitDaftarUlang] Existing check:', {
      userId: authUser.id,
      registrationId,
      existing,
      existingError: existingError?.message,
      existingErrorCode: existingError?.code
    })

    // IMPORTANT: If converting from draft to submitted, RECHECK QUOTA
    // This is necessary because quota may have become full since the draft was created
    if (existing && existing.status === 'draft') {
      // Check if the selected halaqahs have changed
      const halaqahChanged =
        existing.ujian_halaqah_id !== data.ujian_halaqah_id ||
        existing.tashih_halaqah_id !== data.tashih_halaqah_id

      // Re-check quota for the newly selected halaqahs
      if (halaqahChanged) {
        console.log('[submitDaftarUlang] Halaqah changed, rechecking quota...')

        // Recalculate quota for NEWLY selected halaqahs only
        for (const halaqah of halaqahInfo) {
          const currentStudents = halaqahStudentMap.get(halaqah.id)?.size || 0
          const maxStudents = halaqah.max_students || 20

          console.log('[submitDaftarUlang] Recheck quota for halaqah:', {
            halaqahId: halaqah.id,
            halaqahName: halaqah.name,
            currentStudents,
            maxStudents,
            isFull: currentStudents >= maxStudents
          })

          if (currentStudents >= maxStudents) {
            return {
              success: false,
              error: `Maaf, kelas "${halaqah.name}" sudah penuh. Silakan pilih kelas lain.`
            }
          }
        }
      }
    }

    const submissionData = {
      user_id: authUser.id,
      registration_id: registrationId,
      batch_id: registration.batch_id,

      // Confirmed data - Use final_juz (adjusted based on exam score) for placement
      confirmed_full_name: data.confirmed_full_name || registration.full_name,
      confirmed_chosen_juz: finalJuz, // Use final juz placement instead of original chosen juz
      confirmed_main_time_slot: data.confirmed_main_time_slot || registration.main_time_slot,
      confirmed_backup_time_slot: data.confirmed_backup_time_slot || registration.backup_time_slot,
      confirmed_wa_phone: data.confirmed_wa_phone || registration.wa_phone,
      confirmed_address: data.confirmed_address || registration.address,

      // Partner selection - Convert empty strings to null for UUID fields
      partner_type: data.partner_type,
      partner_user_id: data.partner_user_id || null,
      partner_name: data.partner_name || null,
      partner_relationship: data.partner_relationship || null,
      partner_wa_phone: data.partner_wa_phone || null,
      partner_notes: data.partner_notes || null,

      // Halaqah selection - Convert empty strings to null for UUID fields
      ujian_halaqah_id: data.ujian_halaqah_id || null,
      tashih_halaqah_id: data.tashih_halaqah_id || null,

      // Akad
      akad_files: data.akad_files || null,
      akad_submitted_at: new Date().toISOString(),

      // Status - submitted status reduces quota
      status: 'submitted' as const,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    let result

    if (existing && existing.status === 'draft') {
      // Update existing draft to submitted
      result = await supabase
        .from('daftar_ulang_submissions')
        .update(submissionData)
        .eq('id', existing.id)
        .select()
        .single()
    } else if (!existing) {
      // Create new submission
      result = await supabase
        .from('daftar_ulang_submissions')
        .insert(submissionData)
        .select()
        .single()
    } else {
      return { success: false, error: 'Anda sudah submit daftar ulang.' }
    }

    if (result.error) {
      console.error('[submitDaftarUlang] Submission error:', {
        error: result.error.message,
        code: result.error.code,
        details: result.error.details,
        hint: result.error.hint,
        existing: existing ? `id=${existing.id}, status=${existing.status}` : 'none'
      })

      // Handle UNIQUE constraint violation specifically
      if (result.error.code === '23505') {
        return {
          success: false,
          error: 'Anda sudah memiliki pendaftaran daftar ulang. Silakan cek kembali atau hubungi admin.'
        }
      }

      // Handle RLS violations
      if (result.error.code === '42501') {
        return {
          success: false,
          error: 'Terjadi kesalahan keamanan. Silakan logout dan login kembali.'
        }
      }

      return { success: false, error: result.error.message }
    }

    // Update pendaftaran_tikrar_tahfidz to mark re_enrollment_completed as true
    const { error: updateError } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .update({
        re_enrollment_completed: true,
        re_enrollment_completed_at: new Date().toISOString()
      })
      .eq('id', registrationId)

    if (updateError) {
      console.error('Failed to update re_enrollment_completed:', updateError)
      // Continue anyway as the submission was successful
    }

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/perjalanan-saya')
    revalidatePath('/daftar-ulang')

    return {
      success: true,
      data: result.data,
      message: 'Alhamdulillah! Daftar ulang berhasil dikirim!'
    }
  } catch (error: any) {
    console.error('Submit daftar ulang error:', error)
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan tidak terduga'
    }
  }
}

export async function uploadAkad(formData: FormData) {
  const supabase = createClient()

  // 1. Validasi Auth
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (!authUser || authError) {
    return { success: false, error: 'Unauthorized. Silakan login kembali.' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { success: false, error: 'Tidak ada file yang diupload.' }
  }

  // Validate file type (only PDF and images)
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Format file harus PDF atau gambar (JPG, PNG).' }
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { success: false, error: 'Ukuran file maksimal 5MB.' }
  }

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${authUser.id}/${Date.now()}_akad.${fileExt}`
    const filePath = `akad/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)

      // Provide more specific error messages
      if (uploadError.message.includes('bucket not found') || uploadError.message.includes('The resource was not found')) {
        return {
          success: false,
          error: 'Bucket storage belum tersedia. Silakan hubungi admin.'
        }
      }

      return {
        success: false,
        error: `Gagal mengupload file: ${uploadError.message}`
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    return {
      success: true,
      data: {
        url: publicUrl,
        path: filePath,
        name: file.name
      },
      message: 'File berhasil diupload'
    }
  } catch (error: any) {
    console.error('Upload akad error:', error)

    // Check for bucket-related errors
    if (error?.message?.includes('bucket') || error?.message?.includes('storage')) {
      return {
        success: false,
        error: 'Bucket storage belum tersedia. Silakan hubungi admin.'
      }
    }

    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan saat upload file'
    }
  }
}
