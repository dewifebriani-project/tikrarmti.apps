'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface JurnalWeekNavProps {
  displayedWeekNumber: number;
  currentWeekNumber: number;
  onPrevious: () => void;
  onNext: () => void;
  weekRange: { start: string, end: string };
}

export function JurnalWeekNav({
  displayedWeekNumber,
  currentWeekNumber,
  onPrevious,
  onNext,
  weekRange
}: JurnalWeekNavProps) {
  const isFirstWeek = displayedWeekNumber <= 1;
  const isCurrentOrFutureWeek = displayedWeekNumber >= currentWeekNumber;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/70 backdrop-blur-xl border border-white rounded-3xl shadow-xl space-y-3 mb-6 relative overflow-hidden group">
      {/* Subtle Background Icon */}
      <Calendar className="absolute -right-4 -top-4 w-24 h-24 text-green-900/5 rotate-12 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" />

      <div className="flex items-center justify-between w-full relative z-10">
        <button
          onClick={onPrevious}
          disabled={isFirstWeek}
          className={cn(
            "p-3 rounded-2xl transition-all duration-300",
            isFirstWeek 
              ? "text-gray-300 bg-gray-50/50 cursor-not-allowed" 
              : "text-green-900 bg-green-50 hover:bg-green-100 hover:scale-110 active:scale-95 shadow-sm"
          )}
          title="Pekan Sebelumnya"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center px-4">
          <div className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
            displayedWeekNumber === currentWeekNumber ? "text-green-700" : "text-gray-400"
          )}>
            Monitoring Pekan
          </div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">
            Pekan {displayedWeekNumber}
            {displayedWeekNumber === currentWeekNumber && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-green-900 text-white animate-pulse">
                Pekan Ini
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            {weekRange.start} — {weekRange.end}
          </p>
        </div>

        <button
          onClick={onNext}
          disabled={isCurrentOrFutureWeek}
          className={cn(
            "p-3 rounded-2xl transition-all duration-300",
            isCurrentOrFutureWeek 
              ? "text-gray-300 bg-gray-50/50 cursor-not-allowed" 
              : "text-green-900 bg-green-50 hover:bg-green-100 hover:scale-110 active:scale-95 shadow-sm"
          )}
          title="Pekan Berikutnya"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
