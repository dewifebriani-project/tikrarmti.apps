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
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp
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

interface ThalibahTashihSummary {
  user_id: string
  user_data: UserData | null
  total_count: number
  unique_bloks: string[]
  latest_record: TashihRecord
  all_records: TashihRecord[]
  status: 'lengkap' | 'belum'
}

interface ThalibahJurnalSummary {
  user_id: string
  user_data: UserData | null
  total_entries: number
  latest_entry: JurnalRecord
  all_entries: JurnalRecord[]
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
  const [selectedThalibah, setSelectedThalibah] = useState<ThalibahTashihSummary | null>(null)
  const [selectedJurnalThalibah, setSelectedJurnalThalibah] = useState<ThalibahJurnalSummary | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const TASHIH_TARGET = 40

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
        const startDate = new Date(dateFilter)
        const endDate = new Date(dateFilter)
        endDate.setDate(endDate.getDate() + 6) // Get one week

        query = query.gte('waktu_tashih', startDate.toISOString()).lte('waktu_tashih', endDate.toISOString())
      }

      const { data, error } = await query.limit(500)

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

      const { data, error } = await query.limit(500)

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

  // Group tashih records by thalibah
  const getThalibahTashihSummaries = (): ThalibahTashihSummary[] => {
    const grouped = new Map<string, TashihRecord[]>()

    tashihRecords.forEach(record => {
      if (!grouped.has(record.user_id)) {
        grouped.set(record.user_id, [])
      }
      grouped.get(record.user_id)!.push(record)
    })

    return Array.from(grouped.entries()).map(([user_id, records]) => {
      const uniqueBloks = Array.from(new Set(records.map(r => r.blok))).sort()
      const latestRecord = records.sort((a, b) =>
        new Date(b.waktu_tashih).getTime() - new Date(a.waktu_tashih).getTime()
      )[0]

      return {
        user_id,
        user_data: getUserData(user_id) || null,
        total_count: records.length,
        unique_bloks: uniqueBloks,
        latest_record: latestRecord,
        all_records: records,
        status: (records.length >= TASHIH_TARGET ? 'lengkap' : 'belum') as 'lengkap' | 'belum'
      }
    }).sort((a, b) => a.user_data?.full_name?.localeCompare(b.user_data?.full_name || '') || 0)
  }

  // Group jurnal records by thalibah
  const getThalibahJurnalSummaries = (): ThalibahJurnalSummary[] => {
    const grouped = new Map<string, JurnalRecord[]>()

    jurnalRecords.forEach(record => {
      if (!grouped.has(record.user_id)) {
        grouped.set(record.user_id, [])
      }
      grouped.get(record.user_id)!.push(record)
    })

    return Array.from(grouped.entries()).map(([user_id, entries]) => {
      const latestEntry = entries.sort((a, b) =>
        new Date(b.tanggal_setor).getTime() - new Date(a.tanggal_setor).getTime()
      )[0]

      return {
        user_id,
        user_data: getUserData(user_id) || null,
        total_entries: entries.length,
        latest_entry: latestEntry,
        all_entries: entries
      }
    }).sort((a, b) => a.user_data?.full_name?.localeCompare(b.user_data?.full_name || '') || 0)
  }

  // Filter summaries based on search query
  const filteredTashihSummaries = getThalibahTashihSummaries().filter(summary => {
    return summary.user_data?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           summary.user_data?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           summary.unique_bloks.some(blok => blok.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  const filteredJurnalSummaries = getThalibahJurnalSummaries().filter(summary => {
    return summary.user_data?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           summary.user_data?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           summary.latest_entry.blok?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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

  const toggleRowExpansion = (userId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  // Stats calculations
  const tashihStats = {
    thalibah: getThalibahTashihSummaries().length,
    total: tashihRecords.length,
    completed: getThalibahTashihSummaries().filter(s => s.status === 'lengkap').length
  }

  const jurnalStats = {
    thalibah: getThalibahJurnalSummaries().length,
    total: jurnalRecords.length,
    today: jurnalRecords.filter(r => {
      const today = new Date().toISOString().split('T')[0]
      return r.tanggal_setor === today
    }).length
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
          Pantau progres tashih dan jurnal harian thalibah
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
            <span className="hidden sm:inline">Progres Tashih</span>
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
            <Calendar className="w-5 h-5 flex-shrink-0" />
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
                        <Eye className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Total Thalibah</p>
                        <p className="text-2xl font-semibold text-gray-900">{tashihStats.thalibah}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Sudah Lengkap</p>
                        <p className="text-2xl font-semibold text-gray-900">{tashihStats.completed}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Total Record</p>
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
                  {dateFilter && (
                    <p className="text-xs text-gray-500 mt-2">
                      Filter: Minggu mulai {formatDateOnly(dateFilter)}
                    </p>
                  )}
                </div>

                {/* Thalibah Progress Table */}
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900">Progres Tashih per Thalibah</h3>
                    <p className="mt-1 text-sm text-gray-500">Target: {TASHIH_TARGET}x per minggu</p>
                  </div>
                  <div className="overflow-x-auto">
                    {filteredTashihSummaries.length === 0 ? (
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terakhir</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredTashihSummaries.map((summary) => {
                            const isExpanded = expandedRows.has(summary.user_id)
                            const progress = Math.min((summary.total_count / TASHIH_TARGET) * 100, 100)

                            return (
                              <>
                                <tr key={summary.user_id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-gray-900">{summary.user_data?.full_name || '-'}</p>
                                    <p className="text-xs text-gray-500">{summary.user_data?.email || '-'}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {summary.unique_bloks.map(blok => (
                                        <span
                                          key={blok}
                                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                                        >
                                          {blok}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="w-full">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">
                                          {summary.total_count} / {TASHIH_TARGET}
                                        </span>
                                        <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full ${
                                            progress >= 100 ? 'bg-green-600' : 'bg-blue-600'
                                          }`}
                                          style={{ width: `${progress}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {summary.status === 'lengkap' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3" />
                                        Lengkap
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                        <Clock className="h-3 w-3" />
                                        {TASHIH_TARGET - summary.total_count} lagi
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {formatDate(summary.latest_record.waktu_tashih)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleRowExpansion(summary.user_id)}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr key={`${summary.user_id}-details`} className="bg-gray-50">
                                    <td colSpan={6} className="px-4 py-4">
                                      <div className="space-y-3">
                                        <h4 className="font-medium text-gray-900">Detail Tashih ({summary.all_records.length} record)</h4>
                                        <div className="grid gap-2">
                                          {summary.all_records.map(record => (
                                            <div key={record.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                              <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                    {record.blok}
                                                  </span>
                                                  <span className="text-sm text-gray-600">{formatDate(record.waktu_tashih)}</span>
                                                </div>
                                                <div className="text-right text-sm text-gray-600">
                                                  <span className="capitalize">{record.lokasi}</span>
                                                  {record.nama_pemeriksa && (
                                                    <span className="block text-xs text-gray-500">Pemeriksa: {record.nama_pemeriksa}</span>
                                                  )}
                                                </div>
                                              </div>
                                              {record.masalah_tajwid && record.masalah_tajwid.length > 0 && (
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
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
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
                        <Eye className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Total Thalibah</p>
                        <p className="text-2xl font-semibold text-gray-900">{jurnalStats.thalibah}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Hari Ini</p>
                        <p className="text-2xl font-semibold text-gray-900">{jurnalStats.today}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500">Total Entry</p>
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
                    <h3 className="text-lg font-medium text-gray-900">Jurnal Harian per Thalibah</h3>
                    <p className="mt-1 text-sm text-gray-500">Semua data jurnal harian thalibah</p>
                  </div>
                  <div className="overflow-x-auto">
                    {filteredJurnalSummaries.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Tidak ada data jurnal ditemukan</p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thalibah</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Entry</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blok</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terakhir</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredJurnalSummaries.map((summary) => {
                            const isExpanded = expandedRows.has(summary.user_id)

                            return (
                              <>
                                <tr key={summary.user_id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-gray-900">{summary.user_data?.full_name || '-'}</p>
                                    <p className="text-xs text-gray-500">{summary.user_data?.email || '-'}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                      {summary.total_entries} entry
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {summary.latest_entry.blok ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                        {summary.latest_entry.blok}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {formatDate(summary.latest_entry.tanggal_setor)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleRowExpansion(summary.user_id)}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr key={`${summary.user_id}-details`} className="bg-gray-50">
                                    <td colSpan={5} className="px-4 py-4">
                                      <div className="space-y-3">
                                        <h4 className="font-medium text-gray-900">Detail Jurnal ({summary.all_entries.length} entry)</h4>
                                        <div className="grid gap-2">
                                          {summary.all_entries.map(entry => (
                                            <div key={entry.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                              <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-medium text-gray-900">{formatDateOnly(entry.tanggal_setor)}</span>
                                                  {entry.juz_code && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                      Juz {entry.juz_code}
                                                    </span>
                                                  )}
                                                  {entry.blok && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                      {entry.blok}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-4 gap-1 text-xs">
                                                <div>{getStatusBadge(entry.rabth_completed)} Rabth</div>
                                                <div>{getStatusBadge(entry.murajaah_count > 0)} Murajaah ({entry.murajaah_count})</div>
                                                <div>{getStatusBadge(entry.simak_murattal_count > 0)} Simak ({entry.simak_murattal_count})</div>
                                                <div>{getStatusBadge(entry.tikrar_bi_an_nadzar_completed)} Nadzar</div>
                                                <div>{getStatusBadge(entry.tasmi_record_count > 0)} Tasmi ({entry.tasmi_record_count})</div>
                                                <div>{getStatusBadge(entry.simak_record_completed)} Simak Rec</div>
                                                <div>{getStatusBadge(entry.tikrar_bi_al_ghaib_count > 0)} Ghaib ({entry.tikrar_bi_al_ghaib_count})</div>
                                                <div>{getStatusBadge(entry.tafsir_completed)} Tafsir</div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
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
