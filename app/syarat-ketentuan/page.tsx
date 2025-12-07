'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Info, BookOpen, Heart, Shield, Users } from 'lucide-react'
import Link from 'next/link'

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-3">
            Syarat dan Ketentuan
          </h1>
          <p className="text-lg text-gray-600">
            Markaz Tikrar Indonesia (MTI)
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Terakhir diperbarui: 6 Desember 2025
          </p>
        </div>

        {/* Bismillah */}
        <Card className="mb-6 border-2 border-green-200 shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-arabic text-green-900 mb-2">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p className="text-sm text-gray-600 italic">Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang</p>
          </CardContent>
        </Card>

        {/* Mukadimah */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-900">
              <Heart className="w-6 h-6 mr-2 text-red-500" />
              Mukadimah
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              Alhamdulillahi Rabbil 'Alamin. Segala puji bagi Allah Subhanahu wa Ta'ala yang telah menurunkan Al-Qur'an sebagai petunjuk dan rahmat bagi seluruh alam. Shalawat serta salam semoga senantiasa tercurah kepada Nabi Muhammad Shallallahu 'alaihi wa sallam, keluarga, sahabat, dan seluruh pengikutnya hingga akhir zaman.
            </p>
            <p>
              Markaz Tikrar Indonesia (MTI) adalah lembaga pendidikan Al-Qur'an yang didirikan dengan niat ikhlas lillahi ta'ala untuk membantu umat Islam, khususnya akhawat muslimah, dalam menghafal dan memuraja'ah Al-Qur'an dengan metode yang mudah, efektif, dan sesuai tuntunan syari'ah.
            </p>
          </CardContent>
        </Card>

        {/* 1. Definisi dan Istilah */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-green-900">
              <Info className="w-6 h-6 mr-2" />
              1. Definisi dan Istilah
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700">
            <div className="pl-4 border-l-4 border-green-500">
              <p className="font-semibold text-green-900">MTI</p>
              <p className="text-sm">Markaz Tikrar Indonesia, lembaga penyelenggara program tahfidz Al-Qur'an.</p>
            </div>
            <div className="pl-4 border-l-4 border-green-500">
              <p className="font-semibold text-green-900">Thalibah</p>
              <p className="text-sm">Peserta program tahfidz yang telah diterima dan terdaftar resmi di MTI.</p>
            </div>
            <div className="pl-4 border-l-4 border-green-500">
              <p className="font-semibold text-green-900">Mu'allimah</p>
              <p className="text-sm">Pengajar Al-Qur'an yang membimbing thalibah dalam program tahfidz.</p>
            </div>
            <div className="pl-4 border-l-4 border-green-500">
              <p className="font-semibold text-green-900">Musyrifah</p>
              <p className="text-sm">Koordinator dan pembina yang mengawasi jalannya program.</p>
            </div>
            <div className="pl-4 border-l-4 border-green-500">
              <p className="font-semibold text-green-900">Tikrar</p>
              <p className="text-sm">Metode menghafal Al-Qur'an dengan pengulangan sebanyak 40 kali.</p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Akad dan Komitmen */}
        <Card className="mb-6 border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-900">
              <Shield className="w-6 h-6 mr-2" />
              2. Akad dan Komitmen Syar'i
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <Alert className="bg-orange-50 border-orange-200">
              <AlertDescription className="text-orange-800">
                <strong>Penting:</strong> Pendaftaran di MTI merupakan akad (perjanjian) yang akan dipertanggungjawabkan di hadapan Allah Ta'ala.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-semibold text-green-900">2.1 Niat dan Ikhlas</h4>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Thalibah wajib berniat ikhlas lillahi ta'ala dalam menuntut ilmu Al-Qur'an</li>
                <li>Mengharap ridho Allah semata, bukan untuk pujian atau riya'</li>
                <li>Bertekad untuk mengamalkan dan mengajarkan Al-Qur'an kepada orang lain</li>
              </ul>

              <h4 className="font-semibold text-green-900 mt-4">2.2 Komitmen Waktu</h4>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Thalibah berkomitmen mengikuti program hingga selesai (13-16 pekan)</li>
                <li>Menyediakan waktu minimal 2 jam per hari untuk menghafal dan muraja'ah</li>
                <li>Menghadiri kelas tashih dan ujian sesuai jadwal yang ditentukan</li>
                <li>Konsisten dalam setoran harian kepada pasangan tikrar</li>
              </ul>

              <h4 className="font-semibold text-green-900 mt-4">2.3 Izin Wali</h4>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Wajib mendapat izin dari suami (bagi yang sudah menikah)</li>
                <li>Wajib mendapat izin dari orang tua/wali (bagi yang belum menikah)</li>
                <li>Izin harus diberikan dengan ridho, bukan karena terpaksa</li>
                <li>Apabila izin dicabut di tengah program, wali yang bersangkutan wajib menghubungi MTI</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 3. Hak dan Kewajiban Thalibah */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-green-900">
              <CheckCircle className="w-6 h-6 mr-2" />
              3. Hak dan Kewajiban Thalibah
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <div>
              <h4 className="font-semibold text-green-900 mb-3">3.1 Hak Thalibah</h4>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Mendapatkan bimbingan dari mu'allimah dan musyrifah yang berkompeten</li>
                <li>Mendapatkan pasangan tikrar yang sesuai dengan waktu dan zona waktu</li>
                <li>Mendapatkan materi pembelajaran metode tikrar yang terstruktur</li>
                <li>Mendapatkan sertifikat kelulusan setelah menyelesaikan program</li>
                <li>Bergabung dalam komunitas alumni MTI</li>
                <li>Mendapatkan dukungan dan bimbingan selama program berlangsung</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-900 mb-3">3.2 Kewajiban Thalibah</h4>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>Adab dan Akhlaq:</strong> Menjaga adab kepada Allah, Rasul-Nya, Al-Qur'an, mu'allimah, musyrifah, dan sesama thalibah</li>
                <li><strong>Komitmen Belajar:</strong> Mengikuti seluruh tahapan program dari awal hingga akhir</li>
                <li><strong>Tikrar 40x:</strong> Melaksanakan tikrar (pengulangan) sebanyak 40 kali tanpa pengurangan atau negosiasi</li>
                <li><strong>Tashih:</strong> Menghadiri kelas tashih setiap pekan untuk perbaikan bacaan</li>
                <li><strong>Ujian:</strong> Mengikuti ujian pekanan sesuai jadwal yang ditentukan</li>
                <li><strong>Setoran:</strong> Menyetor hafalan kepada pasangan tikrar sesuai jadwal yang disepakati</li>
                <li><strong>Laporan:</strong> Melaporkan progress hafalan sesuai arahan musyrifah</li>
                <li><strong>Tanggung Jawab Pasangan:</strong> Tidak mendzolimi waktu pasangan dengan alasan yang tidak urgen</li>
                <li><strong>Perlengkapan:</strong> Memiliki Al-Qur'an Tikrar dan counter (alat penghitung)</li>
                <li><strong>Komunikasi:</strong> Merespon informasi dari MTI melalui grup Telegram/WhatsApp</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 4. Ketentuan Program */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-green-900">
              <Users className="w-6 h-6 mr-2" />
              4. Ketentuan Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <div>
              <h4 className="font-semibold text-green-900 mb-3">4.1 Proses Pendaftaran</h4>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Mengisi formulir pendaftaran dengan data yang benar dan lengkap</li>
                <li>Mencoba simulasi tikrar (membaca An-Naba' ayat 1-11 sebanyak 40x)</li>
                <li>Menyetujui seluruh syarat dan ketentuan MTI</li>
                <li>Mengikuti tes seleksi administrasi dan bacaan Al-Qur'an</li>
                <li>Melakukan daftar ulang jika dinyatakan lulus seleksi</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-900 mb-3">4.2 Biaya Program</h4>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Program dapat bersifat gratis (beasiswa) atau berbayar sesuai batch yang dibuka</li>
                <li>Untuk program berbayar, biaya harus dilunasi sesuai ketentuan yang berlaku</li>
                <li>Biaya yang sudah dibayarkan tidak dapat dikembalikan kecuali dengan udzur syar'i</li>
                <li>Bagi yang kesulitan finansial dapat menghubungi admin untuk solusi terbaik</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-900 mb-3">4.3 Jadwal dan Kehadiran</h4>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Thalibah wajib mengikuti jadwal yang telah disepakati dengan pasangan tikrar</li>
                <li>Ketidakhadiran hanya diperbolehkan dengan udzur syar'i</li>
                <li>Mengubah jadwal harus seizin pasangan tikrar dan musyrifah</li>
                <li>Keterlambatan atau ketidakhadiran tanpa alasan dapat berdampak pada evaluasi</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 5. Pengunduran Diri dan Sanksi */}
        <Card className="mb-6 border-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-900">
              <AlertDescription className="w-6 h-6 mr-2" />
              5. Pengunduran Diri dan Sanksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                <strong>Peringatan:</strong> MTI tidak meridhoi thalibah yang keluar dari program tanpa udzur syar'i yang dapat dipertanggungjawabkan.
              </AlertDescription>
            </Alert>

            <div>
              <h4 className="font-semibold text-green-900 mb-3">5.1 Udzur Syar'i yang Diterima</h4>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Sakit yang membutuhkan perawatan intensif (diri sendiri/keluarga inti)</li>
                <li>Hamil muda dengan kondisi yang menyulitkan mengikuti program</li>
                <li>Bencana alam atau musibah yang tidak terduga</li>
                <li>Pencabutan izin oleh suami/wali dengan alasan syar'i</li>
                <li>Kondisi darurat lainnya yang dapat dimaklumi secara syar'i</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-red-900 mb-3">5.2 Alasan yang TIDAK Diterima</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-red-700">
                <li>Sibuk dengan pekerjaan atau kelas lain yang sudah diketahui sejak awal</li>
                <li>Merasa bosan atau malas</li>
                <li>Ikut program tahfidz lain tanpa seizin MTI</li>
                <li>Tidak cocok dengan metode atau pasangan tikrar</li>
                <li>Alasan-alasan lain yang bersifat subjektif dan tidak urgen</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-red-900 mb-3">5.3 Sistem Blacklist</h4>
              <p className="text-sm mb-2">MTI menerapkan sistem blacklist permanen bagi thalibah yang:</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Keluar dari program tanpa udzur syar'i</li>
                <li>Mendzolimi hak pasangan tikrar secara berulang</li>
                <li>Melanggar adab dan akhlaq islami</li>
                <li>Berbohong dalam data atau keterangan yang diberikan</li>
                <li>Melakukan tindakan yang merusak nama baik MTI</li>
              </ul>
              <p className="text-sm text-red-700 mt-3 font-semibold">
                Thalibah yang masuk blacklist tidak dapat mendaftar kembali di program MTI manapun di masa mendatang.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 6. Hak Kekayaan Intelektual */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-green-900">6. Hak Kekayaan Intelektual dan Distribusi Metode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700 text-sm">
            <p>Metode Tikrar MTI adalah metode yang dikembangkan untuk kemudahan umat dalam menghafal Al-Qur'an. Kami izinkan metode ini untuk:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Dipelajari dan diamalkan secara pribadi</li>
              <li>Diajarkan di halaqah/lembaga tahfidz masing-masing dengan menyebut sumber</li>
              <li>Dimodifikasi sesuai kebutuhan dengan tetap menjaga esensi metode</li>
              <li>Disebarluaskan dengan niat lillahi ta'ala</li>
            </ul>
            <p className="text-orange-700 font-semibold mt-3">
              Dilarang mengklaim metode ini sebagai hasil karya sendiri atau mengkomersialkan tanpa izin MTI.
            </p>
          </CardContent>
        </Card>

        {/* 7. Privasi dan Data Pribadi */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-green-900">7. Privasi dan Perlindungan Data Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700 text-sm">
            <ul className="list-disc list-inside space-y-2">
              <li>MTI berkomitmen menjaga kerahasiaan data pribadi thalibah</li>
              <li>Data hanya digunakan untuk keperluan administrasi dan program MTI</li>
              <li>Data tidak akan dibagikan kepada pihak ketiga tanpa izin</li>
              <li>Thalibah berhak meminta penghapusan data setelah program selesai</li>
              <li>MTI menggunakan sistem keamanan untuk melindungi data thalibah</li>
            </ul>
          </CardContent>
        </Card>

        {/* 8. Penyelesaian Perselisihan */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-green-900">8. Penyelesaian Perselisihan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700 text-sm">
            <p>Apabila terjadi perselisihan atau perbedaan pendapat:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Diselesaikan dengan cara musyawarah secara kekeluargaan</li>
              <li>Mengutamakan prinsip islami dalam penyelesaian</li>
              <li>Keputusan MTI bersifat final dan mengikat</li>
              <li>Apabila perlu, dapat melibatkan pihak yang ahli dalam syariat Islam</li>
            </ul>
          </CardContent>
        </Card>

        {/* 9. Perubahan Syarat dan Ketentuan */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-green-900">9. Perubahan Syarat dan Ketentuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700 text-sm">
            <ul className="list-disc list-inside space-y-2">
              <li>MTI berhak mengubah atau memperbarui syarat dan ketentuan sewaktu-waktu</li>
              <li>Perubahan akan diinformasikan melalui website dan grup resmi</li>
              <li>Thalibah yang sudah terdaftar tunduk pada syarat ketentuan yang berlaku saat pendaftaran</li>
              <li>Perubahan signifikan akan memerlukan persetujuan ulang dari thalibah</li>
            </ul>
          </CardContent>
        </Card>

        {/* Penutup */}
        <Card className="mb-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-bold text-center mb-4">Penutup</h3>
            <p className="text-sm text-center leading-relaxed">
              Dengan mendaftar di Markaz Tikrar Indonesia, Ukhti menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku. Semoga Allah Ta'ala senantiasa memberkahi perjalanan kita dalam menghafal dan mengamalkan Al-Qur'an.
            </p>
            <p className="text-center text-lg font-arabic mt-4">
              جَزَاكُمُ اللّٰهُ خَيْرًا كَثِيْرًا
            </p>
            <p className="text-center text-sm italic">
              Jazakumullahu khairan katsiran
            </p>
            <p className="text-center text-xs mt-4 opacity-90">
              Markaz Tikrar Indonesia<br/>
              "Membangun Generasi Qur'ani yang Berakhlak Mulia"
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-600 mb-4">Jika ada pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi:</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/6281313650842"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
            >
              WhatsApp Admin MTI
            </a>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Kembali ke Pendaftaran
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
