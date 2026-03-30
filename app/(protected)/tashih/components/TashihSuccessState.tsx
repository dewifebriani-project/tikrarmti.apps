'use client'

import React from 'react'
import { CheckCircle, PartyPopper, BookOpen, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface TashihSuccessStateProps {
  weekNumber: number
  juzName?: string
  completedCount: number
  totalBlocks: number
  teacherName?: string | null
  juzCode: string
  onBackToStatus: () => void
}

export function TashihSuccessState({
  weekNumber,
  juzName,
  completedCount,
  totalBlocks,
  teacherName,
  juzCode,
  onBackToStatus
}: TashihSuccessStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-fadeInUp text-center">
      {/* Celebration Icon - Styled with Green/Gold */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-xl animate-bounce">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <PartyPopper className="absolute -top-3 -right-3 w-6 h-6 text-amber-500 animate-pulse" />
        <Star className="absolute -bottom-2 -left-3 w-5 h-5 text-yellow-400 animate-pulse" />
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Barakallahu Fiiki!</h1>
      <p className="text-[10px] uppercase font-bold text-gray-400 mb-6 tracking-widest">
        Tashih Pekan {weekNumber} Selesai
      </p>

      {/* Summary Card - Compact */}
      <Card className="w-full max-w-sm glass-premium border-none shadow-xl rounded-3xl p-5 mb-6 text-left space-y-3">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Target Hafalan</p>
            <p className="text-xs font-bold text-gray-900 leading-tight">{juzName || juzCode}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Progres</p>
            <p className="text-xs font-bold text-green-700">{completedCount}/{totalBlocks} Blok Lunas</p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Peringkat</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full w-fit">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span className="text-[8px] font-black uppercase tracking-widest">Mumtaz</span>
            </div>
          </div>
        </div>

        {teacherName && (
          <div className="pt-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Ustadzah</p>
            <p className="text-xs font-bold text-gray-900">{teacherName}</p>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex flex-col w-full max-w-xs gap-3">
        <Button
          onClick={onBackToStatus}
          className="h-12 rounded-2xl bg-green-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-800"
        >
          Lihat Status Lainnya
        </Button>
        <Link href="/dashboard" className="w-full">
          <Button
            variant="ghost"
            className="w-full h-10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900"
          >
            Selesai
          </Button>
        </Link>
      </div>
    </div>
  )
}
