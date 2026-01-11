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
  ArrowDown
} from 'lucide-react';

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
}

interface HalaqahWithThalibah {
  halaqah: HalaqahInfo;
  thalibah: ThalibahInfo[];
}

type SortField = 'name' | 'thalibah_count' | 'muallimah' | 'schedule';
type SortOrder = 'asc' | 'desc';

interface DaftarUlangHalaqahTabProps {
  batchId?: string;
}

const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

export function DaftarUlangHalaqahTab({ batchId }: DaftarUlangHalaqahTabProps) {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedHalaqah, setExpandedHalaqah] = useState<Set<string>>(new Set());
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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
    // Group by halaqah ID
    const halaqahMap = new Map<string, HalaqahWithThalibah>();

    rawData.forEach((item) => {
      const halaqahId = item.halaqah.id;
      const type = item.type;

      if (!halaqahMap.has(halaqahId)) {
        halaqahMap.set(halaqahId, {
          halaqah: item.halaqah,
          thalibah: []
        });
      }

      // Add thalibah with type info
      item.thalibah.forEach((t: any) => ({
        ...t,
        type: type,
        submission_id: t.id // Store submission_id for revert
      })).forEach((t: ThalibahInfo) => {
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Daftar Thalibah per Halaqah</h2>
        <button
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : sortedHalaqahList.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No halaqah found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedHalaqahList.map((item) => {
              const isExpanded = expandedHalaqah.has(item.halaqah.id);
              const thalibahCount = item.thalibah.length;

              return (
                <div key={item.halaqah.id} className="hover:bg-gray-50">
                  {/* Halaqah Header */}
                  <button
                    onClick={() => toggleExpand(item.halaqah.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.halaqah.name}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {thalibahCount} {thalibahCount === 1 ? 'thalibah' : 'thalibah'}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                        {item.halaqah.muallimah_name && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{item.halaqah.muallimah_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Thalibah List (Expanded) */}
                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Nama Thalibah
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Juz
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Partner
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Tipe
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Submitted
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
