'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertCircle, Calendar, Loader2, BookOpen, Volume2, Mic, Edit, Circle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useAllRegistrations } from '@/hooks/useRegistrations'

interface JurnalRecord {
  id: string
  user_id: string
  tanggal_jurnal: string
  tashih_completed: boolean
  rabth_completed: boolean
  murajaah_count: number
  simak_murattal_count: number
  tikrar_bi_an_nadzar_completed: boolean
  tasmi_record_count: number
  simak_record_completed: boolean
  tikrar_bi_al_ghaib_count: number
  tafsir_completed: boolean
  menulis_completed: boolean
  total_duration_minutes: number
  catatan_tambahan: string | null
  created_at: string
  updated_at: string
}

interface JurnalStep {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  required: boolean
  minCount?: number
}

const jurnalStepsConfig: JurnalStep[] = [
  {
    id: 'rabth',
    name: 'Rabth',
    description: 'Mengulang-ulang 10 blok terakhir (1x)',
    icon: <Volume2 className="h-5 w-5" />,
    color: 'bg-blue-500',
    required: true
  },
  {
    id: 'murajaah',
    name: 'Murajaah',
    description: 'Dari hafalan tanpa mushaf (minimal 5x)',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'bg-green-500',
    required: true,
    minCount: 5
  },
  {
    id: 'simak_murattal',
    name: 'Simak Murattal',
    description: 'Mendengarkan qari (minimal 3x)',
    icon: <Volume2 className="h-5 w-5" />,
    color: 'bg-purple-500',
    required: true,
    minCount: 3
  },
  {
    id: 'tikrar_bi_an_nadzar',
    name: 'Tikrar Bi An-Nadzar',
    description: 'Dengan melihat mushaf',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'bg-orange-500',
    required: true
  },
  {
    id: 'tasmi_record',
    name: 'Tasmi\' Record',
    description: 'Recording dan evaluasi (minimal 3x)',
    icon: <Mic className="h-5 w-5" />,
    color: 'bg-red-500',
    required: true,
    minCount: 3
  },
  {
    id: 'simak_record',
    name: 'Simak Record',
    description: 'Mendengarkan kembali recording',
    icon: <Volume2 className="h-5 w-5" />,
    color: 'bg-indigo-500',
    required: true
  },
  {
    id: 'tikrar_bi_al_ghaib',
    name: 'Tikrar Bi Al-Ghaib',
    description: 'Tanpa Melihat Mushaf (minimal 40x)',
    icon: <Circle className="h-5 w-5" />,
    color: 'bg-teal-500',
    required: true,
    minCount: 40
  }
]

const tambahanStepsConfig: JurnalStep[] = [
  {
    id: 'tafsir',
    name: 'Tafsir',
    description: 'Mempelajari makna ayat',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'bg-emerald-500',
    required: false
  },
  {
    id: 'menulis',
    name: 'Menulis',
    description: 'Latih menulis ayat',
    icon: <Edit className="h-5 w-5" />,
    color: 'bg-pink-500',
    required: false
  }
]

export default function JurnalHarianPage() {
  const { user } = useAuth()
  const { registrations, isLoading: registrationsLoading } = useAllRegistrations()

  const [jurnalData, setJurnalData] = useState({
    rabth_completed: false,
    murajaah_count: 0,
    simak_murattal_count: 0,
    tikrar_bi_an_nadzar_completed: false,
    tasmi_record_count: 0,
    simak_record_completed: false,
    tikrar_bi_al_ghaib_count: 0,
    tafsir_completed: false,
    menulis_completed: false,
    catatan_tambahan: '',
    total_duration_minutes: 0
  })

  const [todayRecord, setTodayRecord] = useState<JurnalRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Get active registration
  const activeRegistration = registrations.find((reg: any) =>
    reg.batch?.status === 'open' &&
    (reg.status === 'approved' || reg.selection_status === 'selected')
  ) || registrations[0]

  // Load today's record
  useEffect(() => {
    if (user) {
      loadTodayRecord()
    }
  }, [user])

  const loadTodayRecord = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('jurnal_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('tanggal_jurnal', today)
        .order('tanggal_jurnal', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error loading jurnal record:', error)
        return
      }

      if (data && data.length > 0) {
        setTodayRecord(data[0])
        setJurnalData({
          rabth_completed: data[0].rabth_completed || false,
          murajaah_count: data[0].murajaah_count || 0,
          simak_murattal_count: data[0].simak_murattal_count || 0,
          tikrar_bi_an_nadzar_completed: data[0].tikrar_bi_an_nadzar_completed || false,
          tasmi_record_count: data[0].tasmi_record_count || 0,
          simak_record_completed: data[0].simak_record_completed || false,
          tikrar_bi_al_ghaib_count: data[0].tikrar_bi_al_ghaib_count || 0,
          tafsir_completed: data[0].tafsir_completed || false,
          menulis_completed: data[0].menulis_completed || false,
          catatan_tambahan: data[0].catatan_tambahan || '',
          total_duration_minutes: data[0].total_duration_minutes || 0
        })
      }
    } catch (error) {
      console.error('Error loading jurnal record:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleStep = (stepId: string) => {
    const fieldKey = `${stepId}_completed` as keyof typeof jurnalData
    setJurnalData(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }))
  }

  const incrementCounter = (stepId: string, maxCount?: number) => {
    const counterKey = `${stepId}_count` as keyof typeof jurnalData
    setJurnalData(prev => ({
      ...prev,
      [counterKey]: Math.min((prev[counterKey] as number || 0) + 1, maxCount || 999)
    }))
  }

  const decrementCounter = (stepId: string) => {
    const counterKey = `${stepId}_count` as keyof typeof jurnalData
    setJurnalData(prev => ({
      ...prev,
      [counterKey]: Math.max((prev[counterKey] as number || 0) - 1, 0)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Silakan login terlebih dahulu')
      return
    }

    // Check if tashih is completed today
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const { data: tashihData, error: tashihError } = await supabase
      .from('tashih_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('waktu_tashih', today)
      .limit(1)

    if (tashihError || !tashihData || tashihData.length === 0) {
      toast.error('Harap selesaikan tashih hari ini terlebih dahulu!')
      return
    }

    setIsSubmitting(true)
    try {
      const recordData = {
        user_id: user.id,
        tashih_completed: true,
        rabth_completed: jurnalData.rabth_completed,
        murajaah_count: jurnalData.murajaah_count,
        simak_murattal_count: jurnalData.simak_murattal_count,
        tikrar_bi_an_nadzar_completed: jurnalData.tikrar_bi_an_nadzar_completed,
        tasmi_record_count: jurnalData.tasmi_record_count,
        simak_record_completed: jurnalData.simak_record_completed,
        tikrar_bi_al_ghaib_count: jurnalData.tikrar_bi_al_ghaib_count,
        tafsir_completed: jurnalData.tafsir_completed,
        menulis_completed: jurnalData.menulis_completed,
        catatan_tambahan: jurnalData.catatan_tambahan || null,
        total_duration_minutes: jurnalData.total_duration_minutes
      }

      let error

      if (todayRecord) {
        const { error: updateError } = await supabase
          .from('jurnal_records')
          .update(recordData)
          .eq('id', todayRecord.id)
          .select()
          .single()

        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('jurnal_records')
          .insert(recordData)
          .select()
          .single()

        error = insertError
      }

      if (error) {
        console.error('Error saving jurnal record:', error)
        toast.error('Gagal menyimpan data jurnal: ' + error.message)
        return
      }

      toast.success('Jurnal harian berhasil disimpan!')
      await loadTodayRecord()
    } catch (error) {
      console.error('Error saving jurnal:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setJurnalData({
      rabth_completed: false,
      murajaah_count: 0,
      simak_murattal_count: 0,
      tikrar_bi_an_nadzar_completed: false,
      tasmi_record_count: 0,
      simak_record_completed: false,
      tikrar_bi_al_ghaib_count: 0,
      tafsir_completed: false,
      menulis_completed: false,
      catatan_tambahan: '',
      total_duration_minutes: 0
    })
    setTodayRecord(null)
  }

  const isStepCompleted = (step: JurnalStep): boolean => {
    if (step.minCount) {
      const counterKey = `${step.id}_count` as keyof typeof jurnalData
      return (jurnalData[counterKey] as number || 0) >= step.minCount
    }
    const fieldKey = `${step.id}_completed` as keyof typeof jurnalData
    return jurnalData[fieldKey] as boolean || false
  }

  const getCurrentCount = (step: JurnalStep): number => {
    if (!step.minCount) return 0
    const counterKey = `${step.id}_count` as keyof typeof jurnalData
    return jurnalData[counterKey] as number || 0
  }

  const requiredCompleted = jurnalStepsConfig.filter(step => isStepCompleted(step)).length
  const isAllRequiredCompleted = requiredCompleted === jurnalStepsConfig.length

  if (isLoading || registrationsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-army" />
      </div>
    )
  }

  // Show success if already submitted today
  if (todayRecord) {
    return (
      <div className="space-y-6 animate-fadeInUp">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-army mb-2">Alhamdulillah, Jurnal Selesai!</h1>
          <p className="text-gray-600 mb-8">
            Jurnal harian Ukhti telah berhasil dicatat untuk hari ini
          </p>

          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Ringkasan Jurnal Hari Ini</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Kurikulum Wajib:</span>
                <span className="font-semibold text-green-600">{requiredCompleted}/{jurnalStepsConfig.length} selesai</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Tanggal:</span>
                <span className="font-medium text-gray-800">
                  {new Date(todayRecord.tanggal_jurnal).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Perbarui Jurnal
            </Button>
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

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-green-army mb-2">Jurnal Harian</h1>
            <p className="text-gray-600">Lacak aktivitas hafalan Ukhti hari ini</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
            <div className="text-right">
              <p className="text-xs text-gray-500">Progress Wajib</p>
              <p className="text-lg font-bold text-green-army">{requiredCompleted}/{jurnalStepsConfig.length}</p>
            </div>
            <div className="w-12 h-12 relative">
              <svg className="transform -rotate-90 w-12 h-12">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(requiredCompleted / jurnalStepsConfig.length) * 126} 126`}
                  className="text-green-army transition-all duration-300"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Status */}
      <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-amber-400 to-orange-500">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800">
                {isAllRequiredCompleted ? 'Jurnal Hari Ini Selesai!' : 'Jurnal Hari Ini Belum Selesai'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isAllRequiredCompleted
                  ? 'Alhamdulillah, semua kurikulum wajib telah diselesaikan'
                  : `${requiredCompleted}/${jurnalStepsConfig.length} kurikulum wajib selesai`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kurikulum Wajib */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <BookOpen className="h-5 w-5" />
              <span>Kurikulum Wajib</span>
            </CardTitle>
            <CardDescription>
              7 Tahap Kurikulum Wajib yang harus diselesaikan setiap hari
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jurnalStepsConfig.map((step) => {
                const isCompleted = isStepCompleted(step)
                const currentCount = getCurrentCount(step)

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "p-4 border-2 rounded-xl transition-all duration-200",
                      "hover:shadow-lg hover:scale-[1.02]",
                      isCompleted
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-200"
                        : "border-gray-200 hover:border-blue-300 bg-white"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg text-white shrink-0", step.color)}>
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{step.name}</h3>
                        <p className="text-xs text-gray-600 mt-1">{step.description}</p>

                        {step.minCount ? (
                          <div className="flex items-center gap-1 mt-3">
                            <button
                              type="button"
                              onClick={() => decrementCounter(step.id)}
                              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                              disabled={currentCount === 0}
                            >
                              <Circle className="h-4 w-4 text-gray-400" />
                            </button>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: Math.min(step.minCount, 10) }).map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center",
                                    i < currentCount
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-200"
                                  )}
                                >
                                  {i < currentCount && i < 5 && (
                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => incrementCounter(step.id, step.minCount)}
                              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                              disabled={currentCount >= step.minCount}
                            >
                              <CheckCircle className={cn(
                                "h-4 w-4",
                                currentCount >= step.minCount ? "text-green-500" : "text-gray-400"
                              )} />
                            </button>
                            <span className="text-xs sm:text-sm font-medium text-gray-700 ml-1">
                              {currentCount}/{step.minCount}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleStep(step.id)}
                            className={cn(
                              "mt-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                              isCompleted
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle className="h-4 w-4 inline mr-1" />
                                Selesai
                              </>
                            ) : (
                              <>
                                <Circle className="h-4 w-4 inline mr-1" />
                                Belum
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Kurikulum Tambahan */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <BookOpen className="h-5 w-5" />
              <span>Kurikulum Tambahan (Pilihan)</span>
            </CardTitle>
            <CardDescription>
              Tahap opsional untuk mendalami pemahaman
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tambahanStepsConfig.map((step) => {
                const isCompleted = isStepCompleted(step)

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "p-4 border-2 rounded-xl transition-all duration-200",
                      "hover:shadow-lg hover:scale-[1.02]",
                      isCompleted
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-200"
                        : "border-gray-200 hover:border-purple-300 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("p-2 rounded-lg text-white shrink-0", step.color)}>
                          {step.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{step.name}</h3>
                          <p className="text-xs text-gray-600 truncate">{step.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleStep(step.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0 ml-2",
                          isCompleted
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Catatan Tambahan */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <BookOpen className="h-5 w-5" />
              <span>Catatan Tambahan</span>
            </CardTitle>
            <CardDescription>
              Catatan khusus tentang jurnal hari ini (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <textarea
              value={jurnalData.catatan_tambahan}
              onChange={(e) => setJurnalData(prev => ({ ...prev, catatan_tambahan: e.target.value }))}
              placeholder="Tambahkan catatan penting tentang jurnal hari ini..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none text-sm"
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
