'use client';

import { useState, useEffect } from 'react';
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

interface TashihEntry {
  id: string;
  user_id: string;
  blok: string;
  lokasi: string;
  lokasi_detail: string | null;
  nama_pemeriksa: string | null;
  masalah_tajwid: any[]; // JSONB array
  catatan_tambahan: string | null;
  waktu_tashih: string;
  created_at: string;
  updated_at: string;
  ustadzah_id: string | null;
  jumlah_kesalahan_tajwid: number | null;
  user?: {
    id: string;
    full_name: string | null;
    nama_kunyah: string | null;
    whatsapp: string | null;
  };
}

interface UjianResult {
  id: string;
  thalibah_id: string;
  juz_number: number;
  score: number;
  status: string;
  submitted_at: string;
  thalibah?: {
    full_name: string;
  };
}

interface MusyrifahStats {
  totalThalibah: number;
  activeHalaqah: number;
  pendingJurnalReview: number;
  pendingTashihReview: number;
  pendingUjianReview: number;
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
  });
  const [thalibahList, setThalibahList] = useState<Thalibah[]>([]);
  const [jurnalEntries, setJurnalEntries] = useState<JurnalEntry[]>([]);
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

      {/* Stats Cards */}
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
  entries: JurnalEntry[];
  onRefresh: () => void;
  selectedBlok: string;
  onBlokChange: (blok: string) => void;
  availableBloks: string[];
}

function JurnalTab({ entries, onRefresh, selectedBlok, onBlokChange, availableBloks }: JurnalTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JurnalEntry | null>(null);

  const displayName = (entry: JurnalEntry) => {
    if (entry.user?.nama_kunyah) return entry.user.nama_kunyah;
    if (entry.user?.full_name) return entry.user.full_name;
    return '-';
  };

  const displayWhatsApp = (entry: JurnalEntry) => {
    if (entry.user?.whatsapp) return entry.user.whatsapp;
    return '-';
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

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Blok:</label>
            <select
              value={selectedBlok}
              onChange={(e) => onBlokChange(e.target.value)}
              className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-900 focus:border-green-900 sm:text-sm rounded-md"
            >
              <option value="all">Semua</option>
              {availableBloks.map((blok) => (
                <option key={blok} value={blok}>{blok}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada jurnal</h3>
          <p className="mt-1 text-sm text-gray-500">Belum ada jurnal harian dari thalibah yang terdaftar di daftar ulang (approved/submitted).</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama / Nama Kunyah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Setor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi (menit)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{displayName(entry)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{displayWhatsApp(entry)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.tanggal_setor).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {entry.blok || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.juz_code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.total_duration_minutes || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setShowEditModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) {
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
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
  const displayName = (entry: TashihEntry) => {
    if (entry.user?.nama_kunyah) return entry.user.nama_kunyah;
    if (entry.user?.full_name) return entry.user.full_name;
    return '-';
  };

  const formatWhatsAppLink = (phoneNumber: string | null, name: string) => {
    if (!phoneNumber) return null;

    // Clean the phone number - remove +, spaces, dashes, etc
    const cleanedPhone = phoneNumber.replace(/^0/, '62').replace(/[\s\-\(\)]/g, '');

    const message = `Assalamu'alaikum ${name},

Saya dari tim musyrifah Markaz Tikrar Indonesia. Terkait dengan hasil tashih yang telah dilakukan:

- Blok: ${entries[0]?.blok || '-'}
- Jumlah kesalahan tajwid: ${entries[0]?.jumlah_kesalahan_tajwid || '0'}

Mohon dapat diperbaiki dan dilanjutkan.

Jazakillahu khairan
Tim Markaz Tikrar Indonesia`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;

    return whatsappUrl;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Catatan Tashih</h2>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <AlertCircle className="w-5 h-5 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Blok:</label>
            <select
              value={selectedBlok}
              onChange={(e) => onBlokChange(e.target.value)}
              className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-900 focus:border-green-900 sm:text-sm rounded-md"
            >
              <option value="all">Semua</option>
              {availableBloks.map((blok) => (
                <option key={blok} value={blok}>{blok}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada catatan tashih</h3>
          <p className="mt-1 text-sm text-gray-500">Belum ada catatan tashih dari thalibah yang terdaftar di daftar ulang (approved/submitted).</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama / Nama Kunyah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Tashih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jml Kesalahan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemeriksa</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => {
                  const name = displayName(entry);
                  const whatsappUrl = entry.user?.whatsapp ? formatWhatsAppLink(entry.user.whatsapp, name) : null;

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {whatsappUrl ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 hover:text-green-800 font-medium"
                          >
                            {entry.user?.whatsapp}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {entry.blok}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.lokasi}
                        {entry.lokasi_detail && ` - ${entry.lokasi_detail}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.waktu_tashih).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.jumlah_kesalahan_tajwid ?? 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.nama_pemeriksa || entry.ustadzah_id || '-'}
                      </td>
                    </tr>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.thalibah?.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.juz_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.score}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      result.status === 'passed' ? 'bg-green-100 text-green-800' :
                      result.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(result.submitted_at).toLocaleDateString('id-ID')}
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
