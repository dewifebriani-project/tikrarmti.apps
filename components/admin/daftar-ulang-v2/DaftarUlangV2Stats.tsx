import { Users, FileText, Clock, CheckCircle, X, FolderTree } from 'lucide-react';
import { DaftarUlangStatsData } from './types';

export function DaftarUlangV2Stats({ stats, isLoading }: { stats: DaftarUlangStatsData | null, isLoading: boolean }) {
  const cards = [
    { label: 'Total', value: stats?.total, icon: Users, color: 'bg-blue-500' },
    { label: 'Draft', value: stats?.draft, icon: FileText, color: 'bg-gray-500' },
    { label: 'Submitted', value: stats?.submitted, icon: Clock, color: 'bg-indigo-500' },
    { label: 'Approved', value: stats?.approved, icon: CheckCircle, color: 'bg-emerald-500' },
    { label: 'Rejected', value: stats?.rejected, icon: X, color: 'bg-red-500' },
    { label: 'Pilih Halaqah', value: stats?.withHalaqah, icon: FolderTree, color: 'bg-purple-500' },
    { label: 'Upload Akad', value: stats?.withAkad, icon: FileText, color: 'bg-amber-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95 group">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-500 tracking-tight group-hover:text-gray-900 transition-colors">{card.label}</p>
            {isLoading ? (
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{card.value || 0}</h3>
            )}
          </div>
          <div className={`p-2.5 rounded-xl text-white ${card.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
            <card.icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
      ))}
      
      {/* Per Juz */}
      <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm col-span-2 md:col-span-4 lg:col-span-7 mt-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Sebaran Juz</p>
        <div className="flex flex-wrap gap-2">
          {isLoading ? (
            <p className="text-gray-400 text-xs">Loading...</p>
          ) : stats && Object.keys(stats.juzCount).length > 0 ? (
            Object.entries(stats.juzCount).sort(([a], [b]) => a.localeCompare(b)).map(([juz, count]) => (
              <div key={juz} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs">
                <span className="text-gray-500">Juz {juz}:</span>
                <span className="font-extrabold text-gray-900">{count}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-xs">Belum ada data</p>
          )}
        </div>
      </div>
    </div>
  );
}
