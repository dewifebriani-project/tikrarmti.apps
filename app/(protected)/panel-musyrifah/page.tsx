'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTashihReports, useJurnalReports, deleteTashihRecord, deleteJurnalRecord, updateJurnalRecord } from '@/hooks/useReports'
import type { ReportTashihRecord, ReportJurnalRecord } from '@/hooks/useReports'
import { toast } from 'sonner'
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
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  X,
  Save
} from 'lucide-react'

interface ThalibahTashihSummary {
  user_id: string
  user_data: { id: string; full_name?: string; email?: string } | null
  total_count: number
  unique_bloks: string[]
  latest_record: ReportTashihRecord
  all_records: ReportTashihRecord[]
  status: 'lengkap' | 'belum'
}

interface ThalibahJurnalSummary {
  user_id: string
  user_data: { id: string; full_name?: string; email?: string } | null
  total_entries: number
  latest_entry: ReportJurnalRecord
  all_entries: ReportJurnalRecord[]
}

type TabValue = 'tashih' | 'jurnal'

export default function PanelMusyrifahPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabValue>('tashih')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [editingRecord, setEditingRecord] = useState<ReportJurnalRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const TASHIH_TARGET = 40

  // Fetch data using hooks
  const { records: tashihRecords, isLoading: isLoadingTashih, mutate: mutateTashih } = useTashihReports({
    date_from: dateFilter || undefined,
    limit: 1000
  })

  const { records: jurnalRecords, isLoading: isLoadingJurnal, mutate: mutateJurnal } = useJurnalReports({
    date: dateFilter || undefined,
    limit: 1000
  })

  // Group tashih records by thalibah
  const getThalibahTashihSummaries = useMemo((): ThalibahTashihSummary[] => {
    const grouped = new Map<string, ReportTashihRecord[]>()

    tashihRecords.forEach(record => {
      if (!grouped.has(record.user_id)) {
        grouped.set(record.user_id, [])
      }
      grouped.get(record.user_id)!.push(record)
    })

    return Array.from(grouped.entries()).map(([user_id, records]) => {
      const uniqueBloks = Array.from(new Set(
        records.flatMap(r => r.blok_list || [])
      )).sort()

      const latestRecord = records.sort((a, b) =>
        new Date(b.waktu_tashih).getTime() - new Date(a.waktu_tashih).getTime()
      )[0]

      return {
        user_id,
        user_data: latestRecord.user_data || null,
        total_count: records.length,
        unique_bloks: uniqueBloks,
        latest_record: latestRecord,
        all_records: records,
        status: (records.length >= TASHIH_TARGET ? 'lengkap' : 'belum') as 'lengkap' | 'belum'
      }
    }).sort((a, b) => a.user_data?.full_name?.localeCompare(b.user_data?.full_name || '') || 0)
  }, [tashihRecords])

  // Group jurnal records by thalibah
  const getThalibahJurnalSummaries = useMemo((): ThalibahJurnalSummary[] => {
    const grouped = new Map<string, ReportJurnalRecord[]>()

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
        user_data: latestEntry.user_data || null,
        total_entries: entries.length,
        latest_entry: latestEntry,
        all_entries: entries
      }
    }).sort((a, b) => a.user_data?.full_name?.localeCompare(b.user_data?.full_name || '') || 0)
  }, [jurnalRecords])

  // Filter summaries based on search query
  const filteredTashihSummaries = useMemo(() => {
    return getThalibahTashihSummaries.filter(summary => {
      return summary.user_data?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             summary.user_data?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             summary.unique_bloks.some(blok => blok.toLowerCase().includes(searchQuery.toLowerCase()))
    })
  }, [getThalibahTashihSummaries, searchQuery])

  const filteredJurnalSummaries = useMemo(() => {
    return getThalibahJurnalSummaries.filter(summary => {
      return summary.user_data?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             summary.user_data?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             summary.latest_entry.blok?.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [getThalibahJurnalSummaries, searchQuery])

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

  const getStatusBadge = (completed: boolean, label?: string) => {
    return completed ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3" />
        {label || 'Selesai'}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        <Clock className="h-3 w-3" />
        {label || 'Belum'}
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

  // Delete handlers
  const handleDeleteTashih = async (recordId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus record tashih ini?')) return

    setIsDeleting(recordId)
    try {
      const result = await deleteTashihRecord(recordId)
      if (result.success) {
        toast.success('Record tashih berhasil dihapus')
        mutateTashih()
      } else {
        toast.error(result.error || 'Gagal menghapus record')
      }
    } catch (error) {
      toast.error('Gagal menghapus record')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDeleteJurnal = async (recordId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus record jurnal ini?')) return

    setIsDeleting(recordId)
    try {
      const result = await deleteJurnalRecord(recordId)
      if (result.success) {
        toast.success('Record jurnal berhasil dihapus')
        mutateJurnal()
      } else {
        toast.error(result.error || 'Gagal menghapus record')
      }
    } catch (error) {
      toast.error('Gagal menghapus record')
    } finally {
      setIsDeleting(null)
    }
  }

  // Edit handlers
  const handleEditJurnal = (record: ReportJurnalRecord) => {
    setEditingRecord(record)
  }

  const handleSaveJurnal = async () => {
    if (!editingRecord) return

    try {
      const result = await updateJurnalRecord(editingRecord.id, {
        catatan_tambahan: editingRecord.catatan_tambahan
      })

      if (result.success) {
        toast.success('Record jurnal berhasil diupdate')
        setEditingRecord(null)
        mutateJurnal()
      } else {
        toast.error(result.error || 'Gagal mengupdate record')
      }
    } catch (error) {
      toast.error('Gagal mengupdate record')
    }
  }

  const handleCancelEdit = () => {
    setEditingRecord(null)
  }

  // Stats calculations
  const tashihStats = {
    thalibah: getThalibahTashihSummaries.length,
    total: tashihRecords.length,
    completed: getThalibahTashihSummaries.filter(s => s.status === 'lengkap').length
  }

  const jurnalStats = {
    thalibah: getThalibahJurnalSummaries.length,
    total: jurnalRecords.length,
    today: jurnalRecords.filter(r => {
      const today = new Date().toISOString().split('T')[0]
      return r.tanggal_setor === today
    }).length
  }

  return (
    <>
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
                                                <div className="flex items-center gap-2">
                                                  <div className="text-right text-sm text-gray-600">
                                                    <span className="capitalize">{record.lokasi}</span>
                                                    {record.nama_pemeriksa && (
                                                      <span className="block text-xs text-gray-500">Pemeriksa: {record.nama_pemeriksa}</span>
                                                    )}
                                                  </div>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteTashih(record.id)}
                                                    disabled={isDeleting === record.id}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  >
                                                    {isDeleting === record.id ? (
                                                      <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                      <Trash2 className="h-4 w-4" />
                                                    )}
                                                  </Button>
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
                                          {summary.all_entries.map(entry => {
                                            const isEditing = editingRecord?.id === entry.id

                                            return (
                                              <div key={entry.id} className={`bg-white p-3 rounded-lg border ${isEditing ? 'border-blue-300' : 'border-gray-200'}`}>
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
                                                  <div className="flex items-center gap-2">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => handleEditJurnal(entry)}
                                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                      <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => handleDeleteJurnal(entry.id)}
                                                      disabled={isDeleting === entry.id}
                                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                      {isDeleting === entry.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                      ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                      )}
                                                    </Button>
                                                  </div>
                                                </div>

                                                {isEditing ? (
                                                  <div className="mt-3 space-y-2">
                                                    <label className="text-xs font-medium text-gray-700">Catatan Tambahan:</label>
                                                    <textarea
                                                      value={editingRecord.catatan_tambahan || ''}
                                                      onChange={(e) => setEditingRecord({ ...editingRecord, catatan_tambahan: e.target.value })}
                                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                      rows={2}
                                                    />
                                                    <div className="flex gap-2">
                                                      <Button
                                                        size="sm"
                                                        onClick={handleSaveJurnal}
                                                        className="bg-green-600 hover:bg-green-700"
                                                      >
                                                        <Save className="h-4 w-4 mr-1" />
                                                        Simpan
                                                      </Button>
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleCancelEdit}
                                                      >
                                                        <X className="h-4 w-4 mr-1" />
                                                        Batal
                                                      </Button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <>
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
                                                    {entry.catatan_tambahan && (
                                                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                                        <span className="font-medium">Catatan:</span> {entry.catatan_tambahan}
                                                      </div>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            )
                                          })}
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
