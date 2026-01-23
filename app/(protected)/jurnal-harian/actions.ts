'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface JurnalFormData {
  tanggal_setor: string
  juz_code?: string | null
  blok: string // Single blok for jurnal (stored as array in DB)
  rabth_completed: boolean
  murajaah_completed: boolean
  simak_murattal_completed: boolean
  tikrar_bi_an_nadzar_completed: boolean
  tasmi_record_completed: boolean
  simak_record_completed: boolean
  tikrar_bi_al_ghaib_type?: string | null
  tikrar_bi_al_ghaib_subtype?: string | null
  tikrar_bi_al_ghaib_20x_multi: string[]
  tarteel_screenshot_url?: string | null
  tafsir_completed: boolean
  menulis_completed: boolean
  catatan_tambahan?: string | null
}

export async function saveJurnalRecord(data: JurnalFormData) {
  const supabase = createClient()

  // 1. Validasi Auth - menggunakan getUser() sesuai arsitektur.md
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (!authUser || authError) {
    console.error('[saveJurnalRecord] Auth error:', authError)
    return { success: false, error: 'Unauthorized. Silakan login kembali.' }
  }

  // Debug log
  console.log('[saveJurnalRecord] User ID:', authUser.id)
  console.log('[saveJurnalRecord] Data:', data)

  try {
    const recordData = {
      user_id: authUser.id, // Menggunakan authUser.id dari server, dijamin sama dengan auth.uid()
      tanggal_jurnal: new Date().toISOString(),
      tanggal_setor: data.tanggal_setor,
      juz_code: data.juz_code || null,
      blok: data.blok ? [data.blok] : [], // Convert single blok to array for DB
      tashih_completed: true,
      rabth_completed: data.rabth_completed,
      murajaah_count: data.murajaah_completed ? 1 : 0,
      simak_murattal_count: data.simak_murattal_completed ? 1 : 0,
      tikrar_bi_an_nadzar_completed: data.tikrar_bi_an_nadzar_completed,
      tasmi_record_count: data.tasmi_record_completed ? 1 : 0,
      simak_record_completed: data.simak_record_completed,
      tikrar_bi_al_ghaib_count: data.tikrar_bi_al_ghaib_type ? 1 : 0,
      tikrar_bi_al_ghaib_type: data.tikrar_bi_al_ghaib_20x_multi.length > 0
        ? data.tikrar_bi_al_ghaib_20x_multi[0]
        : (data.tikrar_bi_al_ghaib_subtype || data.tikrar_bi_al_ghaib_type),
      tikrar_bi_al_ghaib_40x: (data.tikrar_bi_al_ghaib_type && !data.tikrar_bi_al_ghaib_subtype?.endsWith('_20') && data.tikrar_bi_al_ghaib_20x_multi.length === 0)
        ? [data.tikrar_bi_al_ghaib_type]
        : null,
      tikrar_bi_al_ghaib_20x: data.tikrar_bi_al_ghaib_20x_multi.length > 0
        ? data.tikrar_bi_al_ghaib_20x_multi
        : (data.tikrar_bi_al_ghaib_subtype?.endsWith('_20') ? [data.tikrar_bi_al_ghaib_subtype] : null),
      tarteel_screenshot_url: data.tarteel_screenshot_url || null,
      tafsir_completed: data.tafsir_completed,
      menulis_completed: data.menulis_completed,
      catatan_tambahan: data.catatan_tambahan || null
    }

    const { data: result, error: insertError } = await supabase
      .from('jurnal_records')
      .insert(recordData)
      .select()
      .single()

    if (insertError) {
      console.error('[saveJurnalRecord] Insert error:', insertError)
      return { success: false, error: insertError.message }
    }

    // Revalidate paths
    revalidatePath('/jurnal-harian')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: result,
      message: 'Jurnal berhasil disimpan!'
    }
  } catch (error: any) {
    console.error('[saveJurnalRecord] Error:', error)
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan tidak terduga'
    }
  }
}
