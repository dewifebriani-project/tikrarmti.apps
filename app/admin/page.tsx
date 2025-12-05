'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import {
  Users,
  Calendar,
  BookOpen,
  GraduationCap,
  UserCheck,
  FileText,
  BarChart3,
  Plus,
  Edit2,
  UserPlus,
  ClipboardList,
  Clock,
  Award
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

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
  program?: { name: string };
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  provinsi?: string;
  kota?: string;
  alamat?: string;
  whatsapp?: string;
  telegram?: string;
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
  user?: User;
  batch?: { name: string };
  program?: { name: string };
}

type TabType = 'overview' | 'users' | 'batches' | 'programs' | 'halaqah' | 'halaqah-mentors' | 'halaqah-students' | 'pendaftaran' | 'presensi' | 'tikrar' | 'reports';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [user, setUser] = useState<any>(null);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>([]);
  const [halaqahMentors, setHalaqahMentors] = useState<HalaqahMentor[]>([]);
  const [halaqahStudents, setHalaqahStudents] = useState<HalaqahStudent[]>([]);
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran[]>([]);
  const [presensi, setPresensi] = useState<Presensi[]>([]);
  const [tikrar, setTikrar] = useState<TikrarTahfidz[]>([]);
  const [stats, setStats] = useState({
    totalBatches: 0,
    totalPrograms: 0,
    totalHalaqah: 0,
    totalUsers: 0,
    totalThalibah: 0,
    totalMentors: 0,
    pendingRegistrations: 0,
    pendingTikrar: 0
  });

  useEffect(() => {
    console.log('Admin page mounted, starting auth check...');
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('Loading data for tab:', activeTab);
      loadData();
    }
  }, [activeTab, user]);

  // Disable eslint exhaustive-deps warning for loadData
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    console.log('Starting authentication check...');
    const startTime = Date.now();

    const authTimeout = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.error(`Authentication timeout after 30 seconds (elapsed: ${elapsed}ms)`);
      setLoading(false);
      router.push('/login');
    }, 30000); // 30 second timeout - increased for development compilation time

    try {
      console.log('Getting Supabase user...');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error('Auth error:', authError);
        clearTimeout(authTimeout);
        setLoading(false);
        router.push('/login');
        return;
      }

      // Get user role
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single<{ role: string }>();

      if (userError) {
        console.error('User data error:', userError);
        clearTimeout(authTimeout);
        setLoading(false);
        // If user not found in users table, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      if (!userData || userData.role !== 'admin') {
        console.log('User is not admin:', userData?.role);
        clearTimeout(authTimeout);
        setLoading(false);
        router.push('/dashboard');
        return;
      }

      clearTimeout(authTimeout);
      setUser(authUser);
      setLoading(false);
    } catch (error) {
      console.error('Unexpected error in checkAuth:', error);
      clearTimeout(authTimeout);
      setLoading(false);
      router.push('/login');
    }
  };

  const loadData = async () => {
    setDataLoading(true);
    const dataTimeout = setTimeout(() => {
      console.error('Data loading timeout');
      setDataLoading(false);
    }, 15000); // 15 second timeout

    try {

      if (activeTab === 'overview') {
        // Load statistics
        const [
          { count: batchCount },
          { count: programCount },
          { count: halaqahCount },
          { count: userCount },
          { count: thalibahCount },
          { count: mentorCount },
          { count: pendingCount },
          { count: tikrarPendingCount }
        ] = await Promise.all([
          // @ts-ignore
          supabase.from('batches').select('*', { count: 'exact', head: true }),
          // @ts-ignore
          supabase.from('programs').select('*', { count: 'exact', head: true }),
          // @ts-ignore
          supabase.from('halaqah').select('*', { count: 'exact', head: true }),
          // @ts-ignore
          supabase.from('users').select('*', { count: 'exact', head: true }),
          // @ts-ignore
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'thalibah'),
          // @ts-ignore
          supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['ustadzah', 'musyrifah']),
          // @ts-ignore
          supabase.from('pendaftaran').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          // @ts-ignore
          supabase.from('tikrar_tahfidz').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        ]);

        setStats({
          totalBatches: batchCount || 0,
          totalPrograms: programCount || 0,
          totalHalaqah: halaqahCount || 0,
          totalUsers: userCount || 0,
          totalThalibah: thalibahCount || 0,
          totalMentors: mentorCount || 0,
          pendingRegistrations: pendingCount || 0,
          pendingTikrar: tikrarPendingCount || 0
        });
      } else if (activeTab === 'batches') {
        const { data, error } = await supabase
          .from('batches')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) console.error('Error loading batches:', error);
        setBatches(data || []);
      } else if (activeTab === 'programs') {
        const { data, error } = await supabase
          .from('programs')
          .select('*, batch:batches(name)')
          .order('created_at', { ascending: false });
        if (error) console.error('Error loading programs:', error);
        setPrograms(data || []);
      } else if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) console.error('Error loading users:', error);
        setUsers(data || []);
      } else if (activeTab === 'halaqah') {
        const { data, error } = await supabase
          .from('halaqah')
          .select('*, program:programs(name)')
          .order('created_at', { ascending: false });
        if (error) console.error('Error loading halaqah:', error);
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
      } else if (activeTab === 'tikrar') {
        try {
          const { data, error } = await supabase
            .from('tikrar_tahfidz')
            .select('*, user:users(full_name, email), batch:batches(name), program:programs(name)')
            .order('submission_date', { ascending: false });
          if (error) {
            console.error('Error loading tikrar:', error);
            // Check if table doesn't exist or other errors
            if (error.code === 'PGRST116') {
              console.log('Table tikrar_tahfidz does not exist yet');
              setTikrar([]);
            } else if (error.message && error.message.includes('relationship')) {
              console.log('Foreign key relationship issue for tikrar_tahfidz');
              setTikrar([]);
            } else {
              console.error('Database error:', error.message);
              setTikrar([]);
            }
          } else {
            setTikrar(data || []);
          }
        } catch (err: any) {
          console.error('Unexpected error loading tikrar:', err);
          setTikrar([]);
        }
      }
    } catch (error) {
      console.error('Error in loadData:', error);
    } finally {
      clearTimeout(dataTimeout);
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
    <AuthenticatedLayout title="Admin Dashboard">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 -m-6 mb-0 px-6 py-6 rounded-t-lg">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Kelola data master dan lihat laporan sistem
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 -m-6 mb-0 px-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-green-900 text-green-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
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

        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'users' && <UsersTab users={users} onRefresh={loadData} />}
        {activeTab === 'batches' && <BatchesTab batches={batches} onRefresh={loadData} />}
        {activeTab === 'programs' && <ProgramsTab programs={programs} onRefresh={loadData} />}
        {activeTab === 'halaqah' && <HalaqahTab halaqahs={halaqahs} onRefresh={loadData} />}
        {activeTab === 'halaqah-mentors' && <HalaqahMentorsTab mentors={halaqahMentors} onRefresh={loadData} />}
        {activeTab === 'halaqah-students' && <HalaqahStudentsTab students={halaqahStudents} onRefresh={loadData} />}
        {activeTab === 'pendaftaran' && <PendaftaranTab pendaftaran={pendaftaran} onRefresh={loadData} />}
        {activeTab === 'presensi' && <PresensiTab presensi={presensi} onRefresh={loadData} />}
        {activeTab === 'tikrar' && <TikrarTab tikrar={tikrar} onRefresh={loadData} />}
        {activeTab === 'reports' && <ReportsTab />}
      </div>
    </AuthenticatedLayout>
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
  );
}

// Batches Tab Component
function BatchesTab({ batches, onRefresh }: { batches: Batch[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Batches Management</h2>
        <button
          onClick={() => setShowForm(true)}
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

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {batches.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No batches</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new batch.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Batch
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batches.map((batch) => (
              <tr key={batch.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{batch.name}</div>
                  <div className="text-sm text-gray-500">{batch.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(batch.start_date).toLocaleDateString('id-ID')} - {new Date(batch.end_date).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {batch.duration_weeks ? `${batch.duration_weeks} weeks` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${batch.status === 'open' ? 'bg-green-100 text-green-800' :
                      batch.status === 'closed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {batch.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingBatch(batch);
                      setShowForm(true);
                    }}
                    className="text-green-900 hover:text-green-700 mr-4"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}

// Batch Form Component
function BatchForm({ batch, onClose, onSuccess }: { batch: Batch | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: batch?.name || '',
    description: batch?.description || '',
    start_date: batch?.start_date || '',
    end_date: batch?.end_date || '',
    registration_start_date: batch?.registration_start_date?.split('T')[0] || '',
    registration_end_date: batch?.registration_end_date?.split('T')[0] || '',
    duration_weeks: batch?.duration_weeks || 0,
    status: batch?.status || 'draft'
  });
  const [saving, setSaving] = useState(false);

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
      let result;
      if (batch) {
        result = await supabaseAdmin
          .from('batches')
          .update(formData)
          .eq('id', batch.id);
      } else {
        result = await supabaseAdmin
          .from('batches')
          .insert([formData]);
      }

      if (result.error) {
        console.error('Error saving batch:', result.error);
        alert('Failed to save batch: ' + result.error.message);
      } else {
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
function ProgramsTab({ programs, onRefresh }: { programs: Program[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Programs Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Program
        </button>
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

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {programs.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No programs</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new program.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Program
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {programs.map((program) => (
                <tr key={program.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{program.name}</div>
                    <div className="text-sm text-gray-500">{program.target_level}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {program.batch?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {program.duration_weeks} weeks
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {program.max_thalibah || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${program.status === 'open' ? 'bg-green-100 text-green-800' :
                        program.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        program.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {program.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingProgram(program);
                        setShowForm(true);
                      }}
                      className="text-green-900 hover:text-green-700 mr-4"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

      let result;
      if (program) {
        result = await supabaseAdmin
          .from('programs')
          .update(submitData)
          .eq('id', program.id);
      } else {
        result = await supabaseAdmin
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
function HalaqahTab({ halaqahs, onRefresh }: { halaqahs: Halaqah[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingHalaqah, setEditingHalaqah] = useState<Halaqah | null>(null);

  const daysOfWeek = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Halaqah Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Halaqah
        </button>
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

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {halaqahs.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No halaqah sessions</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new halaqah session.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Halaqah
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {halaqahs.map((halaqah) => (
                <tr key={halaqah.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{halaqah.name}</div>
                    <div className="text-sm text-gray-500">{halaqah.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {halaqah.program?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {halaqah.day_of_week ? daysOfWeek[halaqah.day_of_week] : '-'}
                    {halaqah.start_time && halaqah.end_time && (
                      <div>{halaqah.start_time} - {halaqah.end_time}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {halaqah.location || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {halaqah.max_students || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${halaqah.status === 'active' ? 'bg-green-100 text-green-800' :
                        halaqah.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {halaqah.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingHalaqah(halaqah);
                        setShowForm(true);
                      }}
                      className="text-green-900 hover:text-green-700 mr-4"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
      let result;
      if (halaqah) {
        result = await supabaseAdmin
          .from('halaqah')
          .update(formData)
          .eq('id', halaqah.id);
      } else {
        result = await supabaseAdmin
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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.full_name || '-'}</div>
                      <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'ustadzah' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'musyrifah' ? 'bg-green-100 text-green-800' :
                          user.role === 'thalibah' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {user.role || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.kota && user.provinsi ? `${user.kota}, ${user.provinsi}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
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
function PendaftaranTab({ pendaftaran, onRefresh }: { pendaftaran: Pendaftaran[], onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Registrations Management</h2>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {pendaftaran.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thalibah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendaftaran.map((reg) => (
                  <tr key={reg.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{reg.thalibah?.full_name || '-'}</div>
                      <div className="text-sm text-gray-500">{reg.thalibah?.email || '-'}</div>
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
                          reg.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'}`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reg.registration_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {reg.notes || '-'}
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
function TikrarTab({ tikrar, onRefresh }: { tikrar: TikrarTahfidz[], onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Tikrar Tahfidz Applications</h2>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {tikrar.length === 0 ? (
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tikrar applications</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chosen Juz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selection Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submission Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tikrar.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{t.full_name || t.user?.full_name || '-'}</div>
                      <div className="text-sm text-gray-500">{t.user?.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {t.batch_name || t.batch?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {t.program?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {t.chosen_juz || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${t.status === 'approved' ? 'bg-green-100 text-green-800' :
                          t.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          t.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${t.selection_status === 'approved' ? 'bg-green-100 text-green-800' :
                          t.selection_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                        {t.selection_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(t.submission_date).toLocaleDateString('id-ID')}
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
        supabase.from('tikrar_tahfidz').select('*, user:users(full_name, email), batch:batches(name), program:programs(name)')
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
