'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, MapPin, BookOpen, AlertCircle, Calendar, Loader2, User, School, BookCopy, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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
  blok: string
  lokasi: string
  lokasiDetail: string
  ustadzahId: string | null
  ustadzahName: string | null
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
  masalah_tajwid: string[] | null
  catatan_tambahan: string | null
  waktu_tashih: string
  created_at: string
}

interface UserProgramInfo {
  programType: 'tikrar_tahfidz' | 'pra_tahfidz' | null
  confirmedChosenJuz: string | null
  batchStartDate: string | null
  batchId: string | null
  tashihHalaqahId: string | null
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

export default function Tashih() {
  const router = useRouter()
  const [tashihData, setTashihData] = useState<TashihData>({
    blok: '',
    lokasi: 'mti',
    lokasiDetail: '',
    ustadzahId: null,
    ustadzahName: null,
    masalahTajwid: [],
    catatanTambahan: '',
    tanggalTashih: new Date().toISOString().slice(0, 10)
  })

  const [todayRecord, setTodayRecord] = useState<TashihRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [userProgramInfo, setUserProgramInfo] = useState<UserProgramInfo>({
    programType: null,
    confirmedChosenJuz: null,
    batchStartDate: null,
    batchId: null,
    tashihHalaqahId: null
  })
  const [availableBlocks, setAvailableBlocks] = useState<TashihBlock[]>([])
  const [selectedJuzInfo, setSelectedJuzInfo] = useState<JuzOption | null>(null)
  const [availableMuallimah, setAvailableMuallimah] = useState<MuallimahOption[]>([])
  const [isLoadingMuallimah, setIsLoadingMuallimah] = useState(false)
  const [isUstadzahDropdownOpen, setIsUstadzahDropdownOpen] = useState(false)

  // Load user program info on mount
  useEffect(() => {
    loadUserProgramInfo()
  }, [])

  // Load blocks when user program info is available
  useEffect(() => {
    if (userProgramInfo.programType && userProgramInfo.confirmedChosenJuz) {
      loadAvailableBlocks()
    }
  }, [userProgramInfo])

  // Load muallimah options when batch info is available
  useEffect(() => {
    if (userProgramInfo.batchId && userProgramInfo.confirmedChosenJuz) {
      loadAvailableMuallimah()
    }
  }, [userProgramInfo.batchId, userProgramInfo.confirmedChosenJuz])

  // Load today's tashih record after blocks are loaded
  useEffect(() => {
    if (availableBlocks.length > 0 || userProgramInfo.programType) {
      loadTodayRecord()
    }
  }, [availableBlocks])

  const loadUserProgramInfo = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Priority 1: Check for daftar ulang submissions (Tahfidz Tikrar MTI) - submitted or approved
      const { data: daftarUlangSubmission } = await supabase
        .from('daftar_ulang_submissions')
        .select(`
          *,
          batch:batches(*)
        `)
        .eq('user_id', user.id)
        .in('status', ['submitted', 'approved'])
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      console.log('daftarUlangSubmission:', daftarUlangSubmission)

      if (daftarUlangSubmission) {
        // Get confirmed_chosen_juz from pendaftaran_tikrar_tahfidz
        let confirmedJuz = null
        if (daftarUlangSubmission.registration_id) {
          const { data: registration } = await supabase
            .from('pendaftaran_tikrar_tahfidz')
            .select('confirmed_chosen_juz')
            .eq('id', daftarUlangSubmission.registration_id)
            .single()
          confirmedJuz = registration?.confirmed_chosen_juz
        }

        console.log('Setting Tikrar Tahfidz with juz:', confirmedJuz)
        setUserProgramInfo({
          programType: 'tikrar_tahfidz',
          confirmedChosenJuz: confirmedJuz,
          batchStartDate: daftarUlangSubmission.batch?.start_date || null,
          batchId: daftarUlangSubmission.batch_id || null,
          tashihHalaqahId: daftarUlangSubmission.tashih_halaqah_id || null
        })
        return
      }

      // Priority 2: Check for Pra Tikrar (pendaftaran_tikrar_tahfidz with status 'selected')
      // ONLY if NOT in daftar_ulang_submissions
      const { data: praTikrarReg } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select(`
          *,
          program:programs(*),
          batch:batches(*)
        `)
        .eq('user_id', user.id)
        .eq('selection_status', 'selected')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (praTikrarReg) {
        setUserProgramInfo({
          programType: 'pra_tahfidz',
          confirmedChosenJuz: praTikrarReg.chosen_juz,
          batchStartDate: praTikrarReg.batch?.start_date || null,
          batchId: praTikrarReg.batch_id || null,
          tashihHalaqahId: null
        })
        return
      }

      // No program found
      setUserProgramInfo({
        programType: null,
        confirmedChosenJuz: null,
        batchStartDate: null,
        batchId: null,
        tashihHalaqahId: null
      })
    } catch (error) {
      console.error('Error loading user program info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableBlocks = async () => {
    if (!userProgramInfo.confirmedChosenJuz || !userProgramInfo.batchStartDate) {
      return
    }

    try {
      const supabase = createClient()

      // Get juz info first
      const { data: juzData } = await supabase
        .from('juz_options')
        .select('*')
        .eq('code', userProgramInfo.confirmedChosenJuz)
        .single()

      if (!juzData) {
        console.error('Juz not found:', userProgramInfo.confirmedChosenJuz)
        return
      }

      setSelectedJuzInfo(juzData)

      // Calculate current week number from batch start date
      const batchStart = new Date(userProgramInfo.batchStartDate)
      const today = new Date()
      const weeksSinceStart = Math.floor((today.getTime() - batchStart.getTime()) / (7 * 24 * 60 * 60 * 1000))

      // Calculate part offset (part A starts at week 1, part B starts at week 11)
      const partOffset = juzData.part === 'B' ? 10 : 0
      const currentWeek = weeksSinceStart + partOffset + 1

      // Calculate total pages for this juz part
      const totalPages = juzData.end_page - juzData.start_page + 1
      const pagesPerBlock = Math.ceil(totalPages / (10 * 4)) // 10 weeks, 4 blocks per week

      // Generate 4 blocks for current week (H1A, H1B, H1C, H1D or H11A, H11B, etc.)
      const blocks: TashihBlock[] = []
      const parts = ['A', 'B', 'C', 'D']

      for (let i = 0; i < 4; i++) {
        const part = parts[i]
        const blockCode = `H${currentWeek}${part}`
        const weekOffset = currentWeek - partOffset - 1
        const blockStartPage = juzData.start_page + (weekOffset * 4 * pagesPerBlock) + (i * pagesPerBlock)
        const blockEndPage = Math.min(blockStartPage + pagesPerBlock - 1, juzData.end_page)

        blocks.push({
          block_code: blockCode,
          week_number: currentWeek,
          part,
          start_page: blockStartPage,
          end_page: blockEndPage
        })
      }

      setAvailableBlocks(blocks)
    } catch (error) {
      console.error('Error loading available blocks:', error)
    }
  }

  const loadAvailableMuallimah = async () => {
    if (!userProgramInfo.batchId || !userProgramInfo.confirmedChosenJuz) {
      return
    }

    try {
      setIsLoadingMuallimah(true)
      const supabase = createClient()

      // Get all muallimah with status approved or submitted for this batch
      const { data: muallimahData } = await supabase
        .from('muallimah_registrations')
        .select('id, user_id, full_name, preferred_juz')
        .eq('batch_id', userProgramInfo.batchId)
        .in('status', ['approved', 'submitted'])
        .order('full_name', { ascending: true })

      if (!muallimahData) {
        console.log('No muallimah found for batch:', userProgramInfo.batchId)
        return
      }

      setAvailableMuallimah(muallimahData || [])
    } catch (error) {
      console.error('Error loading muallimah:', error)
    } finally {
      setIsLoadingMuallimah(false)
    }
  }

  const loadTodayRecord = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get today's record
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('tashih_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('waktu_tashih', today)
        .order('waktu_tashih', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error loading tashih record:', error)
        toast.error('Gagal memuat data tashih')
        return
      }

      if (data && data.length > 0) {
        setTodayRecord(data[0])
        setTashihData({
          blok: data[0].blok,
          lokasi: data[0].lokasi,
          lokasiDetail: data[0].lokasi_detail || '',
          ustadzahId: data[0].ustadzah_id || null,
          ustadzahName: data[0].nama_pemeriksa || null,
          masalahTajwid: data[0].masalah_tajwid || [],
          catatanTambahan: data[0].catatan_tambahan || '',
          tanggalTashih: new Date(data[0].waktu_tashih).toISOString().slice(0, 10)
        })
      }
    } catch (error) {
      console.error('Error loading tashih record:', error)
    }
  }

  const validateForm = () => {
    const valid = !!(
      tashihData.blok &&
      tashihData.lokasi &&
      tashihData.tanggalTashih
    )
    setIsValid(valid)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Silakan login terlebih dahulu')
        return
      }

      const recordData = {
        user_id: user.id,
        blok: tashihData.blok,
        lokasi: tashihData.lokasi,
        lokasi_detail: tashihData.lokasiDetail || null,
        ustadzah_id: tashihData.ustadzahId,
        nama_pemeriksa: tashihData.ustadzahName,
        masalah_tajwid: tashihData.masalahTajwid,
        catatan_tambahan: tashihData.catatanTambahan || null,
        waktu_tashih: new Date(tashihData.tanggalTashih).toISOString()
      }

      let error

      if (todayRecord) {
        const { error: updateError } = await supabase
          .from('tashih_records')
          .update(recordData)
          .eq('id', todayRecord.id)
          .select()
          .single()

        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('tashih_records')
          .insert(recordData)
          .select()
          .single()

        error = insertError
      }

      if (error) {
        console.error('Error saving tashih record:', error)
        toast.error('Gagal menyimpan data tashih: ' + error.message)
        return
      }

      toast.success('Tashih berhasil disimpan!')
      await loadTodayRecord()
    } catch (error) {
      console.error('Error saving tashih:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTashihData({
      blok: '',
      lokasi: 'mti',
      lokasiDetail: '',
      ustadzahId: null,
      ustadzahName: null,
      masalahTajwid: [],
      catatanTambahan: '',
      tanggalTashih: new Date().toISOString().slice(0, 10)
    })
    setTodayRecord(null)
    setIsValid(false)
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

  // Get min date for date input
  const getMinDate = () => {
    if (userProgramInfo.batchStartDate) {
      return userProgramInfo.batchStartDate.slice(0, 10)
    }
    return ''
  }

  // Get max date (today) - user cannot select future dates
  const getMaxDate = () => {
    return new Date().toISOString().slice(0, 10)
  }

  // Get date for a given day index (0=Senin, 6=Ahad) of the current week
  const getDayDate = (dayIndex: number) => {
    const today = new Date()
    const currentDay = today.getDay() // 0=Ahad, 1=Senin, ..., 6=Sabtu
    const diff = (dayIndex + 1) - currentDay // Convert to 1=Senin, 7=Ahad
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + diff)
    return targetDate
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-army" />
      </div>
    )
  }

  if (!userProgramInfo.programType) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Belum Terdaftar di Program Aktif</h2>
        <p className="text-gray-600 mb-6">Ukhti belum terdaftar di program Tahfidz Tikrar MTI, Pra Tikrar, atau Kaderisasi Muallimah yang aktif.</p>
        <Link href="/dashboard">
          <Button>Kembali ke Dashboard</Button>
        </Link>
      </div>
    )
  }

  if (todayRecord) {
    return (
      <div className="space-y-6 animate-fadeInUp">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-army mb-2">Alhamdulillah, Tashih Selesai!</h1>
          <p className="text-gray-600 mb-8">
            Tashih bacaan Ukhti telah berhasil dicatat untuk hari ini
          </p>

          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Detail Tashih Hari Ini</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Juz:</span>
                <span className="font-semibold text-gray-800">
                  {userProgramInfo.confirmedChosenJuz || '-'}
                  {selectedJuzInfo && (
                    <span className="text-gray-500 font-normal ml-2">({selectedJuzInfo.name})</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Blok:</span>
                <span className="font-semibold text-gray-800">{todayRecord.blok}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Lokasi:</span>
                <span className="font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  MTI
                </span>
              </div>
              {todayRecord.ustadzah_id && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Ustadzah:</span>
                  <span className="font-medium text-gray-800">{todayRecord.nama_pemeriksa || 'Belum dipilih'}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Tanggal:</span>
                <span className="font-medium text-gray-800">
                  {new Date(todayRecord.waktu_tashih).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {todayRecord.masalah_tajwid && todayRecord.masalah_tajwid.length > 0 && (
                <div className="py-2 border-b border-gray-100">
                  <span className="text-gray-600 block mb-2">Masalah Tajwid:</span>
                  <div className="flex flex-wrap gap-2">
                    {todayRecord.masalah_tajwid.map(masalahId => {
                      const masalah = masalahTajwidOptions.find(m => m.id === masalahId)
                      return masalah ? (
                        <span key={masalahId} className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium",
                          masalah.color,
                          "border border-current"
                        )}>
                          {masalah.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}
              {todayRecord.catatan_tambahan && (
                <div className="py-2">
                  <span className="text-gray-600 block mb-2">Catatan:</span>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{todayRecord.catatan_tambahan}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Perbarui Tashih
            </Button>
            <Link href="/jurnal-harian" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                Lanjut ke Jurnal Harian
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get program type display info
  const getProgramDisplay = () => {
    switch (userProgramInfo.programType) {
      case 'tikrar_tahfidz':
        return {
          title: 'Tahfidz Tikrar MTI',
          description: 'Program Tahfidz dengan sistem Tikrar',
          icon: <BookCopy className="h-6 w-6" />,
          color: 'from-emerald-500 to-green-600'
        }
      case 'pra_tahfidz':
        return {
          title: 'Pra Tikrar',
          description: 'Program persiapan Tikrar Tahfidz',
          icon: <BookOpen className="h-6 w-6" />,
          color: 'from-blue-500 to-indigo-600'
        }
      default:
        return null
    }
  }

  const programDisplay = getProgramDisplay()

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-green-army mb-2">Tashih Bacaan</h1>
            <p className="text-gray-600">Validasi bacaan Al-Quran Ukhti</p>
            {programDisplay && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-emerald-200">
                <span className={cn(
                  "p-1.5 rounded-full bg-gradient-to-r text-white",
                  programDisplay.color
                )}>
                  {programDisplay.icon}
                </span>
                <div>
                  <p className="text-xs text-gray-500">Program</p>
                  <p className="text-sm font-semibold text-gray-800">{programDisplay.title}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>Prasyarat wajib sebelum jurnal harian</span>
          </div>
        </div>
      </div>

      {/* Juz Info Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-full">
              <BookCopy className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-800">Juz Tashih Ukhti</h3>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Juz {userProgramInfo.confirmedChosenJuz}</span>
                {selectedJuzInfo && (
                  <span className="ml-2 text-gray-600">({selectedJuzInfo.name}, Hal. {selectedJuzInfo.start_page}-{selectedJuzInfo.end_page})</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Status */}
      <Card className={cn(
        "border-2 transition-all duration-300",
        "border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50"
      )}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-amber-400 to-orange-500">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800">Tashih Hari Ini Belum Selesai</h3>
              <p className="text-sm text-gray-600 mt-1">
                Lakukan tashih terlebih dahulu sebelum mengisi jurnal harian
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Selection Buttons */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-sky-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-cyan-700">
              <Calendar className="h-5 w-5" />
              <span>Pilih Hari</span>
            </CardTitle>
            <div className="text-right">
              <p className="text-sm font-semibold text-cyan-700">
                {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <CardDescription>
            Klik hari untuk melihat riwayat tashih atau mengisi tashih untuk hari tersebut
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'].map((hari, index) => {
              const dayDate = getDayDate(index)
              const isToday = new Date().toDateString() === dayDate.toDateString()
              const dateString = dayDate.toISOString().split('T')[0]

              return (
                <button
                  key={hari}
                  type="button"
                  onClick={() => setTashihData(prev => ({ ...prev, tanggalTashih: dateString }))}
                  className={cn(
                    "p-3 border-2 rounded-xl transition-all duration-200 text-center",
                    "hover:shadow-md hover:scale-105",
                    tashihData.tanggalTashih === dateString
                      ? "border-cyan-500 bg-gradient-to-br from-cyan-50 to-sky-50 shadow-lg ring-2 ring-cyan-200"
                      : isToday
                        ? "border-cyan-300 bg-cyan-50 hover:border-cyan-400"
                        : "border-gray-200 hover:border-cyan-300 bg-white"
                  )}
                >
                  <div className={cn(
                    "text-xs font-medium mb-1",
                    tashihData.tanggalTashih === dateString || isToday ? "text-cyan-700" : "text-gray-600"
                  )}>
                    {hari}
                  </div>
                  <div className={cn(
                    "text-sm font-bold",
                    tashihData.tanggalTashih === dateString || isToday ? "text-cyan-800" : "text-gray-800"
                  )}>
                    {dayDate.getDate()}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Block Selection */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <BookOpen className="h-5 w-5" />
              <span>Pilih Blok yang Ditashih</span>
            </CardTitle>
            <CardDescription>
              {selectedJuzInfo && availableBlocks.length > 0
                ? `Pekan ${availableBlocks[0].week_number} - ${selectedJuzInfo.name}`
                : 'Memuat blok yang tersedia...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {availableBlocks.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Memuat blok yang tersedia...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {availableBlocks.map((blok) => (
                  <div
                    key={blok.block_code}
                    onClick={() => setTashihData(prev => ({ ...prev, blok: blok.block_code }))}
                    className={cn(
                      "p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 group",
                      "hover:shadow-lg hover:scale-105 hover:-translate-y-1",
                      tashihData.blok === blok.block_code
                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-blue-300 bg-white"
                    )}
                  >
                    <div className="text-center">
                      <div className={cn(
                        "text-2xl font-bold mb-2",
                        tashihData.blok === blok.block_code ? "text-blue-700" : "text-gray-700 group-hover:text-blue-600"
                      )}>
                        {blok.block_code.toUpperCase()}
                      </div>
                      <div className={cn(
                        "text-sm",
                        tashihData.blok === blok.block_code ? "text-blue-600 font-medium" : "text-gray-500 group-hover:text-blue-500"
                      )}>
                        Hal. {blok.start_page}-{blok.end_page}
                      </div>
                      {tashihData.blok === blok.block_code && (
                        <div className="mt-3 text-blue-600">
                          <CheckCircle className="h-6 w-6 mx-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location & Ustadzah Selection - MTI Only */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <MapPin className="h-5 w-5" />
              <span>Lokasi & Ustadzah</span>
            </CardTitle>
            <CardDescription>
              Pilih lokasi tashih dan ustadzah yang akan memeriksa bacaan.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Location Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pilih Lokasi Tashih <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* MTI Option */}
                <div
                  onClick={() => setTashihData(prev => ({ ...prev, lokasi: 'mti', lokasiDetail: '' }))}
                  className={cn(
                    "p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
                    "hover:shadow-md hover:scale-[1.02]",
                    tashihData.lokasi === 'mti'
                      ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg ring-2 ring-emerald-200"
                      : "border-gray-200 hover:border-emerald-300 bg-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-full">
                      <School className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Markaz Tikrar Indonesia</p>
                      <p className="text-xs text-gray-600">MTI Jakarta</p>
                    </div>
                    {tashihData.lokasi === 'mti' && <CheckCircle className="h-6 w-6 text-emerald-600" />}
                  </div>
                </div>

                {/* Luar MTI Option */}
                <div
                  onClick={() => setTashihData(prev => ({ ...prev, lokasi: 'luar' }))}
                  className={cn(
                    "p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
                    "hover:shadow-md hover:scale-[1.02]",
                    tashihData.lokasi === 'luar'
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300 bg-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Luar MTI</p>
                      <p className="text-xs text-gray-600">Lokasi lain</p>
                    </div>
                    {tashihData.lokasi === 'luar' && <CheckCircle className="h-6 w-6 text-blue-600" />}
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
                  <div className="relative">
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
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ustadzah Dropdown List - Rendered outside card */}
        {isUstadzahDropdownOpen && tashihData.lokasi === 'mti' && availableMuallimah.length > 0 && (
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

        {/* Tajwid Issues */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="h-5 w-5" />
              <span>Masalah Tajwid yang Ditemukan</span>
            </CardTitle>
            <CardDescription>
              Pilih masalah tajwid yang perlu diperbaiki (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {masalahTajwidOptions.map((masalah) => (
                <div
                  key={masalah.id}
                  onClick={() => toggleMasalahTajwid(masalah.id)}
                  className={cn(
                    "p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group",
                    "hover:shadow-md hover:scale-105",
                    tashihData.masalahTajwid.includes(masalah.id)
                      ? `border-rose-400 ${masalah.color} shadow-lg ring-2 ring-rose-200`
                      : "border-gray-200 hover:border-rose-300 bg-white"
                  )}
                >
                  <div className="text-center">
                    <h4 className={cn(
                      "font-medium text-sm mb-1",
                      tashihData.masalahTajwid.includes(masalah.id) ? "text-gray-800" : "text-gray-700 group-hover:text-rose-600"
                    )}>
                      {masalah.name}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{masalah.description}</p>
                    {tashihData.masalahTajwid.includes(masalah.id) && (
                      <div className="mt-2 text-rose-600">
                        <CheckCircle className="h-4 w-4 mx-auto" />
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
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <BookOpen className="h-5 w-5" />
              <span>Catatan Tambahan</span>
            </CardTitle>
            <CardDescription>
              Catatan khusus tentang tashih hari ini (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <textarea
              value={tashihData.catatanTambahan}
              onChange={(e) => setTashihData(prev => ({ ...prev, catatanTambahan: e.target.value }))}
              placeholder="Tambahkan catatan penting tentang tashih bacaan hari ini..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
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
