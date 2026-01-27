'use client'

import React, { useState, useEffect, useRef, TouchEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, MapPin, BookOpen, AlertCircle, Calendar, Loader2, School, ChevronDown, Lock, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAllRegistrations } from '@/hooks/useRegistrations'
import { useAuth } from '@/hooks/useAuth'
import { useTashihStatus } from '@/hooks/useDashboard'
import { saveTashihRecord } from './actions'

interface JuzOption {
  id: string
  code: string
  name: string
  juz_number: number
  part: string
  start_page: number
  end_page: number
}

interface TashihBlock {
  block_code: string
  week_number: number
  part: string
  start_page: number
  end_page: number
}

interface TashihData {
  blok: string[]
  lokasi: 'mti' | 'luar'
  lokasiDetail: string
  ustadzahId: string | null
  ustadzahName: string | null
  jumlahKesalahanTajwid: number
  masalahTajwid: string[]
  catatanTambahan: string
  tanggalTashih: string
}

interface TashihRecord {
  id: string
  blok: string
  lokasi: string
  lokasi_detail: string | null
  nama_pemeriksa: string | null
  ustadzah_id: string | null
  jumlah_kesalahan_tajwid: number | null
  masalah_tajwid: string[] | null
  catatan_tambahan: string | null
  waktu_tashih: string
  created_at: string
}

interface MuallimahOption {
  id: string
  user_id: string
  full_name: string
  preferred_juz: string
}


const masalahTajwidOptions = [
  { id: 'mad', name: 'Mad', description: 'Masalah panjang pendek', color: 'bg-blue-50' },
  { id: 'qolqolah', name: 'Qolqolah', description: 'Masalah qolqolah', color: 'bg-purple-50' },
  { id: 'ghunnah', name: 'Ghunnah', description: 'Masalah ghunnah', color: 'bg-pink-50' },
  { id: 'ikhfa', name: 'Ikhfa', description: 'Masalah ikhfa', color: 'bg-indigo-50' },
  { id: 'idghom', name: 'Idghom', description: 'Masalah idghom', color: 'bg-teal-50' },
  { id: 'izhar', name: 'Izhar', description: 'Masalah izhar', color: 'bg-cyan-50' },
  { id: 'waqaf', name: 'Waqaf', description: 'Masalah waqaf dan ibtida', color: 'bg-amber-50' },
  { id: 'makhroj', name: 'Makhroj', description: 'Masalah makhroj huruf', color: 'bg-red-50' },
  { id: 'sifat', name: 'Sifat', description: 'Masalah sifat huruf', color: 'bg-orange-50' },
  { id: 'lainnya', name: 'Lainnya', description: 'Masalah tajwid lainnya', color: 'bg-gray-50' }
]

export default function TashihPage() {
  const { user } = useAuth()
  const { registrations, isLoading: registrationsLoading } = useAllRegistrations()
  const { tashihStatus, isLoading: tashihStatusLoading, mutate: mutateTashihStatus } = useTashihStatus()

  const [tashihData, setTashihData] = useState<TashihData>({
    blok: [],
    lokasi: 'mti',
    lokasiDetail: '',
    ustadzahId: null,
    ustadzahName: null,
    jumlahKesalahanTajwid: 0,
    masalahTajwid: [],
    catatanTambahan: '',
    tanggalTashih: new Date().toISOString().slice(0, 10)
  })

  const [todayRecord, setTodayRecord] = useState<TashihRecord | null>(null)
  const [weekRecords, setWeekRecords] = useState<TashihRecord[]>([])
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValid, setIsValid] = useState(false)

  const [confirmedJuz, setConfirmedJuz] = useState<string | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [batchStartDate, setBatchStartDate] = useState<string | null>(null)
  const [availableBlocks, setAvailableBlocks] = useState<TashihBlock[]>([])
  const [selectedJuzInfo, setSelectedJuzInfo] = useState<JuzOption | null>(null)
  const [availableMuallimah, setAvailableMuallimah] = useState<MuallimahOption[]>([])
  const [isLoadingMuallimah, setIsLoadingMuallimah] = useState(false)
  const [isUstadzahDropdownOpen, setIsUstadzahDropdownOpen] = useState(false)
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1)
  const [displayedWeekNumber, setDisplayedWeekNumber] = useState<number>(1) // For date navigation
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const minSwipeDistance = 50
  const carouselRef = useRef<HTMLDivElement>(null)

  // View mode: 'status' = show block status, 'form' = show tashih form
  const [viewMode, setViewMode] = useState<'status' | 'form'>('status')
  const [selectedBlocksForEditing, setSelectedBlocksForEditing] = useState<string[]>([])

  // Get active registration with daftar ulang
  const activeRegistration = registrations.find((reg: any) =>
    reg.batch?.status === 'open' &&
    (reg.status === 'approved' || reg.selection_status === 'selected')
  ) || registrations[0]

  // Determine juz to use: confirmed_chosen_juz from daftar_ulang, or chosen_juz from registration
  const juzToUse = activeRegistration?.daftar_ulang?.confirmed_chosen_juz ||
                      (activeRegistration as any)?.chosen_juz ||
                      null

  // Load juz info and blocks when registration is available
  useEffect(() => {
    if (juzToUse && activeRegistration?.batch?.start_date) {
      setConfirmedJuz(juzToUse)
      setBatchId(activeRegistration.batch.id)
      setBatchStartDate(activeRegistration.batch.start_date)
      loadJuzInfo(juzToUse)
    }
  }, [juzToUse, activeRegistration])

  // Update blocks when week changes or juz info is loaded
  useEffect(() => {
    if (selectedJuzInfo && batchStartDate) {
      updateBlocksForWeek(selectedWeekNumber)
    }
  }, [selectedWeekNumber, selectedJuzInfo, batchStartDate])

  // Load muallimah when batch is available
  useEffect(() => {
    if (batchId && juzToUse) {
      loadAvailableMuallimah()
    }
  }, [batchId, juzToUse])

  // Load week's records when week number changes
  useEffect(() => {
    if (confirmedJuz && user && selectedWeekNumber) {
      loadWeekRecords()
    }
  }, [confirmedJuz, user, selectedWeekNumber])

  const loadJuzInfo = async (juzCode: string) => {
    setIsLoadingBlocks(true)
    try {
      const supabase = createClient()

      // Get juz info
      const { data: juzData } = await supabase
        .from('juz_options')
        .select('*')
        .eq('code', juzCode)
        .single()

      if (!juzData) {
        console.error('Juz not found:', juzCode)
        return
      }

      setSelectedJuzInfo(juzData)
    } catch (error) {
      console.error('Error loading juz info:', error)
    } finally {
      setIsLoadingBlocks(false)
    }
  }

  const updateBlocksForWeek = (weekNumber: number) => {
    if (!selectedJuzInfo) return

    // Calculate total pages for this juz part
    const totalPages = selectedJuzInfo.end_page - selectedJuzInfo.start_page + 1
    const totalWeeks = totalPages  // 1 week = 1 page = 4 blocks

    // Validate week number is within range
    if (weekNumber < 1 || weekNumber > totalWeeks) {
      setAvailableBlocks([])
      return
    }

    // Part B starts from H11, Part A starts from H1
    const blockOffset = selectedJuzInfo.part === 'B' ? 10 : 0
    const blockNumber = weekNumber + blockOffset

    // Each week corresponds to 1 page
    const weekPage = selectedJuzInfo.start_page + (weekNumber - 1)

    // Generate 4 blocks for this week (A, B, C, D all for the same page)
    const blocks: TashihBlock[] = []
    const parts = ['A', 'B', 'C', 'D']

    for (let i = 0; i < 4; i++) {
      const part = parts[i]
      const blockCode = `H${blockNumber}${part}`

      blocks.push({
        block_code: blockCode,
        week_number: weekNumber,
        part,
        start_page: weekPage,
        end_page: weekPage  // All 4 blocks are on the same page
      })
    }

    setAvailableBlocks(blocks)
  }

  const loadAvailableMuallimah = async () => {
    if (!batchId || !juzToUse) return

    try {
      setIsLoadingMuallimah(true)
      const supabase = createClient()

      const { data: muallimahData } = await supabase
        .from('muallimah_registrations')
        .select('id, user_id, full_name, preferred_juz')
        .eq('batch_id', batchId)
        .in('status', ['approved', 'submitted'])
        .order('full_name', { ascending: true })

      setAvailableMuallimah(muallimahData || [])
    } catch (error) {
      console.error('Error loading muallimah:', error)
    } finally {
      setIsLoadingMuallimah(false)
    }
  }

  const loadWeekRecords = async () => {
    if (!user || !batchStartDate) return

    try {
      const supabase = createClient()

      // Get week start and end dates
      const weekStart = getWeekStartDate(selectedWeekNumber)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7) // Add 7 days for end of week

      const { data, error } = await supabase
        .from('tashih_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('waktu_tashih', weekStart.toISOString())
        .lt('waktu_tashih', weekEnd.toISOString())
        .order('waktu_tashih', { ascending: false })

      if (error) {
        console.error('Error loading week tashih records:', error)
        return
      }

      setWeekRecords(data || [])

      // Get unique blocks for this week
      const weekBlocks = new Set<string>()
      if (data) {
        data.forEach((record: TashihRecord) => {
          if (record.blok) {
            const blocks: string[] = typeof record.blok === 'string'
              ? record.blok.split(',').map(b => b.trim()).filter(b => b)
              : (Array.isArray(record.blok) ? record.blok : [])
            blocks.forEach(block => weekBlocks.add(block))
          }
        })
      }

      // Check if all expected blocks for this week are completed (handles variable block count)
      const expectedBlocks = getExpectedBlocksForWeek(selectedWeekNumber)
      const allBlocksCompleted = expectedBlocks.length > 0 && expectedBlocks.every(block => weekBlocks.has(block))

      // Get today's record for editing (if exists)
      const today = new Date().toISOString().split('T')[0]
      const todayRec = data?.find((r: TashihRecord) => r.waktu_tashih.startsWith(today))
      setTodayRecord(todayRec || null)

      // If all expected blocks completed, load the most recent record for display
      if (allBlocksCompleted && data && data.length > 0) {
        const mostRecent = data[0]
        setTodayRecord(mostRecent)
        // Map legacy 'halaqah' value to 'mti'
        const lokasiValue = mostRecent.lokasi === 'halaqah' ? 'mti' : mostRecent.lokasi as 'mti' | 'luar'
        // Handle blok: stored as comma-separated string in DB, convert to array
        let blokValue: string[] = []
        if (mostRecent.blok) {
          if (typeof mostRecent.blok === 'string') {
            blokValue = mostRecent.blok.split(',').filter((b: string) => b.trim())
          } else if (Array.isArray(mostRecent.blok)) {
            blokValue = mostRecent.blok
          }
        }
        setTashihData({
          blok: blokValue,
          lokasi: lokasiValue,
          lokasiDetail: mostRecent.lokasi_detail || '',
          ustadzahId: mostRecent.ustadzah_id || null,
          ustadzahName: mostRecent.nama_pemeriksa || null,
          jumlahKesalahanTajwid: mostRecent.jumlah_kesalahan_tajwid || 0,
          masalahTajwid: mostRecent.masalah_tajwid || [],
          catatanTambahan: mostRecent.catatan_tambahan || '',
          tanggalTashih: new Date(mostRecent.waktu_tashih).toISOString().slice(0, 10)
        })
      } else if (todayRec) {
        // Load today's record for editing if week is not complete
        const lokasiValue = todayRec.lokasi === 'halaqah' ? 'mti' : todayRec.lokasi as 'mti' | 'luar'
        let blokValue: string[] = []
        if (todayRec.blok) {
          if (typeof todayRec.blok === 'string') {
            blokValue = todayRec.blok.split(',').filter((b: string) => b.trim())
          } else if (Array.isArray(todayRec.blok)) {
            blokValue = todayRec.blok
          }
        }
        setTashihData({
          blok: blokValue,
          lokasi: lokasiValue,
          lokasiDetail: todayRec.lokasi_detail || '',
          ustadzahId: todayRec.ustadzah_id || null,
          ustadzahName: todayRec.nama_pemeriksa || null,
          jumlahKesalahanTajwid: todayRec.jumlah_kesalahan_tajwid || 0,
          masalahTajwid: todayRec.masalah_tajwid || [],
          catatanTambahan: todayRec.catatan_tambahan || '',
          tanggalTashih: new Date(todayRec.waktu_tashih).toISOString().slice(0, 10)
        })
      }
    } catch (error) {
      console.error('Error loading week tashih records:', error)
    }
  }

  const validateForm = () => {
    const valid = !!(
      tashihData.blok &&
      tashihData.blok.length > 0 &&
      tashihData.lokasi &&
      tashihData.tanggalTashih &&
      (tashihData.lokasi === 'luar' ? tashihData.lokasiDetail : true)
    )
    setIsValid(valid)
    return valid
  }

  // Toggle blok selection (multi-select)
  // Auto-select all 4 blocks in the same week when one is clicked
  const toggleBlok = (blockCode: string) => {
    setTashihData(prev => {
      const isCurrentlySelected = prev.blok.includes(blockCode)

      // Extract week number from block code (format: H{number}{letter})
      const match = blockCode.match(/H(\d+)[A-D]/)
      if (!match) return prev

      const blockNumber = match[1]
      const sameWeekBlocks = [`H${blockNumber}A`, `H${blockNumber}B`, `H${blockNumber}C`, `H${blockNumber}D`]

      if (isCurrentlySelected) {
        // Unselect this specific block (allow individual unselect)
        return {
          ...prev,
          blok: prev.blok.filter(b => b !== blockCode)
        }
      } else {
        // Select all 4 blocks in the same week
        // Remove any blocks from the same week that were already selected, then add all 4
        const otherWeekBlocks = prev.blok.filter(b => !sameWeekBlocks.includes(b))
        return {
          ...prev,
          blok: [...otherWeekBlocks, ...sameWeekBlocks]
        }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    if (!user) {
      toast.error('Silakan login terlebih dahulu')
      return
    }

    setIsSubmitting(true)
    try {
      // Use server action for database operations (following arsitektur.md)
      // Server action uses supabase.auth.getUser() which guarantees user_id matches auth.uid()
      const result = await saveTashihRecord({
        blok: tashihData.blok.join(','), // Store as comma-separated string for DB compatibility
        lokasi: tashihData.lokasi,
        lokasi_detail: tashihData.lokasiDetail || null,
        ustadzah_id: tashihData.ustadzahId,
        nama_pemeriksa: tashihData.ustadzahName,
        jumlah_kesalahan_tajwid: tashihData.jumlahKesalahanTajwid,
        masalah_tajwid: tashihData.masalahTajwid,
        catatan_tambahan: tashihData.catatanTambahan || null,
        waktu_tashih: new Date(tashihData.tanggalTashih).toISOString()
      })

      if (!result.success) {
        console.error('Error saving tashih record:', result.error)
        toast.error('Gagal menyimpan data tashih: ' + result.error)
        return
      }

      toast.success(result.message || 'Tashih berhasil disimpan!')
      await loadWeekRecords()
      // Refresh tashih status to update block colors immediately
      // Use mutate() to force revalidation and bypass cache
      await mutateTashihStatus(undefined, { revalidate: true, rollbackOnError: false })
      // Return to status view after saving
      setViewMode('status')
      setSelectedBlocksForEditing([])
    } catch (error) {
      console.error('Error saving tashih:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle block click from status view
  const handleBlockClick = (blockCode: string, blockWeekNumber: number) => {
    if (!tashihStatus) return

    // Find the block in tashihStatus
    const block = tashihStatus.blocks.find(b => b.block_code === blockCode)
    if (!block) return

    // Calculate actual week number (1-10)
    const actualWeekNumber = blockWeekNumber

    // Check if week is allowed (from week 1 to current week only)
    const currentWeekNumber = getCurrentWeekNumber()
    const isPastWeek = actualWeekNumber >= 1 && actualWeekNumber < currentWeekNumber
    const isCurrentWeek = actualWeekNumber === currentWeekNumber
    const isWeekAllowed = isPastWeek || isCurrentWeek

    if (!isWeekAllowed) {
      if (actualWeekNumber > currentWeekNumber) {
        toast.error(`Pekan ${actualWeekNumber} belum dimulai. Anda hanya bisa mengisi pekan 1 sampai ${currentWeekNumber}.`)
      }
      return
    }

    // If block is completed, load its data for editing
    if (block.is_completed && block.tashih_date) {
      // Find the record for this block
      const record = weekRecords.find(r => {
        if (!r.blok) return false
        const blocks: string[] = typeof r.blok === 'string'
          ? r.blok.split(',').map(b => b.trim()).filter(b => b)
          : (Array.isArray(r.blok) ? r.blok : [])
        return blocks.includes(blockCode)
      })

      if (record) {
        // Load the record data for editing
        const lokasiValue = record.lokasi === 'halaqah' ? 'mti' : record.lokasi as 'mti' | 'luar'
        let blokValue: string[] = []
        if (record.blok) {
          if (typeof record.blok === 'string') {
            blokValue = record.blok.split(',').filter((b: string) => b.trim())
          } else if (Array.isArray(record.blok)) {
            blokValue = record.blok
          }
        }
        setTashihData({
          blok: blokValue,
          lokasi: lokasiValue,
          lokasiDetail: record.lokasi_detail || '',
          ustadzahId: record.ustadzah_id || null,
          ustadzahName: record.nama_pemeriksa || null,
          jumlahKesalahanTajwid: record.jumlah_kesalahan_tajwid || 0,
          masalahTajwid: record.masalah_tajwid || [],
          catatanTambahan: record.catatan_tambahan || '',
          tanggalTashih: new Date(record.waktu_tashih).toISOString().slice(0, 10)
        })
        toast.info(`Mengedit blok ${blockCode} yang sudah ditashih`)
      } else {
        // Block is completed but record not found in weekRecords, load for this week
        setSelectedWeekNumber(actualWeekNumber)
        updateBlocksForWeek(actualWeekNumber)
        loadWeekRecords()
      }
    } else {
      // For new tashih, auto-select all 4 blocks in the same week
      const match = blockCode.match(/H(\d+)[A-D]/)
      if (!match) return
      const blockNumber = match[1]
      const sameWeekBlocks = [`H${blockNumber}A`, `H${blockNumber}B`, `H${blockNumber}C`, `H${blockNumber}D`]
      setSelectedBlocksForEditing(sameWeekBlocks)
      setTashihData(prev => ({ ...prev, blok: sameWeekBlocks }))
    }

    // Update week number based on block (week_number from API is already 1-10)
    setSelectedWeekNumber(blockWeekNumber)
    updateBlocksForWeek(blockWeekNumber)

    // Switch to form view
    setViewMode('form')
  }

  const resetForm = () => {
    setTashihData({
      blok: [],
      lokasi: 'mti',
      lokasiDetail: '',
      ustadzahId: null,
      ustadzahName: null,
      jumlahKesalahanTajwid: 0,
      masalahTajwid: [],
      catatanTambahan: '',
      tanggalTashih: new Date().toISOString().slice(0, 10)
    })
    setTodayRecord(null)
    setWeekRecords([])
    setIsValid(false)
    // Return to status view
    setViewMode('status')
    setSelectedBlocksForEditing([])
  }

  const toggleMasalahTajwid = (masalahId: string) => {
    setTashihData(prev => ({
      ...prev,
      masalahTajwid: prev.masalahTajwid.includes(masalahId)
        ? prev.masalahTajwid.filter(id => id !== masalahId)
        : [...prev.masalahTajwid, masalahId]
    }))
  }

  useEffect(() => {
    validateForm()
  }, [tashihData])

  // Calculate week number from batch start date
  const getWeekNumberFromDate = (date: Date): number => {
    if (!batchStartDate) return 1
    const startDate = new Date(batchStartDate)
    const diffTime = date.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const weekNumber = Math.floor(diffDays / 7) + 1
    return Math.max(1, weekNumber)
  }

  // Get start date of a week (Senin) based on week number from batch start
  const getWeekStartDate = (weekNumber: number): Date => {
    if (!batchStartDate) return new Date()
    const startDate = new Date(batchStartDate)
    // Adjust to Monday of the first week
    const dayOfWeek = startDate.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const firstMonday = new Date(startDate)
    firstMonday.setDate(startDate.getDate() + daysToMonday)
    // Add weeks
    const weekStart = new Date(firstMonday)
    weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7)
    return weekStart
  }

  // Get date for a given day index within a week (0=Senin, 6=Ahad)
  const getDayDateInWeek = (weekNumber: number, dayIndex: number): Date => {
    const weekStart = getWeekStartDate(weekNumber)
    const targetDate = new Date(weekStart)
    targetDate.setDate(weekStart.getDate() + dayIndex)
    return targetDate
  }

  // Handle date selection and update week number
  const handleDateSelection = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    const weekNum = getWeekNumberFromDate(date)
    setSelectedWeekNumber(weekNum)
    setTashihData(prev => ({ ...prev, tanggalTashih: dateString, blok: [] as string[] }))
  }

  // Get current week number from today's date
  const getCurrentWeekNumber = (): number => {
    const weekNum = getWeekNumberFromDate(new Date())
    // Ensure week number is at least 1 for a new batch
    return Math.max(1, weekNum)
  }

  // Helper: Get expected blocks for a given week
  // Each week always has 4 blocks (A, B, C, D) for 1 page
  const getExpectedBlocksForWeek = (weekNumber: number): string[] => {
    if (!selectedJuzInfo) return []

    // Calculate total pages for this juz part
    const totalPages = selectedJuzInfo.end_page - selectedJuzInfo.start_page + 1

    // Validate week number is within range
    if (weekNumber < 1 || weekNumber > totalPages) return []

    const blockOffset = selectedJuzInfo.part === 'B' ? 10 : 0
    const blockNumber = weekNumber + blockOffset

    // Each week always has 4 blocks (A, B, C, D) for 1 page
    return [`H${blockNumber}A`, `H${blockNumber}B`, `H${blockNumber}C`, `H${blockNumber}D`]
  }

  // Get total expected blocks for current week (always 4)
  const getTotalBlocksForWeek = (weekNumber: number): number => {
    if (!selectedJuzInfo) return 0

    // Calculate total pages for this juz part
    const totalPages = selectedJuzInfo.end_page - selectedJuzInfo.start_page + 1

    // Validate week number is within range
    if (weekNumber < 1 || weekNumber > totalPages) return 0

    return 4  // Always 4 blocks per week
  }

  // Check if current week's blocks are completed
  const isWeekCompleted = (): boolean => {
    if (!selectedJuzInfo) return false

    const expectedBlocks = getExpectedBlocksForWeek(selectedWeekNumber)
    if (expectedBlocks.length === 0) return false

    // Get all unique blocks from week records
    const weekBlocks = new Set<string>()
    weekRecords.forEach((record: TashihRecord) => {
      if (record.blok) {
        const blocks: string[] = typeof record.blok === 'string'
          ? record.blok.split(',').map(b => b.trim()).filter(b => b)
          : (Array.isArray(record.blok) ? record.blok : [])
        blocks.forEach(block => weekBlocks.add(block))
      }
    })

    return expectedBlocks.every(block => weekBlocks.has(block))
  }

  // Get completed blocks count for current week
  const getWeekCompletedBlocksCount = (): number => {
    if (!selectedJuzInfo) return 0

    const expectedBlocks = getExpectedBlocksForWeek(selectedWeekNumber)

    // Get all unique blocks from week records
    const weekBlocks = new Set<string>()
    weekRecords.forEach((record: TashihRecord) => {
      if (record.blok) {
        const blocks: string[] = typeof record.blok === 'string'
          ? record.blok.split(',').map(b => b.trim()).filter(b => b)
          : (Array.isArray(record.blok) ? record.blok : [])
        blocks.forEach(block => weekBlocks.add(block))
      }
    })

    return expectedBlocks.filter(block => weekBlocks.has(block)).length
  }

  // Initialize selected week on first load
  useEffect(() => {
    if (batchStartDate) {
      const currentWeek = getCurrentWeekNumber()
      setSelectedWeekNumber(currentWeek)
      setDisplayedWeekNumber(currentWeek)
    }
  }, [batchStartDate])

  // Touch handlers for swipe navigation
  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      // Swipe left = next week
      const currentWeek = getCurrentWeekNumber()
      if (displayedWeekNumber < currentWeek) {
        setDisplayedWeekNumber(displayedWeekNumber + 1)
      }
    } else if (isRightSwipe) {
      // Swipe right = previous week
      if (displayedWeekNumber > 1) {
        setDisplayedWeekNumber(displayedWeekNumber - 1)
      }
    }
  }

  // Navigate to previous/next week
  const goToPreviousWeek = () => {
    if (displayedWeekNumber > 1) {
      setDisplayedWeekNumber(displayedWeekNumber - 1)
    }
  }

  const goToNextWeek = () => {
    const currentWeek = getCurrentWeekNumber()
    if (displayedWeekNumber < currentWeek) {
      setDisplayedWeekNumber(displayedWeekNumber + 1)
    }
  }

  if (registrationsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-army" />
      </div>
    )
  }

  if (!activeRegistration || !juzToUse) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Belum Terdaftar di Program Aktif</h2>
          <p className="text-gray-600 mb-6">
            Ukhti belum terdaftar di program Tahfidz Tikrar MTI atau Pra Tikrar yang aktif.
          </p>
          <Link href="/dashboard">
            <Button>Kembali ke Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Show success if week's 4 blocks are completed
  const weekCompleted = isWeekCompleted()
  const completedCount = getWeekCompletedBlocksCount()

  // Render Status View (default)
  if (viewMode === 'status') {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fadeInUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 sm:p-6 border border-emerald-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-green-army mb-2">Status Tashih Blok</h1>
              <p className="text-gray-600 text-sm sm:text-base">Pilih blok yang belum ditashih untuk mengisi tashih</p>
            </div>
            {!tashihStatusLoading && tashihStatus && (
              <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2 rounded-lg shadow-sm">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="text-base sm:text-lg font-bold text-green-army">{tashihStatus.summary.completed_blocks}/{tashihStatus.summary.total_blocks}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tashih Block Status Card - Full detail with clickable blocks */}
        {tashihStatusLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-army" />
          </div>
        ) : tashihStatus ? (
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-emerald-800">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                Status Tashih Blok - {tashihStatus.juz_info.name}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-emerald-700">
                Progress tashih untuk Juz {tashihStatus.juz_info.juz_number} Part {tashihStatus.juz_info.part}. Klik blok yang belum selesai untuk mengisi tashih.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-blue-800">{tashihStatus.summary.total_blocks}</div>
                  <div className="text-[10px] sm:text-xs text-blue-600">Total Blok</div>
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

              {/* Overall Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span className="text-gray-600">Progress Total</span>
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

              {/* Block Grid - Group by week */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(() => {
                  // Group blocks by week_number
                  const blocksByWeek = new Map<number, typeof tashihStatus.blocks>()
                  tashihStatus.blocks.forEach(block => {
                    const weekNum = block.week_number
                    if (!blocksByWeek.has(weekNum)) {
                      blocksByWeek.set(weekNum, [])
                    }
                    blocksByWeek.get(weekNum)!.push(block)
                  })

                  // Sort weeks and create UI
                  const sortedWeeks = Array.from(blocksByWeek.keys()).sort((a, b) => a - b)

                  return sortedWeeks.map(weekNum => {
                    const weekBlocks = blocksByWeek.get(weekNum)!
                    const completedInWeek = weekBlocks.filter(b => b.is_completed).length

                    // Calculate actual week number (1-10)
                    const actualWeekNumber = weekNum
                    const currentWeekNumber = getCurrentWeekNumber()
                    const isCurrentWeek = actualWeekNumber === currentWeekNumber
                    const isPreviousWeek = actualWeekNumber === currentWeekNumber - 1
                    const isWeekAllowed = isCurrentWeek || isPreviousWeek
                    const isFutureWeek = actualWeekNumber > currentWeekNumber
                    const isPastWeek = actualWeekNumber < currentWeekNumber - 1

                    return (
                      <div key={weekNum} className={cn(
                        "border rounded-lg p-3",
                        isWeekAllowed ? "border-gray-200" : "border-gray-100 bg-gray-50 opacity-75"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-semibold",
                              isWeekAllowed ? "text-gray-700" : "text-gray-400"
                            )}>Pekan {weekNum}</span>
                            <span className={cn(
                              "text-xs",
                              isWeekAllowed ? "text-gray-500" : "text-gray-400"
                            )}>({completedInWeek}/{weekBlocks.length} selesai)</span>
                            {!isWeekAllowed && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">
                                {isFutureWeek ? 'Akan datang' : 'Sudah lewat'}
                              </span>
                            )}
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={cn(
                                "h-1.5 rounded-full",
                                isWeekAllowed ? "bg-emerald-500" : "bg-gray-400"
                              )}
                              style={{ width: `${weekBlocks.length > 0 ? (completedInWeek / weekBlocks.length) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {weekBlocks.map(block => (
                            <button
                              key={block.block_code}
                              type="button"
                              onClick={() => handleBlockClick(block.block_code, block.week_number)}
                              className={cn(
                                "flex-1 p-2 border-2 rounded-lg text-center transition-all duration-200",
                                block.is_completed
                                  ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 cursor-pointer hover:border-teal-400 hover:bg-teal-50"
                                  : !isWeekAllowed
                                    ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                                    : "border-gray-300 hover:border-teal-400 hover:bg-teal-50 cursor-pointer"
                              )}
                              title={block.is_completed
                                ? `Klik untuk edit${block.tashih_date ? `: ${new Date(block.tashih_date).toLocaleDateString('id-ID')}` : ''}`
                                : !isWeekAllowed
                                  ? isFutureWeek
                                    ? `Pekan ${actualWeekNumber} belum dimulai`
                                    : `Pekan ${actualWeekNumber} sudah berlalu`
                                  : 'Klik untuk isi tashih'
                              }
                              disabled={!isWeekAllowed}
                            >
                              <div className={cn(
                                "text-xs font-bold leading-tight",
                                block.is_completed
                                  ? "text-emerald-700"
                                  : !isWeekAllowed
                                    ? "text-gray-400"
                                    : "text-gray-600"
                              )}>
                                {block.block_code}
                              </div>
                              {block.is_completed ? (
                                <CheckCircle className="h-3 w-3 text-emerald-600 mx-auto mt-1" />
                              ) : !isWeekAllowed ? (
                                <Lock className="h-3 w-3 text-gray-400 mx-auto mt-1" />
                              ) : null}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 pt-3 border-t border-gray-200 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border-2 border-emerald-400 bg-emerald-50 rounded"></div>
                  <span>Sudah ditashih (klik untuk edit)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                  <span>Klik untuk isi tashih</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border-2 border-gray-200 bg-gray-100 rounded opacity-60"></div>
                  <span>Tidak aktif</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>Belum ada data tashih. Silakan daftar program terlebih dahulu.</p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full">
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Show success if week's 4 blocks are completed (in form mode)
  if (weekCompleted) {
    return (
      <div className="space-y-6 animate-fadeInUp">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-army mb-2">Alhamdulillah, Tashih Pekan Ini Selesai!</h1>
          <p className="text-gray-600 mb-8">
            Semua {getTotalBlocksForWeek(selectedWeekNumber)} blok untuk pekan {selectedWeekNumber} telah berhasil ditashih
          </p>

          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Detail Tashih Pekan {selectedWeekNumber}</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Juz:</span>
                <span className="font-semibold text-gray-800">
                  {confirmedJuz || '-'}
                  {selectedJuzInfo && (
                    <span className="text-gray-500 font-normal ml-2">({selectedJuzInfo.name})</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Blok Selesai:</span>
                <span className="font-semibold text-gray-800">{completedCount}/{getTotalBlocksForWeek(selectedWeekNumber)} blok</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  Selesai
                </span>
              </div>
              {todayRecord?.nama_pemeriksa && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Ustadzah Terakhir:</span>
                  <span className="font-medium text-gray-800">{todayRecord.nama_pemeriksa}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Pekan:</span>
                <span className="font-medium text-gray-800">
                  Pekan {selectedWeekNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Button onClick={() => { setViewMode('status'); resetForm() }} variant="outline" className="flex-1">
            Kembali ke Status
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full">
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 sm:p-6 border border-emerald-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-army mb-2">
              {selectedBlocksForEditing.length > 0 ? `Isi Tashih - ${selectedBlocksForEditing.join(', ')}` : 'Tashih Bacaan'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {selectedBlocksForEditing.length > 0 ? 'Lengkapi form tashih di bawah' : 'Validasi bacaan Al-Quran Ukhti'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedBlocksForEditing.length > 0 && (
              <Button
                type="button"
                onClick={() => { setViewMode('status'); setSelectedBlocksForEditing([]); resetForm(); }}
                variant="outline"
                className="bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Kembali ke Status
              </Button>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 sm:px-4 py-2 rounded-lg shadow-sm">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline">Prasyarat wajib</span>
              <span className="sm:hidden">Wajib</span>
            </div>
          </div>
        </div>
      </div>

      {/* Juz Info Card */}
      {selectedJuzInfo && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-full">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-800 text-sm sm:text-base">Juz Tashih Ukhti</h3>
                <p className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">Juz {selectedJuzInfo.juz_number} Part {selectedJuzInfo.part} (Hal. {selectedJuzInfo.start_page}-{selectedJuzInfo.end_page})</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Status - Mobile: 3 kolom fix */}
      <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-amber-400 to-orange-500 shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm sm:text-lg text-gray-800 truncate">
                Progress Pekan {selectedWeekNumber}: {completedCount}/{getTotalBlocksForWeek(selectedWeekNumber)}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
                {completedCount === 0
                  ? 'Belum ada blok yang ditashih minggu ini'
                  : completedCount < getTotalBlocksForWeek(selectedWeekNumber)
                    ? `${getTotalBlocksForWeek(selectedWeekNumber) - completedCount} blok lagi`
                    : 'Semua blok pekan ini sudah selesai!'
                }
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getTotalBlocksForWeek(selectedWeekNumber) > 0 ? (completedCount / getTotalBlocksForWeek(selectedWeekNumber)) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Selection - Swipeable untuk semua ukuran layar */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-sky-50 border-b p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-cyan-700 text-sm sm:text-base">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Pilih Hari</span>
            </CardTitle>
            <div className="text-right">
              <p className="text-xs sm:text-sm font-semibold text-cyan-700">
                {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <CardDescription className="text-xs">
            Geser ke kiri/kanan atau klik panah untuk ganti pekan. Klik hari untuk mengisi tashih.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          {/* Week Navigation Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={goToPreviousWeek}
              disabled={displayedWeekNumber <= 1}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                displayedWeekNumber <= 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-cyan-600 hover:bg-cyan-50"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="text-center">
              <div className={cn(
                "text-xs font-semibold",
                displayedWeekNumber === getCurrentWeekNumber() ? "text-cyan-700" : "text-gray-700"
              )}>
                Pekan Tashih {displayedWeekNumber}
                {displayedWeekNumber === getCurrentWeekNumber() && (
                  <span className="ml-1 text-[10px] text-cyan-600">(Pekan Ini)</span>
                )}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {getWeekStartDate(displayedWeekNumber).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {(() => {
                  const weekEnd = new Date(getWeekStartDate(displayedWeekNumber))
                  weekEnd.setDate(weekEnd.getDate() + 6)
                  return weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                })()}
              </div>
            </div>

            <button
              type="button"
              onClick={goToNextWeek}
              disabled={displayedWeekNumber >= getCurrentWeekNumber()}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                displayedWeekNumber >= getCurrentWeekNumber()
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-cyan-600 hover:bg-cyan-50"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days Grid - Swipeable Carousel */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const newDate = new Date(tashihData.tanggalTashih)
                newDate.setDate(newDate.getDate() - 1)
                handleDateSelection(newDate)
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex gap-1 mx-8 overflow-hidden">
              {Array.from({ length: 4 }, (_, i) => {
                const baseDate = new Date(tashihData.tanggalTashih)
                const offset = i - 1 // Show: previous, current, next, next+1
                baseDate.setDate(baseDate.getDate() + offset)
                const dayDate = baseDate
                const isToday = new Date().toDateString() === dayDate.toDateString()
                const dateString = dayDate.toISOString().split('T')[0]
                const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Aha']
                const dayName = dayNames[dayDate.getDay()]

                return (
                  <button
                    key={`${dateString}-${i}`}
                    type="button"
                    onClick={() => handleDateSelection(dayDate)}
                    className={cn(
                      "flex-1 p-2 border-2 rounded-lg transition-all duration-200 text-center",
                      "hover:shadow-md hover:scale-105 active:scale-95 min-w-0",
                      tashihData.tanggalTashih === dateString
                        ? "border-cyan-500 bg-gradient-to-br from-cyan-50 to-sky-50 shadow-lg ring-2 ring-cyan-200"
                        : isToday
                          ? "border-amber-400 bg-amber-50 hover:border-amber-500 shadow-sm"
                          : "border-gray-200 hover:border-cyan-300 bg-white"
                    )}
                  >
                    <div className={cn(
                      "text-[10px] font-medium leading-tight",
                      tashihData.tanggalTashih === dateString
                        ? "text-cyan-700"
                        : isToday
                          ? "text-amber-700"
                          : "text-gray-600"
                    )}>
                      {dayName}
                    </div>
                    <div className={cn(
                      "text-sm font-bold leading-none mt-1",
                      tashihData.tanggalTashih === dateString
                        ? "text-cyan-800"
                        : isToday
                          ? "text-amber-800"
                          : "text-gray-800"
                    )}>
                      {dayDate.getDate()}
                    </div>
                    {isToday && tashihData.tanggalTashih !== dateString && (
                      <div className="mt-1">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mx-auto"></div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                const newDate = new Date(tashihData.tanggalTashih)
                newDate.setDate(newDate.getDate() + 1)
                handleDateSelection(newDate)
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Swipe hint */}
          <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-gray-500">
            <ChevronLeft className="h-3 w-3" />
            <span>Gesar untuk ganti tanggal</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Block Selection - Mobile: 4 kolom fix */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-3">
            <CardTitle className="flex items-center gap-2 text-blue-700 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Pilih Blok yang Ditashih</span>
            </CardTitle>
            <CardDescription className="text-[10px]">
              {selectedJuzInfo && availableBlocks.length > 0
                ? `Pekan Tashih ${availableBlocks[0].week_number} - ${selectedJuzInfo.name}`
                : isLoadingBlocks
                  ? 'Memuat blok yang tersedia...'
                  : 'Pilih tanggal terlebih dahulu untuk menentukan blok'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            {isLoadingBlocks ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Memuat blok yang tersedia...</p>
              </div>
            ) : availableBlocks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Belum ada blok yang tersedia.</p>
              </div>
            ) : (
              <div className="flex gap-1">
                {availableBlocks.map((blok) => {
                  const isSelected = tashihData.blok.includes(blok.block_code)
                  return (
                    <div
                      key={blok.block_code}
                      onClick={() => toggleBlok(blok.block_code)}
                      className={cn(
                        "flex-1 p-2 border-2 rounded-lg cursor-pointer transition-all duration-200 group",
                        "hover:shadow-md hover:scale-[1.02]",
                        isSelected
                          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-1 ring-blue-200"
                          : "border-gray-200 hover:border-blue-300 bg-white"
                      )}
                    >
                      <div className="text-center">
                        <div className={cn(
                          "text-xs font-bold leading-tight",
                          isSelected ? "text-blue-700" : "text-gray-700 group-hover:text-blue-600"
                        )}>
                          {blok.block_code.toUpperCase()}
                        </div>
                        {isSelected && (
                          <div className="mt-1 text-blue-600">
                            <CheckCircle className="h-3 w-3 mx-auto" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location & Ustadzah Selection - Mobile: 2 kolom fix */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-emerald-700 text-sm sm:text-base">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Lokasi & Ustadzah</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Pilih lokasi tashih dan ustadzah yang akan memeriksa bacaan.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
            {/* Location Selection - Grid fix 2 columns */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Pilih Lokasi Tashih <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* MTI Option */}
                <div
                  onClick={() => setTashihData(prev => ({ ...prev, lokasi: 'mti', lokasiDetail: '' }))}
                  className={cn(
                    "p-2 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
                    "hover:shadow-md hover:scale-[1.02]",
                    tashihData.lokasi === 'mti'
                      ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg ring-2 ring-emerald-200"
                      : "border-gray-200 hover:border-emerald-300 bg-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-full">
                      <School className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">Markaz Tikrar Indonesia</p>
                    </div>
                    {tashihData.lokasi === 'mti' && <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600 shrink-0" />}
                  </div>
                </div>

                {/* Luar MTI Option */}
                <div
                  onClick={() => setTashihData(prev => ({ ...prev, lokasi: 'luar' }))}
                  className={cn(
                    "p-2 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
                    "hover:shadow-md hover:scale-[1.02]",
                    tashihData.lokasi === 'luar'
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300 bg-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-xs sm:text-sm">Luar MTI</p>
                      <p className="text-[10px] sm:text-xs text-gray-600 truncate">Lokasi lain</p>
                    </div>
                    {tashihData.lokasi === 'luar' && <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 shrink-0" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Lokasi Detail for Luar MTI */}
            {tashihData.lokasi === 'luar' && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lokasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tashihData.lokasiDetail}
                  onChange={(e) => setTashihData(prev => ({ ...prev, lokasiDetail: e.target.value }))}
                  placeholder="Contoh: Masjid Al-Falah, Rumah Ibu Fatimah, dll."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required={tashihData.lokasi === 'luar'}
                />
              </div>
            )}

            {/* Ustadzah Dropdown - Only for MTI */}
            {tashihData.lokasi === 'mti' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Ustadzah <span className="text-red-500">*</span>
                </label>
                {isLoadingMuallimah ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memuat daftar ustadzah...</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsUstadzahDropdownOpen(!isUstadzahDropdownOpen)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-left flex items-center justify-between"
                    >
                      <span>
                        {tashihData.ustadzahName ? tashihData.ustadzahName : 'Pilih ustadzah...'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {/* Dropdown Modal */}
                    {isUstadzahDropdownOpen && availableMuallimah.length > 0 && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setIsUstadzahDropdownOpen(false)}>
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Pilih Ustadzah</h3>
                          </div>
                          <div className="p-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTashihData(prev => ({ ...prev, ustadzahId: '', ustadzahName: null }))
                                setIsUstadzahDropdownOpen(false)
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg mb-1"
                            >
                              Pilih ustadzah lain
                            </button>
                            {availableMuallimah.map((muallimah) => (
                              <button
                                key={muallimah.id}
                                type="button"
                                onClick={() => {
                                  setTashihData(prev => ({ ...prev, ustadzahId: muallimah.id, ustadzahName: muallimah.full_name }))
                                  setIsUstadzahDropdownOpen(false)
                                }}
                                className={cn(
                                  "w-full px-4 py-3 text-left rounded-lg transition-colors mb-1",
                                  tashihData.ustadzahId === muallimah.id
                                    ? "bg-emerald-100 text-emerald-700 font-medium"
                                    : "hover:bg-gray-50"
                                )}
                              >
                                <div className="font-medium">{muallimah.full_name}</div>
                              </button>
                            ))}
                          </div>
                          <div className="p-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => setIsUstadzahDropdownOpen(false)}
                              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jumlah Kesalahan Tajwid */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              <span>Jumlah Kesalahan Tajwid</span>
            </CardTitle>
            <CardDescription>
              Masukkan jumlah kesalahan tajwid yang ditemukan saat tashih
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setTashihData(prev => ({ ...prev, jumlahKesalahanTajwid: Math.max(0, prev.jumlahKesalahanTajwid - 1) }))}
                className="w-12 h-12 rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-2xl font-bold text-gray-600 transition-colors"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-bold text-amber-600">{tashihData.jumlahKesalahanTajwid}</span>
                <p className="text-sm text-gray-500 mt-1">kesalahan</p>
              </div>
              <button
                type="button"
                onClick={() => setTashihData(prev => ({ ...prev, jumlahKesalahanTajwid: prev.jumlahKesalahanTajwid + 1 }))}
                className="w-12 h-12 rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-2xl font-bold text-gray-600 transition-colors"
              >
                +
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Tajwid Issues - Mobile: 2 kolom fix */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-rose-700 text-sm sm:text-base">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Masalah Tajwid yang Ditemukan</span>
              {tashihData.masalahTajwid.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-rose-500 text-white text-[10px] sm:text-xs font-bold rounded-full">
                  {tashihData.masalahTajwid.length}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Pilih jenis masalah tajwid yang ditemukan (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {masalahTajwidOptions.map((masalah) => (
                <div
                  key={masalah.id}
                  onClick={() => toggleMasalahTajwid(masalah.id)}
                  className={cn(
                    "p-2 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group",
                    "hover:shadow-md hover:scale-105",
                    tashihData.masalahTajwid.includes(masalah.id)
                      ? `border-rose-400 ${masalah.color} shadow-lg ring-2 ring-rose-200`
                      : "border-gray-200 hover:border-rose-300 bg-white"
                  )}
                >
                  <div className="text-center">
                    <h4 className={cn(
                      "font-medium text-xs sm:text-sm mb-1",
                      tashihData.masalahTajwid.includes(masalah.id) ? "text-gray-800" : "text-gray-700 group-hover:text-rose-600"
                    )}>
                      {masalah.name}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2">{masalah.description}</p>
                    {tashihData.masalahTajwid.includes(masalah.id) && (
                      <div className="mt-1 sm:mt-2 text-rose-600">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mx-auto" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-slate-700 text-sm sm:text-base">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Catatan Tambahan</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Catatan khusus tentang tashih hari ini (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <textarea
              value={tashihData.catatanTambahan}
              onChange={(e) => setTashihData(prev => ({ ...prev, catatanTambahan: e.target.value }))}
              placeholder="Tambahkan catatan penting tentang tashih bacaan hari ini..."
              rows={4}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none text-sm"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full h-12 text-base" type="button">
              Kembali ke Dashboard
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex-1 h-12 text-base bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Simpan Tashih
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
