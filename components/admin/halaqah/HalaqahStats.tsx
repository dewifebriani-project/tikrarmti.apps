import { BookOpen, Users, UserCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HalaqahStatsData {
  total: number;
  active: number;
  muallimah: number;
  capacity: number;
  used: number;
}

interface HalaqahStatsProps {
  stats: HalaqahStatsData | null;
  isLoading: boolean;
}

export function HalaqahStats({ stats, isLoading }: HalaqahStatsProps) {
  const safeStats = stats || {
    total: 0,
    active: 0,
    muallimah: 0,
    capacity: 0,
    used: 0
  };

  const cards = [
    {
      id: 'total',
      label: 'Total Halaqah',
      value: safeStats.total,
      icon: BookOpen,
      color: 'bg-blue-500 shadow-blue-200',
    },
    {
      id: 'active',
      label: 'Halaqah Aktif',
      value: safeStats.active,
      icon: Activity,
      color: 'bg-emerald-500 shadow-emerald-200',
    },
    {
      id: 'muallimah',
      label: 'Total Muallimah',
      value: safeStats.muallimah,
      icon: UserCheck,
      color: 'bg-purple-500 shadow-purple-200',
    },
    {
      id: 'capacity',
      label: 'Kapasitas Thalibah',
      value: `${safeStats.used} / ${safeStats.capacity}`,
      icon: Users,
      color: 'bg-amber-500 shadow-amber-200',
    },
  ];

  return (
    <div className="flex overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 snap-x snap-mandatory scrollbar-none">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 group flex-shrink-0 w-[78vw] sm:w-auto snap-start"
          >
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-500 tracking-tight group-hover:text-gray-900 transition-colors">
                {card.label}
              </p>
              {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                  {card.value}
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
