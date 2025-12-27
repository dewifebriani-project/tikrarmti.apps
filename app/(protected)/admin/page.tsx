'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-singleton';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';
import { OralAssessment } from '@/components/OralAssessment';
import {
  Users,
  Calendar,
  BookOpen,
  GraduationCap,
  UserCheck,
  FileText,
  BarChart3,
  Plus,
  UserPlus,
  ClipboardList,
  Clock,
  Award,
  Download,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  CheckCircle,
  AlertCircle,
  XCircle,
  X
} from 'lucide-react';
import { AdminDataTable, Column } from '@/components/AdminDataTable';
import { AdminCrudModal, FormField } from '@/components/AdminCrudModal';
import { AdminDeleteModal } from '@/components/AdminDeleteModal';
import { UserDetailModal } from '@/components/UserDetailModal';
import AdminApprovalModal from '@/components/AdminApprovalModalFixed';
import { useAdminUsers, useAdminTikrar, useAdminStats } from '@/lib/hooks/useAdminData';

interface Batch {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  duration_weeks?: number;
  status: string;
  created_at: string;

  // Timeline phase dates for perjalanan-saya
  selection_start_date?: string;
  selection_end_date?: string;
  selection_result_date?: string;
  re_enrollment_date?: string;
  opening_class_date?: string;
  first_week_start_date?: string;
  first_week_end_date?: string;
  review_week_start_date?: string;
  review_week_end_date?: string;
  final_exam_start_date?: string;
  final_exam_end_date?: string;
  graduation_start_date?: string;
  graduation_end_date?: string;
}

interface Program {
  id: string;
  batch_id: string;
  name: string;
  description?: string;
  target_level?: string;
  duration_weeks?: number;
  max_thalibah?: number;
  status: string;
  batch?: { name: string };
}

interface Halaqah {
  id: string;
  program_id: string;
  name: string;
  description?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_students?: number;
  status: string;
  program?: {
    name: string;
    batch_id: string;
  };
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  nama_kunyah?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
  provinsi?: string;
  kota?: string;
  alamat?: string;
  whatsapp?: string;
  telegram?: string;
  zona_waktu?: string;
  tanggal_lahir?: string;
  tempat_lahir?: string;
  pekerjaan?: string;
  alasan_daftar?: string;
  jenis_kelamin?: string;
  negara?: string;
  current_tikrar_batch_id?: string;
  current_tikrar_batch?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  tikrar_registrations?: Array<{
    id: string;
    batch_id: string;
    batch_name: string;
    status: string;
    selection_status: string;
    batch?: {
      name: string;
      status: string;
    };
  }>;
}

interface Pendaftaran {
  id: string;
  thalibah_id: string;
  program_id: string;
  batch_id: string;
  registration_date: string;
  status: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  thalibah?: User;
  program?: { name: string };
  batch?: { name: string };
}

interface HalaqahMentor {
  id: string;
  halaqah_id: string;
  mentor_id: string;
  role: string;
  is_primary: boolean;
  assigned_at: string;
  halaqah?: { name: string };
  mentor?: User;
}

interface HalaqahStudent {
  id: string;
  halaqah_id: string;
  thalibah_id: string;
  assigned_at: string;
  assigned_by?: string;
  status: string;
  halaqah?: { name: string };
  thalibah?: User;
}

interface Presensi {
  id: string;
  halaqah_id: string;
  thalibah_id: string;
  date: string;
  status: string;
  notes?: string;
  recorded_by?: string;
  recorded_at: string;
  halaqah?: { name: string };
  thalibah?: User;
}

interface TikrarTahfidz {
  id: string;
  user_id: string;
  batch_id: string;
  program_id: string;
  understands_commitment: boolean;
  tried_simulation: boolean;
  no_negotiation: boolean;
  has_telegram: boolean;
  saved_contact: boolean;
  has_permission: boolean;
  permission_name?: string;
  permission_phone?: string;
  chosen_juz?: string;
  no_travel_plans: boolean;
  motivation?: string;
  ready_for_team?: string;
  full_name?: string;
  address?: string;
  wa_phone?: string;
  telegram_phone?: string;
  birth_date?: string;
  age?: number;
  domicile?: string;
  timezone?: string;
  main_time_slot?: string;
  backup_time_slot?: string;
  time_commitment: boolean;
  understands_program: boolean;
  questions?: string;
  batch_name?: string;
  submission_date: string;
  status: string;
  selection_status: string;
  approved_by?: string;
  approved_at?: string;
  oral_submitted_at?: string;
  written_submitted_at?: string;
  oral_submission_url?: string | null;
  oral_submission_file_name?: string | null;
  oral_makhraj_errors?: number;
  oral_sifat_errors?: number;
  oral_mad_errors?: number;
  oral_ghunnah_errors?: number;
  oral_harakat_errors?: number;
  oral_total_score?: number;
  oral_assessment_status?: string;
  oral_assessed_by?: string;
  oral_assessed_at?: string;
  oral_assessment_notes?: string;
  user?: User;
  batch?: { name: string };
  program?: { name: string };
}

type TabType = 'overview' | 'users' | 'batches' | 'programs' | 'halaqah' | 'halaqah-mentors' | 'halaqah-students' | 'pendaftaran' | 'presensi' | 'tikrar' | 'reports';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Initialize activeTab from localStorage or default to 'overview'
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('adminActiveTab');
      return (savedTab as TabType) || 'overview';
    }
    return 'overview';
  });

  // Only enable SWR hooks when user is authenticated and is admin
  const isAdmin: boolean = !authLoading && user?.role === 'admin';

  // SWR hooks for data fetching - only enabled when admin is authenticated
  const {
    users: swrUsers,
    isLoading: usersLoading,
    isError: usersError,
    mutate: mutateUsers
  } = useAdminUsers(isAdmin);

  const {
    tikrar: swrTikrar,
    isLoading: tikrarLoading,
    isError: tikrarError,
    mutate: mutateTikrar
  } = useAdminTikrar(isAdmin);

  const {
    stats: swrStats,
    isLoading: statsLoading,
    isError: statsError,
    mutate: mutateStats
  } = useAdminStats(isAdmin);

  // Data states (kept for compatibility with other tabs)
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>([]);
  const [halaqahMentors, setHalaqahMentors] = useState<HalaqahMentor[]>([]);
  const [halaqahStudents, setHalaqahStudents] = useState<HalaqahStudent[]>([]);
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran[]>([]);
  const [presensi, setPresensi] = useState<Presensi[]>([]);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminActiveTab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    console.log('=== Admin Page Auth Check ===');
    console.log('Auth loading:', authLoading);
    console.log('User:', user);
    console.log('User role:', user?.role);
    console.log('Is Admin:', isAdmin);
    console.log('SWR States - Users loading:', usersLoading, 'Tikrar loading:', tikrarLoading, 'Stats loading:', statsLoading);

    if (!authLoading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
      } else if (user.role !== 'admin') {
        console.log('User is not admin, role:', user.role);
        router.push('/dashboard');
      } else {
        console.log('Admin access granted');
        setLoading(false);
      }
    }
  }, [user, authLoading, router, isAdmin, usersLoading, tikrarLoading, statsLoading]);

  useEffect(() => {
    if (user) {
      console.log('Loading data for tab:', activeTab);
      loadData();
    }
  }, [activeTab, user]);

  // Disable eslint exhaustive-deps warning for loadData
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const loadData = async () => {
    console.log('loadData called for tab:', activeTab);
    setDataLoading(true);

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error('Request aborted after 10 seconds for tab:', activeTab);
      toast.error(`Loading timeout for ${activeTab}. Please try again.`);
      setDataLoading(false);
    }, 10000); // Reduced to 10 second timeout

    try {
      console.log('=== Starting data load for tab:', activeTab, '===', new Date().toISOString());

      // Overview, Users, and Tikrar tabs are now handled by SWR hooks - no need to fetch here
      if (activeTab === 'overview') {
        // Data is loaded automatically by useAdminStats hook
        console.log('Overview stats handled by SWR');
      } else if (activeTab === 'users') {
        // Data is loaded automatically by useAdminUsers hook
        console.log('Users data handled by SWR');
      } else if (activeTab === 'tikrar') {
        // Data is loaded automatically by useAdminTikrar hook
        console.log('Tikrar data handled by SWR');
      } else if (activeTab === 'batches') {
        console.log('Fetching batches via API...');
        const response = await fetch('/api/admin/batches');
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error loading batches:', errorData);
          toast.error(errorData.error || 'Error loading batches');
          setBatches([]);
        } else {
          const result = await response.json();
          console.log(`Batches loaded: ${result.data?.length || 0} records`);
          setBatches(result.data || []);
        }
      } else if (activeTab === 'programs') {
        const { data, error } = await supabase
          .from('programs')
          .select('*, batch:batches(name)')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error loading programs:', error);
          toast.error('Error loading programs');
        }
        console.log(`Programs loaded: ${data?.length || 0} records`);
        setPrograms(data || []);
      } else if (activeTab === 'halaqah') {
        const { data, error } = await supabase
          .from('halaqah')
          .select('*, program:programs(name, batch_id)')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error loading halaqah:', error);
          toast.error('Error loading halaqah');
        }
        console.log(`Halaqah loaded: ${data?.length || 0} records`);
        setHalaqahs(data || []);
      } else if (activeTab === 'halaqah-mentors') {
        try {
          const { data, error } = await supabase
            .from('halaqah_mentors')
            .select('*, halaqah:halaqah(name), mentor:users(full_name, email, role)')
            .order('assigned_at', { ascending: false });
          if (error) {
            console.error('Error loading halaqah mentors:', error);
            // Check if table doesn't exist or other errors
            if (error.code === 'PGRST116') {
              console.log('Table halaqah_mentors does not exist yet');
              setHalaqahMentors([]);
            } else if (error.message && error.message.includes('relationship')) {
              console.log('Foreign key relationship issue for halaqah_mentors');
              setHalaqahMentors([]);
            } else {
              console.error('Database error:', error.message);
              setHalaqahMentors([]);
            }
          } else {
            setHalaqahMentors(data || []);
          }
        } catch (err: any) {
          console.error('Unexpected error loading halaqah mentors:', err);
          setHalaqahMentors([]);
        }
      } else if (activeTab === 'halaqah-students') {
        try {
          const { data, error } = await supabase
            .from('halaqah_students')
            .select('*, halaqah:halaqah(name), thalibah:users(full_name, email)')
            .order('assigned_at', { ascending: false });
          if (error) {
            console.error('Error loading halaqah students:', error, 'Details:', JSON.stringify(error, null, 2));
            // Check if table doesn't exist or other errors
            if (error.code === 'PGRST116') {
              console.log('Table halaqah_students does not exist yet');
              setHalaqahStudents([]);
            } else if (error.message && error.message.includes('relationship')) {
              console.log('Foreign key relationship issue for halaqah_students');
              setHalaqahStudents([]);
            } else {
              console.error('Database error:', error.message);
              setHalaqahStudents([]);
            }
          } else {
            setHalaqahStudents(data || []);
          }
        } catch (err: any) {
          console.error('Unexpected error loading halaqah students:', err);
          setHalaqahStudents([]);
        }
      } else if (activeTab === 'pendaftaran') {
        const { data, error } = await supabase
          .from('pendaftaran')
          .select('*, thalibah:users!pendaftaran_thalibah_id_fkey(full_name, email), program:programs(name), batch:batches(name)')
          .order('registration_date', { ascending: false });
        if (error) console.error('Error loading pendaftaran:', error);
        setPendaftaran(data || []);
      } else if (activeTab === 'presensi') {
        try {
          const { data, error } = await supabase
            .from('presensi')
            .select('*, halaqah:halaqah(name), thalibah:users(full_name, email)')
            .order('date', { ascending: false })
            .limit(100);
          if (error) {
            console.error('Error loading presensi:', error);
            // Check if table doesn't exist or other errors
            if (error.code === 'PGRST116') {
              console.log('Table presensi does not exist yet');
              setPresensi([]);
            } else if (error.message && error.message.includes('relationship')) {
              console.log('Foreign key relationship issue for presensi');
              setPresensi([]);
            } else {
              console.error('Database error:', error.message);
              setPresensi([]);
            }
          } else {
            setPresensi(data || []);
          }
        } catch (err: any) {
          console.error('Unexpected error loading presensi:', err);
          setPresensi([]);
        }
      }
    } catch (error) {
      console.error('Error in loadData:', error);
    } finally {
      clearTimeout(timeoutId);
      console.log('=== Data load completed for tab:', activeTab, 'at', new Date().toISOString(), '===');
      setDataLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as TabType, name: 'Overview', icon: BarChart3 },
    { id: 'users' as TabType, name: 'Users', icon: Users },
    { id: 'batches' as TabType, name: 'Batches', icon: Calendar },
    { id: 'programs' as TabType, name: 'Programs', icon: BookOpen },
    { id: 'halaqah' as TabType, name: 'Halaqah', icon: GraduationCap },
    { id: 'halaqah-mentors' as TabType, name: 'Halaqah Mentors', icon: UserCheck },
    { id: 'halaqah-students' as TabType, name: 'Halaqah Students', icon: UserPlus },
    { id: 'pendaftaran' as TabType, name: 'Pendaftaran', icon: ClipboardList },
    { id: 'presensi' as TabType, name: 'Presensi', icon: Clock },
    { id: 'tikrar' as TabType, name: 'Tikrar Tahfidz', icon: Award },
    { id: 'reports' as TabType, name: 'Reports', icon: FileText }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
          <p className="text-gray-600">Initializing Admin Dashboard...</p>
          <p className="text-sm text-gray-500">Please wait while we prepare your workspace</p>
          <p className="text-xs text-gray-400">First load may take longer due to compilation</p>
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
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 -m-6 mb-0 px-6 py-6 rounded-t-lg">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Kelola data master dan lihat laporan sistem
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

        {activeTab === 'overview' && (
          statsLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
            </div>
          ) : (
            <OverviewTab stats={swrStats} />
          )
        )}
        {activeTab === 'users' && (
          usersLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
                <p className="text-sm text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : usersError ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <p className="text-red-600 mb-2">Failed to load users</p>
                <button
                  onClick={() => mutateUsers()}
                  className="px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <UsersTab users={swrUsers} onRefresh={() => mutateUsers()} />
          )
        )}
        {activeTab === 'batches' && <BatchesTab batches={batches} onRefresh={loadData} />}
        {activeTab === 'programs' && (
          <ProgramsTab
            programs={programs}
            batches={batches}
            selectedBatchFilter={selectedBatchFilter}
            onBatchFilterChange={setSelectedBatchFilter}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'halaqah' && (
          <HalaqahTab
            halaqahs={halaqahs}
            batches={batches}
            selectedBatchFilter={selectedBatchFilter}
            onBatchFilterChange={setSelectedBatchFilter}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'halaqah-mentors' && <HalaqahMentorsTab mentors={halaqahMentors} onRefresh={loadData} />}
        {activeTab === 'halaqah-students' && <HalaqahStudentsTab students={halaqahStudents} onRefresh={loadData} />}
        {activeTab === 'pendaftaran' && (
          <PendaftaranTab
            pendaftaran={pendaftaran}
            batches={batches}
            selectedBatchFilter={selectedBatchFilter}
            onBatchFilterChange={setSelectedBatchFilter}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'presensi' && <PresensiTab presensi={presensi} onRefresh={loadData} />}
        {activeTab === 'tikrar' && (
          tikrarLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
                <p className="text-sm text-gray-600">Loading Tikrar Tahfidz data...</p>
              </div>
            </div>
          ) : tikrarError ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <p className="text-red-600 mb-2">Failed to load Tikrar data</p>
                <button
                  onClick={() => mutateTikrar()}
                  className="px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <TikrarTab
              tikrar={swrTikrar}
              batches={batches}
              selectedBatchFilter={selectedBatchFilter}
              onBatchFilterChange={setSelectedBatchFilter}
              onRefresh={() => mutateTikrar()}
            />
          )
        )}
        {activeTab === 'reports' && <ReportsTab />}
      </div>
    </>
  );
}

// Overview Tab Component
function OverviewTab({ stats }: { stats: any }) {
  const statCards = [
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { name: 'Total Batches', value: stats.totalBatches, icon: Calendar, color: 'bg-indigo-500' },
    { name: 'Total Programs', value: stats.totalPrograms, icon: BookOpen, color: 'bg-green-500' },
    { name: 'Total Halaqah', value: stats.totalHalaqah, icon: GraduationCap, color: 'bg-purple-500' },
    { name: 'Total Thalibah', value: stats.totalThalibah, icon: UserPlus, color: 'bg-yellow-500' },
    { name: 'Total Mentors', value: stats.totalMentors, icon: UserCheck, color: 'bg-pink-500' },
    { name: 'Pending Registrations', value: stats.pendingRegistrations, icon: ClipboardList, color: 'bg-red-500' },
    { name: 'Pending Tikrar', value: stats.pendingTikrar, icon: Award, color: 'bg-orange-500' }
  ];

  return (
    <div className="space-y-6">
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
    </div>
  );
}

// Batches Tab Component
function BatchesTab({ batches, onRefresh }: { batches: Batch[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const columns: Column<Batch>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      render: (batch) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{batch.name}</div>
          <div className="text-sm text-gray-500">{batch.description || '-'}</div>
        </div>
      ),
    },
    {
      key: 'start_date',
      label: 'Period',
      sortable: true,
      render: (batch) => (
        <span className="text-sm text-gray-900">
          {new Date(batch.start_date).toLocaleDateString('id-ID')} - {new Date(batch.end_date).toLocaleDateString('id-ID')}
        </span>
      ),
    },
    {
      key: 'duration_weeks',
      label: 'Duration',
      sortable: true,
      render: (batch) => (
        <span>{batch.duration_weeks ? `${batch.duration_weeks} weeks` : '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (batch) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
          ${batch.status === 'open' ? 'bg-green-100 text-green-800' :
            batch.status === 'closed' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'}`}>
          {batch.status}
        </span>
      ),
    },
  ];

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setShowForm(true);
  };

  const handleDelete = (batch: Batch) => {
    setEditingBatch(batch);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!editingBatch) return;

    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', editingBatch.id);

      if (error) throw error;

      onRefresh();
      setShowDeleteModal(false);
      setEditingBatch(null);
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Batches Management</h2>
        <button
          onClick={() => {
            setEditingBatch(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Batch
        </button>
      </div>

      {showForm && (
        <BatchForm
          batch={editingBatch}
          onClose={() => {
            setShowForm(false);
            setEditingBatch(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingBatch(null);
            onRefresh();
          }}
        />
      )}

      <AdminDataTable
        data={batches}
        columns={columns}
        onEdit={handleEdit}
        rowKey="id"
        searchPlaceholder="Search batches by name, status..."
        emptyMessage="No batches found"
        emptyIcon={<Calendar className="mx-auto h-12 w-12 text-gray-400" />}
      />

      {/* WARNING: Delete disabled to prevent cascade deletion of Tikrar data */}
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-800">
          ⚠️ <strong>Warning:</strong> Batch deletion is temporarily disabled because it will CASCADE DELETE all related data (programs, pendaftaran, tikrar_tahfidz).
          Please use database admin to safely manage batches or implement soft delete.
        </p>
      </div>
    </div>
  );
}

// Batch Form Component
function BatchForm({ batch, onClose, onSuccess }: { batch: Batch | null, onClose: () => void, onSuccess: () => void }) {
  // Helper function to safely extract date from timestamp
  const extractDate = (dateValue: string | null | undefined): string => {
    if (!dateValue) return '';
    try {
      return dateValue.split('T')[0];
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    name: batch?.name || '',
    description: batch?.description || '',
    start_date: batch?.start_date || '',
    end_date: batch?.end_date || '',
    registration_start_date: extractDate(batch?.registration_start_date),
    registration_end_date: extractDate(batch?.registration_end_date),
    duration_weeks: batch?.duration_weeks || 0,
    status: batch?.status || 'draft',

    // Timeline phase dates
    selection_start_date: extractDate(batch?.selection_start_date),
    selection_end_date: extractDate(batch?.selection_end_date),
    selection_result_date: extractDate(batch?.selection_result_date),
    re_enrollment_date: extractDate(batch?.re_enrollment_date),
    opening_class_date: extractDate(batch?.opening_class_date),
    first_week_start_date: extractDate(batch?.first_week_start_date),
    first_week_end_date: extractDate(batch?.first_week_end_date),
    review_week_start_date: extractDate(batch?.review_week_start_date),
    review_week_end_date: extractDate(batch?.review_week_end_date),
    final_exam_start_date: extractDate(batch?.final_exam_start_date),
    final_exam_end_date: extractDate(batch?.final_exam_end_date),
    graduation_start_date: extractDate(batch?.graduation_start_date),
    graduation_end_date: extractDate(batch?.graduation_end_date),
  });
  const [saving, setSaving] = useState(false);
  const [showTimelineConfig, setShowTimelineConfig] = useState(false);

  // Function to calculate end date based on start date and duration
  const calculateEndDate = (startDate: string, weeks: number) => {
    if (!startDate || weeks <= 0) return '';

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (weeks * 7) - 1); // Subtract 1 day to include start date

    return end.toISOString().split('T')[0];
  };

  // Handle start date change
  const handleStartDateChange = (value: string) => {
    const newFormData = { ...formData, start_date: value };

    // Calculate end date if duration_weeks is set
    if (formData.duration_weeks > 0) {
      newFormData.end_date = calculateEndDate(value, formData.duration_weeks);
    }

    setFormData(newFormData);
  };

  // Handle duration change
  const handleDurationChange = (weeks: number) => {
    const newFormData = {
      ...formData,
      duration_weeks: weeks
    };

    // Calculate end date if start_date is set
    if (formData.start_date) {
      newFormData.end_date = calculateEndDate(formData.start_date, weeks);
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error saving batch:', result);
        alert('Failed to save batch: ' + (result.error || 'Unknown error'));
      } else {
        toast.success(batch ? 'Batch updated successfully' : 'Batch created successfully');
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving batch:', error);
      alert('Failed to save batch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {batch ? 'Edit Batch' : 'Add New Batch'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            >
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (Weeks)</label>
            <input
              type="number"
              min="1"
              max="52"
              value={formData.duration_weeks || ''}
              onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
              placeholder="Enter number of weeks"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              required
              value={formData.end_date}
              readOnly
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-700"
              placeholder="Auto-calculated"
            />
            <p className="text-xs text-gray-500 mt-1">Automatically calculated</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Registration Start</label>
            <input
              type="date"
              value={formData.registration_start_date}
              onChange={(e) => setFormData({ ...formData, registration_start_date: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Registration End</label>
            <input
              type="date"
              value={formData.registration_end_date}
              onChange={(e) => setFormData({ ...formData, registration_end_date: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
        </div>

        {/* Timeline Configuration Section */}
        <div className="border-t border-gray-200 pt-4 mt-6">
          <button
            type="button"
            onClick={() => setShowTimelineConfig(!showTimelineConfig)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center">
              <svg className={`h-5 w-5 text-gray-500 transition-transform ${showTimelineConfig ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <h4 className="ml-2 text-base font-semibold text-gray-900">Timeline Configuration</h4>
              <span className="ml-2 text-xs text-gray-500">(Optional - for Perjalanan Saya page)</span>
            </div>
          </button>

          {showTimelineConfig && (
            <div className="mt-4 space-y-6 pl-7">
              {/* Selection Phase */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-blue-900 mb-3">Selection Phase</h5>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Selection Start</label>
                    <input
                      type="date"
                      value={formData.selection_start_date}
                      onChange={(e) => setFormData({ ...formData, selection_start_date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Selection End</label>
                    <input
                      type="date"
                      value={formData.selection_end_date}
                      onChange={(e) => setFormData({ ...formData, selection_end_date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Result Announcement</label>
                    <input
                      type="date"
                      value={formData.selection_result_date}
                      onChange={(e) => setFormData({ ...formData, selection_result_date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Re-enrollment & Opening */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-green-900 mb-3">Re-enrollment & Opening</h5>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Re-enrollment Date</label>
                    <input
                      type="date"
                      value={formData.re_enrollment_date}
                      onChange={(e) => setFormData({ ...formData, re_enrollment_date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Opening Class Date</label>
                    <input
                      type="date"
                      value={formData.opening_class_date}
                      onChange={(e) => setFormData({ ...formData, opening_class_date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Learning Weeks */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-purple-900 mb-3">Learning Weeks</h5>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Week Start (Pekan 1)</label>
                      <input
                        type="date"
                        value={formData.first_week_start_date}
                        onChange={(e) => setFormData({ ...formData, first_week_start_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Week End</label>
                      <input
                        type="date"
                        value={formData.first_week_end_date}
                        onChange={(e) => setFormData({ ...formData, first_week_end_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 bg-white p-2 rounded border border-purple-200">
                    <strong>Note:</strong> Pekan 2-11 will be auto-calculated from First Week End to Review Week Start
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Review Week Start (Pekan 12)</label>
                      <input
                        type="date"
                        value={formData.review_week_start_date}
                        onChange={(e) => setFormData({ ...formData, review_week_start_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Review Week End</label>
                      <input
                        type="date"
                        value={formData.review_week_end_date}
                        onChange={(e) => setFormData({ ...formData, review_week_end_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment & Completion */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-amber-900 mb-3">Assessment & Completion</h5>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Final Exam Start (Pekan 13)</label>
                      <input
                        type="date"
                        value={formData.final_exam_start_date}
                        onChange={(e) => setFormData({ ...formData, final_exam_start_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Final Exam End</label>
                      <input
                        type="date"
                        value={formData.final_exam_end_date}
                        onChange={(e) => setFormData({ ...formData, final_exam_end_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Graduation Start (Pekan 14)</label>
                      <input
                        type="date"
                        value={formData.graduation_start_date}
                        onChange={(e) => setFormData({ ...formData, graduation_start_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Graduation End</label>
                      <input
                        type="date"
                        value={formData.graduation_end_date}
                        onChange={(e) => setFormData({ ...formData, graduation_end_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Programs Tab Component
interface ProgramsTabProps {
  programs: Program[];
  batches: Batch[];
  selectedBatchFilter: string;
  onBatchFilterChange: (batchId: string) => void;
  onRefresh: () => void;
}

function ProgramsTab({ programs, batches, selectedBatchFilter, onBatchFilterChange, onRefresh }: ProgramsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  // Filter programs by selected batch
  const filteredPrograms = selectedBatchFilter === 'all'
    ? programs
    : programs.filter(p => p.batch_id === selectedBatchFilter);

  const columns: Column<Program>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      render: (program) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{program.name}</div>
          <div className="text-sm text-gray-500">{program.target_level || '-'}</div>
        </div>
      ),
    },
    {
      key: 'batch_id',
      label: 'Batch',
      sortable: true,
      filterable: true,
      render: (program) => program.batch?.name || '-',
    },
    {
      key: 'duration_weeks',
      label: 'Duration',
      sortable: true,
      render: (program) => `${program.duration_weeks || 0} weeks`,
    },
    {
      key: 'max_thalibah',
      label: 'Max Students',
      sortable: true,
      render: (program) => program.max_thalibah || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (program) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
          ${program.status === 'open' ? 'bg-green-100 text-green-800' :
            program.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
            program.status === 'completed' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'}`}>
          {program.status}
        </span>
      ),
    },
  ];

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setShowForm(true);
  };

  const handleDelete = (program: Program) => {
    setEditingProgram(program);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!editingProgram) return;

    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', editingProgram.id);

      if (error) throw error;

      onRefresh();
      setShowDeleteModal(false);
      setEditingProgram(null);
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Programs Management</h2>
        <button
          onClick={() => {
            setEditingProgram(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Program
        </button>
      </div>

      {/* Batch Filter */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
        <label className="text-sm font-medium text-gray-700">Filter by Batch:</label>
        <select
          value={selectedBatchFilter}
          onChange={(e) => onBatchFilterChange(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-green-500 focus:border-green-500"
        >
          <option value="all">All Batches ({programs.length})</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name} ({programs.filter(p => p.batch_id === batch.id).length})
            </option>
          ))}
        </select>
        {selectedBatchFilter !== 'all' && (
          <span className="text-sm text-gray-500">
            Showing {filteredPrograms.length} of {programs.length} programs
          </span>
        )}
      </div>

      {showForm && (
        <ProgramForm
          program={editingProgram}
          onClose={() => {
            setShowForm(false);
            setEditingProgram(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingProgram(null);
            onRefresh();
          }}
        />
      )}

      <AdminDataTable
        data={filteredPrograms}
        columns={columns}
        onEdit={handleEdit}
        rowKey="id"
        searchPlaceholder="Search programs by name, batch, status..."
        emptyMessage="No programs found"
        emptyIcon={<BookOpen className="mx-auto h-12 w-12 text-gray-400" />}
      />

      {/* WARNING: Delete disabled to prevent cascade deletion */}
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-800">
          ⚠️ <strong>Warning:</strong> Program deletion is temporarily disabled due to CASCADE DELETE constraints.
        </p>
      </div>
    </div>
  );
}

// Program Form Component
function ProgramForm({ program, onClose, onSuccess }: { program: Program | null, onClose: () => void, onSuccess: () => void }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [formData, setFormData] = useState({
    batch_id: program?.batch_id || '',
    name: program?.name || '',
    description: program?.description || '',
    target_level: program?.target_level || '',
    duration_weeks: program?.duration_weeks || 0,
    max_thalibah: program?.max_thalibah || 0,
    status: program?.status || 'draft'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    const { data } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });
    setBatches(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Ensure duration_weeks is not undefined
      const submitData = {
        ...formData,
        duration_weeks: formData.duration_weeks || 0,
        max_thalibah: formData.max_thalibah || 0
      };

      let result: any;
      if (program) {
        result = await (supabase as any)
          .from('programs')
          .update(submitData)
          .eq('id', program.id);
      } else {
        result = await (supabase as any)
          .from('programs')
          .insert([submitData]);
      }

      if (result.error) {
        console.error('Error saving program:', result.error);
        alert('Failed to save program: ' + result.error.message);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Failed to save program');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {program ? 'Edit Program' : 'Add New Program'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Batch</label>
            <select
              required
              value={formData.batch_id}
              onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Target Level</label>
            <input
              type="text"
              value={formData.target_level}
              onChange={(e) => setFormData({ ...formData, target_level: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (weeks)</label>
            <input
              type="number"
              value={formData.duration_weeks || ''}
              onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 0 })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Thalibah</label>
            <input
              type="number"
              value={formData.max_thalibah || ''}
              onChange={(e) => setFormData({ ...formData, max_thalibah: parseInt(e.target.value) || 0 })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            >
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Halaqah Tab Component
interface HalaqahTabProps {
  halaqahs: Halaqah[];
  batches: Batch[];
  selectedBatchFilter: string;
  onBatchFilterChange: (batchId: string) => void;
  onRefresh: () => void;
}

function HalaqahTab({ halaqahs, batches, selectedBatchFilter, onBatchFilterChange, onRefresh }: HalaqahTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingHalaqah, setEditingHalaqah] = useState<Halaqah | null>(null);

  const daysOfWeek = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Filter halaqahs by batch (via program)
  const filteredHalaqahs = selectedBatchFilter === 'all'
    ? halaqahs
    : halaqahs.filter(h => {
        const program = h.program;
        return program && program.batch_id === selectedBatchFilter;
      });

  const columns: Column<Halaqah>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      render: (halaqah) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{halaqah.name}</div>
          <div className="text-sm text-gray-500">{halaqah.description || '-'}</div>
        </div>
      ),
    },
    {
      key: 'program_id',
      label: 'Program',
      sortable: true,
      filterable: true,
      render: (halaqah) => halaqah.program?.name || '-',
    },
    {
      key: 'day_of_week',
      label: 'Schedule',
      sortable: true,
      render: (halaqah) => (
        <div>
          <div>{halaqah.day_of_week ? daysOfWeek[halaqah.day_of_week] : '-'}</div>
          {halaqah.start_time && halaqah.end_time && (
            <div className="text-xs text-gray-500">{halaqah.start_time} - {halaqah.end_time}</div>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      filterable: true,
      render: (halaqah) => halaqah.location || '-',
    },
    {
      key: 'max_students',
      label: 'Max Students',
      sortable: true,
      render: (halaqah) => halaqah.max_students || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (halaqah) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
          ${halaqah.status === 'active' ? 'bg-green-100 text-green-800' :
            halaqah.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'}`}>
          {halaqah.status}
        </span>
      ),
    },
  ];

  const handleEdit = (halaqah: Halaqah) => {
    setEditingHalaqah(halaqah);
    setShowForm(true);
  };

  const handleDelete = (halaqah: Halaqah) => {
    setEditingHalaqah(halaqah);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!editingHalaqah) return;

    try {
      const { error } = await supabase
        .from('halaqah')
        .delete()
        .eq('id', editingHalaqah.id);

      if (error) throw error;

      onRefresh();
      setShowDeleteModal(false);
      setEditingHalaqah(null);
    } catch (error) {
      console.error('Error deleting halaqah:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Halaqah Management</h2>
        <button
          onClick={() => {
            setEditingHalaqah(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Halaqah
        </button>
      </div>

      {/* Batch Filter */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
        <label className="text-sm font-medium text-gray-700">Filter by Batch:</label>
        <select
          value={selectedBatchFilter}
          onChange={(e) => onBatchFilterChange(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-green-500 focus:border-green-500"
        >
          <option value="all">All Batches ({halaqahs.length})</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name} ({halaqahs.filter(h => h.program?.batch_id === batch.id).length})
            </option>
          ))}
        </select>
        {selectedBatchFilter !== 'all' && (
          <span className="text-sm text-gray-500">
            Showing {filteredHalaqahs.length} of {halaqahs.length} halaqah sessions
          </span>
        )}
      </div>

      {showForm && (
        <HalaqahForm
          halaqah={editingHalaqah}
          onClose={() => {
            setShowForm(false);
            setEditingHalaqah(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingHalaqah(null);
            onRefresh();
          }}
        />
      )}

      <AdminDataTable
        data={filteredHalaqahs}
        columns={columns}
        onEdit={handleEdit}
        rowKey="id"
        searchPlaceholder="Search halaqah by name, program, location..."
        emptyMessage="No halaqah sessions found"
        emptyIcon={<GraduationCap className="mx-auto h-12 w-12 text-gray-400" />}
      />

      {/* WARNING: Delete disabled to prevent cascade deletion */}
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-800">
          ⚠️ <strong>Warning:</strong> Halaqah deletion is temporarily disabled due to CASCADE DELETE constraints.
        </p>
      </div>
    </div>
  );
}

// Halaqah Form Component
function HalaqahForm({ halaqah, onClose, onSuccess }: { halaqah: Halaqah | null, onClose: () => void, onSuccess: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [formData, setFormData] = useState({
    program_id: halaqah?.program_id || '',
    name: halaqah?.name || '',
    description: halaqah?.description || '',
    day_of_week: halaqah?.day_of_week || 1,
    start_time: halaqah?.start_time || '',
    end_time: halaqah?.end_time || '',
    location: halaqah?.location || '',
    max_students: halaqah?.max_students || 20,
    status: halaqah?.status || 'active'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    const { data } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    setPrograms(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let result: any;
      if (halaqah) {
        result = await (supabase as any)
          .from('halaqah')
          .update(formData)
          .eq('id', halaqah.id);
      } else {
        result = await (supabase as any)
          .from('halaqah')
          .insert([formData]);
      }

      if (result.error) {
        console.error('Error saving halaqah:', result.error);
        alert('Failed to save halaqah: ' + result.error.message);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving halaqah:', error);
      alert('Failed to save halaqah');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {halaqah ? 'Edit Halaqah' : 'Add New Halaqah'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Program</label>
            <select
              required
              value={formData.program_id}
              onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            >
              <option value="">Select Program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>{program.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Day of Week</label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            >
              <option value="1">Senin</option>
              <option value="2">Selasa</option>
              <option value="3">Rabu</option>
              <option value="4">Kamis</option>
              <option value="5">Jumat</option>
              <option value="6">Sabtu</option>
              <option value="7">Minggu</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Students</label>
            <input
              type="number"
              value={formData.max_students}
              onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-900 focus:border-green-900"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Users Tab Component
function UsersTab({ users, onRefresh }: { users: User[], onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportContacts = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/export-contacts', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to export contacts');
        return;
      }

      // Get the CSV content
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mti-contacts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('CSV downloaded! Click "Open Gmail Import" button to import contacts.');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export contacts');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenGmailImport = () => {
    // Open Gmail Contacts page
    window.open('https://contacts.google.com/u/0/', '_blank');
    toast.success('Gmail Contacts opened. Click the Import icon to import your downloaded CSV file.');
  };

  const columns: Column<User>[] = [
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      filterable: true,
      render: (user) => (
        <div>
          <div
            className={`text-sm font-medium cursor-pointer hover:underline ${user.is_active ? 'text-blue-600' : 'text-gray-400 line-through'}`}
            onClick={() => {
              setSelectedUser(user);
              setShowDetailModal(true);
            }}
          >
            {user.full_name || '-'}
            {!user.is_active && <span className="ml-2 text-xs text-red-600">(Deactivated)</span>}
          </div>
          {user.nama_kunyah && (
            <div className="text-xs text-gray-500 italic">({user.nama_kunyah})</div>
          )}
          <div className="text-sm text-gray-500">{user.phone || '-'}</div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      filterable: true,
      render: (user) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
          ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
            user.role === 'ustadzah' ? 'bg-blue-100 text-blue-800' :
            user.role === 'musyrifah' ? 'bg-green-100 text-green-800' :
            user.role === 'thalibah' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'}`}>
          {user.role || '-'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (user) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
          ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'kota',
      label: 'Location',
      sortable: true,
      filterable: true,
      render: (user) => (
        <span>{user.kota && user.provinsi ? `${user.kota}, ${user.provinsi}` : '-'}</span>
      ),
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      sortable: false,
      render: (user) => {
        // Prioritize whatsapp field, fallback to phone
        const contactNumber = user.whatsapp || user.phone;

        if (!contactNumber) {
          return <span className="text-gray-400">-</span>;
        }

        // Format phone number for WhatsApp (remove non-numeric characters)
        let phoneNumber = contactNumber.replace(/\D/g, '');

        // If starts with 0, replace with 62 (Indonesia country code)
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '62' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('62')) {
          phoneNumber = '62' + phoneNumber;
        }

        // Pesan islami untuk mengajak daftar Tikrar Tahfidz Batch 2
        const userName = user.full_name || user.nama_kunyah || '';
        const message = `Assalamu'alaikum warahmatullahi wabarakatuh, Ukhti ${userName}

Barakallahu fiik atas minat dan semangat Ukhti untuk menghafal Al-Qur'an 🌙

Kami dari Markaz Tikrar Indonesia ingin mengingatkan bahwa *Program Tikrar Tahfidz MTI Batch 2* akan segera dimulai, in syaa Allah.

📖 "Dan sesungguhnya telah Kami mudahkan Al-Qur'an untuk peringatan, maka adakah orang yang mau mengambil pelajaran?" (QS. Al-Qamar: 17)

Jika Ukhti belum mendaftar, kami mengajak Ukhti untuk segera bergabung dan meraih kesempatan mulia ini.

Yuk, wujudkan impian menghafal Al-Qur'an bersama thalibah lainnya! 💚

Untuk informasi lebih lanjut dan pendaftaran, silakan kunjungi:
🌐 markaztikrar.id

Jazakillahu khairan
Tim Markaz Tikrar Indonesia`;

        const encodedMessage = encodeURIComponent(message);

        // Auto-detect device: use wa.me for mobile/tablet, web.whatsapp.com for desktop
        // wa.me akan otomatis redirect ke app di mobile, atau web.whatsapp.com di desktop
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        return (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors"
            title={`WhatsApp ${contactNumber}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Chat
          </a>
        );
      },
    },
    {
      key: 'tikrar_batch',
      label: 'Tikrar Batch',
      sortable: true,
      filterable: true,
      render: (user) => {
        // Prioritize current_tikrar_batch (dynamic, auto-updated)
        const currentBatch = user.current_tikrar_batch;

        if (!currentBatch && (!user.tikrar_registrations || user.tikrar_registrations.length === 0)) {
          return <span className="text-gray-400">-</span>;
        }

        // Use current batch or fallback to latest registration
        const batchName = currentBatch?.name || user.tikrar_registrations?.[0]?.batch_name || '';
        const batchStatus = currentBatch?.status || user.tikrar_registrations?.[0]?.batch?.status || '';
        const registrationStatus = user.tikrar_registrations?.[0]?.status || '';
        const selectionStatus = user.tikrar_registrations?.[0]?.selection_status || '';

        // Prioritize registration status (approved/pending) over selection status
        const displayStatus = registrationStatus || selectionStatus;

        // Extract batch number for styling
        const batchMatch = batchName.match(/Batch (\d+)/i);
        const batchNum = batchMatch ? parseInt(batchMatch[1]) : 0;

        // Determine color based on batch status (dynamic - shows current active batch)
        const getBatchColor = () => {
          if (batchStatus === 'open') {
            return 'bg-green-100 text-green-800 border-green-300';
          } else if (batchStatus === 'ongoing') {
            return 'bg-blue-100 text-blue-800 border-blue-300';
          } else if (batchStatus === 'closed') {
            return 'bg-gray-100 text-gray-600 border-gray-300';
          }
          return 'bg-purple-100 text-purple-800 border-purple-300';
        };

        // Get status icon and color
        const getStatusInfo = (status: string) => {
          switch (status) {
            case 'approved':
              return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Disetujui' };
            case 'selected':
              return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Diterima' };
            case 'pending':
              return { icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Menunggu' };
            case 'not_selected':
              return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Tidak Diterima' };
            case 'rejected':
              return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Ditolak' };
            default:
              return { icon: AlertCircle, color: 'text-gray-600', bgColor: 'bg-gray-50', label: status || '-' };
          }
        };

        const statusInfo = getStatusInfo(displayStatus);
        const StatusIcon = statusInfo.icon;

        return (
          <div className="flex flex-col gap-1.5">
            <div className={`px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full border ${getBatchColor()}`}>
              {batchName}
              {currentBatch && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded-full" title="Batch aktif saat ini">
                  ✓
                </span>
              )}
            </div>
            {displayStatus && (
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statusInfo.bgColor} ${statusInfo.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (user) => new Date(user.created_at).toLocaleDateString('id-ID'),
    },
  ];

  const formFields: FormField[] = [
    { name: 'full_name', label: 'Nama Lengkap (sesuai KTP)', type: 'text', required: true },
    { name: 'nama_kunyah', label: 'Nama Kunyah/Panggilan', type: 'text', required: false },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel' },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'ustadzah', label: 'Ustadzah' },
        { value: 'musyrifah', label: 'Musyrifah' },
        { value: 'thalibah', label: 'Thalibah' },
        { value: 'calon_thalibah', label: 'Calon Thalibah' },
      ]
    },
    { name: 'provinsi', label: 'Provinsi', type: 'text' },
    { name: 'kota', label: 'Kota', type: 'text' },
    { name: 'alamat', label: 'Alamat', type: 'textarea', rows: 3 },
    { name: 'whatsapp', label: 'WhatsApp', type: 'tel' },
    { name: 'telegram', label: 'Telegram', type: 'text' },
    { name: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true },
  ];

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      if (selectedUser) {
        // Update existing user
        const { error } = await (supabase as any)
          .from('users')
          .update(data)
          .eq('id', selectedUser.id);

        if (error) throw error;
        toast.success('User updated successfully');
      } else {
        // Create new user
        const { error } = await (supabase as any)
          .from('users')
          .insert([data]);

        if (error) throw error;
        toast.success('User created successfully');
      }

      onRefresh();
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(`Failed to save user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    const userName = selectedUser.full_name || selectedUser.email;
    const userId = selectedUser.id;

    try {
      // Use API endpoint with admin privileges to delete user
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      const result = await response.json();

      // Close modal and clear state first
      setShowDeleteModal(false);
      setSelectedUser(null);

      // Then refresh data and show success message
      await onRefresh();

      // Show appropriate message based on delete type
      if (result.softDelete) {
        toast.success(`User "${userName}" has been deactivated (has existing registrations)`);
      } else {
        toast.success(`User "${userName}" has been deleted successfully`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const handleDownloadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download users data');
      }

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'users_export.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading users:', error);
      alert('Failed to download users data. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total {users.length} users
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadUsers}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Excel
          </button>
          <button
            onClick={handleExportContacts}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Export to Gmail
              </>
            )}
          </button>
          <button
            onClick={handleOpenGmailImport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.545l8.073-6.052C21.69 2.28 24 3.434 24 5.457z"/>
            </svg>
            Open Gmail Import
          </button>
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Users Card */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-100">Total Users</p>
              <p className="text-3xl font-bold text-white mt-2">{users.length}</p>
            </div>
            <Users className="h-12 w-12 text-indigo-200 opacity-80" />
          </div>
        </div>

        {/* Active Users Card */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-100">Active Users</p>
              <p className="text-3xl font-bold text-white mt-2">
                {users.filter(u => u.is_active).length}
              </p>
              <p className="text-xs text-green-100 mt-1">
                {users.length > 0 ? Math.round((users.filter(u => u.is_active).length / users.length) * 100) : 0}% of total
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-200 opacity-80" />
          </div>
        </div>

        {/* Inactive Users Card */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-100">Inactive Users</p>
              <p className="text-3xl font-bold text-white mt-2">
                {users.filter(u => !u.is_active).length}
              </p>
              <p className="text-xs text-red-100 mt-1">
                {users.length > 0 ? Math.round((users.filter(u => !u.is_active).length / users.length) * 100) : 0}% of total
              </p>
            </div>
            <XCircle className="h-12 w-12 text-red-200 opacity-80" />
          </div>
        </div>

        {/* Tikrar Participants Card */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-100">Tikrar Participants</p>
              <p className="text-3xl font-bold text-white mt-2">
                {users.filter(u => u.tikrar_registrations && u.tikrar_registrations.length > 0).length}
              </p>
              <p className="text-xs text-purple-100 mt-1">
                {users.length > 0 ? Math.round((users.filter(u => u.tikrar_registrations && u.tikrar_registrations.length > 0).length / users.length) * 100) : 0}% enrolled
              </p>
            </div>
            <Award className="h-12 w-12 text-purple-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Role Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Admin Role Card */}
        <div className="bg-white rounded-lg border border-purple-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-purple-800">Admin</h3>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
              {users.filter(u => u.role === 'admin').length}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {users.length > 0 ? Math.round((users.filter(u => u.role === 'admin').length / users.length) * 100) : 0}% of all users
          </p>
        </div>

        {/* Ustadzah Role Card */}
        <div className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-blue-800">Ustadzah</h3>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              {users.filter(u => u.role === 'ustadzah').length}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {users.length > 0 ? Math.round((users.filter(u => u.role === 'ustadzah').length / users.length) * 100) : 0}% of all users
          </p>
        </div>

        {/* Musyrifah Role Card */}
        <div className="bg-white rounded-lg border border-green-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-green-800">Musyrifah</h3>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              {users.filter(u => u.role === 'musyrifah').length}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {users.length > 0 ? Math.round((users.filter(u => u.role === 'musyrifah').length / users.length) * 100) : 0}% of all users
          </p>
        </div>

        {/* Thalibah Role Card */}
        <div className="bg-white rounded-lg border border-yellow-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-yellow-800">Thalibah</h3>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              {users.filter(u => u.role === 'thalibah').length}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {users.length > 0 ? Math.round((users.filter(u => u.role === 'thalibah').length / users.length) * 100) : 0}% of all users
          </p>
        </div>
      </div>

      <AdminDataTable
        data={users}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        rowKey="id"
        searchPlaceholder="Search users by name, email, role..."
        emptyMessage="No users found"
        emptyIcon={<Users className="mx-auto h-12 w-12 text-gray-400" />}
      />

      <AdminCrudModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedUser(null);
        }}
        onSubmit={handleSubmit}
        title={selectedUser ? 'Edit User' : 'Add New User'}
        fields={formFields}
        initialData={selectedUser || {}}
        isEditing={!!selectedUser}
      />

      <AdminDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This will remove all associated data."
        itemName={selectedUser?.full_name || selectedUser?.email}
      />

      {selectedUser && (
        <UserDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
          userId={selectedUser.id}
        />
      )}
    </div>
  );
}

// Halaqah Mentors Tab Component
function HalaqahMentorsTab({ mentors, onRefresh }: { mentors: HalaqahMentor[], onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Halaqah Mentors Assignment</h2>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {mentors.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No mentor assignments</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Halaqah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mentor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Primary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mentors.map((mentor) => (
                  <tr key={mentor.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {mentor.halaqah?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mentor.mentor?.full_name || '-'}</div>
                      <div className="text-sm text-gray-500">{mentor.mentor?.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${mentor.role === 'ustadzah' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {mentor.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${mentor.is_primary ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {mentor.is_primary ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(mentor.assigned_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Halaqah Students Tab Component
function HalaqahStudentsTab({ students, onRefresh }: { students: HalaqahStudent[], onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Halaqah Students Assignment</h2>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {students.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No student assignments</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Halaqah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thalibah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.halaqah?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.thalibah?.full_name || '-'}</div>
                      <div className="text-sm text-gray-500">{student.thalibah?.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${student.status === 'active' ? 'bg-green-100 text-green-800' :
                          student.status === 'transferred' ? 'bg-blue-100 text-blue-800' :
                          student.status === 'graduated' ? 'bg-purple-100 text-purple-800' :
                          student.status === 'dropped' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(student.assigned_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Pendaftaran Tab Component
interface PendaftaranTabProps {
  pendaftaran: Pendaftaran[];
  batches: Batch[];
  selectedBatchFilter: string;
  onBatchFilterChange: (batchId: string) => void;
  onRefresh: () => void;
}

function PendaftaranTab({ pendaftaran, batches, selectedBatchFilter, onBatchFilterChange }: PendaftaranTabProps) {
  // Filter pendaftaran by batch
  const filteredPendaftaran = selectedBatchFilter === 'all'
    ? pendaftaran
    : pendaftaran.filter(p => p.batch_id === selectedBatchFilter);

  const columns: Column<Pendaftaran>[] = [
    {
      key: 'thalibah_id',
      label: 'Thalibah',
      sortable: true,
      filterable: true,
      render: (reg) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{reg.thalibah?.full_name || '-'}</div>
          <div className="text-sm text-gray-500">{reg.thalibah?.email || '-'}</div>
        </div>
      ),
    },
    {
      key: 'program_id',
      label: 'Program',
      sortable: true,
      filterable: true,
      render: (reg) => reg.program?.name || '-',
    },
    {
      key: 'batch_id',
      label: 'Batch',
      sortable: true,
      filterable: true,
      render: (reg) => reg.batch?.name || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (reg) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
          ${reg.status === 'approved' ? 'bg-green-100 text-green-800' :
            reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
            reg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            reg.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
            'bg-blue-100 text-blue-800'}`}>
          {reg.status}
        </span>
      ),
    },
    {
      key: 'registration_date',
      label: 'Registration Date',
      sortable: true,
      render: (reg) => new Date(reg.registration_date).toLocaleDateString('id-ID'),
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (reg) => (
        <span className="max-w-xs truncate block">{reg.notes || '-'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Registrations Management</h2>
      </div>

      {/* Batch Filter */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
        <label className="text-sm font-medium text-gray-700">Filter by Batch:</label>
        <select
          value={selectedBatchFilter}
          onChange={(e) => onBatchFilterChange(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-green-500 focus:border-green-500"
        >
          <option value="all">All Batches ({pendaftaran.length})</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name} ({pendaftaran.filter(p => p.batch_id === batch.id).length})
            </option>
          ))}
        </select>
        {selectedBatchFilter !== 'all' && (
          <span className="text-sm text-gray-500">
            Showing {filteredPendaftaran.length} of {pendaftaran.length} registrations
          </span>
        )}
      </div>

      <AdminDataTable
        data={filteredPendaftaran}
        columns={columns}
        rowKey="id"
        searchPlaceholder="Search registrations by thalibah, program, batch..."
        emptyMessage="No registrations found"
        emptyIcon={<ClipboardList className="mx-auto h-12 w-12 text-gray-400" />}
        defaultItemsPerPage={25}
      />
    </div>
  );
}

// Presensi Tab Component
function PresensiTab({ presensi, onRefresh }: { presensi: Presensi[], onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>
        <p className="text-sm text-gray-500">Showing last 100 records</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {presensi.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Halaqah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thalibah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {presensi.map((pres) => (
                  <tr key={pres.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pres.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pres.halaqah?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pres.thalibah?.full_name || '-'}</div>
                      <div className="text-sm text-gray-500">{pres.thalibah?.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${pres.status === 'hadir' ? 'bg-green-100 text-green-800' :
                          pres.status === 'izin' ? 'bg-blue-100 text-blue-800' :
                          pres.status === 'sakit' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
                        {pres.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {pres.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pres.recorded_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Tikrar Tab Component
interface TikrarTabProps {
  tikrar: TikrarTahfidz[];
  batches: Batch[];
  selectedBatchFilter: string;
  onBatchFilterChange: (batchId: string) => void;
  onRefresh: () => void;
}

function TikrarTab({ tikrar, batches, selectedBatchFilter, onBatchFilterChange, onRefresh }: TikrarTabProps) {
  const { user } = useAuth();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<TikrarTahfidz | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // New states for comprehensive review
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [unapproveReason, setUnapproveReason] = useState('');
  const [showUnapproveModal, setShowUnapproveModal] = useState(false);

  // Filter tikrar by batch_id or batch_name
  const filteredTikrar = selectedBatchFilter === 'all'
    ? tikrar
    : tikrar.filter(t => t.batch_id === selectedBatchFilter);

  // Get only pending applications
  const pendingTikrar = filteredTikrar.filter(t => t.status === 'pending');

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(pendingTikrar.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const isSelected = (id: string) => selectedIds.includes(id);
  const isAllSelected = pendingTikrar.length > 0 && selectedIds.length === pendingTikrar.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < pendingTikrar.length;

  // Bulk action handlers
  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    setBulkAction('approve');
    setShowBulkConfirmModal(true);
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    setBulkAction('reject');
    setBulkRejectionReason('');
    setShowBulkConfirmModal(true);
  };

  // Handle approve all pending applications
  const handleApproveAll = async () => {
    if (stats.pending === 0) {
      toast('No pending applications to approve');
      return;
    }

    // Get all pending application IDs
    const allPendingIds = pendingTikrar.map(t => t.id);

    // Show confirmation dialog
    if (!window.confirm(
      `Are you sure you want to approve ALL ${stats.pending} pending applications?\n\nThis action cannot be undone.`
    )) {
      return;
    }

    setIsBulkProcessing(true);
    try {
      const response = await fetch('/api/admin/tikrar/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: allPendingIds,
          action: 'approve',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve all applications');
      }

      toast.success(`Successfully approved ${result.updatedCount} application(s)`);

      // Refresh data
      onRefresh();
    } catch (error: any) {
      console.error('Approve all error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const confirmBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const response = await fetch('/api/admin/tikrar/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedIds,
          action: bulkAction,
          rejectionReason: bulkAction === 'reject' ? bulkRejectionReason : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process bulk action');
      }

      alert(`Successfully ${bulkAction === 'approve' ? 'approved' : 'rejected'} ${result.updatedCount} application(s)`);

      // Reset state
      setSelectedIds([]);
      setShowBulkConfirmModal(false);
      setBulkAction(null);
      setBulkRejectionReason('');

      // Refresh data
      onRefresh();
    } catch (error: any) {
      console.error('Bulk action error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const cancelBulkAction = () => {
    setShowBulkConfirmModal(false);
    setBulkAction(null);
    setBulkRejectionReason('');
  };

  // CRUD handlers
  const handleEdit = (tikrarData: TikrarTahfidz) => {
    setSelectedApplication(tikrarData);
    setShowModal(true);
  };

  const handleDelete = (tikrarData: TikrarTahfidz) => {
    setSelectedApplication(tikrarData);
    setShowDeleteModal(true);
  };

  const handleView = (tikrarData: TikrarTahfidz) => {
    setSelectedApplication(tikrarData);
    setShowApprovalModal(true);
  };

  // New function for comprehensive review
  const handleReview = async (tikrarData: TikrarTahfidz) => {
    setLoadingReview(true);
    try {
      const response = await fetch(`/api/admin/tikrar/${tikrarData.id}`);
      if (!response.ok) throw new Error('Failed to fetch review data');
      const result = await response.json();

      if (result.success) {
        console.log('[DEBUG] Review data loaded:', result.data);
        console.log('[DEBUG] oral_submission_url:', result.data.oral_submission_url);
        console.log('[DEBUG] oral assessment fields:', {
          oral_makhraj_errors: result.data.oral_makhraj_errors,
          oral_sifat_errors: result.data.oral_sifat_errors,
          oral_mad_errors: result.data.oral_mad_errors,
          oral_ghunnah_errors: result.data.oral_ghunnah_errors,
          oral_harakat_errors: result.data.oral_harakat_errors,
          oral_total_score: result.data.oral_total_score,
          oral_assessment_status: result.data.oral_assessment_status,
        });
        setReviewData(result.data);
        setShowReviewModal(true);
      } else {
        toast.error('Failed to load review data');
      }
    } catch (error: any) {
      console.error('Error loading review data:', error);
      toast.error('Error loading review data: ' + error.message);
    } finally {
      setLoadingReview(false);
    }
  };

  // Function to handle unapprove
  const handleUnapprove = (tikrarData: TikrarTahfidz) => {
    setSelectedApplication(tikrarData);
    setShowUnapproveModal(true);
  };

  // Function to confirm unapprove
  const confirmUnapprove = async () => {
    if (!selectedApplication || !unapproveReason.trim()) {
      toast.error('Please provide a reason for unapproval');
      return;
    }

    try {
      const response = await fetch('/api/admin/tikrar/unapprove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          reason: unapproveReason.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unapprove application');
      }

      const result = await response.json();
      if (result.success) {
        toast.success('Application unapproved successfully');
        setShowUnapproveModal(false);
        setUnapproveReason('');
        setSelectedApplication(null);
        onRefresh();
      } else {
        throw new Error(result.error || 'Failed to unapprove application');
      }
    } catch (error: any) {
      console.error('Error unapproving application:', error);
      toast.error('Error unapproving application: ' + error.message);
    }
  };

  const columns: Column<TikrarTahfidz>[] = [
    {
      key: 'select',
      label: '',
      width: 'w-12',
      render: (t) => {
        if (t.status !== 'pending') return null;
        return (
          <input
            type="checkbox"
            checked={isSelected(t.id)}
            onChange={(e) => {
              e.stopPropagation();
              handleSelectOne(t.id, e.target.checked);
            }}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
          />
        );
      },
    },
    {
      key: 'approval_indicator',
      label: '✓ Ready',
      width: 'w-20',
      sortable: false,
      filterable: true,
      render: (t) => {
        // Check each field and collect missing ones
        const missingFields: string[] = [];

        if (!t.understands_commitment) missingFields.push('Memahami komitmen');
        if (!t.tried_simulation) missingFields.push('Mencoba simulasi');
        if (!t.no_negotiation) missingFields.push('Tidak ada negosiasi');
        if (!t.has_telegram) missingFields.push('Punya Telegram');
        if (!t.saved_contact) missingFields.push('Simpan kontak');
        if (!t.has_permission) missingFields.push('Punya izin');
        if (!t.permission_name) missingFields.push('Nama pemberi izin');
        if (!t.permission_phone) missingFields.push('No. HP pemberi izin');
        if (!t.chosen_juz) missingFields.push('Juz yang dipilih');
        if (!t.no_travel_plans) missingFields.push('Tidak ada rencana bepergian');
        if (!t.time_commitment) missingFields.push('Komitmen waktu');
        if (!t.understands_program) missingFields.push('Memahami program');
        if (!t.full_name) missingFields.push('Nama lengkap');
        if (!t.address) missingFields.push('Alamat');
        if (!t.wa_phone) missingFields.push('No. WhatsApp');
        if (!t.birth_date) missingFields.push('Tanggal lahir');
        if (!t.domicile) missingFields.push('Domisili');
        if (!t.main_time_slot) missingFields.push('Waktu setoran utama');
        if (!t.backup_time_slot) missingFields.push('Waktu setoran cadangan');

        const isComplete = missingFields.length === 0;

        return (
          <div className="flex justify-center">
            {isComplete ? (
              <div
                className="flex items-center gap-1 cursor-help"
                title="Semua field wajib sudah lengkap"
              >
                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-green-600 font-medium">Yes</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1 cursor-help group relative"
                title={`Field yang belum lengkap:\n${missingFields.join('\n')}`}
              >
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-red-400 font-medium">No</span>

                {/* Tooltip */}
                <div className="invisible group-hover:visible absolute z-50 left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                  <div className="font-semibold mb-2">Field yang belum lengkap ({missingFields.length}):</div>
                  <ul className="list-disc list-inside space-y-1">
                    {missingFields.map((field, idx) => (
                      <li key={idx}>{field}</li>
                    ))}
                  </ul>
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'full_name',
      label: 'Applicant',
      sortable: true,
      filterable: true,
      render: (t) => (
        <div>
          <button
            onClick={() => handleReview(t)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
          >
            {t.full_name || t.user?.full_name || '-'}
          </button>
          <div className="text-sm text-gray-500">{t.user?.email || '-'}</div>
        </div>
      ),
    },
    {
      key: 'batch_name',
      label: 'Batch',
      sortable: true,
      filterable: true,
      render: (t) => t.batch_name || t.batch?.name || '-',
    },
    {
      key: 'program_id',
      label: 'Program',
      sortable: true,
      filterable: true,
      render: (t) => t.program?.name || '-',
    },
    {
      key: 'chosen_juz',
      label: 'Chosen Juz',
      sortable: true,
      filterable: true,
      render: (t) => t.chosen_juz || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (t) => (
        <div className="flex items-center gap-2">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
            ${t.status === 'approved' ? 'bg-green-100 text-green-800' :
              t.status === 'rejected' ? 'bg-red-100 text-red-800' :
              t.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'}`}>
            {t.status}
          </span>
          {t.status === 'approved' && (
            <button
              onClick={() => handleUnapprove(t)}
              className="text-orange-600 hover:text-orange-800 text-xs font-medium"
              title="Cancel Approval"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'selection_status',
      label: 'Selection Status',
      sortable: true,
      filterable: true,
      render: (t) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
          ${t.selection_status === 'approved' ? 'bg-green-100 text-green-800' :
            t.selection_status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'}`}>
          {t.selection_status}
        </span>
      ),
    },
    {
      key: 'oral_total_score',
      label: 'Oral Score',
      sortable: true,
      filterable: true,
      // Custom sort function for proper ordering: Not submitted -> Pending -> Scores (low to high)
      sortFn: (a, b, direction) => {
        // Helper to get sort value: 0 = Not submitted, 1 = Pending, 2+ = Score value + 2
        const getSortValue = (t: TikrarTahfidz) => {
          if (!t.oral_submission_url) return 0; // Not submitted
          if (t.oral_total_score === null || t.oral_total_score === undefined) return 1; // Pending
          return t.oral_total_score + 2; // Score (add 2 to put after pending)
        };

        const aVal = getSortValue(a);
        const bVal = getSortValue(b);

        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      },
      // Custom filter to match status
      filterFn: (row, filterValue) => {
        const value = filterValue.toLowerCase();

        // Not submitted
        if (!row.oral_submission_url) {
          return value.includes('not') || value.includes('submit');
        }

        // Pending
        if (row.oral_total_score === null || row.oral_total_score === undefined) {
          return value.includes('pend');
        }

        // Score exists
        const isPassing = row.oral_total_score >= 70;
        if (value.includes('pass')) return isPassing;
        if (value.includes('fail')) return !isPassing;

        // Match score number
        return String(row.oral_total_score).includes(value);
      },
      render: (t) => {
        if (!t.oral_submission_url) {
          return <span className="text-xs text-gray-400">Not submitted</span>;
        }
        if (t.oral_total_score === null || t.oral_total_score === undefined) {
          return <span className="text-xs text-yellow-600 font-medium">Pending</span>;
        }
        const isPassing = t.oral_total_score >= 70;
        return (
          <div className="flex items-center gap-1">
            <span className={`text-sm font-bold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
              {t.oral_total_score.toFixed(0)}
            </span>
            <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${isPassing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isPassing ? 'PASS' : 'FAIL'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'submission_date',
      label: 'Submission Date',
      sortable: true,
      render: (t) => new Date(t.submission_date).toLocaleDateString('id-ID'),
    },
  ];

  // Form fields for CRUD modal
  const formFields: FormField[] = [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true },
    { name: 'batch_name', label: 'Batch Name', type: 'text', required: true },
    { name: 'chosen_juz', label: 'Chosen Juz', type: 'text', required: false },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'withdrawn', label: 'Withdrawn' },
        { value: 'completed', label: 'Completed' },
      ]
    },
    {
      name: 'selection_status',
      label: 'Selection Status',
      type: 'select',
      required: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ]
    },
  ];

  // Calculate statistics
  const stats = {
    total: filteredTikrar.length,
    pending: filteredTikrar.filter(t => t.status === 'pending').length,
    approved: filteredTikrar.filter(t => t.status === 'approved').length,
    rejected: filteredTikrar.filter(t => t.status === 'rejected').length,
    withdrawn: filteredTikrar.filter(t => t.status === 'withdrawn').length,
    completed: filteredTikrar.filter(t => t.status === 'completed').length,
    // Selection status
    selectionPending: filteredTikrar.filter(t => t.selection_status === 'pending').length,
    selectionApproved: filteredTikrar.filter(t => t.selection_status === 'approved').length,
    selectionRejected: filteredTikrar.filter(t => t.selection_status === 'rejected').length,
    // Test submissions
    oralSubmitted: filteredTikrar.filter(t => t.oral_submitted_at).length,
    writtenSubmitted: filteredTikrar.filter(t => t.written_submitted_at).length,
    bothTestsSubmitted: filteredTikrar.filter(t => t.oral_submitted_at && t.written_submitted_at).length,
  };

  // Calculate Juz distribution
  const juzDistribution = filteredTikrar.reduce((acc: Record<string, number>, t) => {
    const juz = t.chosen_juz || 'Not specified';
    acc[juz] = (acc[juz] || 0) + 1;
    return acc;
  }, {});

  // Calculate Covenant Time distribution
  const covenantTimeDistribution = filteredTikrar.reduce((acc: Record<string, number>, t) => {
    const time = t.main_time_slot || 'Not specified';
    acc[time] = (acc[time] || 0) + 1;
    return acc;
  }, {});

  // Calculate Province distribution (top 5)
  const provinceDistribution = filteredTikrar.reduce((acc: Record<string, number>, t) => {
    const province = t.domicile || 'Not specified';
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {});
  const topProvinces = Object.entries(provinceDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate Country distribution
  const countryDistribution = filteredTikrar.reduce((acc: Record<string, number>, t) => {
    const country = 'Indonesia'; // Default Indonesia
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  // Calculate Program distribution
  const programDistribution = filteredTikrar.reduce((acc: Record<string, number>, t) => {
    const program = t.program?.name || 'Not specified';
    acc[program] = (acc[program] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Batch Filter */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
        <label className="text-sm font-medium text-gray-700">Filter by Batch:</label>
        <select
          value={selectedBatchFilter}
          onChange={(e) => onBatchFilterChange(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-green-500 focus:border-green-500"
        >
          <option value="all">All Batches ({tikrar.length})</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name} ({tikrar.filter(t => t.batch_id === batch.id).length})
            </option>
          ))}
        </select>
        {selectedBatchFilter !== 'all' && (
          <span className="text-sm text-gray-500">
            Showing {filteredTikrar.length} of {tikrar.length} applications
          </span>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Applications</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <Award className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending Review</p>
              <p className="text-3xl font-bold mt-2">{stats.pending}</p>
              <p className="text-yellow-100 text-xs mt-1">
                {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% of total
              </p>
            </div>
            <div className="bg-yellow-400 bg-opacity-30 rounded-full p-3">
              <Clock className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Approved</p>
              <p className="text-3xl font-bold mt-2">{stats.approved}</p>
              <p className="text-green-100 text-xs mt-1">
                {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% of total
              </p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <CheckCircle className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Rejected</p>
              <p className="text-3xl font-bold mt-2">{stats.rejected}</p>
              <p className="text-red-100 text-xs mt-1">
                {stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}% of total
              </p>
            </div>
            <div className="bg-red-400 bg-opacity-30 rounded-full p-3">
              <XCircle className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Selection Status & Test Submission Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Selection Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Selection Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending Selection</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                {stats.selectionPending}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Selected</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                {stats.selectionApproved}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Not Selected</span>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                {stats.selectionRejected}
              </span>
            </div>
          </div>
        </div>

        {/* Test Submission Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Test Submissions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Oral Test</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {stats.oralSubmitted}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Written Test</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                {stats.writtenSubmitted}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Both Tests</span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                {stats.bothTestsSubmitted}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Other Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Withdrawn</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                {stats.withdrawn}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                {stats.completed}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.approved > 0 ? Math.round((stats.completed / stats.approved) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics - Juz, Covenant Time, Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Juz Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-green-600" />
            Chosen Juz Distribution
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(juzDistribution)
              .sort((a, b) => {
                // Sort by juz number if it's a number, otherwise alphabetically
                const aNum = parseInt(a[0].replace(/\D/g, ''));
                const bNum = parseInt(b[0].replace(/\D/g, ''));
                if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                return a[0].localeCompare(b[0]);
              })
              .map(([juz, count]) => (
                <div key={juz} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{juz}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Covenant Time Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            Covenant Time Preference
          </h3>
          <div className="space-y-2">
            {Object.entries(covenantTimeDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([time, count]) => (
                <div key={time} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{time}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Program Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-purple-600" />
            Program Selection
          </h3>
          <div className="space-y-2">
            {Object.entries(programDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([program, count]) => (
                <div key={program} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate max-w-[150px]" title={program}>
                    {program}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 5 Provinces */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Top 5 Provinces
          </h3>
          <div className="space-y-2">
            {topProvinces.map(([province, count], index) => (
              <div key={province} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 w-4">#{index + 1}</span>
                  <span className="text-sm text-gray-600 truncate max-w-[180px]" title={province}>
                    {province}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Country Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Country Distribution
          </h3>
          <div className="space-y-2">
            {Object.entries(countryDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([country, count]) => (
                <div key={country} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{country}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                    <span className="text-xs text-gray-500">
                      ({Math.round((count / stats.total) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Approve All Pending Applications */}
      {stats.pending > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Pending Applications</h3>
              <p className="text-sm text-blue-700 mt-1">
                {stats.pending} application(s) waiting for approval
              </p>
            </div>
            <button
              onClick={() => handleApproveAll()}
              disabled={isBulkProcessing}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Approve All Pending
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-900">
                {selectedIds.length} application(s) selected
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-sm text-green-700 hover:text-green-900 underline"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={isBulkProcessing}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Approve Selected
              </button>
              <button
                onClick={handleBulkReject}
                disabled={isBulkProcessing}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AdminDataTable with sorting */}
      <AdminDataTable
        data={filteredTikrar}
        columns={columns}
        rowKey="id"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        emptyMessage="No tikrar applications found"
        emptyIcon={<Award className="mx-auto h-12 w-12 text-gray-400" />}
      />

      {/* CRUD Modals */}
      <AdminCrudModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedApplication(null);
        }}
        onSubmit={async (formData) => {
          try {
            if (selectedApplication) {
              // Update - prepare update data
              const updateData = {
                full_name: formData.full_name,
                batch_name: formData.batch_name,
                chosen_juz: formData.chosen_juz,
                status: formData.status,
                selection_status: formData.selection_status,
              };

              // @ts-ignore - Supabase update types issue
              const { error } = await supabase
                .from('pendaftaran_tikrar_tahfidz')
                // @ts-ignore
                .update(updateData)
                .eq('id', selectedApplication.id);

              if (error) throw error;
              toast.success('Application updated successfully');
            }
            setShowModal(false);
            setSelectedApplication(null);
            onRefresh();
          } catch (error: any) {
            toast.error(error.message);
          }
        }}
        title={selectedApplication ? 'Edit Application' : 'Create Application'}
        fields={formFields}
        initialData={selectedApplication || undefined}
      />

      <AdminDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedApplication(null);
        }}
        onConfirm={async () => {
          try {
            if (selectedApplication) {
              const response = await fetch(`/api/pendaftaran/tikrar/${selectedApplication.id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete application');
              }

              toast.success('Application deleted successfully');
            }
            setShowDeleteModal(false);
            setSelectedApplication(null);
            onRefresh();
          } catch (error: any) {
            toast.error(error.message || 'Failed to delete application');
          }
        }}
        title="Delete Application"
        message={`Are you sure you want to delete the application from "${selectedApplication?.full_name}"? This action cannot be undone.`}
      />

      {/* Bulk Confirmation Modal */}
      {showBulkConfirmModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={cancelBulkAction}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${bulkAction === 'approve' ? 'bg-green-100' : 'bg-red-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                    {bulkAction === 'approve' ? (
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {bulkAction === 'approve' ? 'Bulk Approve Applications' : 'Bulk Reject Applications'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to {bulkAction} {selectedIds.length} application(s)? This action cannot be undone.
                      </p>

                      {bulkAction === 'reject' && (
                        <div className="mt-4">
                          <label htmlFor="bulk-rejection-reason" className="block text-sm font-medium text-gray-700 mb-2">
                            Rejection Reason (Optional)
                          </label>
                          <textarea
                            id="bulk-rejection-reason"
                            rows={3}
                            value={bulkRejectionReason}
                            onChange={(e) => setBulkRejectionReason(e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Enter reason for rejection..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={confirmBulkAction}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    bulkAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {isBulkProcessing ? 'Processing...' : `Yes, ${bulkAction}`}
                </button>
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={cancelBulkAction}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
        onRefresh={onRefresh}
      />

      {/* Comprehensive Review Modal */}
      {showReviewModal && reviewData && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowReviewModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Comprehensive Application Review</h3>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* User Profile Section */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    User Profile
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-sm text-gray-900">{reviewData.user?.full_name || reviewData.full_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{reviewData.user?.email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">WhatsApp</label>
                      <p className="text-sm text-gray-900">{reviewData.user?.whatsapp || reviewData.wa_phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Birth Date</label>
                      <p className="text-sm text-gray-900">{reviewData.user?.tanggal_lahir || reviewData.birth_date || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-sm text-gray-900">{reviewData.user?.alamat || reviewData.address || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">City</label>
                      <p className="text-sm text-gray-900">{reviewData.user?.kota || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Province</label>
                      <p className="text-sm text-gray-900">{reviewData.user?.provinsi || reviewData.domicile || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Timezone</label>
                      <p className="text-sm text-gray-900">{reviewData.user?.zona_waktu || reviewData.timezone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Telegram</label>
                      <p className="text-sm text-gray-900">{reviewData.user?.telegram || reviewData.telegram_phone || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Application Details Section */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Application Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Batch</label>
                      <p className="text-sm text-gray-900">{reviewData.batch?.name || reviewData.batch_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Program</label>
                      <p className="text-sm text-gray-900">{reviewData.program?.name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Chosen Juz</label>
                      <p className="text-sm text-gray-900">{reviewData.chosen_juz || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Main Time Slot</label>
                      <p className="text-sm text-gray-900">{reviewData.main_time_slot || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Backup Time Slot</label>
                      <p className="text-sm text-gray-900">{reviewData.backup_time_slot || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ready for Team</label>
                      <p className="text-sm text-gray-900 capitalize">{reviewData.ready_for_team || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Understands Commitment</label>
                      <p className="text-sm text-gray-900">{reviewData.understands_commitment ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tried Simulation</label>
                      <p className="text-sm text-gray-900">{reviewData.tried_simulation ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Time Commitment</label>
                      <p className="text-sm text-gray-900">{reviewData.time_commitment ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {reviewData.motivation && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500">Motivation</label>
                      <p className="text-sm text-gray-900 mt-1">{reviewData.motivation}</p>
                    </div>
                  )}

                  {reviewData.questions && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500">Questions</label>
                      <p className="text-sm text-gray-900 mt-1">{reviewData.questions}</p>
                    </div>
                  )}
                </div>

                {/* Permission Details */}
                {reviewData.has_permission && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Permission Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Permission Name</label>
                        <p className="text-sm text-gray-900">{reviewData.permission_name || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Permission Phone</label>
                        <p className="text-sm text-gray-900">{reviewData.permission_phone || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Written Test Results Section */}
                {reviewData.written_quiz_answers && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Written Test Results
                    </h4>
                    <div className="space-y-3">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-indigo-600">
                          {reviewData.written_quiz_score || 0}%
                        </p>
                        <p className="text-sm text-gray-500">
                          {reviewData.written_quiz_correct_answers || 0} / {reviewData.written_quiz_total_questions || 0} Correct
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${reviewData.written_quiz_score || 0}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>Submitted: {reviewData.written_quiz_submitted_at ? new Date(reviewData.written_quiz_submitted_at).toLocaleString('id-ID') : '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Oral Assessment Section */}
                {reviewData.oral_submission_url && (
                  <div className="mb-6">
                    <OralAssessment
                      registrationId={reviewData.id}
                      oralSubmissionUrl={reviewData.oral_submission_url}
                      currentAssessment={reviewData}
                      onSave={async (assessmentData) => {
                        try {
                          const response = await fetch(`/api/pendaftaran/tikrar/${reviewData.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              ...assessmentData,
                              oral_assessed_by: user?.id,
                              oral_assessed_at: new Date().toISOString(),
                            }),
                          });

                          if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.error || 'Failed to save assessment');
                          }

                          // Update selection_status based on assessment result
                          const selectionStatus = assessmentData.oral_assessment_status === 'pass'
                            ? 'approved'
                            : 'rejected';

                          await fetch(`/api/pendaftaran/tikrar/${reviewData.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              selection_status: selectionStatus,
                            }),
                          });

                          toast.success('Penilaian oral berhasil disimpan!');

                          // Refresh the data
                          onRefresh();
                          setShowReviewModal(false);
                        } catch (error: any) {
                          toast.error(error.message || 'Gagal menyimpan penilaian');
                          throw error;
                        }
                      }}
                    />
                  </div>
                )}

                {/* Application Status */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Application Status
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${reviewData.status === 'approved' ? 'bg-green-100 text-green-800' :
                            reviewData.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}`}>
                          {reviewData.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Selection Status</label>
                      <div className="mt-1">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${reviewData.selection_status === 'approved' ? 'bg-green-100 text-green-800' :
                            reviewData.selection_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}`}>
                          {reviewData.selection_status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Submission Date</label>
                      <p className="text-sm text-gray-900">{new Date(reviewData.submission_date).toLocaleDateString('id-ID')}</p>
                    </div>
                    {reviewData.approved_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Approved At</label>
                        <p className="text-sm text-gray-900">{new Date(reviewData.approved_at).toLocaleString('id-ID')}</p>
                      </div>
                    )}
                  </div>
                  {reviewData.approver && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500">Approved By</label>
                      <p className="text-sm text-gray-900">{reviewData.approver.full_name} ({reviewData.approver.email})</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unapprove Confirmation Modal */}
      {showUnapproveModal && selectedApplication && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUnapproveModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Cancel Approval
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to cancel the approval for "{selectedApplication.full_name}"?
                      </p>
                      <div className="mt-4">
                        <label htmlFor="unapprove-reason" className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Cancellation <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="unapprove-reason"
                          rows={3}
                          value={unapproveReason}
                          onChange={(e) => setUnapproveReason(e.target.value)}
                          className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter reason for cancellation..."
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmUnapprove}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel Approval
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnapproveModal(false);
                    setUnapproveReason('');
                    setSelectedApplication(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reports Tab Component
function ReportsTab() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    const timeout = setTimeout(() => {
      console.error('Report loading timeout');
      setLoading(false);
    }, 20000); // 20 second timeout for reports

    try {
      // Fetch all report data with error handling
      const [
        registrationsResult,
        halaqahStudentsResult,
        presensiResult,
        usersResult,
        tikrarTahfidzResult
      ] = await Promise.allSettled([
        // @ts-ignore
        supabase.from('pendaftaran').select('*, thalibah:users!pendaftaran_thalibah_id_fkey(full_name, email), program:programs(name), batch:batches(name)'),
        // @ts-ignore
        supabase.from('halaqah_students').select('*, halaqah:halaqah(name), thalibah:users!halaqah_students_thalibah_id_fkey(full_name, email)'),
        // @ts-ignore
        supabase.from('presensi').select('*, halaqah:halaqah(name), thalibah:users!presensi_thalibah_id_fkey(full_name)').order('date', { ascending: false }).limit(100),
        // @ts-ignore
        supabase.from('users').select('*'),
        // @ts-ignore
        supabase.from('pendaftaran_tikrar_tahfidz').select('*, users!pendaftaran_tikrar_tahfidz_user_id_fkey(full_name, email), batches(name), programs(name)')
      ]);

      // Extract data with error handling
      const registrations = registrationsResult.status === 'fulfilled' ? registrationsResult.value.data : [];
      const halaqahStudents = halaqahStudentsResult.status === 'fulfilled' ? halaqahStudentsResult.value.data : [];
      const presensi = presensiResult.status === 'fulfilled' ? presensiResult.value.data : [];
      const users = usersResult.status === 'fulfilled' ? usersResult.value.data : [];
      const tikrarTahfidz = tikrarTahfidzResult.status === 'fulfilled' ? tikrarTahfidzResult.value.data : [];

      // Log errors if any
      if (registrationsResult.status === 'rejected') {
        console.error('Error loading registrations for report:', registrationsResult.reason);
      }
      if (halaqahStudentsResult.status === 'rejected') {
        console.error('Error loading halaqah students for report:', halaqahStudentsResult.reason);
      }
      if (presensiResult.status === 'rejected') {
        console.error('Error loading presensi for report:', presensiResult.reason);
      }
      if (usersResult.status === 'rejected') {
        console.error('Error loading users for report:', usersResult.reason);
      }
      if (tikrarTahfidzResult.status === 'rejected') {
        console.error('Error loading tikrar for report:', tikrarTahfidzResult.reason);
      }

      // Process data for reports
      const usersByRole = users?.reduce((acc: any, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      const registrationsByStatus = registrations?.reduce((acc: any, reg: any) => {
        acc[reg.status] = (acc[reg.status] || 0) + 1;
        return acc;
      }, {});

      const tikrarByStatus = tikrarTahfidz?.reduce((acc: any, tikrar: any) => {
        acc[tikrar.status] = (acc[tikrar.status] || 0) + 1;
        return acc;
      }, {});

      const presensiByStatus = presensi?.reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      setReportData({
        registrations,
        halaqahStudents,
        presensi,
        users,
        tikrarTahfidz,
        usersByRole,
        registrationsByStatus,
        tikrarByStatus,
        presensiByStatus
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>

      {/* Users by Role */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {reportData?.usersByRole && Object.entries(reportData.usersByRole).map(([role, count]: [string, any]) => (
            <div key={role} className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 capitalize">{role}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Registration Status */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {reportData?.registrationsByStatus && Object.entries(reportData.registrationsByStatus).map(([status, count]: [string, any]) => (
            <div key={status} className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 capitalize">{status}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tikrar Tahfidz Status */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tikrar Tahfidz Applications</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {reportData?.tikrarByStatus && Object.entries(reportData.tikrarByStatus).map(([status, count]: [string, any]) => (
            <div key={status} className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 capitalize">{status}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary (Last 100 records)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {reportData?.presensiByStatus && Object.entries(reportData.presensiByStatus).map(([status, count]: [string, any]) => (
            <div key={status} className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 capitalize">{status}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thalibah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.registrations?.slice(0, 10).map((reg: any) => (
                <tr key={reg.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reg.thalibah?.full_name || reg.thalibah?.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reg.program?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reg.batch?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                        reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        reg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(reg.registration_date).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Halaqah Students */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Halaqah Students Assignment</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Halaqah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thalibah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.halaqahStudents?.slice(0, 10).map((hs: any) => (
                <tr key={hs.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hs.halaqah?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hs.thalibah?.full_name || hs.thalibah?.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${hs.status === 'active' ? 'bg-green-100 text-green-800' :
                        hs.status === 'graduated' ? 'bg-blue-100 text-blue-800' :
                        hs.status === 'dropped' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {hs.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(hs.assigned_at).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
