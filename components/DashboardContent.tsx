'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
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
  MapPin,
  UserX,
  AlertTriangle,
  Lock
} from 'lucide-react'


import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useActiveBatch } from '@/hooks/useBatches'
import { useDashboardStats, useTashihStatus, useJurnalStatus } from '@/hooks/useDashboard'
import { useMyRegistrations } from '@/hooks/useRegistrations'
import { usePrayerTimes } from '@/hooks/usePrayerTimes'
import { SWRLoadingFallback, SWRErrorFallback } from '@/lib/swr/providers'
import { cn } from '@/lib/utils'
import { isStaff } from '@/lib/roles'
import { FinalExamPortalModal } from '@/components/dashboard/FinalExamPortalModal'

export default function DashboardContent() {
  // NOTE: Authentication is now handled by server-side layout
  // No need for client-side auth checks or redirects
  const { user, isLoading } = useAuth()
  const { push } = useRouter()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('user_id')
  
  const userRole = user?.primaryRole || 'calon_thalibah'
  const canSeeAdminStats = isStaff(userRole)
  const isImpersonating = !!(targetUserId && userRole === 'admin')

  // SWR hooks for data fetching
  const { activeBatch, isLoading: batchLoading, error: batchError } = useActiveBatch()
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats(canSeeAdminStats)
  const { registrations, isLoading: registrationsLoading } = useMyRegistrations(targetUserId || undefined)
  const { tashihStatus, isLoading: tashihLoading, error: tashihError, mutate: tashihMutate } = useTashihStatus(targetUserId || undefined)
  const { jurnalStatus, isLoading: jurnalLoading, error: jurnalError, mutate: jurnalMutate } = useJurnalStatus(targetUserId || undefined)
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
  
  const [activitiesPage, setActivitiesPage] = useState(1)
  const [examModalOpen, setExamModalOpen] = useState(false)
  const activitiesPerPage = 5

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

  const totalHariTarget = (jurnalStatus?.summary.total_blocks || (canSeeAdminStats ? stats?.totalHariTarget : 0) || 0)

  // If thalibah info exists, we prioritize it for the main stats display
  const displayStats = {
    totalHariTarget: totalHariTarget,
    hariAktual: (jurnalStatus?.summary.completed_blocks || (canSeeAdminStats ? stats?.hariAktual : 0) || 0),
    persentaseProgress: (jurnalStatus && (jurnalStatus.summary.total_blocks || 0) > 0)
      ? Math.round((jurnalStatus.summary.completed_blocks / jurnalStatus.summary.total_blocks) * 100)
      : (canSeeAdminStats ? stats?.persentaseProgress : 0) || 0
  }

  // Get welcome theme based on time
  const welcomeTheme = React.useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 11) {
      return {
        greeting: "Shabahul Khayr",
        gradient: "from-emerald-600 via-green-500 to-teal-400",
        icon: <Sunrise className="w-10 h-10 text-yellow-300 animate-pulse" />,
        label: "Pagi",
        ring: "ring-emerald-400/30"
      }
    } else if (hour >= 11 && hour < 15) {
      return {
        greeting: "Naharakum Sa'id",
        gradient: "from-blue-500 via-green-500 to-sky-400",
        icon: <Sun className="w-10 h-10 text-yellow-200 animate-spin-slow" />,
        label: "Siang",
        ring: "ring-blue-400/30"
      }
    } else if (hour >= 15 && hour < 18) {
      return {
        greeting: "Masaa'ul Khayr",
        gradient: "from-orange-500 via-green-600 to-amber-500",
        icon: <Sunset className="w-10 h-10 text-orange-200" />,
        label: "Sore",
        ring: "ring-orange-400/30"
      }
    } else {
      return {
        greeting: "Lailatukum Sa'idah",
        gradient: "from-indigo-950 via-slate-900 to-green-950",
        icon: <Moon className="w-10 h-10 text-blue-200 animate-twinkle" />,
        label: "Malam",
        ring: "ring-indigo-500/30"
      }
    }
  }, [])

  // Combined Recent Activity
  const recentActivity = React.useMemo(() => {
    // If Admin/Staff, show system-wide active
    if (canSeeAdminStats && stats?.recentActivity) {
      return stats.recentActivity.map(a => ({
        id: a.id,
        type: a.type,
        title: a.description,
        date: new Date(a.timestamp),
        icon: a.type === 'registration' ? GraduationCap : a.type === 'approval' ? CheckCircle : Calendar,
        color: a.type === 'registration' ? 'text-blue-500' : a.type === 'approval' ? 'text-emerald-500' : 'text-amber-500',
        user: a.user?.name
      }))
    }

    // Student activities
    const activities: any[] = []
    
    // Add Tashih activities
    if (tashihStatus?.blocks) {
      const completedTashih = tashihStatus.blocks
        .filter(b => b.is_completed && b.tashih_date)
        .sort((a, b) => new Date(b.tashih_date!).getTime() - new Date(a.tashih_date!).getTime())
        .slice(0, 3)
      
      completedTashih.forEach(b => {
        activities.push({
          type: 'tashih',
          title: `Tashih Selesai: ${b.block_code}`,
          date: new Date(b.tashih_date!),
          icon: CheckCircle,
          color: 'text-emerald-500'
        })
      })
    }

    // Add Jurnal activities
    if (jurnalStatus?.blocks) {
      const completedJurnal = jurnalStatus.blocks
        .filter(b => b.is_completed && b.jurnal_date)
        .sort((a, b) => new Date(b.jurnal_date!).getTime() - new Date(a.jurnal_date!).getTime())
        .slice(0, 3)
      
      completedJurnal.forEach(b => {
        activities.push({
          type: 'jurnal',
          title: `Input Jurnal: ${b.block_code}`,
          date: new Date(b.jurnal_date!),
          icon: BookOpen,
          color: 'text-blue-500'
        })
      })
    }

    return activities.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [canSeeAdminStats, stats, tashihStatus, jurnalStatus])

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

  const isDropout = registrationStatus.registered && registrationStatus.status === 'dropout';

  if (isDropout) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full border-rose-100 shadow-2xl shadow-rose-900/10 rounded-[2.5rem] overflow-hidden">
          <div className="bg-rose-600 h-2 w-full" />
          <CardContent className="p-10 text-center space-y-6">
            <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-rose-100 animate-bounce-slow">
              <UserX className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Afwan Ukhti,</h2>
              <p className="text-gray-500 font-medium leading-relaxed">
                Status antum saat ini adalah <span className="text-rose-600 font-black">Dropout (DO)</span> sehingga tidak dapat mengikuti kegiatan Tikrar MTI Batch ini.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/pendaftaran">
                <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-6 rounded-2xl shadow-lg shadow-rose-900/20 transition-all border-b-4 border-rose-800 active:border-b-0 active:translate-y-1">
                  Hubungi Admin / Cek Pendaftaran
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeInUp pb-10">
      {/* Welcome Section - Premium Glassmorphism */}
      <div className={cn(
        "relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-2xl transition-all duration-700 bg-gradient-to-br ring-4",
        welcomeTheme.gradient,
        welcomeTheme.ring
      )}>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs font-bold ring-1 ring-white/20">
                {welcomeTheme.icon}
                <span className="tracking-[0.2em] uppercase">{welcomeTheme.label} di Tikrar MTI Apps</span>
              </div>
              
              <div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black mb-2 tracking-tight">
                  {welcomeTheme.greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">{user?.full_name?.split(' ')[0] || 'Ukhti'}!</span>
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/80 text-xs sm:text-sm font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 opacity-70" />
                    <span>{toGregorianLabel()}</span>
                  </div>
                  <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>{toHijriLabel()}</span>
                  </div>
                  <button 
                    onClick={handleLocationChange}
                    className="flex items-center gap-1.5 text-white/90 bg-white/10 px-3 py-1 rounded-full border border-white/10 hover:bg-white/20 transition-all group lg:ml-4"
                    title="Klik untuk ganti lokasi"
                  >
                    <MapPin className="w-4 h-4 text-green-300 group-hover:scale-110 transition-transform" />
                    <span className="font-bold tracking-tight">{locationName}</span>
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
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">{p.label}</span>
                        <span className="text-sm font-black text-white tracking-tight">{p.time}</span>
                      </div>
                      {i < 4 && <div className="ml-1 h-4 w-px bg-white/10" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-white/40 italic pt-2">
                  Jadwal tidak tersedia
                </div>
              )}
            </div>
            
            <div className="hidden lg:block">
              <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col items-center justify-center shadow-xl">
                <p className="text-[10px] uppercase font-black text-white/60 tracking-widest">Pekan</p>
                <p className="text-4xl font-black">{Math.floor(displayStats.hariAktual / 4) + 1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-60 h-60 bg-black/10 rounded-full blur-3xl" />
      </div>


      {/* SP Warning Banner */}
      {!canSeeAdminStats && jurnalStatus?.summary?.sp_summary && (
        <div className={cn(
          "relative overflow-hidden rounded-[2rem] p-6 shadow-2xl border-l-8 animate-fadeIn",
          jurnalStatus.summary.sp_summary.sp_level === 3 ? "bg-rose-50 border-rose-600 shadow-rose-950/5" :
          jurnalStatus.summary.sp_summary.sp_level === 2 ? "bg-orange-50 border-orange-500 shadow-orange-950/5" :
          "bg-amber-50 border-amber-400 shadow-amber-950/5"
        )}>
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
              jurnalStatus.summary.sp_summary.sp_level === 3 ? "bg-rose-600 text-white" :
              jurnalStatus.summary.sp_summary.sp_level === 2 ? "bg-orange-500 text-white" :
              "bg-amber-400 text-yellow-900"
            )}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  jurnalStatus.summary.sp_summary.sp_level === 3 ? "bg-rose-600 text-white" :
                  jurnalStatus.summary.sp_summary.sp_level === 2 ? "bg-orange-500 text-white" :
                  "bg-amber-400 text-yellow-900"
                )}>
                  Peringatan Level {jurnalStatus.summary.sp_summary.sp_level}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/50 px-2 py-1 rounded-full border border-gray-100">
                  Diterbitkan Pekan {jurnalStatus.summary.sp_summary.week_number}
                </span>
              </div>
              <h3 className={cn(
                "text-xl font-black mb-1 leading-tight",
                jurnalStatus.summary.sp_summary.sp_level === 3 ? "text-rose-900" :
                jurnalStatus.summary.sp_summary.sp_level === 2 ? "text-orange-950" :
                "text-amber-950"
              )}>
                {jurnalStatus.summary.sp_summary.sp_type === 'permanent_do' ? 'Status: Drop Out Permanen' :
                 jurnalStatus.summary.sp_summary.sp_type === 'temporary_do' ? 'Status: Drop Out Sementara' :
                 jurnalStatus.summary.sp_summary.sp_level === 3 ? 'Peringatan Terakhir (SP 3)' :
                 `Perlu Perhatian: Surat Peringatan ${jurnalStatus.summary.sp_summary.sp_level}`}
              </h3>
              <p className="text-sm font-medium text-gray-600 max-w-2xl">
                Alasan: <span className="font-bold text-gray-900">"{jurnalStatus.summary.sp_summary.reason}"</span>. 
                {jurnalStatus.summary.sp_summary.sp_type ? " Ukhti telah dinonaktifkan dari program ini secara sistem." : " Mohon segera hubungi Musyrifah Ukhti untuk koordinasi lebih lanjut agar progres hafalan tetap terjaga."}
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/30 rounded-full blur-3xl opacity-50" />
        </div>
      )}

      {/* 2. Progress Jurnal & Tashih */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
      </div>

      {/* 3. Statistik Hafalan */}
      <div className="grid grid-cols-1 gap-6">
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
          </CardContent>
        </Card>
      </div>

      {/* 4. Ayat & Hadits Motivasi */}
      <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-gradient-to-br from-green-900 to-green-800 text-white">
        <CardContent className="p-8 text-center space-y-6 relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none overflow-hidden">
             <BookOpen className="w-64 h-64 -ml-20 -mt-20 rotate-12" />
             <Sparkles className="w-32 h-32 absolute top-10 right-10" />
          </div>
          
          <div className="space-y-2">
            <p className="text-xl sm:text-2xl font-serif italic leading-relaxed">
              "Dan sesungguhnya telah Kami mudahkan Al-Quran untuk pelajaran, maka adakah orang yang mengambil pelajaran?"
            </p>
            <p className="text-xs uppercase tracking-widest font-bold text-green-300">QS. Al-Qamar: 17</p>
          </div>

          <div className="w-12 h-px bg-white/20 mx-auto" />

          <div className="space-y-2">
            <p className="text-sm sm:text-base font-medium text-green-100">
              "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya."
            </p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-yellow-400">HR. Bukhari</p>
          </div>
        </CardContent>
      </Card>

      {/* 5. Menu Layanan */}
      <div className="space-y-4">
        {isImpersonating && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-400 mr-2" />
              <span className="text-amber-800 font-medium">
                Mode Preview: Melihat Dashboard Thalibah (ID: {targetUserId})
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-amber-600 hover:text-amber-800"
              onClick={() => push('/dashboard')}
            >
              Keluar Preview
            </Button>
          </div>
        )}

        {/* Muallimah Registration CTA */}
        {(() => {
          const isAdmin = userRole === 'admin' || user?.roles?.includes('admin');
          const showCard = isAdmin || !isStaff(user?.roles || userRole);
          return showCard;
        })() && (
          <div className="mb-8">
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-green-900/10 overflow-hidden bg-gradient-to-br from-white to-green-50 ring-1 ring-green-100/50">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">
                  <div className="w-full md:w-1/3 bg-gradient-to-br from-green-700 to-green-900 p-8 flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 ring-1 ring-white/20 shadow-xl">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-black tracking-[0.3em] text-green-300 mb-1">Recruitment</p>
                      <h3 className="text-xl font-black">Muallimah MTI</h3>
                    </div>
                  </div>
                  <div className="flex-1 p-8 md:p-10 flex flex-col justify-center space-y-6">
                    <div className="space-y-3">
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                        Siap Menjadi Bagian dari <span className="text-green-700">Pendidik Al-Qur'an?</span>
                      </h2>
                      <p className="text-sm font-medium text-gray-500 leading-relaxed">
                        Bergabunglah menjadi Muallimah Markaz Tikrar Indonesia. Bagikan ilmu Ukhti dan raih pahala jariyah.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <Link href="/pendaftaran/muallimah" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white font-black px-8 py-6 rounded-2xl shadow-lg border-b-4 border-green-900 active:border-b-0 active:translate-y-1 transition-all">
                          Daftar Sekarang
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-green-700" />
            Menu Layanan
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-6 w-full">
          {[
            { label: 'Perjalanan Saya', icon: Clock, color: 'blue', href: '/perjalanan-saya' },
            { label: 'Catatan Tashih', icon: ClipboardList, color: 'emerald', href: '/tashih' },
            { label: 'Jurnal Harian', icon: BookOpen, color: 'indigo', href: '/jurnal-harian' },
            { label: 'Ujian Pekanan', icon: Calendar, color: 'amber', href: '/ujian' },
            { label: 'Ujian Akhir', icon: Award, color: 'blue', href: '/ujian-akhir' },
            { label: 'Sertifikat', icon: CheckCircle, color: 'emerald', href: '/kelulusan-sertifikat' },
            { label: 'Infaq & Donasi', icon: Wallet, color: 'amber', href: '/tagihan-pembayaran' },
            { label: 'Alumni', icon: GraduationCap, color: 'purple', href: '/alumni' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="group min-w-0">
            <div 
              onClick={(e) => {
                if ((item as any).locked) {
                  e.preventDefault();
                  alert(`Maaf Ukhti, menu ini terkunci.`);
                } else if (item.href === '/ujian-akhir') {
                  e.preventDefault();
                  setExamModalOpen(true);
                }
              }}
              className={cn(
                "h-full glass-premium rounded-xl sm:rounded-3xl p-1.5 sm:p-4 border border-white transition-all duration-300 flex flex-col items-center text-center justify-start sm:justify-center min-h-[90px] sm:min-h-0 relative overflow-hidden",
                (item as any).locked 
                  ? "opacity-50 grayscale cursor-not-allowed" 
                  : "hover:border-green-100 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              )}
            >
                <div className={cn(
                  "w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl flex items-center justify-center mb-1 sm:mb-3 transition-transform duration-300 shadow-sm flex-shrink-0 relative",
                  !(item as any).locked && "group-hover:scale-110",
                  item.color === 'blue' ? "bg-blue-50 text-blue-600 border border-blue-100/50" :
                  item.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" :
                  item.color === 'indigo' ? "bg-indigo-50 text-indigo-600 border border-indigo-100/50" :
                  item.color === 'amber' ? "bg-amber-50 text-amber-600 border border-amber-100/50" :
                  item.color === 'purple' ? "bg-purple-50 text-purple-600 border border-purple-100/50" :
                  "bg-gray-50 text-gray-400 border border-gray-100/50"
                )}>
                  <item.icon className="w-5 h-5 sm:w-7 sm:h-7" />
                  {(item as any).locked && (
                    <div className="absolute -top-1 -right-1 bg-gray-600 text-white p-1 rounded-full shadow-lg">
                      <Lock className="w-2 h-2 sm:w-3 sm:h-3" />
                    </div>
                  )}
                </div>
                <h3 className="text-[8px] sm:text-xs lg:text-sm font-bold text-gray-900 leading-[1.1] w-full px-0.5 break-words">
                  {item.label}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 6. Aktivitas Terkini */}
      <Card className="rounded-3xl border-none shadow-xl overflow-hidden glass-premium">
        <CardHeader className="bg-gradient-to-br from-gray-50 to-white/50 border-b border-gray-100 px-6 py-5">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-700" />
            Aktivitas Terkini
          </CardTitle>
          <CardDescription className="text-xs">Riwayat update terbaru Ukhti</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              <>
                {recentActivity
                  .slice((activitiesPage - 1) * activitiesPerPage, activitiesPage * activitiesPerPage)
                  .map((activity, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl bg-gray-50", activity.color)}>
                          <activity.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{activity.title}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(activity.date)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-green-500 transition-colors" />
                    </div>
                  ))
                }

                {recentActivity.length > activitiesPerPage && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActivitiesPage(p => Math.max(1, p - 1))}
                      disabled={activitiesPage === 1}
                      className="text-[10px] font-bold uppercase tracking-widest h-8"
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Hal {activitiesPage} dari {Math.ceil(recentActivity.length / activitiesPerPage)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActivitiesPage(p => Math.min(Math.ceil(recentActivity.length / activitiesPerPage), p + 1))}
                      disabled={activitiesPage >= Math.ceil(recentActivity.length / activitiesPerPage)}
                      className="text-[10px] font-bold uppercase tracking-widest h-8"
                    >
                      Selanjutnya
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-xs font-medium">Belum ada aktivitas terekam pekan ini</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <FinalExamPortalModal 
        isOpen={examModalOpen} 
        onClose={() => setExamModalOpen(false)} 
        hariAktual={displayStats.hariAktual} 
      />
    </div>
  )
}
