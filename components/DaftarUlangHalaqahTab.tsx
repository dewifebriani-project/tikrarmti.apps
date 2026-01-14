'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Calendar,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Undo,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  FileText,
  UserPlus
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AddThalibahModal } from './AddThalibahModal';

interface ThalibahInfo {
  id: string;
  submission_id: string;
  full_name: string;
  email: string;
  partner_name?: string;
  partner_type?: string;
  status: 'draft' | 'submitted' | 'approved';
  submitted_at: string;
  confirmed_juz?: string;
  confirmed_time_slot?: string;
  type: 'ujian' | 'tashih' | 'both';
}

interface HalaqahInfo {
  id: string;
  name: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  max_students?: number;
  muallimah_name?: string;
  available_slots?: number;
  is_full?: boolean;
}

interface HalaqahWithThalibah {
  halaqahId: string;
  halaqah: HalaqahInfo | null;
  thalibah: ThalibahInfo[];
  type: 'ujian' | 'tashih' | 'both';
}

type SortField = 'name' | 'thalibah_count' | 'schedule';
type SortOrder = 'asc' | 'desc';

type ThalibahSortField = 'name' | 'juz' | 'partner' | 'status' | 'submitted';
type ThalibahSortOrder = 'asc' | 'desc';

interface DaftarUlangHalaqahTabProps {
  batchId?: string;
}

const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

// Status order for sorting (lower = higher priority)
const STATUS_ORDER: Record<string, number> = {
  submitted: 1,
  draft: 2,
  approved: 3,
};

export function DaftarUlangHalaqahTab({ batchId }: DaftarUlangHalaqahTabProps) {
  console.log('[DaftarUlangHalaqahTab] Component rendered with batchId:', batchId);

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedHalaqah, setExpandedHalaqah] = useState<Set<string>>(new Set());
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Add Thalibah Modal state
  const [showAddThalibahModal, setShowAddThalibahModal] = useState(false);
  const [selectedHalaqahForAdd, setSelectedHalaqahForAdd] = useState<HalaqahInfo | null>(null);
  const [selectedHalaqahType, setSelectedHalaqahType] = useState<'ujian' | 'tashih' | 'both'>('ujian');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [thalibahSortField, setThalibahSortField] = useState<ThalibahSortField>('submitted');
  const [thalibahSortOrder, setThalibahSortOrder] = useState<ThalibahSortOrder>('desc');

  const loadData = async () => {
    console.log('[DaftarUlangHalaqahTab] Loading submissions...');
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (batchId && batchId !== 'all') params.append('batch_id', batchId);
      // Get all submissions without pagination limit
      params.append('limit', '1000');

      const response = await fetch(`/api/admin/daftar-ulang?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('[DaftarUlangHalaqahTab] Failed to load:', result);
        toast.error(result.error || 'Failed to load data');
        return;
      }

      if (result.data) {
        console.log('[DaftarUlangHalaqahTab] Loaded', result.data.length, 'submissions');
        setSubmissions(result.data);
      } else {
        setSubmissions([]);
      }
    } catch (error: any) {
      console.error('[DaftarUlangHalaqahTab] Error:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [batchId, refreshTrigger]);

  // Process submissions to group by halaqah_id
  const processedData = useMemo(() => {
    if (!submissions || !Array.isArray(submissions)) {
      return [];
    }

    console.log('[DaftarUlangHalaqahTab] Processing submissions:', submissions.length);
    console.log('[DaftarUlangHalaqahTab] Submissions by status:', submissions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));

    // Debug: Log raw submissions with approved status
    const approvedSubmissions = submissions.filter(s => s.status === 'approved');
    console.log('[DaftarUlangHalaqahTab] Approved submissions:', approvedSubmissions.length);
    if (approvedSubmissions.length > 0) {
      console.log('[DaftarUlangHalaqahTab] All approved submissions:', approvedSubmissions.map(s => ({
        id: s.id,
        user_id: s.user_id,
        full_name: s.user?.full_name || s.confirmed_full_name,
        status: s.status,
        ujian_halaqah_id: s.ujian_halaqah_id,
        tashih_halaqah_id: s.tashih_halaqah_id,
        has_ujian_halaqah: !!s.ujian_halaqah,
        has_tashih_halaqah: !!s.tashih_halaqah,
        batch_id: s.batch_id,
      })));
    }

    // Map to track halaqah groups by halaqah_id
    const halaqahMap = new Map<string, HalaqahWithThalibah>();

    // First, collect all unique halaqah IDs from submissions
    const allHalaqahIds = new Set<string>();
    submissions.forEach((sub) => {
      if (sub.ujian_halaqah_id) allHalaqahIds.add(sub.ujian_halaqah_id);
      if (sub.tashih_halaqah_id) allHalaqahIds.add(sub.tashih_halaqah_id);
    });

    // Initialize all halaqah with empty thalibah list
    allHalaqahIds.forEach((halaqahId) => {
      const maxStudents = 20; // Default max_students
      halaqahMap.set(halaqahId, {
        halaqahId,
        halaqah: {
          id: halaqahId,
          name: 'Unknown Halaqah',
          max_students: maxStudents,
          available_slots: maxStudents,
          is_full: false
        },
        thalibah: [],
        type: 'ujian' // Will be updated based on actual usage
      });
    });

    // Process submissions and add thalibah to halaqah
    submissions.forEach((sub) => {
      // Process ujian halaqah
      if (sub.ujian_halaqah_id && sub.ujian_halaqah) {
        const halaqahId = sub.ujian_halaqah_id;
        const entry = halaqahMap.get(halaqahId);
        if (entry) {
          // Update halaqah info with actual data
          entry.halaqah = {
            ...sub.ujian_halaqah,
            max_students: sub.ujian_halaqah.max_students || 20,
            available_slots: (sub.ujian_halaqah.max_students || 20) - entry.thalibah.length,
            is_full: false
          };
          entry.type = 'ujian';
        }

        // Check if this thalibah is already in this halaqah (for both types)
        const existing = entry?.thalibah.find(t => t.id === sub.user_id);
        if (existing) {
          // Thalibah already exists (has both ujian and tashih in same halaqah)
          existing.type = 'both';
          if (entry) entry.type = 'both';
        } else if (entry) {
          entry.thalibah.push({
            id: sub.user_id,
            submission_id: sub.id,
            full_name: sub.confirmed_full_name || sub.user?.full_name || '-',
            email: sub.user?.email || '-',
            partner_name: sub.partner_user?.full_name || sub.partner_name || '-',
            partner_type: sub.partner_type || '-',
            status: sub.status,
            submitted_at: sub.submitted_at || sub.created_at,
            confirmed_juz: sub.confirmed_chosen_juz || '-',
            confirmed_time_slot: sub.confirmed_main_time_slot || '-',
            type: 'ujian'
          });
        }
      }

      // Process tashih halaqah (exclude umum)
      if (sub.tashih_halaqah_id && sub.tashih_halaqah && !sub.is_tashih_umum) {
        const halaqahId = sub.tashih_halaqah_id;
        const entry = halaqahMap.get(halaqahId);

        // Check if this thalibah is already in this halaqah (for both types)
        const existing = entry?.thalibah.find(t => t.id === sub.user_id);
        if (existing) {
          // Thalibah already exists (has both ujian and tashih in same halaqah)
          existing.type = 'both';
          if (entry) {
            entry.type = 'both';
            // Update halaqah info with tashih data
            entry.halaqah = {
              ...entry.halaqah,
              ...sub.tashih_halaqah,
              max_students: sub.tashih_halaqah.max_students || entry.halaqah.max_students || 20,
              available_slots: (sub.tashih_halaqah.max_students || entry.halaqah.max_students || 20) - entry.thalibah.length,
              is_full: false
            };
          }
        } else if (entry) {
          // Update halaqah info if this is tashih-only
          if (entry.type === 'ujian') {
            entry.halaqah = {
              ...entry.halaqah,
              ...sub.tashih_halaqah,
              max_students: sub.tashih_halaqah.max_students || entry.halaqah.max_students || 20,
              available_slots: (sub.tashih_halaqah.max_students || entry.halaqah.max_students || 20) - entry.thalibah.length,
              is_full: false
            };
            entry.type = 'both';
          } else {
            entry.halaqah = {
              ...entry.halaqah,
              ...sub.tashih_halaqah,
              max_students: sub.tashih_halaqah.max_students || 20,
              available_slots: (sub.tashih_halaqah.max_students || 20) - entry.thalibah.length,
              is_full: false
            };
            entry.type = 'tashih';
          }
          entry.thalibah.push({
            id: sub.user_id,
            submission_id: sub.id,
            full_name: sub.confirmed_full_name || sub.user?.full_name || '-',
            email: sub.user?.email || '-',
            partner_name: sub.partner_user?.full_name || sub.partner_name || '-',
            partner_type: sub.partner_type || '-',
            status: sub.status,
            submitted_at: sub.submitted_at || sub.created_at,
            confirmed_juz: sub.confirmed_chosen_juz || '-',
            confirmed_time_slot: sub.confirmed_main_time_slot || '-',
            type: 'tashih'
          });
        }
      }
    });

    // Calculate available slots and is_full status
    halaqahMap.forEach((entry) => {
      if (entry.halaqah) {
        entry.halaqah.available_slots = (entry.halaqah.max_students || 20) - entry.thalibah.length;
        entry.halaqah.is_full = entry.halaqah.available_slots <= 0;
      }
    });

    // Convert map to array
    const result: HalaqahWithThalibah[] = [];
    halaqahMap.forEach(entry => result.push(entry));
    return result;
  }, [submissions]);

  // Sort halaqah list
  const sortedHalaqahList = useMemo(() => {
    const sorted = [...processedData].sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          const aName = a.halaqah?.name || '';
          const bName = b.halaqah?.name || '';
          compareValue = aName.localeCompare(bName);
          break;
        case 'thalibah_count':
          compareValue = a.thalibah.length - b.thalibah.length;
          break;
        case 'schedule':
          const aDay = a.halaqah?.day_of_week ?? 99;
          const bDay = b.halaqah?.day_of_week ?? 99;
          if (aDay !== bDay) {
            compareValue = aDay - bDay;
          } else {
            const aTime = a.halaqah?.start_time || '';
            const bTime = b.halaqah?.start_time || '';
            compareValue = aTime.localeCompare(bTime);
          }
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [processedData, sortField, sortOrder]);

  // Sort thalibah within each halaqah
  const halaqahListWithSortedThalibah = useMemo(() => {
    return sortedHalaqahList.map((halaqahData) => {
      const sortedThalibah = [...halaqahData.thalibah].sort((a, b) => {
        let compareValue = 0;

        switch (thalibahSortField) {
          case 'name':
            compareValue = a.full_name.localeCompare(b.full_name);
            break;
          case 'juz':
            const aJuz = a.confirmed_juz || '';
            const bJuz = b.confirmed_juz || '';
            const aNum = parseInt(aJuz.replace(/\D/g, '')) || 0;
            const bNum = parseInt(bJuz.replace(/\D/g, '')) || 0;
            if (aNum !== bNum) {
              compareValue = aNum - bNum;
            } else {
              compareValue = aJuz.localeCompare(bJuz);
            }
            break;
          case 'partner':
            const aPartner = a.partner_name || '';
            const bPartner = b.partner_name || '';
            compareValue = aPartner.localeCompare(bPartner);
            break;
          case 'status':
            const aStatusOrder = STATUS_ORDER[a.status] || 999;
            const bStatusOrder = STATUS_ORDER[b.status] || 999;
            compareValue = aStatusOrder - bStatusOrder;
            break;
          case 'submitted':
            const aDate = new Date(a.submitted_at).getTime();
            const bDate = new Date(b.submitted_at).getTime();
            compareValue = aDate - bDate;
            break;
        }

        return thalibahSortOrder === 'asc' ? compareValue : -compareValue;
      });

      return {
        ...halaqahData,
        thalibah: sortedThalibah,
      };
    });
  }, [sortedHalaqahList, thalibahSortField, thalibahSortOrder]);

  // Statistics
  const halaqahStats = useMemo(() => {
    const totalHalaqah = halaqahListWithSortedThalibah.length;
    const totalThalibah = halaqahListWithSortedThalibah.reduce((sum, h) => sum + h.thalibah.length, 0);

    // Count by type
    let bothCount = 0;
    let ujianCount = 0;
    let tashihCount = 0;

    halaqahListWithSortedThalibah.forEach(h => {
      h.thalibah.forEach(t => {
        if (t.type === 'both') bothCount++;
        else if (t.type === 'ujian') ujianCount++;
        else if (t.type === 'tashih') tashihCount++;
      });
    });

    // Count by Juz
    const juzCount: Record<string, number> = {};
    halaqahListWithSortedThalibah.forEach(h => {
      h.thalibah.forEach(t => {
        const juz = t.confirmed_juz || 'Unknown';
        juzCount[juz] = (juzCount[juz] || 0) + 1;
      });
    });

    // Count by Schedule (day of week)
    const scheduleCount: Record<string, number> = {};
    halaqahListWithSortedThalibah.forEach(h => {
      if (h.halaqah?.day_of_week !== undefined && h.halaqah.day_of_week >= 1) {
        const day = DAY_NAMES[h.halaqah.day_of_week];
        scheduleCount[day] = (scheduleCount[day] || 0) + h.thalibah.length;
      }
    });

    return {
      totalHalaqah,
      totalThalibah,
      bothCount,
      ujianCount,
      tashihCount,
      juzCount,
      scheduleCount,
    };
  }, [halaqahListWithSortedThalibah]);

  // Pagination for halaqah list
  const paginatedHalaqahList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return halaqahListWithSortedThalibah.slice(startIndex, endIndex);
  }, [halaqahListWithSortedThalibah, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(halaqahListWithSortedThalibah.length / itemsPerPage);

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

  const handleThalibahSort = (field: ThalibahSortField) => {
    if (thalibahSortField === field) {
      setThalibahSortOrder(thalibahSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setThalibahSortField(field);
      setThalibahSortOrder('asc');
    }
  };

  const getThalibahSortIcon = (field: ThalibahSortField) => {
    if (thalibahSortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return thalibahSortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const handleRevertToDraft = async (submissionId: string, thalibahName: string) => {
    if (!confirm(`Revert submission for "${thalibahName}" back to draft?\n\nThis will allow them to re-select their halaqah.`)) {
      return;
    }

    setRevertingId(submissionId);
    try {
      const response = await fetch('/api/admin/daftar-ulang/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to revert submission');
      }

      toast.success(result.message || 'Submission reverted to draft successfully');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('[DaftarUlangHalaqahTab] Error reverting submission:', error);
      toast.error(error.message || 'Failed to revert submission');
    } finally {
      setRevertingId(null);
    }
  };

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
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
    };

    const labels: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      approved: 'Approved',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === 'both') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 border border-purple-200 text-purple-900">
          Paket
        </span>
      );
    }
    return (
      <span className="text-xs text-gray-500">
        {type === 'ujian' ? 'Ujian' : 'Tashih'}
      </span>
    );
  };

  const toggleExpand = (halaqahId: string) => {
    const newExpanded = new Set(expandedHalaqah);
    if (newExpanded.has(halaqahId)) {
      newExpanded.delete(halaqahId);
    } else {
      newExpanded.add(halaqahId);
    }
    setExpandedHalaqah(newExpanded);
  };

  const handleAddThalibah = (halaqah: HalaqahInfo, type: 'ujian' | 'tashih' | 'both') => {
    setSelectedHalaqahForAdd(halaqah);
    // For 'both' type, use 'both' as the halaqah type
    setSelectedHalaqahType(type);
    setShowAddThalibahModal(true);
  };

  const handleAddThalibahSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const downloadHalaqahPDF = async (halaqahId: string) => {
    setDownloadingPDF(true);
    try {
      const halaqahData = halaqahListWithSortedThalibah.find(h => h.halaqahId === halaqahId);
      if (!halaqahData) {
        toast.error('Halaqah not found');
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Daftar Thalibah - ${halaqahData.halaqah?.name || 'Halaqah'}`, pageWidth / 2, 20, { align: 'center' });

      // Schedule info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let yPos = 30;

      // Day and time
      if (halaqahData.halaqah?.day_of_week !== undefined && halaqahData.halaqah.day_of_week >= 1) {
        doc.text(`Jadwal: ${DAY_NAMES[halaqahData.halaqah.day_of_week]}, ${halaqahData.halaqah.start_time || ''} - ${halaqahData.halaqah.end_time || ''}`, 14, yPos);
        yPos += 7;
      }

      // Total thalibah
      const maxStudents = halaqahData.halaqah?.max_students || 20;
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Thalibah: ${halaqahData.thalibah.length} / ${maxStudents}`, 14, yPos);
      yPos += 7;

      // Type
      doc.setFont('helvetica', 'normal');
      doc.text(`Tipe: ${halaqahData.type === 'both' ? 'Paket Lengkap' : (halaqahData.type === 'ujian' ? 'Ujian' : 'Tashih')}`, 14, yPos);
      yPos += 7;

      // Table
      const tableData = halaqahData.thalibah.map((t, index) => [
        index + 1,
        t.full_name,
        t.confirmed_juz || '-',
        t.confirmed_time_slot || '-',
        t.type === 'both' ? 'Paket' : (t.type === 'ujian' ? 'Ujian' : 'Tashih'),
        formatDate(t.submitted_at)
      ]);

      autoTable(doc, {
        startY: yPos + 2,
        head: [['No', 'Nama', 'Juz', 'Slot Waktu', 'Tipe', 'Submitted']],
        body: tableData,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 55 },
          2: { cellWidth: 18 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 40 },
        },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(
          `Dicetak pada ${new Date().toLocaleString('id-ID')}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      const fileName = `daftar-thalibah-${halaqahData.halaqah?.name?.replace(/\s+/g, '-') || 'halaqah'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success('PDF berhasil diunduh');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal membuat PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const downloadAllPDF = async () => {
    setDownloadingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Daftar Thalibah per Halaqah', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Halaqah: ${halaqahListWithSortedThalibah.length}`, 14, 30);
      doc.text(`Total Thalibah: ${halaqahListWithSortedThalibah.reduce((sum, h) => sum + h.thalibah.length, 0)}`, 14, 37);

      let yPos = 50;

      for (const halaqahData of halaqahListWithSortedThalibah) {
        if (yPos > pageHeight - 80) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`${halaqahData.halaqah?.name || 'Halaqah'} (${halaqahData.thalibah.length} thalibah)`, 14, yPos);
        yPos += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (halaqahData.halaqah?.day_of_week !== undefined && halaqahData.halaqah.day_of_week >= 1) {
          doc.text(`Jadwal: ${DAY_NAMES[halaqahData.halaqah.day_of_week]}, ${halaqahData.halaqah.start_time || ''} - ${halaqahData.halaqah.end_time || ''}`, 16, yPos);
          yPos += 6;
        }

        const tableData = halaqahData.thalibah.map((t, index) => [
          index + 1,
          t.full_name,
          t.confirmed_juz || '-',
          t.type === 'both' ? 'Paket' : t.type,
        ]);

        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        autoTable(doc, {
          startY: yPos,
          head: [['No', 'Nama', 'Juz', 'Tipe']],
          body: tableData,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: {
            fillColor: [34, 197, 94],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 65 },
            2: { cellWidth: 18 },
            3: { cellWidth: 30 },
          },
          didDrawPage: (data) => {
            yPos = (data.cursor?.y ?? 50) + 10;
          },
        });

        yPos += 10;
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(
          `Dicetak pada ${new Date().toLocaleString('id-ID')}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      const fileName = `daftar-thalibah-all-halaqah-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success('PDF semua halaqah berhasil diunduh');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal membuat PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Daftar Thalibah per Halaqah</h2>
        <div className="flex gap-2">
          <button
            onClick={downloadAllPDF}
            disabled={downloadingPDF || halaqahListWithSortedThalibah.length === 0}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3 h-3" />
            {downloadingPDF ? 'Downloading...' : 'Download All'}
          </button>
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {!loading && halaqahListWithSortedThalibah.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Total Halaqah</p>
            <p className="text-2xl font-bold text-gray-900">{halaqahStats.totalHalaqah}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Total Thalibah</p>
            <p className="text-2xl font-bold text-blue-600">{halaqahStats.totalThalibah}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Tashih & Ujian</p>
            <p className="text-2xl font-bold text-green-600">{halaqahStats.bothCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Hanya Ujian</p>
            <p className="text-2xl font-bold text-purple-600">{halaqahStats.ujianCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Hanya Tashih</p>
            <p className="text-2xl font-bold text-orange-600">{halaqahStats.tashihCount}</p>
          </div>
        </div>
      )}

      {/* Additional Stats */}
      {!loading && halaqahListWithSortedThalibah.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Per Juz */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Per Juz</p>
            <div className="space-y-1">
              {Object.entries(halaqahStats.juzCount)
                .sort(([a], [b]) => {
                  const aNum = parseInt(a.replace(/\D/g, '')) || 999;
                  const bNum = parseInt(b.replace(/\D/g, '')) || 999;
                  return aNum - bNum;
                })
                .map(([juz, count]) => (
                  <div key={juz} className="flex justify-between text-sm">
                    <span className="text-gray-600">{juz}</span>
                    <span className="font-medium">{count} thalibah</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Per Schedule */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Per Jadwal</p>
            <div className="space-y-1">
              {Object.entries(halaqahStats.scheduleCount)
                .sort(([, a], [, b]) => b - a)
                .map(([day, count]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-gray-600">{day}</span>
                    <span className="font-medium">{count} thalibah</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : halaqahListWithSortedThalibah.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {batchId === 'all'
                ? 'Silakan pilih batch tertentu untuk melihat data per halaqah'
                : 'Belum ada data halaqah untuk batch ini'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paginatedHalaqahList.map((item) => {
              const isExpanded = expandedHalaqah.has(item.halaqahId);
              const thalibahCount = item.thalibah.length;

              return (
                <div key={item.halaqahId} className="hover:bg-gray-50">
                  {/* Halaqah Header */}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleExpand(item.halaqahId)}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <div className="flex-1">
                          {/* Title row */}
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.halaqah?.name || 'Unknown Halaqah'}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              thalibahCount >= (item.halaqah?.max_students || 20)
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {thalibahCount} thalibah
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-200 text-gray-700">
                              {item.type === 'both' ? 'Paket Lengkap' : (item.type === 'ujian' ? 'Ujian' : 'Tashih')}
                            </span>
                          </div>

                          {/* Schedule row */}
                          {item.halaqah && (
                            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
                              {item.halaqah.muallimah_name && (
                                <span className="font-medium text-gray-700">Ustadzah {item.halaqah.muallimah_name}</span>
                              )}
                              {item.halaqah.day_of_week !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{DAY_NAMES[item.halaqah.day_of_week]}</span>
                                </div>
                              )}
                              {item.halaqah.start_time && item.halaqah.end_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{item.halaqah.start_time} - {item.halaqah.end_time}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Action Buttons */}
                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddThalibah(item.halaqah!, item.type);
                          }}
                          className="px-3 py-2 border border-green-300 text-green-600 rounded-md text-sm hover:bg-green-50 transition-colors flex items-center gap-1"
                          title="Add Thalibah"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span className="hidden sm:inline">Add</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadHalaqahPDF(item.halaqahId);
                          }}
                          disabled={downloadingPDF}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download as PDF"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Thalibah List (Expanded) */}
                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                onClick={() => handleThalibahSort('name')}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                              >
                                <div className="flex items-center gap-1">
                                  Nama Thalibah
                                  {getThalibahSortIcon('name')}
                                </div>
                              </th>
                              <th
                                onClick={() => handleThalibahSort('juz')}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                              >
                                <div className="flex items-center gap-1">
                                  Juz
                                  {getThalibahSortIcon('juz')}
                                </div>
                              </th>
                              <th
                                onClick={() => handleThalibahSort('partner')}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                              >
                                <div className="flex items-center gap-1">
                                  Partner
                                  {getThalibahSortIcon('partner')}
                                </div>
                              </th>
                              <th
                                onClick={() => handleThalibahSort('status')}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                              >
                                <div className="flex items-center gap-1">
                                  Status
                                  {getThalibahSortIcon('status')}
                                </div>
                              </th>
                              <th
                                onClick={() => handleThalibahSort('submitted')}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                              >
                                <div className="flex items-center gap-1">
                                  Submitted
                                  {getThalibahSortIcon('submitted')}
                                </div>
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {item.thalibah.map((thalibah) => (
                              <tr key={`${thalibah.id}-${thalibah.type}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {thalibah.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500">{thalibah.email}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm">
                                    <p className="font-medium text-gray-900">{thalibah.confirmed_juz || '-'}</p>
                                    <p className="text-xs text-gray-500">{thalibah.confirmed_time_slot || '-'}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm">
                                    <p className="text-gray-900">{thalibah.partner_name || '-'}</p>
                                    <p className="text-xs text-gray-500">{thalibah.partner_type || '-'}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {getStatusBadge(thalibah.status)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-xs text-gray-500">
                                    {formatDate(thalibah.submitted_at)}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {(thalibah.status === 'submitted' || thalibah.status === 'approved') && (
                                    <button
                                      onClick={() => handleRevertToDraft(thalibah.submission_id, thalibah.full_name)}
                                      disabled={revertingId === thalibah.submission_id}
                                      className="text-orange-600 hover:text-orange-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                      title="Revert to draft"
                                    >
                                      {revertingId === thalibah.submission_id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Undo className="w-4 h-4" />
                                          <span>Revert</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && halaqahListWithSortedThalibah.length > 0 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 border-t border-gray-200 rounded-b-lg">
          <div className="text-sm text-gray-700">
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, halaqahListWithSortedThalibah.length)} dari {halaqahListWithSortedThalibah.length} halaqah
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Awal
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            <span className="px-3 py-1 text-sm">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Akhir
            </button>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="ml-4 px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="10">10 per halaman</option>
              <option value="20">20 per halaman</option>
              <option value="50">50 per halaman</option>
              <option value="100">100 per halaman</option>
            </select>
          </div>
        </div>
      )}

      {/* Add Thalibah Modal */}
      {showAddThalibahModal && selectedHalaqahForAdd && (
        <AddThalibahModal
          isOpen={showAddThalibahModal}
          onClose={() => {
            setShowAddThalibahModal(false);
            setSelectedHalaqahForAdd(null);
          }}
          onSuccess={handleAddThalibahSuccess}
          halaqah={selectedHalaqahForAdd}
          batchId={batchId || 'all'}
          halaqahType={selectedHalaqahType}
        />
      )}
    </div>
  );
}
