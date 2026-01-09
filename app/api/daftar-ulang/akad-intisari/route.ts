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
  const mainTimeSlot = registration.main_time_slot || '________________'
  const backupTimeSlot = registration.backup_time_slot || '________________'
  const batchName = registration.batches?.name || '________________'
  const batchStartDate = registration.batches?.registration_start_date || '...'
  const batchEndDate = registration.batches?.registration_end_date || '...'

  // Build akad content sections
  const content: string[] = []

  // Header
  content.push('AKAD DAFTAR ULANG PROGRAM TIKRAR')
  content.push('MARKAZ TIKRAR INDONESIA')
  content.push('')
  content.push('Bismillahirrahmanirrahim')
  content.push('')
  content.push('Pada hari ini ...... tanggal... saya yang menulis lembar akad ini')
  content.push('dengan tulisan tangan saya dan bertandatangan di bawah ini,')
  content.push('')
  content.push(`Nama: ${fullName}`)
  content.push('Usia: ...')
  content.push('Domisili: ...')
  content.push('')
  content.push('')
  content.push('Dengan sadar tanpa paksaan, menulis akad keikutsertaan pada kelas')
  content.push(`Tahfidz Tikrar MTI ${batchName} Tahun 2026`)
  content.push(`tanggal ${batchStartDate} sampai ${batchEndDate}.`)
  content.push('')
  content.push('')
  content.push('Saya siap memulai kelas Tikrar. Saya berjanji kepada diri saya sendiri dan')
  content.push('guru saya untuk menjadikan ilmu ini sebagai prioritas. Saya berusaha menjaga')
  content.push('kehadiran, bersungguh-sungguh dalam belajar, dan menuntut ilmu ini dengan niat karena')
  content.push('Allah Ta\'ala, demi kebaikan diri dan manfaat untuk orang lain. Saya bersedia menjaga')
  content.push('adab, patuh dan ta\'at pada aturan yang tercantum pada poin-poin yang tersebut di')
  content.push('bawah ini.')
  content.push('')
  content.push('')
  content.push('Bismillah')
  content.push('')
  content.push('Saya berjanji akan selalu memperbaiki niat menghafal karena Allah Ta\'ala.')
  content.push('')
  content.push('Saya berjanji akan menjaga adab kepada para mu\'allimah MTI, Admin MTI,')
  content.push('Musyrifah/Raisah MTI dan pasangan setoran saya.')
  content.push('')
  content.push('Saya berjanji tidak akan menjapri admin untuk menawar-nawar bilangan yang telah saya')
  content.push('sanggupi.')
  content.push('')
  content.push('')
  content.push('InsyaAllah saya sanggup dan akan semaksimal mungkin menyelesaikan ziyadah sesuai')
  content.push('jadwal yaitu setiap Senin-Kamis, kecuali ada udzur akan saya selesaikan pada hari')
  content.push('Jum\'at, Sabtu dan Ahad.')
  content.push('')
  content.push('InsyaAllah saya sanggup mendengarkan murottal ayat yang akan dihafal minimal 3 kali.')
  content.push('')
  content.push('InsyaAllah saya sanggup membaca ¼ halaman sebanyak 40 kali.')
  content.push('')
  content.push('')
  content.push('InsyaAllah Saya sanggup:')
  content.push('Menghafal ¼ halaman per hari dengan merekam ayat yang telah dihafal tanpa')
  content.push('melihat mushaf (bil-ghaib) sebanyak 3 kali berturut-turut.')
  content.push('Menyimak rekaman bacaan saya ¼ halaman sebanyak 3 kali hingga selesai.')
  content.push('Tidak akan mengulang rekaman jika menemukan kesalahan sebelum selesai menyimak')
  content.push('rekaman hafalan saya (¼ halaman sebanyak 3 kali).')
  content.push('Menyetor kepada pasangan hanya jika saya telah mengecek rekaman hafalan saya (¼ halaman')
  content.push('sebanyak 3 kali) dan memastikan bahwa bacaan tersebut sudah benar 100 persen.')
  content.push('Tidak akan menyetor kepada pasangan apabila saya masih menemukan satu kesalahan pun pada')
  content.push('rekaman hafalan saya.')
  content.push('')
  content.push('')
  content.push('Saya siap menyetor lewat telepon Whatsapp 40 kali setelah saya melakukan step nomor 7.')
  content.push('')
  content.push('Saya siap menyimak setoran hafalan pasangan 40 kali sambil melihat Al Quran dan siap')
  content.push('mengkoreksi kesalahan pasangan saya, apabila saya tidak mengoreksi kesalahan pasangan')
  content.push('saya, saya memahami jika saya tidak mengoreksi pasangan saya ketika saya tau ada')
  content.push('kesalahan merupakan kezaliman karena saya tidak menunaikan hak pasangan setoran saya.')
  content.push('')
  content.push('Jika saya memiliki udzur yang menghalangi setoran telepon WhatsApp 40 kali, maka saya')
  content.push('akan melakukan setoran sebanyak 20 kali melalui panggilan WhatsApp dan 20 kali melalui')
  content.push('Voice Note kepada pasangan setoran saya.')
  content.push('')
  content.push('')
  content.push('Saya siap melakukan setoran bersama pasangan setoran pada waktu yang telah saya pilih di')
  content.push('formulir pendaftaran, yaitu pada hari Senin-Kamis:')
  content.push('')
  content.push(`Waktu Utama: pukul ${formatTimeSlot(mainTimeSlot)} WIB/WITA/WIT`)
  content.push(`Waktu Cadangan: pukul ${formatTimeSlot(backupTimeSlot)} WIB/WITA/WIT`)
  content.push('')
  content.push('Atau waktu yang telah saya sepakati bersama pasangan, dengan tetap menghargai waktu')
  content.push('pasangan dan tidak memprioritaskan kepentingan pribadi, kecuali dalam kondisi udzur yang')
  content.push('mendesak.')
  content.push('')
  content.push('')
  content.push('Saya siap menyetor hafalan ziyadah saya pada hari sebelumnya sebanyak 5 kali kepada')
  content.push('pasangan saya sebelum menyetor ziyadah pada hari yang ditentukan.')
  content.push('')
  content.push('Saya siap menyetor Rabth 1 kali 10 blok untuk mengikat ziyadah saya 10 hari sebelumnya.')
  content.push('')
  content.push('')
  content.push('(Pilih dan tulis salah satu saja poin berikut)')
  content.push('[ ] Saya sudah memiliki Al Quran tikrar/Quran dengan pembagian ¼ halaman.')
  content.push('[ ] Saya siap untuk membeli Quran tikrar.')
  content.push('')
  content.push('(Pilih dan tulis salah satu saja poin berikut)')
  content.push('[ ] Saya sudah memiliki counter manual.')
  content.push('[ ] Saya siap untuk membeli counter manual.')
  content.push('')
  content.push('Saya akan berusaha semaksimal mungkin untuk disiplin laporan dan saya akan')
  content.push('semaksimal mungkin mengingatkan pasangan saya untuk laporan.')
  content.push('')
  content.push('')
  content.push('Saya menyatakan siap dan tidak akan melakukan tuntutan atau korespondensi yang tidak')
  content.push('se mestinya kepada admin apabila saya dikenakan sanksi daftar hitam (blacklist) permanen')
  content.push('dari Program Tikrar MTI. Sanksi ini berlaku jika saya mengundurkan diri di tengah program')
  content.push('karena tidak menyelesaikan tugas pekanan dan/atau lalai melaporkan kewajiban, kecuali')
  content.push('jika disebabkan oleh udzur syar\'i sebagai berikut:')
  content.push('')
  content.push('Qadarullah, saya sendiri/orang tua/mertua/suami/anak sakit dan membutuhkan perawatan')
  content.push('intensif.')
  content.push('Qadarullah, saya hamil muda dan mengalami gejala (seperti ngidam/muntah-muntah) yang')
  content.push('sangat menyulitkan untuk menjalankan program. (Bagi peserta yang hamil tua diharapkan')
  content.push('bersabar menunggu angkatan selanjutnya).')
  content.push('Qadarullah, terjadi bencana alam yang tidak memungkinkan saya untuk melanjutkan program')
  content.push('ini.')
  content.push('Udzur lain yang mendesak/tiba-tiba dan di luar perkiraan yang dapat dimaklumi oleh')
  content.push('pihak Markaz Tikrar Indonesia.')
  content.push('')
  content.push('')
  content.push('Saya siap untuk dikeluarkan dari program (di-DO) apabila dalam sepekan saya tidak')
  content.push('memenuhi target karena udzur syar\'i sebagaimana tercantum pada poin 17, dengan tetap')
  content.push('memiliki hak untuk mendaftar kembali dari awal pada angkatan selanjutnya.')
  content.push('')
  content.push('Apabila di tengah program saya mengundurkan diri karena larangan suami/orang tua/')
  content.push('majikan yang sebelumnya telah memberikan izin pada saat pendaftaran, maka saya bersedia')
  content.push('pihak yang memberikan izin tersebut langsung menghubungi Kak Mara melalui panggilan WhatsApp')
  content.push('(menggunakan nomor yang terdaftar pada formulir pendaftaran) dan saya siap untuk di-DO')
  content.push('permanen.')
  content.push('')
  content.push('')
  content.push('Saya memahami bahwa seluruh peraturan dalam akad ini tidak bertujuan mempersulit')
  content.push('peserta program MTI dalam menghafal Al-Qur\'an. Sebaliknya, semua aturan ini semata-mata')
  content.push('untuk menjaga hak saya dan mitra setoran agar program dapat berjalan dengan tertib dan adil')
  content.push('demi mencapai cita-cita mulia kita bersama dalam membersamai Al-Qur\'an.')
  content.push('')
  content.push('')
  content.push('Demikian akad ini saya tulis dengan sejujur-jujurnya, semoga Allah selalu membimbing')
  content.push('saya untuk berusaha semaksimal mungkin untuk memenuhi setiap poin-poin akad yang telah')
  content.push('saya tulis dengan tangan saya sendiri, sebagaimana saya juga menginginkan orang lain,')
  content.push('suami, anak, keluarga dan siapapun yang telah berjanji suatu akad kepada saya untuk')
  content.push('memenuhi akadnya.')
  content.push('')
  content.push('')
  content.push('Saya yang berjanji')
  content.push('')
  content.push('(tanggal, bulan, tahun)')
  content.push('')
  content.push('(Tanda Tangan)')
  content.push(`(${fullName} - Nama lengkap sesuai KTP)`)

  return {
    title: `Akad Daftar Ulang - ${batchName}`,
    content,
    fullText: content.join('\n')
  }
}

// Helper function to format time slot
function formatTimeSlot(slot: string): string {
  const timeMap: Record<string, string> = {
    '04-06': '04.00 - 06.00',
    '06-09': '06.00 - 09.00',
    '09-12': '09.00 - 12.00',
    '12-15': '12.00 - 15.00',
    '15-18': '15.00 - 18.00',
    '18-21': '18.00 - 21.00',
    '21-24': '21.00 - 24.00',
  }
  return timeMap[slot] || slot
}
