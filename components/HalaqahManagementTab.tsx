'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  Edit,
  ChevronUp,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HalaqahStudentsList } from '@/components/HalaqahStudentsList';
import { AutoCreateHalaqahModal } from '@/components/AutoCreateHalaqahModal';
import { EditHalaqahModal } from '@/components/EditHalaqahModal';
import { AssignThalibahModal } from '@/components/AssignThalibahModal';
import { formatSchedule, formatClassType } from '@/lib/format-utils';
import { updateHalaqah, deleteHalaqah } from '@/app/(protected)/admin/halaqah/actions';

interface Halaqah {
  id: string;
  program_id: string | null;
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
  class_type?: string;
  preferred_schedule?: string;
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
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sort
  const [sortColumn, setSortColumn] = useState<keyof Halaqah>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modals
  const [selectedHalaqah, setSelectedHalaqah] = useState<Halaqah | null>(null);
  const [editingHalaqah, setEditingHalaqah] = useState<Halaqah | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAutoCreateModal, setShowAutoCreateModal] = useState(false);
  const [showAssignThalibahModal, setShowAssignThalibahModal] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

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
      // Build query params
      const params = new URLSearchParams();
      if (selectedBatch) params.append('batch_id', selectedBatch);
      if (selectedProgram) params.append('program_id', selectedProgram);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/halaqah?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('[HalaqahManagementTab] Failed to load halaqahs:', result);
        toast.error(result.error || 'Failed to load halaqah data');
        return;
      }

      if (result.data) {
        console.log('[HalaqahManagementTab] Loaded', result.data.length, 'halaqahs');
        // Transform data to match expected format
        const transformedHalaqahs = result.data.map((h: any) => ({
          ...h,
          _count: {
            students: h.students_count || 0
          }
        }));
        setHalaqahs(transformedHalaqahs);
      } else {
        setHalaqahs([]);
      }
    } catch (error: any) {
      console.error('[HalaqahManagementTab] Error loading halaqahs:', error);
      toast.error('Failed to load halaqahs: ' + error.message);
    }
  };

  const handleRecalculateQuota = async () => {
    setRecalculating(true);
    try {
      const response = await fetch('/api/admin/halaqah/recalculate-quota', {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to recalculate quota');
      }

      toast.success(result.message || 'Quota recalculated successfully');
      // Refresh data to show updated counts
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('[HalaqahManagementTab] Error recalculating quota:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to recalculate quota');
    } finally {
      setRecalculating(false);
    }
  };

  const handleDeleteHalaqah = async (halaqahId: string) => {
    if (!confirm('Are you sure you want to delete this halaqah?')) {
      return;
    }

    try {
      const result = await deleteHalaqah(halaqahId);

      if (!result.success) {
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
      const result = await updateHalaqah({
        id: halaqahId,
        status: newStatus as 'draft' | 'active' | 'completed' | 'cancelled'
      });

      if (!result.success) {
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

  // Format name - avoid double "Halaqah Ustadzah"
  const formatHalaqahName = (halaqah: Halaqah) => {
    let name = halaqah.name;

    // Clean up multiple "Halaqah" prefixes (case-insensitive)
    while (name.toLowerCase().startsWith('halaqah ')) {
      name = name.substring(8);
    }
    while (name.toLowerCase().startsWith('halaqah')) {
      name = name.substring(7);
    }

    // Clean up multiple "Ustadzah" prefixes (case-insensitive)
    while (name.toLowerCase().startsWith('ustadzah ')) {
      name = name.substring(9);
    }
    while (name.toLowerCase().startsWith('ustadzah')) {
      name = name.substring(8);
    }

    // Trim whitespace
    name = name.trim();

    // If after cleaning we have an empty name or just spaces, return original
    if (!name) {
      return halaqah.name;
    }

    // Add the proper prefix
    return `Halaqah Ustadzah ${name}`;
  };

  // Handle sort
  const handleSort = (column: keyof Halaqah) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort halaqahs
  const filteredAndSortedHalaqahs = useMemo(() => {
    let filtered = [...halaqahs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(query) ||
        h.muallimah?.full_name?.toLowerCase().includes(query) ||
        h.program?.name?.toLowerCase().includes(query) ||
        h.location?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle nested properties
      if (sortColumn === 'name') {
        aVal = formatHalaqahName(a).toLowerCase();
        bVal = formatHalaqahName(b).toLowerCase();
      }

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc'
        ? (aVal as any) > (bVal as any) ? 1 : -1
        : (aVal as any) < (bVal as any) ? 1 : -1;
    });

    return filtered;
  }, [halaqahs, searchQuery, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedHalaqahs.length / itemsPerPage);
  const paginatedHalaqahs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedHalaqahs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedHalaqahs, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBatch, selectedProgram, selectedStatus]);

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
        <div className="flex gap-3">
          <button
            onClick={() => setShowAssignThalibahModal(true)}
            disabled={!selectedBatch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" />
            Assign Thalibah
          </button>
          <button
            onClick={() => setShowAutoCreateModal(true)}
            className="px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Auto Create Halaqah
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <div className="relative flex-1 min-w-[250px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, muallimah, program, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-900"
            />
          </div>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-900 min-w-[200px]"
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
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-900"
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
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-900"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>

          <button
            onClick={handleRecalculateQuota}
            disabled={recalculating}
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {recalculating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Calculator className="w-3 h-3" />
            )}
            {recalculating ? 'Calculating...' : 'Recalculate Quota'}
          </button>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {paginatedHalaqahs.length} of {filteredAndSortedHalaqahs.length} halaqahs
          {filteredAndSortedHalaqahs.length !== halaqahs.length && ` (filtered from ${halaqahs.length} total)`}
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
                {selectedHalaqah.day_of_week ? (
                  <p className="font-medium">
                    {getDayName(selectedHalaqah.day_of_week)}, {formatTime(selectedHalaqah.start_time)} - {formatTime(selectedHalaqah.end_time)}
                  </p>
                ) : (
                  <div
                    className="font-medium text-gray-900"
                    dangerouslySetInnerHTML={{ __html: formatSchedule(selectedHalaqah.preferred_schedule) }}
                  />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Muallimah</p>
                <p className="font-medium">
                  {selectedHalaqah.muallimah?.full_name
                    ? `Ustadzah ${selectedHalaqah.muallimah.full_name}`
                    : 'Not assigned'}
                </p>
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
        <div className="bg-white border border-gray-200 rounded-lg">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredAndSortedHalaqahs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No halaqah found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting filters or create new halaqah
              </p>
            </div>
          ) : (
            <>
              {/* Table with horizontal scroll */}
              <div className="overflow-x-auto overflow-y-visible scroll-smooth">
                <table className="w-full border-collapse min-w-[1200px]">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {sortColumn === 'name' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class Type
                      </th>
                      <th
                        onClick={() => handleSort('preferred_juz')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      >
                        <div className="flex items-center gap-1">
                          Juz
                          {sortColumn === 'preferred_juz' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Schedule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Muallimah
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thalibah
                      </th>
                      <th
                        onClick={() => handleSort('status')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortColumn === 'status' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedHalaqahs.map((halaqah) => (
                      <tr key={halaqah.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatHalaqahName(halaqah)}
                            </p>
                            {halaqah.location && (
                              <p className="text-sm text-gray-500">{halaqah.location}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {formatClassType(halaqah.class_type || halaqah.program?.class_type)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {halaqah.preferred_juz || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {halaqah.day_of_week ? (
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
                          ) : (
                            <div
                              className="text-sm max-w-xs whitespace-pre-line text-gray-900"
                              dangerouslySetInnerHTML={{ __html: formatSchedule(halaqah.preferred_schedule) }}
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {halaqah.muallimah?.full_name ? `Ustadzah ${halaqah.muallimah.full_name}` : 'Not assigned'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {halaqah.max_students ? (halaqah.max_students - (halaqah._count?.students || 0)) : '?'} dari {halaqah.max_students || 20}
                              </span>
                              <span className="text-xs text-gray-500">tersedia</span>
                            </div>
                            {/* Progress bar - similar to daftar ulang */}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  (halaqah._count?.students || 0) >= (halaqah.max_students || 20)
                                    ? 'bg-red-500'
                                    : (halaqah.max_students || 20) - (halaqah._count?.students || 0) <= 3
                                    ? 'bg-orange-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${((halaqah._count?.students || 0) / (halaqah.max_students || 20)) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(halaqah.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedHalaqah(halaqah)}
                              className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-all border border-indigo-200 hover:border-indigo-300"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setEditingHalaqah(halaqah)}
                              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-all border border-blue-200 hover:border-blue-300"
                              title="Edit halaqah"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {halaqah.status === 'inactive' && (
                              <button
                                onClick={() => handleStatusChange(halaqah.id, 'active')}
                                className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-all border border-green-200 hover:border-green-300"
                                title="Activate halaqah"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            {halaqah.status === 'active' && (
                              <button
                                onClick={() => handleStatusChange(halaqah.id, 'inactive')}
                                className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-all border border-orange-200 hover:border-orange-300"
                                title="Deactivate halaqah"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteHalaqah(halaqah.id)}
                              className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-all border border-red-200 hover:border-red-300"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
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
                            className={`w-10 h-10 rounded-md border ${
                              currentPage === pageNum
                                ? 'bg-green-900 text-white border-green-900'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
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

      {/* Assign Thalibah Modal */}
      {showAssignThalibahModal && selectedBatch && (
        <AssignThalibahModal
          batchId={selectedBatch}
          batchName={batches.find(b => b.id === selectedBatch)?.name || ''}
          onClose={() => setShowAssignThalibahModal(false)}
          onSuccess={() => {
            setShowAssignThalibahModal(false);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {/* Edit Halaqah Modal */}
      {editingHalaqah && (
        <EditHalaqahModal
          halaqah={editingHalaqah}
          onClose={() => setEditingHalaqah(null)}
          onSuccess={() => {
            setEditingHalaqah(null);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
