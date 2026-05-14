'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitMuallimahRegistration(formData: any, userData: any, user: any, batchId: string) {
  const supabase = createClient()

  // 1. Auth Check
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (!authUser || authError) {
    return { success: false, error: 'Unauthorized. Silakan login kembali.' }
  }

  if (!batchId) {
    return { success: false, error: 'Batch ID tidak ditemukan' }
  }

  try {
    // 2. Prepare Data
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
      : null

    // 3. Step 1: Upsert Profile (muallimah_registrations)
    // We treat this table as the permanent profile
    const profileData: any = {
      user_id: authUser.id,
      full_name: userData?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
      email: authUser.email || '',
      whatsapp: userData?.whatsapp || '',
      occupation: userData?.pekerjaan || '',
      tajweed_institution: formData.tajweed_institution || null,
      quran_institution: formData.quran_institution || null,
      teaching_communities: formData.teaching_communities || null,
      memorized_tajweed_matan: formData.memorized_tajweed_matan || null,
      studied_matan_exegesis: formData.studied_matan_exegesis || null,
      memorization_level: formData.memorization_level || null,
      memorized_juz: Array.isArray(formData.memorized_juz) ? formData.memorized_juz.join(', ') : null,
      examined_juz: Array.isArray(formData.examined_juz) ? formData.examined_juz.join(', ') : null,
      certified_juz: Array.isArray(formData.certified_juz) ? formData.certified_juz.join(', ') : null,
      age: formData.age || null,
    }

    // Note: Legacy columns like birth_date, birth_place, address are now nullable 
    // to avoid issues if they are not provided in this specific form.

    const { error: profileError } = await supabase
      .from('muallimah_registrations')
      .upsert(profileData, { onConflict: 'user_id' })

    if (profileError) {
      console.error('Profile upsert error detail:', profileError)
      return { success: false, error: `Gagal menyimpan profil: ${profileError.message}` }
    }

    // 4. Step 2: Upsert Akad (muallimah_akads)
    const akadData = {
      user_id: authUser.id,
      batch_id: batchId,
      preferred_juz: Array.isArray(formData.preferred_juz) ? formData.preferred_juz.join(', ') : null,
      class_type: formData.class_type || 'tashih_ujian',
      preferred_max_thalibah: formData.preferred_max_thalibah || 10,
      preferred_schedule: JSON.stringify(schedule1Formatted),
      backup_schedule: schedule2Formatted ? JSON.stringify(schedule2Formatted) : null,
      understands_commitment: formData.understands_commitment === true,
      status: 'pending',
      akad_signed_at: new Date().toISOString(),
    }

    const { error: akadError } = await supabase
      .from('muallimah_akads')
      .upsert(akadData, { onConflict: 'user_id,batch_id' })

    if (akadError) {
      console.error('Akad upsert error detail:', akadError)
      return { success: false, error: `Gagal menyimpan akad: ${akadError.message}` }
    }

    // 5. Cleanup & Revalidate
    revalidatePath('/dashboard')
    revalidatePath('/pendaftaran/muallimah')
    revalidatePath('/admin')

    return {
      success: true,
      message: 'Alhamdulillah! Pendaftaran dan Akad berhasil disimpan!'
    }

  } catch (error: any) {
    console.error('Submit muallimah unexpected error:', error)
    return { success: false, error: error?.message || 'Terjadi kesalahan tidak terduga' }
  }
}

export async function getMuallimahRegistration(userId: string, batchId: string) {
  const supabase = createClient()

  // For backward compatibility, but we should use separate calls in the UI
  const { data, error } = await supabase
    .from('muallimah_akads')
    .select('*, profile:muallimah_registrations(*)')
    .eq('user_id', userId)
    .eq('batch_id', batchId)
    .maybeSingle()

  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data, error: null }
}
