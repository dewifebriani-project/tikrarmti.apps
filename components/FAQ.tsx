"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  BookOpen,
  Heart,
  Shield,
  Award,
  HelpCircle,
  Star,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const faqData = [
  {
    category: "Program Umum",
    icon: BookOpen,
    color: "green",
    questions: [
      {
        q: "Apa itu Program Tahfidz Tikrar MTI?",
        a: "Program Tahfidz Tikrar MTI adalah program hafalan Al-Qur'an gratis yang menggunakan metode Tikrar 40x. Program ini khusus untuk Ibu rumah tangga dan remaja putri yang serius ingin menghafal Al-Qur'an dengan komitmen waktu minimal 2 jam per hari."
      },
      {
        q: "Apakah program ini benar-benar gratis?",
        a: "Ya, program ini 100% gratis. Tidak ada biaya pendaftaran, biaya bulanan, atau biaya tersembunyi apa pun. Program ini didukung oleh Muallimah dan Musyrifah profesional yang berdedikasi."
      },
      {
        q: "Siapa saja yang bisa bergabung dengan program ini?",
        a: "Program ini terbuka untuk Ibu rumah tangga dan remaja putri yang sudah bisa membaca Al-Qur'an dengan tajwid yang benar. Peserta harus bersedia berkomitmen penuh selama 13 pekan dan memiliki waktu sekitar 2 jam per hari untuk menghafal."
      },
      {
        q: "Apa yang membedakan program ini dengan program tahfidz lainnya?",
        a: "Program ini menggunakan metode Tikrar 40x yang terbukti efektif, memiliki sistem yang terstruktur dengan 7 kurikulum wajib harian dan 2 kurikulum tambahan, didampingi Musyrifah yang berdedikasi, dan memiliki komunitas yang saling mendukung. Target yang realistis (1/4 halaman per hari) membuat program ini cocok untuk ibu rumah tangga."
      }
    ]
  },
  {
    category: "Metode Belajar",
    icon: Shield,
    color: "blue",
    questions: [
      {
        q: "Apa itu Metode Tikrar 40x?",
        a: "Metode Tikrar 40x adalah metode hafalan dengan mengulang bacaan ayat sebanyak 40 kali. Metode ini terdiri dari 7 tahapan: Rabth (menyambung hafalan), Muraja'ah blok terakhir, Simak murattal, Tikrar dengan melihat mushaf (40x), Tasmi' via rekaman, Simak rekaman pribadi, dan Tikrar tanpa mushaf (40x)."
      },
      {
        q: "Mengapa harus 40 kali pengulangan?",
        a: "Pengulangan 40 kali berdasarkan penelitian bahwa otak manusia membutuhkan pengulangan yang konsisten untuk menyimpan informasi ke memori jangka panjang."
      },
      {
        q: "Berapa target hafalan per hari?",
        a: "Target hafalan adalah 1/4 halaman per hari atau satu halaman per pekan. Target ini disesuaikan agar tidak terlalu berat untuk ibu rumah tangga yang harus menyeimbangkan dengan rutinitas sehari-hari."
      },
      {
        q: "Apakah harus hafal Latin Arab sebelum bergabung?",
        a: "Tidak wajib, tapi sangat disarankan. Memahami makhraj dan tajwid yang benar akan membantu proses hafalan menjadi lebih efektif. Program akan memberikan tes bacaan saat seleksi."
      }
    ]
  },
  {
    category: "Waktu & Komitmen",
    icon: Clock,
    color: "yellow",
    questions: [
      {
        q: "Berapa lama durasi program ini?",
        a: "Program berlangsung selama 13 pekan (sekitar 3 bulan). Selama periode ini, peserta diharapkan konsisten mengikuti semua tahapan pembelajaran."
      },
      {
        q: "Apakah harus online setiap hari pada jam tertentu?",
        a: "Iya. Peserta dapat menyesuaikan jadwal belajar sesuai waktu luang masing-masing. Namun, harus melakukan setoran harian kepada pasangan yang telah ditentukan. Penjadwalan akan disesuaikan dengan zona waktu masing-masing peserta."
      },
      {
        q: "Bagaimana jika terlewat satu hari setoran?",
        a: "Tidak disarankan untuk terlewat. Program ini membutuhkan konsistensi tinggi. Jika terpaksa terlewat, peserta harus memberitahu Musyrifah dan mengulang hari tersebut. Namun, jika sering terlewat tanpa alasan yang syar'i, peserta dapat dikeluarkan dari program (blacklist permanen)."
      },
      {
        q: "Apakah ada toleransi untuk cuti atau libur?",
        a: "Toleransi hanya diberikan untuk alasan syar'i yang valid (misal: sakit berat dengan surat dokter, atau keringanan lain yang ditandatangani ketika akad). Selain itu, peserta diharapkan konsisten selama 13 pekan."
      }
    ]
  },
  {
    category: "Sistem & Aturan",
    icon: AlertCircle,
    color: "red",
    questions: [
      {
        q: "Apa itu sistem blacklist?",
        a: "Sistem blacklist adalah konsekuensi bagi peserta yang keluar dari program tanpa alasan syar'i yang jelas. Peserta yang masuk blacklist tidak dapat lagi bergabung dengan program MTI di masa mendatang. Ini demi menjaga komitmen dan hak peserta lain yang ingin bergabung."
      },
      {
        q: "Bagaimana sistem pembelajaran berjalan?",
        a: "Setiap peserta akan mendapatkan: jadwal hafalan harian, pasangan setoran, bimbingan dari Musyrifah, akses ke grup WhatsApp/Telegram untuk tanya jawab, dan template laporan harian yang harus diisi."
      },
      {
        q: "Apakah ada ujian selama program?",
        a: "Ya, ada beberapa ujian: tes bacaan awal saat seleksi, ujian pekanan dengan mu'allimah, dan ujian akhir untuk penentuan kelulusan."
      },
      {
        q: "Bagaimana jika tidak bisa menghafal target harian?",
        a: "Peserta harus berjuang maksimal untuk mencapai target. Jika kesulitan, segera diskusikan dengan Musyrifah. Dibutuhkan kejujuran dalam melaporkan progres hafalan."
      }
    ]
  },
  {
    category: "Pasangan Setoran & Komunitas",
    icon: Users,
    color: "purple",
    questions: [
      {
        q: "Apa itu pasangan setoran?",
        a: "Pasangan setoran adalah teman satu batch yang akan menjadi partner untuk saling menyetorkan hafalan. Setiap peserta wajib melakukan setoran 40 kali kepada pasangannya dan mendengarkan setoran pasangannya 40 kali."
      },
      {
        q: "Bagaimana jika pasangan setoran tidak cocok?",
        a: "Peserta harus professional dan tetap berkomunikasi dengan baik. Jika ada masalah serius, laporkan ke Musyrifah melalui aplikasi untuk penanganan lebih lanjut. Ini adalah bagian dari belajar bersama dan toleransi."
      },
      {
        q: "Apakah ada komunitas alumni?",
        a: "Ya, lulusan program akan bergabung dengan komunitas alumni MTI yang terus saling mendukung dalam perjalanan tahfidz masing-masing. Ada program lanjutan bagi yang ingin melanjutkan ke juz berikutnya."
      },
      {
        q: "Bagaimana interaksi dengan Musyrifah?",
        a: "Musyrifah akan aktif memantau progres setiap peserta melalui laporan harian, memberikan feedback secara berkala, dan tersedia untuk konsultasi jika ada kesulitan dalam menghafal."
      }
    ]
  },
  {
    category: "Persiapan & Pendaftaran",
    icon: CheckCircle,
    color: "indigo",
    questions: [
      {
        q: "Apa saja persyaratan untuk mendaftar?",
        a: "Persyaratan: (1) Muslimah, (2) Bisa membaca Al-Qur'an dengan tajwid, (3) Komitmen waktu 2 jam/hari, (4) Memiliki mushaf Qur'an Tikrar dan HP untuk rekaman, (5) Siap mengikuti aturan main, dan (6) Menyelesaikan simulasi Tikrar An-Naba' 1-11 x 40 kali."
      },
      {
        q: "Bagaimana proses pendaftarannya?",
        a: "Proses: (1) Mengisi formulir pendaftaran, (2) Mengerjakan simulasi Tikrar, (3) Tes bacaan online, (4) Seleksi berkas, (5) Pengumuman kelulusan, (6) Penjadwalan halaqah dan pasangan setoran."
      },
      {
        q: "Kapan pendaftaran dibuka?",
        a: "Pendaftaran dibuka setiap awal kuartal. Informasi pendaftaran akan diumumkan melalui Instagram MTI dan grup alumni. Pastikan mengikuti akun resmi untuk update terbaru."
      },
      {
        q: "Apa saja yang perlu disiapkan sebelum program mulai?",
        a: "Yang perlu disiapkan: Qur'an Tikrar , HP dengan kapasitas penyimpanan cukup untuk rekaman, headset dengan mikrofon baik, jurnal/catatan khusus untuk tracking progress, dan waktu yang terjadwal setiap hari."
      }
    ]
  },
  {
    category: "Setelah Lulus",
    icon: Award,
    color: "emerald",
    questions: [
      {
        q: "Apakah dapat sertifikat setelah lulus?",
        a: "Ya, peserta yang lulus akan mendapatkan sertifikat resmi dari MTI sebagai bukti telah menyelesaikan program hafalan dengan metode Tikrar 40x."
      },
      {
        q: "Apakah ada program lanjutan setelah lulus?",
        a: "Ya, ada program lanjutan untuk melanjutkan hafalan ke juz berikutnya. Alumni juga mendapatkan prioritas untuk bergabung dengan program lanjutan dan akses ke kelas-kelas pengembangan MTI lainnya."
      },
      {
        q: "Bagaimana menjaga hafalan setelah lulus?",
        a: "MTI akan memberikan panduan muraja'ah pasca-graduasi, in syaa Allah. Alumni juga tetap bisa bergabung dalam grup alumni untuk terus mendapatkan motivasi dan dukungan dalam menjaga hafalan."
      }
    ]
  }
];

export default function FAQ() {
  const [isMounted, setIsMounted] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<{ category: number; question: number } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleCategory = (index: number) => {
    setExpandedCategory(expandedCategory === index ? null : index);
    setExpandedQuestion(null);
  };

  const toggleQuestion = (categoryIndex: number, questionIndex: number) => {
    const current = expandedQuestion?.category === categoryIndex && expandedQuestion?.question === questionIndex;
    setExpandedQuestion(current ? null : { category: categoryIndex, question: questionIndex });
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  return (
    <section id="faq" className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <Badge className="bg-green-100 text-green-900 border-green-200 px-6 py-3 mb-6 text-sm font-semibold">
            <HelpCircle className="w-4 h-4 mr-2" />
            Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Temukan jawaban untuk pertanyaan-pertanyaan umum tentang Program Tahfidz Tikrar MTI
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            {
              icon: Star,
              title: "Populer",
              desc: "Pertanyaan paling banyak dicari"
            },
            {
              icon: Users,
              title: "Komunitas",
              desc: "Tentang sistem belajar bersama"
            },
            {
              icon: Clock,
              title: "Waktu",
              desc: "Jadwal dan komitmen"
            },
            {
              icon: Heart,
              title: "Support",
              desc: "Bantuan & panduan"
            }
          ].map((item, index) => (
            <Card
              key={index}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-gray-200"
              onClick={() => {
                const categoryIndex = index < faqData.length ? index : 0;
                toggleCategory(categoryIndex);
              }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-6 h-6 text-green-900" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Categories */}
        <div className="space-y-4">
          {faqData.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => toggleCategory(categoryIndex)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      category.color === 'green' ? 'bg-green-100' :
                      category.color === 'blue' ? 'bg-blue-100' :
                      category.color === 'yellow' ? 'bg-yellow-100' :
                      category.color === 'red' ? 'bg-red-100' :
                      category.color === 'purple' ? 'bg-purple-100' :
                      category.color === 'indigo' ? 'bg-indigo-100' :
                      'bg-emerald-100'
                    }`}>
                      <category.icon className={`w-6 h-6 ${
                        category.color === 'green' ? 'text-green-900' :
                        category.color === 'blue' ? 'text-blue-600' :
                        category.color === 'yellow' ? 'text-yellow-600' :
                        category.color === 'red' ? 'text-red-600' :
                        category.color === 'purple' ? 'text-purple-600' :
                        category.color === 'indigo' ? 'text-indigo-600' :
                        'text-emerald-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{category.category}</h3>
                      <p className="text-sm text-gray-600">{category.questions.length} pertanyaan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedCategory === categoryIndex ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Questions */}
              {expandedCategory === categoryIndex && (
                <div className="border-t border-gray-200">
                  {category.questions.map((faq, questionIndex) => (
                    <div
                      key={questionIndex}
                      className={`border-b border-gray-100 last:border-b-0 ${
                        expandedQuestion?.category === categoryIndex && expandedQuestion?.question === questionIndex ? 'bg-green-50' : ''
                      }`}
                    >
                      <div
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-sm font-semibold text-gray-600">
                                {String(questionIndex + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <p className="text-gray-900 font-medium leading-relaxed">{faq.q}</p>
                          </div>
                          {expandedQuestion?.category === categoryIndex && expandedQuestion?.question === questionIndex ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </div>
                      {expandedQuestion?.category === categoryIndex && expandedQuestion?.question === questionIndex && (
                        <div className="px-6 pb-6">
                          <div className="pl-11">
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Masih Ada Pertanyaan?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Jika jawaban yang Ukhti cari tidak ada di atas, jangan ragu untuk menghubungi kami melalui WhatsApp atau official account MTI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/628123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-900 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Hubungi WhatsApp
                </a>
                <a
                  href="https://instagram.com/tikrarmti"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity duration-200"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                  Follow Instagram
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}