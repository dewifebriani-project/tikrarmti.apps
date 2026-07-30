'use client';

import { useState } from 'react';
import { Archive, ArchiveRestore, BarChart3, Package, ChevronLeft, ChevronRight } from 'lucide-react';

interface QuestionStatsProps {
  statistics: any[];
  onToggleArchive?: (juz_number: number, question_package: string, current_active: boolean) => void;
  onStatClick?: (juz_number: number, question_package: string, is_active: boolean, section_number?: number) => void;
}

export function QuestionStats({ statistics, onToggleArchive, onStatClick }: QuestionStatsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const totalPages = Math.ceil(statistics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStats = statistics.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/30 overflow-hidden font-sans">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-700 animate-pulse" />
          </div>
          Bank Soal Seleksi
        </h3>
        <p className="text-sm text-gray-500 font-medium mt-2">
          Daftar paket soal yang tersedia dan status pengarsipannya.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Juz</th>
              <th className="px-6 py-4">Tipe Soal</th>
              <th className="px-6 py-4 text-center">Total Soal</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {statistics.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm font-bold text-gray-400">
                  Belum ada data soal
                </td>
              </tr>
            ) : (
              paginatedStats.map((stat, idx) => (
                <tr key={`${stat.juz_number}-${stat.question_package}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="font-black text-gray-900 text-base">Juz {stat.juz_number}{stat.question_package || ''}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    {stat.sections && Object.keys(stat.sections).length > 0 && (
                      <div className="flex flex-col gap-1">
                        {Object.entries(stat.sections).map(([secNum, secData]: [string, any]) => (
                          <button
                            key={secNum}
                            onClick={() => onStatClick?.(stat.juz_number, stat.question_package, stat.is_active, parseInt(secNum))}
                            className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors text-left"
                            title="Filter tipe soal ini"
                          >
                            <span className="text-sm text-gray-600 font-medium group-hover:text-indigo-700 truncate max-w-[200px]">
                              {secData.title}
                            </span>
                            <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600 bg-gray-100 group-hover:bg-indigo-100 px-2 py-0.5 rounded-md min-w-[2rem] text-center ml-4">
                              {secData.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center align-top pt-5">
                    <button 
                      onClick={() => onStatClick?.(stat.juz_number, stat.question_package, stat.is_active)}
                      className="group inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                      title="Klik untuk memfilter tabel berdasarkan paket ini"
                    >
                      <span className="font-black text-gray-700 group-hover:text-indigo-600 transition-colors">{stat.total}</span>
                      <span className="text-xs text-gray-500 font-medium group-hover:text-indigo-400 transition-colors">soal</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center align-top pt-6">
                    {stat.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 font-bold text-xs border border-gray-200">
                        Diarsipkan
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right align-top pt-5">
                    {onToggleArchive && (
                      <button
                        onClick={() => onToggleArchive(stat.juz_number, stat.question_package, stat.is_active)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm ${
                          stat.is_active 
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {stat.is_active ? (
                          <>
                            <Archive className="w-4 h-4" />
                            Arsipkan
                          </>
                        ) : (
                          <>
                            <ArchiveRestore className="w-4 h-4" />
                            Aktifkan
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div className="text-sm text-gray-500 font-medium">
            Menampilkan <span className="font-bold text-gray-900">{startIndex + 1}</span> hingga <span className="font-bold text-gray-900">{Math.min(startIndex + itemsPerPage, statistics.length)}</span> dari <span className="font-bold text-gray-900">{statistics.length}</span> paket
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                    currentPage === i + 1
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
