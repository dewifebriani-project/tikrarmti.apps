'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ThalibahInfo {
  id: string;
  full_name: string;
  email: string;
  partner_name?: string;
  partner_type?: string;
  status: 'submitted' | 'approved';
  submitted_at: string;
  confirmed_juz?: string;
  confirmed_time_slot?: string;
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
  type: 'ujian' | 'tashih';
  thalibah: ThalibahInfo[];
}

interface DaftarUlangHalaqahTabProps {
  batchId?: string;
}

const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

export function DaftarUlangHalaqahTab({ batchId }: DaftarUlangHalaqahTabProps) {
  const [halaqahList, setHalaqahList] = useState<HalaqahWithThalibah[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedHalaqah, setExpandedHalaqah] = useState<Set<string>>(new Set());

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
        console.log('[DaftarUlangHalaqahTab] Loaded', result.data.length, 'halaqah');
        setHalaqahList(result.data);
      } else {
        setHalaqahList([]);
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
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
    };

    const labels = {
      submitted: 'Submitted',
      approved: 'Approved',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedHalaqah);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedHalaqah(newExpanded);
  };

  const getTypeColor = (type: 'ujian' | 'tashih') => {
    return type === 'ujian'
      ? 'bg-purple-50 border-purple-200 text-purple-900'
      : 'bg-orange-50 border-orange-200 text-orange-900';
  };

  const getTypeBadge = (type: 'ujian' | 'tashih') => {
    const label = type === 'ujian' ? 'Ujian' : 'Tashih';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(type)}`}>
        {label}
      </span>
    );
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
        ) : halaqahList.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No halaqah found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {halaqahList.map((item) => {
              const key = `${item.halaqah.id}-${item.type}`;
              const isExpanded = expandedHalaqah.has(key);
              const thalibahCount = item.thalibah.length;

              return (
                <div key={key} className="hover:bg-gray-50">
                  {/* Halaqah Header */}
                  <button
                    onClick={() => toggleExpand(key)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.halaqah.name}
                        </h3>
                        {getTypeBadge(item.type)}
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
                                Status
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Submitted
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {item.thalibah.map((thalibah) => (
                              <tr key={thalibah.id} className="hover:bg-gray-50">
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
