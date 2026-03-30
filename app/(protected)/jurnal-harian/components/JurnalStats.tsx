'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Calendar, AlertCircle, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JurnalStatsProps {
  weekNumber: number;
  completedBlocks: number;
  totalBlocksInWeek: number;
  records: any[];
  isLoading?: boolean;
}

export function JurnalStats({
  weekNumber,
  completedBlocks,
  totalBlocksInWeek = 4,
  records,
  isLoading = false
}: {
  weekNumber: number;
  completedBlocks: number;
  totalBlocksInWeek?: number;
  records: any[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="h-24 bg-gray-200 animate-pulse rounded-2xl"></div>
        <div className="h-24 bg-gray-200 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  const isWeekDone = completedBlocks >= totalBlocksInWeek;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Weekly Progress Card */}
      <Card className={cn(
        "border-2 transition-all duration-500 rounded-3xl overflow-hidden",
        isWeekDone 
          ? "border-emerald-500/30 bg-emerald-50/50" 
          : "border-blue-500/30 bg-blue-50/50"
      )}>
        <CardContent className="p-5 flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
            isWeekDone ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
          )}>
            {isWeekDone ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          <div className="flex-1">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">Progress Pekan {weekNumber}</h3>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                  isWeekDone ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                )}>
                  {isWeekDone ? 'Selesai' : 'Aktif'}
                </span>
             </div>
             <p className="text-xl font-black text-gray-900">{completedBlocks} / {totalBlocksInWeek} <span className="text-sm font-normal text-gray-500">Blok Terisi</span></p>
             <div className="mt-2 w-full bg-gray-200/50 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000 ease-out",
                    isWeekDone ? "bg-emerald-500" : "bg-blue-500"
                  )}
                  style={{ width: `${(completedBlocks / totalBlocksInWeek) * 100}%` }}
                />
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Summary Card */}
      <Card className="border-2 border-indigo-500/30 bg-indigo-50/50 rounded-3xl overflow-hidden shadow-sm">
        <CardContent className="p-5 flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg">
              <Bookmark className="w-6 h-6" />
           </div>
           <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-800">Target Hafalan</h3>
              <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                {isWeekDone 
                  ? 'Maasya Allah! Pekan ini tuntas. Lanjutkan murajaah untuk menjaga mutqin hafalan Ukhti.'
                  : `Kurang ${totalBlocksInWeek - completedBlocks} blok lagi untuk menyelesaikan target pekan ini.`
                }
              </p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
