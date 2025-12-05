'use client'

import React from 'react'
import { CheckCircle2, Circle, Calendar, Clock, Award, BookOpen, Users, GraduationCap } from 'lucide-react'

interface JourneyStep {
  id: string
  title: string
  description: string
  dateRange: string
  hijriDate?: string
  icon: React.ReactNode
  status: 'completed' | 'active' | 'upcoming'
  isHighlighted?: boolean
}

const PerjalananProgram = () => {
  const today = new Date()

  // Tentukan status berdasarkan tanggal saat ini
  const getStepStatus = (startDate: Date, endDate: Date): 'completed' | 'active' | 'upcoming' => {
    if (today >= startDate && today <= endDate) {
      return 'active'
    } else if (today > endDate) {
      return 'completed'
    } else {
      return 'upcoming'
    }
  }

  // Data perjalanan program dengan tanggal aktual
  const journeySteps: JourneyStep[] = [
    {
      id: 'registration',
      title: 'Mendaftar Program',
      description: 'Pendaftaran awal program tahfidz dan pengumpulan dokumen persyaratan.',
      dateRange: '06 - 13 Desember 2025',
      hijriDate: '13 - 20 Jumadil Akhir 1447 H',
      icon: <Calendar className="w-5 h-5" />,
      status: getStepStatus(
        new Date(2025, 11, 6),  // 6 Desember 2025
        new Date(2025, 11, 13)  // 13 Desember 2025
      ),
      isHighlighted: true
    },
    {
      id: 'selection',
      title: 'Seleksi Program',
      description: 'Mengirimkan Voice Note dan Test Hafalan Pilihan Ganda',
      dateRange: '06 - 13 Desember 2025',
      hijriDate: '13 - 20 Jumadil Akhir 1447 H',
      icon: <Users className="w-5 h-5" />,
      status: getStepStatus(
        new Date(2025, 11, 6),   // 6 Desember 2025
        new Date(2025, 11, 13)   // 13 Desember 2025
      ),
      isHighlighted: true
    },
    {
      id: 'graduation',
      title: 'Lulus Seleksi',
      description: 'Melalui proses seleksi tes hafalan dan wawancara dengan sanad.',
      dateRange: '14 Desember 2025',
      hijriDate: '21 Jumadil Akhir 1447 H',
      icon: <CheckCircle2 className="w-5 h-5" />,
      status: getStepStatus(
        new Date(2025, 11, 14),  // 14 Desember 2025
        new Date(2025, 11, 14)   // 14 Desember 2025
      ),
      isHighlighted: true
    },
    {
      id: 're-registration',
      title: 'Mendaftar Ulang',
      description: 'Konfirmasi keikutsertaan.',
      dateRange: '15 Desember 2025',
      hijriDate: '22 Jumadil Akhir 1447 H',
      icon: <Calendar className="w-5 h-5" />,
      status: getStepStatus(
        new Date(2025, 11, 15),  // 15 Desember 2025
        new Date(2025, 11, 15)   // 15 Desember 2025
      ),
      isHighlighted: false
    },
    {
      id: 'start-program',
      title: 'Memulai Program',
      description: 'Awal resmi program tahfidz dengan orientasi dan penentuan target.',
      dateRange: '05 Januari 2026',
      hijriDate: '07 Rajab 1447 H',
      icon: <BookOpen className="w-5 h-5" />,
      status: getStepStatus(
        new Date(2026, 0, 5),    // 5 Januari 2026
        new Date(2026, 0, 5)     // 5 Januari 2026
      ),
      isHighlighted: false
    },
    {
      id: 'learning-process',
      title: 'Proses Pembelajaran',
      description: 'Sedang berada dalam tahapan intensifikasi hafalan dan rutinitas harian.',
      dateRange: '11 pekan dari memulai program',
      hijriDate: 'Durasi Batch 2',
      icon: <Clock className="w-5 h-5" />,
      status: getStepStatus(
        new Date(2026, 0, 5),    // 5 Januari 2026
        new Date(2026, 2, 21)    // 21 Maret 2026
      ),
      isHighlighted: false
    },
    {
      id: 'final-exam',
      title: 'Ujian Akhir',
      description: 'Ujian komprehensif hafalan seluruh juz dengan murojaah sanad.',
      dateRange: '12 pekan dari pertama kelas (set dinamis)',
      hijriDate: '19 Rajab 1447 H',
      icon: <Users className="w-5 h-5" />,
      status: getStepStatus(
        new Date(2026, 2, 22),   // 22 Maret 2026
        new Date(2026, 2, 22)    // 22 Maret 2026
      ),
      isHighlighted: false
    },
    {
      id: 'graduation-ceremony',
      title: 'Wisuda & Kelulusan',
      description: 'Acara wisuda dan penyerahan sertifikat kelulusan program tahfidz.',
      dateRange: '1 pekan setelah ujian akhir',
      hijriDate: '26 Rajab 1447 H',
      icon: <GraduationCap className="w-5 h-5" />,
      status: getStepStatus(
        new Date(2026, 2, 29),   // 29 Maret 2026
        new Date(2026, 2, 29)    // 29 Maret 2026
      ),
      isHighlighted: false
    },
    {
      id: 'receive-syahadah',
      title: 'Menerima Syahadah',
      description: 'Penyerahan resmi syahadah dan sanad untuk membimbing tahfidz.',
      dateRange: '14 pekan setelah wisudah',
      hijriDate: '10 Sya\'ban 1447 H',
      icon: <Award className="w-5 h-5" />,
      status: getStepStatus(
        new Date(2026, 3, 26),   // 26 April 2026
        new Date(2026, 3, 26)    // 26 April 2026
      ),
      isHighlighted: false
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />
      case 'active':
        return <div className="relative">
          <Circle className="w-6 h-6 text-blue-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      case 'upcoming':
        return <Circle className="w-6 h-6 text-gray-400" />
      default:
        return <Circle className="w-6 h-6 text-gray-400" />
    }
  }

  const getStepStyle = (step: JourneyStep) => {
    if (step.status === 'active' || step.isHighlighted) {
      return {
        card: 'bg-blue-50 border-2 border-blue-300 shadow-lg transform scale-105',
        title: 'text-blue-900',
        description: 'text-blue-800',
        date: 'text-blue-700 font-semibold',
        line: 'bg-blue-300'
      }
    } else if (step.status === 'completed') {
      return {
        card: 'bg-green-50 border border-green-200',
        title: 'text-green-900',
        description: 'text-green-800',
        date: 'text-green-700',
        line: 'bg-green-300'
      }
    } else {
      return {
        card: 'bg-white border border-gray-200',
        title: 'text-gray-900',
        description: 'text-gray-700',
        date: 'text-gray-600',
        line: 'bg-gray-300'
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-green-900 mb-4">
            Perjalanan Program Tikrar MTI
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Ikuti perjalanan transformasi hafalan Al-Qur'an Anda dalam program Tikrar MTI Batch 2
          </p>
        </div>

        {/* Current Date Indicator */}
        <div className="mb-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-700" />
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-900">
                {today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {journeySteps.map((step, index) => {
            const styles = getStepStyle(step)

            return (
              <div key={step.id} className="relative">
                {/* Timeline Line */}
                {index < journeySteps.length - 1 && (
                  <div className={`absolute left-8 top-16 w-0.5 h-24 md:h-20 lg:h-16 ${styles.line}`} />
                )}

                {/* Step Card */}
                <div className={`relative flex items-start space-x-6 ${step.status === 'active' ? 'z-10' : ''}`}>
                  {/* Status Icon */}
                  <div className={`flex-shrink-0 rounded-full p-2 ${
                    step.status === 'active' ? 'bg-blue-100' :
                    step.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {getStatusIcon(step.status)}
                  </div>

                  {/* Content Card */}
                  <div className={`flex-1 p-6 rounded-xl border-2 transition-all duration-300 ${styles.card}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Title */}
                        <h3 className={`text-2xl font-bold mb-3 flex items-center ${styles.title}`}>
                          {step.icon}
                          <span className="ml-3">{step.title}</span>
                          {step.status === 'active' && (
                            <span className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-full animate-pulse">
                              Aktif
                            </span>
                          )}
                        </h3>

                        {/* Description */}
                        <p className={`text-lg mb-4 ${styles.description}`}>
                          {step.description}
                        </p>

                        {/* Date Information */}
                        <div className="space-y-1">
                          <p className={`text-base ${styles.date}`}>
                            <span className="font-medium">Tanggal Masehi:</span> {step.dateRange}
                          </p>
                          {step.hijriDate && (
                            <p className={`text-base ${styles.date}`}>
                              <span className="font-medium">Tanggal Hijriah:</span> {step.hijriDate}
                            </p>
                          )}
                        </div>

                        {/* Additional Info for Active Step */}
                        {step.status === 'active' && (
                          <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-300">
                            <p className="text-sm text-blue-800">
                              <strong>Sedang Berlangsung:</strong> Saat ini Anda berada di tahap {step.title.toLowerCase()}.
                              Pastikan untuk menyelesaikan semua persyaratan pada tahap ini.
                            </p>
                          </div>
                        )}

                        {/* Additional Info for Completed Step */}
                        {step.status === 'completed' && (
                          <div className="mt-4 p-4 bg-green-100 rounded-lg border border-green-300">
                            <p className="text-sm text-green-800">
                              <strong>Selesai:</strong> Tahap ini telah dilalui.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Notes */}
        <div className="mt-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Catatan Penting</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-purple-800">Durasi Program</h3>
              <ul className="space-y-2 text-purple-700">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Total durasi: 13 pekan dari mulai program hingga wisuda</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Libur Lebaran: 16-28 Februari 2026</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Syahadah diterima 14 hari setelah wisuda</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-purple-800">Tips Sukses</h3>
              <ul className="space-y-2 text-purple-700">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Persiapkan diri dengan baik untuk setiap tahapan</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Jaga konsistensi dan komitmen selama program</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Ikuti semua arahan dari tim MTI</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <p className="text-gray-700 mb-2">Butuh bantuan atau informasi lebih lanjut?</p>
            <p className="text-lg font-semibold text-green-700">
              Hubungi Kak Mara: <span className="text-blue-600">0813-1365-0842</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerjalananProgram