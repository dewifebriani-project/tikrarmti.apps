'use client'

import React, { useState } from 'react'
import { CheckCircle, MapPin, School, AlertCircle, Calendar, ChevronDown, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface JurnalBlock {
  block_code: string
  week_number: number
  is_completed: boolean
  jurnal_date?: string
}

interface JurnalStatusGridProps {
  blocks: JurnalBlock[]
  currentWeekNumber: number
  onBlockClick: (blockCode: string, weekNumber: number) => void
  isAdminPreview?: boolean
}

export function JurnalStatusGrid({ blocks, currentWeekNumber, onBlockClick, isAdminPreview }: JurnalStatusGridProps) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(currentWeekNumber)

  // Group blocks by week_number
  const blocksByWeek = new Map<number, JurnalBlock[]>()
  blocks.forEach(block => {
    const weekNum = block.week_number
    if (!blocksByWeek.has(weekNum)) {
      blocksByWeek.set(weekNum, [])
    }
    blocksByWeek.get(weekNum)!.push(block)
  })

  // Sort weeks
  const sortedWeeks = Array.from(blocksByWeek.keys()).sort((a, b) => a - b)

  return (
    <div className="space-y-3 animate-fadeInUp">
      {isAdminPreview && (
        <div className="p-3 bg-emerald-50/50 backdrop-blur-sm border border-emerald-100 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-emerald-600" />
          <div className="text-[10px] text-emerald-900 font-bold uppercase tracking-tight">
            Pratinjau Admin: Juz 30A
          </div>
        </div>
      )}

      {/* COMPACT: One Card Per Week with Inner Blocks */}
      <div className="flex flex-col gap-2">
        {sortedWeeks.map(weekNum => {
          const weekBlocks = blocksByWeek.get(weekNum)!
          const completedInWeek = weekBlocks.filter(b => b.is_completed).length
          const isFullyCompleted = completedInWeek === weekBlocks.length && weekBlocks.length > 0
          const isExpanded = expandedWeek === weekNum

          return (
            <div key={weekNum} className="space-y-2">
              <button
                onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                className="w-full text-left transition-all active:scale-[0.98]"
              >
                <Card className={cn(
                  "overflow-hidden border-none shadow-sm flex items-center justify-between p-3 rounded-2xl transition-all duration-300",
                  isFullyCompleted 
                    ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-green-600/10" 
                    : isExpanded 
                      ? "bg-white border-green-200 shadow-lg scale-[1.02]" 
                      : "bg-white border-green-50 text-gray-900 hover:border-green-200"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm",
                      isFullyCompleted ? "bg-white/20 text-white" : "bg-green-900 text-white"
                    )}>
                      {weekNum}
                    </div>
                    <div>
                      <h3 className={cn("text-xs font-bold leading-none mb-1", isFullyCompleted ? "text-white" : "text-gray-900")}>
                        Pekan {weekNum}
                      </h3>
                      <p className={cn("text-[8px] font-black uppercase tracking-tighter", isFullyCompleted ? "text-green-100/60" : "text-gray-500")}>
                        {completedInWeek}/{weekBlocks.length} Blok Selesai
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isFullyCompleted ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <ChevronDown className={cn("w-4 h-4 text-green-600 transition-transform", isExpanded && "rotate-180")} />
                    )}
                  </div>
                </Card>
              </button>

              {/* Individual Block Selector (Unlocked by clicking Week) */}
              {isExpanded && (
                <div className="grid grid-cols-4 gap-2 px-1 animate-fadeInDown">
                  {weekBlocks.map(block => (
                    <button
                      key={block.block_code}
                      onClick={() => onBlockClick(block.block_code, weekNum)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-300 min-h-[52px]",
                        block.is_completed
                          ? "bg-green-100 border-green-200 text-green-700"
                          : "bg-white border-green-50 text-gray-700 hover:border-green-500 hover:bg-green-50"
                      )}
                    >
                      <span className="text-[9px] font-black tracking-tight">{block.block_code}</span>
                      {block.is_completed ? (
                        <CheckCircle className="w-3 h-3 mt-0.5" />
                      ) : (
                        <div className="w-3 h-3 mt-0.5 border-2 border-green-200 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Simple Legend */}
      <div className="flex justify-center gap-4 pt-4 text-[8px] font-black text-gray-600 uppercase tracking-tighter">
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500" /><span>Sudah Diisi</span></div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-white border border-green-200" /><span>Perlu Diisi</span></div>
      </div>
    </div>
  )
}
