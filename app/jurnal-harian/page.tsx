'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, Square, CheckCircle, Circle, Clock, Volume2, Mic, MicOff, Edit, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'

interface JurnalStep {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  counter?: boolean
  minCount?: number
  currentCount?: number
  recording?: boolean
}

interface JurnalData {
  completedSteps: {
    [key: string]: boolean
  }
  counters: {
    [key: string]: number
  }
  recordingTime: number
}

export default function JurnalHarian() {
  const [jurnalData, setJurnalData] = useState<JurnalData>({
    completedSteps: {
      rabth: false,
      murajaah: false,
      simakMurattal: false,
      tikrarBiAnNadzar: false,
      tasmiRecord: false,
      simakRecord: false,
      tikrarBiAlGhaib: false,
      tafsir: false,
      menulis: false
    },
    counters: {
      murajaahCount: 0,
      simakCount: 0,
      recordingCount: 0,
      tikrarGhaibCount: 0
    },
    recordingTime: 0
  })

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTimer, setRecordingTimer] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const jurnalSteps: JurnalStep[] = [
    {
      id: 'rabth',
      name: 'Rabth',
      description: 'Mengulang-ulang 10 blok terakhir (1x)',
      icon: <Volume2 className="h-5 w-5" />,
      color: 'bg-blue-500',
      counter: false
    },
    {
      id: 'murajaah',
      name: 'Murajaah',
      description: 'Dari hafalan tanpa mushaf (minimal 5x)',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'bg-green-500',
      counter: true,
      minCount: 5,
      currentCount: jurnalData.counters.murajaahCount
    },
    {
      id: 'simakMurattal',
      name: 'Simak Murattal',
      description: 'Mendengarkan qari (minimal 3x)',
      icon: <Volume2 className="h-5 w-5" />,
      color: 'bg-purple-500',
      counter: true,
      minCount: 3,
      currentCount: jurnalData.counters.simakCount
    },
    {
      id: 'tikrarBiAnNadzar',
      name: 'Tikrar Bi An-Nadzar',
      description: 'Dengan melihat mushaf',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'bg-orange-500',
      counter: false
    },
    {
      id: 'tasmiRecord',
      name: 'Tasmi\' Record',
      description: 'Recording dan evaluasi (minimal 3x)',
      icon: <Mic className="h-5 w-5" />,
      color: 'bg-red-500',
      counter: true,
      minCount: 3,
      currentCount: jurnalData.counters.recordingCount
    },
    {
      id: 'simakRecord',
      name: 'Simak Record',
      description: 'Mendengarkan kembali recording',
      icon: <Volume2 className="h-5 w-5" />,
      color: 'bg-indigo-500',
      counter: false
    },
    {
      id: 'tikrarBiAlGhaib',
      name: 'Tikrar Bi Al-Ghaib',
      description: 'Tutup mata (minimal 40x)',
      icon: <Circle className="h-5 w-5" />,
      color: 'bg-teal-500',
      counter: true,
      minCount: 40,
      currentCount: jurnalData.counters.tikrarGhaibCount
    }
  ]

  const tambahanSteps: JurnalStep[] = [
    {
      id: 'tafsir',
      name: 'Tafsir',
      description: 'Mempelajari makna ayat',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'bg-emerald-500',
      counter: false
    },
    {
      id: 'menulis',
      name: 'Menulis',
      description: 'Latih menulis ayat (area menulis dihapus)',
      icon: <Edit className="h-5 w-5" />,
      color: 'bg-pink-500',
      counter: false
    }
  ]

  useEffect(() => {
    // Load saved progress
    const savedData = localStorage.getItem('mti-jurnal-today')
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setJurnalData(prev => ({ ...prev, ...parsed }))
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const toggleStep = (stepId: string) => {
    if (stepId === 'tasmiRecord' && !jurnalData.completedSteps[stepId]) {
      // Start recording
      handleRecording()
    } else if (stepId === 'simakMurattal') {
      // Toggle audio playback
      setIsPlayingAudio(!isPlayingAudio)
    }

    setJurnalData(prev => ({
      ...prev,
      completedSteps: {
        ...prev.completedSteps,
        [stepId]: !prev.completedSteps[stepId]
      }
    }))
  }

  const incrementCounter = (stepId: string, maxCount?: number) => {
    const counterKey = stepId === 'murajaah' ? 'murajaahCount' :
                      stepId === 'simakMurattal' ? 'simakCount' :
                      stepId === 'tasmiRecord' ? 'recordingCount' :
                      stepId === 'tikrarBiAlGhaib' ? 'tikrarGhaibCount' : null

    if (!counterKey) return

    setJurnalData(prev => ({
      ...prev,
      counters: {
        ...prev.counters,
        [counterKey]: Math.min((prev.counters[counterKey] || 0) + 1, maxCount || 999)
      }
    }))
  }

  const decrementCounter = (stepId: string) => {
    const counterKey = stepId === 'murajaah' ? 'murajaahCount' :
                      stepId === 'simakMurattal' ? 'simakCount' :
                      stepId === 'tasmiRecord' ? 'recordingCount' :
                      stepId === 'tikrarBiAlGhaib' ? 'tikrarGhaibCount' : null

    if (!counterKey) return

    setJurnalData(prev => ({
      ...prev,
      counters: {
        ...prev.counters,
        [counterKey]: Math.max((prev.counters[counterKey] || 0) - 1, 0)
      }
    }))
  }

  const handleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      setRecordingTimer(0)
      incrementCounter('tasmiRecord', 3)
    } else {
      setIsRecording(true)
      setRecordingTimer(0)
    }
  }

  const saveProgress = () => {
    localStorage.setItem('mti-jurnal-today', JSON.stringify(jurnalData))
  }

  const resetJurnal = () => {
    setJurnalData({
      completedSteps: {
        rabth: false,
        murajaah: false,
        simakMurattal: false,
        tikrarBiAnNadzar: false,
        tasmiRecord: false,
        simakRecord: false,
        tikrarBiAlGhaib: false,
        tafsir: false,
        menulis: false
      },
      counters: {
        murajaahCount: 0,
        simakCount: 0,
        recordingCount: 0,
        tikrarGhaibCount: 0
      },
      recordingTime: 0
    })
  }

  const isAllRequiredCompleted = jurnalSteps.every(step =>
    step.counter ?
      (jurnalData.counters[step.id.replace('murajaah', 'murajaahCount')
                                   .replace('simakMurattal', 'simakCount')
                                   .replace('tasmiRecord', 'recordingCount')
                                   .replace('tikrarBiAlGhaib', 'tikrarGhaibCount')] || 0) >= (step.minCount || 0) :
      jurnalData.completedSteps[step.id]
  )

  const completedCount = jurnalSteps.filter(step =>
    step.counter ?
      (jurnalData.counters[step.id.replace('murajaah', 'murajaahCount')
                                   .replace('simakMurattal', 'simakCount')
                                   .replace('tasmiRecord', 'recordingCount')
                                   .replace('tikrarBiAlGhaib', 'tikrarGhaibCount')] || 0) >= (step.minCount || 0) :
      jurnalData.completedSteps[step.id]
  ).length

  useEffect(() => {
    saveProgress()
  }, [jurnalData])

  return (
    <AuthenticatedLayout title="Jurnal Harian">
      <div className="space-y-6 animate-fadeInUp">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-army">Jurnal Harian</h1>
          <p className="text-gray-600 mt-1">Lacak aktivitas hafalan Anda hari ini</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <div className="text-right">
            <p className="text-sm text-gray-500">Progress</p>
            <p className="text-xl font-bold text-green-army">{completedCount}/{jurnalSteps.length}</p>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="transform -rotate-90 w-16 h-16">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(completedCount / jurnalSteps.length) * 176} 176`}
                className="text-green-army transition-all duration-300"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-green-army" />
            <span>Progress Kurikulum Wajib</span>
          </CardTitle>
          <CardDescription>
            7 Tahap Kurikulum Wajib - {isAllRequiredCompleted ? '✅ Selesai!' : `${completedCount}/${jurnalSteps.length} selesai`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jurnalSteps.map((step) => {
              const isCompleted = step.counter ?
                (jurnalData.counters[step.id.replace('murajaah', 'murajaahCount')
                                         .replace('simakMurattal', 'simakCount')
                                         .replace('tasmiRecord', 'recordingCount')
                                         .replace('tikrarBiAlGhaib', 'tikrarGhaibCount')] || 0) >= (step.minCount || 0) :
                jurnalData.completedSteps[step.id]

              const currentCount = step.counter ?
                (jurnalData.counters[step.id.replace('murajaah', 'murajaahCount')
                                         .replace('simakMurattal', 'simakCount')
                                         .replace('tasmiRecord', 'recordingCount')
                                         .replace('tikrarBiAlGhaib', 'tikrarGhaibCount')] || 0) : 0

              return (
                <div
                  key={step.id}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-300",
                    isCompleted
                      ? "bg-green-50 border-green-300"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={cn("p-2 rounded-lg text-white", step.color)}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{step.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                        {step.counter && (
                          <div className="flex items-center space-x-2 mt-3">
                            <button
                              onClick={() => decrementCounter(step.id)}
                              className="p-1 rounded hover:bg-gray-100"
                            >
                              <Circle className="h-4 w-4" />
                            </button>
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: step.minCount || 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center",
                                    i < currentCount
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-200"
                                  )}
                                >
                                  {i < currentCount && (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => incrementCounter(step.id, step.minCount)}
                              className="p-1 rounded hover:bg-gray-100"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-medium text-gray-700">
                              {currentCount}/{step.minCount}
                            </span>
                          </div>
                        )}

                        {step.id === 'tasmiRecord' && isRecording && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm font-medium text-red-700">
                                Recording... {Math.floor(recordingTimer / 60)}:{(recordingTimer % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                            <Button
                              onClick={handleRecording}
                              size="sm"
                              variant="destructive"
                              className="mt-2"
                            >
                              <Square className="h-4 w-4 mr-1" />
                              Stop Recording
                            </Button>
                          </div>
                        )}

                        {step.id === 'simakMurattal' && isPlayingAudio && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-medium text-blue-700">
                                Sedang memutar murattal...
                              </span>
                            </div>
                            <Button
                              onClick={() => setIsPlayingAudio(false)}
                              size="sm"
                              variant="outline"
                              className="mt-2"
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {!step.counter && (
                      <Button
                        onClick={() => toggleStep(step.id)}
                        variant={isCompleted ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          isCompleted && "bg-green-500 hover:bg-green-600"
                        )}
                      >
                        {step.id === 'tasmiRecord' && isRecording ? (
                          <Square className="h-4 w-4" />
                        ) : isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Additional Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Kurikulum Tambahan (Pilihan)</CardTitle>
          <CardDescription>
            Tahap opsional untuk mendalami pemahaman
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tambahanSteps.map((step) => {
              const isCompleted = jurnalData.completedSteps[step.id]

              return (
                <div
                  key={step.id}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-300",
                    isCompleted
                      ? "bg-green-50 border-green-300"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn("p-2 rounded-lg text-white", step.color)}>
                        {step.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{step.name}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => toggleStep(step.id)}
                      variant={isCompleted ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        isCompleted && "bg-green-500 hover:bg-green-600"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={resetJurnal}
          variant="outline"
          className="flex-1"
        >
          Reset Jurnal
        </Button>
        <Link href="/dashboard" className="flex-1">
          <Button variant="outline" className="w-full">
            Kembali ke Dashboard
          </Button>
        </Link>
        <Button
          className="flex-1 bg-green-army hover:bg-green-700"
          disabled={!isAllRequiredCompleted}
        >
          {isAllRequiredCompleted ? '✅ Jurnal Selesai' : 'Lanjutkan Jurnal'}
        </Button>
      </div>
    </div>
    </AuthenticatedLayout>
  )
}