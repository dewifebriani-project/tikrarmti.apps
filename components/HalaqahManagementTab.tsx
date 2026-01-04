'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Loader2,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HalaqahStudentsList } from '@/components/HalaqahStudentsList';
import { AutoCreateHalaqahModal } from '@/components/AutoCreateHalaqahModal';

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
  preferred_juz?: string;
  zoom_link?: string;
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
  const [loading, setLoading] = useState(true);
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Filters
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals
  const [selectedHalaqah, setSelectedHalaqah] = useState<Halaqah | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAutoCreateModal, setShowAutoCreateModal] = useState(false);

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
      const response = await fetch('/api/admin/batches');
      const result = await response.json();

      if (response.ok && result.data) {
        console.log('[HalaqahManagementTab] Loaded batches via API:', result.data.length);
        setBatches(result.data);
        if (!selectedBatch && result.data.length > 0) {
          setSelectedBatch(result.data[0].id);
        }
        return;
      }
    } catch (apiError: any) {
      console.error('[HalaqahManagementTab] Error loading batches:', apiError.message);
    }
  };

  const loadPrograms = async () => {
    if (!selectedBatch) return;

    try {
      const response = await fetch('/api/programs?batch_id=' + selectedBatch);
      const result = await response.json();

      if (response.ok && result.data) {
        setPrograms(result.data);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadHalaqahs = async () => {
    console.log('[HalaqahManagementTab] Loading halaqahs...');

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedBatch) params.append('batch_id', selectedBatch);
      if (selectedProgram) params.append('program_id', selectedProgram);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/admin/halaqah?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('[HalaqahManagementTab] Failed to load halaqahs:', result);
        toast.error(result.error || 'Failed to load halaqah data');
        return;
      }

      if (result.success && result.data) {
        console.log('[HalaqahManagementTab] Loaded', result.data.length, 'halaqahs');
        setHalaqahs(result.data);
      } else {
        setHalaqahs([]);
      }
    } catch (error: any) {
      console.error('[HalaqahManagementTab] Error loading halaqahs:', error);
      toast.error('Failed to load halaqahs: ' + error.message);
    }
  };

  const handleDeleteHalaqah = async (halaqahId: string) => {
    if (!confirm('Are you sure you want to delete this halaqah?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/halaqah/${halaqahId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete halaqah');
      }

      toast.success('Halaqah deleted successfully');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete halaqah');
    }
  };

  const handleStatusChange = async (halaqahId: string, newStatus: Halaqah['status']) => {
    try {
      const response = await fetch(`/api/admin/halaqah/${halaqahId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

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
          <Sparkles className="w-4 h-4" />
          Auto Create Halaqah
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

      {/* Auto Create Halaqah Modal */}
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
