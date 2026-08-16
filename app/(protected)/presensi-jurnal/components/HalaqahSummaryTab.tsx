import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2, BookOpen, CheckCircle, Users } from 'lucide-react';

interface ThalibahSummary {
  user_id: string;
  full_name: string;
  is_blacklisted: boolean;
  jurnal_count: number;
  tashih_count: number;
  progress_percentage: number;
}

interface HalaqahSummary {
  id: string;
  name: string;
  muallimah_name: string;
  total_thalibah: number;
  avg_progress: number;
  thalibah: ThalibahSummary[];
}

interface HalaqahSummaryTabProps {
  batchId?: string;
}

export function HalaqahSummaryTab({ batchId }: HalaqahSummaryTabProps) {
  const [halaqahs, setHalaqahs] = useState<HalaqahSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [batchId]);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const url = batchId ? `/api/musyrifah/halaqah-summary?batch_id=${batchId}` : '/api/musyrifah/halaqah-summary';
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        // Hanya tampilkan halaqah Tikrar (exclude Pra-Tikrar)
        const tikrarHalaqahs = data.data.halaqahs.filter((h: HalaqahSummary) => 
          h.name.toLowerCase().includes('tikrar') && !h.name.toLowerCase().includes('pra')
        );
        setHalaqahs(tikrarHalaqahs);
      } else {
        setError(data.error?.message || data.message || 'Gagal memuat ringkasan halaqah');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-green-600">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p className="text-sm font-medium animate-pulse">Memuat ringkasan per kelas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-center">
        <p className="text-rose-600 font-medium">{error}</p>
        <button 
          onClick={fetchSummary}
          className="mt-4 px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-sm font-bold hover:bg-rose-200 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (halaqahs.length === 0) {
    return (
      <div className="p-10 bg-white border border-gray-100 rounded-2xl text-center">
        <p className="text-gray-500 font-medium">Belum ada kelas halaqah di angkatan aktif.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {halaqahs.map(h => (
        <div 
          key={h.id} 
          className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
        >
          {/* Header Row */}
          <div 
            onClick={() => toggleExpand(h.id)}
            className="p-5 flex items-center justify-between cursor-pointer group hover:bg-gray-50"
          >
            <div>
              <h3 className="text-lg font-black text-gray-900 group-hover:text-green-700 transition-colors">
                {h.name}
              </h3>
              <p className="text-sm font-medium text-gray-500 mt-1">
                Mu'allimah: <span className="text-gray-700 font-bold">{h.muallimah_name}</span>
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Persentase Kelas
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                  <span className="font-bold">{h.avg_progress}%</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Total Santri
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span className="font-bold">{h.total_thalibah}</span>
                </div>
              </div>
              
              <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                {expandedId === h.id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>

          {/* Expanded Content (Thalibah List) */}
          {expandedId === h.id && (
            <div className="border-t border-gray-100 bg-gray-50/50 p-5">
              {h.thalibah.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">
                  Tidak ada santri aktif di kelas ini.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    <div className="col-span-5">Nama Thalibah</div>
                    <div className="col-span-2 text-center">Total Jurnal</div>
                    <div className="col-span-2 text-center">Total Tashih</div>
                    <div className="col-span-3 text-center">Persentase</div>
                  </div>
                  
                  {h.thalibah.map((t, idx) => (
                    <div 
                      key={t.user_id} 
                      className={`grid grid-cols-12 gap-4 items-center bg-white p-3 px-4 rounded-xl border border-gray-100 shadow-sm ${t.is_blacklisted ? 'opacity-50 grayscale' : ''}`}
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${t.is_blacklisted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {t.full_name}
                          </p>
                          {t.is_blacklisted && (
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              Blacklist
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <BookOpen className="w-4 h-4 text-emerald-500" />
                          <span>{t.jurnal_count}</span>
                        </div>
                      </div>
                      
                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                          <span>{t.tashih_count}</span>
                        </div>
                      </div>

                      <div className="col-span-3 flex justify-center">
                        <div className="w-full max-w-[120px] flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                t.progress_percentage >= 80 ? 'bg-emerald-500' :
                                t.progress_percentage >= 50 ? 'bg-amber-500' :
                                'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, t.progress_percentage)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-9 text-right">
                            {t.progress_percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
