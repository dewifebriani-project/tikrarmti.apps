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

export function QuestionStats({ statistics }: QuestionStatsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-4 text-blue-600" />
        Statistik Soal per Juz & Tipe
      </h3>
      <div className="space-y-4">
        {Object.keys(statistics).length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada data soal</p>
        ) : (
          Object.entries(statistics).map(([juz, sections]) => (
            <div key={juz} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{juz}</h4>
                <span className="text-sm text-gray-600">
                  Total: {Object.values(sections).reduce((a, b) => a + b, 0)} soal
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(sections)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([sectionNum, count]) => (
                    <div
                      key={sectionNum}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {SECTION_NAMES[parseInt(sectionNum)] || `Section ${sectionNum}`}
                      </div>
                      <div className="text-xl font-bold text-blue-600">{count}</div>
                      <div className="text-xs text-gray-400">soal</div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
