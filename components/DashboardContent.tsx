'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Target, TrendingUp, Calendar, CheckCircle, Clock, Award, FileText, Star, AlertCircle, Bug } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useActiveBatch } from '@/hooks/useBatches'
import { useDashboardStats, useTashihStatus } from '@/hooks/useDashboard'
import { useMyRegistrations } from '@/hooks/useRegistrations'
import { SWRLoadingFallback, SWRErrorFallback } from '@/lib/swr/providers'
import { cn } from '@/lib/utils'

export default function DashboardContent() {
  // NOTE: Authentication is now handled by server-side layout
  // No need for client-side auth checks or redirects
  const { user, isLoading } = useAuth()

  // Debug state
  const [showDebug, setShowDebug] = useState(false)
  const [loginDebugInfo, setLoginDebugInfo] = useState<any>(null)

  // Load debug info from localStorage on mount
  useEffect(() => {
    try {
      const debugInfo = localStorage.getItem('loginDebugInfo')
      if (debugInfo) {
        setLoginDebugInfo(JSON.parse(debugInfo))
      }
    } catch (error) {
      console.error('[Dashboard Debug] Error reading localStorage:', error)
    }
  }, [])

  // SWR hooks for data fetching
  const { activeBatch, isLoading: batchLoading, error: batchError } = useActiveBatch()
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { registrations, isLoading: registrationsLoading } = useMyRegistrations()
  const { tashihStatus, isLoading: tashihLoading, error: tashihError, mutate: tashihMutate } = useTashihStatus()

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

  // Debug logging for tashih status
  useEffect(() => {
    console.log('[Dashboard] tashihStatus:', {
      hasRegistered,
      hasTashihStatus: !!tashihStatus,
      isLoading: tashihLoading,
      error: tashihError,
      registrationsCount: registrations.length
    })
  }, [hasRegistered, tashihStatus, tashihLoading, tashihError, registrations.length])

  // Helper function to convert day number to Indonesian day name
  const getDayNameFromNumber = (dayNum: number | string | undefined) => {
    const days = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']
    if (dayNum === undefined) return ''
    const num = typeof dayNum === 'string' ? parseInt(dayNum) : dayNum
    return days[num] || `${dayNum}`
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

      {/* Tashih Progress Card - Show for active thalibah */}
      {hasRegistered && tashihStatus && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-emerald-800">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                Progress Tashih
              </CardTitle>
              <Link href="/tashih">
                <Button variant="outline" size="sm" className="text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  Buka Halaman Tashih
                </Button>
              </Link>
            </div>
            <CardDescription className="text-xs sm:text-sm text-emerald-700">
              Juz {tashihStatus.juz_info.juz_number} Part {tashihStatus.juz_info.part} ({tashihStatus.juz_info.name})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-800">{tashihStatus.summary.total_blocks}</div>
                <div className="text-[10px] sm:text-xs text-blue-600">Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-800">{tashihStatus.summary.completed_blocks}</div>
                <div className="text-[10px] sm:text-xs text-green-600">Selesai</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-amber-800">{tashihStatus.summary.pending_blocks}</div>
                <div className="text-[10px] sm:text-xs text-amber-600">Pending</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-800">
                  {Math.round((tashihStatus.summary.completed_blocks / tashihStatus.summary.total_blocks) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 sm:h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(tashihStatus.summary.completed_blocks / tashihStatus.summary.total_blocks) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Debug Panel - Toggle Button */}
      <div className="text-center">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto"
        >
          <Bug className="w-3 h-3" />
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>

      {/* Debug Panel - Login Error Info */}
      {showDebug && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-400 flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Login Debug Info
              </CardTitle>
              <div className="flex gap-2">
                {loginDebugInfo && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('loginDebugInfo')
                      setLoginDebugInfo(null)
                    }}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                >
                  Refresh
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loginDebugInfo ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-400">
                  <span className="font-bold text-green-400">Timestamp:</span> {loginDebugInfo.timestamp}
                </div>
                <div className="text-xs text-gray-400">
                  <span className="font-bold text-green-400">Email:</span> {loginDebugInfo.email}
                </div>
                <div className="text-xs text-gray-400">
                  <span className="font-bold text-green-400">User ID:</span> {loginDebugInfo.userId}
                </div>

                {loginDebugInfo.userError && (
                  <div className="mt-3 p-2 bg-red-900/30 border border-red-700 rounded">
                    <div className="text-xs font-bold text-red-400 mb-1">Error Details:</div>
                    <div className="text-xs text-red-300 space-y-1">
                      <div><span className="font-bold">Code:</span> {loginDebugInfo.userErrorCode}</div>
                      <div><span className="font-bold">Message:</span> {loginDebugInfo.userErrorMessage}</div>
                      {loginDebugInfo.userErrorDetails && (
                        <div><span className="font-bold">Details:</span> {JSON.stringify(loginDebugInfo.userErrorDetails)}</div>
                      )}
                      {loginDebugInfo.userErrorHint && (
                        <div><span className="font-bold">Hint:</span> {loginDebugInfo.userErrorHint}</div>
                      )}
                    </div>
                  </div>
                )}

                {loginDebugInfo.userData && (
                  <div className="mt-3 p-2 bg-green-900/30 border border-green-700 rounded">
                    <div className="text-xs font-bold text-green-400 mb-1">User Data:</div>
                    <pre className="text-xs text-green-300 overflow-auto max-h-40 whitespace-pre-wrap">
                      {JSON.stringify(loginDebugInfo.userData, null, 2)}
                    </pre>
                  </div>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(loginDebugInfo, null, 2))
                    alert('Debug info copied to clipboard')
                  }}
                  className="mt-2 w-full text-xs bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded"
                >
                  Copy Debug Info
                </button>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-xs">
                No debug info available. Login debug info is stored in localStorage when you log in.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Panel - Tashih Status */}
      {showDebug && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Tashih Status Debug
              </CardTitle>
              <button
                onClick={() => tashihMutate?.()}
                className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded"
              >
                Refresh
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">hasRegistered:</div>
                <div className={hasRegistered ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {hasRegistered ? "TRUE" : "FALSE"}
                </div>

                <div className="text-gray-400">registrationsCount:</div>
                <div className="text-white font-bold">{registrations.length}</div>

                <div className="text-gray-400">hasTashihStatus:</div>
                <div className={tashihStatus ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {tashihStatus ? "TRUE" : "FALSE"}
                </div>

                <div className="text-gray-400">isLoading:</div>
                <div className={tashihLoading ? "text-amber-400 font-bold" : "text-gray-500"}>
                  {tashihLoading ? "TRUE" : "FALSE"}
                </div>

                <div className="text-gray-400">isError:</div>
                <div className={tashihError ? "text-red-400 font-bold" : "text-gray-500"}>
                  {tashihError ? "TRUE" : "FALSE"}
                </div>
              </div>

              {registrations.length > 0 && (
                <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded">
                  <div className="text-xs font-bold text-blue-400 mb-1">First Registration:</div>
                  <div className="text-xs text-blue-300 space-y-1">
                    <div><span className="font-bold">ID:</span> {registrations[0]?.id}</div>
                    <div><span className="font-bold">Status:</span> {registrations[0]?.status}</div>
                    <div><span className="font-bold">Batch ID:</span> {registrations[0]?.batch_id}</div>
                    <div><span className="font-bold">Chosen Juz:</span> {(registrations[0] as any)?.chosen_juz || 'null'}</div>
                    <div><span className="font-bold">Confirmed Juz (daftar_ulang):</span> {registrations[0]?.daftar_ulang?.confirmed_chosen_juz || 'null'}</div>
                  </div>
                </div>
              )}

              {tashihStatus && (
                <div className="mt-3 p-2 bg-green-900/30 border border-green-700 rounded">
                  <div className="text-xs font-bold text-green-400 mb-1">Tashih Status Data:</div>
                  <div className="text-xs text-green-300 space-y-1">
                    <div><span className="font-bold">Juz Code:</span> {tashihStatus.juz_code}</div>
                    <div><span className="font-bold">Juz Number:</span> {tashihStatus.juz_info.juz_number} Part {tashihStatus.juz_info.part}</div>
                    <div><span className="font-bold">Total Blocks:</span> {tashihStatus.summary.total_blocks}</div>
                    <div><span className="font-bold">Completed:</span> {tashihStatus.summary.completed_blocks}</div>
                    <div><span className="font-bold">Pending:</span> {tashihStatus.summary.pending_blocks}</div>
                  </div>
                </div>
              )}

              {tashihError && (
                <div className="mt-3 p-2 bg-red-900/30 border border-red-700 rounded">
                  <div className="text-xs font-bold text-red-400 mb-1">Error:</div>
                  <div className="text-xs text-red-300">
                    {String(tashihError)}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  const debugData = {
                    hasRegistered,
                    registrationsCount: registrations.length,
                    firstRegistration: registrations[0],
                    hasTashihStatus: !!tashihStatus,
                    tashihLoading,
                    tashihError: tashihError ? String(tashihError) : null,
                    tashihStatus: tashihStatus
                  }
                  navigator.clipboard.writeText(JSON.stringify(debugData, null, 2))
                  alert('Tashih debug info copied to clipboard')
                }}
                className="mt-2 w-full text-xs bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded"
              >
                Copy Tashih Debug
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
