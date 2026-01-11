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
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  muallimah_id?: string;
  muallimah_name?: string;
  max_students?: number;
  total_current_students?: number;
  available_slots?: number;
  is_full?: boolean;
}

interface HalaqahWithThalibah {
  halaqah: HalaqahInfo;
  thalibah: ThalibahInfo[];
}

type SortField = 'name' | 'thalibah_count' | 'muallimah' | 'schedule';
type SortOrder = 'asc' | 'desc';

type ThalibahSortField = 'name' | 'juz' | 'partner' | 'type' | 'status' | 'submitted';
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

// Type order for sorting (lower = higher priority)
const TYPE_ORDER: Record<string, number> = {
  both: 1,
  ujian: 2,
  tashih: 3,
};

export function DaftarUlangHalaqahTab({ batchId }: DaftarUlangHalaqahTabProps) {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedHalaqah, setExpandedHalaqah] = useState<Set<string>>(new Set());
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [thalibahSortField, setThalibahSortField] = useState<ThalibahSortField>('submitted');
  const [thalibahSortOrder, setThalibahSortOrder] = useState<ThalibahSortOrder>('desc');

  const loadData = async () => {
    console.log('[DaftarUlangHalaqahTab] Loading halaqah data...');
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (batchId) params.append('batch_id', batchId);

      const response = await fetch(`/api/admin/daftar-ulang/halaqah?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('[DaftarUlangHalaqahTab] Failed to load:', result);
        toast.error(result.error || 'Failed to load halaqah data');
        return;
      }

      if (result.data) {
        console.log('[DaftarUlangHalaqahTab] Loaded', result.data.length, 'halaqah entries');
        setRawData(result.data);
      } else {
        setRawData([]);
      }
    } catch (error: any) {
      console.error('[DaftarUlangHalaqahTab] Error:', error);
      toast.error('Failed to load halaqah data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [batchId, refreshTrigger]);

  // Process raw data to combine ujian and tashih for same halaqah
  const processedData = useMemo(() => {
    // Guard against undefined or null rawData
    if (!rawData || !Array.isArray(rawData)) {
      return [];
    }

    // Group by halaqah ID
    const halaqahMap = new Map<string, HalaqahWithThalibah>();

    rawData.forEach((item) => {
      // Guard against malformed items
      if (!item || !item.halaqah || !item.halaqah.id) {
        console.warn('[DaftarUlangHalaqahTab] Invalid item:', item);
        return;
      }

      const halaqahId = item.halaqah.id;
      const type = item.type;

      if (!halaqahMap.has(halaqahId)) {
        halaqahMap.set(halaqahId, {
          halaqah: item.halaqah,
          thalibah: []
        });
      }

      // Guard against missing thalibah array
      if (!item.thalibah || !Array.isArray(item.thalibah)) {
        return;
      }

      // Add thalibah with type info
      const thalibahWithType = item.thalibah.map((t: any) => ({
        ...t,
        type: type,
        submission_id: t.submission_id || t.id // Use submission_id if available, else id
      }));

      thalibahWithType.forEach((t: ThalibahInfo) => {
        // Check if this thalibah is already in the list (could be both ujian and tashih)
        const existing = halaqahMap.get(halaqahId)!.thalibah.find(
          (x) => x.id === t.id
        );

        if (existing) {
          // If already exists, mark as 'both'
          existing.type = 'both';
        } else {
          halaqahMap.get(halaqahId)!.thalibah.push(t);
        }
      });
    });

    return Array.from(halaqahMap.values());
  }, [rawData]);

  // Sort halaqah list
  const sortedHalaqahList = useMemo(() => {
    const sorted = [...processedData].sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          compareValue = a.halaqah.name.localeCompare(b.halaqah.name);
          break;
        case 'thalibah_count':
          compareValue = a.thalibah.length - b.thalibah.length;
          break;
        case 'muallimah':
          const aMuallimah = a.halaqah.muallimah_name || '';
          const bMuallimah = b.halaqah.muallimah_name || '';
          compareValue = aMuallimah.localeCompare(bMuallimah);
          break;
        case 'schedule':
          // Sort by day of week, then by time
          const aDay = a.halaqah.day_of_week ?? 99;
          const bDay = b.halaqah.day_of_week ?? 99;
          if (aDay !== bDay) {
            compareValue = aDay - bDay;
          } else {
            compareValue = (a.halaqah.start_time || '').localeCompare(b.halaqah.start_time || '');
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
          case 'type':
            const aTypeOrder = TYPE_ORDER[a.type] || 999;
            const bTypeOrder = TYPE_ORDER[b.type] || 999;
            compareValue = aTypeOrder - bTypeOrder;
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

  // Statistics for halaqah
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

    // Count by Muallimah
    const muallimahCount: Record<string, number> = {};
    halaqahListWithSortedThalibah.forEach(h => {
      if (h.halaqah.muallimah_name) {
        muallimahCount[h.halaqah.muallimah_name] = (muallimahCount[h.halaqah.muallimah_name] || 0) + h.thalibah.length;
      }
    });

    // Count by Schedule (day of week)
    const DAY_NAMES = ['', 'Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const scheduleCount: Record<string, number> = {};
    halaqahListWithSortedThalibah.forEach(h => {
      if (h.halaqah.day_of_week !== undefined && h.halaqah.day_of_week >= 1) {
        const day = DAY_NAMES[h.halaqah.day_of_week];
        scheduleCount[day] = (scheduleCount[day] || 0) + h.thalibah.length;
      }
    });

    // Full halaqah count
    const fullHalaqah = halaqahListWithSortedThalibah.filter(h => h.halaqah.is_full).length;

    return {
      totalHalaqah,
      totalThalibah,
      bothCount,
      ujianCount,
      tashihCount,
      juzCount,
      muallimahCount,
      scheduleCount,
      fullHalaqah
    };
  }, [halaqahListWithSortedThalibah]);

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

  const downloadHalaqahPDF = async (halaqahId: string) => {
    setDownloadingPDF(true);
    try {
      const halaqahData = halaqahListWithSortedThalibah.find(h => h.halaqah.id === halaqahId);
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
      doc.text(`Daftar Thalibah - ${halaqahData.halaqah.name}`, pageWidth / 2, 20, { align: 'center' });

      // Schedule info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const scheduleY = 30;
      let yPos = scheduleY;

      // Hari - only show if day_of_week exists
      if (halaqahData.halaqah.day_of_week !== undefined && halaqahData.halaqah.day_of_week >= 1) {
        doc.text(`Jadwal: ${DAY_NAMES[halaqahData.halaqah.day_of_week]}, ${halaqahData.halaqah.start_time || ''} - ${halaqahData.halaqah.end_time || ''}`, 14, yPos);
        yPos += 7;
      } else if (halaqahData.halaqah.start_time && halaqahData.halaqah.end_time) {
        // Fallback if only time is available
        doc.text(`Jadwal: ${halaqahData.halaqah.start_time} - ${halaqahData.halaqah.end_time}`, 14, yPos);
        yPos += 7;
      }

      // Muallimah - add "Ustadzah" prefix
      if (halaqahData.halaqah.muallimah_name) {
        doc.text(`Muallimah: Ustadzah ${halaqahData.halaqah.muallimah_name}`, 14, yPos);
        yPos += 7;
      }

      // Max students and quota info
      const maxStudents = halaqahData.halaqah.max_students || 20;
      const availableSlots = halaqahData.halaqah.available_slots ?? (maxStudents - halaqahData.thalibah.length);
      const isFull = halaqahData.halaqah.is_full ?? availableSlots <= 0;

      doc.setFont('helvetica', 'bold');
      doc.text(`Total Thalibah: ${halaqahData.thalibah.length} / ${maxStudents}`, 14, yPos);
      yPos += 7;

      // Quota status with color indicator
      doc.setFont('helvetica', 'normal');
      if (isFull) {
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`Status: PENUH`, 14, yPos);
      } else if (availableSlots <= 3) {
        doc.setTextColor(251, 146, 60); // Orange
        doc.text(`Sisa Kuota: ${availableSlots} slot`, 14, yPos);
      } else {
        doc.setTextColor(34, 197, 94); // Green
        doc.text(`Sisa Kuota: ${availableSlots} slot`, 14, yPos);
      }
      doc.setTextColor(0, 0, 0); // Reset to black
      yPos += 7;

      // Table - removed Partner columns, changed "Paket" to "Tashih & Ujian", removed Status column
      const tableData = halaqahData.thalibah.map((t, index) => [
        index + 1,
        t.full_name,
        t.confirmed_juz || '-',
        t.confirmed_time_slot || '-',
        t.type === 'both' ? 'Tashih & Ujian' : (t.type === 'ujian' ? 'Ujian' : 'Tashih'),
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
          0: { cellWidth: 10 },  // No
          1: { cellWidth: 55 }, // Nama
          2: { cellWidth: 18 }, // Juz
          3: { cellWidth: 30 }, // Slot Waktu
          4: { cellWidth: 35 }, // Tipe
          5: { cellWidth: 40 }, // Submitted
        },
      });

      // Footer with timestamp
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
        doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      }

      // Save PDF
      const fileName = `daftar-thalibah-${halaqahData.halaqah.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
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

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Daftar Thalibah per Halaqah', pageWidth / 2, 20, { align: 'center' });

      // Summary
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Halaqah: ${halaqahListWithSortedThalibah.length}`, 14, 30);
      doc.text(`Total Thalibah: ${halaqahListWithSortedThalibah.reduce((sum, h) => sum + h.thalibah.length, 0)}`, 14, 37);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 44);

      let yPos = 55;

      // Generate table for each halaqah
      for (const halaqahData of halaqahListWithSortedThalibah) {
        // Check if we need a new page
        if (yPos > pageHeight - 100) {
          doc.addPage();
          yPos = 20;
        }

        // Halaqah header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`${halaqahData.halaqah.name} (${halaqahData.thalibah.length} thalibah)`, 14, yPos);
        yPos += 7;

        // Schedule info - combined format
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        // Jadwal - only show if day_of_week exists
        if (halaqahData.halaqah.day_of_week !== undefined && halaqahData.halaqah.day_of_week >= 1) {
          doc.text(`Jadwal: ${DAY_NAMES[halaqahData.halaqah.day_of_week]}, ${halaqahData.halaqah.start_time || ''} - ${halaqahData.halaqah.end_time || ''}`, 16, yPos);
          yPos += 6;
        } else if (halaqahData.halaqah.start_time && halaqahData.halaqah.end_time) {
          doc.text(`Jadwal: ${halaqahData.halaqah.start_time} - ${halaqahData.halaqah.end_time}`, 16, yPos);
          yPos += 6;
        }

        // Muallimah - add "Ustadzah" prefix
        if (halaqahData.halaqah.muallimah_name) {
          doc.text(`Muallimah: Ustadzah ${halaqahData.halaqah.muallimah_name}`, 16, yPos);
          yPos += 6;
        }

        // Max students and quota info
        const maxStudents = halaqahData.halaqah.max_students || 20;
        const availableSlots = halaqahData.halaqah.available_slots ?? (maxStudents - halaqahData.thalibah.length);
        const isFull = halaqahData.halaqah.is_full ?? availableSlots <= 0;

        doc.setFont('helvetica', 'bold');
        doc.text(`Total: ${halaqahData.thalibah.length} / ${maxStudents}`, 16, yPos);
        yPos += 6;

        // Quota status with color indicator
        doc.setFont('helvetica', 'normal');
        if (isFull) {
          doc.setTextColor(220, 38, 38); // Red
          doc.text(`Status: PENUH`, 16, yPos);
        } else if (availableSlots <= 3) {
          doc.setTextColor(251, 146, 60); // Orange
          doc.text(`Sisa: ${availableSlots} slot`, 16, yPos);
        } else {
          doc.setTextColor(34, 197, 94); // Green
          doc.text(`Sisa: ${availableSlots} slot`, 16, yPos);
        }
        doc.setTextColor(0, 0, 0); // Reset to black
        yPos += 6;

        // Check if we need a new page before table
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        // Table data - removed Partner column, changed "Paket" to "Tashih & Ujian", removed Status column
        const tableData = halaqahData.thalibah.map((t, index) => [
          index + 1,
          t.full_name,
          t.confirmed_juz || '-',
          t.type === 'both' ? 'Tashih & Ujian' : (t.type === 'ujian' ? 'Ujian' : 'Tashih'),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['No', 'Nama', 'Juz', 'Tipe']],
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
            0: { cellWidth: 10 },
            1: { cellWidth: 65 },
            2: { cellWidth: 18 },
            3: { cellWidth: 30 },
          },
          didDrawPage: (data) => {
            yPos = (data.cursor?.y ?? 60) + 10;
          },
        });

        // Add spacing between halaqah
        yPos += 10;
      }

      // Footer with timestamp
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
        doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      }

      // Save PDF
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

  const downloadHalaqahAsImage = async (halaqahId: string) => {
    setDownloadingPDF(true);
    try {
      const halaqahData = halaqahListWithSortedThalibah.find(h => h.halaqah.id === halaqahId);
      if (!halaqahData) {
        toast.error('Halaqah not found');
        return;
      }

      // Create a temporary canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Failed to create canvas');
        return;
      }

      // Set canvas dimensions (higher quality)
      const width = 1200;
      const height = Math.max(800, 200 + halaqahData.thalibah.length * 50);
      canvas.width = width;
      canvas.height = height;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Header section
      ctx.fillStyle = '#10b981'; // Green color
      ctx.fillRect(20, 20, width - 40, 80);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Daftar Thalibah - ${halaqahData.halaqah.name}`, width / 2, 50);

      // Subtitle
      ctx.font = '14px Arial';
      ctx.fillText(`${halaqahData.thalibah.length} Thalibah`, width / 2, 80);

      let yPos = 130;

      // Muallimah info
      if (halaqahData.halaqah.muallimah_name) {
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Ustadzah: ${halaqahData.halaqah.muallimah_name}`, 40, yPos);
        yPos += 30;
      }

      // Schedule info
      ctx.font = '14px Arial';
      ctx.fillStyle = '#4b5563';
      if (halaqahData.halaqah.day_of_week !== undefined && halaqahData.halaqah.day_of_week >= 1) {
        ctx.fillText(`Jadwal: ${DAY_NAMES[halaqahData.halaqah.day_of_week]}, ${halaqahData.halaqah.start_time || ''} - ${halaqahData.halaqah.end_time || ''}`, 40, yPos);
        yPos += 25;
      }

      // Quota info
      const maxStudents = halaqahData.halaqah.max_students || 20;
      const availableSlots = halaqahData.halaqah.available_slots ?? (maxStudents - halaqahData.thalibah.length);
      const isFull = halaqahData.halaqah.is_full ?? availableSlots <= 0;

      ctx.fillStyle = isFull ? '#dc2626' : (availableSlots <= 3 ? '#f97316' : '#10b981');
      ctx.fillText(`Total: ${halaqahData.thalibah.length} / ${maxStudents} ${isFull ? '(PENUH)' : `(Tersedia: ${availableSlots})`}`, 40, yPos);
      yPos += 40;

      // Table header
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(40, yPos, width - 80, 40);
      yPos += 25;

      ctx.fillStyle = '#374151';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('No', 60, yPos);
      ctx.fillText('Nama', 150, yPos);
      ctx.fillText('Juz', 550, yPos);
      ctx.fillText('Tipe', 700, yPos);
      ctx.fillText('Partner', 850, yPos);
      yPos += 30;

      // Table rows
      ctx.font = '13px Arial';
      halaqahData.thalibah.forEach((t, index) => {
        // Alternate row background
        if (index % 2 === 0) {
          ctx.fillStyle = '#f9fafb';
          ctx.fillRect(40, yPos - 15, width - 80, 35);
        }

        ctx.fillStyle = '#374151';
        ctx.fillText(`${index + 1}`, 60, yPos);
        ctx.fillText(t.full_name, 150, yPos);
        ctx.fillText(t.confirmed_juz || '-', 550, yPos);
        ctx.fillText(t.type === 'both' ? 'Tashih & Ujian' : (t.type === 'ujian' ? 'Ujian' : 'Tashih'), 700, yPos);
        ctx.fillText(t.partner_name || '-', 850, yPos);
        yPos += 35;
      });

      // Footer
      yPos += 20;
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'italic 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Dicetak pada ${new Date().toLocaleString('id-ID')}`, width / 2, height - 20);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate image');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daftar-thalibah-${halaqahData.halaqah.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('JPEG berhasil diunduh');
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Gagal membuat JPEG');
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
            <p className="text-xs text-gray-500 mt-1">{halaqahStats.fullHalaqah} penuh</p>
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

      {/* Additional Stats: Juz, Schedule, Muallimah */}
      {!loading && halaqahListWithSortedThalibah.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Per Muallimah */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Per Muallimah</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {Object.entries(halaqahStats.muallimahCount)
                .sort(([, a], [, b]) => b - a)
                .map(([muallimah, count]) => (
                  <div key={muallimah} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1">{muallimah}</span>
                    <span className="font-medium ml-2">{count}</span>
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
            <p className="text-gray-500">No halaqah found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {halaqahListWithSortedThalibah.map((item) => {
              const isExpanded = expandedHalaqah.has(item.halaqah.id);
              const thalibahCount = item.thalibah.length;

              return (
                <div key={item.halaqah.id} className="hover:bg-gray-50">
                  {/* Halaqah Header */}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleExpand(item.halaqah.id)}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <div className="flex-1">
                          {/* Title row with halaqah name and badge */}
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.halaqah.name}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.halaqah.is_full
                                ? 'bg-red-100 text-red-700'
                                : (item.halaqah.available_slots ?? 999) <= 3
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {thalibahCount} / {item.halaqah.max_students || 20} {item.halaqah.is_full ? '(Penuh)' : `(Tersedia: ${item.halaqah.available_slots ?? 0})`}
                            </span>
                          </div>

                          {/* Muallimah info row */}
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            {item.halaqah.muallimah_name && (
                              <>
                                <span className="font-medium text-gray-900">Ustadzah {item.halaqah.muallimah_name}</span>
                                <span className="text-gray-400">/</span>
                              </>
                            )}
                            <div className="flex items-center gap-3 text-gray-600">
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
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Download Buttons */}
                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadHalaqahPDF(item.halaqah.id);
                          }}
                          disabled={downloadingPDF}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download as PDF"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadHalaqahAsImage(item.halaqah.id);
                          }}
                          disabled={downloadingPDF}
                          className="px-3 py-2 border border-blue-300 text-blue-600 rounded-md text-sm hover:bg-blue-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download as JPEG"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="hidden sm:inline">JPEG</span>
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
                                onClick={() => handleThalibahSort('type')}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                              >
                                <div className="flex items-center gap-1">
                                  Tipe
                                  {getThalibahSortIcon('type')}
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
                                  {getTypeBadge(thalibah.type)}
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
                                  {thalibah.status === 'submitted' && (
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
    </div>
  );
}
