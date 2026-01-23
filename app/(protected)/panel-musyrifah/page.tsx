'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTashihReports, useJurnalReports, useThalibahData, deleteTashihRecord, deleteJurnalRecord, updateJurnalRecord } from '@/hooks/useReports'
import type { ReportTashihRecord, ReportJurnalRecord, ThalibahData } from '@/hooks/useReports'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
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
  Save,
  Users,
  Phone
} from 'lucide-react'

// All blocks for tashih (H1A-H10D for Part A, H11A-H20D for Part B)
const ALL_BLOCKS_PART_A = ['H1A', 'H1B', 'H1C', 'H1D', 'H2A', 'H2B', 'H2C', 'H2D', 'H3A', 'H3B', 'H3C', 'H3D', 'H4A', 'H4B', 'H4C', 'H4D', 'H5A', 'H5B', 'H5C', 'H5D', 'H6A', 'H6B', 'H6C', 'H6D', 'H7A', 'H7B', 'H7C', 'H7D', 'H8A', 'H8B', 'H8C', 'H8D', 'H9A', 'H9B', 'H9C', 'H9D', 'H10A', 'H10B', 'H10C', 'H10D']
const ALL_BLOCKS_PART_B = ['H11A', 'H11B', 'H11C', 'H11D', 'H12A', 'H12B', 'H12C', 'H12D', 'H13A', 'H13B', 'H13C', 'H13D', 'H14A', 'H14B', 'H14C', 'H14D', 'H15A', 'H15B', 'H15C', 'H15D', 'H16A', 'H16B', 'H16C', 'H16D', 'H17A', 'H17B', 'H17C', 'H17D', 'H18A', 'H18B', 'H18C', 'H18D', 'H19A', 'H19B', 'H19C', 'H19D', 'H20A', 'H20B', 'H20C', 'H20D']

// Get blocks for a specific week (1-10 maps to H1-H10 for Part A, H11-H20 for Part B)
const getBlocksForWeek = (weekNum: number, isPartB: boolean = false): string[] => {
  const baseNum = isPartB ? weekNum + 10 : weekNum
  return [`H${baseNum}A`, `H${baseNum}B`, `H${baseNum}C`, `H${baseNum}D`]
}

interface ThalibahWithProgress {
  user_id: string
  user_data: { id: string; full_name?: string; email?: string; whatsapp?: string } | null
  whatsapp?: string
  chosen_juz?: string
  // Tashih per week (1-10)
  tashih_by_week: Map<number, { count: number; bloks: string[]; records: ReportTashihRecord[] }>
  // Jurnal per week (1-13)
  jurnal_by_week: Map<number, { count: number; bloks: string[]; records: ReportJurnalRecord[] }>
}

type TabValue = 'tashih' | 'jurnal'

export default function PanelMusyrifahPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabValue>('tashih')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [editingRecord, setEditingRecord] = useState<ReportJurnalRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteModalUser, setDeleteModalUser] = useState<ThalibahWithProgress | null>(null)

  const TASHIH_TARGET = 40
  const TASHIH_WEEKS = 10
  const JURNAL_WEEKS = 13

  // Fetch all thalibah data
  const { thalibah, batch, isLoading: thalibahLoading } = useThalibahData()

  // Fetch tashih and jurnal reports
  const { records: tashihRecords, isLoading: isLoadingTashih, mutate: mutateTashih } = useTashihReports({
    limit: 1000
  })

  const { records: jurnalRecords, isLoading: isLoadingJurnal, mutate: mutateJurnal } = useJurnalReports({
    limit: 1000
  })

  const batchStartDate = batch?.start_date || null

  // Calculate week number from date
  const getWeekNumberFromDate = (date: Date, startOffsetDays = 0): number => {
    if (!batchStartDate) return 1
    const startDate = new Date(batchStartDate)
    const diffTime = date.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const adjustedDays = Math.max(0, diffDays - startOffsetDays)
    return Math.floor(adjustedDays / 7) + 1
  }

  // Get current week number
  const getCurrentWeekNumber = (forJurnal = false): number => {
    const weekNum = getWeekNumberFromDate(new Date(), forJurnal ? 7 : 0)
    return Math.max(1, weekNum)
  }

  // Current weeks for display
  const currentTashihWeek = getCurrentWeekNumber(false)
  const currentJurnalWeek = getCurrentWeekNumber(true)

  // Build thalibah progress with all thalibah from the batch
  const thalibahProgress = useMemo((): ThalibahWithProgress[] => {
    // Initialize progress map for all thalibah
    const progressMap = new Map<string, ThalibahWithProgress>()

    thalibah.forEach((t: ThalibahData) => {
      progressMap.set(t.user_id, {
        user_id: t.user_id,
        user_data: {
          id: t.user_id,
          full_name: t.full_name || t.user_data?.full_name,
          email: t.email || t.user_data?.email,
          whatsapp: t.whatsapp || t.wa_phone || t.user_data?.whatsapp
        },
        whatsapp: t.whatsapp || t.wa_phone || t.user_data?.whatsapp,
        chosen_juz: t.chosen_juz,
        tashih_by_week: new Map(),
        jurnal_by_week: new Map()
      })
    })

    // Process tashih records
    tashihRecords.forEach(record => {
      const progress = progressMap.get(record.user_id)
      if (progress) {
        // Get week from block code (e.g., H1A -> week 1, H11A -> week 1 for Part B)
        const blockMatch = record.blok?.match(/H(\d+)[A-D]/)
        if (blockMatch) {
          const blockNum = parseInt(blockMatch[1], 10)
          // Juz Part B starts from H11, so week 1 in Part B is H11
          const weekNum = blockNum > 10 ? blockNum - 10 : blockNum

          if (!progress.tashih_by_week.has(weekNum)) {
            progress.tashih_by_week.set(weekNum, { count: 0, bloks: [], records: [] })
          }

          const weekData = progress.tashih_by_week.get(weekNum)!
          weekData.count += 1
          if (record.blok_list) {
            weekData.bloks.push(...record.blok_list)
          }
          weekData.records.push(record)
        }
      }
    })

    // Process jurnal records
    jurnalRecords.forEach(record => {
      const progress = progressMap.get(record.user_id)
      if (progress) {
        // Try to get week from block code first
        let weekNum: number | null = null
        const blockMatch = record.blok?.match(/H(\d+)[A-D]/)
        if (blockMatch) {
          const blockNum = parseInt(blockMatch[1], 10)
          weekNum = blockNum > 10 ? blockNum - 10 : blockNum
        } else if (record.tanggal_setor && batchStartDate) {
          // Fallback: calculate week from tanggal_setor (with 7 day offset for jurnal)
          const setorDate = new Date(record.tanggal_setor)
          const startDate = new Date(batchStartDate)
          const diffTime = setorDate.getTime() - startDate.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          const adjustedDays = Math.max(0, diffDays - 7) // 7 day offset for jurnal
          weekNum = Math.min(JURNAL_WEEKS, Math.max(1, Math.floor(adjustedDays / 7) + 1))
        }

        if (weekNum !== null && weekNum >= 1 && weekNum <= JURNAL_WEEKS) {
          if (!progress.jurnal_by_week.has(weekNum)) {
            progress.jurnal_by_week.set(weekNum, { count: 0, bloks: [], records: [] })
          }

          const weekData = progress.jurnal_by_week.get(weekNum)!
          weekData.count += 1
          if (record.blok) {
            weekData.bloks.push(record.blok)
          }
          weekData.records.push(record)
        }
      }
    })

    return Array.from(progressMap.values())
  }, [thalibah, tashihRecords, jurnalRecords, batchStartDate])

  // Filter thalibahs
  const filteredThalibahs = useMemo(() => {
    // If no search query, return all thalibah
    if (!searchQuery.trim()) return thalibahProgress

    const query = searchQuery.toLowerCase().trim()
    return thalibahProgress.filter(thalibah => {
      const name = thalibah.user_data?.full_name?.toLowerCase() || ''
      const email = thalibah.user_data?.email?.toLowerCase() || ''
      return name.includes(query) || email.includes(query)
    })
  }, [thalibahProgress, searchQuery])

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
      // Optimistic update: remove from cache immediately
      await mutateTashih(
        (currentRecords) => currentRecords?.filter(r => r.id !== recordId) || [],
        false
      )

      const result = await deleteTashihRecord(recordId)
      if (result.success) {
        toast.success('Record tashih berhasil dihapus')
        // Revalidate to get fresh data from server
        await mutateTashih()
      } else {
        toast.error(result.error || 'Gagal menghapus record')
        // Rollback on error
        await mutateTashih()
      }
    } catch (error) {
      toast.error('Gagal menghapus record')
      // Rollback on error
      await mutateTashih()
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDeleteJurnal = async (recordId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus record jurnal ini?')) return

    setIsDeleting(recordId)
    try {
      // Optimistic update: remove from cache immediately
      await mutateJurnal(
        (currentRecords) => currentRecords?.filter(r => r.id !== recordId) || [],
        false
      )

      const result = await deleteJurnalRecord(recordId)
      if (result.success) {
        toast.success('Record jurnal berhasil dihapus')
        // Revalidate to get fresh data from server
        await mutateJurnal()
      } else {
        toast.error(result.error || 'Gagal menghapus record')
        // Rollback on error
        await mutateJurnal()
      }
    } catch (error) {
      toast.error('Gagal menghapus record')
      // Rollback on error
      await mutateJurnal()
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
        await mutateJurnal(undefined, { revalidate: true })
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

  // WhatsApp link helper
  const getWhatsAppLink = (phoneNumber: string | undefined, name: string) => {
    if (!phoneNumber) return null

    let formattedPhone = phoneNumber.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone
    }

    const message = `Assalamu'alaikum ${name},\n\nIni adalah pesan dari Musyrifah Tikrar MTI.\n\nJazakillahu khairan\nMusyrifah Tikrar MTI`
    const encodedMessage = encodeURIComponent(message)

    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
  }

  // Stats calculations
  const tashihStats = {
    total_thalibah: thalibahProgress.length,
    thalibah_with_records: new Set(tashihRecords.map(r => r.user_id)).size,
    thalibah_without_records: thalibahProgress.length - new Set(tashihRecords.map(r => r.user_id)).size,
    total_records: tashihRecords.length
  }

  const jurnalStats = {
    total_thalibah: thalibahProgress.length,
    thalibah_with_records: new Set(jurnalRecords.map(r => r.user_id)).size,
    thalibah_without_records: thalibahProgress.length - new Set(jurnalRecords.map(r => r.user_id)).size,
    total_entries: jurnalRecords.length,
    today: jurnalRecords.filter(r => {
      const today = new Date().toISOString().split('T')[0]
      return r.tanggal_setor === today
    }).length
  }

  if (thalibahLoading || isLoadingTashih || isLoadingJurnal) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-army" />
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 -m-6 mb-0 px-6 py-6 rounded-t-lg">
        <h1 className="text-3xl font-bold text-gray-900">Panel Musyrifah</h1>
        <p className="mt-2 text-sm text-gray-600">
          Pantau progres tashih dan jurnal harian thalibah {batch?.name && `- ${batch.name}`}
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500">Total Thalibah</p>
                    <p className="text-2xl font-semibold text-gray-900">{tashihStats.total_thalibah}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500">Sudah Lapor</p>
                    <p className="text-2xl font-semibold text-gray-900">{tashihStats.thalibah_with_records}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500">Belum Lapor</p>
                    <p className="text-2xl font-semibold text-gray-900">{tashihStats.thalibah_without_records}</p>
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
                    <p className="text-2xl font-semibold text-gray-900">{tashihStats.total_records}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-amber-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500">Pekan Saat Ini</p>
                    <p className="text-2xl font-semibold text-gray-900">Pekan {currentTashihWeek}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama atau email thalibah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Thalibah Progress Table */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900">Progres Tashih per Thalibah</h3>
                <p className="mt-1 text-sm text-gray-500">Target: {TASHIH_TARGET}x per pekan (4 blok/pekan) • Total {TASHIH_WEEKS} pekan</p>
              </div>
              <div className="overflow-x-auto">
                {filteredThalibahs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Tidak ada data thalibah ditemukan</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thalibah</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juz</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        {Array.from({ length: TASHIH_WEEKS }, (_, i) => (
                          <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            P{i + 1}
                          </th>
                        ))}
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredThalibahs.map((thalibah) => {
                        const isExpanded = expandedRows.has(thalibah.user_id)
                        const hasAnyRecord = thalibah.tashih_by_week.size > 0
                        const whatsappLink = getWhatsAppLink(thalibah.whatsapp, thalibah.user_data?.full_name || '')

                        return (
                          <>
                            <tr key={thalibah.user_id} className={cn("hover:bg-gray-50", !hasAnyRecord && "bg-red-50")}>
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{thalibah.user_data?.full_name || '-'}</p>
                                <p className="text-xs text-gray-500">{thalibah.user_data?.email || '-'}</p>
                              </td>
                              <td className="px-4 py-3">
                                {whatsappLink ? (
                                  <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors"
                                    title={`WhatsApp ${thalibah.whatsapp}`}
                                  >
                                    <Phone className="h-3 w-3" />
                                    Chat
                                  </a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">{thalibah.chosen_juz || '-'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
                                  hasAnyRecord ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                                )}>
                                  {thalibah.tashih_by_week.size} pekan
                                </span>
                              </td>
                              {Array.from({ length: TASHIH_WEEKS }, (_, i) => {
                                const weekNum = i + 1
                                const weekData = thalibah.tashih_by_week.get(weekNum)
                                const isPastWeek = weekNum < currentTashihWeek
                                const isCurrentWeek = weekNum === currentTashihWeek

                                // Get reported blocks for this week
                                const reportedBlocks = weekData?.bloks || []
                                // Get expected blocks for this week (assuming Part A for now)
                                const expectedBlocks = getBlocksForWeek(weekNum)
                                const missingBlocks = expectedBlocks.filter(b => !reportedBlocks.includes(b))

                                return (
                                  <td key={i} className={cn(
                                    "px-3 py-3 text-center",
                                    isPastWeek && "bg-gray-50",
                                    isCurrentWeek && "bg-yellow-50"
                                  )}>
                                    {weekData ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className={cn(
                                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                          reportedBlocks.length >= 4 ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"
                                        )}>
                                          {reportedBlocks.length}/4
                                        </span>
                                        {missingBlocks.length > 0 && missingBlocks.length < 4 && (
                                          <span className="text-[9px] text-red-500">
                                            -{missingBlocks.join(',')}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className={cn(
                                        "inline-flex items-center px-2 py-1 rounded text-xs",
                                        isPastWeek ? "text-red-500" : "text-gray-400"
                                      )}>
                                        {isPastWeek ? '0/4' : '-'}
                                      </span>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  {hasAnyRecord && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteModalUser(thalibah)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Hapus Records"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleRowExpansion(thalibah.user_id)}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${thalibah.user_id}-details`} className="bg-gray-50">
                                <td colSpan={14 + TASHIH_WEEKS} className="px-4 py-4">
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900">Detail Tashih - {thalibah.user_data?.full_name}</h4>
                                    <div className="grid gap-2">
                                      {Array.from({ length: TASHIH_WEEKS }, (_, i) => {
                                        const weekNum = i + 1
                                        const weekData = thalibah.tashih_by_week.get(weekNum)
                                        const expectedBlocks = getBlocksForWeek(weekNum)
                                        const reportedBlocks = weekData?.bloks || []
                                        const missingBlocks = expectedBlocks.filter(b => !reportedBlocks.includes(b))

                                        return (
                                          <div key={i} className="bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-center mb-2">
                                              <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                  Pekan {weekNum}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                  {weekData ? `${weekData.count} record` : 'Belum ada record'}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Show reported blocks */}
                                            <div className="mb-2">
                                              <span className="text-xs font-medium text-gray-500">Sudah Lapor: </span>
                                              {reportedBlocks.length > 0 ? (
                                                <span className="text-xs">
                                                  {reportedBlocks.map((blok, idx) => (
                                                    <span key={blok} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 mr-1">
                                                      {blok}
                                                    </span>
                                                  ))}
                                                </span>
                                              ) : (
                                                <span className="text-xs text-gray-400">Belum ada</span>
                                              )}
                                            </div>

                                            {/* Show missing blocks */}
                                            <div className="mb-2">
                                              <span className="text-xs font-medium text-gray-500">Belum Lapor: </span>
                                              {missingBlocks.length > 0 ? (
                                                <span className="text-xs">
                                                  {missingBlocks.map((blok, idx) => (
                                                    <span key={blok} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 mr-1">
                                                      {blok}
                                                    </span>
                                                  ))}
                                                </span>
                                              ) : (
                                                <span className="text-xs text-green-600">Semua blok sudah dilaporkan</span>
                                              )}
                                            </div>

                                            {/* Show records detail */}
                                            {weekData && weekData.records.length > 0 && (
                                              <div className="grid gap-1 mt-2 pt-2 border-t border-gray-100">
                                                {weekData.records.map(record => (
                                                  <div key={record.id} className="text-xs bg-gray-50 p-2 rounded">
                                                    <div className="flex justify-between items-center mb-1">
                                                      <div className="flex items-center gap-1">
                                                        {record.blok_list?.map(blok => (
                                                          <span key={blok} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800">
                                                            {blok}
                                                          </span>
                                                        ))}
                                                      </div>
                                                      <span className="text-gray-500">{formatDateOnly(record.waktu_tashih)}</span>
                                                    </div>
                                                    <div className="text-right">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteTashih(record.id)}
                                                        disabled={isDeleting === record.id}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                      >
                                                        {isDeleting === record.id ? (
                                                          <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                          <Trash2 className="h-3 w-3" />
                                                        )}
                                                      </Button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
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

        {activeTab === 'jurnal' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500">Total Thalibah</p>
                    <p className="text-2xl font-semibold text-gray-900">{jurnalStats.total_thalibah}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500">Sudah Lapor</p>
                    <p className="text-2xl font-semibold text-gray-900">{jurnalStats.thalibah_with_records}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500">Belum Lapor</p>
                    <p className="text-2xl font-semibold text-gray-900">{jurnalStats.thalibah_without_records}</p>
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
                    <p className="text-2xl font-semibold text-gray-900">{jurnalStats.total_entries}</p>
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
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama atau email thalibah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Jurnal Records Table */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900">Jurnal Harian per Thalibah</h3>
                <p className="mt-1 text-sm text-gray-500">Target: 4 blok per pekan • Total {JURNAL_WEEKS} pekan</p>
              </div>
              <div className="overflow-x-auto">
                {filteredThalibahs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Tidak ada data thalibah ditemukan</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thalibah</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juz</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        {Array.from({ length: JURNAL_WEEKS }, (_, i) => (
                          <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            P{i + 1}
                          </th>
                        ))}
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredThalibahs.map((thalibah) => {
                        const isExpanded = expandedRows.has(thalibah.user_id)
                        const hasAnyRecord = thalibah.jurnal_by_week.size > 0
                        const whatsappLink = getWhatsAppLink(thalibah.whatsapp, thalibah.user_data?.full_name || '')

                        return (
                          <>
                            <tr key={thalibah.user_id} className={cn("hover:bg-gray-50", !hasAnyRecord && "bg-red-50")}>
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{thalibah.user_data?.full_name || '-'}</p>
                                <p className="text-xs text-gray-500">{thalibah.user_data?.email || '-'}</p>
                              </td>
                              <td className="px-4 py-3">
                                {whatsappLink ? (
                                  <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors"
                                    title={`WhatsApp ${thalibah.whatsapp}`}
                                  >
                                    <Phone className="h-3 w-3" />
                                    Chat
                                  </a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">{thalibah.chosen_juz || '-'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
                                  hasAnyRecord ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                                )}>
                                  {thalibah.jurnal_by_week.size} pekan
                                </span>
                              </td>
                              {Array.from({ length: JURNAL_WEEKS }, (_, i) => {
                                const weekNum = i + 1
                                const weekData = thalibah.jurnal_by_week.get(weekNum)
                                const isPastWeek = weekNum < currentJurnalWeek
                                const isCurrentWeek = weekNum === currentJurnalWeek
                                const blocksComplete = weekData && weekData.bloks.length >= 4

                                // Get reported blocks for this week
                                const reportedBlocks = weekData?.bloks || []
                                const expectedBlocks = getBlocksForWeek(weekNum)
                                const missingBlocks = expectedBlocks.filter(b => !reportedBlocks.includes(b))

                                return (
                                  <td key={i} className={cn(
                                    "px-3 py-3 text-center",
                                    isPastWeek && "bg-gray-50",
                                    isCurrentWeek && "bg-yellow-50"
                                  )}>
                                    {weekData ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className={cn(
                                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                          blocksComplete
                                            ? "bg-green-100 text-green-800"
                                            : weekData.bloks.length > 0
                                              ? "bg-blue-100 text-blue-800"
                                              : "bg-gray-100 text-gray-600"
                                        )}>
                                          {weekData.bloks.length}/4
                                        </span>
                                        {missingBlocks.length > 0 && missingBlocks.length < 4 && (
                                          <span className="text-[9px] text-red-500">
                                            -{missingBlocks.join(',')}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className={cn(
                                        "inline-flex items-center px-2 py-1 rounded text-xs",
                                        isPastWeek ? "text-red-500" : "text-gray-400"
                                      )}>
                                        {isPastWeek ? '0/4' : '-'}
                                      </span>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  {hasAnyRecord && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteModalUser(thalibah)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Hapus Records"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleRowExpansion(thalibah.user_id)}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${thalibah.user_id}-details`} className="bg-gray-50">
                                <td colSpan={15 + JURNAL_WEEKS} className="px-4 py-4">
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900">Detail Jurnal - {thalibah.user_data?.full_name}</h4>
                                    <div className="grid gap-2">
                                      {Array.from({ length: JURNAL_WEEKS }, (_, i) => {
                                        const weekNum = i + 1
                                        const weekData = thalibah.jurnal_by_week.get(weekNum)
                                        const expectedBlocks = getBlocksForWeek(weekNum)
                                        const reportedBlocks = weekData?.bloks || []
                                        const missingBlocks = expectedBlocks.filter(b => !reportedBlocks.includes(b))

                                        return (
                                          <div key={i} className="bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-center mb-2">
                                              <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                  Pekan {weekNum}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                  {weekData ? `${weekData.count} entry` : 'Belum ada entry'}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Show reported blocks */}
                                            <div className="mb-2">
                                              <span className="text-xs font-medium text-gray-500">Sudah Lapor: </span>
                                              {reportedBlocks.length > 0 ? (
                                                <span className="text-xs">
                                                  {Array.from(new Set(reportedBlocks)).map((blok: string) => (
                                                    <span key={blok} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 mr-1">
                                                      {blok}
                                                    </span>
                                                  ))}
                                                </span>
                                              ) : (
                                                <span className="text-xs text-gray-400">Belum ada</span>
                                              )}
                                            </div>

                                            {/* Show missing blocks */}
                                            <div className="mb-2">
                                              <span className="text-xs font-medium text-gray-500">Belum Lapor: </span>
                                              {missingBlocks.length > 0 ? (
                                                <span className="text-xs">
                                                  {missingBlocks.map((blok, idx) => (
                                                    <span key={blok} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 mr-1">
                                                      {blok}
                                                    </span>
                                                  ))}
                                                </span>
                                              ) : (
                                                <span className="text-xs text-green-600">Semua blok sudah dilaporkan</span>
                                              )}
                                            </div>

                                            {/* Show records detail */}
                                            {weekData && weekData.records.length > 0 && (
                                              <div className="grid gap-1 mt-2 pt-2 border-t border-gray-100">
                                                {weekData.records.map(entry => {
                                                  const isEditing = editingRecord?.id === entry.id

                                                  return (
                                                    <div key={entry.id} className={`text-xs bg-gray-50 p-2 rounded ${isEditing ? 'border-2 border-blue-300' : ''}`}>
                                                      <div className="flex justify-between items-start mb-1">
                                                        <div className="flex items-center gap-1">
                                                          <span className="font-medium text-gray-700">{formatDateOnly(entry.tanggal_setor)}</span>
                                                          {entry.juz_code && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                                              Juz {entry.juz_code}
                                                            </span>
                                                          )}
                                                          {entry.blok && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                                                              {entry.blok}
                                                            </span>
                                                          )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditJurnal(entry)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                          >
                                                            <Edit className="h-3 w-3" />
                                                          </Button>
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteJurnal(entry.id)}
                                                            disabled={isDeleting === entry.id}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                          >
                                                            {isDeleting === entry.id ? (
                                                              <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                              <Trash2 className="h-3 w-3" />
                                                            )}
                                                          </Button>
                                                        </div>
                                                      </div>

                                                      {isEditing ? (
                                                        <div className="mt-2 space-y-2">
                                                          <label className="text-xs font-medium text-gray-700">Catatan Tambahan:</label>
                                                          <textarea
                                                            value={editingRecord.catatan_tambahan || ''}
                                                            onChange={(e) => setEditingRecord({ ...editingRecord, catatan_tambahan: e.target.value })}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                                            rows={2}
                                                          />
                                                          <div className="flex gap-1">
                                                            <Button
                                                              size="sm"
                                                              onClick={handleSaveJurnal}
                                                              className="bg-green-600 hover:bg-green-700"
                                                            >
                                                              <Save className="h-3 w-3 mr-1" />
                                                              Simpan
                                                            </Button>
                                                            <Button
                                                              size="sm"
                                                              variant="outline"
                                                              onClick={handleCancelEdit}
                                                            >
                                                              <X className="h-3 w-3 mr-1" />
                                                              Batal
                                                            </Button>
                                                          </div>
                                                        </div>
                                                      ) : (
                                                        <>
                                                          <div className="grid grid-cols-4 gap-0.5 text-[10px]">
                                                            <div>{getStatusBadge(entry.rabth_completed)} R</div>
                                                            <div>{getStatusBadge(entry.murajaah_count > 0)} M({entry.murajaah_count})</div>
                                                            <div>{getStatusBadge(entry.simak_murattal_count > 0)} S({entry.simak_murattal_count})</div>
                                                            <div>{getStatusBadge(entry.tikrar_bi_an_nadzar_completed)} N</div>
                                                            <div>{getStatusBadge(entry.tasmi_record_count > 0)} T({entry.tasmi_record_count})</div>
                                                            <div>{getStatusBadge(entry.simak_record_completed)} SR</div>
                                                            <div>{getStatusBadge(entry.tikrar_bi_al_ghaib_count > 0)} G({entry.tikrar_bi_al_ghaib_count})</div>
                                                          </div>
                                                          {entry.catatan_tambahan && (
                                                            <div className="mt-1 text-[10px] text-gray-600 bg-gray-100 p-1 rounded">
                                                              <span className="font-medium">Catatan:</span> {entry.catatan_tambahan}
                                                            </div>
                                                          )}
                                                        </>
                                                      )}
                                                    </div>
                                                  )
                                                })}
                                              </div>
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
      </div>

      {/* Delete Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteModalUser(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Hapus Records - {deleteModalUser.user_data?.full_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {activeTab === 'tashih' ? 'Pilih record tashih yang ingin dihapus' : 'Pilih record jurnal yang ingin dihapus'}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDeleteModalUser(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              {activeTab === 'tashih' ? (
                <div className="space-y-4">
                  {Array.from({ length: TASHIH_WEEKS }, (_, i) => {
                    const weekNum = i + 1
                    const weekData = deleteModalUser.tashih_by_week.get(weekNum)
                    if (!weekData || weekData.records.length === 0) return null

                    return (
                      <div key={weekNum} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">Pekan {weekNum}</span>
                          <span className="text-sm text-gray-500">{weekData.records.length} record</span>
                        </div>
                        <div className="space-y-2">
                          {weekData.records.map((record: ReportTashihRecord) => (
                            <div key={record.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  {record.blok_list?.map((blok: string) => (
                                    <span key={blok} className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                                      {blok}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(record.waktu_tashih).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (!confirm('Hapus record ini?')) return
                                  setIsDeleting(record.id)
                                  try {
                                    // Optimistic update: remove from cache immediately
                                    await mutateTashih(
                                      (currentRecords) => currentRecords?.filter(r => r.id !== record.id) || [],
                                      false
                                    )

                                    const result = await deleteTashihRecord(record.id)
                                    if (result.success) {
                                      toast.success('Record berhasil dihapus')
                                      // Close modal first
                                      setDeleteModalUser(null)
                                      setIsDeleting(null)
                                      // Revalidate to get fresh data from server
                                      await mutateTashih()
                                      return
                                    } else {
                                      toast.error(result.error || 'Gagal menghapus')
                                      // Rollback on error
                                      await mutateTashih()
                                    }
                                  } catch (error) {
                                    toast.error('Gagal menghapus')
                                    // Rollback on error
                                    await mutateTashih()
                                  } finally {
                                    setIsDeleting(null)
                                  }
                                }}
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
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {deleteModalUser.tashih_by_week.size === 0 && (
                    <p className="text-center text-gray-500 py-8">Tidak ada record untuk dihapus</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: JURNAL_WEEKS }, (_, i) => {
                    const weekNum = i + 1
                    const weekData = deleteModalUser.jurnal_by_week.get(weekNum)
                    if (!weekData || weekData.records.length === 0) return null

                    return (
                      <div key={weekNum} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">Pekan {weekNum}</span>
                          <span className="text-sm text-gray-500">{weekData.records.length} record</span>
                        </div>
                        <div className="space-y-2">
                          {weekData.records.map((record: ReportJurnalRecord) => (
                            <div key={record.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex items-center gap-2">
                                {record.blok && (
                                  <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                    {record.blok}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(record.tanggal_setor).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (!confirm('Hapus record ini?')) return
                                  setIsDeleting(record.id)
                                  try {
                                    // Optimistic update: remove from cache immediately
                                    await mutateJurnal(
                                      (currentRecords) => currentRecords?.filter(r => r.id !== record.id) || [],
                                      false
                                    )

                                    const result = await deleteJurnalRecord(record.id)
                                    if (result.success) {
                                      toast.success('Record berhasil dihapus')
                                      // Close modal first
                                      setDeleteModalUser(null)
                                      setIsDeleting(null)
                                      // Revalidate to get fresh data from server
                                      await mutateJurnal()
                                      return
                                    } else {
                                      toast.error(result.error || 'Gagal menghapus')
                                      // Rollback on error
                                      await mutateJurnal()
                                    }
                                  } catch (error) {
                                    toast.error('Gagal menghapus')
                                    // Rollback on error
                                    await mutateJurnal()
                                  } finally {
                                    setIsDeleting(null)
                                  }
                                }}
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
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {deleteModalUser.jurnal_by_week.size === 0 && (
                    <p className="text-center text-gray-500 py-8">Tidak ada record untuk dihapus</p>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <Button variant="outline" onClick={() => setDeleteModalUser(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
