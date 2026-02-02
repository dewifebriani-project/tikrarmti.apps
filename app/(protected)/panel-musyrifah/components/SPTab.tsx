'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  FileText,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Shield,
  Ban,
  Eye,
  Plus,
  X,
  ChevronDown,
} from 'lucide-react';

interface SPTabProps {
  activeList: any[];
  historyList: any[];
  pendingList: any[];
  batchId?: string;
  onRefresh: () => void;
}

type SPSubTab = 'pending' | 'active' | 'history';

export function SPTab({
  activeList,
  historyList,
  pendingList,
  batchId,
  onRefresh,
}: SPTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SPSubTab>('pending');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateSP = async (thalibahId: string, weekNumber: number, reason: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/musyrifah/sp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thalibah_id: thalibahId,
          batch_id: batchId,
          week_number: weekNumber,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat SP');
      }

      const result = await response.json();
      toast.success(result.message || 'SP berhasil diterbitkan');
      setShowCreateModal(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat SP');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSP = async (spId: string) => {
    if (!confirm('Batalkan SP ini?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/musyrifah/sp?id=${spId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membatalkan SP');
      }

      toast.success('SP berhasil dibatalkan');
      setShowDetailModal(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Gagal membatalkan SP');
    } finally {
      setLoading(false);
    }
  };

  const getSPBadge = (level: number) => {
    const badges = {
      1: { label: 'SP1', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      2: { label: 'SP2', color: 'bg-orange-100 text-orange-800 border-orange-300' },
      3: { label: 'SP3', color: 'bg-red-100 text-red-800 border-red-300' },
    };
    return badges[level as keyof typeof badges] || badges[1];
  };

  const getSPReasonLabel = (reason: string) => {
    const labels = {
      tidak_lapor_jurnal: 'Tidak Lapor Jurnal',
      laporan_tidak_lengkap: 'Laporan Tidak Lengkap',
      lainnya: 'Lainnya',
    };
    return labels[reason as keyof typeof labels] || reason;
  };

  const renderPendingTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Thalibah Belum Lapor</h3>
          <p className="text-sm text-gray-600">
            {pendingList.length} thalibah berpotensi mendapatkan SP
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Clock className="w-5 h-5" />
        </button>
      </div>

      {pendingList.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada thalibah yang pending SP</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Thalibah
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pekan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Jurnal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SP Saat Ini
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingList.map((item) => (
                <tr key={`${item.thalibah_id}-${item.week_number}`} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.thalibah?.full_name || item.thalibah?.nama_kunyah || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.weeks_with_jurnal} pekan dengan jurnal
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    Pekan {item.week_number}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Belum lapor
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {item.current_active_sp ? (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getSPBadge(item.current_active_sp.sp_level).color}`}
                      >
                        {getSPBadge(item.current_active_sp.sp_level).label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Belum ada
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleCreateSP(item.thalibah_id, item.week_number, 'tidak_lapor_jurnal')}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Buat SP{item.next_sp_level}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderActiveTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">SP Aktif</h3>
          <p className="text-sm text-gray-600">
            {activeList.length} surat peringatan aktif
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Clock className="w-5 h-5" />
        </button>
      </div>

      {activeList.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada SP aktif</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Thalibah
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pekan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alasan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeList.map((sp) => (
                <tr key={sp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {sp.thalibah?.full_name || sp.thalibah?.nama_kunyah || '-'}
                        </div>
                        {sp.is_blacklisted && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-0.5">
                            <Ban className="w-3 h-3 mr-1" />
                            Blacklisted
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getSPBadge(sp.sp_level).color}`}
                    >
                      {getSPBadge(sp.sp_level).label}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    Pekan {sp.week_number}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {getSPReasonLabel(sp.reason)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(sp.issued_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedItem(sp);
                        setShowDetailModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {sp.sp_level < 3 && (
                      <button
                        onClick={() => handleCreateSP(sp.thalibah_id, sp.week_number + 1, 'tidak_lapor_jurnal')}
                        disabled={loading}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleCancelSP(sp.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Riwayat SP</h3>
          <p className="text-sm text-gray-600">
            {historyList.length} thalibah mencapai SP3 / DO / Blacklist
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Clock className="w-5 h-5" />
        </button>
      </div>

      {historyList.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada riwayat SP</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Thalibah
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total SP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Akhir
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historyList.map((history) => (
                <tr key={history.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">
                        {history.thalibah?.full_name || history.thalibah?.nama_kunyah || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {history.total_sp_count} SP
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {history.final_action === 'blacklisted' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                        <Ban className="w-3 h-3 mr-1" />
                        Blacklisted
                      </span>
                    ) : history.final_action === 'permanent_do' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                        DO Permanent
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                        DO Temporary
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(history.action_taken_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {history.udzur_type && (
                      <div className="text-xs text-gray-600 mb-1">
                        Udzur: {history.udzur_type}
                      </div>
                    )}
                    {history.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDetailModal = () => {
    if (!showDetailModal || !selectedItem) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Detail SP</h3>
            <button
              onClick={() => setShowDetailModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Thalibah</label>
              <p className="text-gray-900">
                {selectedItem.thalibah?.full_name || selectedItem.thalibah?.nama_kunyah || '-'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Level</label>
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ml-2 ${getSPBadge(selectedItem.sp_level).color}`}
              >
                {getSPBadge(selectedItem.sp_level).label}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Pekan</label>
              <p className="text-gray-900">Pekan {selectedItem.week_number}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Alasan</label>
              <p className="text-gray-900">{getSPReasonLabel(selectedItem.reason)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Tanggal Diterbitkan</label>
              <p className="text-gray-900">
                {new Date(selectedItem.issued_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {selectedItem.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Catatan</label>
                <p className="text-gray-900">{selectedItem.notes}</p>
              </div>
            )}

            {selectedItem.is_blacklisted && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center text-red-800">
                  <Ban className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Thalibah Diblacklist</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => handleCancelSP(selectedItem.id)}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Batalkan SP
            </button>
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-4 py-2 bg-green-900 text-white rounded-lg text-sm font-medium hover:bg-green-800"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`${
              activeSubTab === 'pending'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <AlertCircle className="w-4 h-4" />
            Pending SP
            {pendingList.length > 0 && (
              <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('active')}
            className={`${
              activeSubTab === 'active'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Shield className="w-4 h-4" />
            Aktif
            {activeList.length > 0 && (
              <span className="bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs">
                {activeList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`${
              activeSubTab === 'history'
                ? 'border-gray-500 text-gray-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <FileText className="w-4 h-4" />
            Riwayat
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeSubTab === 'pending' && renderPendingTab()}
      {activeSubTab === 'active' && renderActiveTab()}
      {activeSubTab === 'history' && renderHistoryTab()}

      {/* Detail modal */}
      {renderDetailModal()}
    </div>
  );
}
