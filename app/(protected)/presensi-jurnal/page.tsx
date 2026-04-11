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
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  UserCheck,
  ClipboardList,
  Minus,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Check,
  CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void 
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-2">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        Halaman <span className="text-gray-900">{currentPage}</span> Dari <span className="text-gray-900">{totalPages}</span>
      </div>
      
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-green-900 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          title="Halaman Pertama"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-green-900 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          title="Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm",
                  currentPage === pageNum 
                    ? "bg-green-900 text-white shadow-green-900/20" 
                    : "bg-white border border-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-900"
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-green-900 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          title="Selanjutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-green-900 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          title="Halaman Terakhir"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// --- Modals ---

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
      sp_type?: string;
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
    sp_type?: string;
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
  const [activeTab, setActiveTab] = useState<'presensi' | 'jurnal' | 'blacklist' | 'dropout'>('jurnal');
  const [isMounted, setIsMounted] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [jurnalEntries, setJurnalEntries] = useState<JurnalUserEntry[]>([]);
  const [tashihEntries, setTashihEntries] = useState<TashihEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [selectedBlok, setSelectedBlok] = useState<string>('all');
  const [availableBloks, setAvailableBloks] = useState<string[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [overrideWeek, setOverrideWeek] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<{
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    stats?: {
      total_active_thalibah: number;
      total_blacklist: number;
      overall_avg_progress: number;
    };
  } | null>(null);
  
  const [selectedBlockRecords, setSelectedBlockRecords] = useState<{
    user: any;
    blockCode: string;
    records: any[];
    type: 'presensi' | 'jurnal';
  } | null>(null);
  
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isIssueSPModalOpen, setIsIssueSPModalOpen] = useState(false);
  const [spTarget, setSpTarget] = useState<{
    user: any;
    weekNumber: number;
  } | null>(null);
  const [inputTarget, setInputTarget] = useState<{
    user: any;
    blockCode: string;
    type: 'presensi' | 'jurnal';
  } | null>(null);
  const [muallimahList, setMuallimahList] = useState<any[]>([]);

  const handleDropout = async (thalibahId: string, batchId: string, name: string) => {
    if (!window.confirm(`Apakah Ukhti yakin ingin melakukan Dropout (DO) pada thalibah ${name}? Ini akan memindahkan data ke Tab DO.`)) return;
    
    try {
      setDataLoading(true);
      const response = await fetch('/api/musyrifah/dropout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thalibah_id: thalibahId, batch_id: batchId })
      });
      
      if (response.ok) {
        toast.success(`${name} berhasil di-DO`);
        loadData();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Gagal melakukan DO');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat DO');
    } finally {
      setDataLoading(false);
    }
  };

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
    if (tab === 'jurnal' || tab === 'presensi' || tab === 'blacklist' || tab === 'dropout') {
      setActiveTab(tab as 'presensi' | 'jurnal' | 'blacklist' | 'dropout');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !authLoading) {
      loadData();
      if (activeTab === 'presensi') {
        loadMuallimah();
      }
    }
  }, [user, authLoading, activeTab, selectedBlok, currentPage]);

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
      if (activeTab === 'jurnal' || activeTab === 'dropout') {
        const response = await fetch(`/api/musyrifah/jurnal?blok=${selectedBlok}&page=${currentPage}${activeTab === 'dropout' ? '&status=dropout' : ''}`);
        if (response.ok) {
          const result = await response.json();
          const entries = result.data?.entries || [];
          const meta = result.data?.meta || null;
          
          setJurnalEntries(entries);
          setPagination(meta);
          
          if (result.availableBloks) setAvailableBloks(result.availableBloks);
          if (result.currentWeek) {
            setCurrentWeek(result.currentWeek);
            if (overrideWeek === 0) setOverrideWeek(result.currentWeek);
          }
        }
      } else {
        const response = await fetch(`/api/musyrifah/tashih?blok=${selectedBlok}&page=${currentPage}`);
        if (response.ok) {
          const result = await response.json();
          const entries = result.data?.entries || [];
          const meta = result.data?.meta || null;
          
          setTashihEntries(entries);
          setPagination(meta);
          
          if (result.availableBloks) setAvailableBloks(result.availableBloks);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setDataLoading(false);
    }
  };

  const loadJurnal = async () => {
    const response = await fetch(`/api/musyrifah/jurnal?blok=${selectedBlok}&page=${currentPage}`);
    if (response.ok) {
      const result = await response.json();
      const entries = result.data?.entries || [];
      const meta = result.data?.meta || null;
      
      setJurnalEntries(entries);
      setPagination(meta);
      
      if (result.availableBloks) setAvailableBloks(result.availableBloks);
      if (result.currentWeek) {
        setCurrentWeek(result.currentWeek);
        // Only set override if it's the first load or 0
        if (overrideWeek === 0) setOverrideWeek(result.currentWeek);
      }
    }
  };

  const loadTashih = async () => {
    const response = await fetch(`/api/musyrifah/tashih?blok=${selectedBlok}&page=${currentPage}`);
    if (response.ok) {
      const result = await response.json();
      const entries = result.data?.entries || [];
      const meta = result.data?.meta || null;
      
      setTashihEntries(entries);
      setPagination(meta);
      
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
                        {pagination?.totalCount || 0}
                      </div>
                      <div className="text-xs text-gray-400 font-medium lowercase italic">jiwa</div>
                    </div>
                 </div>
                 <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm min-w-[140px]">
                     <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Avg Progress</div>
                     <div className="text-2xl font-bold text-emerald-600">
                       {!isMounted ? '0' : (() => {
                         if (activeTab === 'blacklist') {
                           const blacklisted = tashihEntries.filter(e => e.user?.is_blacklisted);
                           return blacklisted.length > 0 
                             ? Math.round(blacklisted.reduce((acc, curr) => acc + (curr.summary?.completed_blocks || 0) / (curr.summary?.total_blocks || 1) * 100, 0) / blacklisted.length)
                             : 0;
                         }
                         if (activeTab === 'presensi') {
                           const active = tashihEntries.filter(e => !e.user?.is_blacklisted);
                           return active.length > 0
                             ? Math.round(active.reduce((acc, curr) => acc + (curr.summary?.completed_blocks || 0) / (curr.summary?.total_blocks || 1) * 100, 0) / active.length)
                             : 0;
                         }
                         const active = jurnalEntries.filter(e => !e.user?.is_blacklisted);
                         return active.length > 0
                           ? Math.round(active.reduce((acc, curr) => acc + (curr.summary?.completed_blocks || 0) / (curr.summary?.total_blocks || 1) * 100, 0) / active.length)
                           : 0;
                       })()}%
                     </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-20">
        <div className="flex p-1.5 bg-white shadow-xl shadow-green-900/5 rounded-2xl mb-8 w-full max-w-xl mx-auto sm:mx-0">
          <button
            onClick={() => {
              setActiveTab('jurnal');
              setCurrentPage(1);
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
              setCurrentPage(1);
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
            <span className="hidden sm:inline">Blacklist</span>
            <span className="sm:hidden">Blacklist</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('dropout');
              router.push('/presensi-jurnal?tab=dropout', { scroll: false });
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300",
              activeTab === 'dropout'
                ? "bg-orange-700 text-white shadow-lg shadow-orange-900/20"
                : "text-gray-500 hover:text-orange-700 hover:bg-orange-50"
            )}
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Drop Out</span>
            <span className="sm:hidden">DO</span>
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
                onChange={(e) => {
                  setSelectedBlok(e.target.value);
                  setCurrentPage(1);
                }}
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
                <p className="text-green-900/60 font-bold uppercase tracking-widest text-xs">Sinkronisasi Data...</p>
             </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'dropout' ? (
                <JurnalTabSimple 
                  entries={jurnalEntries
                    .filter(e => e.sp_summary?.sp_type === 'permanent_do' || e.sp_summary?.sp_type === 'temporary_do')
                    .filter(e => 
                      e.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      e.user?.nama_kunyah?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => (a.user?.full_name || '').localeCompare(b.user?.full_name || ''))
                  } 
                  currentWeek={overrideWeek || currentWeek}
                  onRefresh={loadData}
                  onPageChange={setCurrentPage}
                  pagination={pagination}
                  onShowRecords={(user: any, blockCode: string, records: any[]) => {
                    setSelectedBlockRecords({ user, blockCode, records, type: 'jurnal' });
                  }}
                  onIssueSP={(user: any, week: number) => {
                    setSpTarget({ user, weekNumber: week });
                    setIsIssueSPModalOpen(true);
                  }}
                  onDropout={handleDropout}
                />
              ) : activeTab === 'blacklist' ? (
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
                  onPageChange={setCurrentPage}
                  pagination={pagination}
                  onShowRecords={(user: any, blockCode: string, records: any[]) => {
                    setSelectedBlockRecords({ user, blockCode, records, type: 'presensi' });
                  }}
                  onIssueSP={(user: any, week: number) => {
                    setSpTarget({ user, weekNumber: week });
                    setIsIssueSPModalOpen(true);
                  }}
                  onDropout={handleDropout}
                />
              ) : activeTab === 'presensi' ? (
                <TashihTabSimple 
                  entries={tashihEntries
                    .filter(e => !e.user?.is_blacklisted && !(e.sp_summary?.sp_type === 'permanent_do' || e.sp_summary?.sp_type === 'temporary_do'))
                    .filter(e => 
                      e.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      e.user?.nama_kunyah?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => (a.user?.full_name || '').localeCompare(b.user?.full_name || ''))
                  } 
                  currentWeek={overrideWeek || currentWeek}
                  onRefresh={loadData}
                  onPageChange={setCurrentPage}
                  pagination={pagination}
                  onShowRecords={(user: any, blockCode: string, records: any[]) => {
                    setSelectedBlockRecords({ user, blockCode, records, type: 'presensi' });
                  }}
                  onIssueSP={(user: any, week: number) => {
                    setSpTarget({ user, weekNumber: week });
                    setIsIssueSPModalOpen(true);
                  }}
                  onDropout={handleDropout}
                />
              ) : (
                <JurnalTabSimple 
                  entries={jurnalEntries
                    .filter(e => !e.user?.is_blacklisted && !(e.sp_summary?.sp_type === 'permanent_do' || e.sp_summary?.sp_type === 'temporary_do'))
                    .filter(e => 
                      e.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      e.user?.nama_kunyah?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => (a.user?.full_name || '').localeCompare(b.user?.full_name || ''))
                  } 
                  currentWeek={overrideWeek || currentWeek}
                  onRefresh={loadData}
                  onPageChange={setCurrentPage}
                  pagination={pagination}
                  onShowRecords={(user: any, blockCode: string, records: any[]) => {
                    setSelectedBlockRecords({ user, blockCode, records, type: 'jurnal' });
                  }}
                  onIssueSP={(user: any, week: number) => {
                    setSpTarget({ user, weekNumber: week });
                    setIsIssueSPModalOpen(true);
                  }}
                  onDropout={handleDropout}
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

        {/* SP Issue Modal */}
        {isIssueSPModalOpen && spTarget && (
          <IssueSPModal 
            target={spTarget}
            onClose={() => {
              setIsIssueSPModalOpen(false);
              setSpTarget(null);
            }}
            onSuccess={() => {
              setIsIssueSPModalOpen(false);
              setSpTarget(null);
              loadData();
            }}
          />
        )}
      </div>
      
      <EffectHandler 
        onOpenModal={(detail) => {
          setInputTarget(detail);
          setIsInputModalOpen(true);
        }} 
      />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-fadeInScale { animation: fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}} />
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

function SPStatusBadge({ summary }: { summary: any }) {
  if (!summary) return null;
  
  if (summary.is_blacklisted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold uppercase tracking-tighter shadow-sm border border-rose-700">
        <Ban className="w-2.5 h-2.5" />
        Blacklisted
      </span>
    );
  }

  if (summary.sp_type === 'permanent_do') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-700 text-white text-[10px] font-bold uppercase tracking-tighter shadow-sm border border-orange-800">
        <Shield className="w-2.5 h-2.5" />
        DO Permanen
      </span>
    );
  }

  if (summary.sp_type === 'temporary_do') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-600 text-white text-[10px] font-bold uppercase tracking-tighter shadow-sm border border-orange-700">
        <Shield className="w-2.5 h-2.5" />
        DO Sementara
      </span>
    );
  }

  if (summary.sp_level === 3) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-bold uppercase tracking-tighter shadow-sm border border-red-700">
        <AlertTriangle className="w-2.5 h-2.5" />
        SP 3
      </span>
    );
  }

  if (summary.sp_level === 2) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold uppercase tracking-tighter shadow-sm border border-amber-600">
        <AlertTriangle className="w-2.5 h-2.5" />
        SP 2
      </span>
    );
  }

  if (summary.sp_level === 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-400 text-yellow-900 text-[10px] font-bold uppercase tracking-tighter shadow-sm border border-yellow-500">
        <AlertTriangle className="w-2.5 h-2.5" />
        SP 1
      </span>
    );
  }

  return null;
}

// --- sub components ---

interface TashihTabProps {
  entries: TashihEntry[];
  currentWeek: number;
  onRefresh: () => void;
  onShowRecords: (user: any, blockCode: string, records: any[]) => void;
  onIssueSP: (user: any, week: number) => void;
  onDropout: (userId: string, batchId: string, name: string) => void;
  pagination: any;
  onPageChange: (page: number) => void;
}

function TashihTabSimple({ entries, currentWeek, onRefresh, onShowRecords, pagination, onPageChange }: TashihTabProps) {
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
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-green-900 transition-colors group">
                <div className="flex items-center gap-1">
                  Thalibah
                  <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status / SP</th>
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
                    <SPStatusBadge summary={entry.sp_summary} />
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                         {entry.confirmed_chosen_juz || '-'}
                       </span>
                       {entry.user?.whatsapp && (
                        <button 
                          onClick={() => {
                            const phone = entry.user.whatsapp.replace(/[^0-9]/g, '').replace(/^0/, '62');
                            const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ukhti *${entry.user.full_name}*.\n\nSemoga Ukhti selalu dalam penjagaan Allah ﷻ. Aamiin.\n\nSekadar menyapa dan bersilaturahmi terkait pembinaan Tilawah/Tahfizh Ukhti di Tikrar MTI.\n\nSangat senang jika kita bisa ngobrol sejenak.\n\nJazaakumullah khayran.\nBarakallahu fiikum.`;
                            
                            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm text-[9px] font-bold uppercase tracking-tighter border border-emerald-700 w-full justify-center"
                          title="Hubungi Thalibah via WhatsApp"
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
                      <WeekBubble week={entry.weekly_status.find((w: any) => w.week_number === p)} />
                    </td>
                  ))}
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onIssueSP(entry.user, currentWeek)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm font-bold text-[10px] uppercase tracking-wider"
                          title="Terbitkan Surat Peringatan (SP)"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="inline">SP</span>
                        </button>
                        <button 
                          onClick={() => onDropout(entry.user_id, entry.batch_id || '', entry.user?.full_name || 'Thalibah')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-700 hover:text-white transition-all shadow-sm font-bold text-[10px] uppercase tracking-wider"
                          title="Lakukan Dropout (DO)"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span className="inline">DO</span>
                        </button>
                        <button 
                          onClick={() => {
                            const phone = entry.user.whatsapp?.replace(/[^0-9]/g, '').replace(/^0/, '62');
                            if (!phone) {
                              toast.error('Nomor WhatsApp tidak tersedia');
                              return;
                            }
                            const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ukhti *${entry.user.full_name}*.\n\nAfwan Ukhti, status antum saat ini adalah *Dropout (DO)* sehingga tidak dapat mengikuti kegiatan Tikrar MTI Batch ini.\n\nJazaakumullah khayran.\nBarakallahu fiikum.`;
                            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-950 border border-orange-200 hover:bg-orange-700 hover:text-white transition-all shadow-sm font-bold text-[10px] uppercase tracking-wider"
                          title="Kirim Notifikasi DO via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="inline">WA DO</span>
                        </button>
                        <button 
                          onClick={() => {
                            const phone = entry.user.whatsapp?.replace(/[^0-9]/g, '').replace(/^0/, '62');
                            if (!phone) {
                              toast.error('Nomor WhatsApp tidak tersedia');
                              return;
                            }
                            const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ukhti *${entry.user.full_name}*.\n\nAfwan Ukhti, status antum saat ini adalah *Dropout (DO)* sehingga tidak dapat mengikuti kegiatan Tikrar MTI Batch ini.\n\nJazaakumullah khayran.\nBarakallahu fiikum.`;
                            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-950 border border-orange-200 hover:bg-orange-700 hover:text-white transition-all shadow-sm font-bold text-[10px] uppercase tracking-wider"
                          title="Kirim Notifikasi DO via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="inline">WA DO</span>
                        </button>
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
                    <td colSpan={allWeeks.length + 5} className="px-6 py-8 bg-gray-50/50">
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
      {(pagination?.totalCount > 0) && (
        <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100">
          <Pagination 
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-2">
            Total {pagination.totalCount} Thalibah
          </div>
        </div>
      )}
    </div>
  );
}

interface JurnalTabProps {
  entries: JurnalUserEntry[];
  currentWeek: number;
  onRefresh: () => void;
  onShowRecords: (user: any, blockCode: string, records: any[]) => void;
  onIssueSP: (user: any, week: number) => void;
  onDropout: (userId: string, batchId: string, name: string) => void;
  pagination: any;
  onPageChange: (page: number) => void;
}

function JurnalTabSimple({ entries, currentWeek, onRefresh, onShowRecords, onIssueSP, onDropout, pagination, onPageChange }: JurnalTabProps) {
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
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-green-900 transition-colors group">
                <div className="flex items-center gap-1">
                  Thalibah
                  <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status / SP</th>
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
                    <SPStatusBadge summary={entry.sp_summary} />
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
                            
                            // Using api.whatsapp.com/send instead of wa.me for better native app trigger consistency on some mobile browsers
                            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm text-[9px] font-bold uppercase tracking-tighter border border-emerald-700 w-full justify-center"
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
                    <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onIssueSP(entry.user, currentWeek)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm font-bold text-[10px] uppercase tracking-wider"
                          title="Terbitkan Surat Peringatan (SP)"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="inline">SP</span>
                        </button>
                        <button 
                          onClick={() => {
                            // Find matching registration entry to get batch_id
                            // Since entries are already filtered/processed, we might need to rely on the entry itself
                            // JurnalUserEntry should have batch_id ideally, but we know thalibah.id and active batch is usually the one being viewed.
                            // In this component, we'll try to find it or use a default
                            onDropout(entry.user_id, entry.batch_id || '', entry.user?.full_name || 'Thalibah');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-700 hover:text-white transition-all shadow-sm font-bold text-[10px] uppercase tracking-wider"
                          title="Lakukan Dropout (DO)"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span className="inline">DO</span>
                        </button>
                        <button 
                          onClick={() => {
                            const phone = entry.user.whatsapp?.replace(/[^0-9]/g, '').replace(/^0/, '62');
                            if (!phone) {
                              toast.error('Nomor WhatsApp tidak tersedia');
                              return;
                            }
                            const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ukhti *${entry.user.full_name}*.\n\nAfwan Ukhti, status antum saat ini adalah *Dropout (DO)* sehingga tidak dapat mengikuti kegiatan Tikrar MTI Batch ini.\n\nJazaakumullah khayran.\nBarakallahu fiikum.`;
                            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-950 border border-orange-200 hover:bg-orange-700 hover:text-white transition-all shadow-sm font-bold text-[10px] uppercase tracking-wider"
                          title="Kirim Notifikasi DO via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="inline">WA DO</span>
                        </button>
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
                    <td colSpan={allWeeks.length + 5} className="px-6 py-8 bg-gray-50/50">
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
      {(pagination?.totalCount > 0) && (
        <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100">
          <Pagination 
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-2">
            Total {pagination.totalCount} Thalibah
          </div>
        </div>
      )}
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
function IssueSPModal({ target, onClose, onSuccess }: { target: any, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  
  // Sequential logic based on thalibah's latest SP level
  const latestLevel = target.user?.sp_summary?.sp_level || 0;
  const initialLevel = latestLevel < 3 ? latestLevel + 1 : 3;
  
  const [spLevel, setSpLevel] = useState(initialLevel);
  const [reason, setReason] = useState('tidak_lapor_jurnal');
  const [customReason, setCustomReason] = useState('');
  const [spType, setSpType] = useState<string>('standard');

  const getReasonText = () => {
    switch(reason) {
      case 'tidak_lapor_jurnal': return 'Tidak Lapor Jurnal (Ghaib)';
      case 'tidak_lapor_tashih': return 'Tidak Lapor Tashih';
      case 'laporan_tidak_lengkap': return 'Laporan Tidak Lengkap';
      case 'pelanggaran_adab': return 'Pelanggaran Adab/Etika';
      case 'lainnya': return customReason || 'Lainnya';
      default: return '';
    }
  };

  const generateWAPreview = () => {
    const reasonText = getReasonText();
    const name = target.user?.full_name || 'Ukhti';
    const week = target.weekNumber;
    
    let base = `*Surat Peringatan ${spLevel} (SP${spLevel})*\n\nAssalamu’alaikum warahmatullah wabarakatuh, Ukhti *${name}*.\n\nSemoga Ukhti selalu dalam keadaan sehat dan dalam lindungan Allah ﷻ. Kami menyadari bahwa setiap proses memiliki tantangan tersendiri, namun kedisiplinan adalah kunci utama dalam keberhasilan program ini.\n\ndengan ini kami sampaikan *Surat Peringatan ke-${spLevel}* dikarenakan: \n👉 *${reasonText}* (pada Pekan ${week}).\n\n`;
    
    if (spLevel === 3) {
      if (spType === 'temporary_do') {
        base += `Berhubung ini adalah peringatan ketiga (SP3), maka sesuai aturan yang berlaku, status Ukhti saat ini adalah *Drop Out Sementara*. Ukhti tetap dapat mendaftar kembali pada batch berikutnya.\n\n`;
      } else if (spType === 'permanent_do') {
        base += `Berhubung ini adalah peringatan ketiga (SP3), dan mengingat tingkat pelanggaran/konsistensi, maka dengan berat hati status Ukhti saat ini adalah *Drop Out Permanen*.\n\n`;
      } else {
        base += `Ini adalah peringatan terakhir (SP3). Mohon segera perbaiki komitmen Ukhti agar progres hafalan tidak terhenti.\n\n`;
      }
    } else {
      base += `Mohon Ukhti segera menindaklanjuti hal ini dan meningkatkan kedisiplinan dalam laporan harian agar dapat melanjutkan proses belajar dengan lancar.\n\n`;
    }
    
    base += `Jazakumullah khayran.\nAdmin Tikrar MTI`;
    return base;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/musyrifah/sp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: target.user.id,
          sp_level: spLevel,
          week_number: target.weekNumber,
          reason: reason === 'lainnya' ? customReason : reason,
          sp_type: spLevel === 3 ? (spType === 'standard' ? null : spType) : null,
          status: 'active'
        })
      });
      
      if (response.ok) {
        toast.success('SP Berhasil Terbit');
        onSuccess();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Gagal menerbitkan SP');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop with extreme glassmorphism */}
      <div 
        className="absolute inset-0 bg-[#0c0a09]/80 backdrop-blur-2xl animate-fadeIn" 
        onClick={onClose} 
      />
      
      {/* Premium Glass Container */}
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-none sm:rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col max-h-screen sm:max-h-[85vh] animate-fadeInScale">
        
        {/* Animated Header */}
        <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-red-900 p-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.8),transparent)] pointer-events-none" />
          <div className="relative flex justify-between items-start">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-black uppercase tracking-[0.2em]">
                <Shield className="w-3 h-3 text-rose-300" />
                Administrative Action
              </div>
              <h3 className="text-2xl font-black tracking-tight">Terbitkan SP</h3>
              <p className="text-rose-100/60 text-xs font-bold uppercase tracking-widest">{target.user?.full_name}</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/10 shadow-lg group active:scale-90"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>
        
        {/* Modern Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto scrollbar-hide flex-1">
          {/* SP Level Selector */}
          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Level Peringatan</label>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">Progressive Sequence</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(level => {
                const isDisabled = level > latestLevel + 1;
                const isActive = spLevel === level;
                return (
                  <button 
                    key={level} 
                    type="button" 
                    onClick={() => !isDisabled && setSpLevel(level)}
                    disabled={isDisabled}
                    className={cn(
                      "group relative py-4 rounded-2xl font-black transition-all duration-300 border-2 flex flex-col items-center gap-1",
                      isActive 
                        ? "bg-rose-600 border-rose-600 text-white shadow-[0_12px_24px_-8px_rgba(225,29,72,0.4)] ring-4 ring-rose-600/10" 
                        : isDisabled
                          ? "bg-gray-50 border-gray-100 text-gray-200 cursor-not-allowed opacity-50 shadow-inner"
                          : "bg-white border-gray-100 text-gray-400 hover:border-rose-200 hover:text-rose-600 hover:shadow-lg active:scale-95"
                    )}
                  >
                    <span className="text-xs opacity-50 uppercase tracking-tighter">Level</span>
                    <span className="text-xl leading-none">{level}</span>
                    {isDisabled && <Lock className="w-3.5 h-3.5 absolute top-2 right-2 opacity-30" />}
                  </button>
                );
              })}
            </div>
          </div>

          {spLevel === 3 && (
            <div className="space-y-4 animate-slideDown p-5 bg-orange-50/50 rounded-3xl border border-orange-100 ring-4 ring-orange-50/50">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-orange-600" />
                <label className="text-[11px] font-black text-orange-900 uppercase tracking-wider">Tindakan Akhir</label>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'standard', label: 'Peringatan Terakhir', sub: 'Tetap aktif sebagai thalibah', color: 'rose' },
                  { id: 'temporary_do', label: 'Drop Out Sementara', sub: 'Boleh daftar batch depan', color: 'orange' },
                  { id: 'permanent_do', label: 'Drop Out Permanen', sub: 'Blacklist selamanya', color: 'red' }
                ].map(type => (
                  <button 
                    key={type.id}
                    type="button" 
                    onClick={() => setSpType(type.id)}
                    className={cn(
                      "p-3 rounded-2xl text-left transition-all border-2 flex items-center justify-between",
                      spType === type.id 
                        ? "bg-white border-orange-500 shadow-md ring-2 ring-orange-200" 
                        : "bg-white/50 border-transparent hover:border-orange-200 grayscale opacity-70"
                    )}
                  >
                    <div>
                      <div className="text-xs font-black text-gray-900">{type.label}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{type.sub}</div>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      spType === type.id ? "border-orange-500 bg-orange-500" : "border-gray-200"
                    )}>
                      {spType === type.id && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Justifikasi & Alasan</label>
            <div className="relative group">
              <select 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:ring-4 focus:ring-rose-600/10 focus:border-rose-200 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="tidak_lapor_jurnal">⚠️ Tidak Lapor Jurnal (Ghaib)</option>
                <option value="tidak_lapor_tashih">🎤 Tidak Lapor Tashih</option>
                <option value="laporan_tidak_lengkap">📝 Laporan Tidak Lengkap</option>
                <option value="pelanggaran_adab">🤝 Pelanggaran Adab/Etika</option>
                <option value="lainnya">✏️ Lainnya (Tulis Manual)</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {reason === 'lainnya' && (
            <textarea 
              placeholder="Berikan detail alasan pelanggaran..." 
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              className="w-full bg-white border-2 border-rose-100 rounded-2xl p-4 text-sm font-bold h-32 resize-none shadow-lg shadow-rose-900/5 focus:ring-4 focus:ring-rose-600/10 outline-none animate-slideDown"
            />
          )}

          {/* Premium WhatsApp Message Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Preview Notifikasi</label>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Preview
              </div>
            </div>
            
            <div className="relative pt-6 pb-4 px-4 bg-[#e5ddd5] rounded-[32px] overflow-hidden shadow-2xl border border-gray-300">
              {/* WhatsApp UI Background Pattern Placeholder would go here */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
              
              {/* The Bubble */}
              <div className="relative group">
                <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-none px-4 py-3 shadow-sm border border-black/5 relative animate-popIn">
                  {/* Bubble Tail */}
                  <div className="absolute top-0 -right-2 w-0 h-0 border-l-[10px] border-l-[#dcf8c6] border-b-[10px] border-b-transparent" />
                  
                  <div className="text-[11px] font-medium text-gray-800 whitespace-pre-wrap leading-relaxed font-sans scrollbar-hide max-h-[250px] overflow-y-auto">
                    {generateWAPreview()}
                  </div>
                  
                  <div className="flex justify-end items-center gap-1 mt-1 opacity-50">
                    <span className="text-[9px] font-bold uppercase">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center font-medium italic px-4">Salin teks ini setelah menyimpan data untuk dikirim ke Thalibah.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 shrink-0">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-rose-600 text-white font-black py-4 rounded-2xl shadow-[0_12px_24px_-8px_rgba(225,29,72,0.4)] disabled:bg-gray-200 disabled:shadow-none flex items-center justify-center gap-2 transition-all hover:bg-rose-700 active:scale-95 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  PROSES SP
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={() => {
                const phone = target.user?.whatsapp?.replace(/[^0-9]/g, '').replace(/^0/, '62');
                if (!phone) {
                  toast.error('Nomor WhatsApp tidak tersedia');
                  return;
                }
                const message = generateWAPreview();
                window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-[0_12px_24px_-8px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all hover:bg-emerald-700 active:scale-95 group"
            >
              <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
              KIRIM WA
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-white border-2 border-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-95"
            >
              BATAL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
