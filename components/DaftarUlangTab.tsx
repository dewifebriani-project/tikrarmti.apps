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
  RotateCcw
} from 'lucide-react';
import { DaftarUlangHalaqahTab } from './DaftarUlangHalaqahTab';

type DaftarUlangSubTab = 'submissions' | 'halaqah';

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
  };
  partner_user?: {
    id: string;
    full_name: string;
    email: string;
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
  const [resettingAll, setResettingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);

  // Local batch filter state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [localBatchId, setLocalBatchId] = useState<string>(initialBatchId || 'all');

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

  const loadSubmissions = async () => {
    console.log('[DaftarUlangTab] Loading submissions...');
    setLoading(true);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (localBatchId && localBatchId !== 'all') params.append('batch_id', localBatchId);
      params.append('page', currentPage.toString());
      params.append('limit', '50');

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
        setPagination(result.pagination || null);
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

  // Load batches on mount
  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [localBatchId, refreshTrigger, currentPage]);

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

  // Statistics for submissions
  const submissionStats = useMemo(() => {
    // Use pagination total for overall count, use current page data for breakdowns
    const total = pagination?.total ?? submissions.length;
    const draft = submissions.filter(s => s.status === 'draft').length;
    const submitted = submissions.filter(s => s.status === 'submitted').length;
    const approved = submissions.filter(s => s.status === 'approved').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;
    const withHalaqah = submissions.filter(s => s.ujian_halaqah_id || s.tashih_halaqah_id).length;
    const withAkad = submissions.filter(s => s.akad_files && s.akad_files.length > 0).length;

    // Count by Juz
    const juzCount: Record<string, number> = {};
    submissions.forEach(s => {
      const juz = s.confirmed_chosen_juz || 'Unknown';
      juzCount[juz] = (juzCount[juz] || 0) + 1;
    });

    return {
      total,
      draft,
      submitted,
      approved,
      rejected,
      withHalaqah,
      withAkad,
      juzCount,
      showing: submissions.length
    };
  }, [submissions, pagination]);

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

  const handleResetAllHalaqah = async () => {
    // Count draft submissions with halaqah selection
    const draftsWithHalaqah = submissions.filter(
      s => s.status === 'draft' && (s.ujian_halaqah_id || s.tashih_halaqah_id)
    );

    if (draftsWithHalaqah.length === 0) {
      toast.info('Tidak ada draft dengan pilihan halaqah untuk direset');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin mereset pilihan halaqah untuk ${draftsWithHalaqah.length} draft submissions? Data halaqah akan dihapus tetapi akad dan partner akan tetap tersimpan.`)) {
      return;
    }

    setResettingAll(true);
    try {
      const response = await fetch('/api/admin/daftar-ulang/reset-all-halaqah', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset all halaqah');
      }

      toast.success(`Berhasil mereset ${result.data?.reset_count || 0} halaqah selection`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('[DaftarUlangTab] Error resetting all halaqah:', error);
      toast.error('Gagal mereset semua halaqah: ' + error.message);
    } finally {
      setResettingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Sub-tabs */}
      <div className="space-y-4">
        {/* Batch Filter */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
          <label className="text-sm font-medium text-gray-700">Filter by Batch:</label>
          <select
            value={localBatchId}
            onChange={(e) => {
              setLocalBatchId(e.target.value);
              setCurrentPage(1); // Reset to page 1 when batch changes
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
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Daftar Ulang</h2>
          <div className="flex gap-2">
            <button
              onClick={handleResetAllHalaqah}
              disabled={resettingAll}
              className="px-3 py-2 border border-orange-300 text-orange-600 rounded-md text-sm hover:bg-orange-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resettingAll ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-3 h-3" />
                  Reset All Halaqah
                </>
              )}
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
          </div>
        </nav>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'halaqah' ? (
        <DaftarUlangHalaqahTab batchId={localBatchId} />
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Total</p>
              <p className="text-2xl font-bold text-gray-900">{submissionStats.total}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Draft (halaman ini)</p>
              <p className="text-2xl font-bold text-gray-600">{submissionStats.draft}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Submitted (halaman ini)</p>
              <p className="text-2xl font-bold text-blue-600">{submissionStats.submitted}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Approved (halaman ini)</p>
              <p className="text-2xl font-bold text-green-600">{submissionStats.approved}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Rejected (halaman ini)</p>
              <p className="text-2xl font-bold text-red-600">{submissionStats.rejected}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Dengan Halaqah (halaman ini)</p>
              <p className="text-2xl font-bold text-purple-600">{submissionStats.withHalaqah}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Dengan Akad (halaman ini)</p>
              <p className="text-2xl font-bold text-orange-600">{submissionStats.withAkad}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 col-span-2 md:col-span-1">
              <p className="text-xs text-gray-500 uppercase mb-1">Per Juz (halaman ini)</p>
              <div className="text-xs space-y-1">
                {Object.entries(submissionStats.juzCount).sort(([a], [b]) => a.localeCompare(b)).map(([juz, count]) => (
                  <div key={juz} className="flex justify-between">
                    <span className="text-gray-600">{juz}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submissions List View */}
          <div className="bg-white border border-gray-200 rounded-lg">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : sortedSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No submissions found</p>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSubmissions.map((submission) => (
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
              {pagination && pagination.totalPages > 1 && (
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
