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
      .select('*, users(tanggal_lahir), batches(name, opening_class_date, graduation_end_date, registration_start_date, registration_end_date)')
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
  
  // Calculate age
  let age = '...'
  if (registration.users?.tanggal_lahir) {
    const today = new Date()
    const birthDate = new Date(registration.users.tanggal_lahir)
    let calcAge = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calcAge--
    }
    age = `${calcAge} tahun`
  }
  
  const domicile = registration.domicile || '________________'
  const mainTimeSlot = registration.main_time_slot || '________________'
  const backupTimeSlot = registration.backup_time_slot || '________________'
  const timezone = registration.timezone || 'WIB/WITA/WIT'
  
  const batchName = registration.batches?.name || '3' 
  
  const batchStartDate = registration.batches?.opening_class_date ? new Date(registration.batches.opening_class_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '12 Januari 2026'
  const batchEndDate = registration.batches?.graduation_end_date ? new Date(registration.batches.graduation_end_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '12 April 2026'

  // Build akad content sections
  const content: string[] = []

  content.push('AKAD DAFTAR ULANG PROGRAM TIKRAR MARKAZ TIKRAR INDONESIA')
  content.push('')
  content.push('Bismillahirrahmanirrahim')
  content.push('')
  content.push('Pada hari ini ......, tanggal… saya yang menulis lembar akad ini dengan tulisan tangan saya,')
  content.push('')
  content.push(`Nama: ${fullName}`)
  content.push(`Usia: ${age}`)
  content.push(`Domisili: ${domicile}`)
  content.push('')
  content.push(`Dengan sadar tanpa paksaan, menulis akad keikutsertaan pada kelas Tahfidz Tikrar MTI ${batchName} Tahun 2026 tanggal ${batchStartDate} sampai dengan tanggal ${batchEndDate}.`)
  content.push('')
  content.push('Saya siap memulai kelas Tikrar. Saya berjanji untuk menjadikan program ini sebagai salah satu prioritas. Saya berusaha menjaga kehadiran, bersungguh-sungguh dalam belajar dan menuntut ilmu ini dengan niat karena Allah Ta\'ala. Saya bersedia menjaga adab, patuh dan ta\'at pada aturan yang tercantum pada poin-poin di bawah ini,')
  content.push('')
  content.push('Bismillah, In Syaa Allah Saya berjanji:')
  content.push('')
  content.push('1. Akan selalu memperbaiki niat menghafal karena Allah Ta\'ala.')
  content.push('2. Menjaga adab kepada para mu\'allimah MTI, Admin MTI, Musyrifah/Raisah MTI dan pasangan setoran saya.')
  content.push('3. Tidak akan menjapri admin untuk menawar-nawar bilangan Tikrar yang telah saya sanggupi.')
  content.push('4. Semaksimal mungkin menyelesaikan ziyadah sesuai jadwal, yaitu setiap Senin-Kamis, kecuali ada udzur akan saya selesaikan pada hari Jum\'at, Sabtu dan Ahad.')
  content.push('5. Sanggup mendengarkan murottal ayat yang akan dihafal minimum 3 kali.')
  content.push('6. Sanggup membaca ¼ halaman sebanyak 40 kali')
  content.push('7. Saya sanggup:')
  content.push('   ● Menghafal ¼ halaman per hari dengan merekam ayat yang telah dihafal tanpa melihat mushaf (bil-ghaib) sebanyak 3 kali berturut-turut.')
  content.push('   ● Menyimak rekaman tersebut sebanyak 3 kali hingga selesai.')
  content.push('   ● Tidak akan mengulang merekam jika menemukan kesalahan sebelum selesai menyimak rekaman tersebut sebanyak 3 kali.')
  content.push('   ● Menyetor kepada pasangan hanya jika saya telah memastikan bahwa bacaan tersebut sudah benar 100%.')
  content.push('8. Siap menyetor lewat telepon Whatsapp 40 kali setelah saya melakukan poin nomor 7.')
  content.push('9. Siap menyimak setoran hafalan pasangan 40 kali dan siap mengoreksi kesalahan pasangan saya, apabila saya tidak mengoreksi kesalahan pasangan saya secara sengaja maka itu merupakan kedzaliman karena saya tidak menunaikan hak pasangan setoran saya.')
  content.push('10. Jika saya memiliki udzur yang menghalangi setoran telepon WhatsApp 40 kali, maka saya akan melakukan setoran sebanyak 20 kali melalui panggilan WhatsApp dan 20 kali melalui Voice Note kepada pasangan setoran saya.')
  content.push('11. Siap melakukan setoran bersama pasangan setoran pada waktu yang telah saya pilih di formulir pendaftaran, yaitu pada hari Senin-Kamis:')
  content.push(`    ● Waktu Utama: pukul ${formatTimeSlot(mainTimeSlot)} ${timezone}`)
  content.push(`    ● Waktu Cadangan: pukul ${formatTimeSlot(backupTimeSlot)} ${timezone}`)
  content.push('    ● Atau waktu yang telah saya sepakati bersama pasangan, dengan tetap menghargai waktu satu sama lain, kecuali dalam kondisi udzur yang mendesak.')
  content.push('12. Siap menyetor hafalan ziyadah saya pada hari sebelumnya sebanyak 5 kali kepada pasangan saya.')
  content.push('13. Siap menyetorkan Rabth 1 kali/10 blok untuk mengikat ziyadah saya 10 hari sebelumnya.')
  content.push('14. (Pilih dan tulis salah satu saja poin berikut)')
  content.push('    i. Saya sudah memiliki Al Quran Tikrar/Quran dengan pembagian ¼ halaman.')
  content.push('    ii. Saya siap untuk membeli Quran Tikrar.')
  content.push('    iii. Saya tidak sanggup membeli Quran, saya akan lihat aplikasi go ngaji untuk pembagian blok ¼ halaman.')
  content.push('15. (Pilih dan tulis salah satu saja poin berikut)')
  content.push('    i. Saya sudah memiliki counter manual.')
  content.push('    ii. Saya siap untuk membeli counter manual.')
  content.push('16. Akan berusaha semaksimal mungkin untuk disiplin laporan dan mengingatkan pasangan saya untuk laporan.')
  content.push('17. Saya menyatakan siap dan tidak akan melakukan tuntutan atau korespondensi yang tidak semestinya kepada admin apabila saya dikenakan sanksi blacklist dari Program Tikrar MTI. Sanksi ini berlaku jika saya mengundurkan diri di tengah program karena tidak menyelesaikan tugas pekanan dan/atau lalai melaporkan kewajiban, kecuali jika disebabkan oleh udzur syar\'i sebagai berikut:')
  content.push('    ● Qadarullah, saya sendiri/orang tua/mertua/suami/anak sakit dan membutuhkan perawatan intensif.')
  content.push('    ● Qadarullah, saya hamil muda dan mengalami gejala (seperti muntah-muntah dll) yang menyulitkan saya untuk menjalankan program.')
  content.push('      (PS: Bagi peserta yang hamil tua diharapkan bersabar menunggu angkatan selanjutnya).')
  content.push('    ● Qadarullah, terjadi bencana alam yang tidak memungkinkan saya untuk melanjutkan program ini.')
  content.push('    ● Udzur lain yang mendesak/ tiba-tiba dan di luar perkiraan yang dapat dimaklumi oleh pihak Markaz Tikrar Indonesia."')
  content.push('18. Saya siap untuk dikeluarkan dari program (di-DO) apabila saya tidak memenuhi target karena udzur syar\'i sebagaimana tercantum pada poin 17, dengan tetap memiliki hak untuk mendaftar kembali dari awal pada angkatan selanjutnya.')
  content.push('19. Apabila di tengah program saya mengundurkan diri karena larangan suami/orang tua/ majikan yang sebelumnya telah memberikan izin pada saat pendaftaran, maka saya bersedia pihak yang memberikan izin tersebut langsung menghubungi Kak Mara melalui panggilan WhatsApp (menggunakan nomor yang terdaftar pada formulir pendaftaran) dan saya siap untuk di blacklist.')
  content.push('20. Saya memahami bahwa seluruh peraturan dalam akad ini tidak bertujuan mempersulit peserta program MTI dalam menghafal Al-Qur\'an. Sebaliknya, semua aturan ini semata-mata untuk menjaga hak saya dan mitra setoran agar program dapat berjalan dengan tertib dan adil demi mencapai cita-cita mulia kita dalam membersamai Al-Qur\'an.')
  content.push('')
  content.push('Demikian akad ini saya tulis dengan sejujur-jujurnya, semoga Allah selalu memudahkan saya memenuhi setiap poin-poin akad yang telah saya tulis dengan tangan saya sendiri, sebagaimana saya juga menginginkan orang lain, suami, anak, keluarga dan siapapun yang telah berjanji suatu akad kepada saya untuk memenuhi akadnya.')
  content.push('')
  content.push('Saya yang berjanji')
  content.push('')
  content.push('(tanggal, bulan, tahun)')
  content.push('')
  content.push('(Tanda Tangan)')
  content.push('')
  content.push(`(${fullName})`)

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
