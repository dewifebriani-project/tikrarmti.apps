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
  ClipboardList
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
  const [activeTab, setActiveTab] = useState<'presensi' | 'jurnal'>('presensi');
  const [dataLoading, setDataLoading] = useState(false);
  const [jurnalEntries, setJurnalEntries] = useState<JurnalUserEntry[]>([]);
  const [tashihEntries, setTashihEntries] = useState<TashihEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBlok, setSelectedBlok] = useState<string>('all');
  const [availableBloks, setAvailableBloks] = useState<string[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(0);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'jurnal' || tab === 'presensi') {
      setActiveTab(tab as 'presensi' | 'jurnal');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !authLoading) {
      loadData();
    }
  }, [user, authLoading, activeTab, selectedBlok]);

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
      if (result.currentWeek) setCurrentWeek(result.currentWeek);
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
      
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-b-[3rem] bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 pb-16 pt-10 text-white shadow-2xl">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium mb-4">
                <ClipboardList className="w-3.5 h-3.5 text-yellow-400" />
                <span className="tracking-wider uppercase">Monitoring & Assessment</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold mb-3 tracking-tight">Presensi & Jurnal</h1>
              <p className="text-green-50/70 text-lg max-w-2xl leading-relaxed">
                Kelola kehadiran, tinjau catatan tashih, dan pantau jurnal harian thalibah secara terpusat untuk memastikan kualitas hafalan.
              </p>
            </div>
            
            <div className="hidden lg:flex gap-4">
               <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 w-40 text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {activeTab === 'presensi' ? tashihEntries.length : jurnalEntries.length}
                  </div>
                  <div className="text-xs text-white/60 uppercase tracking-widest mt-1">Total Thalibah</div>
               </div>
               <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 w-40 text-center">
                  <div className="text-3xl font-bold text-emerald-400">
                    {activeTab === 'presensi' 
                      ? Math.round(tashihEntries.reduce((acc, curr) => acc + curr.summary.completion_percentage, 0) / (tashihEntries.length || 1))
                      : Math.round(jurnalEntries.reduce((acc, curr) => acc + (curr.summary?.completion_percentage || 0), 0) / (jurnalEntries.length || 1))
                    }%
                  </div>
                  <div className="text-xs text-white/60 uppercase tracking-widest mt-1">Avg Progress</div>
               </div>
            </div>
          </div>
        </div>

        {/* Decorative Abstract Elements */}
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl home-orb" />
      </div>

      <div className="container mx-auto px-6 -mt-10 relative z-20">
        {/* Navigation Tabs */}
        <div className="flex p-1.5 bg-white shadow-xl shadow-green-900/5 rounded-2xl mb-8 w-full max-w-md mx-auto sm:mx-0">
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
            <span>Presensi (Tashih)</span>
          </button>
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
            <span>Jurnal Harian</span>
          </button>
        </div>

        {/* Filters and Actions */}
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
            <button 
              onClick={loadData}
              className="p-2.5 bg-white text-gray-500 rounded-xl shadow-sm hover:text-green-900 hover:bg-green-50 transition-all group"
              title="Refresh Data"
            >
              <ArrowUpDown className={cn("w-5 h-5 transition-transform duration-500", dataLoading && "rotate-180")} />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-green-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-900/20 hover:bg-green-800 transition-all transition-transform active:scale-95 group">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>Input {activeTab === 'presensi' ? 'Tashih' : 'Jurnal'} Baru</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative">
          {dataLoading ? (
             <div className="bg-white/60 backdrop-blur-md rounded-3xl p-20 flex flex-col items-center justify-center border border-white shadow-xl animate-pulse">
                <div className="w-16 h-16 border-4 border-green-900/20 border-t-green-900 rounded-full animate-spin mb-4" />
                <p className="text-green-900/60 font-bold uppercase tracking-widest text-xs">Singkronisasi Data...</p>
             </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'presensi' ? (
                <TashihTabSimple 
                  entries={tashihEntries.filter(e => 
                    e.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    e.user?.nama_kunyah?.toLowerCase().includes(searchQuery.toLowerCase())
                  )} 
                  onRefresh={loadData}
                />
              ) : (
                <JurnalTabSimple 
                  entries={jurnalEntries.filter(e => 
                    e.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    e.user?.nama_kunyah?.toLowerCase().includes(searchQuery.toLowerCase())
                  )} 
                  onRefresh={loadData}
                  currentWeek={currentWeek}
                />
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Styles for the page */}
      <style jsx global>{`
        @keyframes orb-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .home-orb {
          animation: orb-float 10s ease-in-out infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// --- Simplified Component Implementations ---

function TashihTabSimple({ entries, onRefresh }: { entries: TashihEntry[], onRefresh: () => void }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) newExpanded.delete(userId);
    else newExpanded.add(userId);
    setExpandedRows(newExpanded);
  };

  if (entries.length === 0) {
     return (
        <div className="bg-white rounded-3xl p-16 text-center shadow-xl border border-gray-100">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-10 h-10 text-gray-300" />
           </div>
           <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Data Tashih</h3>
           <p className="text-gray-500 max-w-sm mx-auto">Thalibah Anda belum memiliki catatan tashih untuk blok ini.</p>
        </div>
     );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thalibah</th>
              <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Juz</th>
              <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">P1</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">P2</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">P3</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">P4</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">P5</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((entry) => (
              <React.Fragment key={entry.user_id}>
                <tr className={cn("hover:bg-green-50/30 transition-colors group", expandedRows.has(entry.user_id) && "bg-green-50/20")}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-green-900 font-bold shadow-sm">
                        {entry.user?.full_name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{entry.user?.full_name}</div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{entry.user?.nama_kunyah || entry.user?.id.slice(0, 8)}</div>
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
                      <div className="text-xs font-bold text-gray-700">{entry.summary.completion_percentage}%</div>
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          style={{ width: `${entry.summary.completion_percentage}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter">
                        {entry.summary.completed_blocks}/{entry.summary.total_blocks} Blok
                      </div>
                    </div>
                  </td>
                  {[1, 2, 3, 4, 5].map(p => (
                    <td key={p} className="px-4 py-5 text-center">
                      <WeekBubble week={entry.weekly_status.find(w => w.week_number === p)} />
                    </td>
                  ))}
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => toggleRow(entry.user_id)}
                        className="p-2 text-gray-400 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all"
                       >
                          {expandedRows.has(entry.user_id) ? <ChevronDown className="w-4 h-4 rotate-180" /> : <Eye className="w-4 h-4" />}
                       </button>
                       <button className="p-2 text-gray-400 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all">
                          <Plus className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
                {expandedRows.has(entry.user_id) && (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         {entry.weekly_status.slice(0, 10).map(week => (
                            <div key={week.week_number} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                               <div className="flex justify-between items-center mb-4">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pekan {week.week_number}</h4>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase",
                                    week.is_completed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                  )}>
                                    {week.is_completed ? 'Tuntas' : `${week.completed_blocks}/4`}
                                  </span>
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                  {week.blocks.map(block => (
                                    <div key={block.block_code} className={cn(
                                      "p-2 rounded-xl border-2 text-center transition-all",
                                      block.is_completed 
                                        ? "bg-green-50 border-green-200 text-green-700" 
                                        : "bg-white border-gray-100 text-gray-300"
                                    )}>
                                      <div className="text-xs font-bold">{block.block_code}</div>
                                      <div className="text-[9px] font-medium">{block.is_completed ? 'Sudah' : 'Belum'}</div>
                                    </div>
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

function JurnalTabSimple({ entries, onRefresh, currentWeek }: { entries: JurnalUserEntry[], onRefresh: () => void, currentWeek: number }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) newExpanded.delete(userId);
    else newExpanded.add(userId);
    setExpandedRows(newExpanded);
  };

  if (entries.length === 0) {
    return (
       <div className="bg-white rounded-3xl p-16 text-center shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <BookOpen className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Jurnal</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Thalibah Anda belum mengisi jurnal harian untuk periode ini.</p>
       </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thalibah</th>
              <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Juz</th>
              <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">P1</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">P2</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">P3</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">P4</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">P5</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((entry) => (
              <React.Fragment key={entry.user_id}>
                <tr className={cn("hover:bg-green-50/30 transition-colors group", expandedRows.has(entry.user_id) && "bg-green-50/20")}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-green-900 font-bold shadow-sm">
                        {entry.user?.full_name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{entry.user?.full_name}</div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                          {entry.sp_summary ? (
                            <span className="text-red-500 font-bold">SP {entry.sp_summary.sp_level} • Pekan {entry.sp_summary.week_number}</span>
                          ) : (
                            entry.user?.nama_kunyah || entry.user?.id.slice(0, 8)
                          )}
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
                      <div className="text-xs font-bold text-gray-700">{entry.summary?.completion_percentage || 0}%</div>
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          style={{ width: `${entry.summary?.completion_percentage || 0}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter">
                        {entry.summary?.completed_blocks || 0}/{entry.summary?.total_blocks || 1} Blok
                      </div>
                    </div>
                  </td>
                  {[1, 2, 3, 4, 5].map(p => (
                    <td key={p} className="px-4 py-5 text-center">
                      <WeekBubbleJurnal week={entry.weekly_status.find(w => w.week_number === p)} />
                    </td>
                  ))}
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => toggleRow(entry.user_id)}
                        className="p-2 text-gray-400 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all"
                       >
                          {expandedRows.has(entry.user_id) ? <ChevronDown className="w-4 h-4 rotate-180" /> : <Eye className="w-4 h-4" />}
                       </button>
                       <a 
                        href={`https://wa.me/${entry.user?.whatsapp}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                       >
                          <MessageSquare className="w-4 h-4" />
                       </a>
                    </div>
                  </td>
                </tr>
                {expandedRows.has(entry.user_id) && (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 bg-gray-50/50">
                       <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                          <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                             <LayoutGrid className="w-4 h-4 text-green-900" />
                             Detail Jurnal Per Blok
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                             {entry.weekly_status.map(week => (
                                <div key={week.week_number} className="space-y-3">
                                   <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                      <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Pekan {week.week_number}</span>
                                      {week.sp_info && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">SP{week.sp_info.sp_level}</span>}
                                   </div>
                                   <div className="grid grid-cols-2 gap-2">
                                      {week.blocks.map(block => (
                                         <div key={block.block_code} className={cn(
                                            "p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center min-h-[50px]",
                                            block.is_completed 
                                              ? "bg-green-50 border-green-200 text-green-900" 
                                              : "bg-white border-gray-100 text-gray-200"
                                         )}>
                                            <div className="text-[10px] font-bold">{block.block_code}</div>
                                            {block.is_completed && <div className="text-[8px] font-medium opacity-60">{block.jurnal_count} Record</div>}
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             ))}
                          </div>
                          
                          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                             <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-md bg-green-500" />
                                <span>Sudah Diisi</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-md bg-white border border-gray-200" />
                                <span>Belum Diisi</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-md bg-red-100 border border-red-300" />
                                <span>Kena SP</span>
                             </div>
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

function WeekBubble({ week }: { week?: any }) {
  if (!week) return <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 text-xs">-</div>;

  if (week.is_completed) return (
     <div className="w-8 h-8 rounded-full bg-green-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
        ✓
     </div>
  );
  
  const incomplete = week.total_blocks - week.completed_blocks;
  if (incomplete === week.total_blocks) return (
     <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 border-2 border-red-100 flex items-center justify-center text-[10px] font-bold shadow-sm">
        0/4
     </div>
  );

  return (
     <div className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-700 border-2 border-yellow-100 flex items-center justify-center text-[10px] font-bold shadow-sm">
        {week.completed_blocks}/4
     </div>
  );
}

function WeekBubbleJurnal({ week }: { week?: any }) {
  if (!week) return <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 text-xs">-</div>;

  if (week.sp_info) {
     return (
        <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 border-2 border-red-400 flex items-center justify-center text-[10px] font-black shadow-sm" title={week.sp_info.reason}>
           SP{week.sp_info.sp_level}
        </div>
     );
  }

  if (week.is_completed) return (
    <div className="w-8 h-8 rounded-full bg-green-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
       ✓
    </div>
  );

  if (week.completed_blocks === 0) return (
    <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-300 border border-gray-100 flex items-center justify-center text-[10px] font-bold">
       0/4
    </div>
  );

  return (
    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border-2 border-emerald-100 flex items-center justify-center text-[10px] font-bold shadow-sm">
       {week.completed_blocks}/4
    </div>
  );
}
