'use client'

import React from 'react'
import { BookOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JurnalHeaderProps {
  title: string
  subtitle: string
  juzInfo?: {
    juz_number: number
    part: string
    name: string
    start_page: number
    end_page: number
  } | null
  progress?: {
    completed: number
    total: number
  }
}

export function JurnalHeader({ title, subtitle, juzInfo, progress }: JurnalHeaderProps) {
  const percentage = progress ? Math.round((progress.completed / progress.total) * 100) : 0

  return (
    <div className="space-y-3">
      {/* Title & Welcome - Ultra Compact */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            {title}
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h1>
          <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest leading-none mt-1">{subtitle}</p>
        </div>
      </div>

      {/* Slim Integrated Juz & Progress Card */}
      {juzInfo && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-900 to-green-800 p-4 text-white shadow-lg border border-white/10">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <BookOpen className="w-5 h-5 text-green-200" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white tracking-wide truncate">
                  Juz {juzInfo.juz_number} Part {juzInfo.part}
                </h2>
                <p className="text-green-100/60 text-[10px] font-black uppercase tracking-tighter truncate">
                   {juzInfo.name} • Hal. {juzInfo.start_page}-{juzInfo.end_page}
                </p>
              </div>
            </div>

            {/* Compact Progress Indicator */}
            <div className="text-right">
              <div className="text-lg font-black text-white leading-none">{percentage}%</div>
              <div className="text-[8px] font-bold text-green-200/50 uppercase tracking-widest mt-0.5">
                {progress?.completed}/{progress?.total} Blok
              </div>
            </div>
          </div>

          {/* Integrated Slim Progress Bar */}
          <div className="mt-3 relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
             <div 
               className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(251,191,36,0.5)]"
               style={{ width: `${percentage}%` }}
             />
          </div>
          
          {/* Subtle Decorative elements */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-yellow-400/5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-green-400/5 rounded-full blur-2xl" />
        </div>
      )}
    </div>
  )
}
