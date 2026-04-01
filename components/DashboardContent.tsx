'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  FileText,
  ClipboardList,
  GraduationCap,
  Star,
  AlertCircle,
  Wallet,
  Settings,
  User,
  LayoutGrid,
  ChevronRight,
  Sparkles,
  MapPin
} from 'lucide-react'


import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useActiveBatch } from '@/hooks/useBatches'
import { useDashboardStats, useTashihStatus, useJurnalStatus } from '@/hooks/useDashboard'
import { useMyRegistrations } from '@/hooks/useRegistrations'
import { usePrayerTimes } from '@/hooks/usePrayerTimes'
import { SWRLoadingFallback, SWRErrorFallback } from '@/lib/swr/providers'
import { cn } from '@/lib/utils'
import { isStaff } from '@/lib/roles'

export default function DashboardContent() {
  // NOTE: Authentication is now handled by server-side layout
  // No need for client-side auth checks or redirects
  const { user, isLoading } = useAuth()
  
  const userRole = user?.primaryRole || 'calon_thalibah'
  const canSeeAdminStats = isStaff(userRole)

  // SWR hooks for data fetching
  const { activeBatch, isLoading: batchLoading, error: batchError } = useActiveBatch()
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats(canSeeAdminStats)
  const { registrations, isLoading: registrationsLoading } = useMyRegistrations()
  const { tashihStatus, isLoading: tashihLoading, error: tashihError, mutate: tashihMutate } = useTashihStatus()
  const { jurnalStatus, isLoading: jurnalLoading, error: jurnalError, mutate: jurnalMutate } = useJurnalStatus()
  const { 
    prayerTimes, 
    hijriDate, 
    gregorianDate, 
    locationName, 
    isLoading: prayersLoading,
    updateManualCity
  } = usePrayerTimes()

  const handleLocationChange = () => {
    const newCity = window.prompt('Masukkan nama kota Ukhti untuk jadwal shalat (contoh: Bogor, Bandung, Surabaya):', locationName === 'Memuat...' ? '' : locationName)
    if (newCity !== null) {
      updateManualCity(newCity.trim() || null)
    }
  }

  // Combined loading state
  // Note: Stats loading only matters if we are trying to fetch them
  const isPageLoading = isLoading || batchLoading || (canSeeAdminStats && statsLoading) || registrationsLoading

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

  const totalHariTarget = canSeeAdminStats ? (stats?.totalHariTarget || 0) : (jurnalStatus?.summary.total_blocks || 0)

  // If thalibah, we use their jurnal progress for the main stats display
  const displayStats = {
    totalHariTarget: totalHariTarget,
    hariAktual: canSeeAdminStats ? (stats?.hariAktual || 0) : (jurnalStatus?.summary.completed_blocks || 0),
    persentaseProgress: canSeeAdminStats 
      ? (stats?.persentaseProgress || 0) 
      : (jurnalStatus && (jurnalStatus.summary.total_blocks || 0) > 0 
          ? Math.round((jurnalStatus.summary.completed_blocks / jurnalStatus.summary.total_blocks) * 100) 
          : 0)
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

  const toGregorianLabel = () => {
    if (gregorianDate) return `${gregorianDate.day} ${gregorianDate.month} ${gregorianDate.year}`
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date())
  }

  const toHijriLabel = () => {
    if (hijriDate) return `${hijriDate.day} ${hijriDate.month} ${hijriDate.year} ${hijriDate.designation}`
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'islamic-umalqura'
    }
    return new Intl.DateTimeFormat('id-ID', options).format(new Date())
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeInUp pb-10">
      {/* Welcome Section - Premium Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900 to-green-800 p-6 sm:p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs font-medium">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span>Tikrar MTI Premium Hub</span>
              </div>
              
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold mb-1">
                  {getWelcomeMessage()}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-green-50/70 text-xs sm:text-sm font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{toGregorianLabel()}</span>
                  </div>
                  <div className="hidden sm:block text-green-50/30">|</div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400/50" />
                    <span>{toHijriLabel()}</span>
                  </div>
                  <button 
                    onClick={handleLocationChange}
                    className="flex items-center gap-1 text-green-200/60 ml-1 hover:text-white transition-colors group"
                    title="Klik untuk ganti lokasi"
                  >
                    <MapPin className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span className="border-b border-transparent group-hover:border-white/30">{locationName}</span>
                  </button>
                </div>
              </div>

              {/* Ultra-Compact Prayer Times Bar */}
              {prayersLoading ? (
                <div className="flex items-center gap-4 pt-2 animate-pulse">
                   <div className="h-4 w-12 bg-white/10 rounded-full" />
                   <div className="h-4 w-12 bg-white/10 rounded-full" />
                   <div className="h-4 w-12 bg-white/10 rounded-full" />
                </div>
              ) : prayerTimes ? (
                <div className="flex items-center gap-x-4 sm:gap-x-6 pt-3 overflow-x-auto scrollbar-hide">
                  {[
                    { label: 'Subuh', time: prayerTimes.Fajr },
                    { label: 'Dzuhur', time: prayerTimes.Dhuhr },
                    { label: 'Ashar', time: prayerTimes.Asr },
                    { label: 'Maghrib', time: prayerTimes.Maghrib },
                    { label: 'Isya', time: prayerTimes.Isha },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[8px] font-bold text-green-200/40 uppercase tracking-tighter">{p.label}</span>
                        <span className="text-sm font-black text-white tracking-tight">{p.time}</span>
                      </div>
                      {i < 4 && <div className="ml-1 h-4 w-px bg-white/10" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-green-200/40 italic pt-2">
                  Jadwal tidak tersedia
                </div>
              )}
            </div>
            
            <div className="hidden lg:block">
              <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col items-center justify-center shadow-xl">
                <p className="text-[10px] uppercase font-black text-green-200 tracking-widest">Pekan</p>
                <p className="text-4xl font-black">{Math.floor(displayStats.hariAktual / 4) + 1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-yellow-400/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-60 h-60 bg-green-400/10 rounded-full blur-3xl" />
      </div>


      {/* Batch Announcement - Modern Urgent Style */}
      {activeBatch && !hasRegistered && (
        <div className="group relative overflow-hidden rounded-3xl bg-white border border-orange-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 bg-gradient-to-br from-orange-500 to-orange-600 p-6 sm:p-8 text-white flex flex-col justify-center items-center text-center">
              <AlertCircle className="h-12 w-12 mb-4 animate-float" />
              <h2 className="text-xl font-bold mb-1">Pendaftaran Dibuka</h2>
              <p className="text-orange-100 text-sm">{activeBatch.name}</p>
            </div>
            <div className="md:w-2/3 p-6 sm:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Bergabung Sekarang</h3>
                  <p className="text-sm text-gray-500">Mulai langkah Ukhti menghafal Al-Qur'an dengan sistem Tikrar profesional.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tanggal Mulai</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(activeBatch.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Durasi</p>
                  <p className="text-sm font-semibold text-gray-800">{activeBatch.duration_weeks || 13} pekan</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button asChild className="flex-1 rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30 h-12">
                  <Link href="/pendaftaran" className="flex items-center justify-center gap-2">
                    Daftar Program <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
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
      {/* Tashih Progress Card - Simple Version */}
      {hasRegistered && tashihStatus && (
        <Card className="overflow-hidden border-none shadow-xl glass-premium">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-gray-900">
                    Progress Tashih
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs font-medium text-emerald-700">
                    Juz {tashihStatus.juz_info.juz_number} Part {tashihStatus.juz_info.part} ({tashihStatus.juz_info.name})
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg sm:text-xl font-black text-emerald-700">
                  {Math.round((tashihStatus.summary.completed_blocks / tashihStatus.summary.total_blocks) * 100)}%
                </p>
                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                  {tashihStatus.summary.completed_blocks} / {tashihStatus.summary.total_blocks} Blok
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 pt-1">
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(tashihStatus.summary.completed_blocks / tashihStatus.summary.total_blocks) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Jurnal Progress Card - Simple Version */}
      {hasRegistered && jurnalStatus && (
        <Card className="overflow-hidden border-none shadow-xl glass-premium">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-gray-900">
                    Progress Jurnal
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs font-medium text-purple-700">
                    Juz {jurnalStatus.juz_info.juz_number} Part {jurnalStatus.juz_info.part} ({jurnalStatus.juz_info.name})
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg sm:text-xl font-black text-purple-700">
                  {Math.round((jurnalStatus.summary.completed_blocks / jurnalStatus.summary.total_blocks) * 100)}%
                </p>
                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                  {jurnalStatus.summary.completed_blocks} / {jurnalStatus.summary.total_blocks} Blok
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 pt-1">
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(jurnalStatus.summary.completed_blocks / jurnalStatus.summary.total_blocks) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Services Access - Premium Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-green-700" />
            Menu Layanan
          </h2>
        </div>


        <div className="grid grid-cols-4 gap-2 sm:gap-6 w-full">
          {[
            // Row 1
            { label: 'Perjalanan Saya', icon: Clock, color: 'blue', href: '/perjalanan-saya' },
            { label: 'Catatan Tashih', icon: ClipboardList, color: 'emerald', href: '/tashih' },
            { label: 'Jurnal Harian', icon: BookOpen, color: 'indigo', href: '/jurnal-harian' },
            { label: 'Ujian Pekanan', icon: Calendar, color: 'amber', href: '/ujian' },
            // Row 2
            { label: 'Ujian Akhir', icon: Award, color: 'blue', href: '/ujian' },
            { label: 'Sertifikat', icon: CheckCircle, color: 'emerald', href: '/kelulusan-sertifikat' },
            { label: 'Infaq & Donasi', icon: Wallet, color: 'amber', href: '/tagihan-pembayaran' },
            { label: 'Alumni', icon: GraduationCap, color: 'purple', href: '/alumni' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="group min-w-0">
            <div className="h-full glass-premium rounded-2xl sm:rounded-3xl p-2 sm:p-4 border border-white hover:border-green-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center text-center justify-center min-h-[95px] sm:min-h-0">
                <div className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-3 transition-transform duration-300 group-hover:scale-110 shadow-sm flex-shrink-0",
                  item.color === 'blue' ? "bg-blue-50 text-blue-600 border border-blue-100/50" :
                  item.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" :
                  item.color === 'indigo' ? "bg-indigo-50 text-indigo-600 border border-indigo-100/50" :
                  item.color === 'amber' ? "bg-amber-50 text-amber-600 border border-amber-100/50" :
                  item.color === 'purple' ? "bg-purple-50 text-purple-600 border border-purple-100/50" :
                  "bg-gray-50 text-gray-600 border border-gray-100/50"
                )}>
                  <item.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-[10px] sm:text-xs lg:text-sm font-bold text-gray-900 leading-tight w-full px-0.5 break-words">
                  {item.label}
                </h3>
              </div>
            </Link>
          ))}
        </div>





      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-none shadow-xl overflow-hidden glass-premium">
          <CardHeader className="bg-gradient-to-br from-green-50 to-white/50 border-b border-green-50 px-6 py-5">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Statistik Hafalan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-3xl font-black text-green-900">{displayStats.hariAktual}</p>
                <p className="text-xs text-gray-500 font-medium">Hari Tikrar Selesai</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-400">{displayStats.totalHariTarget}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Target Total</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
               <div
                className="bg-gradient-to-r from-green-600 to-green-400 h-full transition-all duration-1000 ease-out"
                style={{ width: `${displayStats.persentaseProgress}%` }}
               />
            </div>
            <p className="mt-3 text-[11px] text-gray-400 italic text-center">
              "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya."
            </p>
          </CardContent>
        </Card>

        {/* Quick Links Card */}
        <Card className="rounded-3xl border-none shadow-xl overflow-hidden glass-premium">
          <CardHeader className="bg-gradient-to-br from-blue-50 to-white/50 border-b border-blue-50 px-6 py-5">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Akses Cepat Jurnal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Link href="/jurnal-harian" className="block">
                <Button className="w-full rounded-2xl bg-green-800 hover:bg-green-900 h-12 flex items-center justify-between px-6">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5" />
                    <span>Isi Jurnal Hari Ini</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Button>
              </Link>
              <Link href="/perjalanan-saya" className="block">
                <Button variant="outline" className="w-full rounded-2xl border-gray-200 hover:bg-gray-50 h-12 flex items-center justify-between px-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span>Riwayat Tikrar</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-30" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>


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
