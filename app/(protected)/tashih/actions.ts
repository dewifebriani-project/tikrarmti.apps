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

  // 2. Validasi Pendaftaran dan Daftar Ulang
  const { data: registrations } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('status, chosen_juz, daftar_ulang:daftar_ulang_submissions(status, confirmed_chosen_juz)')
    .eq('user_id', authUser.id)
    .in('status', ['approved', 'selected'])
    .limit(1)

  const reg = registrations?.[0]
  
  if (!reg) {
    return { 
      success: false, 
      error: 'Afwan Ukhti, akun ini belum terdaftar untuk batch aktif. Tashih hanya bisa diisi oleh thalibah yang terdaftar resmi.' 
    }
  }

  // Check if daftar ulang is approved
  const isDaftarUlangApproved = Array.isArray(reg.daftar_ulang) 
    ? reg.daftar_ulang.some((du: any) => du.status === 'approved')
    : reg.daftar_ulang?.status === 'approved'

  if (reg.status !== 'approved' && !isDaftarUlangApproved) {
    return { 
      success: false, 
      error: 'Afwan Ukhti, Daftar Ulang Anda belum disetujui. Catatan Tashih baru dapat diakses setelah pendaftaran ulang disetujui oleh admin.' 
    }
  }

  try {
    let finalUstadzahId = data.ustadzah_id === 'manual' ? null : (data.ustadzah_id || null)
    let finalNamaPemeriksa = data.nama_pemeriksa || null

    if (finalUstadzahId) {
      // Find muallimah_registrations.id because tashih_records_ustadzah_id_fkey points to it
      const { data: reg } = await supabase
        .from('muallimah_registrations')
        .select('id')
        .eq('user_id', finalUstadzahId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single()
      
      if (reg && reg.id) {
        finalUstadzahId = reg.id
      } else {
        // Fallback to manual mode if no registration record found
        finalUstadzahId = null
      }
    }

    const recordData = {
      user_id: authUser.id, // Menggunakan authUser.id dari server, dijamin sama dengan auth.uid()
      blok: data.blok,
      lokasi: data.lokasi,
      lokasi_detail: data.lokasi_detail || null,
      ustadzah_id: finalUstadzahId,
      nama_pemeriksa: finalNamaPemeriksa,
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
