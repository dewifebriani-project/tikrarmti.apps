import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/daftar-ulang/akad-intisari
 *
 * Get akad data (intisari akad) from pendaftaran_tikrar_tahfidz registration
 * This is used to display the akad text that thalibah needs to copy and sign
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check - user must be logged in
    const supabase = createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 })
    }

    // Get user's registration data
    const supabaseAdmin = createSupabaseAdmin()
    const { data: registration, error: registrationError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .eq('user_id', user.id)
      .eq('selection_status', 'selected')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (registrationError || !registration) {
      return NextResponse.json({
        error: 'No registration found. Please complete selection process first.'
      }, { status: 404 })
    }

    // Build akad intisari from registration data
    const akadIntisari = buildAkadIntisari(registration)

    return NextResponse.json({
      success: true,
      data: akadIntisari
    })

  } catch (error) {
    console.error('[AkadIntisari] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Build akad intisari text from registration data
 */
function buildAkadIntisari(registration: any): {
  title: string
  content: string[]
  fullText: string
} {
  const fullName = registration.full_name || '________________'
  const chosenJuz = registration.chosen_juz || '________________'
  const batchName = registration.batches?.name || '________________'

  // Build akad content sections
  const content: string[] = []

  // Header
  content.push('================================================')
  content.push('           AKAD DAFTAR ULANG TIKRAR TAHFIDZ')
  content.push('================================================')
  content.push('')

  // Pernyataan akad
  content.push('PERNYATAAN AKAD')
  content.push('')
  content.push(`Saya yang bertanda tangan di bawah ini:`)
  content.push(`Nama: ${fullName}`)
  content.push('')

  // Komitmen belajar
  content.push('dengan ini menyatakan komitmen untuk mengikuti program Tikrar')
  content.push(`Tahfidz batch ${batchName} dengan juz target ${chosenJuz}.`)
  content.push('')

  // Poin-poin akad
  content.push('AKAN MELAKUKAN HAL-HAL BERIKUT:')
  content.push('')

  content.push('1. KOMITMEN HAFALAN')
  content.push(`   - Target hafalan: Juz ${chosenJuz}`)
  content.push('   - Melakukan murajaah (pengulangan) hafalan setiap hari')
  content.push('   - Mematuhi jadwal ujian hafalan yang telah ditentukan')
  content.push('   - Menyelesaikan hafalan sesuai target waktu')
  content.push('')

  content.push('2. KOMITMEN KEHADIRAN')
  content.push('   - Hadir pada kelas ujian sesuai jadwal yang dipilih')
  content.push('   - Hadir pada kelas tashih sesuai jadwal yang dipilih')
  content.push('   - Memberitahu admin jika berhalangan untuk hadir')
  content.push('   - Mengganti jadwal yang tidak dapat dihadiri dengan admin')
  content.push('')

  content.push('3. KOMITMEN ADAB')
  content.push('   - Menjaga adab belajar dan mengajar kepada muallimah')
  content.push('   - Menghormati muallimah dan teman-teman belajar')
  content.push('   - Menjaga kebersihan dan suci dalam belajar')
  content.push('')

  content.push('4. KOMITMEN PEMBAYARAN')
  content.push('   - Melunasi biaya program tepat waktu')
  content.push('   - Biaya yang telah dibayarkan tidak dapat ditarik kembali')
  content.push('')

  content.push('5. KOMITMEN PENYELESAIAN')
  content.push('   - Menyelesaikan program hingga selesai')
  content.push('   - Tidak berhenti di tengah program tanpa alasan yang syar\'i')
  content.push('   - Memberitahu admin jika ada kendala yang menghalangi')
  content.push('')

  // Pernyataan kesanggupan
  content.push('PERNYATAAN KESANGGUPAN')
  content.push('')
  content.push('Saya menyatakan dengan sesungguhnya bahwa saya:')
  content.push('1. Dapat membaca Al-Qur\'an dengan tartil yang baik')
  content.push(`2. Sudah hafal atau akan menghafal Juz ${chosenJuz}`)
  content.push('3. Bersedia melaksanakan semua kewajiban di atas')
  content.push('4. Dapat mematuhi semua aturan dan ketentuan yang berlaku')
  content.push('')

  // Penutup
  content.push('================================================')
  content.push('Demikian akad ini saya buat dengan kesadaran dan penuh')
  content.push('kesungguhan untuk dipatuhi. Semoga Allah SWT memudahkan')
  content.push('urusan saya dalam menghafal Al-Qur\'an.')
  content.push('')
  content.push(`                              ${fullName}`)
  content.push('                              Tanggal: _____________')
  content.push('================================================')

  return {
    title: `Akad Daftar Ulang - ${batchName}`,
    content,
    fullText: content.join('\n')
  }
}
