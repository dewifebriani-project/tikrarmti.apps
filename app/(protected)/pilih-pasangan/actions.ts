'use server'

import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
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
    return { success: false, error: 'Ukhti belum lolos seleksi.' }
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
    // 4. Reserve quota and save the selection in one database transaction.
    // The RPC locks the selected halaqah rows, so concurrent users cannot take
    // the same final slot.
    const { data: reservationResult, error: reservationError } = await supabase.rpc(
      'reserve_halaqah_and_partner',
      {
        p_registration_id: registrationId,
        p_ujian_halaqah_id: data.ujian_halaqah_id,
        p_tashih_halaqah_id: data.tashih_halaqah_id || data.ujian_halaqah_id,
        p_partner_type: data.partner_type,
        p_partner_user_id: data.partner_user_id || null,
        p_partner_name: data.partner_name || null,
        p_partner_relationship: data.partner_relationship || null,
        p_partner_wa_phone: data.partner_wa_phone || null,
        p_partner_notes: data.partner_notes || null
      }
    )

    if (reservationError) {
      const isRpcUnavailable = reservationError.message.includes('reserve_halaqah_and_partner')
      return {
        success: false,
        error: isRpcUnavailable
          ? 'Sistem reservasi halaqah belum aktif. Silakan hubungi admin.'
          : reservationError.message
      }
    }

    const reservation = reservationResult as {
      success?: boolean
      error?: string
      halaqah_name?: string
    } | null

    if (!reservation?.success) {
      const errorMessages: Record<string, string> = {
        UNAUTHORIZED: 'Sesi Ukhti berakhir. Silakan login kembali.',
        HALAQAH_REQUIRED: 'Pilih paket kelas halaqah.',
        HALAQAH_INVALID: 'Halaqah tidak valid, tidak aktif, atau bukan bagian dari batch ini.',
        REGISTRATION_INVALID: 'Pendaftaran tidak valid.',
        NOT_SELECTED: 'Ukhti belum lolos seleksi.',
        SUBMISSION_NOT_FOUND: 'Data daftar ulang tidak ditemukan. Silakan selesaikan Review Akad terlebih dahulu.',
        PARTNER_TYPE_INVALID: 'Jenis pasangan belajar tidak valid.',
        PARTNER_INVALID: 'Data pasangan belajar tidak valid.'
      }

      const message = reservation?.error === 'HALAQAH_FULL'
        ? `Maaf, kelas "${reservation.halaqah_name || 'yang dipilih'}" sudah penuh. Silakan pilih kelas lain.`
        : errorMessages[reservation?.error || ''] || 'Pilihan halaqah gagal disimpan.'

      return { success: false, error: message }
    }

    const supabaseAdmin = createSupabaseAdmin()

    let isMutualMatch = false
    if (data.partner_type === 'self_match' && data.partner_user_id) {
      const { data: reverseSelection } = await supabaseAdmin
        .from('daftar_ulang_submissions')
        .select('id, status, partner_status')
        .eq('user_id', data.partner_user_id)
        .eq('partner_user_id', authUser.id)
        .eq('batch_id', registration.batch_id)
        .eq('partner_type', 'self_match')
        .maybeSingle()

      isMutualMatch = Boolean(
        reverseSelection &&
        (reverseSelection.partner_status === 'submitted' ||
          reverseSelection.partner_status === 'approved' ||
          reverseSelection.status === 'submitted' ||
          reverseSelection.status === 'approved')
      )
    }

    revalidatePath('/dashboard')
    revalidatePath('/perjalanan-saya')
    revalidatePath('/pilih-pasangan')

    return {
      success: true,
      isMutualMatch,
      message: data.partner_type === 'self_match'
        ? isMutualMatch
          ? `❤️ Kalian sudah saling memilih. Pasangan belajar dengan ${data.partner_name || 'thalibah pilihan Ukhti'} berhasil terbentuk!`
          : `Pilihan pasangan berhasil dikirim. Menunggu ${data.partner_name || 'thalibah pilihan Ukhti'} memilih Ukhti kembali.`
        : 'Halaqah dan pasangan berhasil disimpan.'
    }
  } catch (error: any) {
    console.error('Submit pilih pasangan error:', error)
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan tidak terduga'
    }
  }
}
