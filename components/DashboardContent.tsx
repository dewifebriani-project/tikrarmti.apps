'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Target, TrendingUp, Calendar, CheckCircle, Clock, Award, FileText, Star, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useActiveBatch } from '@/hooks/useBatches'
import { useDashboardStats } from '@/hooks/useDashboard'
import { useMyRegistrations } from '@/hooks/useRegistrations'
import { SWRLoadingFallback, SWRErrorFallback } from '@/lib/swr/providers'

export default function DashboardContent() {
  // NOTE: Authentication is now handled by server-side layout
  // No need for client-side auth checks or redirects
  const { user, isLoading } = useAuth()

  // SWR hooks for data fetching
  const { activeBatch, isLoading: batchLoading, error: batchError } = useActiveBatch()
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { registrations, isLoading: registrationsLoading } = useMyRegistrations()

  // Combined loading state
  // Note: User data is guaranteed by server layout, no need to check !user here
  const isPageLoading = isLoading || batchLoading || statsLoading || registrationsLoading

  // Calculate registration status from SWR data
  const hasRegistered = registrations.length > 0
  const registrationStatus = hasRegistered ? {
    registered: true,
    batchId: registrations[0]?.batch_id,
    status: registrations[0]?.status,
    daftarUlang: registrations[0]?.daftar_ulang
  } : { registered: false }

  // Helper function to convert day number to Indonesian day name
  const getDayNameFromNumber = (dayNum: number) => {
    const days = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']
    return days[dayNum] || `${dayNum}`
  }

  // Calculate stats with fallback
  // Total target hari = 13 pekan × 4 hari per pekan = 52 hari target
  const totalHariTarget = 13 * 4; // 52 hari total target

  const displayStats = {
    totalHariTarget: totalHariTarget,
    hariAktual: stats?.hariAktual || 0,
    persentaseProgress: stats?.persentaseProgress || 0
  }

  // Loading state - Consistent across all devices
  if (isPageLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome card skeleton */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-1/2 animate-pulse mt-2"></div>
          </CardHeader>
        </Card>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="h-7 sm:h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress card skeleton */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2.5 sm:space-y-3">
              <div className="h-1.5 sm:h-2 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-1.5 sm:h-2 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (batchError || statsError) {
    return (
      <div className="space-y-6">
        <SWRErrorFallback
          error={batchError || statsError || new Error('Failed to load dashboard data')}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  // Get welcome message
  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    const timeGreeting = hour < 12 ? "Shabahul Khayr" : hour < 18 ? "Masaa'ul Khayr" : "Masaa'ul Khayr"
    const displayName = user?.full_name || (user?.email ? user.email.split('@')[0] : null)
    const userName = displayName ? `Ukhti ${displayName}` : 'Ukhti'
    return `${timeGreeting}, ${userName}!`
  }

  // Convert Gregorian date to Hijri
  const toHijri = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'islamic-umalqura'
    }
    return new Intl.DateTimeFormat('id-ID', options).format(date)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Card - Consistent across all devices */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl text-green-800">
            Assalamu'alaikum, {getWelcomeMessage()}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-green-600">
            Selamat datang di dashboard Tikrar MTI Apps. Kelola pembelajaran dan progress hafalan Al-Qur'an Ukhti di sini.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Batch Announcement Card - Consistent across all devices */}
      {activeBatch && !hasRegistered && (
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-medium text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Pendaftaran {activeBatch.name} Sedang Dibuka!
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-orange-700">
              Program Tikrar Tahfidz MTI • Program Muallimah MTI • Program Musyrifah MTI
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-orange-700">
                Jangan lewatkan kesempatan untuk bergabung dengan batch ini. Kuota terbatas!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="font-medium text-orange-800">Tanggal Mulai:</span>
                  <p className="text-orange-700">
                    {new Date(activeBatch.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-orange-600 text-[10px] sm:text-xs italic">
                    {toHijri(new Date(activeBatch.start_date))}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-orange-800">Durasi:</span>
                  <p className="text-orange-700">{activeBatch.duration_weeks || 13} pekan</p>
                </div>
              </div>

              {activeBatch.total_quota && activeBatch.registered_count !== undefined && (
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="font-medium text-orange-800">Kuota Tersisa:</span>
                    <span className="text-orange-700">
                      {activeBatch.total_quota - activeBatch.registered_count} dari {activeBatch.total_quota}
                    </span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-1.5 sm:h-2">
                    <div
                      className="bg-orange-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((activeBatch.registered_count || 0) / activeBatch.total_quota) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button asChild className="flex-1 min-w-[160px] sm:min-w-[200px] bg-orange-600 hover:bg-orange-700 text-white h-10 sm:h-auto">
                  <Link href="/pendaftaran">
                    Daftar Sekarang
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Status Card - Consistent across all devices */}
      {hasRegistered && (
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-medium text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Status Pendaftaran: {registrationStatus.status === 'approved' ? 'Disetujui' : registrationStatus.status === 'pending' ? 'Menunggu Persetujuan' : 'Terdaftar'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-green-700">
              {registrationStatus.status === 'approved'
                ? 'Selamat! Pendaftaran Ukhti telah disetujui. Ukhti dapat mulai mengikuti program.'
                : registrationStatus.status === 'pending'
                ? 'Pendaftaran Ukhti sedang dalam proses review. Mohon tunggu persetujuan dari admin.'
                : 'Ukhti telah terdaftar dalam program ini.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link href="/perjalanan-saya">
                <Button className="bg-green-600 hover:bg-green-700 text-white h-10 sm:h-auto px-4 sm:px-6">
                  Lihat Perjalanan Saya
                </Button>
              </Link>
              <Link href="/pendaftaran">
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 h-10 sm:h-auto px-4 sm:px-6">
                  Program Lainnya
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class/Program Info Card - Show only if daftar ulang exists */}
      {registrationStatus.daftarUlang && (registrationStatus.daftarUlang.ujian_halaqah || registrationStatus.daftarUlang.tashih_halaqah) && (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-medium text-blue-800 flex items-center gap-2">
              <Award className="h-4 w-4 sm:h-5 sm:w-5" />
              Kelas & Program
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-blue-700">
              Kelas yang Ukuti ikuti berdasarkan daftar ulang
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {registrationStatus.daftarUlang.ujian_halaqah && (
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="text-xs sm:text-sm text-gray-600">Kelas Ujian</p>
                      <p className="font-medium text-sm sm:text-base text-blue-800">
                        {registrationStatus.daftarUlang.ujian_halaqah.name}
                      </p>
                      <p className="text-xs text-blue-600">
                        {getDayNameFromNumber(registrationStatus.daftarUlang.ujian_halaqah.day_of_week)}, {registrationStatus.daftarUlang.ujian_halaqah.start_time} - {registrationStatus.daftarUlang.ujian_halaqah.end_time}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {registrationStatus.daftarUlang.tashih_halaqah && (
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="flex items-start space-x-2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="text-xs sm:text-sm text-gray-600">Kelas Tashih</p>
                      <p className="font-medium text-sm sm:text-base text-purple-800">
                        {registrationStatus.daftarUlang.tashih_halaqah.name}
                      </p>
                      <p className="text-xs text-purple-600">
                        {getDayNameFromNumber(registrationStatus.daftarUlang.tashih_halaqah.day_of_week)}, {registrationStatus.daftarUlang.tashih_halaqah.start_time} - {registrationStatus.daftarUlang.tashih_halaqah.end_time}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats - Consistent across all devices */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-800 flex items-center gap-1.5 sm:gap-2">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Target Hari
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900">{displayStats.totalHariTarget}</div>
            <p className="text-[10px] sm:text-xs text-blue-700">Total target hari</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-800 flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Hari Aktual
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900">{displayStats.hariAktual}</div>
            <p className="text-[10px] sm:text-xs text-green-700">Hari yang sudah diselesaikan</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-800 flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900">{displayStats.persentaseProgress}%</div>
            <p className="text-[10px] sm:text-xs text-purple-700">Persentase penyelesaian</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Consistent across all devices */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Aksi Cepat</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Akses cepat ke fitur-fitur utama aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
            <Link href="/jurnal-harian">
              <Button variant="outline" className="w-full justify-start h-auto py-2.5 sm:py-3 px-3 sm:px-4">
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Jurnal Harian</span>
              </Button>
            </Link>
            <Link href="/tashih">
              <Button variant="outline" className="w-full justify-start h-auto py-2.5 sm:py-3 px-3 sm:px-4">
                <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Tashih</span>
              </Button>
            </Link>
            <Link href="/perjalanan-saya">
              <Button variant="outline" className="w-full justify-start h-auto py-2.5 sm:py-3 px-3 sm:px-4">
                <Award className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Progress</span>
              </Button>
            </Link>
            <Link href="/perjalanan-saya">
              <Button variant="outline" className="w-full justify-start h-auto py-2.5 sm:py-3 px-3 sm:px-4">
                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Perjalanan Saya</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity (placeholder for future implementation) - Consistent across all devices */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Aktivitas Terkini</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Aktivitas dan update terbaru Ukhti
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-3">
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-xs sm:text-sm">Belum ada aktivitas terkini</p>
              <p className="text-[10px] sm:text-xs mt-1">Aktivitas akan muncul di sini setelah Ukhti mulai menggunakan program</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
