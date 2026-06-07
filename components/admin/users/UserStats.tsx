'use client';

import { Users, Shield, CheckCircle, Ban } from 'lucide-react';

import { cn } from '@/lib/utils';

export type StatFilterType = 'all' | 'admin' | 'thalibah' | 'blacklisted';
 
interface UserStatsProps {
  stats: {
    totalUsers: number;
    totalAdmins: number;
    totalThalibah: number;
    totalBlacklisted: number;
  };
  isLoading: boolean;
  onCardClick?: (filter: StatFilterType) => void;
  activeFilter?: StatFilterType;
}
 
export function UserStats({ stats, isLoading, onCardClick, activeFilter }: UserStatsProps) {
  const cards = [
    {
      id: 'all' as StatFilterType,
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500 shadow-blue-200',
      activeRing: 'ring-2 ring-blue-500',
    },
    {
      id: 'admin' as StatFilterType,
      label: 'Administrators',
      value: stats.totalAdmins,
      icon: Shield,
      color: 'bg-purple-500 shadow-purple-200',
      activeRing: 'ring-2 ring-purple-500',
    },
    {
      id: 'thalibah' as StatFilterType,
      label: 'Active Thalibah',
      value: stats.totalThalibah,
      icon: CheckCircle,
      color: 'bg-emerald-500 shadow-emerald-200',
      activeRing: 'ring-2 ring-emerald-500',
    },
    {
      id: 'blacklisted' as StatFilterType,
      label: 'Blacklisted',
      value: stats.totalBlacklisted,
      icon: Ban,
      color: 'bg-red-500 shadow-red-200',
      activeRing: 'ring-2 ring-red-500',
    },
  ];
 
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        return (
          <div
            key={card.id}
            onClick={() => onCardClick?.(card.id)}
            className={cn(
              "bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer group active:scale-95",
              isActive && card.activeRing
            )}
          >
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-gray-500 tracking-tight group-hover:text-gray-900 transition-colors">
                {card.label}
              </p>
              {isLoading ? (
                <div className="h-7 sm:h-8 w-16 sm:w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
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
