'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  RefreshCw,
  List,
  FolderTree,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  FileSpreadsheet,
  BookOpen,
  Search,
  X
} from 'lucide-react';
import { DaftarUlangHalaqahTab } from './DaftarUlangHalaqahTab';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type DaftarUlangSubTab = 'submissions' | 'halaqah' | 'per_juz';

type SortField = 'name' | 'juz' | 'halaqah' | 'status' | 'submitted_at';
type SortOrder = 'asc' | 'desc';

interface DaftarUlangSubmission {
  id: string;
  user_id: string;
  batch_id: string;
  registration_id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';

  // Confirmed data
  confirmed_full_name?: string;
  confirmed_chosen_juz?: string;
  confirmed_main_time_slot?: string;
  confirmed_backup_time_slot?: string;

  // Partner
  partner_type?: 'self_match' | 'system_match' | 'family' | 'tarteel';
  partner_user_id?: string;
  partner_name?: string;
  partner_relationship?: string;
  partner_wa_phone?: string;
  partner_notes?: string;

  // Halaqah
  ujian_halaqah_id?: string;
  tashih_halaqah_id?: string;
  is_tashih_umum?: boolean;

  // Akad
  akad_files?: Array<{ url: string; name: string }>;
  akad_submitted_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  reviewed_at?: string;

  // Relations
  user?: {
    id: string;
    full_name: string;
    email: string;
    whatsapp?: string;
  };
  partner_user?: {
    id: string;
    full_name: string;
    email: string;
    whatsapp?: string;
  };
  ujian_halaqah?: {
    id: string;
    name: string;
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
  };
  tashih_halaqah?: {
    id: string;
    name: string;
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
  };
}

interface Batch {
  id: string;
  name: string;
}

interface DaftarUlangTabProps {
  batchId?: string;
}

export function DaftarUlangTab({ batchId: initialBatchId }: DaftarUlangTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<DaftarUlangSubTab>('submissions');
  const [submissions, setSubmissions] = useState<DaftarUlangSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<DaftarUlangSubmission | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sortField, setSortField] = useState<SortField>('submitted_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);

  // Download state
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [allSubmissionsForDownload, setAllSubmissionsForDownload] = useState<any[]>([]);

  // Statistics state
  const [stats, setStats] = useState<{
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
    withHalaqah: number;
    withAkad: number;
    juzCount: Record<string, number>;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Local batch filter state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [localBatchId, setLocalBatchId] = useState<string>(initialBatchId || 'all');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Per Juz state
  const [juzGroups, setJuzGroups] = useState<Record<string, any[]>>({});
  const [juzGroupsLoading, setJuzGroupsLoading] = useState(true);
  const [juzSortField, setJuzSortField] = useState<'name' | 'status' | 'halaqah' | 'partner' | 'submitted_at'>('name');
  const [juzSortOrder, setJuzSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadBatches = async () => {
    try {
      const response = await fetch('/api/batch');
      const result = await response.json();
      if (result.success && result.data) {
        setBatches(result.data);
        // If no initial batchId, set to the latest batch
        if (!initialBatchId && result.data.length > 0) {
          setLocalBatchId(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('[DaftarUlangTab] Error loading batches:', error);
    }
  };

  const loadStats = async () => {
    console.log('[DaftarUlangTab] Loading statistics...');
    setStatsLoading(true);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (localBatchId && localBatchId !== 'all') params.append('batch_id', localBatchId);

      const response = await fetch(`/api/admin/daftar-ulang/stats?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('[DaftarUlangTab] Failed to load stats:', result);
        return;
      }

      if (result.data) {
        console.log('[DaftarUlangTab] Loaded stats:', result.data);
        setStats(result.data);
      }
    } catch (error: any) {
      console.error('[DaftarUlangTab] Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadSubmissions = async () => {
    console.log('[DaftarUlangTab] Loading submissions...');
    setLoading(true);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (localBatchId && localBatchId !== 'all') params.append('batch_id', localBatchId);

      // If searching, load all data. Otherwise use pagination.
      if (searchQuery.trim()) {
        params.append('limit', '10000'); // Load all data for search
      } else {
        params.append('page', currentPage.toString());
        params.append('limit', '50');
      }

      const response = await fetch(`/api/admin/daftar-ulang?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('[DaftarUlangTab] Failed to load submissions:', result);
        toast.error(result.error || 'Failed to load submissions');
        return;
      }

      if (result.data) {
        console.log('[DaftarUlangTab] Loaded', result.data.length, 'submissions');
        setSubmissions(result.data);
        // Only set pagination when not searching
        if (!searchQuery.trim()) {
          setPagination(result.pagination || null);
        } else {
          setPagination(null); // No pagination when searching
        }
      } else {
        setSubmissions([]);
        setPagination(null);
      }
    } catch (error: any) {
      console.error('[DaftarUlangTab] Error loading submissions:', error);
      toast.error('Failed to load submissions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadJuzGroups = async () => {
    console.log('[DaftarUlangTab] Loading juz groups...');
    setJuzGroupsLoading(true);

    try {
      const params = new URLSearchParams();
      if (localBatchId && localBatchId !== 'all') params.append('batch_id', localBatchId);
      params.append('limit', '10000'); // Get all data for grouping

      const response = await fetch(`/api/admin/daftar-ulang?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('[DaftarUlangTab] Failed to load submissions for juz grouping:', result);
        return;
      }

      const allSubmissions = result.data || [];

      // Group by juz
      const groups: Record<string, any[]> = {};
      allSubmissions.forEach((sub: any) => {
        const juz = sub.confirmed_chosen_juz || sub.registration?.chosen_juz || 'Unknown';
        if (!groups[juz]) {
          groups[juz] = [];
        }
        groups[juz].push(sub);
      });

      console.log('[DaftarUlangTab] Loaded juz groups:', Object.keys(groups).length, 'juz');
      setJuzGroups(groups);
    } catch (error: any) {
      console.error('[DaftarUlangTab] Error loading juz groups:', error);
      toast.error('Failed to load juz groups: ' + error.message);
    } finally {
      setJuzGroupsLoading(false);
    }
  };

  // Load all submissions for download (with complete data from pendaftaran_tikrar_tahfidz)
  const loadAllSubmissionsForDownload = async () => {
    console.log('[DaftarUlangTab] Loading all submissions for download...');
    try {
      const params = new URLSearchParams();
      if (localBatchId && localBatchId !== 'all') params.append('batch_id', localBatchId);
      params.append('limit', '10000'); // Get all data

      const response = await fetch(`/api/admin/daftar-ulang?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('[DaftarUlangTab] Failed to load submissions for download:', result);
        toast.error(result.error || 'Failed to load data');
        return [];
      }

      return result.data || [];
    } catch (error: any) {
      console.error('[DaftarUlangTab] Error loading submissions for download:', error);
      toast.error('Failed to load data: ' + error.message);
      return [];
    }
  };

  // Helper function to calculate age from birth date
  const calculateAge = (birthDate: string | undefined) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Helper function to get juz code from confirmed_chosen_juz
  const getJuzCode = (confirmedChosenJuz: string | undefined) => {
    if (!confirmedChosenJuz) return '-';
    // Try to extract code from the juz string (e.g., "1A" -> "1A")
    const match = confirmedChosenJuz.match(/(\d+[A-B]?)/i);
    return match ? match[1].toUpperCase() : confirmedChosenJuz;
  };

  // Download Excel - Filter by approved/submitted status only
  const downloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const data = await loadAllSubmissionsForDownload();

      // Filter only approved or submitted status
      const filteredData = data.filter(
        (item: any) => item.status === 'approved' || item.status === 'submitted'
      );

      if (filteredData.length === 0) {
        toast.error('Tidak ada data dengan status approved/submitted untuk diunduh');
        return;
      }

      // Sort data alphabetically by name
      const sortedData = [...filteredData].sort((a, b) => {
        const aName = a.confirmed_full_name || a.user?.full_name || '';
        const bName = b.confirmed_full_name || b.user?.full_name || '';
        return aName.localeCompare(bName, 'id-ID');
      });

      // Prepare Excel data with complete information
      const excelData = sortedData.map((item, index) => {
        const user = item.user || {};
        const registration = item.registration || {};
        const ujianHalaqah = item.ujian_halaqah || {};
        const tashihHalaqah = item.tashih_halaqah || {};
        const partnerUser = item.partner_user || {};

        // Format time slot for display
        const formatTimeSlot = (slot: string | undefined) => {
          if (!slot) return '-';
          const timeMap: Record<string, string> = {
            '04-06': '04.00 - 06.00',
            '06-09': '06.00 - 09.00',
            '09-12': '09.00 - 12.00',
            '12-15': '12.00 - 15.00',
            '15-18': '15.00 - 18.00',
            '18-21': '18.00 - 21.00',
            '21-24': '21.00 - 24.00'
          };
          return timeMap[slot] || slot;
        };

        // Format halaqah schedule
        const formatHalaqahSchedule = (halaqah: any) => {
          if (!halaqah || !halaqah.name) return '-';
          const days = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
          const day = halaqah.day_of_week !== undefined ? days[halaqah.day_of_week] : '';
          const time = (halaqah.start_time && halaqah.end_time) ? `${halaqah.start_time} - ${halaqah.end_time}` : '';
          return day && time ? `${day}, ${time}` : halaqah.name || '-';
        };

        return {
          'No': index + 1,
          'Nama Lengkap': item.confirmed_full_name || user.full_name || '-',
          'Email': user.email || '-',
          'No. WhatsApp': user.whatsapp || user.phone || '-',
          'Usia': calculateAge(user.tanggal_lahir || registration.birth_date),
          'Juz Code': getJuzCode(item.confirmed_chosen_juz || registration.chosen_juz),
          'Juz Pilihan': item.confirmed_chosen_juz || registration.chosen_juz || '-',
          'Slot Jadwal Utama': formatTimeSlot(item.confirmed_main_time_slot || registration.main_time_slot),
          'Slot Jadwal Cadangan': formatTimeSlot(item.confirmed_backup_time_slot || registration.backup_time_slot),
          'Zona Waktu': user.zona_waktu || '-',
          'Status Daftar Ulang': item.status === 'approved' ? 'Approved' : item.status === 'submitted' ? 'Submitted' : '-',
          'Tanggal Submit': item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-',
          'Halaqah Ujian': ujianHalaqah.name || '-',
          'Jadwal Halaqah Ujian': formatHalaqahSchedule(ujianHalaqah),
          'Halaqah Tashih': item.is_tashih_umum ? 'Umum' : (tashihHalaqah.name || '-'),
          'Jadwal Halaqah Tashih': item.is_tashih_umum ? 'Umum' : formatHalaqahSchedule(tashihHalaqah),
          'Tipe Partner': item.partner_type || '-',
          'Nama Partner': item.partner_type === 'self_match' && partnerUser.full_name
            ? partnerUser.full_name
            : (item.partner_name || '-'),
          'Email Partner': item.partner_type === 'self_match' && partnerUser.email
            ? partnerUser.email
            : '-',
          'No. WA Partner': item.partner_wa_phone || '-',
          'Akad Terupload': item.akad_files && item.akad_files.length > 0 ? 'Ya' : 'Tidak',
          'Tanggal Upload Akad': item.akad_submitted_at ? new Date(item.akad_submitted_at).toLocaleDateString('id-ID') : '-',
        };
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 30 },  // Nama Lengkap
        { wch: 30 },  // Email
        { wch: 15 },  // No. WhatsApp
        { wch: 6 },   // Usia
        { wch: 8 },   // Juz Code
        { wch: 15 },  // Juz Pilihan
        { wch: 20 },  // Slot Jadwal Utama
        { wch: 20 },  // Slot Jadwal Cadangan
        { wch: 12 },  // Zona Waktu
        { wch: 15 },  // Status Daftar Ulang
        { wch: 20 },  // Tanggal Submit
        { wch: 25 },  // Halaqah Ujian
        { wch: 25 },  // Jadwal Halaqah Ujian
        { wch: 25 },  // Halaqah Tashih
        { wch: 25 },  // Jadwal Halaqah Tashih
        { wch: 12 },  // Tipe Partner
        { wch: 30 },  // Nama Partner
        { wch: 30 },  // Email Partner
        { wch: 15 },  // No. WA Partner
        { wch: 12 },  // Akad Terupload
        { wch: 20 },  // Tanggal Upload Akad
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Data Thalibah');

      // Generate filename
      const batchName = batches.find(b => b.id === localBatchId)?.name || 'all-batches';
      const fileName = `daftar-ulang-${batchName}-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download
      XLSX.writeFile(wb, fileName);
      toast.success(`Excel berhasil diunduh (${filteredData.length} thalibah dengan status approved/submitted)`);
    } catch (error) {
      console.error('[DaftarUlangTab] Error downloading Excel:', error);
      toast.error('Gagal mengunduh Excel');
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Download PDF
  const downloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const data = await loadAllSubmissionsForDownload();
      if (data.length === 0) {
        toast.error('Tidak ada data untuk diunduh');
        return;
      }

      // Sort data alphabetically by name
      const sortedData = [...data].sort((a, b) => {
        const aName = a.confirmed_full_name || a.user?.full_name || '';
        const bName = b.confirmed_full_name || b.user?.full_name || '';
        return aName.localeCompare(bName, 'id-ID');
      });

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Data Thalibah Daftar Ulang', pageWidth / 2, 15, { align: 'center' });

      // Batch info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const batchName = batches.find(b => b.id === localBatchId)?.name || 'Semua Batch';
      doc.text(`Batch: ${batchName}`, 14, 23);
      doc.text(`Total: ${sortedData.length} thalibah`, 14, 28);
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 23, { align: 'right' });

      // Table data
      const tableData = sortedData.map((item, index) => {
        const user = item.user || {};
        const registration = item.registration || {};
        const ujianHalaqah = item.ujian_halaqah || {};
        const tashihHalaqah = item.tashih_halaqah || {};
        const tashihName = item.is_tashih_umum ? 'Umum' : (tashihHalaqah.name || '-');

        return [
          index + 1,
          item.confirmed_full_name || user.full_name || '-',
          calculateAge(user.tanggal_lahir || registration.birth_date),
          getJuzCode(item.confirmed_chosen_juz),
          item.confirmed_chosen_juz || registration.chosen_juz || '-',
          ujianHalaqah.name || '-',
          tashihName,
          user.whatsapp || user.phone || '-',
        ];
      });

      // Generate table
      autoTable(doc, {
        startY: 35,
        head: [['No', 'Nama', 'Usia', 'Juz Code', 'Juz', 'Halaqah Ujian', 'Halaqah Tashih', 'WhatsApp']],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 10 },  // No
          1: { cellWidth: 45 },  // Nama
          2: { cellWidth: 10 },  // Usia
          3: { cellWidth: 15 },  // Juz Code
          4: { cellWidth: 20 },  // Juz
          5: { cellWidth: 40 },  // Halaqah Ujian
          6: { cellWidth: 40 },  // Halaqah Tashih
          7: { cellWidth: 35 },  // WhatsApp
        },
        didDrawPage: (data) => {
          // Add page number
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.text(
            `Halaman ${doc.getNumberOfPages()}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        },
      });

      // Generate filename
      const batchNameClean = batchName.replace(/\s+/g, '-');
      const fileName = `daftar-ulang-${batchNameClean}-${new Date().toISOString().split('T')[0]}.pdf`;

      doc.save(fileName);
      toast.success('PDF berhasil diunduh');
    } catch (error) {
      console.error('[DaftarUlangTab] Error downloading PDF:', error);
      toast.error('Gagal mengunduh PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Load batches on mount
  useEffect(() => {
    loadBatches();
  }, []);

  // Load statistics when batch changes or refresh triggers
  useEffect(() => {
    loadStats();
  }, [localBatchId, refreshTrigger]);

  // Load submissions when batch changes, page changes, or refresh triggers
  useEffect(() => {
    if (activeSubTab === 'submissions') {
      loadSubmissions();
    }
  }, [localBatchId, refreshTrigger, currentPage, activeSubTab]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeSubTab === 'submissions') {
        loadSubmissions();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load juz groups when batch changes or refresh triggers
  useEffect(() => {
    if (activeSubTab === 'per_juz') {
      loadJuzGroups();
    }
  }, [localBatchId, refreshTrigger, activeSubTab]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels = {
      draft: 'Draft',
      submitted: 'Submitted',
      approved: 'Approved',
      rejected: 'Rejected',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  // Sort juz submissions
  const sortJuzSubmissions = (submissions: any[], field: typeof juzSortField, order: typeof juzSortOrder) => {
    return [...submissions].sort((a, b) => {
      let compareValue = 0;

      switch (field) {
        case 'name':
          const aName = a.confirmed_full_name || a.user?.full_name || '';
          const bName = b.confirmed_full_name || b.user?.full_name || '';
          compareValue = aName.localeCompare(bName, 'id-ID');
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
        case 'halaqah':
          const aHalaqah = a.ujian_halaqah?.name || a.tashih_halaqah?.name || (a.is_tashih_umum ? 'Umum' : '') || 'zzz';
          const bHalaqah = b.ujian_halaqah?.name || b.tashih_halaqah?.name || (b.is_tashih_umum ? 'Umum' : '') || 'zzz';
          compareValue = aHalaqah.localeCompare(bHalaqah);
          break;
        case 'partner':
          const aPartner = a.partner_name || a.partner_user?.full_name || 'zzz';
          const bPartner = b.partner_name || b.partner_user?.full_name || 'zzz';
          compareValue = aPartner.localeCompare(bPartner);
          break;
        case 'submitted_at':
          const aDate = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
          const bDate = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
          compareValue = aDate - bDate;
          break;
        default:
          compareValue = 0;
      }

      return order === 'asc' ? compareValue : -compareValue;
    });
  };

  const handleJuzSort = (field: typeof juzSortField) => {
    if (juzSortField === field) {
      setJuzSortOrder(juzSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setJuzSortField(field);
      setJuzSortOrder('asc');
    }
  };

  const getJuzSortIcon = (field: typeof juzSortField) => {
    if (juzSortField !== field) return null;
    return juzSortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 inline ml-1" />
    );
  };

  // Sorted submissions for display
  const sortedSubmissions = useMemo(() => {
    const sorted = [...submissions].sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          const aName = a.confirmed_full_name || a.user?.full_name || '';
          const bName = b.confirmed_full_name || b.user?.full_name || '';
          compareValue = aName.localeCompare(bName);
          break;
        case 'juz':
          compareValue = (a.confirmed_chosen_juz || '').localeCompare(b.confirmed_chosen_juz || '');
          break;
        case 'halaqah':
          const aHalaqah = a.ujian_halaqah?.name || a.tashih_halaqah?.name || '';
          const bHalaqah = b.ujian_halaqah?.name || b.tashih_halaqah?.name || '';
          compareValue = aHalaqah.localeCompare(bHalaqah);
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
        case 'submitted_at':
          const aDate = new Date(a.submitted_at || a.created_at).getTime();
          const bDate = new Date(b.submitted_at || b.created_at).getTime();
          compareValue = aDate - bDate;
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [submissions, sortField, sortOrder]);

  // Filtered submissions based on search query
  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedSubmissions;
    }

    const query = searchQuery.toLowerCase();
    return sortedSubmissions.filter((submission) => {
      const name = (submission.confirmed_full_name || submission.user?.full_name || '').toLowerCase();
      const email = (submission.user?.email || '').toLowerCase();
      const whatsapp = (submission.user?.whatsapp || '').toLowerCase();

      return name.includes(query) || email.includes(query) || whatsapp.includes(query);
    });
  }, [sortedSubmissions, searchQuery]);

  // Statistics for submissions - use API stats for aggregate data
  const submissionStats = useMemo(() => {
    if (stats) {
      return {
        ...stats,
        showing: filteredSubmissions.length
      };
    }

    // Fallback to current page data if stats not loaded yet
    return {
      total: pagination?.total ?? submissions.length,
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      withHalaqah: 0,
      withAkad: 0,
      juzCount: {},
      showing: filteredSubmissions.length
    };
  }, [stats, submissions, pagination, filteredSubmissions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const getPartnerLabel = (submission: DaftarUlangSubmission) => {
    if (submission.partner_type === 'self_match' && submission.partner_user) {
      return submission.partner_user.full_name || submission.partner_user_id || '-';
    }
    if (submission.partner_type === 'family' || submission.partner_type === 'tarteel') {
      return submission.partner_name || '-';
    }
    if (submission.partner_type === 'system_match') {
      return 'System Match';
    }
    return '-';
  };

  const getWhatsAppButton = (phoneNumber?: string, name?: string) => {
    if (!phoneNumber) return null;

    // Clean phone number: remove +62, spaces, dashes, parentheses
    let cleanPhone = phoneNumber.replace(/\D/g, '');

    // Convert to international format if starts with 0
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const displayName = name || 'Thalibah';
    const message = `Assalamu'alaikum ${displayName},\n\nIni adalah pesan dari admin Markaz Tikrar Indonesia terkait pendaftaran ulang Program Tikrar Tahfidz MTI.\n\nJazakillahu khairan`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors"
        title={`WhatsApp ${phoneNumber}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        Chat
      </a>
    );
  };

  const handleResetHalaqah = async (submissionId: string) => {
    if (!confirm('Apakah Anda yakin ingin mereset pilihan halaqah untuk thalibah ini? Data halaqah akan dihapus tetapi akad dan partner akan tetap tersimpan.')) {
      return;
    }

    setResettingId(submissionId);
    try {
      const response = await fetch(`/api/admin/daftar-ulang/${submissionId}/reset-halaqah`, {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset halaqah');
      }

      toast.success('Halaqah berhasil direset');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('[DaftarUlangTab] Error resetting halaqah:', error);
      toast.error('Gagal mereset halaqah: ' + error.message);
    } finally {
      setResettingId(null);
    }
  };


  return (
    <div className="space-y-4">
      {/* Header & Sub-tabs */}
      <div className="space-y-4">
        {/* Batch Filter & Search */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
          <label className="text-sm font-medium text-gray-700">Filter by Batch:</label>
          <select
            value={localBatchId}
            onChange={(e) => {
              setLocalBatchId(e.target.value);
              setCurrentPage(1); // Reset to page 1 when batch changes
              setSearchQuery(''); // Clear search when batch changes
            }}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Batches</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
          {localBatchId !== 'all' && (
            <span className="text-sm text-gray-500">
              Showing data for: {batches.find(b => b.id === localBatchId)?.name}
            </span>
          )}

          {/* Search Input - Only show on submissions tab */}
          {activeSubTab === 'submissions' && (
            <div className="ml-auto relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to page 1 when search changes
                }}
                placeholder="Cari nama, email, atau WhatsApp..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Daftar Ulang</h2>
          <div className="flex gap-2">
            {activeSubTab === 'submissions' && (
              <>
                <button
                  onClick={downloadExcel}
                  disabled={downloadingExcel}
                  className="px-3 py-2 border border-green-600 text-green-600 rounded-md text-sm hover:bg-green-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download Excel"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  {downloadingExcel ? 'Downloading...' : 'Excel'}
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={downloadingPDF}
                  className="px-3 py-2 border border-red-600 text-red-600 rounded-md text-sm hover:bg-red-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download PDF"
                >
                  <Download className="w-3 h-3" />
                  {downloadingPDF ? 'Downloading...' : 'PDF'}
                </button>
              </>
            )}
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <nav className="border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveSubTab('submissions')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeSubTab === 'submissions'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
              Submissions
            </button>
            <button
              onClick={() => setActiveSubTab('halaqah')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeSubTab === 'halaqah'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              Per Halaqah
            </button>
            <button
              onClick={() => setActiveSubTab('per_juz')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeSubTab === 'per_juz'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Per Juz
            </button>
          </div>
        </nav>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'halaqah' ? (
        <DaftarUlangHalaqahTab batchId={localBatchId} />
      ) : activeSubTab === 'per_juz' ? (
        <>
          {/* Per Juz View */}
          {juzGroupsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : Object.keys(juzGroups).length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada data per juz</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(juzGroups)
                .sort(([a], [b]) => {
                  const aNum = parseInt(a.replace(/\D/g, '')) || 999;
                  const bNum = parseInt(b.replace(/\D/g, '')) || 999;
                  return aNum - bNum;
                })
                .map(([juz, submissions]) => {
                  const draftCount = submissions.filter((s: any) => s.status === 'draft').length;
                  const submittedCount = submissions.filter((s: any) => s.status === 'submitted').length;
                  const approvedCount = submissions.filter((s: any) => s.status === 'approved').length;
                  const rejectedCount = submissions.filter((s: any) => s.status === 'rejected').length;
                  const withHalaqah = submissions.filter((s: any) => s.ujian_halaqah_id || s.tashih_halaqah_id).length;

                  return (
                    <div key={juz} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      {/* Juz Header */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{juz}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">Total: {submissions.length}</span>
                            <span className="text-gray-400">|</span>
                            <span className="text-blue-600">Submitted: {submittedCount}</span>
                            <span className="text-green-600">Approved: {approvedCount}</span>
                            <span className="text-purple-600">Dengan Halaqah: {withHalaqah}</span>
                          </div>
                        </div>
                      </div>

                      {/* Submissions Table for this Juz */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleJuzSort('name')}
                              >
                                <div className="flex items-center gap-1">
                                  Nama
                                  {getJuzSortIcon('name')}
                                </div>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WhatsApp</th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleJuzSort('status')}
                              >
                                <div className="flex items-center gap-1">
                                  Status
                                  {getJuzSortIcon('status')}
                                </div>
                              </th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleJuzSort('halaqah')}
                              >
                                <div className="flex items-center gap-1">
                                  Halaqah
                                  {getJuzSortIcon('halaqah')}
                                </div>
                              </th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleJuzSort('partner')}
                              >
                                <div className="flex items-center gap-1">
                                  Partner
                                  {getJuzSortIcon('partner')}
                                </div>
                              </th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleJuzSort('submitted_at')}
                              >
                                <div className="flex items-center gap-1">
                                  Submit Date
                                  {getJuzSortIcon('submitted_at')}
                                </div>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {sortJuzSubmissions(submissions, juzSortField, juzSortOrder).map((submission: any) => {
                              const user = submission.user || {};
                              const ujianHalaqah = submission.ujian_halaqah || {};
                              const tashihHalaqah = submission.tashih_halaqah || {};
                              const whatsapp = user.whatsapp || user.phone || '-';

                              return (
                                <tr key={submission.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {submission.confirmed_full_name || user.full_name || '-'}
                                    </div>
                                    <div className="text-xs text-gray-500">{user.email || '-'}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {whatsapp !== '-' ? (
                                      <a
                                        href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors"
                                        title={`WhatsApp ${whatsapp}`}
                                      >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                        </svg>
                                        {whatsapp}
                                      </a>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {getStatusBadge(submission.status)}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="space-y-1">
                                      {ujianHalaqah.name && (
                                        <div className="text-gray-900">
                                          <span className="text-xs text-gray-500">Ujian:</span> {ujianHalaqah.name}
                                        </div>
                                      )}
                                      {tashihHalaqah.name && (
                                        <div className="text-gray-900">
                                          <span className="text-xs text-gray-500">Tashih:</span> {tashihHalaqah.name}
                                        </div>
                                      )}
                                      {submission.is_tashih_umum && (
                                        <div className="text-gray-900">
                                          <span className="text-xs text-gray-500">Tashih:</span> Umum
                                        </div>
                                      )}
                                      {!ujianHalaqah.name && !tashihHalaqah.name && !submission.is_tashih_umum && (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {submission.partner_name || submission.partner_user?.full_name || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {formatDate(submission.submitted_at || '')}
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => setSelectedSubmission(submission)}
                                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Total</p>
              <p className="text-2xl font-bold text-gray-900">{statsLoading ? '-' : submissionStats.total}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Draft</p>
              <p className="text-2xl font-bold text-gray-600">{statsLoading ? '-' : submissionStats.draft}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Submitted</p>
              <p className="text-2xl font-bold text-blue-600">{statsLoading ? '-' : submissionStats.submitted}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Approved</p>
              <p className="text-2xl font-bold text-green-600">{statsLoading ? '-' : submissionStats.approved}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{statsLoading ? '-' : submissionStats.rejected}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Dengan Halaqah</p>
              <p className="text-2xl font-bold text-purple-600">{statsLoading ? '-' : submissionStats.withHalaqah}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Dengan Akad</p>
              <p className="text-2xl font-bold text-orange-600">{statsLoading ? '-' : submissionStats.withAkad}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 col-span-2 md:col-span-1">
              <p className="text-xs text-gray-500 uppercase mb-1">Per Juz</p>
              <div className="text-xs space-y-1">
                {statsLoading ? (
                  <p className="text-gray-400">Loading...</p>
                ) : Object.keys(submissionStats.juzCount).length > 0 ? (
                  Object.entries(submissionStats.juzCount).sort(([a], [b]) => a.localeCompare(b)).map(([juz, count]) => (
                    <div key={juz} className="flex justify-between">
                      <span className="text-gray-600">{juz}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No data</p>
                )}
              </div>
            </div>
          </div>

          {/* Submissions List View */}
          <div className="bg-white border border-gray-200 rounded-lg">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? 'Tidak ada submission yang cocok dengan pencarian' : 'No submissions found'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Thalibah
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('halaqah')}
                  >
                    <div className="flex items-center gap-1">
                      Halaqah
                      {getSortIcon('halaqah')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akad Files
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('submitted_at')}
                  >
                    <div className="flex items-center gap-1">
                      Submitted
                      {getSortIcon('submitted_at')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {submission.confirmed_full_name || submission.user?.full_name || '-'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {submission.confirmed_chosen_juz || '-'} | {submission.confirmed_main_time_slot || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {getPartnerLabel(submission)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {submission.partner_type || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-900">
                        <div>Ujian: {submission.ujian_halaqah?.name || (submission.is_tashih_umum ? '-' : 'Not selected')}</div>
                        <div>Tashih: {submission.is_tashih_umum ? 'Umum' : (submission.tashih_halaqah?.name || 'Not selected')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {submission.akad_files && submission.akad_files.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {submission.akad_files.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <FileText className="w-3 h-3" />
                              {file.name}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No files</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500">
                        {formatDate(submission.submitted_at || submission.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getWhatsAppButton(
                        submission.user?.whatsapp,
                        submission.confirmed_full_name || submission.user?.full_name
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {submission.status === 'draft' && (submission.ujian_halaqah_id || submission.tashih_halaqah_id) && (
                          <button
                            onClick={() => handleResetHalaqah(submission.id)}
                            disabled={resettingId === submission.id}
                            className="text-orange-600 hover:text-orange-800 text-sm disabled:opacity-50"
                            title="Reset halaqah selection"
                          >
                            {resettingId === submission.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>

              {/* Pagination */}
              {!searchQuery && pagination && pagination.totalPages > 1 ? (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Menampilkan {submissionStats.showing} dari {pagination.total} submissions
                    (Halaman {currentPage} dari {pagination.totalPages})
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Pertama
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Halaman {currentPage} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(pagination.totalPages)}
                      disabled={currentPage === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Terakhir
                    </button>
                  </div>
                </div>
              ) : searchQuery && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Menampilkan {filteredSubmissions.length} hasil pencarian dari seluruh data
                  </div>
                </div>
              )}
              </>
            )}
          </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-900">Submission Details</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Thalibah Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Thalibah Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium">{selectedSubmission.confirmed_full_name || selectedSubmission.user?.full_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm">{selectedSubmission.user?.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Chosen Juz</p>
                      <p className="text-sm font-medium">{selectedSubmission.confirmed_chosen_juz || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Time Slot</p>
                      <p className="text-sm">{selectedSubmission.confirmed_main_time_slot || '-'} {selectedSubmission.confirmed_backup_time_slot ? `(${selectedSubmission.confirmed_backup_time_slot})` : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partner Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Partner Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Partner Type</p>
                      <p className="text-sm font-medium">{selectedSubmission.partner_type || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Partner Name</p>
                      <p className="text-sm">
                        {selectedSubmission.partner_type === 'self_match' && selectedSubmission.partner_user
                          ? selectedSubmission.partner_user.full_name
                          : selectedSubmission.partner_name || '-'}
                      </p>
                    </div>
                    {selectedSubmission.partner_relationship && (
                      <div>
                        <p className="text-xs text-gray-500">Relationship</p>
                        <p className="text-sm">{selectedSubmission.partner_relationship}</p>
                      </div>
                    )}
                    {selectedSubmission.partner_wa_phone && (
                      <div>
                        <p className="text-xs text-gray-500">WhatsApp</p>
                        <p className="text-sm">{selectedSubmission.partner_wa_phone}</p>
                      </div>
                    )}
                  </div>
                  {selectedSubmission.partner_notes && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Notes</p>
                      <p className="text-sm">{selectedSubmission.partner_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Halaqah Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Halaqah Selection</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Ujian Halaqah</p>
                    <p className="text-sm font-medium">
                      {selectedSubmission.ujian_halaqah?.name || (selectedSubmission.is_tashih_umum ? '-' : 'Not selected')}
                    </p>
                    {selectedSubmission.ujian_halaqah && (
                      <p className="text-xs text-gray-500">
                        {selectedSubmission.ujian_halaqah.day_of_week !== undefined && `Day ${selectedSubmission.ujian_halaqah.day_of_week}, `}
                        {selectedSubmission.ujian_halaqah.start_time} - {selectedSubmission.ujian_halaqah.end_time}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tashih Halaqah</p>
                    <p className="text-sm font-medium">
                      {selectedSubmission.is_tashih_umum
                        ? 'Kelas Tashih Umum'
                        : (selectedSubmission.tashih_halaqah?.name || 'Not selected')}
                    </p>
                    {selectedSubmission.tashih_halaqah && (
                      <p className="text-xs text-gray-500">
                        {selectedSubmission.tashih_halaqah.day_of_week !== undefined && `Day ${selectedSubmission.tashih_halaqah.day_of_week}, `}
                        {selectedSubmission.tashih_halaqah.start_time} - {selectedSubmission.tashih_halaqah.end_time}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Akad Files */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Akad Files</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedSubmission.akad_files && selectedSubmission.akad_files.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSubmission.akad_files.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-white rounded border hover:border-blue-300 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm flex-1">{file.name}</span>
                          <Download className="w-4 h-4 text-gray-400" />
                        </a>
                      ))}
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted: {formatDate(selectedSubmission.akad_submitted_at || '')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No files uploaded</p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Status & Timestamps</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedSubmission.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p>{formatDate(selectedSubmission.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Updated</p>
                      <p>{formatDate(selectedSubmission.updated_at)}</p>
                    </div>
                    {selectedSubmission.submitted_at && (
                      <div>
                        <p className="text-gray-500">Submitted</p>
                        <p>{formatDate(selectedSubmission.submitted_at)}</p>
                      </div>
                    )}
                    {selectedSubmission.reviewed_at && (
                      <div>
                        <p className="text-gray-500">Reviewed</p>
                        <p>{formatDate(selectedSubmission.reviewed_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
