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
  // Use final_juz if available (adjusted placement), otherwise use chosen_juz
  const finalJuz = registration.final_juz || registration.chosen_juz || '________________'
  const batchName = registration.batches?.name || '________________'

  // Build akad content sections
  const content: string[] = []

  // Header
  content.push('AKAD PESERTA PROGRAM TIKRAR TAHFIDZ - MARKAZ TIKRAR INDONESIA (MTI)')
  content.push('')
  content.push('Bismillahirrahmanirrahim')
  content.push('')
  content.push('Yang bertanda tangan di bawah ini:')
  content.push(`Nama: ${fullName}`)
  content.push(`Program: Tikrar Tahfidz (Target Hafalan: Juz ${finalJuz})`)
  content.push('Tanggal: [Diisi Tanggal]')
  content.push('')
  content.push('')
  content.push('Dengan memohon taufik dan riḍā Allah Subḥānahu wa Ta\'ālā, dengan ini saya')
  content.push('menyatakan kesediaan dan mengikat diri dalam akad untuk menjalankan program')
  content.push('sesuai dengan ketentuan berikut:')
  content.push('')
  content.push('')

  // PASAL 1: KURIKULUM WAJIB
  content.push('PASAL 1: KURIKULUM WAJIB (7 TAHAPAN HARIAN)')
  content.push('')
  content.push('Saya berakad untuk menjalankan 7 Tahapan Pembelajaran Terstruktur secara disiplin')
  content.push('dan berurutan demi menghasilkan hafalan yang mutqin:')
  content.push('')
  content.push('Tahap 1: Rabṭ (Menyambung Hafalan)')
  content.push('Melakukan pemanasan sebelum menghafal baru dengan menyambungkan 10 blok hafalan')
  content.push('terakhir sebanyak 1 kali tanpa melihat mushaf (untuk mengikat hafalan lama).')
  content.push('')
  content.push('Tahap 2: Murāja\'ah Blok Terakhir')
  content.push('Mengulangi hafalan blok kemarin sebanyak 5 kali tanpa melihat mushaf (untuk')
  content.push('memantapkan hafalan sebelum menambah materi baru).')
  content.push('')
  content.push('Tahap 3: Simak Murattal')
  content.push('Mendengarkan bacaan murattal (dari qāri\' terpercaya) untuk blok hafalan hari ini')
  content.push('sebanyak 5 kali (guna membiasakan lisan dengan irama, makhraj, dan tajwīd).')
  content.push('')
  content.push('Tahap 4: Tikrār Bi An-Naẓar (Melihat Mushaf)')
  content.push('Membaca blok hafalan hari ini sebanyak 40 kali sambil melihat mushaf dengan saksama')
  content.push('(fokus pada huruf, harakat, dan tata letak ayat).')
  content.push('')
  content.push('Tahap 5: Tasmī\' via Rekaman')
  content.push('Merekam bacaan sendiri tanpa melihat mushaf hingga mendapatkan 3 rekaman yang lancar')
  content.push('tanpa kesalahan sedikitpun (sebagai uji kejujuran dan kepercayaan diri).')
  content.push('')
  content.push('Tahap 6: Simak Rekaman Pribadi')
  content.push('Mendengarkan kembali rekaman terbaik diri sendiri sambil menyimak dengan mushaf')
  content.push('(sebagai quality control pribadi untuk menemukan kesalahan yang luput).')
  content.push('')
  content.push('Tahap 7: Tikrār Bil Ghaib (Tanpa Mushaf)')
  content.push('Menyetorkan hafalan blok hari ini kepada pasangan (sesuai metode yang dipilih di')
  content.push('Pasal 3) sebanyak 40 kali tanpa melihat mushaf (tahap final penguncian hafalan).')
  content.push('')
  content.push('')

  // PASAL 2: KURIKULUM TAMBAHAN
  content.push('PASAL 2: KURIKULUM TAMBAHAN (OPSIONAL)')
  content.push('')
  content.push('Saya memahami bahwa terdapat tahapan tambahan yang bersifat opsional namun sangat')
  content.push('dianjurkan untuk memperkuat hafalan:')
  content.push('')
  content.push('Membaca Tafsir: Membaca tafsir ringkas untuk memahami konteks ayat agar hafalan')
  content.push('lebih meresap.')
  content.push('')
  content.push('Menulis Ayat: Menulis kembali blok ayat yang dihafal untuk menguatkan memori motorik')
  content.push('dan visual.')
  content.push('')
  content.push('')

  // PASAL 3: MEKANISME PASANGAN
  content.push('PASAL 3: MEKANISME PASANGAN')
  content.push('')
  content.push('Untuk memenuhi kewajiban Tahap 7 (Tikrār Bil Ghaib), saya memilih dan berkomitmen')
  content.push('pada salah satu metode berikut:')
  content.push('')
  content.push('Opsi A - Pasangan Tikrar: Menyetorkan 40 kali kepada pasangan dan menyimak balik')
  content.push('pasangan 40 kali (prioritas tatap muka/call).')
  content.push('')
  content.push('Opsi B - Keluarga (Maḥram): Menyetorkan kepada Ayah, Ibu, Suami, Anak, atau Saudara')
  content.push('Kandung (bertindak sebagai pasangan).')
  content.push('')
  content.push('Opsi C - Aplikasi Tarteel: Melakukan setoran mandiri menggunakan fitur deteksi hafalan')
  content.push('di aplikasi Tarteel (bertindak sebagai pasangan) dengan melampirkan bukti screenshot.')
  content.push('')
  content.push('')

  // PASAL 4: KETENTUAN WAKTU & LAPORAN
  content.push('PASAL 4: KETENTUAN WAKTU & LAPORAN')
  content.push('')
  content.push('Alokasi Waktu: Menyediakan waktu khusus minimal 2 jam per hari untuk menyelesaikan')
  content.push('seluruh tahapan.')
  content.push('')
  content.push('Jadwal Laporan: Wajib melaporkan penyelesaian tugas harian setiap hari Senin sampai')
  content.push('Kamis.')
  content.push('')
  content.push('Dispensasi Laporan: Jika terdapat użur (halangan), penyelesaian dan pelaporan')
  content.push('tugas dapat ditunda paling lambat hingga hari Ahad pada pekan tersebut.')
  content.push('')
  content.push('Larangan Safar: Tidak mengagendakan safar (bepergian) di luar jadwal libur MTI.')
  content.push('')
  content.push('')

  // PASAL 5: KONSEKUENSI DAN SANKSI
  content.push('PASAL 5: KONSEKUENSI DAN SANKSI')
  content.push('')
  content.push('Saya memahami dan menerima sanksi berikut jika melanggar ketentuan akad:')
  content.push('')
  content.push('Sanksi Laporan (Administrasi):')
  content.push('Jika sampai hari Ahad laporan pekanan belum tuntas, maka akan diterbitkan SP1 (Surat')
  content.push('Peringatan 1) dan seterusnya.')
  content.push('')
  content.push('Sanksi Kehadiran Kelas (Tashīḥ):')
  content.push('Tidak hadir kelas tashīḥ 1 kali: Dikenakan SP1.')
  content.push('Tidak hadir kelas tashīḥ 3 kali (akumulatif/berturut-turut): Dinyatakan Drop Out (DO)')
  content.push('dari program.')
  content.push('')
  content.push('Sanksi Mundur Tanpa Uzur:')
  content.push('Jika mundur dari program tanpa alasan yang dibenarkan syariat (użur syar\'ī), saya')
  content.push('bersedia menerima sanksi Blacklist Permanen dari MTI.')
  content.push('')
  content.push('')

  // PASAL 6: RENCANA TINDAK LANJUT
  content.push('PASAL 6: RENCANA TINDAK LANJUT')
  content.push('')
  content.push('Sebagai bentuk komitmen jangka panjang, saya bersedia untuk:')
  content.push('Bergabung menjadi tim MTI (mu\'allimah/musyrifah) jika dinyatakan layak; atau')
  content.push('Menjadi donatur untuk mendukung dakwah Al-Qur\'an melalui MTI.')
  content.push('')
  content.push('')
  content.push('Demikian Akad ini saya buat dengan kesadaran penuh untuk dipatuhi dengan')
  content.push('sungguh-sungguh.')
  content.push('')
  content.push('Semoga Allah memudahkan lisan dan hati kita dalam menjaga kalam-Nya.')
  content.push('')
  content.push('Wassalāmu\'alaikum Warahmaṫullāhi Wabarakāṫuh')
  content.push('')
  content.push('[Kota], _______________ 20__')
  content.push('')
  content.push('(Tanda Tangan)')
  content.push(`${fullName}`)

  return {
    title: `Akad Daftar Ulang - ${batchName}`,
    content,
    fullText: content.join('\n')
  }
}
