import { GraduationCap, Users, UserCheck, UserX } from 'lucide-react';
import { MuallimahV2StatsData } from './types';
import { cn } from '@/lib/utils';

export type MuallimahStatFilterType = 'all' | 'pending' | 'approved' | 'rejected';

interface MuallimahV2StatsProps {
  stats: MuallimahV2StatsData | null;
  isLoading: boolean;
  onCardClick?: (filter: MuallimahStatFilterType) => void;
  activeFilter?: MuallimahStatFilterType;
}

export function MuallimahV2Stats({ stats, isLoading, onCardClick, activeFilter }: MuallimahV2StatsProps) {
  const safeStats = stats || {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  };

  const cards = [
    { 
      id: 'all' as MuallimahStatFilterType,
      label: 'Total Muallimah', 
      value: safeStats.total, 
      icon: GraduationCap, 
      color: 'bg-blue-500 shadow-blue-200',
      activeRing: 'ring-2 ring-blue-500',
    },
    { 
      id: 'pending' as MuallimahStatFilterType,
      label: 'Menunggu Review', 
      value: safeStats.pending, 
      icon: Users, 
      color: 'bg-amber-500 shadow-amber-200',
      activeRing: 'ring-2 ring-amber-500',
    },
    { 
      id: 'approved' as MuallimahStatFilterType,
      label: 'Disetujui', 
      value: safeStats.approved, 
      icon: UserCheck, 
      color: 'bg-emerald-500 shadow-emerald-200',
      activeRing: 'ring-2 ring-emerald-500',
    },
    { 
      id: 'rejected' as MuallimahStatFilterType,
      label: 'Ditolak', 
      value: safeStats.rejected, 
      icon: UserX, 
      color: 'bg-red-500 shadow-red-200',
      activeRing: 'ring-2 ring-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isActive = activeFilter === card.id;
        return (
          <button
            key={card.id}
            onClick={() => onCardClick?.(card.id)}
            className={cn(
              "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-all w-full text-left",
              isActive ? card.activeRing : "hover:border-gray-300 hover:shadow-md",
              "focus:outline-none focus:ring-offset-2"
            )}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-black text-gray-900">{card.value || 0}</p>
              )}
            </div>
            <div className={cn("p-4 rounded-xl text-white shadow-lg", card.color)}>
              <card.icon className="h-6 w-6" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
