'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Eye,
  BookOpen,
  Calendar,
  Filter,
  Search,
  Download,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TashihRecord {
  id: string
  user_id: string
  blok: string
  lokasi: string
  lokasi_detail?: string
  nama_pemeriksa?: string
  masalah_tajwid: any[]
  catatan_tambahan?: string
  waktu_tashih: string
  created_at: string
}

interface JurnalRecord {
  id: string
  user_id: string
  tanggal_jurnal: string
  tanggal_setor: string
  juz_code: string | null
  blok: string | null
  tashih_completed: boolean
  rabth_completed: boolean
  murajaah_count: number
  simak_murattal_count: number
  tikrar_bi_an_nadzar_completed: boolean
  tasmi_record_count: number
  simak_record_completed: boolean
  tikrar_bi_al_ghaib_count: number
  tikrar_bi_al_ghaib_type: string | null
  tarteel_screenshot_url: string | null
  tafsir_completed: boolean
  menulis_completed: boolean
  catatan_tambahan: string | null
  created_at: string
}

interface UserData {
  id: string
  full_name?: string
  email?: string
}

type TabValue = 'tashih' | 'jurnal'

export default function PanelMusyrifahPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabValue>('tashih')
  const [tashihRecords, setTashihRecords] = useState<TashihRecord[]>([])
  const [jurnalRecords, setJurnalRecords] = useState<JurnalRecord[]>([])
  const [userDataMap, setUserDataMap] = useState<Map<string, UserData>>(new Map())
  const [isLoadingTashih, setIsLoadingTashih] = useState(true)
  const [isLoadingJurnal, setIsLoadingJurnal] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Load user data for all records
  const loadUserData = async (userIds: string[]) => {
    if (userIds.length === 0) return

    const uniqueIds = Array.from(new Set(userIds))
    const supabase = createClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', uniqueIds)

    if (!error && data) {
      const map = new Map<string, UserData>()
      data.forEach((user: UserData) => {
        map.set(user.id, user)
      })
      setUserDataMap(map)
    }
  }

  // Load tashih records
  const loadTashihRecords = async () => {
    setIsLoadingTashih(true)
    try {
      const supabase = createClient()

      let query = supabase
        .from('tashih_records')
        .select('*')
        .order('waktu_tashih', { ascending: false })

      // Apply date filter if set
      if (dateFilter) {
        query = query.gte('waktu_tashih', dateFilter).lt('waktu_tashih', `${dateFilter}T23:59:59`)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      const records = data || []
      setTashihRecords(records)

      // Load user data for all records
      await loadUserData(records.map((r: TashihRecord) => r.user_id))
    } catch (error: any) {
      console.error('Error loading tashih records:', error)
      toast.error('Gagal memuat data tashih: ' + error.message)
    } finally {
      setIsLoadingTashih(false)
    }
  }

  // Load jurnal records
  const loadJurnalRecords = async () => {
    setIsLoadingJurnal(true)
    try {
      const supabase = createClient()

      let query = supabase
        .from('jurnal_records')
        .select('*')
        .order('tanggal_setor', { ascending: false })

      // Apply date filter if set
      if (dateFilter) {
        query = query.gte('tanggal_setor', dateFilter).lte('tanggal_setor', dateFilter)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      const records = data || []
      setJurnalRecords(records)

      // Load user data for all records
      await loadUserData(records.map((r: JurnalRecord) => r.user_id))
    } catch (error: any) {
      console.error('Error loading jurnal records:', error)
      toast.error('Gagal memuat data jurnal: ' + error.message)
    } finally {
      setIsLoadingJurnal(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'tashih') {
      loadTashihRecords()
    } else {
      loadJurnalRecords()
    }
  }, [activeTab, dateFilter])

  // Get user data helper
  const getUserData = (userId: string) => {
    return userDataMap.get(userId)
  }

  // Filter records based on search query
  const filteredTashihRecords = tashihRecords.filter(record => {
    const user = getUserData(record.user_id)
    return user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           record.blok?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const filteredJurnalRecords = jurnalRecords.filter(record => {
    const user = getUserData(record.user_id)
    return user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           record.blok?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           record.juz_code?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (completed: boolean) => {
    return completed ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3" />
        Selesai
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        <Clock className="h-3 w-3" />
        Belum
      </span>
    )
  }

  // Stats calculations
  const tashihStats = {
    today: tashihRecords.filter(r => {
      const today = new Date().toISOString().split('T')[0]
      return r.waktu_tashih.startsWith(today)
    }).length,
    week: tashihRecords.filter(r => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(r.waktu_tashih) > weekAgo
    }).length,
    total: tashihRecords.length
  }

  const jurnalStats = {
    today: jurnalRecords.filter(r => {
      const today = new Date().toISOString().split('T')[0]
      return r.tanggal_setor === today
    }).length,
    week: jurnalRecords.filter(r => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(r.tanggal_setor) > weekAgo
    }).length,
    total: jurnalRecords.length
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">Panel Musyrifah</h1>
            <p className="text-gray-600 text-sm sm:text-base">Pantau laporan tashih dan jurnal harian thalibah</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
            <Eye className="h-5 w-5 text-purple-600" />
            <div className="text-right">
              <p className="text-xs text-gray-500">Mode</p>
              <p className="text-sm font-semibold text-purple-900">Musyrifah</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Hari Ini</p>
                <p className="text-2xl font-bold text-blue-900">{activeTab === 'tashih' ? tashihStats.today : jurnalStats.today}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Minggu Ini</p>
                <p className="text-2xl font-bold text-green-900">{activeTab === 'tashih' ? tashihStats.week : jurnalStats.week}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-purple-900">{activeTab === 'tashih' ? tashihStats.total : jurnalStats.total}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama, email, blok..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-auto"
              />
              {dateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateFilter('')}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tashih')}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'tashih'
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          )}
        >
          Laporan Tashih
        </button>
        <button
          onClick={() => setActiveTab('jurnal')}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'jurnal'
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          )}
        >
          Jurnal Harian
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'tashih' ? (
        <Card>
          <CardHeader>
            <CardTitle>Laporan Tashih</CardTitle>
            <CardDescription>Daftar tashih yang telah dilakukan thalibah</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTashih ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : filteredTashihRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Tidak ada data tashih ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Thalibah</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Blok</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Lokasi</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Masalah Tajwid</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTashihRecords.map((record) => {
                      const user = getUserData(record.user_id)
                      return (
                        <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{user?.full_name || '-'}</p>
                              <p className="text-xs text-gray-500">{user?.email || '-'}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                              {record.blok}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm text-gray-900 capitalize">{record.lokasi}</p>
                              {record.lokasi === 'luar' && record.lokasi_detail && (
                                <p className="text-xs text-gray-500">{record.lokasi_detail}</p>
                              )}
                              {record.nama_pemeriksa && (
                                <p className="text-xs text-gray-500">Pemeriksa: {record.nama_pemeriksa}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {record.masalah_tajwid && record.masalah_tajwid.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {record.masalah_tajwid.map((issue: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
                                  >
                                    {issue}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-600">{formatDate(record.waktu_tashih)}</p>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Jurnal Harian</CardTitle>
            <CardDescription>Daftar jurnal harian thalibah</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingJurnal ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : filteredJurnalRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Tidak ada data jurnal ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Thalibah</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tanggal</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Blok</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">7 Tahapan</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tikrar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJurnalRecords.map((record) => {
                      const user = getUserData(record.user_id)
                      return (
                        <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{user?.full_name || '-'}</p>
                              <p className="text-xs text-gray-500">{user?.email || '-'}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-600">{formatDate(record.tanggal_setor)}</p>
                            {record.juz_code && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                Juz {record.juz_code}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {record.blok ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                {record.blok}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="grid grid-cols-4 gap-1">
                              {getStatusBadge(record.rabth_completed)}
                              {getStatusBadge(record.murajaah_count > 0)}
                              {getStatusBadge(record.simak_murattal_count > 0)}
                              {getStatusBadge(record.tikrar_bi_an_nadzar_completed)}
                            </div>
                            <div className="grid grid-cols-3 gap-1 mt-1">
                              {getStatusBadge(record.tasmi_record_count > 0)}
                              {getStatusBadge(record.simak_record_completed)}
                              {getStatusBadge(record.tikrar_bi_al_ghaib_count > 0)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {record.tikrar_bi_al_ghaib_type ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-teal-100 text-teal-800">
                                {record.tikrar_bi_al_ghaib_type}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
