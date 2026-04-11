'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';
import {
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  BarChart3,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  Eye,
  Calendar,
  Plus,
  Edit,
  Trash2,
  X,
  ChevronDown,
  ArrowUpDown,
  Shield,
  Ban,
  LayoutGrid,
  Search,
  Filter,
  MessageSquare,
  ChevronRight,
  UserCheck,
  ClipboardList,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Interfaces ---

interface JurnalEntry {
  id: string;
  user_id: string;
  tanggal_jurnal: string;
  tanggal_setor: string;
  juz_code: string | null;
  blok: string | null;
  pekan: number | null;
  tashih_completed: boolean;
  rabth_completed: boolean;
  murajaah_count: number;
  simak_murattal_count: number;
  tikrar_bi_an_nadzar_completed: boolean;
  tasmi_record_count: number;
  simak_record_completed: boolean;
  tikrar_bi_al_ghaib_count: number;
  tafsir_completed: boolean;
  menulis_completed: boolean;
  total_duration_minutes: number;
  catatan_tambahan: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string | null;
    nama_kunyah: string | null;
    whatsapp: string | null;
    is_blacklisted?: boolean;
  };
}

interface JurnalUserEntry {
  user_id: string;
  daftar_ulang_status?: string;
  submitted_at?: string;
  reviewed_at?: string;
  confirmed_chosen_juz?: string | null;
  user?: {
    id: string;
    full_name: string | null;
    nama_kunyah: string | null;
    whatsapp: string | null;
    is_blacklisted?: boolean;
  };
  weekly_status: Array<{
    week_number: number;
    total_blocks: number;
    completed_blocks: number;
    is_completed: boolean;
    blocks: Array<{
      block_code: string;
      week_number: number;
      part: string;
      start_page: number;
      end_page: number;
      is_completed: boolean;
      jurnal_count: number;
    }>;
    sp_info?: {
      sp_level: number;
      status: string;
      issued_at: string;
      reason: string;
      is_blacklisted: boolean;
    } | null;
  }>;
  summary?: {
    total_blocks: number;
    completed_blocks: number;
    pending_blocks: number;
    completion_percentage: number;
    completion_percentage_target?: number;
    target_blocks?: number;
    current_week?: number;
  };
  jurnal_count: number;
  jurnal_records: JurnalEntry[];
  sp_summary?: {
    sp_level: number;
    week_number: number;
    issued_at: string;
    reason: string;
    is_blacklisted: boolean;
    total_active_sp: number;
  } | null;
}

interface TashihEntry {
  user_id: string;
  confirmed_chosen_juz: string | null;
  user?: {
    id: string;
    full_name: string | null;
    nama_kunyah: string | null;
    whatsapp: string | null;
    is_blacklisted?: boolean;
  };
  weekly_status: Array<{
    week_number: number;
    total_blocks: number;
    completed_blocks: number;
    is_completed: boolean;
    blocks: Array<{
      block_code: string;
      week_number: number;
      is_completed: boolean;
      tashih_count: number;
    }>;
  }>;
  summary: {
    total_blocks: number;
    completed_blocks: number;
    pending_blocks: number;
    completion_percentage: number;
    completion_percentage_target?: number;
    target_blocks?: number;
    current_week?: number;
  };
  has_tashih: boolean;
  tashih_records: any[];
  latest_tashih: {
    waktu_tashih: string;
    blok: string;
  } | null;
}

// --- Main Page Component ---

export default function PresensiJurnalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
      </div>
    }>
      <PresensiJurnalContent />
    </Suspense>
  );
}

function PresensiJurnalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'presensi' | 'jurnal' | 'blacklist'>('jurnal');
  const [dataLoading, setDataLoading] = useState(false);
  const [jurnalEntries, setJurnalEntries] = useState<JurnalUserEntry[]>([]);
  const [tashihEntries, setTashihEntries] = useState<TashihEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBlok, setSelectedBlok] = useState<string>('all');
  const [availableBloks, setAvailableBloks] = useState<string[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [overrideWeek, setOverrideWeek] = useState<number>(0);
  
  const [selectedBlockRecords, setSelectedBlockRecords] = useState<{
    user: any;
    blockCode: string;
    records: any[];
    type: 'presensi' | 'jurnal';
  } | null>(null);
  
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [inputTarget, setInputTarget] = useState<{
    user: any;
    blockCode: string;
    type: 'presensi' | 'jurnal';
  } | null>(null);
  const [muallimahList, setMuallimahList] = useState<any[]>([]);

  const handleDeleteRecord = async (id: string, type: 'presensi' | 'jurnal') => {
    if (!window.confirm('Apakah Ukhti yakin ingin menghapus record ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      const endpoint = type === 'presensi' ? `/api/musyrifah/tashih?id=${id}` : `/api/musyrifah/jurnal?id=${id}`;
      const response = await fetch(endpoint, { method: 'DELETE' });
      
      if (response.ok) {
        toast.success('Record berhasil dihapus');
        setSelectedBlockRecords(null);
        loadData();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Gagal menghapus record');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus');
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'jurnal' || tab === 'presensi' || tab === 'blacklist') {
      setActiveTab(tab as 'presensi' | 'jurnal' | 'blacklist');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !authLoading) {
      loadData();
      if (activeTab === 'presensi') {
        loadMuallimah();
      }
    }
  }, [user, authLoading, activeTab, selectedBlok]);

  const loadMuallimah = async () => {
    try {
      const supabase = createClient();
      const { data: activeBatch } = await supabase
        .from('batches')
        .select('id')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeBatch) {
        const response = await fetch(`/api/muallimah/list?batch_id=${activeBatch.id}`);
        if (response.ok) {
          const result = await response.json();
          setMuallimahList(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading muallimah:', error);
    }
  };

  const loadData = async () => {
    setDataLoading(true);
    try {
      if (activeTab === 'jurnal') {
        await loadJurnal();
      } else {
        await loadTashih();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setDataLoading(false);
    }
  };

  const loadJurnal = async () => {
    const response = await fetch(`/api/musyrifah/jurnal?blok=${selectedBlok}`);
    if (response.ok) {
      const result = await response.json();
      setJurnalEntries(result.data || []);
      if (result.availableBloks) setAvailableBloks(result.availableBloks);
      if (result.currentWeek) {
        setCurrentWeek(result.currentWeek);
        // Only set override if it's the first load or 0
        if (overrideWeek === 0) setOverrideWeek(result.currentWeek);
      }
    }
  };

  const loadTashih = async () => {
    const response = await fetch(`/api/musyrifah/tashih?blok=${selectedBlok}`);
    if (response.ok) {
      const result = await response.json();
      setTashihEntries(result.data || []);
      if (result.availableBloks) setAvailableBloks(result.availableBloks);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <Toaster position="top-right" />
      
      <div className="bg-white border-b border-gray-100 mb-8 pt-6 pb-6 shadow-sm">
        <div className="container mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Monitoring Presensi & Jurnal</h1>
                <p className="text-gray-500 text-sm mt-1 font-medium">Tinjau kehadiran dan jurnal harian thalibah secara terpusat.</p>
              </div>
              <div className="flex gap-3">
                 <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm min-w-[140px]">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Thalibah</div>
                    <div className="flex items-baseline gap-1">
                      <div className="text-2xl font-bold text-green-900">
                        {activeTab === 'presensi' 
                          ? tashihEntries.filter(e => !e.user?.is_blacklisted).length 
                          : activeTab === 'jurnal'
                            ? jurnalEntries.filter(e => !e.user?.is_blacklisted).length
                            : tashihEntries.filter(e => e.user?.is_blacklisted).length
                        }
                      </div>
                      <div className="text-xs text-gray-400 font-medium lowercase italic">jiwa</div>
                    </div>
                 </div>
                 <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm min-w-[140px]">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Avg Progress</div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {(() => {
                        if (activeTab === 'blacklist') {
                          const blacklisted = tashihEntries.filter(e => e.user?.is_blacklisted);
                          return Math.round(blacklisted.reduce((acc, curr) => acc + curr.summary.completion_percentage, 0) / (blacklisted.length || 1));
                        }
                        if (activeTab === 'presensi') {
                          const active = tashihEntries.filter(e => !e.user?.is_blacklisted);
                          return Math.round(active.reduce((acc, curr) => acc + curr.summary.completion_percentage, 0) / (active.length || 1));
                        }
                        const active = jurnalEntries.filter(e => !e.user?.is_blacklisted);
                        return Math.round(active.reduce((acc, curr) => acc + (curr.summary?.completion_percentage || 0), 0) / (active.length || 1));
                      })()}%
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-20">
        <div className="flex p-1.5 bg-white shadow-xl shadow-green-900/5 rounded-2xl mb-8 w-full max-w-lg mx-auto sm:mx-0">
          <button
            onClick={() => {
              setActiveTab('jurnal');
              router.push('/presensi-jurnal?tab=jurnal', { scroll: false });
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300",
              activeTab === 'jurnal'
                ? "bg-green-900 text-white shadow-lg shadow-green-900/20"
                : "text-gray-500 hover:text-green-900 hover:bg-green-50"
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Jurnal Harian</span>
            <span className="sm:hidden">Jurnal</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('presensi');
              router.push('/presensi-jurnal?tab=presensi', { scroll: false });
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300",
              activeTab === 'presensi'
                ? "bg-green-900 text-white shadow-lg shadow-green-900/20"
                : "text-gray-500 hover:text-green-900 hover:bg-green-50"
            )}
          >
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Presensi (Tashih)</span>
            <span className="sm:hidden">Tashih</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('blacklist');
              router.push('/presensi-jurnal?tab=blacklist', { scroll: false });
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300",
              activeTab === 'blacklist'
                ? "bg-rose-700 text-white shadow-lg shadow-rose-900/20"
                : "text-gray-500 hover:text-rose-700 hover:bg-rose-50"
            )}
          >
            <Ban className="w-4 h-4" />
            <span>Blacklist</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-end">
          <div className="flex flex-wrap gap-3 items-end w-full lg:w-auto">
            <div className="flex flex-col gap-1.5 flex-1 lg:flex-initial lg:min-w-[300px]">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Cari Thalibah</label>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-900 transition-colors" />
                <input
                  type="text"
                  placeholder="Nama Thalibah atau Kunyah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-0 shadow-sm rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-gray-700 w-full focus:ring-2 focus:ring-green-900/20 transition-all outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 lg:flex-initial">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Filter Blok</label>
              <select
                value={selectedBlok}
                onChange={(e) => setSelectedBlok(e.target.value)}
                className="bg-white border-0 shadow-sm rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 min-w-[140px] focus:ring-2 focus:ring-green-900/20 transition-all cursor-pointer outline-none"
              >
                <option value="all">Semua Blok</option>
                {availableBloks.map(b => (
                  <option key={b} value={b}>Blok {b}</option>
                ))}
              </select>
            </div>
            {activeTab === 'jurnal' && (
              <div className="flex flex-col gap-1.5 flex-1 lg:flex-initial">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Pekan Aktif (Remind)</label>
                <select
                  value={overrideWeek}
                  onChange={(e) => setOverrideWeek(Number(e.target.value))}
                  className="bg-green-50 border border-green-100 shadow-sm rounded-xl px-4 py-2.5 text-sm font-bold text-green-900 min-w-[120px] focus:ring-2 focus:ring-green-900/20 transition-all cursor-pointer outline-none"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i+1} value={i+1}>Pekan {i+1} {i+1 === currentWeek ? '(Sesuai Jadwal)' : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <button 
              onClick={loadData}
              className="p-2.5 bg-white text-gray-500 rounded-xl shadow-sm hover:text-green-900 hover:bg-green-50 transition-all group"
              title="Refresh Data"
            >
              <ArrowUpDown className={cn("w-5 h-5 transition-transform duration-500", dataLoading && "rotate-180")} />
            </button>
          </div>
        </div>

        <div className="relative">
          {dataLoading ? (
             <div className="bg-white/60 backdrop-blur-md rounded-3xl p-20 flex flex-col items-center justify-center border border-white shadow-xl animate-pulse">
                <div className="w-16 h-16 border-4 border-green-900/20 border-t-green-900 rounded-full animate-spin mb-4" />
                <p className="text-green-900/60 font-bold uppercase tracking-widest text-xs">Singkronisasi Data...</p>
             </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'blacklist' ? (
                <TashihTabSimple 
                  entries={tashihEntries
                    .filter(e => e.user?.is_blacklisted)
                    .filter(e => 
                      e.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      e.user?.nama_kunyah?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => (a.user?.full_name || '').localeCompare(b.user?.full_name || ''))
                  } 
                  currentWeek={overrideWeek || currentWeek}
                  onRefresh={loadData}
                  onShowRecords={(user: any, blockCode: string, records: any[]) => {
                    setSelectedBlockRecords({ user, blockCode, records, type: 'presensi' });
                  }}
                />
              ) : activeTab === 'presensi' ? (
                <TashihTabSimple 
                  entries={tashihEntries
                    .filter(e => !e.user?.is_blacklisted)
                    .filter(e => 
                      e.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      e.user?.nama_kunyah?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => (a.user?.full_name || '').localeCompare(b.user?.full_name || ''))
                  } 
                  currentWeek={overrideWeek || currentWeek}
                  onRefresh={loadData}
                  onShowRecords={(user: any, blockCode: string, records: any[]) => {
                    setSelectedBlockRecords({ user, blockCode, records, type: 'presensi' });
                  }}
                />
              ) : (
                <JurnalTabSimple 
                  entries={jurnalEntries
                    .filter(e => !e.user?.is_blacklisted)
                    .filter(e => 
                      e.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      e.user?.nama_kunyah?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => (a.user?.full_name || '').localeCompare(b.user?.full_name || ''))
                  } 
                  currentWeek={overrideWeek || currentWeek}
                  onRefresh={loadData}
                  onShowRecords={(user: any, blockCode: string, records: any[]) => {
                    setSelectedBlockRecords({ user, blockCode, records, type: 'jurnal' });
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Detailed Record Modal */}
        {selectedBlockRecords && (
          <div className="fixed inset-0 bg-green-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-white animate-fadeInScale">
              <div className="bg-gradient-to-r from-green-900 to-emerald-900 p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Detail {selectedBlockRecords.type === 'presensi' ? 'Tashih' : 'Jurnal'}</h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {selectedBlockRecords.user?.full_name} • Blok {selectedBlockRecords.blockCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedBlockRecords(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide space-y-4">
                {selectedBlockRecords.records.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Tidak ada record ditemukan</p>
                  </div>
                ) : (
                  selectedBlockRecords.records.map((record, idx) => (
                    <div key={record.id || idx} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex justify-between items-start group">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-green-700" />
                          <span className="text-xs font-bold text-gray-900">
                             {new Date(record.tanggal_setor || record.waktu_tashih || record.created_at).toLocaleDateString('id-ID', {
                               day: 'numeric', month: 'long', year: 'numeric'
                             })}
                          </span>
                        </div>
                        {selectedBlockRecords.type === 'presensi' ? (
                          <div className="space-y-1">
                             <div className="text-[10px] text-gray-500 font-medium">Ustadzah: <span className="font-bold text-gray-700">{record.nama_pemeriksa || '-'}</span></div>
                             <div className="text-[10px] text-gray-500 font-medium">Kesalahan: <span className="font-bold text-red-600">{record.jumlah_kesalahan_tajwid || 0}</span></div>
                             {record.catatan_tambahan && <div className="text-[10px] text-gray-500 italic mt-2 border-l-2 border-green-200 pl-2">"{record.catatan_tambahan}"</div>}
                          </div>
                        ) : (
                          <div className="space-y-1">
                             <div className="flex flex-wrap gap-1">
                                {record.rabth_completed && <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-bold uppercase">Rabth</span>}
                                {record.murajaah_count > 0 && <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-bold uppercase">Murajaah</span>}
                                {record.tikrar_bi_al_ghaib_count > 0 && <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md font-bold uppercase">Ghaib</span>}
                             </div>
                             {record.catatan_tambahan && <div className="text-[10px] text-gray-500 italic mt-2 border-l-2 border-green-200 pl-2">"{record.catatan_tambahan}"</div>}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDeleteRecord(record.id, selectedBlockRecords.type)}
                        className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                        title="Hapus Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                 <button 
                  onClick={() => setSelectedBlockRecords(null)}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all"
                 >
                   Tutup
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Input Modal */}
        {isInputModalOpen && inputTarget && (
          <InputRecordModal 
            target={inputTarget}
            onClose={() => {
              setIsInputModalOpen(false);
              setInputTarget(null);
            }}
            onSuccess={() => {
              setIsInputModalOpen(false);
              setInputTarget(null);
              loadData();
            }}
            muallimahList={muallimahList}
          />
        )}
      </div>
      
      <EffectHandler 
        onOpenModal={(detail) => {
          setInputTarget(detail);
          setIsInputModalOpen(true);
        }} 
      />
      
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-fadeInScale { animation: fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
    </div>
  );
}

function EffectHandler({ onOpenModal }: { onOpenModal: (detail: any) => void }) {
  useEffect(() => {
    const handler = (e: any) => onOpenModal(e.detail);
    window.addEventListener('open-input-modal', handler);
    return () => window.removeEventListener('open-input-modal', handler);
  }, [onOpenModal]);
  return null;
}

// --- sub components ---

interface TashihTabProps {
  entries: TashihEntry[];
  currentWeek: number;
  onRefresh: () => void;
  onShowRecords: (user: any, blockCode: string, records: any[]) => void;
}

function TashihTabSimple({ entries, currentWeek, onRefresh, onShowRecords }: TashihTabProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) newExpanded.delete(userId);
    else newExpanded.add(userId);
    setExpandedRows(newExpanded);
  };

  const allWeeks = Array.from(new Set(entries.flatMap(e => e.weekly_status.map(w => w.week_number)))).sort((a, b) => a - b);

  if (entries.length === 0) return (
    <div className="bg-white rounded-3xl p-16 text-center shadow-xl border border-gray-100">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <UserCheck className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Data Tashih</h3>
      <p className="text-gray-500 max-w-sm mx-auto">Thalibah Anda belum memiliki catatan tashih.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thalibah</th>
              <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Juz</th>
              <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</th>
              {allWeeks.map(p => (
                <th key={p} className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-l border-gray-100/50">P{p}</th>
              ))}
              <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((entry: any) => (
              <React.Fragment key={entry.user_id}>
                <tr className={cn("hover:bg-green-50/30 transition-colors group", expandedRows.has(entry.user_id) && "bg-green-50/20")}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-green-900 font-bold">
                        {entry.user?.full_name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{entry.user?.full_name}</div>
                        <div className="text-[10px] text-gray-400 font-medium tracking-tighter">
                          {entry.user?.nama_kunyah} • {entry.user?.whatsapp || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                      {entry.confirmed_chosen_juz || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex flex-col items-center leading-none">
                         <div className={cn(
                            "text-base font-black leading-none",
                            (entry.summary?.completion_percentage_target || 0) >= 100 ? "text-emerald-700" :
                            (entry.summary?.completion_percentage_target || 0) >= 70 ? "text-amber-600" : "text-rose-600"
                         )}>
                            {entry.summary?.completion_percentage_target || 0}%
                         </div>
                         <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Target</div>
                      </div>
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200/50">
                        <div 
                           className={cn(
                              "h-full transition-all duration-700",
                              (entry.summary?.completion_percentage_target || 0) >= 100 ? "bg-emerald-500" :
                              (entry.summary?.completion_percentage_target || 0) >= 70 ? "bg-amber-400" : "bg-rose-500"
                           )} 
                           style={{ width: `${entry.summary?.completion_percentage_target || 0}%` }} 
                        />
                      </div>
                      <div className="text-[10px] font-medium text-gray-400 italic">
                         Total: {entry.summary?.completion_percentage || 0}%
                      </div>
                    </div>
                  </td>
                  {allWeeks.map(p => (
                    <td key={p} className="px-4 py-5 text-center border-l border-gray-50/50">
                      <WeekBubble week={entry.weekly_status.find((w: any) => w.week_number === p)} />
                    </td>
                  ))}
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end">
                       <button 
                          onClick={() => toggleRow(entry.user_id)} 
                          className={cn(
                             "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all shadow-sm border font-bold text-[10px] uppercase tracking-wider",
                             expandedRows.has(entry.user_id)
                                ? "bg-green-600 text-white border-green-700"
                                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-600 hover:text-white"
                          )}
                       >
                         {expandedRows.has(entry.user_id) ? <ChevronDown className="w-4 h-4 rotate-180" /> : <Eye className="w-3.5 h-3.5" />}
                         <span>{expandedRows.has(entry.user_id) ? 'Tutup' : 'Lihat'}</span>
                       </button>
                    </div>
                  </td>
                </tr>
                {expandedRows.has(entry.user_id) && (
                  <tr>
                    <td colSpan={allWeeks.length + 4} className="px-6 py-8 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {entry.weekly_status.slice(0, 10).map((week: any) => (
                          <div key={week.week_number} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                             <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pekan {week.week_number}</h4>
                                <span className="text-[10px] font-bold text-green-700">{week.completed_blocks}/4</span>
                             </div>
                             <div className="grid grid-cols-4 gap-2">
                                {week.blocks.map((block: any) => (
                                  <button 
                                    key={block.block_code} 
                                    onClick={() => {
                                      const records = entry.tashih_records.filter((r: any) => {
                                        const bloks = typeof r.blok === 'string' ? r.blok.split(',').map((b: string) => b.trim()) : (r.blok || []);
                                        return bloks.includes(block.block_code);
                                      });
                                      if (block.is_completed) {
                                        onShowRecords(entry.user, block.block_code, records);
                                      } else {
                                        window.dispatchEvent(new CustomEvent('open-input-modal', { detail: { user: entry.user, blockCode: block.block_code, type: 'presensi' } }));
                                      }
                                    }}
                                    className={cn(
                                      "p-2 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center min-h-[50px] shadow-sm font-bold",
                                      block.is_completed 
                                        ? "bg-green-600 border-green-700 text-white hover:bg-green-700" 
                                        : block.tashih_count > 0
                                          ? "bg-yellow-400 border-yellow-500 text-yellow-950 hover:bg-yellow-500"
                                          : "bg-red-500 border-red-600 text-white hover:bg-red-600"
                                    )}
                                  >
                                      <div className="text-xs">{block.block_code}</div>
                                      <div className="text-[8px] uppercase">{block.is_completed ? 'Sudah' : 'Input'}</div>
                                  </button>
                                ))}
                             </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface JurnalTabProps {
  entries: JurnalUserEntry[];
  currentWeek: number;
  onRefresh: () => void;
  onShowRecords: (user: any, blockCode: string, records: any[]) => void;
}

function JurnalTabSimple({ entries, currentWeek, onRefresh, onShowRecords }: JurnalTabProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) newExpanded.delete(userId);
    else newExpanded.add(userId);
    setExpandedRows(newExpanded);
  };

  const allWeeks = Array.from(new Set(entries.flatMap(e => e.weekly_status.map(w => w.week_number)))).sort((a, b) => a - b);

  if (entries.length === 0) return <div className="bg-white p-20 text-center">Belum ada jurnal.</div>;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase">Thalibah</th>
              <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase">Juz</th>
              <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase">Progress</th>
              {allWeeks.map(p => (
                <th key={p} className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase border-l border-gray-100/50">P{p}</th>
              ))}
              <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((entry: any) => (
              <React.Fragment key={entry.user_id}>
                <tr className={cn("hover:bg-green-50/30 transition-colors group", expandedRows.has(entry.user_id) && "bg-green-50/20")}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-900 font-bold">
                        {entry.user?.full_name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{entry.user?.full_name}</div>
                        <div className="text-[10px] text-gray-400 font-medium tracking-tighter">
                          {entry.user?.nama_kunyah} • {entry.user?.whatsapp || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                        {entry.confirmed_chosen_juz || '-'}
                      </span>
                      {entry.user?.whatsapp && entry.summary?.completed_blocks < entry.summary?.total_blocks && (
                        <button 
                          onClick={() => {
                            const missingBlocks: string[] = [];
                            entry.weekly_status.forEach((w: any) => {
                              // Hanya ambil blok dari pekan aktif ke belakang
                              if (currentWeek > 0 && w.week_number > currentWeek) return;
                              
                              w.blocks.forEach((b: any) => {
                                if (!b.is_completed) missingBlocks.push(b.block_code);
                              });
                            });

                            if (missingBlocks.length === 0) {
                              toast.error('Semua blok sudah dilaporkan');
                              return;
                            }

                            const phone = entry.user.whatsapp.replace(/[^0-9]/g, '').replace(/^0/, '62');
                            const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ukhti *${entry.user.full_name}*.\n\nSemoga Ukhti selalu dalam penjagaan Allah ﷻ. Aamiin.\n\nSekadar mengingatkan untuk laporan *Jurnal Harian Tikrar*.\n\nBerdasarkan data hari ini, beberapa blok berikut *belum dilaporkan* (sampai Pekan ${currentWeek}):\n👉 *${missingBlocks.slice(0, 15).join(', ')}${missingBlocks.length > 15 ? ' ...' : ''}*\n\nMohon segera dilengkapi ya Ukhti, karena batas waktu laporan adalah setiap *Ahad pukul 24.00 WIB*.\n\nJazaakumullah khayran.\nBarakallahu fiikum.`;
                            
                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm text-[9px] font-bold uppercase tracking-tighter border border-emerald-700"
                          title="Kirim Pengingat WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Chat</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex flex-col items-center leading-none">
                         <div className={cn(
                            "text-base font-black leading-none",
                            (entry.summary?.completion_percentage_target || 0) >= 100 ? "text-emerald-700" :
                            (entry.summary?.completion_percentage_target || 0) >= 70 ? "text-amber-600" : "text-rose-600"
                         )}>
                            {entry.summary?.completion_percentage_target || 0}%
                         </div>
                         <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Target</div>
                      </div>
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200/50">
                        <div 
                           className={cn(
                              "h-full transition-all duration-700",
                              (entry.summary?.completion_percentage_target || 0) >= 100 ? "bg-emerald-500" :
                              (entry.summary?.completion_percentage_target || 0) >= 70 ? "bg-amber-400" : "bg-rose-500"
                           )} 
                           style={{ width: `${entry.summary?.completion_percentage_target || 0}%` }} 
                        />
                      </div>
                      <div className="text-[10px] font-medium text-gray-400 italic">
                         Total: {entry.summary?.completion_percentage || 0}%
                      </div>
                    </div>
                  </td>
                  {allWeeks.map(p => (
                    <td key={p} className="px-4 py-5 text-center border-l border-gray-50/50">
                      <WeekBubbleJurnal week={entry.weekly_status.find((w: any) => w.week_number === p)} />
                    </td>
                  ))}
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => toggleRow(entry.user_id)} 
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all shadow-sm border font-bold text-[10px] uppercase tracking-wider",
                          expandedRows.has(entry.user_id)
                            ? "bg-green-600 text-white border-green-700"
                            : "bg-green-50 text-green-700 border-green-200 hover:bg-green-600 hover:text-white"
                        )}
                      >
                        {expandedRows.has(entry.user_id) ? <ChevronDown className="w-4 h-4 rotate-180" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{expandedRows.has(entry.user_id) ? 'Tutup' : 'Lihat'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRows.has(entry.user_id) && (
                  <tr>
                    <td colSpan={allWeeks.length + 4} className="px-6 py-8 bg-gray-50/50">
                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                         <h4 className="text-xs font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-green-900" />
                            Detail Jurnal Harian
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            {entry.weekly_status.map((week: any) => (
                               <div key={week.week_number} className="space-y-3">
                                  <div className="border-b border-gray-50 pb-2">
                                     <span className="text-[10px] font-bold text-gray-400 uppercase">Pekan {week.week_number}</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                     {week.blocks.map((block: any) => (
                                        <button 
                                           key={block.block_code} 
                                           onClick={() => {
                                             const records = entry.jurnal_records.filter((r: any) => {
                                               const normalizedRaw = r.blok || '';
                                               if (normalizedRaw.startsWith('[')) {
                                                 try {
                                                   const parsed = JSON.parse(normalizedRaw);
                                                   return Array.isArray(parsed) && parsed.includes(block.block_code);
                                                 } catch { return false; }
                                               }
                                               return normalizedRaw === block.block_code;
                                             });
                                             if (block.is_completed) {
                                               onShowRecords(entry.user, block.block_code, records);
                                             } else {
                                                window.dispatchEvent(new CustomEvent('open-input-modal', { detail: { user: entry.user, blockCode: block.block_code, type: 'jurnal' } }));
                                             }
                                           }}
                                           className={cn(
                                              "p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center min-h-[50px] shadow-sm font-bold",
                                              block.is_completed 
                                                ? "bg-green-600 border-green-700 text-white hover:bg-green-700" 
                                                : block.jurnal_count > 0
                                                  ? "bg-yellow-400 border-yellow-500 text-yellow-950 hover:bg-yellow-500"
                                                  : "bg-red-500 border-red-600 text-white hover:bg-red-600"
                                           )}
                                        >
                                           <div className="text-[10px] font-bold">{block.block_code}</div>
                                           <div className="text-[8px] font-bold uppercase">{block.is_completed ? 'Sudah' : 'Input'}</div>
                                        </button>
                                     ))}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WeekBubble({ week }: any) {
  if (!week) return <div className="w-5 h-5 rounded-full bg-gray-50 border border-gray-100 mx-auto" />;
  const pct = (week.completed_blocks / week.total_blocks) * 100;
  return (
    <div 
      className={cn(
        "relative w-5 h-5 rounded-full mx-auto overflow-hidden border",
        pct === 0 
          ? "bg-red-500 border-red-600" 
          : pct === 100 
            ? "bg-green-600 border-green-700" 
            : "border-yellow-500 shadow-sm"
      )}
      style={pct > 0 && pct < 100 ? { 
        background: `conic-gradient(#16a34a 0% ${pct}%, #facc15 ${pct}% 100%)` 
      } : {}}
    >
      {week.is_completed && <div className="absolute inset-0 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 text-white shadow-sm" /></div>}
    </div>
  );
}

function WeekBubbleJurnal({ week }: any) {
  if (!week) return <div className="w-5 h-5 rounded-full bg-gray-50 border border-gray-100 mx-auto" />;
  const pct = (week.completed_blocks / week.total_blocks) * 100;
  return (
    <div 
      className={cn(
        "relative w-5 h-5 rounded-full mx-auto overflow-hidden border",
        pct === 0 
          ? "bg-red-500 border-red-600" 
          : pct === 100 
            ? "bg-green-600 border-green-700" 
            : "border-yellow-500 shadow-sm"
      )}
      style={pct > 0 && pct < 100 ? { 
        background: `conic-gradient(#16a34a 0% ${pct}%, #facc15 ${pct}% 100%)` 
      } : {}}
    >
      {week.is_completed && <div className="absolute inset-0 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 text-white shadow-sm" /></div>}
    </div>
  );
}

function InputRecordModal({ target, onClose, onSuccess, muallimahList }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tashihData, setTashihData] = useState({
    lokasi: 'mti' as 'mti' | 'luar',
    lokasiDetail: '',
    ustadzahId: '',
    ustadzahName: '',
    jumlahKesalahanTajwid: 0,
    masalahTajwid: [] as string[],
    catatanTambahan: '',
    tanggalTashih: new Date().toISOString().slice(0, 10)
  });

  const [jurnalData, setJurnalData] = useState({
    tanggalSetor: new Date().toISOString().slice(0, 10),
    rabthCompleted: false,
    murajaahCompleted: false,
    simakMurattalCompleted: false,
    tikrarBiAnNadzarCompleted: false,
    tasmiRecordCompleted: false,
    simakRecordCompleted: false,
    tikrarBiAlGhaibCompleted: false,
    tafsirCompleted: false,
    menulisCompleted: false,
    catatanTambahan: ''
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (target.type === 'presensi') {
        const response = await fetch('/api/musyrifah/tashih', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: target.user.id,
            blok: target.blockCode,
            lokasi: tashihData.lokasi,
            lokasi_detail: tashihData.lokasiDetail,
            ustadzah_id: tashihData.ustadzahId === 'manual' ? null : (tashihData.ustadzahId || null),
            nama_pemeriksa: tashihData.ustadzahName,
            jumlah_kesalahan_tajwid: tashihData.jumlahKesalahanTajwid,
            masalah_tajwid: tashihData.masalahTajwid,
            catatan_tambahan: tashihData.catatanTambahan,
            waktu_tashih: new Date(tashihData.tanggalTashih).toISOString()
          })
        });
        const result = await response.json();
        if (response.ok) { 
          toast.success('Berhasil menyimpan tashih'); 
          onSuccess(); 
        } else {
          const errorMsg = typeof result.error === 'object' ? (result.error.message || result.error.code) : result.error;
          toast.error(errorMsg || 'Gagal menyimpan tashih');
        }
      } else {
        const response = await fetch('/api/musyrifah/jurnal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: target.user.id,
            blok: target.blockCode,
            tanggal_setor: new Date(jurnalData.tanggalSetor).toISOString(),
            tashih_completed: true,
            rabth_completed: jurnalData.rabthCompleted,
            murajaah_count: jurnalData.murajaahCompleted ? 1 : 0,
            simak_murattal_count: jurnalData.simakMurattalCompleted ? 1 : 0,
            tikrar_bi_an_nadzar_completed: jurnalData.tikrarBiAnNadzarCompleted,
            tasmi_record_count: jurnalData.tasmiRecordCompleted ? 1 : 0,
            simak_record_completed: jurnalData.simakRecordCompleted,
            tikrar_bi_al_ghaib_count: jurnalData.tikrarBiAlGhaibCompleted ? 1 : 0,
            tafsir_completed: jurnalData.tafsirCompleted,
            menulis_completed: jurnalData.menulisCompleted,
            catatan_tambahan: jurnalData.catatanTambahan
          })
        });
        const result = await response.json();
        if (response.ok) { 
          toast.success('Berhasil menyimpan jurnal'); 
          onSuccess(); 
        } else {
          const errorMsg = typeof result.error === 'object' ? (result.error.message || result.error.code) : result.error;
          toast.error(errorMsg || 'Gagal menyimpan jurnal');
        }
      }
    } catch (error: any) { 
      console.error('Input Error:', error);
      toast.error('Terjadi kesalahan sistem'); 
    }
    finally { setIsSubmitting(false); }
  };

  const toggleMasalahTajwid = (id: string) => {
    setTashihData(prev => ({
      ...prev,
      masalahTajwid: prev.masalahTajwid.includes(id)
        ? prev.masalahTajwid.filter(m => m !== id)
        : [...prev.masalahTajwid, id]
    }));
  };

  return (
    <div className="fixed inset-0 bg-green-900/60 backdrop-blur-md z-[9999] flex items-start sm:items-center justify-center p-4 pt-24 pb-40 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-white animate-fadeInScale">
        <div className="bg-gradient-to-r from-green-900 to-emerald-800 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Bantu Input {target.type === 'presensi' ? 'Tashih' : 'Jurnal'}</h3>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">{target.user?.full_name} • Blok {target.blockCode}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-5 h-5" /></button>
        </div>
        
        <form id="record-form" onSubmit={handleSubmit}>
          <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide space-y-6">
          {target.type === 'presensi' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</label>
                  <input type="date" value={tashihData.tanggalTashih} onChange={e => setTashihData({...tashihData, tanggalTashih: e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold shadow-inner border-0" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lokasi</label>
                  <select value={tashihData.lokasi} onChange={e => setTashihData({...tashihData, lokasi: e.target.value as any})} className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold shadow-inner border-0">
                    <option value="mti">Markaz (MTI)</option>
                    <option value="luar">Luar MTI</option>
                  </select>
                </div>
              </div>

              {tashihData.lokasi === 'mti' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ustadzah</label>
                  <select 
                    value={tashihData.ustadzahId}
                    onChange={e => {
                      const m = muallimahList.find((x: any) => x.id === e.target.value);
                      setTashihData({...tashihData, ustadzahId: e.target.value, ustadzahName: m?.full_name || ''});
                    }}
                    className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold shadow-inner border-0"
                  >
                    <option value="">Pilih Ustadzah...</option>
                    {muallimahList.map((m: any) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                    <option value="manual">+ Nama Lainnya</option>
                  </select>
                  {tashihData.ustadzahId === 'manual' && (
                    <input type="text" placeholder="Nama ustadzah..." value={tashihData.ustadzahName} onChange={e => setTashihData({...tashihData, ustadzahName: e.target.value})} className="w-full mt-2 bg-gray-50 border-2 border-green-100 rounded-xl p-3 text-sm font-bold" />
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detail Lokasi</label>
                  <input type="text" value={tashihData.lokasiDetail} onChange={e => setTashihData({...tashihData, lokasiDetail: e.target.value, ustadzahName: e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold shadow-inner border-0" />
                </div>
              )}

              <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex flex-col items-center gap-4">
                <label className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Total Kesalahan</label>
                <div className="flex items-center gap-8">
                  <button type="button" onClick={() => setTashihData({...tashihData, jumlahKesalahanTajwid: Math.max(0, tashihData.jumlahKesalahanTajwid - 1)})} className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center"><Minus className="w-5 h-5"/></button>
                  <span className="text-4xl font-black text-gray-900">{tashihData.jumlahKesalahanTajwid}</span>
                  <button type="button" onClick={() => setTashihData({...tashihData, jumlahKesalahanTajwid: tashihData.jumlahKesalahanTajwid + 1})} className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center"><Plus className="w-5 h-5"/></button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Masalah Tajwid</label>
                <div className="flex flex-wrap gap-2">
                  {['mad', 'qolqolah', 'ghunnah', 'ikhfa', 'idghom', 'izhar', 'waqaf', 'makhroj'].map(opt => (
                    <button key={opt} type="button" onClick={() => toggleMasalahTajwid(opt)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border-2 transition-all", tashihData.masalahTajwid.includes(opt) ? "bg-red-600 border-red-600 text-white" : "bg-white border-gray-100 text-gray-400")}>{opt}</button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal Setor</label>
                <input type="date" value={jurnalData.tanggalSetor} onChange={e => setJurnalData({...jurnalData, tanggalSetor: e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold shadow-inner border-0" />
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aktivitas Harian (Ceklist Blok)</label>
                 <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'rabthCompleted', label: 'Rabth (Menyambung)' },
                      { id: 'murajaahCompleted', label: 'Murajaah Blok Sebelum' },
                      { id: 'simakMurattalCompleted', label: 'Simak Murattal' },
                      { id: 'tikrarBiAnNadzarCompleted', label: 'Tikrar Bi An Nadzar (per Blok)' },
                      { id: 'tasmiRecordCompleted', label: 'Tasmi Record' },
                      { id: 'simakRecordCompleted', label: 'Simak Record (per Blok)' },
                      { id: 'tikrarBiAlGhaibCompleted', label: 'Tikrar Bi Al Ghaib (per Blok)' },
                      { id: 'tafsirCompleted', label: 'Tafsir (per Blok)' },
                      { id: 'menulisCompleted', label: 'Menulis (per Blok)' },
                    ].map(activity => (
                      <label key={activity.id} className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                        (jurnalData as any)[activity.id] ? "bg-green-50 border-green-200 text-green-900" : "bg-white border-gray-100 text-gray-400"
                      )}>
                        <span className="text-xs font-bold">{activity.label}</span>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            checked={(jurnalData as any)[activity.id]} 
                            onChange={e => setJurnalData({...jurnalData, [activity.id]: e.target.checked})} 
                            className="w-5 h-5 accent-green-600 rounded-lg" 
                          />
                        </div>
                      </label>
                    ))}
                 </div>
              </div>
            </>
          )}

            <div className="space-y-1 shadow-inner rounded-2xl bg-gray-50 p-2">
              <textarea 
                placeholder="Catatan Admin..." 
                className="w-full bg-transparent border-0 rounded-xl p-2 text-sm font-bold h-20 resize-none outline-none" 
                value={target.type === 'presensi' ? tashihData.catatanTambahan : jurnalData.catatanTambahan} 
                onChange={e => target.type === 'presensi' ? setTashihData({...tashihData, catatanTambahan: e.target.value}) : setJurnalData({...jurnalData, catatanTambahan: e.target.value})} 
              />
            </div>
          </div>
        </form>

        <div className="p-6 pb-32 md:pb-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button 
            type="submit" 
            form="record-form"
            disabled={isSubmitting} 
            className="flex-1 bg-green-900 text-white font-bold py-4 rounded-2xl shadow-lg disabled:bg-gray-200"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 bg-white border border-gray-200 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
