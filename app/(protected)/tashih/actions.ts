'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface TashihFormData {
  blok: string
  lokasi: string
  lokasi_detail?: string | null
  ustadzah_id?: string | null
  nama_pemeriksa?: string | null
  jumlah_kesalahan_tajwid: number
  masalah_tajwid: string[]
  catatan_tambahan?: string | null
  waktu_tashih: string
}

export async function saveTashihRecord(data: TashihFormData) {
  const supabase = createClient()

  // 1. Validasi Auth - menggunakan getUser() sesuai arsitektur.md
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (!authUser || authError) {
    console.error('[saveTashihRecord] Auth error:', authError)
    return { success: false, error: 'Unauthorized. Silakan login kembali.' }
  }

  // Debug log
  console.log('[saveTashihRecord] User ID:', authUser.id)
  console.log('[saveTashihRecord] Data:', data)

  try {
    const recordData = {
      user_id: authUser.id, // Menggunakan authUser.id dari server, dijamin sama dengan auth.uid()
      blok: data.blok,
      lokasi: data.lokasi,
      lokasi_detail: data.lokasi_detail || null,
      ustadzah_id: data.ustadzah_id || null,
      nama_pemeriksa: data.nama_pemeriksa || null,
      jumlah_kesalahan_tajwid: data.jumlah_kesalahan_tajwid,
      masalah_tajwid: data.masalah_tajwid,
      catatan_tambahan: data.catatan_tambahan || null,
      waktu_tashih: data.waktu_tashih
    }

    const { data: result, error: insertError } = await supabase
      .from('tashih_records')
      .insert(recordData)
      .select()
      .single()

    if (insertError) {
      console.error('[saveTashihRecord] Insert error:', insertError)
      return { success: false, error: insertError.message }
    }

    // Revalidate paths
    revalidatePath('/tashih')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: result,
      message: 'Tashih berhasil disimpan!'
    }
  } catch (error: any) {
    console.error('[saveTashihRecord] Error:', error)
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan tidak terduga'
    }
  }
}
