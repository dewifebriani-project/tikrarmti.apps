'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { createUser, updateUser, resetUserPassword } from './actions';
import toast, { Toaster } from 'react-hot-toast';
import {
  Users,
  Calendar,
  BookOpen,
  GraduationCap,
  UserCheck,
  FileText,
  BarChart3,
  Plus,
  LayoutGrid,
  UserPlus,
  UserMinus,
  ShieldCheck,
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
  X,
  HelpCircle,
  RefreshCw,
  HeartHandshake,
  Info,
  Shield
} from 'lucide-react';
import { AdminDataTable, Column } from '@/components/AdminDataTable';
import { AdminCrudModal, FormField } from '@/components/AdminCrudModal';
import { AdminDeleteModal } from '@/components/AdminDeleteModal';
import { UserDetailDashboardModal as UserDetailModal } from '@/components/UserDetailDashboardModal';
import AdminApprovalModal from '@/components/AdminApprovalModalFixed';
import { useAdminUsers, useAdminTikrar, useAdminStats } from '@/lib/hooks/useAdminData';
import { AdminExamQuestions } from '@/components/AdminExamQuestions';
import { AdminExamImport } from '@/components/AdminExamImport';
import { AdminAddQuestion } from '@/components/AdminAddQuestion';
import { AdminExamSettings } from '@/components/AdminExamSettings';
import AdminOrphanedUsers from '@/components/AdminOrphanedUsers';
import { HalaqahManagementTab } from '@/components/HalaqahManagementTab';
import { AnalysisTab } from '@/components/AnalysisTab';
import { SystemLogsTab } from '@/components/SystemLogsTab';
import AdminPairingTab from '@/components/AdminPairingTab';
import { DaftarUlangTab } from '@/components/DaftarUlangTab';
import { EditRoleModal } from '@/components/EditRoleModal';
import { EditUserModal } from '@/components/EditUserModal';
import { AdminRlsPoliciesTab } from '@/components/AdminRlsPoliciesTab';
import { AdminBlacklistTab } from '@/components/AdminBlacklistTab';
import { TikrarTab as TikrarManagementTab } from '@/components/admin/tikrar/TikrarTab';
import { cn } from '@/lib/utils';


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
  holiday_dates?: string[];
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
  role?: string;
  roles?: string[];
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
    re_enrollment_completed?: boolean;
    batch?: {
      name: string;
      status: string;
    };
  }>;
  daftar_ulang_submissions?: Array<{
    id: string;
    user_id: string;
    batch_id: string;
    registration_id: string;
    status: string;
    submitted_at: string;
    reviewed_at?: string;
  }>;
  muallimah_registrations?: Array<{
    id: string;
    batch_id: string;
    status: string;
  }>;
  musyrifah_registrations?: Array<{
    id: string;
    batch_id: string;
    status: string;
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
  alasan_mengundurkan_diri?: string;
  written_quiz_score?: number;
  written_quiz_total_questions?: number;
  written_quiz_correct_answers?: number;
  written_quiz_submitted_at?: string;
  written_exam_submitted_at?: string;
  written_exam_status?: string;
  exam_score?: number;
  exam_submitted_at?: string;
  exam_status?: string;
  exam_juz_number?: number;
  user?: User;
  batch?: { name: string };
  program?: { name: string };
}

type TabType = 'overview' | 'users' | 'batches' | 'programs' | 'halaqah' | 'presensi' | 'tikrar' | 'daftar-ulang' | 'exam-questions' | 'analysis' | 'pairing' | 'system-logs' | 'reports' | 'rls-policies' | 'blacklist';

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Initialize activeTab from localStorage or default to 'overview'
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Handle tab from URL search parameters or localStorage
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      const savedTab = localStorage.getItem('adminActiveTab');
      if (savedTab) setActiveTab(savedTab as TabType);
    }
  }, [searchParams]);

  // SECURITY NOTE: This is for UI conditional rendering ONLY.
  // Actual authorization is enforced server-side via RLS policies.
  // Even if client-side check is bypassed, RLS will block unauthorized access.
  const isAdmin: boolean = !authLoading && user?.roles?.includes('admin') === true;

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
  const [presensi, setPresensi] = useState<Presensi[]>([]);
  const [muallimah, setMuallimah] = useState<any[]>([]);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [selectionStatusFilter, setSelectionStatusFilter] = useState<string>('all');

  // Exam modal states
  const [showExamImportModal, setShowExamImportModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [activeExamSubTab, setActiveExamSubTab] = useState<'questions' | 'settings'>('questions');

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
    console.log('User role:', user?.roles);
    console.log('Is Admin:', isAdmin);
    console.log('SWR States - Users loading:', usersLoading, 'Tikrar loading:', tikrarLoading, 'Stats loading:', statsLoading);

    if (!authLoading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
      } else if (!user.roles?.includes('admin')) {
        console.log('User is not admin, roles:', user.roles);
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

  // Reset selection status filter when batch changes
  useEffect(() => {
    setSelectionStatusFilter('all');
  }, [selectedBatchFilter]);

  // Disable eslint exhaustive-deps warning for loadData
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const loadData = async () => {
    console.log('loadData called for tab:', activeTab);
    setDataLoading(true);

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error('Request aborted after 30 seconds for tab:', activeTab);
      toast.error(`Loading timeout for ${activeTab}. Please try again.`);
      setDataLoading(false);
    }, 30000); // 30 second timeout

    try {
      console.log('=== Starting data load for tab:', activeTab, '===', new Date().toISOString());

      // Overview, Users, and Tikrar tabs have partial data handled by SWR hooks
      if (activeTab === 'overview') {
        // Data is loaded automatically by useAdminStats hook
        console.log('Overview stats handled by SWR');
      } else if (activeTab === 'tikrar') {
        // Data is loaded automatically by useAdminTikrar hook
        console.log('Tikrar data handled by SWR');
      } else if (activeTab === 'batches') {
        console.log('Fetching batches via API...');
        const response = await fetch('/api/admin/batches', { signal: controller.signal });
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
      } else if (activeTab === 'users') {
        // Load batches first (needed for muallimah filter)
        if (batches.length === 0) {
          const batchResponse = await fetch('/api/admin/batches', { signal: controller.signal });
          if (batchResponse.ok) {
            const batchResult = await batchResponse.json();
            console.log(`Batches loaded: ${batchResult.data?.length || 0} records`);
            setBatches(batchResult.data || []);
          }
        }

        // Load muallimah data when users tab is active
        const response = await fetch('/api/admin/muallimah?skipCount=true', { signal: controller.signal });
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error loading muallimah:', errorData);
          toast.error(errorData.error || 'Error loading muallimah');
          setMuallimah([]);
        } else {
          const result = await response.json();
          console.log(`Muallimah loaded: ${result.data?.length || 0} records`);
          setMuallimah(result.data || []);
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
    { id: 'batches' as TabType, name: 'Batches', icon: Calendar },
    { id: 'programs' as TabType, name: 'Programs', icon: BookOpen },
    { id: 'halaqah' as TabType, name: 'Halaqah', icon: Users },
    { id: 'presensi' as TabType, name: 'Presensi', icon: Clock },
    { id: 'tikrar' as TabType, name: 'Tikrar Tahfidz', icon: Award },
    { id: 'daftar-ulang' as TabType, name: 'Daftar Ulang', icon: FileText },
    { id: 'exam-questions' as TabType, name: 'Exam Questions', icon: HelpCircle },
    { id: 'analysis' as TabType, name: 'Analysis', icon: BarChart3 },
    { id: 'pairing' as TabType, name: 'Pairing', icon: HeartHandshake },
    { id: 'system-logs' as TabType, name: 'System Logs', icon: AlertCircle },
    { id: 'reports' as TabType, name: 'Reports', icon: FileText },
    { id: 'rls-policies' as TabType, name: 'RLS Policies', icon: Shield },
    { id: 'blacklist' as TabType, name: 'Blacklist', icon: XCircle }
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
      {/* Admin Header - Premium Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900 to-green-800 p-8 text-white shadow-2xl mb-8 -mx-2 sm:mx-0">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs font-medium mb-3">
                <Shield className="w-3 h-3 text-yellow-400" />
                <span>Tikrar MTI Authority Console</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-green-50/80 text-sm max-w-xl">
                Kelola data master, pendaftaran, dan pantau kesehatan sistem Markaz Tikrar Indonesia secara real-time.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col items-center justify-center">
                <LayoutGrid className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-green-400/10 rounded-full blur-3xl" />
      </div>


      {/* Tabs - Modern Pill Style */}
      <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <nav className="flex gap-2 p-1.5 bg-gray-100/50 rounded-2xl w-max" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.push(`/admin?tab=${tab.id}`, { scroll: false });
                }}
                className={cn(
                  "flex items-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300",
                  isSelected
                    ? "bg-white text-green-900 shadow-sm border border-green-900/10"
                    : "text-gray-500 hover:text-green-800 hover:bg-white/50"
                )}
              >
                <Icon className={cn("w-4 h-4 transition-transform", isSelected && "scale-110")} />
                <span>{tab.name}</span>
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
            <UsersTab
              users={swrUsers}
              muallimah={muallimah}
              batches={batches}
              selectedBatchFilter={selectedBatchFilter}
              onBatchFilterChange={setSelectedBatchFilter}
              onRefresh={loadData}
              onUsersRefresh={() => mutateUsers()}
            />
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
        {activeTab === 'presensi' && <PresensiTab presensi={presensi} onRefresh={loadData} />}
        {activeTab === 'tikrar' && (
          <TikrarManagementTab user={user} />
        )}
        {activeTab === 'exam-questions' && (
          <div className="space-y-6">
            {/* Exam Sub-tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveExamSubTab('questions')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeExamSubTab === 'questions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Questions
                </button>
                <button
                  onClick={() => setActiveExamSubTab('settings')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeExamSubTab === 'settings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>

            {/* Sub-tab Content */}
            {activeExamSubTab === 'questions' && (
              <AdminExamQuestions
                onImportClick={() => setShowExamImportModal(true)}
                onAddManualClick={() => setShowAddQuestionModal(true)}
              />
            )}
            {activeExamSubTab === 'settings' && (
              <AdminExamSettings />
            )}
          </div>
        )}
        {activeTab === 'halaqah' && <HalaqahManagementTab />}
        {activeTab === 'daftar-ulang' && <DaftarUlangTab batchId={selectedBatchFilter} />}
        {activeTab === 'analysis' && <AnalysisTab />}
        {activeTab === 'pairing' && <AdminPairingTab />}
        {activeTab === 'system-logs' && <SystemLogsTab isActive={activeTab === 'system-logs'} />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'rls-policies' && <AdminRlsPoliciesTab />}
        {activeTab === 'blacklist' && <AdminBlacklistTab />}
      </div>

      {/* Exam Import Modal */}
      {showExamImportModal && (
        <AdminExamImport
          onClose={() => setShowExamImportModal(false)}
          onImportSuccess={() => {
            setShowExamImportModal(false);
            // Trigger refresh of exam questions if needed
          }}
        />
      )}

      {/* Add Question Modal */}
      {showAddQuestionModal && (
        <AdminAddQuestion
          onClose={() => setShowAddQuestionModal(false)}
          onSuccess={() => {
            setShowAddQuestionModal(false);
            // Trigger refresh of exam questions if needed
          }}
        />
      )}

      {/* Debug Panel */}
      <div className="mt-8 border-t-2 border-red-500 bg-gray-900 text-white p-4 rounded-lg">
        <details>
          <summary className="cursor-pointer font-bold text-red-400 hover:text-red-300">
            Debug Panel (Click to expand)
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Current State</h3>
              <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`Active Tab: ${activeTab}
Selected Batch Filter: ${selectedBatchFilter || 'all'}
Selection Status Filter: ${selectionStatusFilter || 'all'}
Data Loading: ${dataLoading ? 'Yes' : 'No'}
Auth Loading: ${authLoading ? 'Yes' : 'No'}
Loading: ${loading ? 'Yes' : 'No'}
Is Admin: ${isAdmin ? 'Yes' : 'No'}`}
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">User Info</h3>
              <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`User ID: ${user?.id || 'N/A'}
User Email: ${user?.email || 'N/A'}
User Roles: ${user?.roles?.join(', ') || 'N/A'}`}
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">SWR Data Counts</h3>
              <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`SWR Users: ${swrUsers?.length || 0}
SWR Tikrar: ${swrTikrar?.length || 0}
SWR Stats: ${swrStats ? 'Loaded' : 'Not loaded'}
Batches: ${batches?.length || 0}
Programs: ${programs?.length || 0}
Presensi: ${presensi?.length || 0}
Muallimah: ${muallimah?.length || 0}`}
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Loading States</h3>
              <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`Users Loading: ${usersLoading ? 'Yes' : 'No'}
Tikrar Loading: ${tikrarLoading ? 'Yes' : 'No'}
Stats Loading: ${statsLoading ? 'Yes' : 'No'}`}
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Session Info</h3>
              <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`Session Active: ${!!user}
Time: ${new Date().toLocaleString('id-ID')}`}
              </pre>
            </div>
          </div>
        </details>
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="group glass-premium rounded-3xl p-6 border border-white hover:border-green-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 animate-fadeInUp"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12",
                stat.color === 'bg-blue-500' ? "bg-blue-50 text-blue-600" :
                stat.color === 'bg-indigo-500' ? "bg-indigo-50 text-indigo-600" :
                stat.color === 'bg-green-500' ? "bg-green-50 text-green-600" :
                stat.color === 'bg-purple-500' ? "bg-purple-50 text-purple-600" :
                stat.color === 'bg-yellow-500' ? "bg-yellow-50 text-yellow-600" :
                stat.color === 'bg-pink-500' ? "bg-pink-50 text-pink-600" :
                stat.color === 'bg-red-500' ? "bg-red-50 text-red-600" :
                "bg-orange-50 text-orange-600"
              )}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.name}</p>
            <h4 className="text-3xl font-black text-gray-900">{stat.value}</h4>
          </div>
        );
      })}
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

    const supabase = createClient();

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
    id: batch?.id,
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
    holiday_dates: Array.isArray(batch?.holiday_dates) ? batch.holiday_dates.map(d => extractDate(d)) : [],
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

              {/* Holiday Management */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-red-900 mb-3 flex items-center justify-between">
                  <span>Tanggal Libur & Break</span>
                  <span className="text-[10px] font-normal text-red-700 italic">Pekan akan bergeser otomatis</span>
                </h5>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      id="holiday-input"
                      className="flex-1 border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-red-500 focus:border-red-500"
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        const input = document.getElementById('holiday-input') as HTMLInputElement;
                        if (!input?.value) return;
                        if (formData.holiday_dates.includes(input.value)) return;
                        setFormData({ ...formData, holiday_dates: [...formData.holiday_dates, input.value].sort() });
                        input.value = '';
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition-all shadow-sm"
                    >
                      Tambah Libur
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.holiday_dates.length === 0 ? (
                      <p className="text-[10px] text-gray-400 italic">Belum ada tanggal libur yang diatur.</p>
                    ) : (
                      formData.holiday_dates.map(date => (
                        <div key={date} className="flex items-center gap-2 bg-white border border-red-200 px-2.5 py-1 rounded-full text-xs font-semibold text-red-800 shadow-sm">
                          <Clock className="w-3 h-3" />
                          {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          <button 
                             type="button"
                             onClick={() => setFormData({ ...formData, holiday_dates: formData.holiday_dates.filter(d => d !== date) })}
                             className="text-red-400 hover:text-red-700 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
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

    const supabase = createClient();

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
    const supabase = createClient();
    const { data } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });
    setBatches(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

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
    const supabase = createClient();

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
    const supabase = createClient();
    const { data } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    setPrograms(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

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
interface UsersTabProps {
  users: User[];
  muallimah: any[];
  batches: Batch[];
  selectedBatchFilter: string;
  onBatchFilterChange: (filter: string) => void;
  onRefresh: () => void;
  onUsersRefresh: () => void;
}

function UsersTab({
  users,
  muallimah,
  batches,
  selectedBatchFilter,
  onBatchFilterChange,
  onRefresh,
  onUsersRefresh
}: UsersTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'admin' | 'thalibah' | 'muallimah' | 'musyrifah' | 'orphaned'>('all');

  // Bulk upgrade state
  const [upgradingUsers, setUpgradingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Filter users by role based on actual registrations, supporting multi-role
  // A user can appear in multiple tabs if they have multiple roles/registrations

  // Admin: roles includes 'admin'
  const adminUsers = users.filter(u => u.roles?.includes('admin'));

  // Thalibah: has 'thalibah' role OR has re-enrolled registration OR has daftar_ulang submission (submitted/approved)
  const thalibahUsers = users.filter(u => {
    // Check if user has thalibah role
    const hasThalibahRole = u.roles?.includes('thalibah');
    if (hasThalibahRole) return true;

    // Check if user has re-enrolled registration
    const hasTikrar = u.tikrar_registrations && u.tikrar_registrations.length > 0;
    if (hasTikrar) {
      const hasReEnrolled = u.tikrar_registrations!.some(reg =>
        reg.re_enrollment_completed === true
      );
      if (hasReEnrolled) return true;
    }

    // Check if user has daftar_ulang submission (submitted OR approved)
    const hasDaftarUlangSubmission = u.daftar_ulang_submissions &&
      u.daftar_ulang_submissions.some((sub: any) =>
        sub.status === 'submitted' || sub.status === 'approved'
      );
    if (hasDaftarUlangSubmission) return true;

    return false;
  });

  // Muallimah: has muallimah_registration OR role='ustadzah'
  const muallimahUsers = users.filter(u => {
    const hasMuallimahRegistration = u.muallimah_registrations && u.muallimah_registrations.length > 0;
    const isUstadzahRole = u.role === 'ustadzah';
    return hasMuallimahRegistration || isUstadzahRole;
  });

  // Musyrifah: has musyrifah_registration OR role='musyrifah'
  const musyrifahUsers = users.filter(u => {
    const hasMusyrifahRegistration = u.musyrifah_registrations && u.musyrifah_registrations.length > 0;
    const isMusyrifahRole = u.role === 'musyrifah';
    return hasMusyrifahRegistration || isMusyrifahRole;
  });

  // Get filtered users based on active sub-tab
  const getFilteredUsers = () => {
    switch (activeSubTab) {
      case 'admin':
        return adminUsers;
      case 'thalibah':
        return thalibahUsers;
      case 'muallimah':
        return muallimahUsers;
      case 'musyrifah':
        return musyrifahUsers;
      case 'orphaned':
        return []; // Handled separately by AdminOrphanedUsers component
      default:
        return users;
    }
  };

  const filteredUsers = getFilteredUsers();
  
  const handleResetPassword = async (user: User) => {
    if (window.confirm(`Reset password untuk ${user.full_name || user.email} menjadi default 'MTI123!'?`)) {
      try {
        const result = await resetUserPassword(user.id);
        if (result.success) {
          toast.success(result.message || 'Password reset successful');
        } else {
          toast.error(result.error || 'Failed to reset password');
        }
      } catch (error) {
        toast.error('Unexpected error resetting password');
      }
    }
  };

  // Build columns dynamically based on active sub-tab
  const getColumns = (): Column<User>[] => {
    const baseColumns: Column<User>[] = [
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
      render: (user: any) => {
        // Handle both new format (roles array) and old format (role string)
        const roles = user.roles || [(user as any)?.role].filter(Boolean);
        // Prioritize roles array over role varchar for display
        const primaryRole = roles?.[0] || user.role || '-';

        const getRoleBadge = (role: string) => {
          switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'thalibah': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'muallimah': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'musyrifah': return 'bg-green-100 text-green-800 border-green-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
          }
        };

        const formatRoleName = (role: string) => {
          if (role === 'ustadzah' || role === 'muallimah') return 'Muallimah';
          return role.charAt(0).toUpperCase() + role.slice(1);
        };

        return (
          <div className="flex flex-col gap-1.5">
            {/* Primary role badge */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadge(primaryRole)}`}>
                {formatRoleName(primaryRole)}
                {roles?.length > 1 && <span className="ml-1">+{roles.length - 1}</span>}
              </span>
            </div>

            {/* Edit Role button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditRole(user);
              }}
              className="text-xs text-purple-600 hover:text-purple-800 underline"
            >
              Edit Roles
            </button>

            {/* Show all roles if multiple */}
            {roles && roles.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {roles.map((role: string) => (
                  <span
                    key={role}
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${getRoleBadge(role)}`}
                  >
                    {formatRoleName(role)}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      },
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

        // Pesan islami untuk mengajak daftar Tikrar Tahfidz
        const userName = user.full_name || user.nama_kunyah || '';
        const activeBatch = batches.find(b => b.status === 'open' || b.status === 'ongoing') || batches[0];
        const batchName = activeBatch?.name || 'Tikrar Tahfidz MTI';
        
        const message = `Assalamu'alaikum warahmatullahi wabarakatuh, Ukhti ${userName}

Barakallahu fiik atas minat dan semangat Ukhti untuk menghafal Al-Qur'an 🌙

Kami dari Markaz Tikrar Indonesia ingin mengingatkan bahwa *Program ${batchName}* akan segera dimulai, in syaa Allah.

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

    // Add checkbox column for thalibah tab
    if (activeSubTab === 'thalibah') {
      return [
        {
          key: 'select',
          label: '',
          render: (user) => (
            <input
              type="checkbox"
              checked={selectedUserIds.has(user.id)}
              onChange={() => toggleUserSelection(user.id)}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
            />
          ),
        },
        ...baseColumns,
      ];
    }

    return baseColumns;
  };

  const columns = getColumns();

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      let result;

      // Convert tanggal_lahir to ISO format if provided
      const processedData = {
        ...data,
        ...(data.tanggal_lahir && {
          tanggal_lahir: new Date(data.tanggal_lahir + 'T00:00:00.000Z').toISOString()
        }),
        // Handle provinsi based on negara
        ...(data.negara !== 'Indonesia' && { provinsi: null }),
      };

      if (selectedUser) {
        // Update existing user using Server Action (secure)
        result = await updateUser({
          id: selectedUser.id,
          ...processedData
        } as any);

        if (!result.success) {
          throw new Error(result.error || 'Failed to update user');
        }
        toast.success('User updated successfully');
      } else {
        // Create new user using Server Action (secure)
        result = await createUser(processedData as any);

        if (!result.success) {
          throw new Error(result.error || 'Failed to create user');
        }
        toast.success('User created successfully');
      }

      onUsersRefresh();
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

  // Handle bulk upgrade selected/filtered users to thalibah
  const handleBulkUpgrade = async () => {
    if (!confirm('Upgrade selected users to thalibah role?')) {
      return;
    }

    setUpgradingUsers(true);
    try {
      const response = await fetch('/api/admin/tikrar/upgrade-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds.size > 0 ? Array.from(selectedUserIds) : undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to upgrade users');
      } else {
        const { success, failed, alreadyThalibah } = result.results || {};
        toast.success(
          `Upgraded ${success?.length || 0} users to thalibah` +
          (failed?.length ? `, ${failed.length} failed` : '') +
          (alreadyThalibah?.length ? `, ${alreadyThalibah.length} already thalibah` : '')
        );
        onUsersRefresh();
        setSelectedUserIds(new Set());
      }
    } catch (error: any) {
      console.error('Error upgrading users:', error);
      toast.error(error.message || 'Failed to upgrade users');
    } finally {
      setUpgradingUsers(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Select all visible users
  const selectAllVisible = () => {
    const newSet = new Set(filteredUsers.map((u: User) => u.id));
    setSelectedUserIds(newSet);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedUserIds(new Set());
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
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeSubTab === 'all'
                ? 'border-green-900 text-green-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setActiveSubTab('admin')}
            className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeSubTab === 'admin'
                ? 'border-purple-900 text-purple-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Admin ({adminUsers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('thalibah')}
            className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeSubTab === 'thalibah'
                ? 'border-green-900 text-green-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Thalibah ({thalibahUsers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('muallimah')}
            className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeSubTab === 'muallimah'
                ? 'border-green-900 text-green-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Muallimah ({muallimah.length})
          </button>
          <button
            onClick={() => setActiveSubTab('musyrifah')}
            className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeSubTab === 'musyrifah'
                ? 'border-green-900 text-green-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Musyrifah ({musyrifahUsers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('orphaned')}
            className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeSubTab === 'orphaned'
                ? 'border-green-900 text-green-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Orphaned Users
          </button>
        </nav>
      </div>

      {/* Muallimah Tab Content - Special handling for muallimah registrations */}
      {activeSubTab === 'muallimah' && (
        <MuallimahTab
          muallimah={muallimah}
          batches={batches}
          selectedBatchFilter={selectedBatchFilter}
          onBatchFilterChange={onBatchFilterChange}
          onRefresh={onRefresh}
        />
      )}

      {/* All Users Tab Content */}
      {(activeSubTab === 'all' || activeSubTab === 'admin' || activeSubTab === 'thalibah' || activeSubTab === 'musyrifah') && (
        <>
          {/* Action buttons - Only show on "All Users" tab */}
          {activeSubTab === 'all' && (
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDownloadUsers}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Excel (All Users)
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
          )}

          {/* Action buttons for Thalibah tab */}
          {activeSubTab === 'thalibah' && (
            <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => e.target.checked ? selectAllVisible() : clearSelection()}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                    Select All ({filteredUsers.length})
                  </label>
                </div>
                {selectedUserIds.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedUserIds.size} user{selectedUserIds.size > 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {selectedUserIds.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Clear Selection
                  </button>
                )}
                <button
                  onClick={handleBulkUpgrade}
                  disabled={upgradingUsers || (selectedUserIds.size === 0 && filteredUsers.length > 0)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgradingUsers ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {selectedUserIds.size > 0
                        ? `Upgrade ${selectedUserIds.size} to Thalibah`
                        : `Upgrade All (${thalibahUsers.length}) to Thalibah`
                      }
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Statistics Dashboard - Only show on "All Users" tab */}
          {activeSubTab === 'all' && (
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
          )}

      {/* Role Distribution Cards - Only show on "All Users" tab */}
      {activeSubTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Admin Role Card */}
          <div className="bg-white rounded-lg border border-purple-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-purple-800">Admin</h3>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                {users.filter(u => u.roles?.includes('admin')).length}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {users.length > 0 ? Math.round((users.filter(u => u.roles?.includes('admin')).length / users.length) * 100) : 0}% of all users
            </p>
          </div>

          {/* Ustadzah Role Card */}
          <div className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-blue-800">Muallimah</h3>
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
      )}

      <AdminDataTable
        data={filteredUsers}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onResetPassword={handleResetPassword}
        rowKey="id"
        searchPlaceholder="Search users by name, email, phone, or role..."
        emptyMessage="No users found"
        emptyIcon={<Users className="mx-auto h-12 w-12 text-gray-400" />}
      />

      <EditUserModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedUser(null);
        }}
        onSubmit={handleSubmit}
        user={selectedUser}
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

      <EditRoleModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
        }}
        onSuccess={onUsersRefresh}
        user={selectedUser}
      />
        </>
      )}

      {/* Orphaned Users Tab Content */}
      {activeSubTab === 'orphaned' && (
        <div className="mt-6">
          <AdminOrphanedUsers />
        </div>
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

// Muallimah Tab Component
interface MuallimahTabProps {
  muallimah: any[];
  batches: Batch[];
  selectedBatchFilter: string;
  onBatchFilterChange: (batchId: string) => void;
  onRefresh: () => void;
}

function MuallimahTab({ muallimah, batches, selectedBatchFilter, onBatchFilterChange, onRefresh }: MuallimahTabProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showUnapproveModal, setShowUnapproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [unapproveReason, setUnapproveReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Add user modal states
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    user_id: '',
    batch_id: '',
    full_name: '',
    birth_date: '',
    birth_place: '',
    address: '',
    whatsapp: '',
    email: '',
    education: '',
    occupation: '',
    memorization_level: '',
    memorized_juz: '',
    preferred_juz: '',
    teaching_experience: '',
    teaching_years: '',
    teaching_institutions: '',
    preferred_schedule: '',
    backup_schedule: '',
    tajweed_institution: '',
    quran_institution: '',
  });
  const [submittingAddUser, setSubmittingAddUser] = useState(false);

  // Sorting and filtering states
  const [sortField, setSortField] = useState<'submitted_at' | 'full_name' | 'status' | 'preferred_juz'>('submitted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Debug log
  console.log('MuallimahTab render:', {
    muallimahLength: muallimah.length,
    muallimahData: muallimah,
    selectedBatchFilter,
    batchesLength: batches.length
  });

  // Filter muallimah by batch_id, status, and search query
  const filteredMuallimah = muallimah.filter(m => {
    const matchesBatch = selectedBatchFilter === 'all' || m.batch_id === selectedBatchFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesSearch = searchQuery === '' ||
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.preferred_juz?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBatch && matchesStatus && matchesSearch;
  });

  console.log('Filtered muallimah:', filteredMuallimah.length);

  // Sort muallimah
  const sortedMuallimah = [...filteredMuallimah].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'submitted_at') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedMuallimah.length / itemsPerPage);
  const paginatedMuallimah = sortedMuallimah.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBatchFilter, statusFilter, searchQuery]);

  // Calculate statistics
  const stats = {
    total: filteredMuallimah.length,
    pending: filteredMuallimah.filter(m => m.status === 'pending').length,
    review: filteredMuallimah.filter(m => m.status === 'review').length,
    approved: filteredMuallimah.filter(m => m.status === 'approved').length,
    rejected: filteredMuallimah.filter(m => m.status === 'rejected').length,
    waitlist: filteredMuallimah.filter(m => m.status === 'waitlist').length,
  };

  // Handle sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Format class type for display
  const formatClassType = (classType: string) => {
    if (!classType) return '-';

    const classTypeMap: Record<string, string> = {
      'tashih_ujian': 'Kelas Tashih + Ujian',
      'tashih_only': 'Kelas Tashih Saja',
      'ujian_only': 'Kelas Ujian Saja'
    };

    return classTypeMap[classType] || classType;
  };

  // Format schedule for display
  const formatSchedule = (scheduleStr: string) => {
    if (!scheduleStr) return '-';

    // Map day names to Indonesian with colors
    const dayConfig: Record<string, { name: string; color: string }> = {
      'senin': { name: 'Senin', color: '#EF4444' },    // Red
      'selasa': { name: 'Selasa', color: '#F97316' },  // Orange
      'rabu': { name: 'Rabu', color: '#FBBF24' },      // Yellow
      'kamis': { name: 'Kamis', color: '#10B981' },    // Green
      'jumat': { name: 'Jumat', color: '#3B82F6' },    // Blue
      'sabtu': { name: 'Sabtu', color: '#6366F1' },    // Indigo
      'minggu': { name: 'Minggu', color: '#8B5CF6' },  // Purple
      'monday': { name: 'Senin', color: '#EF4444' },
      'tuesday': { name: 'Selasa', color: '#F97316' },
      'wednesday': { name: 'Rabu', color: '#FBBF24' },
      'thursday': { name: 'Kamis', color: '#10B981' },
      'friday': { name: 'Jumat', color: '#3B82F6' },
      'saturday': { name: 'Sabtu', color: '#6366F1' },
      'sunday': { name: 'Minggu', color: '#8B5CF6' }
    };

    const getColoredDay = (dayStr: string) => {
      const dayLower = dayStr.toLowerCase();
      const config = dayConfig[dayLower];
      if (config) {
        return `<span style="color: ${config.color}; font-weight: 600;">${config.name}</span>`;
      }
      return dayStr;
    };

    // If already in readable format (not JSON), translate and color day name
    if (!scheduleStr.startsWith('[') && !scheduleStr.startsWith('{')) {
      let result = scheduleStr;
      for (const [key, config] of Object.entries(dayConfig)) {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        result = result.replace(regex, `<span style="color: ${config.color}; font-weight: 600;">${config.name}</span>`);
      }
      return result;
    }

    try {
      const schedule = JSON.parse(scheduleStr);

      // Handle single object: {"day":"Sabtu","time_start":"09:30","time_end":"11:00"}
      if (schedule && typeof schedule === 'object' && !Array.isArray(schedule)) {
        const dayRaw = schedule.day || '';
        const dayHtml = getColoredDay(dayRaw);
        const timeStart = schedule.time_start || '';
        const timeEnd = schedule.time_end || '';
        return `${dayHtml} ${timeStart}-${timeEnd}`;
      }

      // Handle array: [{...}, {...}]
      if (Array.isArray(schedule) && schedule.length > 0) {
        const formatted = schedule.map((s: any) => {
          const dayRaw = s.day || '';
          const dayHtml = getColoredDay(dayRaw);
          const timeStart = s.time_start || '';
          const timeEnd = s.time_end || '';
          return `${dayHtml} ${timeStart}-${timeEnd}`;
        });
        // Join with line breaks for multiple schedules
        return formatted.join('\n');
      }

      return scheduleStr;
    } catch {
      // If parse fails, return original string
      return scheduleStr;
    }
  };

  // Handle approve
  const handleApprove = async (registration: any) => {
    try {
      const response = await fetch('/api/admin/muallimah/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: registration.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve registration');
      }

      toast.success('Muallimah registration approved successfully');
      onRefresh();
    } catch (error: any) {
      console.error('Error approving registration:', error);
      toast.error(error.message || 'Failed to approve registration');
    }
  };

  // Handle unapprove
  const handleUnapprove = (registration: any) => {
    setSelectedRegistration(registration);
    setShowUnapproveModal(true);
  };

  // Confirm unapprove
  const confirmUnapprove = async () => {
    if (!selectedRegistration) return;

    try {
      const response = await fetch('/api/admin/muallimah/unapprove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRegistration.id,
          review_notes: unapproveReason.trim() || 'Approval cancelled'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to unapprove registration');
      }

      toast.success('Registration unapproved successfully');
      setShowUnapproveModal(false);
      setUnapproveReason('');
      setSelectedRegistration(null);
      onRefresh();
    } catch (error: any) {
      console.error('Error unapproving registration:', error);
      toast.error(error.message || 'Failed to unapprove registration');
    }
  };

  // Handle reject
  const handleReject = (registration: any) => {
    setSelectedRegistration(registration);
    setShowRejectModal(true);
  };

  // Confirm reject
  const confirmReject = async () => {
    if (!selectedRegistration) return;

    try {
      const response = await fetch('/api/admin/muallimah/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRegistration.id,
          reason: rejectReason.trim()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject registration');
      }

      toast.success('Registration rejected successfully');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRegistration(null);
      onRefresh();
    } catch (error: any) {
      console.error('Error rejecting registration:', error);
      toast.error(error.message || 'Failed to reject registration');
    }
  };

  // Load users for add user modal
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users');
      const result = await response.json();
      if (response.ok) {
        setUsers(result.users || []);
      } else {
        toast.error(result.error || 'Failed to load users');
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Open add user modal
  const handleOpenAddUserModal = () => {
    setShowAddUserModal(true);
    if (users.length === 0) {
      loadUsers();
    }
  };

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserDropdown(false);
    setUserSearchQuery('');
    const user = users.find(u => u.id === userId);
    if (user) {
      // Format phone number to ensure it starts with 62
      let formattedPhone = user.whatsapp || user.phone || '';
      if (formattedPhone) {
        // Remove non-numeric characters
        formattedPhone = formattedPhone.replace(/\D/g, '');
        // If starts with 0, replace with 62
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '62' + formattedPhone.substring(1);
        }
        // If doesn't start with 62, prepend it
        else if (!formattedPhone.startsWith('62')) {
          formattedPhone = '62' + formattedPhone;
        }
      }

      setAddUserForm(prev => ({
        ...prev,
        user_id: userId,
        full_name: user.full_name || '',
        email: user.email || '',
        whatsapp: formattedPhone,
        address: user.alamat || '',
        birth_date: user.tanggal_lahir || '',
        birth_place: user.tempat_lahir || '',
        occupation: user.pekerjaan || '',
      }));
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const searchLower = userSearchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  // Handle add user form submit
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserForm.user_id || !addUserForm.batch_id) {
      toast.error('Please select a user and batch');
      return;
    }

    setSubmittingAddUser(true);
    try {
      const response = await fetch('/api/admin/muallimah/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addUserForm),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show detailed error message
        let errorMsg = result.error || 'Failed to add muallimah';
        if (result.details) {
          if (typeof result.details === 'string') {
            errorMsg += ': ' + result.details;
          } else if (result.details.formErrors) {
            errorMsg += ': ' + Object.values(result.details.formErrors).flat().join(', ');
          } else if (result.details.fieldErrors) {
            const fieldErrors = Object.entries(result.details.fieldErrors)
              .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
              .join('; ');
            errorMsg += ': ' + fieldErrors;
          }
        }
        throw new Error(errorMsg);
      }

      toast.success('Muallimah added successfully');
      setShowAddUserModal(false);
      setSelectedUserId('');
      setAddUserForm({
        user_id: '',
        batch_id: '',
        full_name: '',
        birth_date: '',
        birth_place: '',
        address: '',
        whatsapp: '',
        email: '',
        education: '',
        occupation: '',
        memorization_level: '',
        memorized_juz: '',
        preferred_juz: '',
        teaching_experience: '',
        teaching_years: '',
        teaching_institutions: '',
        preferred_schedule: '',
        backup_schedule: '',
        tajweed_institution: '',
        quran_institution: '',
      });
      onRefresh();
    } catch (error: any) {
      console.error('Error adding muallimah:', error);
      toast.error(error.message || 'Failed to add muallimah');
    } finally {
      setSubmittingAddUser(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      waitlist: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Copy migration SQL to clipboard
  const handleCopyMigrationSQL = async (migrationName: string) => {
    try {
      const response = await fetch(`/api/admin/migration/${migrationName}.sql`)
      if (!response.ok) {
        throw new Error('Failed to fetch migration SQL')
      }
      const data = await response.json()

      await navigator.clipboard.writeText(data.content)
      toast.success('Migration SQL copied to clipboard! Paste it in Supabase SQL Editor.')
    } catch (error: any) {
      console.error('Error copying migration:', error)
      toast.error('Failed to copy migration SQL')
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Muallimah Registrations</h2>
          <button
            onClick={handleOpenAddUserModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Existing User
          </button>
        </div>

        {/* Migration Info Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">Setup Database Triggers for Auto-Role Assignment</h3>
              <p className="text-sm text-blue-800 mt-1">
                To enable automatic role assignment when registrations are approved, run these migrations in Supabase SQL Editor:
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between bg-white rounded p-2 border border-blue-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Muallimah & Musyrifah Role Triggers</p>
                    <p className="text-xs text-gray-600">Auto-adds muallimah/musyrifah roles when registration is approved</p>
                  </div>
                  <button
                    onClick={() => handleCopyMigrationSQL('20260117_add_auto_role_trigger_for_muallimah_musyrifah')}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition"
                  >
                    Copy SQL
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white rounded p-2 border border-blue-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Thalibah Upgrade Trigger</p>
                    <p className="text-xs text-gray-600">Auto-updates thalibah status when daftar ulang is approved</p>
                  </div>
                  <button
                    onClick={() => handleCopyMigrationSQL('20260117_add_auto_thalibah_role_trigger')}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition"
                  >
                    Copy SQL
                  </button>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                After copying, go to <strong>Supabase Dashboard → SQL Editor</strong>, paste the SQL, and run it.
              </p>
            </div>
          </div>
        </div>

        {/* Batch and Status Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Batch:</label>
            <select
              value={selectedBatchFilter}
              onChange={(e) => onBatchFilterChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Batches ({muallimah.length})</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} ({muallimah.filter(m => m.batch_id === batch.id).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending ({stats.pending})</option>
              <option value="review">In Review ({stats.review})</option>
              <option value="approved">Approved ({stats.approved})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
              <option value="waitlist">Waitlist ({stats.waitlist})</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, email, or juz..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Showing {filteredMuallimah.length} of {muallimah.length} registrations
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-3 text-white cursor-pointer hover:shadow-xl transition-shadow"
             onClick={() => setStatusFilter(statusFilter === 'all' ? 'approved' : 'all')}>
          <p className="text-blue-100 text-xs font-medium">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-3 text-white cursor-pointer hover:shadow-xl transition-shadow"
             onClick={() => setStatusFilter('pending')}>
          <p className="text-yellow-100 text-xs font-medium">Pending</p>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg shadow-lg p-3 text-white cursor-pointer hover:shadow-xl transition-shadow"
             onClick={() => setStatusFilter('review')}>
          <p className="text-blue-100 text-xs font-medium">In Review</p>
          <p className="text-2xl font-bold">{stats.review}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-3 text-white cursor-pointer hover:shadow-xl transition-shadow"
             onClick={() => setStatusFilter('approved')}>
          <p className="text-green-100 text-xs font-medium">Approved</p>
          <p className="text-2xl font-bold">{stats.approved}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-3 text-white cursor-pointer hover:shadow-xl transition-shadow"
             onClick={() => setStatusFilter('rejected')}>
          <p className="text-red-100 text-xs font-medium">Rejected</p>
          <p className="text-2xl font-bold">{stats.rejected}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow-lg p-3 text-white cursor-pointer hover:shadow-xl transition-shadow"
             onClick={() => setStatusFilter('waitlist')}>
          <p className="text-gray-100 text-xs font-medium">Waitlist</p>
          <p className="text-2xl font-bold">{stats.waitlist}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortField === 'full_name' && (
                      <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('preferred_juz')}
                >
                  <div className="flex items-center gap-1">
                    Preferred Juz
                    {sortField === 'preferred_juz' && (
                      <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Thalibah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'status' && (
                      <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('submitted_at')}
                >
                  <div className="flex items-center gap-1">
                    Submitted
                    {sortField === 'submitted_at' && (
                      <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedMuallimah.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm">No muallimah registrations found</p>
                  </td>
                </tr>
              ) : (
                paginatedMuallimah.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedRegistration(m);
                          setShowDetailModal(true);
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900 text-left"
                      >
                        {m.full_name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{m.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {m.whatsapp ? (() => {
                        const contactNumber = m.whatsapp;
                        let phoneNumber = contactNumber.replace(/\D/g, '');
                        if (phoneNumber.startsWith('0')) {
                          phoneNumber = '62' + phoneNumber.substring(1);
                        } else if (!phoneNumber.startsWith('62')) {
                          phoneNumber = '62' + phoneNumber;
                        }

                        const userName = m.full_name || 'Ukhti';
                        const message = `Assalamu'alaikum warahmatullahi wabarakatuh, Ukhti ${userName}

Barakallahu fiik atas minat dan semangat Ukhti untuk mendaftar sebagai Muallimah di Markaz Tikrar Indonesia 🌙

Kami ingin menginformasikan mengenai status pendaftaran Ukhti.

📖 "Dan sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." (HR. Bukhari)

Jazakillahu khairan
Tim Markaz Tikrar Indonesia`;

                        const encodedMessage = encodeURIComponent(message);
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
                      })() : <span className="text-gray-400 text-sm">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{m.batch?.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{m.preferred_juz || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatClassType(m.class_type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{m.preferred_max_thalibah || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm max-w-xs whitespace-pre-line" dangerouslySetInnerHTML={{ __html: formatSchedule(m.preferred_schedule) }} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(m.submitted_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {m.status === 'pending' || m.status === 'review' ? (
                          <>
                            <button
                              onClick={() => handleApprove(m)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(m)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        ) : m.status === 'approved' ? (
                          <button
                            onClick={() => handleUnapprove(m)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Unapprove
                          </button>
                        ) : m.status === 'rejected' ? (
                          <span className="text-gray-400 text-xs">No actions</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedMuallimah.length)}</span> of{' '}
                    <span className="font-medium">{sortedMuallimah.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
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
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unapprove Modal */}
      {showUnapproveModal && selectedRegistration && (
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
                      Unapprove Muallimah Registration
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to unapprove the registration for "{selectedRegistration.full_name}"?
                      </p>
                      <div className="mt-4">
                        <label htmlFor="unapprove-reason" className="block text-sm font-medium text-gray-700 mb-2">
                          Reason (Optional)
                        </label>
                        <textarea
                          id="unapprove-reason"
                          rows={3}
                          value={unapproveReason}
                          onChange={(e) => setUnapproveReason(e.target.value)}
                          className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter reason for unapproval..."
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
                  Unapprove
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnapproveModal(false);
                    setUnapproveReason('');
                    setSelectedRegistration(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && selectedRegistration && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRejectModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Reject Muallimah Registration
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to reject the registration for "{selectedRegistration.full_name}"?
                      </p>
                      <div className="mt-4">
                        <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Rejection <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="reject-reason"
                          rows={3}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter reason for rejection..."
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
                  onClick={confirmReject}
                  disabled={!rejectReason.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedRegistration(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRegistration && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDetailModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Muallimah Registration Details
                  </h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadge(selectedRegistration.status)}`}>
                      {selectedRegistration.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Submitted: {new Date(selectedRegistration.submitted_at).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Personal Information Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.full_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.whatsapp}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Age</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.age || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.birth_date} (born in {selectedRegistration.birth_place})</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.address}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Education</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.education}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Occupation</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.occupation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quran Information Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Quran Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Memorization Level</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.memorization_level}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Memorized Juz</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.memorized_juz || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Preferred Juz</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.preferred_juz}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Examined Juz</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.examined_juz || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Certified Juz</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.certified_juz || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Education & Institutions Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Education & Institutions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tajweed Institution</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.tajweed_institution || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quran Institution</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.quran_institution || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Teaching Communities</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRegistration.teaching_communities || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Memorized Tajweed Matan</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.memorized_tajweed_matan || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Studied Matan Exegesis</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRegistration.studied_matan_exegesis || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Teaching Experience Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Teaching Experience</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Experience</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.teaching_experience}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.teaching_years || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Institutions</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.teaching_institutions || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Schedule Preferences</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Preferred Schedule</label>
                        <p className="mt-1 text-sm text-gray-900">{formatSchedule(selectedRegistration.preferred_schedule)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Backup Schedule</label>
                        <p className="mt-1 text-sm text-gray-900">{formatSchedule(selectedRegistration.backup_schedule)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Timezone</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.timezone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Class Preferences Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Class Preferences</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Class Type</label>
                        <p className="mt-1 text-sm text-gray-900">{formatClassType(selectedRegistration.class_type)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Preferred Max Thalibah</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.preferred_max_thalibah || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Paid Class Interest</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.paid_class_interest || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Understands Commitment</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.understands_commitment ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Additional Information</h4>
                    <div className="space-y-4">
                      {selectedRegistration.motivation && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Motivation</label>
                          <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRegistration.motivation}</p>
                        </div>
                      )}
                      {selectedRegistration.special_skills && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Special Skills</label>
                          <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRegistration.special_skills}</p>
                        </div>
                      )}
                      {selectedRegistration.health_condition && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Health Condition</label>
                          <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRegistration.health_condition}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Batch Information */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Batch Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Batch</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRegistration.batch?.name || '-'}</p>
                      </div>
                      {selectedRegistration.reviewed_at && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Reviewed At</label>
                          <p className="mt-1 text-sm text-gray-900">{new Date(selectedRegistration.reviewed_at).toLocaleString('id-ID')}</p>
                        </div>
                      )}
                    </div>
                    {selectedRegistration.review_notes && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700">Review Notes</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRegistration.review_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Existing User as Muallimah Modal */}
      {showAddUserModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddUserModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Add Existing User as Muallimah
                  </h3>
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleAddUserSubmit} className="space-y-6">
                  {/* User Selection */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Step 1: Select User</h4>
                    <div className="relative">
                      <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-2">
                        Search User <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="user-search"
                        value={userSearchQuery}
                        onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          setShowUserDropdown(true);
                        }}
                        onFocus={() => {
                          if (users.length === 0 && !loadingUsers) {
                            loadUsers();
                          }
                          setShowUserDropdown(true);
                        }}
                        placeholder="Type name or email to search..."
                        disabled={loadingUsers}
                        className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      {selectedUserId && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            Selected: {users.find(u => u.id === selectedUserId)?.full_name || users.find(u => u.id === selectedUserId)?.email}
                          </p>
                        </div>
                      )}
                      {showUserDropdown && userSearchQuery && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                          {loadingUsers ? (
                            <div className="px-4 py-2 text-gray-500">Loading users...</div>
                          ) : filteredUsers.length === 0 ? (
                            <div className="px-4 py-2 text-gray-500">No users found</div>
                          ) : (
                            filteredUsers.slice(0, 20).map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleUserSelect(user.id)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{user.full_name || 'No name'}</span>
                                  <span className="text-sm text-gray-500">{user.email}</span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Muallimah Details */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Step 2: Muallimah Details</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Batch Selection */}
                      <div>
                        <label htmlFor="batch_id" className="block text-sm font-medium text-gray-700 mb-1">
                          Batch <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="batch_id"
                          value={addUserForm.batch_id}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, batch_id: e.target.value }))}
                          required
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="">-- Select batch --</option>
                          {batches.map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="full_name"
                          value={addUserForm.full_name}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                          required
                          minLength={2}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Birth Date */}
                      <div>
                        <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
                          Birth Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="birth_date"
                          value={addUserForm.birth_date}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, birth_date: e.target.value }))}
                          required
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Birth Place */}
                      <div>
                        <label htmlFor="birth_place" className="block text-sm font-medium text-gray-700 mb-1">
                          Birth Place <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="birth_place"
                          value={addUserForm.birth_place}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, birth_place: e.target.value }))}
                          required
                          minLength={2}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* WhatsApp */}
                      <div>
                        <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                          WhatsApp (62...) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="whatsapp"
                          value={addUserForm.whatsapp}
                          onChange={(e) => {
                            // Auto-format phone number to start with 62
                            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                            if (value.startsWith('0')) {
                              value = '62' + value.substring(1);
                            } else if (!value.startsWith('62') && value.length > 0) {
                              value = '62' + value;
                            }
                            setAddUserForm(prev => ({ ...prev, whatsapp: value }));
                          }}
                          required
                          pattern="^62\d{8,14}$"
                          placeholder="628123456789"
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={addUserForm.email}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="address"
                          rows={2}
                          value={addUserForm.address}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, address: e.target.value }))}
                          required
                          minLength={5}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Education */}
                      <div>
                        <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                          Education <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="education"
                          value={addUserForm.education}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, education: e.target.value }))}
                          required
                          minLength={2}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Occupation */}
                      <div>
                        <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                          Occupation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="occupation"
                          value={addUserForm.occupation}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, occupation: e.target.value }))}
                          required
                          minLength={2}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Memorization Level */}
                      <div>
                        <label htmlFor="memorization_level" className="block text-sm font-medium text-gray-700 mb-1">
                          Memorization Level <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="memorization_level"
                          value={addUserForm.memorization_level}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, memorization_level: e.target.value }))}
                          required
                          minLength={2}
                          placeholder="e.g., Juz 30, Juz 29-30"
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Memorized Juz */}
                      <div>
                        <label htmlFor="memorized_juz" className="block text-sm font-medium text-gray-700 mb-1">
                          Memorized Juz
                        </label>
                        <input
                          type="text"
                          id="memorized_juz"
                          value={addUserForm.memorized_juz}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, memorized_juz: e.target.value }))}
                          placeholder="e.g., 28, 29, 30"
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Preferred Juz */}
                      <div>
                        <label htmlFor="preferred_juz" className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Juz <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="preferred_juz"
                          value={addUserForm.preferred_juz}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, preferred_juz: e.target.value }))}
                          required
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Teaching Experience */}
                      <div className="md:col-span-2">
                        <label htmlFor="teaching_experience" className="block text-sm font-medium text-gray-700 mb-1">
                          Teaching Experience <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="teaching_experience"
                          rows={2}
                          value={addUserForm.teaching_experience}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, teaching_experience: e.target.value }))}
                          required
                          minLength={5}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Teaching Years */}
                      <div>
                        <label htmlFor="teaching_years" className="block text-sm font-medium text-gray-700 mb-1">
                          Teaching Years
                        </label>
                        <input
                          type="text"
                          id="teaching_years"
                          value={addUserForm.teaching_years}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, teaching_years: e.target.value }))}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Teaching Institutions */}
                      <div>
                        <label htmlFor="teaching_institutions" className="block text-sm font-medium text-gray-700 mb-1">
                          Teaching Institutions
                        </label>
                        <input
                          type="text"
                          id="teaching_institutions"
                          value={addUserForm.teaching_institutions}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, teaching_institutions: e.target.value }))}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Preferred Schedule */}
                      <div className="md:col-span-2">
                        <label htmlFor="preferred_schedule" className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Schedule <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="preferred_schedule"
                          rows={2}
                          value={addUserForm.preferred_schedule}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, preferred_schedule: e.target.value }))}
                          required
                          placeholder="e.g., Monday 19:00-21:00, Wednesday 19:00-21:00"
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Backup Schedule */}
                      <div className="md:col-span-2">
                        <label htmlFor="backup_schedule" className="block text-sm font-medium text-gray-700 mb-1">
                          Backup Schedule <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="backup_schedule"
                          rows={2}
                          value={addUserForm.backup_schedule}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, backup_schedule: e.target.value }))}
                          required
                          placeholder="e.g., Tuesday 19:00-21:00, Thursday 19:00-21:00"
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Tajweed Institution */}
                      <div>
                        <label htmlFor="tajweed_institution" className="block text-sm font-medium text-gray-700 mb-1">
                          Tajweed Institution
                        </label>
                        <input
                          type="text"
                          id="tajweed_institution"
                          value={addUserForm.tajweed_institution}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, tajweed_institution: e.target.value }))}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Quran Institution */}
                      <div>
                        <label htmlFor="quran_institution" className="block text-sm font-medium text-gray-700 mb-1">
                          Quran Institution
                        </label>
                        <input
                          type="text"
                          id="quran_institution"
                          value={addUserForm.quran_institution}
                          onChange={(e) => setAddUserForm(prev => ({ ...prev, quran_institution: e.target.value }))}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={submittingAddUser || !addUserForm.user_id || !addUserForm.batch_id}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingAddUser ? 'Adding...' : 'Add Muallimah'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddUserModal(false);
                        setSelectedUserId('');
                        setAddUserForm({
                          user_id: '',
                          batch_id: '',
                          full_name: '',
                          birth_date: '',
                          birth_place: '',
                          address: '',
                          whatsapp: '',
                          email: '',
                          education: '',
                          occupation: '',
                          memorization_level: '',
                          memorized_juz: '',
                          preferred_juz: '',
                          teaching_experience: '',
                          teaching_years: '',
                          teaching_institutions: '',
                          preferred_schedule: '',
                          backup_schedule: '',
                          tajweed_institution: '',
                          quran_institution: '',
                        });
                      }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
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
        // For users with multiple roles, count each role
        if (user.roles && Array.isArray(user.roles)) {
          user.roles.forEach((role: string) => {
            acc[role] = (acc[role] || 0) + 1;
          });
        }
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
