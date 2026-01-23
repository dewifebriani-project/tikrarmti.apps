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
  thalibah_id: string;
  tanggal: string;
  juz: number;
  halaman_mulai: number;
  halaman_selesai: number;
  catatan: string;
  created_at: string;
  thalibah?: {
    full_name: string;
  };
}

interface TashihEntry {
  id: string;
  thalibah_id: string;
  tanggal_tashih: string;
  jenis_kesalahan: string;
  ayat: string;
  keterangan: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  thalibah?: {
    full_name: string;
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
      const response = await fetch('/api/musyrifah/jurnal');
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error loading jurnal');
        setJurnalEntries([]);
      } else {
        const result = await response.json();
        console.log(`Jurnal entries loaded: ${result.data?.length || 0} records`);
        setJurnalEntries(result.data || []);
      }
    } catch (error) {
      console.error('Error loading jurnal:', error);
      toast.error('Error loading jurnal');
      setJurnalEntries([]);
    }
  };

  const loadTashih = async () => {
    try {
      const response = await fetch('/api/musyrifah/tashih');
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error loading tashih');
        setTashihEntries([]);
      } else {
        const result = await response.json();
        console.log(`Tashih entries loaded: ${result.data?.length || 0} records`);
        setTashihEntries(result.data || []);
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
          <JurnalTab entries={jurnalEntries} onRefresh={loadJurnal} />
        )}

        {!dataLoading && activeTab === 'tashih' && (
          <TashihTab entries={tashihEntries} onRefresh={loadTashih} />
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
function JurnalTab({ entries, onRefresh }: { entries: JurnalEntry[], onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Jurnal Harian Thalibah</h2>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <AlertCircle className="w-5 h-5 mr-2" />
          Refresh
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada jurnal</h3>
          <p className="mt-1 text-sm text-gray-500">Belum ada jurnal harian dari thalibah.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{entry.thalibah?.full_name}</h3>
                  <p className="text-sm text-gray-500">{new Date(entry.tanggal).toLocaleDateString('id-ID')}</p>
                </div>
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  Juz {entry.juz}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Halaman:</span> {entry.halaman_mulai} - {entry.halaman_selesai}
                </p>
                {entry.catatan && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Catatan:</span> {entry.catatan}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Tashih Tab Component
function TashihTab({ entries, onRefresh }: { entries: TashihEntry[], onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Catatan Tashih</h2>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <AlertCircle className="w-5 h-5 mr-2" />
          Refresh
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada catatan tashih</h3>
          <p className="mt-1 text-sm text-gray-500">Belum ada catatan tashih dari thalibah.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{entry.thalibah?.full_name}</h3>
                  <p className="text-sm text-gray-500">{new Date(entry.tanggal_tashih).toLocaleDateString('id-ID')}</p>
                </div>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                  entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {entry.status}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Jenis Kesalahan:</span> {entry.jenis_kesalahan}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ayat:</span> {entry.ayat}
                </p>
                {entry.keterangan && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Keterangan:</span> {entry.keterangan}
                  </p>
                )}
              </div>
            </div>
          ))}
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
