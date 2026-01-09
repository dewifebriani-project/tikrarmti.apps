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
  content.push('           MARKAZ TIKRAR INDONESIA (MTI)')
  content.push('================================================')
  content.push('')
  content.push('Bismillahirrahmanirrahim')
  content.push('')

  // Pernyataan akad
  content.push('PERNYATAAN AKAD')
  content.push('')
  content.push(`Saya yang bertanda tangan di bawah ini:`)
  content.push(`Nama: ${fullName}`)
  content.push('')

  // Komitmen belajar
  content.push('dengan ini menyatakan bersedia dan berkomitmen untuk mengikuti')
  content.push(`program Tikrar Tahfidz ${batchName} dengan target hafalan`)
  content.push(`${chosenJuz}.`)
  content.push('')

  // Poin-poin akad
  content.push('================================================')
  content.push('                   KOMITMEN PROGRAM')
  content.push('================================================')
  content.push('')

  content.push('1. DURASI & TARGET PROGRAM')
  content.push('   - Durasi program: 13 pekan')
  content.push('   - Target hafalan: 1 halaman per pekan (1/2 juz)')
  content.push('   - Libur Lebaran: 2 pekan')
  content.push('   - Waktu komitmen: minimal 2 jam per hari')
  content.push('')

  content.push('2. KEWAJIBAN MINGGUAN')
  content.push('   - Tashih: 1 kali sepekan (jadwal menyesuaikan)')
  content.push('   - Ujian: 1 kali sepekan (jadwal menyesuaikan)')
  content.push('   - Mendengarkan/membaca tafsir 1 halaman hafalan')
  content.push('   - Menulis tangan 1 halaman yang dihafalkan')
  content.push('')

  content.push('3. KEWAJIBAN HARIAN SAAT ZIYADAH (4 hari per pekan)')
  content.push('   - Mendengarkan murottal 1/4 halaman minimal 3 kali')
  content.push('   - Membaca 1/4 halaman sebanyak 40 kali')
  content.push('   - Merekam hafalan 1/4 halaman 3 kali berturut-turut')
  content.push('   - Jika ada kesalahan, mengulang sampai sempurna')
  content.push('')

  content.push('4. SETORAN KEPADA PASANGAN')
  content.push('   - Menyetorkan hafalan 1/4 halaman sebanyak 40 kali')
  content.push('   - Menyimak hafalan pasangan sebanyak 40 kali')
  content.push('   - Mengutamakan setoran langsung, jika tidak memungkinkan:')
  content.push('     * 20 kali via WA Call + 20 kali via Voice Note')
  content.push('')

  content.push('5. RABTH & PENGUATAN HAFALAN')
  content.push('   - Jika sudah menambah hafalan, wajib menyetorkan')
  content.push('     10 blok hafalan sebelumnya (10 hari terakhir)')
  content.push('   - Menyetorkan hafalan ziyadah hari sebelumnya 5 kali')
  content.push('')

  content.push('6. PERLENGKAPAN WAJIB')
  content.push('   - Al-Qur\'an Tikrar')
  content.push('   - Counter manual (alat penghitung)')
  content.push('   - Aplikasi Telegram untuk komunikasi')
  content.push('')

  content.push('================================================')
  content.push('              KETENTUAN & SANKSI')
  content.push('================================================')
  content.push('')

  content.push('1. KETENTUAN METODE TIKRAR')
  content.push('   - Jumlah tikrar 40 kali TIDAK DAPAT dikurangi atau')
  content.push('     dinego-siaapun alasannya')
  content.push('   - Ini adalah inti dari program MTI')
  content.push('')

  content.push('2. PERINGATAN PENTING')
  content.push('   - MTI TIDAK MERIDHOI jika saya keluar dari program tanpa')
  content.push('     udzur syar\'i')
  content.push('   - Alasan seperti "sibuk", "ada kerjaan", "ikut kelas lain"')
  content.push('     TIDAK DITERIMA')
  content.push('')

  content.push('3. ALASAN YANG DITERIMA UNTUK MUNDUR:')
  content.push('   a. Qadarullah, sakit (diri sendiri/orang tua/mertua/suami/anak)')
  content.push('      butuh perawatan intensif')
  content.push('   b. Qadarullah, hamil muda dengan ngidam/mual berat')
  content.push('   c. Qadarullah, terjadi bencana alam')
  content.push('   d. Udzur darurat lain yang dapat dimaklumi')
  content.push('')

  content.push('4. SANKSI')
  content.push('   - Blacklist PERMANEN bagi yang mundur tanpa udzur syar\'i')
  content.push('   - Demi menjaga hak pasangan setoran dan stabilitas MTI')
  content.push('')

  content.push('================================================')
  content.push('                KOMITMEN TAMBAHAN')
  content.push('================================================')
  content.push('')

  content.push('1. KOMITMEN ADAB & ETIKA')
  content.push('   - Menjaga adab kepada seluruh tim Tikrar MTI')
  content.push('   - Menjaga adab kepada pasangan setoran')
  content.push('   - Tidak banyak mengeluh dan mementingkan diri sendiri')
  content.push('   - Keputusan kelulusan bersifat final dan tidak dapat')
  content.push('     diganggu gugat')
  content.push('')

  content.push('2. KOMITMEN WAKTU')
  content.push('   - Memilih jadwal utama dan cadangan dengan pertimbangan matang')
  content.push('   - Menjaga komitmen waktu terhadap pasangan setoran')
  content.push('   - Tidak mendzolimi waktu pasangan dengan alasan tidak urgen')
  content.push('')

  content.push('3. KOMITMEN KEIKHLASAN')
  content.push('   - Program ini gratis dan masih dalam pengembangan')
  content.push('   - Tidak menuntut profesionalisme berlebih')
  content.push('   - MTI adalah keluarga, saling melengkapi kekurangan')
  content.push('   - No Baper, No Drama')
  content.push('')

  content.push('4. KOMITMEN KEDEPANAN')
  content.push(`   - Bersedia menjadi tim MTI (muallimah/musyrifah) jika layak`)
  content.push('   - Atau sebagai donatur untuk mendukung program MTI')
  content.push('')

  // Pernyataan kesanggupan
  content.push('================================================')
  content.push('              PERNYATAAN KESANGGUPAN')
  content.push('================================================')
  content.push('')
  content.push('Saya menyatakan dengan sesungguhnya bahwa saya:')
  content.push('')
  content.push('1. Sudah mencoba simulasi membaca Surah An-Naba ayat 1-11')
  content.push('   sebanyak 40 kali')
  content.push(`2. Memahami target hafalan ${chosenJuz} dengan metode Tikrar`)
  content.push('3. Memiliki izin dari suami/orang tua/wali yang bertanggung jawab')
  content.push('4. Tidak ada rencana safar di luar jadwal libur MTI')
  content.push('5. Bersedia melaksanakan semua kewajiban di atas')
  content.push('6. Memahami dan menerima semua sanksi jika melanggar')
  content.push('')

  // Penutup
  content.push('================================================')
  content.push('Demikian akad ini saya buat dengan kesadaran penuh,')
  content.push('ikhlas, dan bersungguh-sungguh untuk dipatuhi.')
  content.push('')
  content.push('Semoga Allah SWT memudahkan urusan saya dalam')
  content.push('menghafal dan memakmurkan Al-Qur\'an.')
  content.push('')
  content.push('Wassalamu\'alaikum warahmatullahi wabarakatuh')
  content.push('')
  content.push(`                              ${fullName}`)
  content.push('                              Tanggal: _____________')
  content.push('                              Tanda tangan: _____________')
  content.push('')
  content.push('================================================')
  content.push('             WALLAHU AL-MUSTA\'AN WALA ILAHA ILLALLAH')
  content.push('================================================')

  return {
    title: `Akad Daftar Ulang - ${batchName}`,
    content,
    fullText: content.join('\n')
  }
}
