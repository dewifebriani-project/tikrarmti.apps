import { GraduationCap, Users, UserCheck, UserX } from 'lucide-react';
import { MuallimahV2StatsData } from './types';

export function MuallimahV2Stats({ stats, isLoading }: { stats: MuallimahV2StatsData | null, isLoading: boolean }) {
  const cards = [
    { label: 'Total Muallimah', value: stats?.total, icon: GraduationCap, color: 'bg-blue-500' },
    { label: 'Menunggu Review', value: stats?.pending, icon: Users, color: 'bg-orange-500' },
    { label: 'Disetujui', value: stats?.approved, icon: UserCheck, color: 'bg-emerald-500' },
    { label: 'Ditolak', value: stats?.rejected, icon: UserX, color: 'bg-red-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-black text-gray-900">{card.value || 0}</p>
            )}
          </div>
          <div className={`p-4 rounded-xl text-white ${card.color} shadow-lg`}>
            <card.icon className="h-6 w-6" />
          </div>
        </div>
      ))}
    </div>
  );
}
