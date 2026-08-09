'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  Download,
  FileSpreadsheet,
  FileText,
  Video,
  Copy,
  ClipboardList,
  MessageSquare,
  MoreVertical,
  ArrowRightLeft
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
import { ScheduleOverlapAnalysis } from '@/components/admin/halaqah/ScheduleOverlapAnalysis';
import {
  generateHalaqahReminder,
  generateTagThalibah,
  generateLaporanKelas,
  type HalaqahForReminder
} from '@/lib/reminder-generator';

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
  zoom_link_id?: string;
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
    pending?: number;
    submitted?: number;
    approved?: number;
    draft?: number;
    active: number;
    waitlist: number;
    total_used: number;
    total_reserved?: number;
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
        <span>Rincian Kuota</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      
      {expanded && (
        <div className="pt-2 pb-1 space-y-1.5 border-t border-gray-100 mt-1">
          <div className="flex justify-between gap-3">
            <span className="font-semibold text-gray-700">Total slot terisi:</span>
            <span className="font-medium text-gray-900">{halaqah.quota_details?.total_used || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-green-600">✓ Thalibah aktif:</span>
            <span className="font-medium text-green-700">{halaqah.quota_details?.active || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-blue-600">⏳ Menunggu aktivasi:</span>
            <span className="font-medium text-blue-700">{halaqah.quota_details?.pending || 0}</span>
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
  const [emptyOnly, setEmptyOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'tikrar_tahfidz' | 'pra_tahfidz' | 'tikrar_berbayar'>('tikrar_tahfidz');

  // Sort - default to day_of_week then start_time
  const [sortColumn, setSortColumn] = useState<keyof Halaqah>('day_of_week');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');



  // Modals
  const [selectedHalaqah, setSelectedHalaqah] = useState<Halaqah | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [editingHalaqah, setEditingHalaqah] = useState<Halaqah | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAutoCreateModal, setShowAutoCreateModal] = useState(false);
  const [showManualCreateModal, setShowManualCreateModal] = useState(false);
  const [showAssignThalibahModal, setShowAssignThalibahModal] = useState(false);
  const [showScheduleOverlapModal, setShowScheduleOverlapModal] = useState(false);
  const [zoomLinks, setZoomLinks] = useState<Array<{ id: string; name: string; url: string; meeting_id?: string; passcode?: string }>>([]);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [movingToPraId, setMovingToPraId] = useState<string | null>(null);
  const halaqahRequestIdRef = useRef(0);

  useEffect(() => {
    loadData();
  }, [selectedBatch, selectedProgram, selectedStatus, refreshTrigger]);

  // Load zoom links when batch changes
  useEffect(() => {
    if (selectedBatch) {
      loadZoomLinks();
    }
  }, [selectedBatch]);

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

    // Never request every batch while the default batch is still being chosen.
    if (!selectedBatch) {
      setHalaqahs([]);
      return;
    }

    const requestId = ++halaqahRequestIdRef.current;

    try {
      // Build query params
      const params = new URLSearchParams();
      if (selectedBatch) params.append('batch_id', selectedBatch);
      if (selectedProgram) params.append('program_id', selectedProgram);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/halaqah?${params.toString()}`);
      const result = await response.json();

      // A filter/batch changed while this request was running. Ignore the stale
      // response so it cannot overwrite the latest batch result.
      if (requestId !== halaqahRequestIdRef.current) return;

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
            pending: 0,
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
      if (requestId !== halaqahRequestIdRef.current) return;
      console.error('[HalaqahManagementTab] Error loading halaqahs:', error);
      toast.error('Failed to load halaqahs: ' + error.message);
    }
  };

  // ─── Zoom Links ──────────────────────────────────────────────
  const loadZoomLinks = async () => {
    try {
      const res = await fetch(`/api/admin/batch/${selectedBatch}/zoom-links`);
      const result = await res.json();
      if (res.ok && result.success) {
        setZoomLinks(result.data || []);
      }
    } catch (error) {
      console.error('Error loading zoom links:', error);
    }
  };

  const getZoomForHalaqah = (halaqah: Halaqah) => {
    // If halaqah has zoom_link_id, find the matching zoom link
    if (halaqah.zoom_link_id) {
      const zoom = zoomLinks.find(z => z.id === halaqah.zoom_link_id);
      if (zoom) return zoom;
    }
    // Fallback: try matching by URL
    if (halaqah.zoom_link) {
      const zoom = zoomLinks.find(z => z.url === halaqah.zoom_link);
      if (zoom) return zoom;
    }
    return null;
  };

  const buildReminderData = async (halaqah: Halaqah): Promise<HalaqahForReminder> => {
    const zoom = getZoomForHalaqah(halaqah);
    const classType = halaqah.class_type || halaqah.program?.class_type;

    // Fetch students for this halaqah
    let students: Array<{ full_name: string; preferred_juz?: string }> = [];
    try {
      const res = await fetch(`/api/halaqah/${halaqah.id}/students`);
      const result = await res.json();
      if (res.ok && result.students) {
        students = result.students
          .filter((s: any) => s.status === 'active')
          .map((s: any) => ({
            full_name: s.thalibah?.full_name || 'Unknown',
            preferred_juz: halaqah.preferred_juz,
          }));
      }
    } catch (error) {
      console.error('Error fetching students for reminder:', error);
    }

    return {
      name: halaqah.name,
      day_of_week: halaqah.day_of_week,
      start_time: halaqah.start_time,
      end_time: halaqah.end_time,
      preferred_juz: halaqah.preferred_juz,
      class_type: classType,
      zoom_link: zoom?.url || halaqah.zoom_link,
      zoom_name: zoom?.name,
      zoom_meeting_id: zoom?.meeting_id,
      zoom_passcode: zoom?.passcode,
      muallimah: halaqah.muallimah,
      program: halaqah.program,
      students,
    };
  };

  // ─── Copy Handlers ──────────────────────────────────────────
  const handleCopyReminder = async (halaqah: Halaqah) => {
    setCopyingId(`reminder-${halaqah.id}`);
    try {
      const data = await buildReminderData(halaqah);
      const text = generateHalaqahReminder(data);
      await navigator.clipboard.writeText(text);
      toast.success('Reminder halaqah berhasil disalin!');
    } catch (error) {
      toast.error('Gagal menyalin reminder');
    } finally {
      setCopyingId(null);
    }
  };

  const handleCopyTagThalibah = async (halaqah: Halaqah) => {
    setCopyingId(`tag-${halaqah.id}`);
    try {
      const data = await buildReminderData(halaqah);
      const text = generateTagThalibah(data);
      await navigator.clipboard.writeText(text);
      toast.success('Tag thalibah berhasil disalin!');
    } catch (error) {
      toast.error('Gagal menyalin tag thalibah');
    } finally {
      setCopyingId(null);
    }
  };

  const handleCopyLaporan = async (halaqah: Halaqah) => {
    setCopyingId(`laporan-${halaqah.id}`);
    try {
      const data = await buildReminderData(halaqah);
      const text = generateLaporanKelas(data);
      await navigator.clipboard.writeText(text);
      toast.success('Laporan kelas berhasil disalin!');
    } catch (error) {
      toast.error('Gagal menyalin laporan kelas');
    } finally {
      setCopyingId(null);
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
        const muallimahName = h.muallimah?.full_name 
          ? (h.muallimah.full_name.toLowerCase().startsWith('ustadzah') ? h.muallimah.full_name : `Ustadzah ${h.muallimah.full_name}`)
          : 'Not assigned';
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
          new Date(h.created_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })
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
          <div class="meta">Generated on ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' })}</div>
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
                const muallimahName = h.muallimah?.full_name 
                  ? (h.muallimah.full_name.toLowerCase().startsWith('ustadzah') ? h.muallimah.full_name : `Ustadzah ${h.muallimah.full_name}`)
                  : 'Not assigned';
                const dayName = h.day_of_week ? getDayName(h.day_of_week) : '-';
                const timeRange = h.start_time && h.end_time
                  ? `${h.start_time} - ${h.end_time} WIB`
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

  const handleMoveToPra = async (halaqah: Halaqah) => {
    const name = halaqah.muallimah?.full_name || halaqah.name;
    if (!confirm(`Pindahkan halaqah ${name} ke Pra Tikrar? Mu’allimah dan jadwal tetap sama.`)) return;

    setMovingToPraId(halaqah.id);
    try {
      const response = await fetch(`/api/admin/halaqah/${halaqah.id}/move-to-pra`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal memindahkan halaqah.');
      toast.success(`Halaqah ${name} berhasil dipindahkan ke Pra Tikrar.`);
      setOpenActionId(null);
      setRefreshTrigger(value => value + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memindahkan halaqah.');
    } finally {
      setMovingToPraId(null);
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

  const formatHalaqahName = (halaqah: Halaqah) => {
    return halaqah.name || 'Halaqah Tanpa Nama';
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

  // Tab filtered halaqahs
  const tabHalaqahs = useMemo(() => {
    return halaqahs.filter(h => {
      const type = h.class_type || h.program?.class_type;
      return type === activeTab;
    });
  }, [halaqahs, activeTab]);

  // Filter and sort halaqahs
  const filteredAndSortedHalaqahs = useMemo(() => {
    let filtered = [...tabHalaqahs];

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

    if (emptyOnly) {
      filtered = filtered.filter(h =>
        (h._count?.students || 0) === 0 && (h.quota_details?.total_used || 0) === 0
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      // Determine values for the primary sort column
      if (sortColumn === 'name') {
        aVal = formatHalaqahName(a).toLowerCase();
        bVal = formatHalaqahName(b).toLowerCase();
      } else if (sortColumn === 'muallimah_id') {
        aVal = a.muallimah?.full_name?.toLowerCase() || '';
        bVal = b.muallimah?.full_name?.toLowerCase() || '';
      } else if (sortColumn === '_count') {
        aVal = a._count?.students || 0;
        bVal = b._count?.students || 0;
      } else if (sortColumn === 'status') {
        const statusOrder = { active: 1, inactive: 2, suspended: 3 };
        aVal = statusOrder[a.status as keyof typeof statusOrder] || 999;
        bVal = statusOrder[b.status as keyof typeof statusOrder] || 999;
      } else {
        aVal = a[sortColumn];
        bVal = b[sortColumn];
      }

      // Compare primary sort column
      if (aVal !== bVal) {
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal, undefined, { numeric: true })
            : bVal.localeCompare(aVal, undefined, { numeric: true });
        }
        
        return sortDirection === 'asc'
          ? (aVal > bVal ? 1 : -1)
          : (bVal > aVal ? 1 : -1);
      }

      // If primary columns are equal (or if sortColumn is day_of_week and equal),
      // fallback to day_of_week and start_time
      if (sortColumn !== 'day_of_week') {
        const aDay = a.day_of_week ?? 999;
        const bDay = b.day_of_week ?? 999;
        if (aDay !== bDay) {
          // Fallback uses the same sortDirection, or always asc? Usually always asc for fallback
          return aDay - bDay;
        }
      }
      
      const aTime = a.start_time ?? '23:59';
      const bTime = b.start_time ?? '23:59';
      if (aTime !== bTime) {
        return aTime.localeCompare(bTime);
      }

      return 0;
    });

    return filtered;
  }, [tabHalaqahs, searchQuery, sortColumn, sortDirection, selectedDay, emptyOnly]);



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
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
          <button
            onClick={() => setShowScheduleOverlapModal(true)}
            className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all font-bold text-sm shadow-sm shadow-teal-600/10 active:scale-95 duration-200 flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            Analisis Zoom
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 mb-6 px-2 rounded-2xl shadow-sm">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('tikrar_tahfidz')}
            className={`${
              activeTab === 'tikrar_tahfidz'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-bold text-sm transition-colors`}
          >
            Halaqah Tikrar Per Juz
          </button>
          <button
            onClick={() => setActiveTab('pra_tahfidz')}
            className={`${
              activeTab === 'pra_tahfidz'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-bold text-sm transition-colors`}
          >
            Pra Tikrar
          </button>
          <button
            onClick={() => setActiveTab('tikrar_berbayar')}
            className={`${
              activeTab === 'tikrar_berbayar'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-bold text-sm transition-colors`}
          >
            Berbayar
          </button>
        </nav>
      </div>

      {/* Stats Section */}
      <HalaqahStats
        isLoading={loading}
        stats={
          tabHalaqahs.length > 0
            ? {
                total: tabHalaqahs.length,
                active: tabHalaqahs.filter(h => h.status === 'active').length,
                muallimah: new Set(tabHalaqahs.map(h => h.muallimah_id).filter(Boolean)).size,
                capacity: tabHalaqahs.reduce((sum, h) => sum + (h.max_students || 0), 0),
                used: tabHalaqahs.reduce((sum, h) => sum + (h.quota_details?.total_used || 0), 0)
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
            onChange={(e) => {
              setSelectedProgram('');
              setSelectedBatch(e.target.value);
            }}
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

          {activeTab === 'tikrar_tahfidz' && (
            <button
              type="button"
              onClick={() => setEmptyOnly(value => !value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 border ${
                emptyOnly
                  ? 'border-orange-300 bg-orange-100 text-orange-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Tanpa Thalibah
            </button>
          )}

          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95 duration-200 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
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
          Showing {filteredAndSortedHalaqahs.length} halaqahs
          {filteredAndSortedHalaqahs.length !== tabHalaqahs.length && ` (filtered from ${tabHalaqahs.length} total)`}
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
              {/* Container for both views */}
              <div className="w-full">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto overflow-y-visible scroll-smooth">
                  <table className="w-full border-collapse min-w-[1200px]">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none cursor-pointer hover:bg-gray-100/80 transition-colors w-[300px]"
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
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none min-w-[80px] w-[80px] sticky right-0 z-10 backdrop-blur-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedHalaqahs.map((halaqah) => (
                      <tr key={halaqah.id} className="hover:bg-gray-50 group">
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
                              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="whitespace-nowrap">{getDayName(halaqah.day_of_week)}</span>
                              {halaqah.start_time && (
                                <>
                                  <Clock className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
                                  <span className="whitespace-nowrap">{halaqah.start_time} - {halaqah.end_time} WIB</span>
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
                              <Users className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-900 whitespace-nowrap">
                                {halaqah.max_students ? Math.max(0, halaqah.max_students - (halaqah.quota_details?.total_used || 0)) : '?'} dari {halaqah.max_students || 20}
                              </span>
                              <span className="text-xs text-gray-500">tersedia</span>
                            </div>
                            {/* Progress bar - similar to daftar ulang */}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  (halaqah.quota_details?.total_used || 0) >= (halaqah.max_students || 20)
                                    ? 'bg-red-500'
                                    : (halaqah.max_students || 20) - (halaqah.quota_details?.total_used || 0) <= 3
                                    ? 'bg-orange-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, ((halaqah.quota_details?.total_used || 0) / (halaqah.max_students || 20)) * 100)}%` }}
                              ></div>
                            </div>
                            {/* Quota details */}
                            <QuotaDetailsCell halaqah={halaqah} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(halaqah.status)}
                        </td>
                        <td className="px-6 py-4 min-w-[80px] w-[80px] sticky right-0 z-[5] bg-white group-hover:bg-gray-50">
                          <div className="flex items-center justify-end gap-1.5 relative">
                            <button
                              onClick={() => setOpenActionId(openActionId === halaqah.id ? null : halaqah.id)}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            
                            {openActionId === halaqah.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenActionId(null)}></div>
                                <div className="absolute right-10 top-0 w-48 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] z-50 py-1 overflow-hidden">
                                  <button
                                    onClick={() => { setSelectedHalaqah(halaqah); setOpenActionId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Eye className="w-4 h-4 text-gray-400" /> Detail
                                  </button>
                                  <button
                                    onClick={() => { setEditingHalaqah(halaqah); setOpenActionId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Edit className="w-4 h-4 text-gray-400" /> Edit
                                  </button>
                                  {activeTab === 'tikrar_tahfidz' &&
                                    (halaqah._count?.students || 0) === 0 &&
                                    (halaqah.quota_details?.total_used || 0) === 0 && (
                                    <button
                                      onClick={() => handleMoveToPra(halaqah)}
                                      disabled={movingToPraId === halaqah.id}
                                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-fuchsia-700 hover:bg-fuchsia-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                                    >
                                      {movingToPraId === halaqah.id
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <ArrowRightLeft className="w-4 h-4" />}
                                      Pindah ke Pra Tikrar
                                    </button>
                                  )}
                                  {halaqah.status === 'inactive' && (
                                    <button
                                      onClick={() => { handleStatusChange(halaqah.id, 'active'); setOpenActionId(null); }}
                                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors"
                                    >
                                      <CheckCircle2 className="w-4 h-4" /> Aktifkan
                                    </button>
                                  )}
                                  {halaqah.status === 'active' && (
                                    <button
                                      onClick={() => { handleStatusChange(halaqah.id, 'inactive'); setOpenActionId(null); }}
                                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 flex items-center gap-2.5 transition-colors"
                                    >
                                      <XCircle className="w-4 h-4" /> Nonaktifkan
                                    </button>
                                  )}
                                  <div className="h-px bg-gray-100 my-1"></div>
                                  <button
                                    onClick={() => { handleDeleteHalaqah(halaqah.id); setOpenActionId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" /> Hapus
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4 p-4">
                {filteredAndSortedHalaqahs.map((halaqah) => (
                  <div key={halaqah.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3 relative">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 pr-16">
                        <p className="font-bold text-gray-900 text-lg leading-tight">
                          {formatHalaqahName(halaqah)}
                        </p>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                          {formatClassType(halaqah.class_type || halaqah.program?.class_type)}
                        </p>
                      </div>
                      <div className="absolute top-4 right-4">
                        {getStatusBadge(halaqah.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Target Juz</span>
                        <span className="font-semibold">{halaqah.preferred_juz || '-'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Muallimah</span>
                        <span className="truncate font-semibold">{halaqah.muallimah?.full_name ? `Ustadzah ${halaqah.muallimah.full_name.split(' ')[0]}` : 'Belum Ada'}</span>
                      </div>
                      <div className="col-span-2 flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Jadwal</span>
                        <span className="font-semibold">
                          {halaqah.day_of_week ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              {getDayName(halaqah.day_of_week)}, {halaqah.start_time} - {halaqah.end_time} WIB
                            </div>
                          ) : (
                            <span dangerouslySetInnerHTML={{ __html: formatSchedule(halaqah.preferred_schedule) }} />
                          )}
                        </span>
                      </div>
                      {halaqah.location && (
                         <div className="col-span-2 flex flex-col gap-0.5">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lokasi</span>
                            <span className="font-semibold">{halaqah.location}</span>
                         </div>
                      )}
                    </div>

                    <div className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-gray-400" /> Quota Thalibah
                        </span>
                        <span className="text-xs font-semibold">
                          {halaqah.max_students ? Math.max(0, halaqah.max_students - (halaqah.quota_details?.total_used || 0)) : '?'} dari {halaqah.max_students || 20} sisa
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            (halaqah.quota_details?.total_used || 0) >= (halaqah.max_students || 20)
                              ? 'bg-red-500'
                              : (halaqah.max_students || 20) - (halaqah.quota_details?.total_used || 0) <= 3
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, ((halaqah.quota_details?.total_used || 0) / (halaqah.max_students || 20)) * 100)}%` }}
                        ></div>
                      </div>
                      <QuotaDetailsCell halaqah={halaqah} />
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 pt-1">
                      <button
                        onClick={() => setSelectedHalaqah(halaqah)}
                        className="col-span-2 flex items-center justify-center gap-1 p-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-100 active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detail
                      </button>
                      
                      <button
                        onClick={() => setEditingHalaqah(halaqah)}
                        className="flex items-center justify-center p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-100 active:scale-95"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {activeTab === 'tikrar_tahfidz' &&
                        (halaqah._count?.students || 0) === 0 &&
                        (halaqah.quota_details?.total_used || 0) === 0 && (
                        <button
                          onClick={() => handleMoveToPra(halaqah)}
                          disabled={movingToPraId === halaqah.id}
                          className="col-span-2 flex items-center justify-center gap-1 p-2.5 text-xs font-semibold text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 rounded-lg border border-fuchsia-100 disabled:opacity-50"
                          title="Pindah ke Pra Tikrar"
                        >
                          {movingToPraId === halaqah.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <ArrowRightLeft className="w-3.5 h-3.5" />}
                          Pra Tikrar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteHalaqah(halaqah.id)}
                        className="flex items-center justify-center p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-100 active:scale-95"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
            </div>

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

      {showScheduleOverlapModal && (
        <ScheduleOverlapAnalysis
          isOpen={showScheduleOverlapModal}
          onClose={() => setShowScheduleOverlapModal(false)}
          halaqahs={halaqahs}
        />
      )}
    </div>
  );
}
