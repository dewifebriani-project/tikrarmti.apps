'use client'

import React from 'react'
import { CheckCircle, Clock, BookOpen, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface TashihStatsProps {
  summary: {
    total_blocks: number
    completed_blocks: number
    pending_blocks: number
  }
}

export function TashihStats({ summary }: TashihStatsProps) {
  const percentage = Math.round((summary.completed_blocks / summary.total_blocks) * 100) || 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fadeInUp">
      {/* Percentage Card */}
      <Card className="sm:col-span-1 glass-premium border-none shadow-xl flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-20 h-20 flex items-center justify-center mb-2">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-100"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={213.6}
              strokeDashoffset={213.6 - (213.6 * percentage) / 100}
              className="text-green-600 transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-lg font-black text-green-900">{percentage}%</span>
        </div>
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Progress Total</p>
      </Card>

      {/* Stats Detail Cards */}
      <div className="sm:col-span-3 grid grid-cols-3 gap-3">
        <Card className="glass-premium border-none shadow-lg p-4 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-1">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-xl font-black text-gray-900">{summary.total_blocks}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Total</span>
        </Card>

        <Card className="glass-premium border-none shadow-lg p-4 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-xl font-black text-green-700">{summary.completed_blocks}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Selesai</span>
        </Card>

        <Card className="glass-premium border-none shadow-lg p-4 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-xl font-black text-amber-600">{summary.pending_blocks}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Pending</span>
        </Card>
      </div>
    </div>
  )
}
