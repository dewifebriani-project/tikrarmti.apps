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
  totalErrors?: number
  onBackToStatus: () => void
}

function getRatingDetails(errors: number) {
  if (errors === 0) {
    return {
      stars: 5,
      rank: 'Mumtaz Sempurna',
      motivation: 'Maa syaa Allah, luar biasa! Bacaan sangat lancar dan sempurna tanpa cela. Pertahankan terus kualitas hafalanmu! 🌟',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  } else if (errors === 1) {
    return {
      stars: 4,
      rank: 'Mumtaz',
      motivation: 'Maa syaa Allah, sangat baik! Hanya ada 1 kesalahan kecil. Sedikit lagi menuju sempurna! ✨',
      color: 'bg-teal-50 text-teal-700 border-teal-200'
    }
  } else if (errors <= 3) {
    return {
      stars: 3,
      rank: 'Jayyid Jiddan',
      motivation: "Barakallahu fiiki, pencapaian yang bagus! Bacaan sudah lancar dengan sedikit perbaikan. Tetap semangat muraja'ah! 💪",
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    }
  } else if (errors <= 5) {
    return {
      stars: 2,
      rank: 'Jayyid',
      motivation: 'Alhamdulillah, sudah cukup baik! Ada beberapa catatan tajwid yang perlu diperhatikan. Semangat memperbaiki di pekan berikutnya! ❤️',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    }
  } else {
    return {
      stars: 1,
      rank: 'Maqbul',
      motivation: 'Alhamdulillah, teruslah berjuang! Masih banyak catatan tajwid yang harus dipelajari lagi. Jangan berkecil hati, mari latihan lebih giat! 🔥',
      color: 'bg-rose-50 text-rose-700 border-rose-200'
    }
  }
}

export function TashihSuccessState({
  weekNumber,
  juzName,
  completedCount,
  totalBlocks,
  teacherName,
  juzCode,
  totalErrors = 0,
  onBackToStatus
}: TashihSuccessStateProps) {
  const details = getRatingDetails(totalErrors)

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
      <p className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-widest">
        Tashih Pekan {weekNumber} Selesai
      </p>

      {/* Motivational & Description Text */}
      <p className="text-xs text-gray-600 max-w-xs mb-6 px-4 leading-relaxed font-medium">
        "{details.motivation}"
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
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Peringkat</p>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border w-fit ${details.color}`}>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star 
                    key={idx} 
                    className={`w-2.5 h-2.5 ${idx < details.stars ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">{details.rank}</span>
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
