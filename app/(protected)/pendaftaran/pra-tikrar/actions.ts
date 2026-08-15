'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitPraTikrarRegistration(formData: any, userProfile: any, user: any, batch: any, isEditMode: boolean, existingRegistrationId?: string) {
  const supabase = createClient()

  // 1. Validasi Auth (Server-side check)
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (!authUser || authError) {
    return { success: false, error: 'Unauthorized. Silakan login kembali.' }
  }

  // 2. Fetch program associated with this batch
  let program = null
  let programError = null

  // First attempt: Try to find 'open' program with class_type 'pra_tahfidz'
  const { data: openProgram, error: openError } = await supabase
    .from('programs')
    .select('id')
    .eq('batch_id', batch.id)
    .eq('class_type', 'pra_tahfidz')
    .eq('status', 'open')
    .maybeSingle()

  if (openProgram) {
    program = openProgram
  } else {
    // Second attempt: Find any program for this batch
    const { data: anyProgram, error: anyError } = await supabase
      .from('programs')
      .select('id')
      .eq('batch_id', batch.id)
      .eq('class_type', 'pra_tahfidz')
      .maybeSingle()

    if (anyProgram) {
      program = anyProgram
    } else {
      programError = anyError || openError
    }
  }

  // Calculate age from birth_date
  const birthDateValue = userProfile?.tanggal_lahir || new Date().toISOString()
  const birthDate = new Date(birthDateValue)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  const isJanda = formData.has_permission === 'janda'

  const submitData = {
    user_id: authUser.id,
    batch_id: batch.id,
    program_id: program?.id || null, // Allow null if program not found
    batch_name: batch.name || '...',
    full_name: userProfile?.full_name || authUser.user_metadata?.full_name || authUser.email || '',
    email: authUser.email || '',
    wa_phone: userProfile?.whatsapp || '',
    telegram_phone: userProfile?.telegram || '',
    address: userProfile?.alamat || '',
    birth_date: birthDateValue,
    age: age,
    domicile: userProfile?.kota || '',
    timezone: userProfile?.zona_waktu || 'WIB',
    
    // For Pra-Tikrar
    understands_commitment: formData.understands_commitment,
    has_permission: formData.has_permission,
    permission_name: isJanda ? '' : formData.permission_name,
    permission_phone: isJanda ? '' : formData.permission_phone,
    chosen_juz: '30', // Forced to Juz 30
    motivation: formData.motivation,
    questions: formData.questions || null,
    
    // For Pra-Tikrar, selection_status is set to 'pending' to wait for Test Lisan.
    // They skip test tertulis.
    ...(isEditMode ? {} : {
      status: 'pending',
      selection_status: 'pending',
      submission_date: new Date().toISOString(),
    })
  }

  try {
    let result

    if (isEditMode && existingRegistrationId) {
      result = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .update(submitData)
        .eq('id', existingRegistrationId)
        .eq('user_id', authUser.id)

      if (result.error) {
        return { success: false, error: `Gagal memperbarui data pendaftaran: ${result.error.message}` }
      }

      revalidatePath('/dashboard')
      revalidatePath('/pendaftaran')
      revalidatePath('/pendaftaran/pra-tikrar')

      return {
        success: true,
        message: 'Alhamdulillah! Data pendaftaran Pra-Tikrar berhasil diperbarui!',
        status: 'success_update'
      }
    } else {
      result = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .insert(submitData)

      if (result.error) {
        return { success: false, error: `Gagal mengirim pendaftaran: ${result.error.message}` }
      }

      revalidatePath('/dashboard')
      revalidatePath('/pendaftaran')
      revalidatePath('/pendaftaran/pra-tikrar')

      return {
        success: true,
        message: 'Alhamdulillah! Pendaftaran Pra-Tikrar berhasil dikirim!',
        status: 'success'
      }
    }
  } catch (error: any) {
    console.error('Submit pra-tikrar registration error:', error)
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan tidak terduga'
    }
  }
}
