'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Target, TrendingUp, Calendar, CheckCircle, Clock, Award, FileText, Star } from 'lucide-react'
import Link from 'next/link'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [todayProgress, setTodayProgress] = useState({
    completed: 0,
    total: 7,
    percentage: 0
  })

  const [stats, setStats] = useState({
    totalHariTarget: 30,
    hariAktual: 0,
    persentaseProgress: 0,
    jurnalHariIni: false,
    tashihHariIni: false
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [batchInfo, setBatchInfo] = useState<any | null>(null)

  useEffect(() => {
    loadUserData()
    loadBatchInfo()
    loadTodayProgress()
    loadRecentActivity()
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data && !error) {
        setUserData(data)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadBatchInfo = async () => {
    try {
      // Get current active batch for Tikrar MTI
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data && !error) {
        setBatchInfo(data as any)

        // Calculate days based on batch dates
        const batchData = data as any
        const startDate = new Date(batchData.start_date || '2025-01-01')
        const endDate = new Date(batchData.end_date || '2025-04-01')
        const today = new Date()

        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        const daysPassed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24))
        const percentage = Math.min(Math.round((daysPassed / totalDays) * 100), 100)

        setStats(prev => ({
          ...prev,
          totalHariTarget: totalDays,
          hariAktual: Math.max(0, daysPassed),
          persentaseProgress: percentage
        }))
      }
    } catch (error) {
      console.error('Error loading batch info:', error)
    }
  }

  const loadTodayProgress = () => {
    // Simulate loading today's progress from localStorage or API
    const savedProgress = localStorage.getItem('mti-jurnal-today')
    if (savedProgress) {
      const jurnalData = JSON.parse(savedProgress)
      const completedSteps = Object.values(jurnalData.completedSteps || {}).filter(Boolean).length
      setTodayProgress({
        completed: completedSteps,
        total: 7,
        percentage: Math.round((completedSteps / 7) * 100)
      })
    }
  }

  const loadRecentActivity = async () => {
    if (!user) return

    try {
      // This would normally fetch from your activity logs table
      // For now, using mock data with dynamic dates
      const mockActivities = [
        {
          id: 1,
          type: 'jurnal',
          date: new Date().toISOString(),
          description: 'Jurnal harian selesai'
        },
        {
          id: 2,
          type: 'tashih',
          date: new Date(Date.now() - 86400000).toISOString(),
          description: 'Tashih blok H2a'
        },
        {
          id: 3,
          type: 'jurnal',
          date: new Date(Date.now() - 172800000).toISOString(),
          description: 'Jurnal harian selesai'
        },
      ]
      setRecentActivity(mockActivities)
    } catch (error) {
      console.error('Error loading recent activity:', error)
    }
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Assalamu\'alaikum'
    if (hour < 15) return 'Assalamu\'alaikum'
    if (hour < 18) return 'Assalamu\'alaikum'
    return 'Assalamu\'alaikum'
  }

  const toHijriDate = (date: Date) => {
    // Simple approximation - you might want to use a proper Hijri converter library
    const months = ['Muharram', 'Safar', 'Rabi\'ul Awwal', 'Rabi\'ul Akhir', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qa\'dah', 'Dhu al-Hijjah']
    const hijriYear = 1446 // Approximate
    const hijriMonth = months[new Date().getMonth()]
    const hijriDay = new Date().getDate()
    return `${hijriDay} ${hijriMonth} ${hijriYear} H`
  }

  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'musyrifah':
        return 'Musyrifah MTI'
      case 'muallimah':
        return 'Muallimah MTI'
      case 'thalibah':
        return 'Thalibah Tahfidz'
      case 'calon_thalibah':
        return 'Calon Thalibah'
      default:
        return 'Peserta MTI'
    }
  }

  const quickActions = [
    {
      title: 'Jurnal Harian',
      description: 'Isi kurikulum 7 tahap hari ini',
      icon: BookOpen,
      href: '/jurnal-harian',
      color: 'bg-green-600 text-white hover:bg-green-700'
    },
    {
      title: 'Tasmi\'',
      description: 'Validasi bacaan Anda',
      icon: CheckCircle,
      href: '/tashih',
      color: 'bg-green-600 text-white hover:bg-green-700'
    },
    {
      title: 'Perjalanan Saya',
      description: 'Lihat progress lengkap',
      icon: TrendingUp,
      href: '/perjalanan-saya',
      color: 'bg-green-600 text-white hover:bg-green-700'
    }
  ]

  return (
    <AuthenticatedLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-r from-green-600 to-green-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {getWelcomeMessage()}, {userData?.full_name ? `Ukhti ${userData.full_name}!` : 'Ukhti!'} 👋
                </h2>
                <p className="text-green-100">
                  Selamat datang kembali di Markaz Tikrar Indonesia. Semoga hari ini lebih baik dari hari kemarin.
                </p>
                <div className="mt-4 flex items-center space-x-4">
                  <div className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    <span className="font-medium">{getRoleDisplay(userData?.role)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span>Bergabung: {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}</span>
                  </div>
                  {userData?.created_at && (
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      <span>{toHijriDate(new Date(userData.created_at))}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <Star className="w-16 h-16 text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-sm border border-green-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hari Target</CardTitle>
              <Target className="h-4 w-4 text-green-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.totalHariTarget}</div>
              <p className="text-xs text-muted-foreground">Total hari target</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-green-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hari Aktual</CardTitle>
              <Calendar className="h-4 w-4 text-green-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.hariAktual}</div>
              <p className="text-xs text-muted-foreground">Hari selesai</p>
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
                  className="bg-green-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.persentaseProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-green-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jurnal Hari Ini</CardTitle>
              {stats.jurnalHariIni ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayProgress.completed}/{todayProgress.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {todayProgress.percentage}% selesai
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon
            const isDisabled = batchInfo && batchInfo.status === 'registration'
            return (
              <Card key={action.title} className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isDisabled ? 'opacity-75' : ''}`}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${isDisabled ? 'bg-gray-400 text-gray-600' : action.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>
                        {isDisabled ? 'Dikunci karena masa pendaftaran' : action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isDisabled ? (
                    <Button className="w-full bg-gray-400 text-white cursor-not-allowed" disabled>
                      {action.title} Dikunci
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

        {/* Today's Progress & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-900" />
                <span>Progress Jurnal Hari Ini</span>
              </CardTitle>
              <CardDescription>
                {todayProgress.completed} dari {todayProgress.total} tahap selesai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Tadabur', completed: true },
                  { name: 'Murajaah', completed: false },
                  { name: 'Simak Murattal', completed: true },
                  { name: 'Tikrar Bi An-Nadzar', completed: false },
                  { name: 'Tasmi Record', completed: false },
                  { name: 'Simak Record', completed: true },
                  { name: 'Tikrar Bi Al-Ghaib', completed: false },
                ].map((step, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="font-medium text-sm">{step.name}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {step.completed && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/jurnal-harian">
                  <Button className="w-full bg-green-900 hover:bg-green-700">
                    Lanjutkan Jurnal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-900" />
                <span>Aktivitas Terkini</span>
              </CardTitle>
              <CardDescription>
                Aktivitas pembelajaran Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      Anda telah menyelesaikan {stats.hariAktual} hari dari {stats.totalHariTarget} hari target.
                      Pertahankan konsistensi Anda!
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