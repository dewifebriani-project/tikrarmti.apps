'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { AutoCreateHalaqahModal } from '@/components/AutoCreateHalaqahModal';
import { HalaqahStudentsList } from '@/components/HalaqahStudentsList';

interface Halaqah {
  id: string;
  program_id: string;
  muallimah_id?: string;
  name: string;
  description?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_students?: number;
  waitlist_max?: number;
  preferred_juz?: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  program?: {
    id: string;
    name: string;
    class_type: string;
    batch_id: string;
    batch?: {
      id: string;
      name: string;
    };
  };
  muallimah?: {
    id: string;
    full_name?: string;
    email?: string;
  };
  _count?: {
    students: number;
  };
}

interface Batch {
  id: string;
  name: string;
  status: string;
}

interface Program {
  id: string;
  name: string;
  class_type: string;
  batch_id: string;
}

export function HalaqahManagementTab() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Filters
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals
  const [showAutoCreateModal, setShowAutoCreateModal] = useState(false);
  const [selectedHalaqah, setSelectedHalaqah] = useState<Halaqah | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadData();
  }, [selectedBatch, selectedProgram, selectedStatus, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadBatches(), loadPrograms(), loadHalaqahs()]);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    console.log('[HalaqahManagementTab] Loading batches...');
    try {
      // First try using the API endpoint (for admins)
      const response = await fetch('/api/admin/batches');
      const result = await response.json();

      console.log('[HalaqahManagementTab] Batches API response:', result);

      if (response.ok && result.data) {
        console.log('[HalaqahManagementTab] Loaded batches via API:', result.data.length);
        setBatches(result.data);
        if (!selectedBatch && result.data.length > 0) {
          setSelectedBatch(result.data[0].id);
        }
        return;
      }

      // If API fails (403/401), fall back to direct Supabase query
      console.log('[HalaqahManagementTab] API failed, falling back to direct query');
    } catch (apiError: any) {
      console.log('[HalaqahManagementTab] API exception, falling back to direct query:', apiError.message);
    }

    // Fallback: Direct Supabase query (works with RLS for all authenticated users)
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[HalaqahManagementTab] Direct query error:', error);
        toast.error('Failed to load batches: ' + error.message);
        return;
      }

      console.log('[HalaqahManagementTab] Loaded batches via direct query:', data?.length || 0);
      setBatches(data || []);
      if (!selectedBatch && data && data.length > 0) {
        setSelectedBatch(data[0].id);
      }
    } catch (error: any) {
      console.error('[HalaqahManagementTab] Exception loading batches:', error);
      toast.error('Failed to load batches: ' + error.message);
    }
  };

  const loadPrograms = async () => {
    if (!selectedBatch) return;

    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('batch_id', selectedBatch)
      .in('status', ['open', 'ongoing']);

    if (!error && data) {
      setPrograms(data);
    } else if (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadHalaqahs = async () => {
    let query = supabase
      .from('halaqah')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (selectedBatch) {
      // First get program IDs for this batch
      const { data: batchPrograms } = await supabase
        .from('programs')
        .select('id')
        .eq('batch_id', selectedBatch);

      if (batchPrograms) {
        query = query.in('program_id', batchPrograms.map((p: { id: string }) => p.id));
      }
    }
    if (selectedProgram) {
      query = query.eq('program_id', selectedProgram);
    }
    if (selectedStatus) {
      query = query.eq('status', selectedStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading halaqahs:', error);
      return;
    }

    if (!data) return;

    // Enrich with program details, student counts, and muallimah info
    const enrichedData = await Promise.all(
      data.map(async (h: any) => {
        // Fetch program details
        const { data: programData } = await supabase
          .from('programs')
          .select('id, name, class_type, batch_id')
          .eq('id', h.program_id)
          .single();

        // Fetch batch details
        let batchData = null;
        if (programData?.batch_id) {
          const { data } = await supabase
            .from('batches')
            .select('id, name')
            .eq('id', programData.batch_id)
            .single();
          batchData = data;
        }

        // Count active students
        const { count } = await supabase
          .from('halaqah_students')
          .select('*', { count: 'exact', head: true })
          .eq('halaqah_id', h.id)
          .eq('status', 'active');

        // Fetch muallimah if assigned
        let muallimah = null;
        if (h.muallimah_id) {
          const { data: muallimahData } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', h.muallimah_id)
            .single();
          muallimah = muallimahData;
        }

        return {
          ...h,
          program: programData ? {
            ...programData,
            batch: batchData
          } : undefined,
          _count: { students: count || 0 },
          muallimah: muallimah || undefined
        };
      })
    );
    setHalaqahs(enrichedData);
  };

  const handleDeleteHalaqah = async (halaqahId: string) => {
    if (!confirm('Are you sure you want to delete this halaqah?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('halaqah')
        .delete()
        .eq('id', halaqahId);

      if (error) throw error;

      toast.success('Halaqah deleted successfully');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete halaqah');
    }
  };

  const handleStatusChange = async (halaqahId: string, newStatus: Halaqah['status']) => {
    try {
      const { error } = await supabase
        .from('halaqah')
        .update({ status: newStatus })
        .eq('id', halaqahId);

      if (error) throw error;

      toast.success(`Status updated to ${newStatus}`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const getDayName = (dayNum?: number) => {
    if (!dayNum) return '-';
    const days = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
    return days[dayNum] || '-';
  };

  const formatTime = (time?: string) => {
    if (!time) return '-';
    return time;
  };

  const getStatusBadge = (status: Halaqah['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Halaqah Management</h2>
          <p className="text-gray-600 mt-1">
            Manage halaqah (study groups) for muallimah and thalibah
          </p>
        </div>
        <button
          onClick={() => setShowAutoCreateModal(true)}
          className="px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Auto-Create Halaqah
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-900 min-w-[200px]"
          >
            <option value="">All Batches {batches.length > 0 && `(${batches.length})`}</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name} ({batch.status})
              </option>
            ))}
          </select>

          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-900"
            disabled={!selectedBatch}
          >
            <option value="">All Programs</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-900"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Halaqah List or Detail View */}
      {selectedHalaqah ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedHalaqah(null)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            ← Back to list
          </button>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedHalaqah.name}</h3>
                <p className="text-gray-600 mt-1">{selectedHalaqah.description || 'No description'}</p>
              </div>
              {getStatusBadge(selectedHalaqah.status)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Program</p>
                <p className="font-medium">{selectedHalaqah.program?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Batch</p>
                <p className="font-medium">{selectedHalaqah.program?.batch?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Schedule</p>
                <p className="font-medium">
                  {getDayName(selectedHalaqah.day_of_week)}, {formatTime(selectedHalaqah.start_time)} - {formatTime(selectedHalaqah.end_time)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Muallimah</p>
                <p className="font-medium">{selectedHalaqah.muallimah?.full_name || 'Not assigned'}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold mb-4">Students</h4>
              <HalaqahStudentsList
                halaqahId={selectedHalaqah.id}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : halaqahs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No halaqah found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting filters or create new halaqah
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Muallimah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {halaqahs.map((halaqah) => (
                    <tr key={halaqah.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{halaqah.name}</p>
                          {halaqah.location && (
                            <p className="text-sm text-gray-500">{halaqah.location}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{halaqah.program?.name || '-'}</p>
                          <p className="text-xs text-gray-500">{halaqah.program?.batch?.name || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{getDayName(halaqah.day_of_week)}</span>
                          {halaqah.start_time && (
                            <>
                              <Clock className="w-4 h-4 text-gray-400 ml-2" />
                              <span>{halaqah.start_time} - {halaqah.end_time}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {halaqah.muallimah?.full_name || 'Not assigned'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {halaqah._count?.students || 0}/{halaqah.max_students || 20}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(halaqah.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedHalaqah(halaqah)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {halaqah.status === 'inactive' && (
                            <button
                              onClick={() => handleStatusChange(halaqah.id, 'active')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Activate halaqah"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {halaqah.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(halaqah.id, 'inactive')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Deactivate halaqah"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteHalaqah(halaqah.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete halaqah"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Auto-Create Modal */}
      {showAutoCreateModal && (
        <AutoCreateHalaqahModal
          onClose={() => setShowAutoCreateModal(false)}
          onSuccess={() => {
            setShowAutoCreateModal(false);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
