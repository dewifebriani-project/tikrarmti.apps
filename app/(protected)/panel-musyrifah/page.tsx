'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Clock,
  Eye,
  Calendar,
  Plus,
  Edit,
  Trash2,
  X,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';

type TabType = 'overview' | 'thalibah' | 'jurnal' | 'tashih' | 'ujian';

interface Thalibah {
  id: string;
  full_name: string;
  email: string;
  whatsapp?: string;
  halaqah?: {
    id: string;
    name: string;
  };
  tikrar_registrations?: Array<{
    id: string;
    batch_id: string;
    batch_name: string;
    status: string;
    selection_status: string;
  }>;
}

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

// Grouped jurnal entry by user (new structure like tashih)
interface JurnalUserEntry {
  user_id: string;
  daftar_ulang_status?: string;
  submitted_at?: string;
  reviewed_at?: string;
  confirmed_chosen_juz?: string | null;
  juz_info?: {
    id: string;
    code: string;
    name: string;
    juz_number: number;
    part: string;
    start_page: number;
    end_page: number;
  } | null;
  user?: {
    id: string;
    full_name: string | null;
    nama_kunyah: string | null;
    whatsapp: string | null;
  };
  weekly_status: Array<{
    week_number: number;
    has_jurnal: boolean;
    entry_count: number;
    entries: JurnalEntry[];
  }>;
  jurnal_count: number;
  weeks_with_jurnal: number;
  latest_jurnal?: {
    id: string;
    tanggal_setor: string;
    blok: string | null;
    pekan: number | null;
    juz_code?: string | null;
  } | null;
  jurnal_records: JurnalEntry[];
}

interface WeeklyStatus {
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
    tashih_count: number;
  }>;
}

interface TashihSummary {
  total_blocks: number;
  completed_blocks: number;
  pending_blocks: number;
  completion_percentage: number;
}

interface TashihEntry {
  user_id: string;
  confirmed_chosen_juz: string | null;
  daftar_ulang_status: string;
  submitted_at: string;
  reviewed_at: string;
  user?: {
    id: string;
    full_name: string | null;
    nama_kunyah: string | null;
    whatsapp: string | null;
  };
  juz_info?: {
    id: string;
    code: string;
    name: string;
    juz_number: number;
    part: string;
    start_page: number;
    end_page: number;
  } | null;
  weekly_status: WeeklyStatus[];
  summary: TashihSummary;
  has_tashih: boolean;
  tashih_count: number;
  latest_tashih: {
    id: string;
    lokasi: string;
    lokasi_detail: string | null;
    nama_pemeriksa: string | null;
    jumlah_kesalahan_tajwid: number | null;
    waktu_tashih: string;
    blok: string;
  } | null;
  tashih_records: any[];
}

interface UjianResult {
  id: string;
  thalibah_id: string;
  thalibah?: {
    id: string;
    full_name: string;
    nama_kunyah?: string;
    whatsapp?: string;
    email?: string;
    confirmed_chosen_juz?: string;
  };
  summary?: {
    total_attempts: number;
    passed_attempts: number;
    unique_juz_count: number;
    latest_attempt_date: string;
  };
  attempts: Array<{
    id: string;
    juz_number: number;
    score: number;
    status: string;
    submitted_at: string;
    created_at: string;
    updated_at: string;
  }>;
}

interface MusyrifahStats {
  totalThalibah: number;
  activeHalaqah: number;
  pendingJurnalReview: number;
  pendingTashihReview: number;
  pendingUjianReview: number;
  jurnal: {
    totalEntries: number;
    uniqueThalibah: number;
    thalibahWithJurnal: number;
    thalibahWithoutJurnal: number;
    averageEntriesPerThalibah: number;
    weeksWithJurnal: number;
    totalBlocksCompleted: number;
    completionPercentage: number;
    thisWeekEntries: number;
  };
  tashih: {
    totalRecords: number;
    uniqueThalibah: number;
    thalibahWithTashih: number;
    thalibahWithoutTashih: number;
    averageRecordsPerThalibah: number;
    totalBlocksCompleted: number;
    totalBlocks: number;
    completionPercentage: number;
    thisWeekRecords: number;
  };
}

export default function PanelMusyrifahPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('musyrifahActiveTab');
      return (savedTab as TabType) || 'overview';
    }
    return 'overview';
  });

  const isMusyrifah: boolean = !authLoading && user?.roles?.includes('musyrifah') === true;

  // Data states
  const [stats, setStats] = useState<MusyrifahStats>({
    totalThalibah: 0,
    activeHalaqah: 0,
    pendingJurnalReview: 0,
    pendingTashihReview: 0,
    pendingUjianReview: 0,
    jurnal: {
      totalEntries: 0,
      uniqueThalibah: 0,
      thalibahWithJurnal: 0,
      thalibahWithoutJurnal: 0,
      averageEntriesPerThalibah: 0,
      weeksWithJurnal: 0,
      totalBlocksCompleted: 0,
      completionPercentage: 0,
      thisWeekEntries: 0,
    },
    tashih: {
      totalRecords: 0,
      uniqueThalibah: 0,
      thalibahWithTashih: 0,
      thalibahWithoutTashih: 0,
      averageRecordsPerThalibah: 0,
      totalBlocksCompleted: 0,
      totalBlocks: 0,
      completionPercentage: 0,
      thisWeekRecords: 0,
    },
  });
  const [thalibahList, setThalibahList] = useState<Thalibah[]>([]);
  const [jurnalEntries, setJurnalEntries] = useState<JurnalUserEntry[]>([]);
  const [tashihEntries, setTashihEntries] = useState<TashihEntry[]>([]);
  const [ujianResults, setUjianResults] = useState<UjianResult[]>([]);

  // Jurnal filter states
  const [selectedBlok, setSelectedBlok] = useState<string>('all');
  const [selectedPekan, setSelectedPekan] = useState<string>('all');
  const [availableBloks, setAvailableBloks] = useState<string[]>([]);

  // Tashih filter states
  const [selectedTashihBlok, setSelectedTashihBlok] = useState<string>('all');
  const [availableTashihBloks, setAvailableTashihBloks] = useState<string[]>([]);

  // Save activeTab to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('musyrifahActiveTab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    console.log('=== Musyrifah Page Auth Check ===');
    console.log('Auth loading:', authLoading);
    console.log('User:', user);
    console.log('User roles:', user?.roles);
    console.log('Is Musyrifah:', isMusyrifah);

    if (!authLoading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
      } else if (!user.roles?.includes('musyrifah')) {
        console.log('User is not musyrifah, roles:', user.roles);
        router.push('/dashboard');
      } else {
        console.log('Musyrifah access granted');
        setLoading(false);
      }
    }
  }, [user, authLoading, router, isMusyrifah]);

  useEffect(() => {
    if (user) {
      console.log('Loading data for tab:', activeTab);
      loadData();
    }
  }, [activeTab, user]);

  const loadData = async () => {
    console.log('loadData called for tab:', activeTab);
    setDataLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error('Request aborted after 10 seconds for tab:', activeTab);
      toast.error(`Loading timeout for ${activeTab}. Please try again.`);
      setDataLoading(false);
    }, 10000);

    try {
      console.log('=== Starting data load for tab:', activeTab, '===', new Date().toISOString());

      if (activeTab === 'overview') {
        await loadStats();
      } else if (activeTab === 'thalibah') {
        await loadThalibah();
      } else if (activeTab === 'jurnal') {
        await loadJurnal();
      } else if (activeTab === 'tashih') {
        await loadTashih();
      } else if (activeTab === 'ujian') {
        await loadUjian();
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      toast.error('Failed to load data');
    } finally {
      clearTimeout(timeoutId);
      console.log('=== Data load completed for tab:', activeTab, 'at', new Date().toISOString(), '===');
      setDataLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // This is a placeholder - you'll need to create the actual API endpoint
      // For now, we'll calculate stats from other data
      const response = await fetch('/api/musyrifah/stats');
      if (!response.ok) {
        // If API doesn't exist, set default values
        setStats({
          totalThalibah: 0,
          activeHalaqah: 0,
          pendingJurnalReview: 0,
          pendingTashihReview: 0,
          pendingUjianReview: 0,
          jurnal: {
            totalEntries: 0,
            uniqueThalibah: 0,
            thalibahWithJurnal: 0,
            thalibahWithoutJurnal: 0,
            averageEntriesPerThalibah: 0,
            weeksWithJurnal: 0,
            totalBlocksCompleted: 0,
            completionPercentage: 0,
            thisWeekEntries: 0,
          },
          tashih: {
            totalRecords: 0,
            uniqueThalibah: 0,
            thalibahWithTashih: 0,
            thalibahWithoutTashih: 0,
            averageRecordsPerThalibah: 0,
            totalBlocksCompleted: 0,
            totalBlocks: 0,
            completionPercentage: 0,
            thisWeekRecords: 0,
          },
        });
      } else {
        const result = await response.json();
        setStats(result.data || stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        totalThalibah: 0,
        activeHalaqah: 0,
        pendingJurnalReview: 0,
        pendingTashihReview: 0,
        pendingUjianReview: 0,
        jurnal: {
          totalEntries: 0,
          uniqueThalibah: 0,
          thalibahWithJurnal: 0,
          thalibahWithoutJurnal: 0,
          averageEntriesPerThalibah: 0,
          weeksWithJurnal: 0,
          totalBlocksCompleted: 0,
          completionPercentage: 0,
          thisWeekEntries: 0,
        },
        tashih: {
          totalRecords: 0,
          uniqueThalibah: 0,
          thalibahWithTashih: 0,
          thalibahWithoutTashih: 0,
          averageRecordsPerThalibah: 0,
          totalBlocksCompleted: 0,
          totalBlocks: 0,
          completionPercentage: 0,
          thisWeekRecords: 0,
        },
      });
    }
  };

  const loadThalibah = async () => {
    try {
      const response = await fetch('/api/musyrifah/thalibah');
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error loading thalibah');
        setThalibahList([]);
      } else {
        const result = await response.json();
        console.log(`Thalibah loaded: ${result.data?.length || 0} records`);
        setThalibahList(result.data || []);
      }
    } catch (error) {
      console.error('Error loading thalibah:', error);
      toast.error('Error loading thalibah');
      setThalibahList([]);
    }
  };

  const loadJurnal = async () => {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (selectedBlok !== 'all') {
        params.append('blok', selectedBlok);
      }
      if (selectedPekan !== 'all') {
        params.append('pekan', selectedPekan);
      }

      const response = await fetch(`/api/musyrifah/jurnal?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error loading jurnal');
        setJurnalEntries([]);
      } else {
        const result = await response.json();
        console.log(`Jurnal entries loaded: ${result.data?.length || 0} records`);
        setJurnalEntries(result.data || []);
        // Set available bloks from meta
        if (result.meta?.bloks) {
          setAvailableBloks(result.meta.bloks);
        }
      }
    } catch (error) {
      console.error('Error loading jurnal:', error);
      toast.error('Error loading jurnal');
      setJurnalEntries([]);
    }
  };

  const loadTashih = async () => {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (selectedTashihBlok !== 'all') {
        params.append('blok', selectedTashihBlok);
      }

      const response = await fetch(`/api/musyrifah/tashih?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error loading tashih');
        setTashihEntries([]);
      } else {
        const result = await response.json();
        console.log(`Tashih entries loaded: ${result.data?.length || 0} records`);
        setTashihEntries(result.data || []);
        // Set available bloks from meta
        if (result.meta?.bloks) {
          setAvailableTashihBloks(result.meta.bloks);
        }
      }
    } catch (error) {
      console.error('Error loading tashih:', error);
      toast.error('Error loading tashih');
      setTashihEntries([]);
    }
  };

  const loadUjian = async () => {
    try {
      const response = await fetch('/api/musyrifah/ujian');
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error loading ujian');
        setUjianResults([]);
      } else {
        const result = await response.json();
        console.log(`Ujian results loaded: ${result.data?.length || 0} records`);
        setUjianResults(result.data || []);
      }
    } catch (error) {
      console.error('Error loading ujian:', error);
      toast.error('Error loading ujian');
      setUjianResults([]);
    }
  };

  const tabs = [
    { id: 'overview' as TabType, name: 'Ringkasan', icon: BarChart3 },
    { id: 'thalibah' as TabType, name: 'Thalibah', icon: Users },
    { id: 'jurnal' as TabType, name: 'Jurnal Harian', icon: BookOpen },
    { id: 'tashih' as TabType, name: 'Catatan Tashih', icon: FileText },
    { id: 'ujian' as TabType, name: 'Ujian', icon: GraduationCap },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
          <p className="text-gray-600">Initializing Musyrifah Panel...</p>
          <p className="text-sm text-gray-500">Please wait while we prepare your workspace</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Musyrifah Header */}
      <div className="bg-white border-b border-gray-200 -m-6 mb-0 px-6 py-6 rounded-t-lg">
        <h1 className="text-3xl font-bold text-gray-900">Panel Musyrifah</h1>
        <p className="mt-2 text-sm text-gray-600">
          Pantau progress thalibah dan tinjau jurnal, tashih, serta ujian
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 -m-6 mb-0 px-6">
        <nav className="flex flex-wrap gap-x-4 sm:gap-x-6 lg:gap-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-green-900 text-green-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {dataLoading && (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
              <p className="text-sm text-gray-600">Loading data...</p>
            </div>
          </div>
        )}

        {!dataLoading && activeTab === 'overview' && (
          <OverviewTab stats={stats} />
        )}

        {!dataLoading && activeTab === 'thalibah' && (
          <ThalibahTab thalibah={thalibahList} onRefresh={loadThalibah} />
        )}

        {!dataLoading && activeTab === 'jurnal' && (
          <JurnalTab
            entries={jurnalEntries}
            onRefresh={loadJurnal}
            selectedBlok={selectedBlok}
            onBlokChange={setSelectedBlok}
            availableBloks={availableBloks}
          />
        )}

        {!dataLoading && activeTab === 'tashih' && (
          <TashihTab
            entries={tashihEntries}
            onRefresh={loadTashih}
            selectedBlok={selectedTashihBlok}
            onBlokChange={setSelectedTashihBlok}
            availableBloks={availableTashihBloks}
          />
        )}

        {!dataLoading && activeTab === 'ujian' && (
          <UjianTab results={ujianResults} onRefresh={loadUjian} />
        )}
      </div>
    </>
  );
}

// Overview Tab Component
function OverviewTab({ stats }: { stats: MusyrifahStats }) {
  const statCards = [
    { name: 'Total Thalibah', value: stats.totalThalibah, icon: Users, color: 'bg-blue-500' },
    { name: 'Halaqah Aktif', value: stats.activeHalaqah, icon: Eye, color: 'bg-purple-500' },
    { name: 'Jurnal Pending', value: stats.pendingJurnalReview, icon: BookOpen, color: 'bg-yellow-500' },
    { name: 'Tashih Pending', value: stats.pendingTashihReview, icon: FileText, color: 'bg-orange-500' },
    { name: 'Ujian Pending', value: stats.pendingUjianReview, icon: GraduationCap, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Selamat Datang di Panel Musyrifah</h2>
        <p className="text-green-100">
          Gunakan panel ini untuk memantau progress thalibah dan meninjau pekerjaan mereka.
        </p>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="text-3xl font-bold text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Jurnal Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Statistik Jurnal Harian</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">Total Entri</div>
            <div className="text-2xl font-bold text-blue-900">{stats.jurnal.totalEntries}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">Thalibah dengan Jurnal</div>
            <div className="text-2xl font-bold text-green-900">{stats.jurnal.thalibahWithJurnal}/{stats.totalThalibah}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 mb-1">Blok Selesai</div>
            <div className="text-2xl font-bold text-purple-900">{stats.jurnal.totalBlocksCompleted} blok</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="text-sm text-amber-600 mb-1">Progress</div>
            <div className="text-2xl font-bold text-amber-900">{stats.jurnal.completionPercentage}%</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          <span className="font-medium">Entri minggu ini:</span> {stats.jurnal.thisWeekEntries} |
          <span className="ml-4 font-medium">Thalibah tanpa jurnal:</span> {stats.jurnal.thalibahWithoutJurnal}
        </div>
      </div>

      {/* Tashih Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Statistik Tashih</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">Total Record</div>
            <div className="text-2xl font-bold text-blue-900">{stats.tashih.totalRecords}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">Thalibah dengan Tashih</div>
            <div className="text-2xl font-bold text-green-900">{stats.tashih.thalibahWithTashih}/{stats.totalThalibah}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 mb-1">Blok Selesai</div>
            <div className="text-2xl font-bold text-purple-900">{stats.tashih.totalBlocksCompleted}/{stats.tashih.totalBlocks}</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="text-sm text-amber-600 mb-1">Progress</div>
            <div className="text-2xl font-bold text-amber-900">{stats.tashih.completionPercentage}%</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          <span className="font-medium">Record minggu ini:</span> {stats.tashih.thisWeekRecords} |
          <span className="ml-4 font-medium">Thalibah tanpa tashih:</span> {stats.tashih.thalibahWithoutTashih}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Users className="h-5 w-5 mr-2 text-green-900" />
            Lihat Daftar Thalibah
          </button>
          <button className="flex items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <BookOpen className="h-5 w-5 mr-2 text-green-900" />
            Review Jurnal
          </button>
          <button className="flex items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <FileText className="h-5 w-5 mr-2 text-green-900" />
            Review Tashih
          </button>
          <button className="flex items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <GraduationCap className="h-5 w-5 mr-2 text-green-900" />
            Lihat Hasil Ujian
          </button>
        </div>
      </div>
    </div>
  );
}

// Thalibah Tab Component
function ThalibahTab({ thalibah, onRefresh }: { thalibah: Thalibah[], onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Daftar Thalibah</h2>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <AlertCircle className="w-5 h-5 mr-2" />
          Refresh
        </button>
      </div>

      {thalibah.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada thalibah</h3>
          <p className="mt-1 text-sm text-gray-500">Belum ada thalibah yang ditugaskan kepada Anda.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Halaqah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {thalibah.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.halaqah?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {t.tikrar_registrations && t.tikrar_registrations.length > 0 ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {t.tikrar_registrations[0].status}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Tidak aktif
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Jurnal Tab Component
interface JurnalTabProps {
  entries: JurnalUserEntry[]; // Changed to grouped entries like tashih
  onRefresh: () => void;
  selectedBlok: string;
  onBlokChange: (blok: string) => void;
  availableBloks: string[];
}

type SortField = 'name' | 'juz' | 'progress';
type SortOrder = 'asc' | 'desc';

function JurnalTab({ entries, onRefresh, selectedBlok, onBlokChange, availableBloks }: JurnalTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JurnalEntry | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const toggleRow = (userId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const displayName = (user: any) => {
    if (user?.full_name) return user.full_name;
    return '-';
  };

  const displayKunyah = (user: any) => {
    if (user?.nama_kunyah) return user.nama_kunyah;
    return null;
  };

  // Sort entries
  const sortedEntries = [...entries].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    if (sortBy === 'name') {
      const nameA = displayName(a.user).toLowerCase();
      const nameB = displayName(b.user).toLowerCase();
      return nameA.localeCompare(nameB) * multiplier;
    }

    if (sortBy === 'juz') {
      const juzA = a.confirmed_chosen_juz || '';
      const juzB = b.confirmed_chosen_juz || '';
      return juzA.localeCompare(juzB) * multiplier;
    }

    if (sortBy === 'progress') {
      const progressA = a.weeks_with_jurnal;
      const progressB = b.weeks_with_jurnal;
      return (progressA - progressB) * multiplier;
    }

    return 0;
  });

  // Helper to format WhatsApp link
  const formatWhatsAppLink = (phoneNumber: string | null, name: string, entry: JurnalUserEntry) => {
    if (!phoneNumber) return null;

    const cleanedPhone = phoneNumber.replace(/^0/, '62').replace(/[\s\-\(\)]/g, '');
    const weeksWithJurnal = entry.weeks_with_jurnal;
    const totalWeeks = entry.weekly_status.length;

    const message = `Assalamu'alaikum ${name},

Saya dari tim musyrifah Markaz Tikrar Indonesia. Terkait dengan progress jurnal harian:

- Total jurnal: ${entry.jurnal_count}
- Pekan dengan jurnal: ${weeksWithJurnal}/${totalWeeks}
- Terakhir jurnal: ${entry.latest_jurnal ? new Date(entry.latest_jurnal.tanggal_setor).toLocaleDateString('id-ID') : '-'}

${weeksWithJurnal < 10 ? 'Mohon ditingkatkan lagi jurnal hariannya.' : 'Alhamdulillah jurnal sudah lengkap.'}

Jazakillahu khairan
Tim Markaz Tikrar Indonesia`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
  };

  // Helper to render week cell - entries now already has weekly_status from API
  const renderJurnalWeekCell = (entry: JurnalUserEntry, weekNum: number) => {
    const week = entry.weekly_status.find((w: any) => w.week_number === weekNum);
    if (!week) {
      return <span className="text-gray-300">-</span>;
    }

    if (!week.has_jurnal) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 text-xs font-bold">
          -
        </span>
      );
    }

    const entryCount = week.entry_count;
    return (
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold"
        title={`${entryCount} jurnal entries`}
      >
        {entryCount}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Jurnal Harian Thalibah</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Jurnal
          </button>
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>


      {sortedEntries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada jurnal</h3>
          <p className="mt-1 text-sm text-gray-500">Belum ada jurnal harian dari thalibah.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        if (sortBy === 'name') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('name');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-gray-700 focus:outline-none"
                    >
                      Nama
                      {sortBy === 'name' && (
                        <ArrowUpDown className={`w-3 h-3 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        if (sortBy === 'juz') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('juz');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-gray-700 focus:outline-none"
                    >
                      Juz
                      {sortBy === 'juz' && (
                        <ArrowUpDown className={`w-3 h-3 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">WA</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P1</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P2</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P3</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P4</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P5</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P6</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P7</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P8</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P9</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P10</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEntries.map((userData) => {
                  const name = displayName(userData.user);
                  const kunyah = displayKunyah(userData.user);
                  const whatsappUrl = userData.user?.whatsapp ? formatWhatsAppLink(userData.user.whatsapp, name, userData) : null;
                  const isExpanded = expandedRows.has(userData.user_id);
                  // Get juz from confirmed_chosen_juz (same as tashih)
                  const juzCode = userData.confirmed_chosen_juz || null;

                  return (
                    <React.Fragment key={userData.user_id}>
                      <tr className={`hover:bg-gray-50 ${userData.jurnal_count === 0 ? 'bg-yellow-50' : ''}`}>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => toggleRow(userData.user_id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 transform rotate-180" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{name}</div>
                          {kunyah && (
                            <div className="text-xs text-gray-500 truncate max-w-[120px]">{kunyah}</div>
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                          {juzCode || '-'}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {whatsappUrl ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                              title="Chat via WhatsApp"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                            </a>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-400">
                              <X className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                        <td className="px-1 py-2 text-center">{renderJurnalWeekCell(userData, 1)}</td>
                        <td className="px-1 py-2 text-center">{renderJurnalWeekCell(userData, 2)}</td>
                        <td className="px-1 py-2 text-center">{renderJurnalWeekCell(userData, 3)}</td>
                        <td className="px-1 py-2 text-center">{renderJurnalWeekCell(userData, 4)}</td>
                        <td className="px-1 py-2 text-center">{renderJurnalWeekCell(userData, 5)}</td>
                        <td className="px-1 py-2 text-center">{renderJurnalWeekCell(userData, 6)}</td>
                        <td className="px-1 py-2 text-center">{renderJurnalWeekCell(userData, 7)}</td>
                        <td className="px-1 py-2 text-center">{renderJurnalWeekCell(userData, 8)}</td>
                        <td className="px-1 py-2 text-center">{renderJurnalWeekCell(userData, 9)}</td>
                        <td className="px-1 py-2 text-center">{renderJurnalWeekCell(userData, 10)}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {/* Could open detail modal */}}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleRow(userData.user_id)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Lihat Detail"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.has(userData.user_id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={13} className="px-4 py-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-700">Jurnal per Pekan (10 Pekan)</h4>
                              <span className="text-xs text-gray-500">Klik pekan untuk melihat detail jurnal</span>
                            </div>

                            {/* Weekly Jurnal Grid */}
                            <div className="space-y-3">
                              {userData.weekly_status.map((week: any) => {
                                if (!week.has_jurnal && week.entries.length === 0) {
                                  return (
                                    <div key={week.week_number} className="border border-dashed rounded-lg p-3 bg-gray-50">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">Pekan {week.week_number}</span>
                                        <span className="text-xs text-gray-400">Belum ada jurnal</span>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={week.week_number} className="border rounded-lg p-3 bg-white">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-700">Pekan {week.week_number}</span>
                                        <span className="text-xs text-gray-500">({week.entry_count} jurnal)</span>
                                      </div>
                                    </div>

                                    {/* Jurnal entries for this week */}
                                    <div className="space-y-2">
                                      {week.entries.map((entry: JurnalEntry) => (
                                        <div
                                          key={entry.id}
                                          className="border border-gray-200 rounded p-3 bg-white hover:bg-gray-50"
                                        >
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-3 text-sm">
                                                <span className="text-xs text-gray-500">
                                                  {new Date(entry.tanggal_setor).toLocaleDateString('id-ID')}
                                                </span>
                                                {entry.blok && (
                                                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">
                                                    {entry.blok}
                                                  </span>
                                                )}
                                                {entry.juz_code && (
                                                  <span className="text-xs text-gray-600">
                                                    Juz {entry.juz_code}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="mt-2 grid grid-cols-10 gap-2 text-xs">
                                                <span className={entry.tashih_completed ? 'text-green-600' : 'text-gray-400'}>
                                                  T: {entry.tashih_completed ? '✓' : '-'}
                                                </span>
                                                <span className={entry.rabth_completed ? 'text-green-600' : 'text-gray-400'}>
                                                  R: {entry.rabth_completed ? '✓' : '-'}
                                                </span>
                                                <span className={entry.murajaah_count > 0 ? 'text-green-600' : 'text-gray-400'}>
                                                  M: {entry.murajaah_count}
                                                </span>
                                                <span className={entry.simak_murattal_count > 0 ? 'text-green-600' : 'text-gray-400'}>
                                                  SM: {entry.simak_murattal_count}
                                                </span>
                                                <span className={entry.tikrar_bi_an_nadzar_completed ? 'text-green-600' : 'text-gray-400'}>
                                                  TN: {entry.tikrar_bi_an_nadzar_completed ? '✓' : '-'}
                                                </span>
                                                <span className={entry.tasmi_record_count > 0 ? 'text-green-600' : 'text-gray-400'}>
                                                  TR: {entry.tasmi_record_count}
                                                </span>
                                                <span className={entry.tikrar_bi_al_ghaib_count > 0 ? 'text-green-600' : 'text-gray-400'}>
                                                  TG: {entry.tikrar_bi_al_ghaib_count}
                                                </span>
                                                <span className={entry.tafsir_completed ? 'text-green-600' : 'text-gray-400'}>
                                                  TF: {entry.tafsir_completed ? '✓' : '-'}
                                                </span>
                                                <span className={entry.menulis_completed ? 'text-green-600' : 'text-gray-400'}>
                                                  W: {entry.menulis_completed ? '✓' : '-'}
                                                </span>
                                              </div>
                                              {entry.catatan_tambahan && (
                                                <div className="mt-1 text-xs text-gray-600">
                                                  Catatan: {entry.catatan_tambahan}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex gap-1">
                                              <button
                                                onClick={() => {
                                                  setEditingEntry(entry);
                                                  setShowEditModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                                title="Edit"
                                              >
                                                <Edit className="w-3 h-3" />
                                              </button>
                                              <button
                                                onClick={async () => {
                                                  // Parse blok - check if it's JSON array or comma-separated
                                                  let bloks: string[] = [];
                                                  if (entry.blok) {
                                                    if (typeof entry.blok === 'string' && entry.blok.startsWith('[')) {
                                                      try {
                                                        bloks = JSON.parse(entry.blok);
                                                      } catch {
                                                        bloks = entry.blok.split(',').map((b: string) => b.trim()).filter((b: string) => b);
                                                      }
                                                    } else if (typeof entry.blok === 'string') {
                                                      bloks = entry.blok.split(',').map((b: string) => b.trim()).filter((b: string) => b);
                                                    } else if (Array.isArray(entry.blok)) {
                                                      bloks = entry.blok;
                                                    }
                                                  }

                                                  const blockCount = bloks.length;
                                                  const blockList = bloks.join(', ');
                                                  const entryDate = new Date(entry.tanggal_setor).toLocaleDateString('id-ID');

                                                  if (blockCount > 1) {
                                                    // Multiple blocks - ask which block to delete
                                                    const blockToDelete = prompt(`Hapus blok dari record jurnal ini?\n\nTanggal: ${entryDate}\nBlok dalam record ini: ${blockList}\n\nMasukkan nama blok yang ingin dihapus (contoh: H1A):`);

                                                    if (blockToDelete && bloks.includes(blockToDelete)) {
                                                      try {
                                                        const newBlok = bloks.filter((b: string) => b !== blockToDelete);
                                                        const response = await fetch('/api/musyrifah/jurnal', {
                                                          method: 'PUT',
                                                          headers: { 'Content-Type': 'application/json' },
                                                          body: JSON.stringify({
                                                            id: entry.id,
                                                            blok: newBlok.length > 0 ? JSON.stringify(newBlok) : null
                                                          }),
                                                        });

                                                        if (!response.ok) {
                                                          const error = await response.json();
                                                          toast.error(error.error || 'Gagal menghapus blok');
                                                          return;
                                                        }

                                                        toast.success(`Blok ${blockToDelete} berhasil dihapus dari record`);
                                                        onRefresh();
                                                      } catch (err) {
                                                        toast.error('Gagal menghapus blok');
                                                      }
                                                    } else if (blockToDelete) {
                                                      toast.error('Blok tidak ditemukan dalam record');
                                                    }
                                                  } else {
                                                    // Single block - delete entire record
                                                    if (confirm(`Hapus record jurnal ini?\n\nBlok: ${blockList || '-'}\nTanggal: ${entryDate}`)) {
                                                      try {
                                                        const response = await fetch(`/api/musyrifah/jurnal?id=${entry.id}`, {
                                                          method: 'DELETE',
                                                        });

                                                        if (!response.ok) {
                                                          const error = await response.json();
                                                          toast.error(error.error || 'Gagal menghapus jurnal');
                                                          return;
                                                        }

                                                        toast.success('Jurnal berhasil dihapus');
                                                        onRefresh();
                                                      } catch (err) {
                                                        toast.error('Gagal menghapus jurnal');
                                                      }
                                                    }
                                                  }
                                                }}
                                                className="text-red-600 hover:text-red-900 p-1"
                                                title="Hapus"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Summary */}
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <div className="grid grid-cols-5 gap-4 text-xs">
                                <div>
                                  <span className="text-gray-500">Total Jurnal:</span>
                                  <span className="ml-2 font-medium text-gray-900">{userData.jurnal_count}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Pekan dengan Jurnal:</span>
                                  <span className="ml-2 font-medium text-green-600">{userData.weeks_with_jurnal}/10</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Pekan Kosong:</span>
                                  <span className="ml-2 font-medium text-yellow-600">{10 - userData.weeks_with_jurnal}/10</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Juz Terakhir:</span>
                                  <span className="ml-2 font-medium text-gray-900">{userData.latest_jurnal?.juz_code || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Terakhir Jurnal:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {userData.latest_jurnal
                                      ? new Date(userData.latest_jurnal.tanggal_setor).toLocaleDateString('id-ID')
                                      : '-'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* All Jurnal Records - Delete Excess Records */}
                            {userData.jurnal_records.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                  Riwayat Jurnal ({userData.jurnal_records.length} record) - Hapus yang kelebihan
                                </h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {userData.jurnal_records.map((record) => {
                                    const bloks = typeof record.blok === 'string' && record.blok.startsWith('[')
                                      ? JSON.parse(record.blok)
                                      : (record.blok ? [record.blok] : []);

                                    return (
                                      <div
                                        key={record.id}
                                        className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-red-300 transition-colors"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs text-gray-900">
                                            {new Date(record.tanggal_setor).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric'
                                            })}
                                          </div>
                                          <div className="text-xs text-gray-500 truncate">
                                            Blok: {bloks.join(', ') || '-'} | Juz: {record.juz_code || '-'}
                                          </div>
                                        </div>
                                        <button
                                          onClick={async () => {
                                            if (confirm(`Hapus record jurnal ini?\n\nBlok: ${bloks.join(', ')}\nTanggal: ${new Date(record.tanggal_setor).toLocaleDateString('id-ID')}`)) {
                                              try {
                                                const response = await fetch(`/api/musyrifah/jurnal?id=${record.id}`, {
                                                  method: 'DELETE',
                                                });

                                                if (!response.ok) {
                                                  const error = await response.json();
                                                  toast.error(error.error || 'Gagal menghapus record');
                                                  return;
                                                }

                                                toast.success('Record jurnal berhasil dihapus');
                                                onRefresh();
                                              } catch (err) {
                                                toast.error('Gagal menghapus record');
                                              }
                                            }
                                          }}
                                          className="text-red-600 hover:text-red-800 text-xs px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors"
                                          title="Hapus record ini"
                                        >
                                          Hapus
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      )}
                  </React.Fragment>
                );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Jurnal Baru</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  user_id: formData.get('user_id') as string,
                  tanggal_jurnal: formData.get('tanggal_jurnal') as string,
                  tanggal_setor: formData.get('tanggal_setor') as string,
                  juz_code: formData.get('juz_code') as string,
                  blok: formData.get('blok') as string,
                  pekan: formData.get('pekan') ? Number(formData.get('pekan')) : null,
                  total_duration_minutes: formData.get('total_duration_minutes') ? Number(formData.get('total_duration_minutes')) : 0,
                  tashih_completed: formData.get('tashih_completed') === 'true',
                  rabth_completed: formData.get('rabth_completed') === 'true',
                  murajaah_count: formData.get('murajaah_count') ? Number(formData.get('murajaah_count')) : 0,
                  simak_murattal_count: formData.get('simak_murattal_count') ? Number(formData.get('simak_murattal_count')) : 0,
                  tikrar_bi_an_nadzar_completed: formData.get('tikrar_bi_an_nadzar_completed') === 'true',
                  tasmi_record_count: formData.get('tasmi_record_count') ? Number(formData.get('tasmi_record_count')) : 0,
                  simak_record_completed: formData.get('simak_record_completed') === 'true',
                  tikrar_bi_al_ghaib_count: formData.get('tikrar_bi_al_ghaib_count') ? Number(formData.get('tikrar_bi_al_ghaib_count')) : 0,
                  tafsir_completed: formData.get('tafsir_completed') === 'true',
                  menulis_completed: formData.get('menulis_completed') === 'true',
                  catatan_tambahan: formData.get('catatan_tambahan') as string || null,
                };

                try {
                  const response = await fetch('/api/musyrifah/jurnal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });

                  if (!response.ok) {
                    const error = await response.json();
                    toast.error(error.error || 'Gagal menambah jurnal');
                    return;
                  }

                  toast.success('Jurnal berhasil ditambahkan');
                  setShowCreateModal(false);
                  onRefresh();
                } catch (err) {
                  toast.error('Gagal menambah jurnal');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID *</label>
                <input
                  type="text"
                  name="user_id"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                  placeholder="Masukkan UUID user"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Jurnal</label>
                  <input
                    type="date"
                    name="tanggal_jurnal"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Setor</label>
                  <input
                    type="date"
                    name="tanggal_setor"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Juz</label>
                  <input
                    type="text"
                    name="juz_code"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                    placeholder="1, 2, 30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Blok</label>
                  <input
                    type="text"
                    name="blok"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                    placeholder="1, 2, 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pekan</label>
                  <input
                    type="number"
                    name="pekan"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                    placeholder="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Durasi (menit)</label>
                <input
                  type="number"
                  name="total_duration_minutes"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                  placeholder="60"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Murajaah Count</label>
                  <input type="number" name="murajaah_count" defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Simak Murattal Count</label>
                  <input type="number" name="simak_murattal_count" defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Catatan Tambahan</label>
                <textarea
                  name="catatan_tambahan"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                  placeholder="Catatan tambahan..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Jurnal</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  id: editingEntry.id,
                  tanggal_jurnal: formData.get('tanggal_jurnal') as string,
                  tanggal_setor: formData.get('tanggal_setor') as string,
                  juz_code: formData.get('juz_code') as string,
                  blok: formData.get('blok') as string,
                  pekan: formData.get('pekan') ? Number(formData.get('pekan')) : null,
                  total_duration_minutes: formData.get('total_duration_minutes') ? Number(formData.get('total_duration_minutes')) : 0,
                  tashih_completed: formData.get('tashih_completed') === 'true',
                  rabth_completed: formData.get('rabth_completed') === 'true',
                  murajaah_count: formData.get('murajaah_count') ? Number(formData.get('murajaah_count')) : 0,
                  simak_murattal_count: formData.get('simak_murattal_count') ? Number(formData.get('simak_murattal_count')) : 0,
                  tikrar_bi_an_nadzar_completed: formData.get('tikrar_bi_an_nadzar_completed') === 'true',
                  tasmi_record_count: formData.get('tasmi_record_count') ? Number(formData.get('tasmi_record_count')) : 0,
                  simak_record_completed: formData.get('simak_record_completed') === 'true',
                  tikrar_bi_al_ghaib_count: formData.get('tikrar_bi_al_ghaib_count') ? Number(formData.get('tikrar_bi_al_ghaib_count')) : 0,
                  tafsir_completed: formData.get('tafsir_completed') === 'true',
                  menulis_completed: formData.get('menulis_completed') === 'true',
                  catatan_tambahan: formData.get('catatan_tambahan') as string || null,
                };

                try {
                  const response = await fetch('/api/musyrifah/jurnal', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });

                  if (!response.ok) {
                    const error = await response.json();
                    toast.error(error.error || 'Gagal mengupdate jurnal');
                    return;
                  }

                  toast.success('Jurnal berhasil diupdate');
                  setShowEditModal(false);
                  setEditingEntry(null);
                  onRefresh();
                } catch (err) {
                  toast.error('Gagal mengupdate jurnal');
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Jurnal</label>
                  <input
                    type="date"
                    name="tanggal_jurnal"
                    defaultValue={editingEntry.tanggal_jurnal?.split('T')[0]}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Setor</label>
                  <input
                    type="date"
                    name="tanggal_setor"
                    defaultValue={editingEntry.tanggal_setor?.split('T')[0]}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Juz</label>
                  <input
                    type="text"
                    name="juz_code"
                    defaultValue={editingEntry.juz_code || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Blok</label>
                  <input
                    type="text"
                    name="blok"
                    defaultValue={editingEntry.blok || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pekan</label>
                  <input
                    type="number"
                    name="pekan"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Durasi (menit)</label>
                <input
                  type="number"
                  name="total_duration_minutes"
                  defaultValue={editingEntry.total_duration_minutes || 0}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Murajaah Count</label>
                  <input type="number" name="murajaah_count" defaultValue={editingEntry.murajaah_count || 0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Simak Murattal Count</label>
                  <input type="number" name="simak_murattal_count" defaultValue={editingEntry.simak_murattal_count || 0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Catatan Tambahan</label>
                <textarea
                  name="catatan_tambahan"
                  rows={3}
                  defaultValue={editingEntry.catatan_tambahan || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-900 focus:ring-green-900 border p-2"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEntry(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Tashih Tab Component
interface TashihTabProps {
  entries: TashihEntry[];
  onRefresh: () => void;
  selectedBlok: string;
  onBlokChange: (blok: string) => void;
  availableBloks: string[];
}

function TashihTab({ entries, onRefresh, selectedBlok, onBlokChange, availableBloks }: TashihTabProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const toggleRow = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const displayName = (entry: TashihEntry) => {
    if (entry.user?.full_name) return entry.user.full_name;
    return '-';
  };

  const displayKunyah = (entry: TashihEntry) => {
    if (entry.user?.nama_kunyah) return entry.user.nama_kunyah;
    return null;
  };

  // Sort entries
  const sortedEntries = [...entries].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    if (sortBy === 'name') {
      const nameA = displayName(a).toLowerCase();
      const nameB = displayName(b).toLowerCase();
      return nameA.localeCompare(nameB) * multiplier;
    }

    if (sortBy === 'juz') {
      const juzA = a.confirmed_chosen_juz || '';
      const juzB = b.confirmed_chosen_juz || '';
      return juzA.localeCompare(juzB) * multiplier;
    }

    if (sortBy === 'progress') {
      const progressA = a.summary.completion_percentage;
      const progressB = b.summary.completion_percentage;
      return (progressA - progressB) * multiplier;
    }

    return 0;
  });

  const formatWhatsAppLink = (phoneNumber: string | null, name: string, entry: TashihEntry) => {
    if (!phoneNumber) return null;

    const cleanedPhone = phoneNumber.replace(/^0/, '62').replace(/[\s\-\(\)]/g, '');
    const completedWeeks = entry.weekly_status.filter(w => w.is_completed).length;
    const totalWeeks = entry.weekly_status.length;

    const message = `Assalamu'alaikum ${name},

Saya dari tim musyrifah Markaz Tikrar Indonesia. Terkait dengan progress tashih:

- Juz: ${entry.confirmed_chosen_juz}
- Progress: ${entry.summary.completed_blocks}/${entry.summary.total_blocks} blok (${entry.summary.completion_percentage}%)
- Pekan selesai: ${completedWeeks}/${totalWeeks}

${entry.summary.completion_percentage < 100 ? 'Mohon ditingkatkan lagi progress tashihnya.' : 'Alhamdulillah progress sudah lengkap.'}

Jazakillahu khairan
Tim Markaz Tikrar Indonesia`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Catatan Tashih</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {/* TODO: Implement add tashih */}}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Tashih
          </button>
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>


      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data thalibah</h3>
          <p className="mt-1 text-sm text-gray-500">Belum ada thalibah yang terdaftar di daftar ulang (approved/submitted).</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        if (sortBy === 'name') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('name');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-gray-700 focus:outline-none"
                    >
                      Nama
                      {sortBy === 'name' && (
                        <ArrowUpDown className={`w-3 h-3 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        if (sortBy === 'juz') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('juz');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-gray-700 focus:outline-none"
                    >
                      Juz
                      {sortBy === 'juz' && (
                        <ArrowUpDown className={`w-3 h-3 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">WA</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P1</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P2</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P3</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P4</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P5</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P6</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P7</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P8</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P9</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">P10</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEntries.map((entry) => {
                  const name = displayName(entry);
                  const kunyah = displayKunyah(entry);
                  const whatsappUrl = entry.user?.whatsapp ? formatWhatsAppLink(entry.user.whatsapp, name, entry) : null;
                  const isExpanded = expandedRows.has(entry.user_id);
                  const completedWeeks = entry.weekly_status.filter(w => w.is_completed).length;

                  // Helper to get incomplete blocks for a week
                  const getIncompleteBlocks = (weekNum: number): string[] => {
                    const week = entry.weekly_status.find(w => w.week_number === weekNum);
                    if (!week) return [];
                    return week.blocks.filter(b => !b.is_completed).map(b => b.block_code);
                  };

                  // Helper to render week cell
                  const renderWeekCell = (weekNum: number) => {
                    const week = entry.weekly_status.find(w => w.week_number === weekNum);
                    if (!week) return <span className="text-gray-300">-</span>;

                    const incomplete = getIncompleteBlocks(weekNum);
                    const completedCount = week.total_blocks - incomplete.length;

                    if (incomplete.length === 0) {
                      return (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          ✓
                        </span>
                      );
                    }

                    if (incomplete.length === week.total_blocks) {
                      return (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 text-xs font-bold" title={incomplete.join(', ')}>
                          0/4
                        </span>
                      );
                    }

                    return (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold" title={incomplete.join(', ')}>
                        {completedCount}/4
                      </span>
                    );
                  };

                  return (
                    <React.Fragment key={entry.user_id}>
                      <tr className={`hover:bg-gray-50 ${!entry.has_tashih ? 'bg-yellow-50' : ''}`}>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => toggleRow(entry.user_id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 transform rotate-180" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{name}</div>
                          {kunyah && (
                            <div className="text-xs text-gray-500 truncate max-w-[120px]">{kunyah}</div>
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                          {entry.confirmed_chosen_juz || '-'}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {whatsappUrl ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                              title="Chat via WhatsApp"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                            </a>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-400">
                              <X className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                        <td className="px-1 py-2 text-center">{renderWeekCell(1)}</td>
                        <td className="px-1 py-2 text-center">{renderWeekCell(2)}</td>
                        <td className="px-1 py-2 text-center">{renderWeekCell(3)}</td>
                        <td className="px-1 py-2 text-center">{renderWeekCell(4)}</td>
                        <td className="px-1 py-2 text-center">{renderWeekCell(5)}</td>
                        <td className="px-1 py-2 text-center">{renderWeekCell(6)}</td>
                        <td className="px-1 py-2 text-center">{renderWeekCell(7)}</td>
                        <td className="px-1 py-2 text-center">{renderWeekCell(8)}</td>
                        <td className="px-1 py-2 text-center">{renderWeekCell(9)}</td>
                        <td className="px-1 py-2 text-center">{renderWeekCell(10)}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {/* Open detail modal */}}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="Detail Blok"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleRow(entry.user_id)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Lihat Detail"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={14} className="px-4 py-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-700">Status Blok per Pekan (10 Pekan)</h4>
                                <span className="text-xs text-gray-500">Klik blok untuk melihat detail</span>
                              </div>

                              {/* Block Grid with Detail per Blok */}
                              <div className="space-y-3">
                                {entry.weekly_status.map((week) => {
                                  const incompleteBlocks = week.blocks.filter(b => !b.is_completed);
                                  const completedBlocks = week.blocks.filter(b => b.is_completed);

                                  return (
                                    <div key={week.week_number} className="border rounded-lg p-3 bg-white">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-gray-700">Pekan {week.week_number}</span>
                                          <span className="text-xs text-gray-500">({week.completed_blocks}/4 selesai)</span>
                                        </div>
                                        {week.is_completed && (
                                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                            Selesai
                                          </span>
                                        )}
                                      </div>

                                      {/* Blocks for this week */}
                                      <div className="grid grid-cols-4 gap-2">
                                        {week.blocks.map((block) => {
                                          const recordForBlock = entry.tashih_records.find((r: any) => {
                                            const bloks = typeof r.blok === 'string'
                                              ? r.blok.split(',').map((b: string) => b.trim()).filter((b: string) => b)
                                              : (Array.isArray(r.blok) ? r.blok : []);
                                            return bloks.includes(block.block_code);
                                          });

                                          return (
                                            <div
                                              key={block.block_code}
                                              className={`text-center p-2 rounded-lg border-2 transition-all ${
                                                block.is_completed
                                                  ? 'border-green-400 bg-green-50 text-green-700'
                                                  : 'border-gray-200 bg-white text-gray-600 hover:border-red-300'
                                              }`}
                                              title={block.is_completed
                                                ? `Sudah ditashih`
                                                : `Belum ditashih`
                                              }
                                            >
                                              <div className="text-xs font-bold">{block.block_code}</div>
                                              <div className="text-[10px] text-gray-500 mt-1">
                                                {block.is_completed ? 'Selesai' : 'Belum'}
                                              </div>
                                              {block.is_completed && recordForBlock && (
                                                <button
                                                  onClick={async () => {
                                                    if (confirm(`Hapus blok ${block.block_code} dari record tashih ini?\n\nTanggal: ${new Date(recordForBlock.waktu_tashih).toLocaleDateString('id-ID')}\nBlok dalam record ini: ${typeof recordForBlock.blok === 'string' ? recordForBlock.blok : recordForBlock.blok?.join(', ')}`)) {
                                                      try {
                                                        // If record has multiple blocks, remove only this block
                                                        const bloks = typeof recordForBlock.blok === 'string'
                                                          ? recordForBlock.blok.split(',').map((b: string) => b.trim()).filter((b: string) => b)
                                                          : (Array.isArray(recordForBlock.blok) ? recordForBlock.blok : []);

                                                        if (bloks.length > 1) {
                                                          // Update record to remove this block
                                                          const newBlok = bloks.filter((b: string) => b !== block.block_code).join(',');
                                                          const response = await fetch('/api/musyrifah/tashih', {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                              id: recordForBlock.id,
                                                              blok: newBlok
                                                            }),
                                                          });

                                                          if (!response.ok) {
                                                            const error = await response.json();
                                                            toast.error(error.error || 'Gagal menghapus blok');
                                                            return;
                                                          }

                                                          toast.success(`Blok ${block.block_code} berhasil dihapus dari record`);
                                                        } else {
                                                          // Delete entire record if this is the only block
                                                          const response = await fetch(`/api/musyrifah/tashih?id=${recordForBlock.id}`, {
                                                            method: 'DELETE',
                                                          });

                                                          if (!response.ok) {
                                                            const error = await response.json();
                                                            toast.error(error.error || 'Gagal menghapus record');
                                                            return;
                                                          }

                                                          toast.success(`Record tashih untuk ${block.block_code} berhasil dihapus`);
                                                        }

                                                        onRefresh();
                                                      } catch (err) {
                                                        toast.error('Gagal menghapus blok');
                                                      }
                                                    }
                                                  }}
                                                  className="mt-1 text-red-600 hover:text-red-800 text-[10px] underline"
                                                  title="Hapus blok ini"
                                                >
                                                  Hapus
                                                </button>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Show which blocks are incomplete */}
                                      {incompleteBlocks.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                          <span className="text-xs text-red-600">
                                            Belum disetor: {incompleteBlocks.map(b => b.block_code).join(', ')}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Summary */}
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <div className="grid grid-cols-5 gap-4 text-xs">
                                  <div>
                                    <span className="text-gray-500">Total Blok:</span>
                                    <span className="ml-2 font-medium text-gray-900">{entry.summary.total_blocks}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Selesai:</span>
                                    <span className="ml-2 font-medium text-green-600">{entry.summary.completed_blocks}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Pending:</span>
                                    <span className="ml-2 font-medium text-yellow-600">{entry.summary.pending_blocks}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Pekan Selesai:</span>
                                    <span className="ml-2 font-medium text-gray-900">{completedWeeks}/10</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Terakhir Tashih:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                      {entry.latest_tashih
                                        ? new Date(entry.latest_tashih.waktu_tashih).toLocaleDateString('id-ID')
                                        : '-'
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* All Tashih Records - Delete Excess Records */}
                              {entry.tashih_records.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                                    Riwayat Tashih ({entry.tashih_records.length} record) - Hapus yang kelebihan
                                  </h4>
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {entry.tashih_records.map((record) => {
                                      const bloks = typeof record.blok === 'string'
                                        ? record.blok.split(',').map((b: string) => b.trim()).filter((b: string) => b)
                                        : (Array.isArray(record.blok) ? record.blok : []);

                                      return (
                                        <div
                                          key={record.id}
                                          className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-red-300 transition-colors"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs text-gray-900">
                                              {new Date(record.waktu_tashih).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                              })}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                              Blok: {bloks.join(', ') || '-'} | {record.nama_pemeriksa || '-'}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {record.jumlah_kesalahan_tajwid !== null && (
                                              <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded">
                                                {record.jumlah_kesalahan_tajwid} error
                                              </span>
                                            )}
                                            <button
                                              onClick={async () => {
                                                if (confirm(`Hapus record tashih ini?\n\nBlok: ${bloks.join(', ')}\nTanggal: ${new Date(record.waktu_tashih).toLocaleDateString('id-ID')}`)) {
                                                  try {
                                                    const response = await fetch(`/api/musyrifah/tashih?id=${record.id}`, {
                                                      method: 'DELETE',
                                                    });

                                                    if (!response.ok) {
                                                      const error = await response.json();
                                                      toast.error(error.error || 'Gagal menghapus record');
                                                      return;
                                                    }

                                                    toast.success('Record tashih berhasil dihapus');
                                                    onRefresh();
                                                  } catch (err) {
                                                    toast.error('Gagal menghapus record');
                                                  }
                                                }
                                              }}
                                              className="text-red-600 hover:text-red-900 p-1"
                                              title="Hapus record ini"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Ujian Tab Component
function UjianTab({ results, onRefresh }: { results: UjianResult[], onRefresh: () => void }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (thalibahId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(thalibahId)) {
      newExpanded.delete(thalibahId);
    } else {
      newExpanded.add(thalibahId);
    }
    setExpandedRows(newExpanded);
  };

  const displayName = (result: UjianResult) => {
    if (result.thalibah?.full_name) return result.thalibah.full_name;
    if (result.thalibah?.nama_kunyah) return result.thalibah.nama_kunyah;
    return 'Tanpa nama';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Hasil Ujian Thalibah</h2>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <AlertCircle className="w-5 h-5 mr-2" />
          Refresh
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada hasil ujian</h3>
          <p className="mt-1 text-sm text-gray-500">Belum ada hasil ujian dari thalibah.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juz Pilihan</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <React.Fragment key={result.thalibah_id}>
                  <tr
                    onClick={() => toggleRow(result.thalibah_id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-2 py-3">
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          expandedRows.has(result.thalibah_id) ? 'rotate-0' : '-rotate-90'
                        }`}
                      />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {displayName(result)}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                      {result.thalibah?.confirmed_chosen_juz || '-'}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          {result.summary?.passed_attempts || 0}/{result.summary?.unique_juz_count || 0} juz lulus
                        </span>
                        {result.summary && (
                          <span className="text-xs text-gray-500">
                            ({result.summary.total_attempts || 0} percobaan)
                        </span>
                      )}
                    </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (result.summary?.passed_attempts || 0) > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {(result.summary?.passed_attempts || 0) > 0 ? 'Ada lulus' : 'Belum lulus'}
                      </span>
                    </td>
                  </tr>
                  {expandedRows.has(result.thalibah_id) && (
                    <tr key={`detail-${result.thalibah_id}`}>
                      <td colSpan={5} className="px-2 py-4 bg-gray-50">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-gray-700">Detail Ujian:</span>
                            <span className="text-xs text-gray-500">{displayName(result)}</span>
                          </div>

                          {/* Show all attempts grouped by juz */}
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Juz</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nilai</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {result.attempts.map((attempt) => (
                                  <tr key={attempt.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      Juz {attempt.juz_number}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {attempt.score}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        attempt.status === 'passed'
                                          ? 'bg-green-100 text-green-800'
                                          : attempt.status === 'failed'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {attempt.status === 'passed' ? 'Lulus' : attempt.status === 'failed' ? 'Gagal' : attempt.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                      {new Date(attempt.submitted_at || attempt.created_at).toLocaleDateString('id-ID')}
                                    </td>
                                  </tr>
                                ))}
                                {result.attempts.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                                      Tidak ada data ujian
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
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
      )}
    </div>
  );
}
