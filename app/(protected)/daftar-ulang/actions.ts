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
  is_tashih_umum?: boolean

  // Akad
  akad_url?: string
  akad_file_name?: string
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

    let result

    if (existing) {
      // Update existing draft
      result = await supabase
        .from('daftar_ulang_submissions')
        .update({
          ...data,
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
          ...data
        })
        .select()
        .single()
    }

    if (result.error) {
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

  if (!data.ujian_halaqah_id && !data.is_tashih_umum) {
    return { success: false, error: 'Pilih kelas ujian.' }
  }

  // If not using tashih umum, validate tashih halaqah
  if (!data.is_tashih_umum && !data.tashih_halaqah_id) {
    return { success: false, error: 'Pilih kelas tashih.' }
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
  if (!data.akad_url) {
    return { success: false, error: 'Upload akad daftar ulang terlebih dahulu.' }
  }

  try {
    // Check for existing submission
    const { data: existing } = await supabase
      .from('daftar_ulang_submissions')
      .select('id, status')
      .eq('user_id', authUser.id)
      .eq('registration_id', registrationId)
      .maybeSingle()

    const submissionData = {
      user_id: authUser.id,
      registration_id: registrationId,
      batch_id: registration.batch_id,

      // Confirmed data
      confirmed_full_name: data.confirmed_full_name || registration.full_name,
      confirmed_chosen_juz: data.confirmed_chosen_juz || registration.chosen_juz,
      confirmed_main_time_slot: data.confirmed_main_time_slot || registration.main_time_slot,
      confirmed_backup_time_slot: data.confirmed_backup_time_slot || registration.backup_time_slot,
      confirmed_wa_phone: data.confirmed_wa_phone || registration.wa_phone,
      confirmed_address: data.confirmed_address || registration.address,

      // Partner selection
      partner_type: data.partner_type,
      partner_user_id: data.partner_user_id,
      partner_name: data.partner_name,
      partner_relationship: data.partner_relationship,
      partner_wa_phone: data.partner_wa_phone,
      partner_notes: data.partner_notes,

      // Halaqah selection
      ujian_halaqah_id: data.ujian_halaqah_id,
      tashih_halaqah_id: data.tashih_halaqah_id,
      is_tashih_umum: data.is_tashih_umum || false,

      // Akad
      akad_url: data.akad_url,
      akad_file_name: data.akad_file_name,
      akad_submitted_at: new Date().toISOString(),

      // Status
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
      return { success: false, error: result.error.message }
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
    const filePath = `daftar-ulang/${fileName}`

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
          error: 'Bucket storage "documents" belum dibuat. Silakan hubungi admin untuk membuat bucket di Supabase Storage.'
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
        error: 'Bucket storage "documents" belum tersedia. Silakan hubungi admin.'
      }
    }

    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan saat upload file'
    }
  }
}
