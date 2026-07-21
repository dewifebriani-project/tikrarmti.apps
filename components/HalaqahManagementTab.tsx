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
  Calculator,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HalaqahStudentsList } from '@/components/HalaqahStudentsList';
import { AutoCreateHalaqahModal } from '@/components/AutoCreateHalaqahModal';
import { EditHalaqahModal } from '@/components/EditHalaqahModal';
import { AssignThalibahModal } from '@/components/AssignThalibahModal';
import { ManualCreateHalaqahModal } from '@/components/ManualCreateHalaqahModal';
import { formatSchedule, formatClassType } from '@/lib/format-utils';
import { updateHalaqah, deleteHalaqah } from '@/app/(protected)/admin/halaqah/actions';
import { HalaqahStats, HalaqahStatsData } from '@/components/admin/halaqah/HalaqahStats';

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
  quota_details?: {
    submitted: number;
    approved: number;
    draft: number;
    active: number;
    waitlist: number;
    total_used: number;
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

function QuotaDetailsCell({ halaqah }: { halaqah: Halaqah }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="text-xs space-y-1 mt-1">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium w-full justify-between py-1 px-2 -mx-2 rounded-md hover:bg-blue-50 transition-colors"
      >
        <span>Details Quota</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      
      {expanded && (
        <div className="pt-2 pb-1 space-y-1.5 border-t border-gray-100 mt-1">
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Terpakai:</span>
            <span className="font-medium text-gray-900">{halaqah.quota_details?.total_used || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-green-600">✓ Approved:</span>
            <span className="font-medium text-green-700">{halaqah.quota_details?.approved || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-blue-600">✓ Submitted:</span>
            <span className="font-medium text-blue-700">{halaqah.quota_details?.submitted || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">○ Draft:</span>
            <span className="font-medium text-gray-500">{halaqah.quota_details?.draft || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-green-600">✓ Active:</span>
            <span className="font-medium text-green-700">{halaqah.quota_details?.active || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-yellow-600">⏱ Waitlist:</span>
            <span className="font-medium text-yellow-700">{halaqah.quota_details?.waitlist || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
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
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Sort - default to day_of_week then start_time
  const [sortColumn, setSortColumn] = useState<keyof Halaqah>('day_of_week');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modals
  const [selectedHalaqah, setSelectedHalaqah] = useState<Halaqah | null>(null);
  const [editingHalaqah, setEditingHalaqah] = useState<Halaqah | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAutoCreateModal, setShowAutoCreateModal] = useState(false);
  const [showManualCreateModal, setShowManualCreateModal] = useState(false);
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
          const defaultBatch = result.data.find((b: Batch) => b.status === 'open' || b.status === 'ongoing') || result.data[0];
          setSelectedBatch(defaultBatch.id);
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
          },
          quota_details: h.quota_details || {
            submitted: 0,
            approved: 0,
            draft: 0,
            active: 0,
            waitlist: 0,
            total_used: 0
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

  const downloadExcel = async () => {
    try {
      toast.loading('Downloading Excel...', { id: 'download-excel' });

      // Use the filtered and sorted data
      const dataToExport = filteredAndSortedHalaqahs;

      // Create CSV content
      const headers = [
        'No',
        'Halaqah Name',
        'Program',
        'Batch',
        'Muallimah',
        'Class Type',
        'Preferred Juz',
        'Day',
        'Time',
        'Location',
        'Max Students',
        'Quota Used',
        'Approved',
        'Submitted',
        'Draft',
        'Active',
        'Waitlist',
        'Status',
        'Created At'
      ];

      const rows = dataToExport.map((h, index) => {
        const programName = h.program?.name || h.program?.batch?.name || '-';
        const batchName = h.program?.batch?.name || '-';
        const muallimahName = h.muallimah?.full_name || 'Not assigned';
        const dayName = h.day_of_week ? getDayName(h.day_of_week) : '-';
        const timeRange = h.start_time && h.end_time
          ? `${h.start_time} - ${h.end_time}`
          : (h.preferred_schedule ? formatSchedule(h.preferred_schedule).replace(/<[^>]*>/g, ' ') : '-');

        return [
          index + 1,
          `"${h.name || '-'}"`,
          `"${programName}"`,
          `"${batchName}"`,
          `"${muallimahName}"`,
          `"${formatClassType(h.class_type || h.program?.class_type)}"`,
          `"${h.preferred_juz || '-'}"`,
          `"${dayName}"`,
          `"${timeRange}"`,
          `"${h.location || '-'}"`,
          h.max_students || '-',
          h.quota_details?.total_used || 0,
          h.quota_details?.approved || 0,
          h.quota_details?.submitted || 0,
          h.quota_details?.draft || 0,
          h.quota_details?.active || 0,
          h.quota_details?.waitlist || 0,
          h.status,
          new Date(h.created_at).toLocaleDateString('id-ID')
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `halaqah-data-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Excel downloaded successfully', { id: 'download-excel' });
    } catch (error) {
      console.error('[HalaqahManagementTab] Error downloading Excel:', error);
      toast.error('Failed to download Excel', { id: 'download-excel' });
    }
  };

  const downloadPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'download-pdf' });

      // Use the filtered and sorted data
      const dataToExport = filteredAndSortedHalaqahs;

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Halaqah Data</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            h1 { text-align: center; color: #1f2937; }
            .meta { text-align: center; color: #6b7280; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #065f46; color: white; padding: 8px; text-align: left; font-weight: bold; border: 1px solid #065f46; }
            td { padding: 6px 8px; border: 1px solid #d1d5db; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .badge-active { background-color: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 9999px; font-size: 10px; }
            .badge-inactive { background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 10px; }
            .badge-suspended { background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 9999px; font-size: 10px; }
            .quota-details { font-size: 10px; color: #6b7280; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>Halaqah Data Report</h1>
          <div class="meta">Generated on ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div class="meta">Total Halaqahs: ${dataToExport.length}</div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Halaqah Name</th>
                <th>Program / Batch</th>
                <th>Muallimah</th>
                <th>Class Type</th>
                <th>Schedule</th>
                <th>Location</th>
                <th>Quota</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${dataToExport.map((h, index) => {
                const programName = h.program?.name || '-';
                const batchName = h.program?.batch?.name || '-';
                const muallimahName = h.muallimah?.full_name || 'Not assigned';
                const dayName = h.day_of_week ? getDayName(h.day_of_week) : '-';
                const timeRange = h.start_time && h.end_time
                  ? `${h.start_time} - ${h.end_time}`
                  : (h.preferred_schedule ? formatSchedule(h.preferred_schedule).replace(/<[^>]*>/g, ' ') : '-');
                const scheduleStr = h.day_of_week ? `${dayName}, ${timeRange}` : timeRange;
                const statusBadge = `badge-${h.status}`;

                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td><strong>${h.name || '-'}</strong></td>
                    <td>${programName}<br><small>${batchName}</small></td>
                    <td>${muallimahName}</td>
                    <td>${formatClassType(h.class_type || h.program?.class_type)}</td>
                    <td>${scheduleStr}</td>
                    <td>${h.location || '-'}</td>
                    <td>
                      <div>${h.quota_details?.total_used || 0} / ${h.max_students || '-'}</div>
                      <div class="quota-details">
                        ✓ ${h.quota_details?.approved || 0} | ✓ ${h.quota_details?.submitted || 0} | ○ ${h.quota_details?.draft || 0}<br>
                        ✓ ${h.quota_details?.active || 0} | ⏱ ${h.quota_details?.waitlist || 0}
                      </div>
                    </td>
                    <td><span class="${statusBadge}">${h.status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 10px;">
            Generated by Tikrar MTI Admin System
          </div>
        </body>
        </html>
      `;

      // Create a new window and print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();

        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
          toast.success('PDF generated. Use the print dialog to save as PDF.', { id: 'download-pdf' });
        }, 500);
      } else {
        toast.error('Failed to open print window. Please allow popups.', { id: 'download-pdf' });
      }
    } catch (error) {
      console.error('[HalaqahManagementTab] Error generating PDF:', error);
      toast.error('Failed to generate PDF', { id: 'download-pdf' });
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

    // Day filter
    if (selectedDay !== '') {
      filtered = filtered.filter(h => h.day_of_week === parseInt(selectedDay));
    }

    // Sort - first by day_of_week, then by start_time, then by selected column
    filtered.sort((a, b) => {
      // Primary sort: always by day_of_week first
      const aDay = a.day_of_week ?? 999;
      const bDay = b.day_of_week ?? 999;
      if (aDay !== bDay) {
        return sortDirection === 'asc' ? aDay - bDay : bDay - aDay;
      }

      // Secondary sort: by start_time
      const aTime = a.start_time ?? '23:59';
      const bTime = b.start_time ?? '23:59';
      if (aTime !== bTime) {
        return sortDirection === 'asc' ? aTime.localeCompare(bTime) : bTime.localeCompare(aTime);
      }

      // Tertiary sort: by selected column (if not day_of_week)
      if (sortColumn !== 'day_of_week') {
        let aVal: any;
        let bVal: any;

        // Handle nested properties
        if (sortColumn === 'name') {
          aVal = formatHalaqahName(a).toLowerCase();
          bVal = formatHalaqahName(b).toLowerCase();
        } else if (sortColumn === 'muallimah_id') {
          // Sort by muallimah name
          aVal = a.muallimah?.full_name?.toLowerCase() || '';
          bVal = b.muallimah?.full_name?.toLowerCase() || '';
        } else if (sortColumn === '_count') {
          // Sort by student count
          aVal = a._count?.students || 0;
          bVal = b._count?.students || 0;
        } else if (sortColumn === 'status') {
          // Custom status order
          const statusOrder = { active: 1, inactive: 2, suspended: 3 };
          aVal = statusOrder[a.status as keyof typeof statusOrder] || 999;
          bVal = statusOrder[b.status as keyof typeof statusOrder] || 999;
        } else {
          aVal = a[sortColumn];
          bVal = b[sortColumn];
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
          ? aVal > bVal ? 1 : -1
          : aVal < bVal ? 1 : -1;
      }

      return 0;
    });

    return filtered;
  }, [halaqahs, searchQuery, sortColumn, sortDirection, selectedDay]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedHalaqahs.length / itemsPerPage);
  const paginatedHalaqahs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedHalaqahs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedHalaqahs, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBatch, selectedProgram, selectedStatus, selectedDay]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Halaqah Management</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Manage halaqah (study groups) for muallimah and thalibah
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAssignThalibahModal(true)}
            disabled={!selectedBatch}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-sm shadow-sm shadow-blue-600/10 active:scale-95 duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" />
            Assign Thalibah
          </button>
          <button
            onClick={() => setShowManualCreateModal(true)}
            disabled={!selectedBatch}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm shadow-indigo-600/10 active:scale-95 duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" />
            Add Halaqah
          </button>
          <button
            onClick={() => setShowAutoCreateModal(true)}
            className="px-4 py-2.5 bg-green-900 text-white rounded-xl hover:bg-green-800 transition-all font-bold text-sm shadow-sm shadow-green-900/10 active:scale-95 duration-200 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Auto Create
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <HalaqahStats
        isLoading={loading}
        stats={
          halaqahs.length > 0
            ? {
                total: halaqahs.length,
                active: halaqahs.filter(h => h.status === 'active').length,
                muallimah: new Set(halaqahs.map(h => h.muallimah_id).filter(Boolean)).size,
                capacity: halaqahs.reduce((sum, h) => sum + (h.max_students || 0), 0),
                used: halaqahs.reduce((sum, h) => sum + (h.quota_details?.total_used || 0), 0)
              }
            : null
        }
      />

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Filters:</span>
          </div>

          <div className="relative flex-1 min-w-[250px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, muallimah, program, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-950 focus:border-green-950 transition-all shadow-sm"
            />
          </div>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-950 focus:border-green-950 min-w-[200px] transition-all bg-white shadow-sm font-semibold text-gray-700"
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
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-950 focus:border-green-950 transition-all bg-white shadow-sm font-semibold text-gray-700"
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
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-950 focus:border-green-950 transition-all bg-white shadow-sm font-semibold text-gray-700"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-950 focus:border-green-950 transition-all bg-white shadow-sm font-semibold text-gray-700"
          >
            <option value="">All Days</option>
            <option value="1">Senin</option>
            <option value="2">Selasa</option>
            <option value="3">Rabu</option>
            <option value="4">Kamis</option>
            <option value="5">Jumat</option>
            <option value="6">Sabtu</option>
            <option value="7">Ahad</option>
          </select>

          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95 duration-200 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            onClick={handleRecalculateQuota}
            disabled={recalculating}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95 duration-200 shadow-blue-600/10 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {recalculating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Calculator className="w-3.5 h-3.5" />
            )}
            {recalculating ? 'Calculating...' : 'Recalculate Quota'}
          </button>

          <div className="h-6 w-px bg-gray-200" />

          <button
            onClick={downloadExcel}
            disabled={filteredAndSortedHalaqahs.length === 0}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm active:scale-95 duration-200 shadow-emerald-600/10 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download as Excel (CSV)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>

          <button
            onClick={downloadPDF}
            disabled={filteredAndSortedHalaqahs.length === 0}
            className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all shadow-sm active:scale-95 duration-200 shadow-rose-600/10 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download as PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>

        {/* Results count */}
        <div className="mt-3 text-xs font-semibold text-gray-500">
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
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-900" />
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
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none cursor-pointer hover:bg-gray-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {sortColumn === 'name' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">
                        Class Type
                      </th>
                      <th
                        onClick={() => handleSort('preferred_juz')}
                        className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none cursor-pointer hover:bg-gray-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Juz
                          {sortColumn === 'preferred_juz' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('day_of_week')}
                        className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none cursor-pointer hover:bg-gray-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Schedule
                          {sortColumn === 'day_of_week' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('muallimah_id')}
                        className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none cursor-pointer hover:bg-gray-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Muallimah
                          {sortColumn === 'muallimah_id' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('_count')}
                        className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none cursor-pointer hover:bg-gray-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Thalibah
                          {sortColumn === '_count' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('status')}
                        className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none cursor-pointer hover:bg-gray-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortColumn === 'status' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">
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
                            {/* Quota details */}
                            <QuotaDetailsCell halaqah={halaqah} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(halaqah.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedHalaqah(halaqah)}
                              className="p-2 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-100 active:scale-90"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setEditingHalaqah(halaqah)}
                              className="p-2 text-blue-600 bg-blue-50/50 hover:bg-blue-100 rounded-lg transition-all border border-blue-100 active:scale-90"
                              title="Edit halaqah"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {halaqah.status === 'inactive' && (
                              <button
                                onClick={() => handleStatusChange(halaqah.id, 'active')}
                                className="p-2 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 rounded-lg transition-all border border-emerald-100 active:scale-90"
                                title="Activate halaqah"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            {halaqah.status === 'active' && (
                              <button
                                onClick={() => handleStatusChange(halaqah.id, 'inactive')}
                                className="p-2 text-amber-600 bg-amber-50/50 hover:bg-amber-100 rounded-lg transition-all border border-amber-100 active:scale-90"
                                title="Deactivate halaqah"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteHalaqah(halaqah.id)}
                              className="p-2 text-red-600 bg-red-50/50 hover:bg-red-100 rounded-lg transition-all border border-red-100 active:scale-90"
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
                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-white">
                  <div className="text-xs font-semibold text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-bold text-xs transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1.5">
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
                            className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all duration-300 ${
                              currentPage === pageNum
                                ? 'bg-green-900 text-white border-green-900 shadow-sm'
                                : 'border-gray-200 hover:bg-gray-50 text-gray-600'
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
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-bold text-xs transition-all duration-200"
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

      {/* Manual Create Halaqah Modal */}
      {showManualCreateModal && (
        <ManualCreateHalaqahModal
          onClose={() => setShowManualCreateModal(false)}
          onSuccess={() => {
            setShowManualCreateModal(false);
            setRefreshTrigger(prev => prev + 1);
          }}
          batchId={selectedBatch}
        />
      )}
    </div>
  );
}
