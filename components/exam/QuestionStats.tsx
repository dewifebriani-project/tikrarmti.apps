'use client';

import { BarChart3 } from 'lucide-react';

interface QuestionStatsProps {
  statistics: Record<string, Record<number, number>>;
}

const SECTION_NAMES: Record<number, string> = {
  1: 'Tebak Nama Surat',
  2: 'Tebak Ayat',
  3: 'Sambung Surat',
  4: 'Tebak Awal Ayat',
  5: 'Ayat Mutasyabihat',
  6: 'Pengenalan Surat',
  7: 'Tebak Halaman',
  8: 'Lainnya',
};

const getJuzColors = (juz: string) => {
  const name = juz.toLowerCase();
  if (name.includes('30')) {
    return {
      bg: 'bg-emerald-50/30',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
      hoverBg: 'hover:bg-emerald-50/50',
      badge: 'bg-emerald-55 bg-emerald-100 text-emerald-800 border border-emerald-200'
    };
  }
  if (name.includes('29')) {
    return {
      bg: 'bg-blue-50/30',
      border: 'border-blue-100',
      text: 'text-blue-600',
      hoverBg: 'hover:bg-blue-100/50',
      badge: 'bg-blue-55 bg-blue-100 text-blue-800 border border-blue-200'
    };
  }
  if (name.includes('28')) {
    return {
      bg: 'bg-purple-50/30',
      border: 'border-purple-100',
      text: 'text-purple-600',
      hoverBg: 'hover:bg-purple-100/50',
      badge: 'bg-purple-55 bg-purple-100 text-purple-800 border border-purple-200'
    };
  }
  return {
    bg: 'bg-amber-50/30',
    border: 'border-amber-100',
    text: 'text-amber-600',
    hoverBg: 'hover:bg-amber-100/50',
    badge: 'bg-amber-55 bg-amber-100 text-amber-800 border border-amber-200'
  };
};

export function QuestionStats({ statistics }: QuestionStatsProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl shadow-gray-100/30">
      <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-green-700 animate-pulse" />
        </div>
        Statistik Soal per Juz & Tipe
      </h3>
      <div className="space-y-6">
        {Object.keys(statistics).length === 0 ? (
          <p className="text-gray-400 font-bold text-center py-6 text-sm">Belum ada data soal</p>
        ) : (
          Object.entries(statistics).map(([juz, sections]) => {
            const colors = getJuzColors(juz);
            return (
              <div key={juz} className="border border-gray-100 rounded-3xl p-5 bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">{juz}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                    Total: {Object.values(sections).reduce((a, b) => a + b, 0)} Soal
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(sections)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([sectionNum, count]) => (
                      <div
                        key={sectionNum}
                        className={`rounded-2xl border p-4 transition-all duration-300 hover:shadow-sm ${colors.border} ${colors.bg} ${colors.hoverBg} group`}
                      >
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 line-clamp-1 group-hover:text-gray-600 transition-colors">
                          {SECTION_NAMES[parseInt(sectionNum)] || `Seksi ${sectionNum}`}
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-2">
                          <span className={`text-2xl font-black tracking-tight ${colors.text}`}>{count}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">soal</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
