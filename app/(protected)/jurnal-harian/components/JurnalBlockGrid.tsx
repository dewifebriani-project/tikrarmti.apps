'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JurnalBlockGridProps {
  blocks: any[];
  onBlockClick: (blockCode: string, weekNumber: number) => void;
  isLoading?: boolean;
}

export function JurnalBlockGrid({
  blocks,
  onBlockClick,
  isLoading = false
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-3xl shadow-sm"></div>
        ))}
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50 rounded-3xl">
        <CardContent className="p-12 text-center flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">Blok Belum Tersedia</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              Maaf, blok untuk pekan ini belum dapat diakses oleh Ukhti.
            </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {blocks.map((block) => {
        const isCompleted = block.is_completed;
        const isLocked = block.is_locked; // For future implement: if they haven't finished previous weeks
        
        return (
          <button
            key={block.block_code}
            onClick={() => onBlockClick(block.block_code, block.week_number)}
            disabled={isLocked}
            className={cn(
              "group relative overflow-hidden rounded-3xl p-5 border-2 text-left transition-all duration-300",
              isCompleted 
                ? "bg-emerald-50/30 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-50/50" 
                : "bg-white border-white hover:border-green-900/10 hover:shadow-xl hover:-translate-y-1",
              isLocked && "opacity-50 grayscale cursor-not-allowed border-gray-100"
            )}
          >
            {/* Background Accent */}
            <div className={cn(
              "absolute -right-4 -bottom-4 w-20 h-20 rotate-12 transition-transform duration-500 group-hover:scale-125",
              isCompleted ? "text-emerald-500/5" : "text-green-900/5"
            )}>
              {isCompleted ? <CheckCircle className="w-full h-full" /> : <Clock className="w-full h-full" />}
            </div>

            <div className="relative z-10 flex items-center justify-between">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                      isCompleted ? "bg-emerald-500 text-white" : "bg-green-900/10 text-green-900"
                    )}>
                      {block.block_code}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Lunas
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Blok {block.block_code.replace(/^H\d+/, '')}</h3>
                  <p className="text-xs text-gray-500 font-medium">Halaman {block.start_page}</p>
               </div>

               <div className={cn(
                 "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg",
                 isCompleted ? "bg-emerald-500 text-white" : "bg-green-900 text-white shadow-green-900/20"
               )}>
                 {isLocked ? <Lock className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
               </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isCompleted ? "bg-emerald-500 animate-pulse" : "bg-yellow-400 animate-pulse"
                  )} />
                  <span className="text-[10px] font-bold text-gray-400 lowercase italic tracking-wide">
                    {isCompleted ? 'terisi' : 'belun diisi'}
                  </span>
               </div>
               {block.jurnal_date && (
                 <span className="text-[10px] text-gray-400 font-medium tracking-tight">
                    {new Date(block.jurnal_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                 </span>
               )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
