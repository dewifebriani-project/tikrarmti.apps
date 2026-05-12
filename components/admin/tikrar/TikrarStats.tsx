'use client';

import { Award, Clock, CheckCircle, XCircle } from 'lucide-react';
import { TikrarStatsData } from './types';

export type TikrarStatFilterType = 'all' | 'pending' | 'approved' | 'rejected';

interface TikrarStatsProps {
  stats: TikrarStatsData;
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
      icon: <Award className="h-6 w-6 text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      hoverBg: 'hover:bg-blue-100/50',
      activeRing: 'ring-2 ring-blue-500',
    },
    {
      id: 'pending' as TikrarStatFilterType,
      label: 'Menunggu Review',
      value: safeStats.pending,
      icon: <Clock className="h-6 w-6 text-amber-600" />,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      hoverBg: 'hover:bg-amber-100/50',
      activeRing: 'ring-2 ring-amber-500',
    },
    {
      id: 'approved' as TikrarStatFilterType,
      label: 'Pendaftaran Disetujui',
      value: safeStats.approved,
      icon: <CheckCircle className="h-6 w-6 text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      hoverBg: 'hover:bg-emerald-100/50',
      activeRing: 'ring-2 ring-emerald-500',
    },
    {
      id: 'rejected' as TikrarStatFilterType,
      label: 'Pendaftaran Ditolak',
      value: safeStats.rejected,
      icon: <XCircle className="h-6 w-6 text-red-600" />,
      bg: 'bg-red-50',
      border: 'border-red-100',
      hoverBg: 'hover:bg-red-100/50',
      activeRing: 'ring-2 ring-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.id}
          onClick={() => onCardClick?.(card.id)}
          className={`p-6 rounded-2xl border ${card.border} ${card.bg} ${card.hoverBg} transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer group active:scale-95 ${activeFilter === card.id ? card.activeRing : ''}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100/50 group-hover:scale-110 transition-transform duration-300">
              {card.icon}
            </div>
            {isLoading ? (
              <div className="h-4 w-12 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-gray-600 transition-colors">Tikrar Stats</span>
            )}
          </div>
          <div className="space-y-1">
            {isLoading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <h3 className="text-3xl font-black text-gray-900 tracking-tight">{card.value.toLocaleString()}</h3>
            )}
            <p className="text-sm font-bold text-gray-600 tracking-tight group-hover:text-gray-900 transition-colors">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
