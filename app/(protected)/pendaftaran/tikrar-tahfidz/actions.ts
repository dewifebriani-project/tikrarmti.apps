'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/navigation'

export async function submitTikrarRegistration(formData: any, userProfile: any, user: any, batch: any, isEditMode: boolean, existingRegistrationId?: string) {
  const supabase = createClient()

  // 1. Validasi Auth (Server-side check)
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (!authUser || authError) {
    return { success: false, error: 'Unauthorized. Silakan login kembali.' }
  }

  // 2. Fetch program associated with this batch
  let program = null
  let programError = null

  // First attempt: Try to find 'open' program
  const { data: openProgram, error: openError } = await supabase
    .from('programs')
    .select('id')
    .eq('batch_id', batch.id)
    .eq('status', 'open')
    .maybeSingle()

  if (openProgram) {
    program = openProgram
  } else {
    // Second attempt: Find any program for this batch (fallback)
    const { data: anyProgram, error: anyError } = await supabase
      .from('programs')
      .select('id')
      .eq('batch_id', batch.id)
      .maybeSingle()

    if (anyProgram) {
      program = anyProgram
    } else {
      programError = anyError || openError
    }
  }

  // TEMPORARY WORKAROUND: If program fetch fails, try to fetch ANY program from database
  if (programError || !program) {
    // Try to fetch any available program as last resort
    const { data: fallbackProgram } = await supabase
      .from('programs')
      .select('id, batch_id, name, status')
      .limit(1)
      .maybeSingle()

    if (fallbackProgram) {
      program = fallbackProgram
    } else {
      return { success: false, error: 'Program untuk batch ini belum tersedia. Silakan hubungi admin.' }
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

  // Prepare submission data - matching pendaftaran_tikrar_tahfidz table schema
  const isJanda = formData.has_permission === 'janda'

  const submitData = {
    user_id: authUser.id,
    batch_id: batch.id,
    program_id: program.id,
    batch_name: batch.name || 'Batch 2',
    // User data from users table
    full_name: userProfile?.full_name || authUser.user_metadata?.full_name || authUser.email || '',
    email: authUser.email || '',
    wa_phone: userProfile?.whatsapp || '',
    telegram_phone: userProfile?.telegram || '',
    address: userProfile?.alamat || '',
    birth_date: birthDateValue,
    age: age,
    domicile: userProfile?.kota || '',
    timezone: userProfile?.zona_waktu || 'WIB',
    // Form data - Section 1
    understands_commitment: formData.understands_commitment,
    tried_simulation: formData.tried_simulation,
    no_negotiation: formData.no_negotiation,
    has_telegram: formData.has_telegram,
    saved_contact: formData.saved_contact,
    // Section 2
    has_permission: formData.has_permission,
    permission_name: isJanda ? '' : formData.permission_name,
    permission_phone: isJanda ? '' : formData.permission_phone,
    chosen_juz: formData.chosen_juz,
    no_travel_plans: formData.no_travel_plans,
    motivation: formData.motivation,
    ready_for_team: formData.ready_for_team,
    // Section 3
    main_time_slot: formData.main_time_slot,
    backup_time_slot: formData.backup_time_slot,
    time_commitment: formData.time_commitment,
    // Section 4
    understands_program: formData.understands_program,
    questions: formData.questions || null,
    // Status fields
    status: 'pending',
    selection_status: 'pending',
    submission_date: new Date().toISOString(),
  }

  try {
    let result

    if (isEditMode && existingRegistrationId) {
      // Update existing registration
      result = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .update(submitData)
        .eq('id', existingRegistrationId)
        .eq('user_id', authUser.id)

      if (result.error) {
        return { success: false, error: `Gagal memperbarui data pendaftaran: ${result.error.message}` }
      }

      // Revalidate paths
      revalidatePath('/dashboard')
      revalidatePath('/pendaftaran')
      revalidatePath('/pendaftaran/tikrar-tahfidz')

      return {
        success: true,
        message: 'Alhamdulillah! Data pendaftaran berhasil diperbarui!',
        status: 'success_update'
      }
    } else {
      // Create new registration
      result = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .insert(submitData)

      if (result.error) {
        return { success: false, error: `Gagal mengirim pendaftaran: ${result.error.message}` }
      }

      // Revalidate paths
      revalidatePath('/dashboard')
      revalidatePath('/pendaftaran')
      revalidatePath('/pendaftaran/tikrar-tahfidz')

      return {
        success: true,
        message: 'Alhamdulillah! Pendaftaran Tikrar Tahfidz berhasil dikirim!',
        status: 'success'
      }
    }
  } catch (error: any) {
    console.error('Submit tikrar registration error:', error)
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan tidak terduga'
    }
  }
}
