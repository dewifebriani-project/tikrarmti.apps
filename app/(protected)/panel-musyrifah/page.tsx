'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import toast, { Toaster } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Eye,
  BookOpen,
  Calendar,
  Filter,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

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
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 -m-6 mb-0 px-6 py-6 rounded-t-lg">
        <h1 className="text-3xl font-bold text-gray-900">Panel Musyrifah</h1>
        <p className="mt-2 text-sm text-gray-600">
          Pantau laporan tashih dan jurnal harian thalibah
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 -m-6 mb-0 px-6">
        <nav className="flex flex-wrap gap-x-4 sm:gap-x-6 lg:gap-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('tashih')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
              ${activeTab === 'tashih'
                ? 'border-green-900 text-green-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Laporan Tashih</span>
          </button>
          <button
            onClick={() => setActiveTab('jurnal')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
              ${activeTab === 'jurnal'
                ? 'border-green-900 text-green-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Jurnal Harian</span>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'tashih' && (
          <>
            {isLoadingTashih ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Hari Ini</p>
                        <p className="text-2xl font-semibold text-gray-900">{tashihStats.today}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Minggu Ini</p>
                        <p className="text-2xl font-semibold text-gray-900">{tashihStats.week}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                        <Eye className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Total</p>
                        <p className="text-2xl font-semibold text-gray-900">{tashihStats.total}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
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
                </div>

                {/* Tashih Records Table */}
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900">Daftar Tashih</h3>
                    <p className="mt-1 text-sm text-gray-500">Semua data tashih thalibah</p>
                  </div>
                  <div className="overflow-x-auto">
                    {filteredTashihRecords.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Tidak ada data tashih ditemukan</p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thalibah</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blok</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Masalah Tajwid</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredTashihRecords.map((record) => {
                            const user = getUserData(record.user_id)
                            return (
                              <tr key={record.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-900">{user?.full_name || '-'}</p>
                                  <p className="text-xs text-gray-500">{user?.email || '-'}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                                    {record.blok}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-gray-900 capitalize">{record.lokasi}</p>
                                  {record.lokasi === 'luar' && record.lokasi_detail && (
                                    <p className="text-xs text-gray-500">{record.lokasi_detail}</p>
                                  )}
                                  {record.nama_pemeriksa && (
                                    <p className="text-xs text-gray-500">Pemeriksa: {record.nama_pemeriksa}</p>
                                  )}
                                </td>
                                <td className="px-4 py-3">
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
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {formatDate(record.waktu_tashih)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
        {activeTab === 'jurnal' && (
          <>
            {isLoadingJurnal ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Hari Ini</p>
                        <p className="text-2xl font-semibold text-gray-900">{jurnalStats.today}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Minggu Ini</p>
                        <p className="text-2xl font-semibold text-gray-900">{jurnalStats.week}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                        <Eye className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Total</p>
                        <p className="text-2xl font-semibold text-gray-900">{jurnalStats.total}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
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
                </div>

                {/* Jurnal Records Table */}
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900">Daftar Jurnal Harian</h3>
                    <p className="mt-1 text-sm text-gray-500">Semua data jurnal harian thalibah</p>
                  </div>
                  <div className="overflow-x-auto">
                    {filteredJurnalRecords.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Tidak ada data jurnal ditemukan</p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thalibah</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blok</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">7 Tahapan</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tikrar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredJurnalRecords.map((record) => {
                            const user = getUserData(record.user_id)
                            return (
                              <tr key={record.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-900">{user?.full_name || '-'}</p>
                                  <p className="text-xs text-gray-500">{user?.email || '-'}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-gray-600">{formatDate(record.tanggal_setor)}</p>
                                  {record.juz_code && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                      Juz {record.juz_code}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {record.blok ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                      {record.blok}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
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
                                <td className="px-4 py-3">
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
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
