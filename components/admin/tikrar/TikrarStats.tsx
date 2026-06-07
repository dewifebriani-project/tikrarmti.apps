'use client';

import { Award, Clock, CheckCircle, XCircle } from 'lucide-react';
import { TikrarStatsData } from './types';

import { cn } from '@/lib/utils';

export type TikrarStatFilterType = 'all' | 'pending' | 'approved' | 'rejected';

interface TikrarStatsProps {
  stats: TikrarStatsData | null;
  isLoading: boolean;
  onCardClick?: (filter: TikrarStatFilterType) => void;
  activeFilter?: TikrarStatFilterType;
}

export function TikrarStats({ stats, isLoading, onCardClick, activeFilter }: TikrarStatsProps) {
  const safeStats = stats || {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  };

  const cards = [
    {
      id: 'all' as TikrarStatFilterType,
      label: 'Total Pendaftar',
      value: safeStats.total,
      icon: Award,
      color: 'bg-blue-500 shadow-blue-200',
      activeRing: 'ring-2 ring-blue-500',
    },
    {
      id: 'pending' as TikrarStatFilterType,
      label: 'Menunggu Review',
      value: safeStats.pending,
      icon: Clock,
      color: 'bg-amber-500 shadow-amber-200',
      activeRing: 'ring-2 ring-amber-500',
    },
    {
      id: 'approved' as TikrarStatFilterType,
      label: 'Pendaftaran Disetujui',
      value: safeStats.approved,
      icon: CheckCircle,
      color: 'bg-emerald-500 shadow-emerald-200',
      activeRing: 'ring-2 ring-emerald-500',
    },
    {
      id: 'rejected' as TikrarStatFilterType,
      label: 'Pendaftaran Ditolak',
      value: safeStats.rejected,
      icon: XCircle,
      color: 'bg-red-500 shadow-red-200',
      activeRing: 'ring-2 ring-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        return (
          <div
            key={card.id}
            onClick={() => onCardClick?.(card.id)}
            className={cn(
              "bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer group active:scale-95",
              isActive && card.activeRing
            )}
          >
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-500 tracking-tight group-hover:text-gray-900 transition-colors">
                {card.label}
              </p>
              {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                  {card.value.toLocaleString()}
                </h3>
              )}
            </div>
            <div className={cn(
              "p-3 sm:p-4 rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
              card.color
            )}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
