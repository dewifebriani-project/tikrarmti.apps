'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Zod schema untuk validasi
const MuallimahRegistrationSchema = {
  tajweed_institution: (val: string) => val?.trim() || null,
  quran_institution: (val: string) => val?.trim() || null,
  teaching_communities: (val: string) => val?.trim() || null,
  memorized_tajweed_matan: (val: string) => val?.trim() || null,
  studied_matan_exegesis: (val: string) => val?.trim() || null,
  memorized_juz: (val: string[]) => Array.isArray(val) && val.length > 0 ? val.join(', ') : null,
  examined_juz: (val: string[]) => Array.isArray(val) && val.length > 0 ? val.join(', ') : null,
  certified_juz: (val: string[]) => Array.isArray(val) && val.length > 0 ? val.join(', ') : null,
  preferred_juz: (val: string[]) => Array.isArray(val) && val.length > 0 ? val.join(', ') : null,
  class_type: (val: string) => val || 'tashih_ujian',
  preferred_max_thalibah: (val: number | undefined) => val || null,
  understands_commitment: (val: boolean) => val === true,
  age: (val: number | undefined) => val || null,
}

export async function submitMuallimahRegistration(formData: any, userData: any, user: any, batchId: string) {
  const supabase = createClient()

  // 1. Validasi Auth (Server-side check)
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (!authUser || authError) {
    return { success: false, error: 'Unauthorized. Silakan login kembali.' }
  }

  // 2. Validasi batch
  if (!batchId) {
    return { success: false, error: 'Batch ID tidak ditemukan' }
  }

  try {
    // 3. Format schedule data
    const schedule1Formatted = {
      day: formData.schedule1_day,
      time_start: formData.schedule1_time_start,
      time_end: formData.schedule1_time_end,
    }

    const schedule2Formatted = (formData.schedule2_day && formData.schedule2_time_start && formData.schedule2_time_end)
      ? {
          day: formData.schedule2_day,
          time_start: formData.schedule2_time_start,
          time_end: formData.schedule2_time_end,
        }
      : { day: '', time_start: '', time_end: '' }

    const paidClassInterest = formData.wants_paid_class ? {
      name: formData.paid_class_name || null,
      schedule1: formData.paid_class_schedule1_day ? {
        day: formData.paid_class_schedule1_day,
        time_start: formData.paid_class_schedule1_time_start || '',
        time_end: formData.paid_class_schedule1_time_end || '',
      } : null,
      schedule2: formData.paid_class_schedule2_day ? {
        day: formData.paid_class_schedule2_day,
        time_start: formData.paid_class_schedule2_time_start || '',
        time_end: formData.paid_class_schedule2_time_end || '',
      } : null,
      max_students: formData.paid_class_max_students || null,
      spp_percentage: formData.paid_class_spp_percentage || null,
      additional_info: formData.paid_class_interest || null,
    } : null

    // 4. Check for existing registration
    const { data: existingRecord } = await supabase
      .from('muallimah_registrations')
      .select('id, status')
      .eq('user_id', authUser.id)
      .eq('batch_id', batchId)
      .maybeSingle()

    // 5. Submit data
    const submitData = {
      user_id: authUser.id, // From server-side auth, not from client!
      batch_id: batchId,
      // Data from users table
      full_name: userData?.full_name || authUser.user_metadata?.full_name || authUser.email || '',
      birth_date: userData?.tanggal_lahir || new Date().toISOString(),
      birth_place: userData?.tempat_lahir || '-',
      address: userData?.alamat || '-',
      whatsapp: userData?.whatsapp || '-',
      email: authUser.email || '',
      education: '-',
      occupation: userData?.pekerjaan || '-',
      memorization_level: '-',
      // Form data
      tajweed_institution: MuallimahRegistrationSchema.tajweed_institution(formData.tajweed_institution),
      quran_institution: MuallimahRegistrationSchema.quran_institution(formData.quran_institution),
      teaching_communities: MuallimahRegistrationSchema.teaching_communities(formData.teaching_communities),
      memorized_tajweed_matan: MuallimahRegistrationSchema.memorized_tajweed_matan(formData.memorized_tajweed_matan),
      studied_matan_exegesis: MuallimahRegistrationSchema.studied_matan_exegesis(formData.studied_matan_exegesis),
      memorized_juz: MuallimahRegistrationSchema.memorized_juz(formData.memorized_juz),
      examined_juz: MuallimahRegistrationSchema.examined_juz(formData.examined_juz),
      certified_juz: MuallimahRegistrationSchema.certified_juz(formData.certified_juz),
      preferred_juz: MuallimahRegistrationSchema.preferred_juz(formData.preferred_juz),
      class_type: MuallimahRegistrationSchema.class_type(formData.class_type),
      preferred_max_thalibah: MuallimahRegistrationSchema.preferred_max_thalibah(formData.preferred_max_thalibah),
      teaching_experience: '-',
      teaching_years: null,
      teaching_institutions: null,
      preferred_schedule: JSON.stringify(schedule1Formatted),
      backup_schedule: JSON.stringify(schedule2Formatted),
      timezone: 'WIB',
      paid_class_interest: paidClassInterest ? JSON.stringify(paidClassInterest) : null,
      understands_commitment: MuallimahRegistrationSchema.understands_commitment(formData.understands_commitment),
      age: MuallimahRegistrationSchema.age(formData.age),
      motivation: null,
      special_skills: null,
      health_condition: null,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }

    let result

    if (existingRecord && existingRecord.status === 'draft') {
      // Update existing draft
      result = await supabase
        .from('muallimah_registrations')
        .update(submitData)
        .eq('id', existingRecord.id)
        .eq('user_id', authUser.id)
    } else if (!existingRecord) {
      // Create new registration
      result = await supabase
        .from('muallimah_registrations')
        .insert(submitData)
    } else {
      return { success: false, error: 'Pendaftaran sudah terkirim dan tidak dapat diubah.' }
    }

    if (result.error) {
      console.error('Submit error:', result.error)
      return {
        success: false,
        error: `Gagal ${existingRecord ? 'memperbarui' : 'mengirim'} pendaftaran: ${result.error.message}`
      }
    }

    // Revalidate dashboard path
    revalidatePath('/dashboard')
    revalidatePath('/pendaftaran/muallimah')

    return {
      success: true,
      message: existingRecord
        ? 'Alhamdulillah! Data pendaftaran Muallimah berhasil diperbarui!'
        : 'Alhamdulillah! Pendaftaran sebagai Muallimah berhasil dikirim!'
    }

  } catch (error: any) {
    console.error('Submit muallimah registration error:', error)
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan tidak terduga'
    }
  }
}

export async function getMuallimahRegistration(userId: string, batchId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('muallimah_registrations')
    .select('*')
    .eq('user_id', userId)
    .eq('batch_id', batchId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data, error: null }
}
