'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Target, TrendingUp, Calendar, CheckCircle, Clock, Award, FileText, Star, AlertCircle, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function DashboardContent() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // ALL STATE HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [stats, setStats] = useState({
    totalHariTarget: 13,
    hariAktual: 0,
    persentaseProgress: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [batchInfo, setBatchInfo] = useState<any | null>(null)
  const [registrationStatus, setRegistrationStatus] = useState<any>(null)

  // Today's progress calculation
  const todayProgress = {
    completed: 3, // Static value for now - can be calculated from actual journal data
    total: 7
  }

  
  // Debug: Log user state changes
  useEffect(() => {
    console.log('=== Dashboard User State Update ===')
    console.log('Auth loading:', loading)
    console.log('Auth user:', user)
    console.log('User ID:', user?.id)
    console.log('User email:', user?.email)
    console.log('==================================')
  }, [user, loading])

  // Load user data when authenticated
  useEffect(() => {
    if (user) {
      // Use user data from AuthContext instead of fetching again
      setUserData(user)

      // Check registration status directly in useEffect to avoid hooks violation
      const checkRegistrationStatus = async () => {
        try {
          const response = await fetch('/api/auth/check-registration-simple', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              email: user.email
            })
          })

          if (response.ok) {
            const data = await response.json()
            setRegistrationStatus(data)
          }
        } catch (error) {
          console.error('Error checking registration status:', error)
        }
      }

      // Load batch info directly in useEffect to avoid hooks violation
      const loadBatchInfo = async () => {
        try {
          // Check cache first (5 minutes cache) - only if window is defined
          if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('dashboard_batch_info')
            if (cached) {
              const { data: cachedData, timestamp } = JSON.parse(cached)
              if (Date.now() - timestamp < 5 * 60 * 1000) {
                setBatchInfo(cachedData)
                const durationWeeks = cachedData.duration_weeks || 13
                setStats(prev => ({
                  ...prev,
                  totalHariTarget: durationWeeks,
                  hariAktual: 0,
                  persentaseProgress: 0
                }))
                return // Use cache, skip API call
              }
            }
          }

          // Fetch from API
          const { data, error } = await supabase
            .from('batches')
            .select('*')
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(1)

          if (data && data.length > 0 && !error) {
            const batchData = data[0] as any
            setBatchInfo(batchData)

            // Cache the result - only if window is defined
            if (typeof window !== 'undefined') {
              localStorage.setItem('dashboard_batch_info', JSON.stringify({
                data: batchData,
                timestamp: Date.now()
              }))
            }

            // Use duration_weeks from database
            const durationWeeks = batchData.duration_weeks || 13
            setStats(prev => ({
              ...prev,
              totalHariTarget: durationWeeks,
              hariAktual: 0,
              persentaseProgress: 0
            }))
          }
        } catch (error) {
          console.error('Error loading batch info:', error)
        }
      }

      // Execute the functions
      checkRegistrationStatus()
      loadBatchInfo()

      // Set recent activity to empty for now
      setRecentActivity([])
    }
  }, [user])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to login...')
      router.push('/login')
      return
    }
  }, [loading, user, router])

  
  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    // Shabahul Khayr (pagi), Masaa'ul Khayr (sore), Masaa'ul Khayr (malam)
    const greeting = hour < 12 ? "Shabahul Khayr" : hour < 18 ? "Masaa'ul Khayr" : "Masaa'ul Khayr"

    // Get name from multiple sources with priority: full_name -> displayName -> email -> 'Ukhti'
    const displayName = user?.full_name || user?.displayName || (user?.email ? user.email.split('@')[0] : null)
    const userName = displayName ? `Ukhti ${displayName}` : 'Ukhti'

    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('=== Dashboard Greeting Debug ===')
      console.log('User object:', user)
      console.log('User full_name:', user?.full_name)
      console.log('User displayName:', user?.displayName)
      console.log('User email:', user?.email)
      console.log('User role:', user?.role)
      console.log('Generated displayName:', displayName)
      console.log('Generated userName:', userName)
      console.log('================================')
    }

    return {
      greeting,
      full: `Assalamu'alaikum, <em>${greeting}</em>, ${userName}`
    }
  }

  const toHijriDate = (date: Date) => {
    // Simple approximation - you might want to use a proper Hijri converter library
    const months = ["Muharram", "Safar", "Rabi'ul Awwal", "Rabi'ul Akhir", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qa'dah", "Dhu al-Hijjah"]
    const hijriYear = 1446 // Approximate
    const hijriMonth = months[new Date().getMonth()]
    const hijriDay = new Date().getDate()
    return `${hijriDay} ${hijriMonth} ${hijriYear} H`
  }

  const getRoleDisplay = (role?: string) => {
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('=== Role Display Debug ===')
      console.log('Input role:', role)
    }

    let displayRole = 'User'
    switch (role?.toLowerCase()) {
      case 'admin':
        displayRole = 'Administrator'
        break
      case 'musyrifah':
        displayRole = 'Musyrifah'
        break
      case 'muallimah':
        displayRole = 'Muallimah'
        break
      case 'thalibah':
        displayRole = 'Thalibah'
        break
      case 'calon_thalibah':
        displayRole = 'Calon Thalibah'
        break
      default:
        displayRole = 'Calon Thalibah' // Default untuk user baru
    }

    if (typeof window !== 'undefined') {
      console.log('Output displayRole:', displayRole)
      console.log('========================')
    }

    return displayRole
  }

  const quickActions = [
    {
      title: 'Pendaftaran',
      description: 'Daftar program Tikrar MTI',
      icon: CheckCircle,
      href: '/pendaftaran',
      color: 'bg-green-600 text-white hover:bg-green-700'
    },
    {
      title: 'Jurnal Harian',
      description: 'Isi kurikulum 7 tahap hari ini',
      icon: BookOpen,
      href: '/jurnal-harian',
      color: 'bg-green-600 text-white hover:bg-green-700'
    },
    {
      title: 'Perjalanan Saya',
      description: 'Lihat perjalanan saya',
      icon: TrendingUp,
      href: '/perjalanan-saya',
      color: 'bg-green-600 text-white hover:bg-green-700'
    }
  ]

  // Show loading spinner if still loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  // Show error if authentication failed
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Gagal Memuat Dashboard</h2>
          <p className="text-gray-600 mb-4">Tidak dapat memuat informasi pengguna. Silakan periksa koneksi internet Anda dan coba lagi.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthenticatedLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-r from-green-600 to-green-700 text-white border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold mb-2 leading-relaxed">
                  <span dangerouslySetInnerHTML={{ __html: getWelcomeMessage().full }} />! 👋
                </h2>
                <p className="text-green-100 text-sm sm:text-base">
                  Selamat datang kembali di Tikrar MTI Apps. Semoga hari ini lebih baik dari hari kemarin.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base">{getRoleDisplay(user?.role)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Bergabung: {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base">{toHijriDate(new Date())}</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center md:ml-4">
                <Star className="w-12 h-12 lg:w-16 lg:h-16 text-green-300" />
              </div>
            </div>
          </CardContent>
              </Card>

        {/* Announcement Card - Pembukaan Tikrar-Tahfidz Batch 2 */}
        {batchInfo && (
          <Card className="mb-8 border-2 border-green-600 shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                    <h3 className="text-lg md:text-xl font-bold text-green-900">
                      Pendaftaran {batchInfo.name || 'Tikrar MTI Batch 2'} Dibuka! 🎉
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {batchInfo.status === 'open' ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm md:text-base">
                    Bergabunglah dengan program Tikrar Tahfidz untuk menghafal dan mengulang Al-Quran dengan metode yang telah terbukti efektif.
                    Program dimulai pada {batchInfo.start_date ? new Date(batchInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'segera'}.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <Calendar className="w-4 h-4 mr-2 text-green-600" />
                      <div>
                        <p className="font-medium">Periode Program</p>
                        <p className="text-gray-600">
                          {batchInfo.start_date && batchInfo.end_date
                            ? `${new Date(batchInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${new Date(batchInfo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : 'Akan diumumkan'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <Users className="w-4 h-4 mr-2 text-green-600" />
                      <div>
                        <p className="font-medium">Kuota Tersedia</p>
                        <p className="text-gray-600">{batchInfo.registered_count || 0} dari {batchInfo.total_quota || 100} peserta</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <Star className="w-4 h-4 mr-2 text-green-600" />
                      <div>
                        <p className="font-medium">Biaya</p>
                        <p className="text-gray-600 font-semibold">{batchInfo.is_free ? 'GRATIS' : `Rp ${batchInfo.price?.toLocaleString('id-ID')}`}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {registrationStatus?.hasRegistered ? (
                      <div className="flex-1 sm:flex-none">
                        <Button className="w-full sm:w-auto bg-gray-400 text-white cursor-not-allowed" disabled>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Sudah Terdaftar
                        </Button>
                        <p className="text-xs text-gray-600 mt-2">
                          Status: {registrationStatus.registration?.status} |
                          Edit <Link href="/pendaftaran/tikrar-tahfidz" className="text-green-600 hover:underline">di sini</Link>
                        </p>
                      </div>
                    ) : (
                      <Link href="/pendaftaran/tikrar-tahfidz" className="flex-1 sm:flex-none">
                        <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                          Daftar Sekarang
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white shadow-sm border border-green-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pekan Target</CardTitle>
              <Target className="h-4 w-4 text-green-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.totalHariTarget}</div>
              <p className="text-xs text-muted-foreground">Total pekan program</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-green-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pekan Aktual</CardTitle>
              <Calendar className="h-4 w-4 text-green-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.hariAktual}</div>
              <p className="text-xs text-muted-foreground">Pekan selesai</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-green-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.persentaseProgress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-900 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${stats.persentaseProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon
            const isDisabled = batchInfo && batchInfo.status === 'registration'
            const isRegistrationDisabled = action.title === 'Pendaftaran' && registrationStatus?.hasRegistered
            return (
              <Card key={action.title} className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isDisabled || isRegistrationDisabled ? 'opacity-75' : ''}`}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${isDisabled || isRegistrationDisabled ? 'bg-gray-400 text-gray-600' : action.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>
                        {isRegistrationDisabled ? 'Sudah terdaftar di program Tikrar' :
                         isDisabled ? 'Dikunci karena masa pendaftaran' : action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isDisabled || isRegistrationDisabled ? (
                    <Button className="w-full bg-gray-400 text-white cursor-not-allowed" disabled>
                      {isRegistrationDisabled ? 'Sudah Terdaftar' : `${action.title} Dikunci`}
                    </Button>
                  ) : (
                    <Link href={action.href}>
                      <Button className={`w-full ${action.color}`}>
                        Mulai {action.title}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-900" />
                <span>Aktivitas Terkini</span>
              </CardTitle>
              <CardDescription>
                Aktivitas pembelajaran Ukhti
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'jurnal' ? 'bg-green-500' : 'bg-green-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link href="/perjalanan-saya">
                      <Button variant="outline" className="w-full">
                        Lihat Semua Aktivitas
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-3">
                    <Clock className="h-12 w-12 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Belum ada aktivitas pembelajaran</p>
                  <p className="text-xs text-gray-400">Mulai aktivitas pembelajaran Ukhti untuk melihat riwayat di sini</p>
                  <div className="mt-4">
                    <Link href="/jurnal-harian">
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        Mulai Jurnal Harian
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievement Banner */}
        <Card className="mt-8 bg-gradient-to-r from-green-900 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <Award className="h-8 w-8" />
                  <div>
                    <h3 className="text-xl font-bold">Tetap Konsisten!</h3>
                    <p className="text-green-100">
                      Ukhti telah menyelesaikan {stats.hariAktual} pekan dari {stats.totalHariTarget} pekan target.
                      Pertahankan konsistensi Ukhti!
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="text-4xl font-bold">{stats.persentaseProgress}%</div>
                <p className="text-green-100 text-sm">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}