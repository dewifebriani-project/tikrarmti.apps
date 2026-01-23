'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertCircle, Calendar, Loader2, BookOpen, Volume2, Mic, Edit, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useAllRegistrations } from '@/hooks/useRegistrations'
import { useJurnalStatus } from '@/hooks/useDashboard'
import { saveJurnalRecord } from './actions'

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

interface JurnalRecord {
  id: string
  user_id: string
  tanggal_jurnal: string
  juz_code: string | null
  tanggal_setor: string
  blok: string | null
  tashih_completed: boolean
  rabth_completed: boolean
  murajaah_count: number
  simak_murattal_count: number
  tikrar_bi_an_nadzar_completed: boolean
  tasmi_record_count: number
  simak_record_completed: boolean
  tikrar_bi_al_ghaib_count: number
  tikrar_bi_al_ghaib_type: 'sendiri' | 'pasangan' | 'voice_note' | null
  tikrar_bi_al_ghaib_40x: string[] | null
  tikrar_bi_al_ghaib_20x: string[] | null
  tarteel_screenshot_url: string | null
  tafsir_completed: boolean
  menulis_completed: boolean
  catatan_tambahan: string | null
  created_at: string
  updated_at: string
}

interface JurnalStep {
  id: string
  name: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  required: boolean
  minCount?: number
  countLabel?: string
}

const jurnalStepsConfig: JurnalStep[] = [
  {
    id: 'rabth',
    name: 'Rabth',
    title: 'Menyambung Hafalan',
    description: 'Sebelum memulai hafalan baru, lakukan pemanasan dengan menyambungkan 10 blok hafalan terakhir sebanyak 1 kali tanpa melihat mushaf.',
    icon: <Volume2 className="h-5 w-5" />,
    color: 'bg-blue-500',
    required: true,
    countLabel: '1x'
  },
  {
    id: 'murajaah',
    name: 'Muraja\'ah Blok Terakhir',
    title: 'Muraja\'ah Blok Terakhir',
    description: 'Ulangi hafalan blok kemarin sebanyak 5 kali tanpa melihat mushaf.',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'bg-green-500',
    required: true,
    countLabel: '5x'
  },
  {
    id: 'simak_murattal',
    name: 'Simak Murattal',
    title: 'Simak Murattal',
    description: 'Dengarkan bacaan murattal dari qari terpercaya untuk blok hafalan hari ini.',
    icon: <Volume2 className="h-5 w-5" />,
    color: 'bg-purple-500',
    required: true,
    countLabel: '3x'
  },
  {
    id: 'tikrar_bi_an_nadzar',
    name: 'Tikrar Bi An-Nadzar',
    title: 'Melihat Mushaf',
    description: 'Baca blok hafalan hari ini sambil melihat mushaf dengan saksama. Fokus pada setiap huruf, harakat, dan tata letak ayat.',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'bg-orange-500',
    required: true,
    countLabel: '40x'
  },
  {
    id: 'tasmi_record',
    name: 'Rekam Hafalan',
    title: 'Rekam Hafalan',
    description: 'Wajib mendapatkan 3 rekaman yang lancar tanpa kesalahan.',
    icon: <Mic className="h-5 w-5" />,
    color: 'bg-red-500',
    required: true,
    countLabel: '3x'
  },
  {
    id: 'simak_record',
    name: 'Simak Rekaman Pribadi',
    title: 'Simak Rekaman Pribadi',
    description: 'Dengarkan kembali rekaman terbaik sambil menyimak dengan mushaf untuk menemukan kesalahan. Jika ada kesalahan maka ulangi kembali rekam.',
    icon: <Volume2 className="h-5 w-5" />,
    color: 'bg-indigo-500',
    required: true,
    countLabel: '1x'
  },
  {
    id: 'tikrar_bi_al_ghaib',
    name: 'Tikrar Bil Ghaib',
    title: 'Tikrar Bil Ghaib (Tanpa Mushaf)',
    description: 'Setorkan hafalan blok hari ini tanpa melihat mushaf untuk mengunci hafalan jangka panjang.',
    icon: <Circle className="h-5 w-5" />,
    color: 'bg-teal-500',
    required: true
  }
]

const tambahanStepsConfig: JurnalStep[] = [
  {
    id: 'tafsir',
    name: 'Membaca Tafsir',
    title: 'Membaca Tafsir',
    description: 'Pahami makna dan konteks ayat yang akan dihafal dengan membaca tafsir ringkas.',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'bg-emerald-500',
    required: false
  },
  {
    id: 'menulis',
    name: 'Menulis Ayat',
    title: 'Menulis Ayat',
    description: 'Tulis kembali blok ayat yang sedang dihafal tanpa melihat mushaf.',
    icon: <Edit className="h-5 w-5" />,
    color: 'bg-pink-500',
    required: false
  }
]

export default function JurnalHarianPage() {
  const { user } = useAuth()
  const { registrations, isLoading: registrationsLoading } = useAllRegistrations()
  const { jurnalStatus, isLoading: jurnalStatusLoading } = useJurnalStatus()

  const [jurnalData, setJurnalData] = useState({
    tanggal_setor: new Date().toISOString().slice(0, 10),
    juz_code: '',
    blok: '' as string, // Single blok
    rabth_completed: false,
    murajaah_completed: false,
    simak_murattal_completed: false,
    tikrar_bi_an_nadzar_completed: false,
    tasmi_record_completed: false,
    simak_record_completed: false,
    tikrar_bi_al_ghaib_completed: false,
    tikrar_bi_al_ghaib_type: null as 'pasangan_40' | 'keluarga_40' | 'tarteel_40' | null,
    tikrar_bi_al_ghaib_subtype: null as string | null,
    tikrar_bi_al_ghaib_20x_multi: [] as string[],
    tarteel_screenshot_file: null as File | null,
    tafsir_completed: false,
    menulis_completed: false,
    catatan_tambahan: ''
  })

  const [todayRecord, setTodayRecord] = useState<JurnalRecord | null>(null)
  const [weekRecords, setWeekRecords] = useState<JurnalRecord[]>([]) // Week records for weekly status
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  // View mode: 'status' = show block status, 'form' = show jurnal form
  const [viewMode, setViewMode] = useState<'status' | 'form'>('status')
  const [selectedBlockForEditing, setSelectedBlockForEditing] = useState<string | null>(null)

  // Get active registration
  const activeRegistration = registrations.find((reg: any) =>
    reg.batch?.status === 'open' &&
    (reg.status === 'approved' || reg.selection_status === 'selected')
  ) || registrations[0]

  // Get juz and batch info
  const juzToUse = activeRegistration?.daftar_ulang?.confirmed_chosen_juz ||
                      (activeRegistration as any)?.chosen_juz ||
                      null
  const batchId = activeRegistration?.batch?.id || null
  const batchStartDate = activeRegistration?.batch?.start_date || null

  // Juz and blocks state
  const [selectedJuzInfo, setSelectedJuzInfo] = useState<JuzOption | null>(null)
  const [availableBlocks, setAvailableBlocks] = useState<TashihBlock[]>([])
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1)

  // Load juz info
  useEffect(() => {
    if (juzToUse) {
      loadJuzInfo(juzToUse)
    }
  }, [juzToUse])

  const loadJuzInfo = async (juzCode: string) => {
    try {
      const supabase = createClient()
      const { data: juzData } = await supabase
        .from('juz_options')
        .select('*')
        .eq('code', juzCode)
        .single()

      if (juzData) {
        setSelectedJuzInfo(juzData)
        setJurnalData(prev => ({ ...prev, juz_code: juzCode }))
      }
    } catch (error) {
      console.error('Error loading juz info:', error)
    }
  }

  // Update blocks when week changes - for JURNAL, start from H+7 (week 1 = days 7-13 from batch start)
  const updateBlocksForWeek = (weekNumber: number) => {
    if (!selectedJuzInfo) return

    // For jurnal: week 1 starts H+7 (7 days after batch start)
    // So jurnal week number maps directly to block number (week 1 = H1, week 2 = H2, etc)
    const blockOffset = selectedJuzInfo.part === 'B' ? 10 : 0
    const blockNumber = weekNumber + blockOffset
    const weekStartPage = selectedJuzInfo.start_page + (weekNumber - 1)

    const blocks: TashihBlock[] = []
    const parts = ['A', 'B', 'C', 'D']

    for (let i = 0; i < 4; i++) {
      const part = parts[i]
      const blockCode = `H${blockNumber}${part}`
      const blockPage = Math.min(weekStartPage + i, selectedJuzInfo.end_page)

      blocks.push({
        block_code: blockCode,
        week_number: blockNumber,
        part,
        start_page: blockPage,
        end_page: blockPage
      })
    }

    setAvailableBlocks(blocks)
  }

  // Add useEffect to update blocks when week/juz changes
  useEffect(() => {
    if (selectedJuzInfo && batchStartDate) {
      updateBlocksForWeek(selectedWeekNumber)
    }
  }, [selectedWeekNumber, selectedJuzInfo, batchStartDate])

  // Get jurnal week number from date
  // Jurnal starts H+7 from batch start date (week 1 = days 7-13)
  const getWeekNumberFromDate = (date: Date): number => {
    if (!batchStartDate) return 1
    const startDate = new Date(batchStartDate)
    const diffTime = date.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    // Jurnal starts at day 7 (H+7), so subtract 7 days then calculate week
    const jurnalDays = Math.max(0, diffDays - 7)
    const weekNumber = Math.floor(jurnalDays / 7) + 1
    return Math.max(1, weekNumber)
  }

  // Get current week number
  useEffect(() => {
    if (batchStartDate) {
      const currentWeek = getWeekNumberFromDate(new Date())
      setSelectedWeekNumber(currentWeek)
    }
  }, [batchStartDate])

  // Get start date of a jurnal week (Senin) based on week number from batch start
  // Jurnal starts H+7 from batch start (week 1 = days 7-13)
  const getWeekStartDate = (weekNumber: number): Date => {
    if (!batchStartDate) return new Date()
    const startDate = new Date(batchStartDate)
    // Adjust to Monday of the first week
    const dayOfWeek = startDate.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const firstMonday = new Date(startDate)
    firstMonday.setDate(startDate.getDate() + daysToMonday)
    // For jurnal: add 7 days (H+7) + (weekNumber - 1) weeks
    const weekStart = new Date(firstMonday)
    weekStart.setDate(firstMonday.getDate() + 7 + (weekNumber - 1) * 7)
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
    setJurnalData(prev => ({ ...prev, tanggal_setor: dateString }))
  }

  // Get current week number from today's date
  const getCurrentWeekNumber = (): number => {
    return getWeekNumberFromDate(new Date())
  }

  // Load week records for weekly status (4 blok wajib per pekan)
  const loadWeekRecords = async () => {
    if (!user || !batchStartDate) return

    try {
      const supabase = createClient()

      // Get week start and end dates
      const weekStart = getWeekStartDate(selectedWeekNumber)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      const { data, error } = await supabase
        .from('jurnal_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('tanggal_setor', weekStart.toISOString().split('T')[0])
        .lt('tanggal_setor', weekEnd.toISOString().split('T')[0])
        .order('tanggal_setor', { ascending: false })

      if (error) {
        console.error('Error loading week jurnal records:', error)
        return
      }

      setWeekRecords(data || [])

      // Get today's record for editing
      const today = new Date().toISOString().split('T')[0]
      const todayRec = data?.find((r: JurnalRecord) => r.tanggal_setor === today)
      setTodayRecord(todayRec || null)

      if (todayRec) {
        // Load record data for editing
        let tikrarType: 'pasangan_40' | 'keluarga_40' | 'tarteel_40' | null = null
        let tikrarSubtype: string | null = null

        if (todayRec.tikrar_bi_al_ghaib_40x && todayRec.tikrar_bi_al_ghaib_40x.length > 0) {
          const type40 = todayRec.tikrar_bi_al_ghaib_40x[0]
          if (type40 === 'pasangan_40' || type40 === 'keluarga_40' || type40 === 'tarteel_40') {
            tikrarType = type40
          }
        } else if (todayRec.tikrar_bi_al_ghaib_20x && todayRec.tikrar_bi_al_ghaib_20x.length > 0) {
          const type20 = todayRec.tikrar_bi_al_ghaib_20x[0]
          if (type20 === 'pasangan_20' || type20 === 'pasangan_20_wa' || type20 === 'voice_note_20') {
            tikrarType = 'pasangan_40'
            tikrarSubtype = type20 === 'pasangan_20' ? 'pasangan_20_wa' : type20
          }
        }

        // Handle blok: single string
        const blokValue: string = todayRec.blok || ''

        setJurnalData({
          tanggal_setor: todayRec.tanggal_setor || new Date().toISOString().slice(0, 10),
          juz_code: todayRec.juz_code || '',
          blok: blokValue,
          rabth_completed: todayRec.rabth_completed || false,
          murajaah_completed: todayRec.murajaah_count > 0,
          simak_murattal_completed: todayRec.simak_murattal_count > 0,
          tikrar_bi_an_nadzar_completed: todayRec.tikrar_bi_an_nadzar_completed || false,
          tasmi_record_completed: todayRec.tasmi_record_count > 0,
          simak_record_completed: todayRec.simak_record_completed || false,
          tikrar_bi_al_ghaib_completed: todayRec.tikrar_bi_al_ghaib_count > 0,
          tikrar_bi_al_ghaib_type: tikrarType,
          tikrar_bi_al_ghaib_subtype: tikrarSubtype,
          tikrar_bi_al_ghaib_20x_multi: todayRec.tikrar_bi_al_ghaib_20x || [],
          tarteel_screenshot_file: null,
          tafsir_completed: todayRec.tafsir_completed || false,
          menulis_completed: todayRec.menulis_completed || false,
          catatan_tambahan: todayRec.catatan_tambahan || ''
        })
      }
    } catch (error) {
      console.error('Error loading week jurnal records:', error)
    }
  }

  // Load today's record on first load
  useEffect(() => {
    if (user) {
      loadWeekRecords()
      setIsLoading(false)
    }
  }, [user, selectedWeekNumber])

  const toggleStep = (stepId: string) => {
    const fieldKey = `${stepId}_completed` as keyof typeof jurnalData
    setJurnalData(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }))
  }

  const toggleBlokSelection = (blockCode: string) => {
    setJurnalData(prev => ({
      ...prev,
      blok: blockCode // Single select, just set the value
    }))
  }

  // Check if current week's 4 blocks are completed
  const isWeekCompleted = (): boolean => {
    if (!selectedJuzInfo) return false

    const blockOffset = selectedJuzInfo.part === 'B' ? 10 : 0
    const blockNumber = selectedWeekNumber + blockOffset
    const expectedBlocks = [`H${blockNumber}A`, `H${blockNumber}B`, `H${blockNumber}C`, `H${blockNumber}D`]

    // Get all unique blocks from week records
    const weekBlocks = new Set<string>()
    weekRecords.forEach((record: JurnalRecord) => {
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

    const blockOffset = selectedJuzInfo.part === 'B' ? 10 : 0
    const blockNumber = selectedWeekNumber + blockOffset
    const expectedBlocks = [`H${blockNumber}A`, `H${blockNumber}B`, `H${blockNumber}C`, `H${blockNumber}D`]

    // Get all unique blocks from week records
    const weekBlocks = new Set<string>()
    weekRecords.forEach((record: JurnalRecord) => {
      if (record.blok) {
        const blocks: string[] = typeof record.blok === 'string'
          ? record.blok.split(',').map(b => b.trim()).filter(b => b)
          : (Array.isArray(record.blok) ? record.blok : [])
        blocks.forEach(block => weekBlocks.add(block))
      }
    })

    return expectedBlocks.filter(block => weekBlocks.has(block)).length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Silakan login terlebih dahulu')
      return
    }

    // Validate blok selection (required)
    if (!jurnalData.blok || jurnalData.blok.length === 0) {
      toast.error('Harap pilih 1 blok!')
      return
    }

    // Tashih validation is now done server-side in the action
    // This ensures we use authUser.id which matches auth.uid() in RLS

    // Validate tarteel file if tarteel_40 is selected
    if (jurnalData.tikrar_bi_al_ghaib_type === 'tarteel_40' && !jurnalData.tarteel_screenshot_file) {
      toast.error('Harap upload bukti Tarteel!')
      return
    }

    setIsSubmitting(true)
    try {
      // Use server action for database operations (following arsitektur.md)
      // Server action uses supabase.auth.getUser() which guarantees user_id matches auth.uid()
      // Tashih validation is also done server-side
      const result = await saveJurnalRecord({
        tanggal_setor: jurnalData.tanggal_setor,
        juz_code: jurnalData.juz_code || null,
        blok: jurnalData.blok,
        rabth_completed: jurnalData.rabth_completed,
        murajaah_completed: jurnalData.murajaah_completed,
        simak_murattal_completed: jurnalData.simak_murattal_completed,
        tikrar_bi_an_nadzar_completed: jurnalData.tikrar_bi_an_nadzar_completed,
        tasmi_record_completed: jurnalData.tasmi_record_completed,
        simak_record_completed: jurnalData.simak_record_completed,
        tikrar_bi_al_ghaib_type: jurnalData.tikrar_bi_al_ghaib_type,
        tikrar_bi_al_ghaib_subtype: jurnalData.tikrar_bi_al_ghaib_subtype,
        tikrar_bi_al_ghaib_20x_multi: jurnalData.tikrar_bi_al_ghaib_20x_multi,
        tarteel_screenshot_url: null, // File upload will be handled separately
        tafsir_completed: jurnalData.tafsir_completed,
        menulis_completed: jurnalData.menulis_completed,
        catatan_tambahan: jurnalData.catatan_tambahan || null,
        // For server-side tashih validation
        weekNumber: selectedWeekNumber,
        juzPart: (selectedJuzInfo?.part || 'A') as 'A' | 'B'
      })

      if (!result.success) {
        console.error('Error saving jurnal record:', result.error)
        toast.error('Gagal menyimpan data jurnal: ' + result.error)
        return
      }

      toast.success(result.message || 'Jurnal berhasil disimpan!')
      await loadWeekRecords()
      // Return to status view after saving
      setViewMode('status')
      setSelectedBlockForEditing(null)
    } catch (error) {
      console.error('Error saving jurnal:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle block click from status view
  const handleBlockClick = (blockCode: string, blockWeekNumber: number) => {
    if (!jurnalStatus) return

    // Find the block in jurnalStatus
    const block = jurnalStatus.blocks.find(b => b.block_code === blockCode)
    if (!block) return

    // Check if already completed
    if (block.is_completed) {
      toast.info('Blok ini sudah selesai dijurnal')
      return
    }

    // Check if previous blocks are completed (sequential check)
    const blockIndex = jurnalStatus.blocks.findIndex(b => b.block_code === blockCode)
    if (blockIndex > 0) {
      const previousBlock = jurnalStatus.blocks[blockIndex - 1]
      if (!previousBlock.is_completed) {
        toast.error(`Harap selesaikan blok ${previousBlock.block_code} terlebih dahulu!`)
        return
      }
    }

    // Set selected block and switch to form mode
    setSelectedBlockForEditing(blockCode)
    setJurnalData(prev => ({ ...prev, blok: blockCode }))

    // Update week number based on block
    const newWeekNumber = blockWeekNumber - (selectedJuzInfo?.part === 'B' ? 10 : 0)
    setSelectedWeekNumber(newWeekNumber)
    updateBlocksForWeek(newWeekNumber)

    // Switch to form view
    setViewMode('form')
  }

  const resetForm = () => {
    setJurnalData({
      tanggal_setor: new Date().toISOString().slice(0, 10),
      juz_code: juzToUse || '',
      blok: '',
      rabth_completed: false,
      murajaah_completed: false,
      simak_murattal_completed: false,
      tikrar_bi_an_nadzar_completed: false,
      tasmi_record_completed: false,
      simak_record_completed: false,
      tikrar_bi_al_ghaib_completed: false,
      tikrar_bi_al_ghaib_type: null,
      tikrar_bi_al_ghaib_subtype: null,
      tikrar_bi_al_ghaib_20x_multi: [],
      tarteel_screenshot_file: null,
      tafsir_completed: false,
      menulis_completed: false,
      catatan_tambahan: ''
    })
    setTodayRecord(null)
    setWeekRecords([])
    // Return to status view
    setViewMode('status')
    setSelectedBlockForEditing(null)
  }

  const isStepCompleted = (step: JurnalStep): boolean => {
    if (step.id === 'tikrar_bi_al_ghaib') {
      return jurnalData.tikrar_bi_al_ghaib_type !== null
    }
    const fieldKey = `${step.id}_completed` as keyof typeof jurnalData
    return jurnalData[fieldKey] as boolean || false
  }

  const isTikrarGhaibCompleted = (): boolean => {
    return jurnalData.tikrar_bi_al_ghaib_type !== null
  }

  const isTikrarGhaibValid = (): boolean => {
    if (jurnalData.tikrar_bi_al_ghaib_type === 'tarteel_40') {
      return jurnalData.tarteel_screenshot_file !== null
    }
    return true
  }

  const requiredCompleted = jurnalStepsConfig.filter(step => isStepCompleted(step)).length
  const completedCount = getWeekCompletedBlocksCount()
  const isWeekDone = isWeekCompleted()
  const isAllRequiredCompleted = requiredCompleted === 7 && isTikrarGhaibValid() && jurnalData.blok !== ''

  if (isLoading || registrationsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-army" />
      </div>
    )
  }

  // Render Status View (default)
  if (viewMode === 'status') {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fadeInUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 sm:p-6 border border-emerald-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-green-army mb-2">Status Jurnal Blok</h1>
              <p className="text-gray-600 text-sm sm:text-base">Pilih blok yang belum diisi untuk mengisi jurnal</p>
            </div>
            {!jurnalStatusLoading && jurnalStatus && (
              <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2 rounded-lg shadow-sm">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="text-base sm:text-lg font-bold text-green-army">{jurnalStatus.summary.completed_blocks}/{jurnalStatus.summary.total_blocks}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Jurnal Block Status Card - Full detail with clickable blocks */}
        {jurnalStatusLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-army" />
          </div>
        ) : jurnalStatus ? (
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-emerald-800">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                Status Jurnal Blok - {jurnalStatus.juz_info.name}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-emerald-700">
                Progress jurnal untuk Juz {jurnalStatus.juz_info.juz_number} Part {jurnalStatus.juz_info.part}. Klik blok yang belum selesai untuk mengisi jurnal.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-blue-800">{jurnalStatus.summary.total_blocks}</div>
                  <div className="text-[10px] sm:text-xs text-blue-600">Total Blok</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-green-800">{jurnalStatus.summary.completed_blocks}</div>
                  <div className="text-[10px] sm:text-xs text-green-600">Selesai</div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-amber-800">{jurnalStatus.summary.pending_blocks}</div>
                  <div className="text-[10px] sm:text-xs text-amber-600">Pending</div>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span className="text-gray-600">Progress Total</span>
                  <span className="font-medium text-gray-800">
                    {Math.round((jurnalStatus.summary.completed_blocks / jurnalStatus.summary.total_blocks) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 sm:h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(jurnalStatus.summary.completed_blocks / jurnalStatus.summary.total_blocks) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Block Grid - Group by week */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(() => {
                  // Group blocks by week_number
                  const blocksByWeek = new Map<number, typeof jurnalStatus.blocks>()
                  jurnalStatus.blocks.forEach(block => {
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

                    return (
                      <div key={weekNum} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">Pekan {weekNum}</span>
                            <span className="text-xs text-gray-500">({completedInWeek}/4 selesai)</span>
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${(completedInWeek / 4) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {weekBlocks.map(block => (
                            <button
                              key={block.block_code}
                              type="button"
                              onClick={() => handleBlockClick(block.block_code, block.week_number)}
                              className={cn(
                                "p-2 border-2 rounded-lg text-center transition-all duration-200",
                                block.is_completed
                                  ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 cursor-default"
                                  : "border-gray-300 hover:border-teal-400 hover:bg-teal-50 cursor-pointer"
                              )}
                              title={block.is_completed ? `Sudah jurnal${block.jurnal_date ? `: ${new Date(block.jurnal_date).toLocaleDateString('id-ID')}` : ''}` : 'Klik untuk isi jurnal'}
                            >
                              <div className={cn(
                                "text-xs sm:text-sm font-bold",
                                block.is_completed ? "text-emerald-700" : "text-gray-600"
                              )}>
                                {block.block_code}
                              </div>
                              {block.is_completed && (
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 mx-auto mt-1" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-200 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border-2 border-emerald-400 bg-emerald-50 rounded"></div>
                  <span>Sudah jurnal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                  <span>Klik untuk isi jurnal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>Belum ada data jurnal. Silakan daftar program terlebih dahulu.</p>
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
  if (isWeekDone) {
    return (
      <div className="space-y-6 animate-fadeInUp">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-army mb-2">Alhamdulillah, Jurnal Pekan Ini Selesai!</h1>
          <p className="text-gray-600 mb-8">
            Semua 4 blok untuk pekan {selectedWeekNumber} telah berhasil dicatat
          </p>

          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Detail Jurnal Pekan {selectedWeekNumber}</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Juz:</span>
                <span className="font-semibold text-gray-800">
                  {juzToUse || '-'}
                  {selectedJuzInfo && (
                    <span className="text-gray-500 font-normal ml-2">({selectedJuzInfo.name})</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Blok Selesai:</span>
                <span className="font-semibold text-gray-800">{completedCount}/4 blok</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  Selesai
                </span>
              </div>
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
              {selectedBlockForEditing ? `Isi Jurnal - ${selectedBlockForEditing}` : 'Jurnal Pekan Ini'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {selectedBlockForEditing ? 'Lengkapi semua tahapan kurikulum wajib' : 'Lacak aktivitas hafalan Ukhti pekan ini'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedBlockForEditing && (
              <Button
                type="button"
                onClick={() => { setViewMode('status'); setSelectedBlockForEditing(null); resetForm(); }}
                variant="outline"
                className="bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Kembali ke Status
              </Button>
            )}
            <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2 rounded-lg shadow-sm">
              <div className="text-right">
                <p className="text-xs text-gray-500">Progress Blok</p>
                <p className="text-base sm:text-lg font-bold text-green-army">{completedCount}/4</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 relative">
                <svg className="transform -rotate-90 w-full h-full">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(completedCount / 4) * 100} 100`}
                    className="text-green-army transition-all duration-300"
                  />
                </svg>
              </div>
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
                <h3 className="font-semibold text-emerald-800 text-sm sm:text-base">Juz Setor</h3>
                <p className="text-xs sm:text-sm text-gray-700">
                  Juz {selectedJuzInfo.juz_number} Part {selectedJuzInfo.part} (Hal. {selectedJuzInfo.start_page}-{selectedJuzInfo.end_page})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Status */}
      <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-amber-400 to-orange-500">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg text-gray-800">
                Progress Jurnal Pekan {selectedWeekNumber}: {completedCount}/4 Blok
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                {completedCount === 0
                  ? 'Belum ada blok yang dicatat minggu ini'
                  : completedCount < 4
                    ? `${4 - completedCount} blok lagi untuk menyelesaikan pekan ini`
                    : 'Semua blok pekan ini sudah selesai!'
                }
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Tanggal Selection */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-sky-50 border-b p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-cyan-700 text-lg sm:text-xl">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Pilih Tanggal Setor</span>
              </CardTitle>
              <div className="text-right">
                <p className="text-xs sm:text-sm font-semibold text-cyan-700">
                  {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Klik hari untuk mengisi jurnal pada tanggal tersebut
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {(() => {
                const currentWeek = getCurrentWeekNumber()

                return (
                  <div key={currentWeek}>
                    <div className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-cyan-700">
                      Pekan Jurnal {currentWeek}
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Ah'].map((hari, index) => {
                        const dayDate = getDayDateInWeek(currentWeek, index)
                        const isToday = new Date().toDateString() === dayDate.toDateString()
                        const dateString = dayDate.toISOString().split('T')[0]

                        return (
                          <button
                            key={`week${currentWeek}-${hari}`}
                            type="button"
                            onClick={() => handleDateSelection(dayDate)}
                            className={cn(
                              "p-2 sm:p-3 border-2 rounded-xl transition-all duration-200 text-center",
                              "hover:shadow-md hover:scale-105",
                              jurnalData.tanggal_setor === dateString
                                ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-200"
                                : isToday
                                  ? "border-amber-400 bg-amber-50 hover:border-amber-500"
                                  : "border-gray-200 hover:border-cyan-300 bg-white"
                            )}
                          >
                            <div className={cn(
                              "text-xs font-medium mb-1",
                              jurnalData.tanggal_setor === dateString ? "text-green-700" : isToday ? "text-amber-700" : "text-gray-600"
                            )}>
                              {hari}
                            </div>
                            <div className={cn(
                              "text-sm sm:text-base font-bold",
                              jurnalData.tanggal_setor === dateString ? "text-green-800" : isToday ? "text-amber-800" : "text-gray-800"
                            )}>
                              {dayDate.getDate()}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Blok Selection - Multi-select Required */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-blue-700 text-lg sm:text-xl">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Pilih Blok Jurnal *</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {availableBlocks.length > 0
                ? `Pekan Jurnal ${selectedWeekNumber} - ${selectedJuzInfo?.name || ''}. Pilih 1 blok.`
                : 'Pilih tanggal terlebih dahulu untuk menentukan blok'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {availableBlocks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Belum ada blok yang tersedia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                {availableBlocks.map((blok) => {
                  const isSelected = jurnalData.blok === blok.block_code
                  return (
                    <button
                      key={blok.block_code}
                      type="button"
                      onClick={() => toggleBlokSelection(blok.block_code)}
                      className={cn(
                        "p-3 sm:p-4 border-2 rounded-xl transition-all duration-200",
                        "hover:shadow-lg hover:scale-105",
                        isSelected
                          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-blue-300 bg-white"
                      )}
                    >
                      <div className="text-center">
                        <div className={cn(
                          "text-xl sm:text-2xl font-bold",
                          isSelected ? "text-blue-700" : "text-gray-700"
                        )}>
                          {blok.block_code.toUpperCase()}
                        </div>
                        {isSelected && (
                          <div className="mt-2 text-blue-600">
                            <CheckCircle className="h-5 w-5 mx-auto" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kurikulum Wajib */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-blue-700 text-lg sm:text-xl">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Kurikulum Wajib (7 Tahapan) *</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Tujuh tahapan yang wajib diselesaikan untuk menghasilkan hafalan yang kuat dan mutqin
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 space-y-4">
            {jurnalStepsConfig.map((step, index) => {
              const isCompleted = isStepCompleted(step)
              const isTikrarGhaib = step.id === 'tikrar_bi_al_ghaib'

              return (
                <div
                  key={step.id}
                  className={cn(
                    "p-3 sm:p-4 border-2 rounded-xl transition-all duration-200",
                    isCompleted
                      ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-200"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{step.name}</h3>
                        {isCompleted && (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">{step.description}</p>

                      {/* Special UI for Tikrar Bil Ghaib */}
                      {isTikrarGhaib && (
                        <div className="mt-3 space-y-3">
                          {/* Main Options - Single Select */}
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-2">Pilih Tikrar Bil Ghaib:</p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { value: 'pasangan_40', label: 'Pasangan (40x)' },
                                { value: 'keluarga_40', label: 'Keluarga (40x)' },
                                { value: 'tarteel_40', label: 'Tarteel (40x)' }
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setJurnalData(prev => ({
                                      ...prev,
                                      tikrar_bi_al_ghaib_type: option.value as any,
                                      tikrar_bi_al_ghaib_subtype: null,
                                      tikrar_bi_al_ghaib_20x_multi: [],
                                      tarteel_screenshot_file: option.value === 'tarteel_40' ? prev.tarteel_screenshot_file : null
                                    }))
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    jurnalData.tikrar_bi_al_ghaib_type === option.value
                                      ? "bg-teal-500 text-white"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  )}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Sub-options for Pasangan (40x) */}
                          {jurnalData.tikrar_bi_al_ghaib_type === 'pasangan_40' && (
                            <div className="ml-4 pl-3 border-l-2 border-teal-200 space-y-3">
                              <div>
                                <p className="text-xs text-gray-600 mb-2">Pilih salah satu opsi:</p>
                                <div className="flex flex-col gap-2">
                                  {/* Option 1: WhatsApp Call 40x */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setJurnalData(prev => ({
                                        ...prev,
                                        tikrar_bi_al_ghaib_subtype: 'pasangan_40_wa',
                                        tikrar_bi_al_ghaib_20x_multi: []
                                      }))
                                    }}
                                    className={cn(
                                      "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                      jurnalData.tikrar_bi_al_ghaib_subtype === 'pasangan_40_wa' && jurnalData.tikrar_bi_al_ghaib_20x_multi.length === 0
                                        ? "bg-teal-600 text-white"
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                    )}
                                  >
                                    <div className="font-medium">WhatsApp Call (40x)</div>
                                    <div className="text-[10px] opacity-80">Satu opsi 40x</div>
                                  </button>

                                  {/* Option 2: WhatsApp Call (20x) DAN Voice Note (20x) - required both */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setJurnalData(prev => ({
                                        ...prev,
                                        tikrar_bi_al_ghaib_subtype: null,
                                        tikrar_bi_al_ghaib_20x_multi: ['pasangan_20_wa', 'voice_note_20']
                                      }))
                                    }}
                                    className={cn(
                                      "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                      jurnalData.tikrar_bi_al_ghaib_20x_multi.length === 2 &&
                                      jurnalData.tikrar_bi_al_ghaib_20x_multi.includes('pasangan_20_wa') &&
                                      jurnalData.tikrar_bi_al_ghaib_20x_multi.includes('voice_note_20')
                                        ? "bg-teal-600 text-white"
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                    )}
                                  >
                                    <div className="font-medium">WhatsApp Call (20x) + Voice Note (20x)</div>
                                    <div className="text-[10px] opacity-80">Dua opsi 20x (total 40x)</div>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Sub-options for Keluarga (40x) */}
                          {jurnalData.tikrar_bi_al_ghaib_type === 'keluarga_40' && (
                            <div className="ml-4 pl-3 border-l-2 border-teal-200">
                              <p className="text-xs text-gray-600 mb-2">Tikrar dengan keluarga:</p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { value: 'keluarga_40_suami', label: 'Suami' },
                                  { value: 'keluarga_40_ayah', label: 'Ayah' },
                                  { value: 'keluarga_40_ibu', label: 'Ibu' },
                                  { value: 'keluarga_40_kakak', label: 'Kakak' },
                                  { value: 'keluarga_40_adik', label: 'Adik' },
                                  { value: 'keluarga_40_saudara', label: 'Saudara' }
                                ].map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      setJurnalData(prev => ({ ...prev, tikrar_bi_al_ghaib_subtype: option.value as any }))
                                    }}
                                    className={cn(
                                      "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                                      jurnalData.tikrar_bi_al_ghaib_subtype === option.value
                                        ? "bg-teal-600 text-white"
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                    )}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tarteel File Upload */}
                          {jurnalData.tikrar_bi_al_ghaib_type === 'tarteel_40' && (
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">
                                Upload Bukti Tarteel <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    setJurnalData(prev => ({ ...prev, tarteel_screenshot_file: file }))
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                required
                              />
                              {jurnalData.tarteel_screenshot_file && (
                                <p className="text-xs text-gray-500 mt-1">
                                  File: {jurnalData.tarteel_screenshot_file.name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {!isTikrarGhaib && (
                        <button
                          type="button"
                          onClick={() => toggleStep(step.id)}
                          className={cn(
                            "mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-all touch-manipulation flex items-center justify-center gap-2",
                            isCompleted
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Selesai {step.countLabel && `(${step.countLabel})`}
                            </>
                          ) : (
                            <>
                              <Circle className="h-4 w-4" />
                              Belum Selesai {step.countLabel && `(${step.countLabel})`}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Kurikulum Tambahan - Optional */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-purple-700 text-lg sm:text-xl">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Kurikulum Tambahan (Opsional)</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Tahapan tambahan untuk memperkuat dan memperdalam pemahaman hafalan
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 space-y-4">
            {tambahanStepsConfig.map((step) => {
              const isCompleted = isStepCompleted(step)

              return (
                <div
                  key={step.id}
                  className={cn(
                    "p-3 sm:p-4 border-2 rounded-xl transition-all duration-200",
                    isCompleted
                      ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-200"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={cn("p-1.5 sm:p-2 rounded-lg text-white shrink-0", step.color)}>
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{step.name}</h3>
                        {isCompleted && (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">{step.description}</p>

                      <button
                        type="button"
                        onClick={() => toggleStep(step.id)}
                        className={cn(
                          "mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-all touch-manipulation",
                          isCompleted
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {isCompleted ? 'Selesai' : 'Belum Selesai'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Catatan Tambahan - Optional */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-slate-700 text-lg sm:text-xl">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Catatan Tambahan (Opsional)</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Catatan khusus tentang jurnal pekan ini
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <textarea
              value={jurnalData.catatan_tambahan}
              onChange={(e) => setJurnalData(prev => ({ ...prev, catatan_tambahan: e.target.value }))}
              placeholder="Tambahkan catatan penting tentang jurnal pekan ini..."
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
            disabled={!isAllRequiredCompleted || isSubmitting}
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
                Simpan Jurnal
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
