'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, 
  ChevronDown, ChevronUp, RefreshCw,
  Mail, Phone, Calendar, Clock, BookOpen, Award,
  CheckCircle, XCircle, AlertCircle, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Batch } from '@/types/database';
import { MuallimahStats } from './types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MuallimahTabProps {
  muallimah: any[];
  batches: Batch[];
  selectedBatchFilter: string;
  onBatchFilterChange: (batchId: string) => void;
  onRefresh: () => void;
}

export function MuallimahTab({ 
  muallimah, 
  batches, 
  selectedBatchFilter, 
  onBatchFilterChange, 
  onRefresh 
}: MuallimahTabProps) {
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // Sorting and filtering
  const [sortField, setSortField] = useState<string>('submitted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and sort logic
  const filteredMuallimah = muallimah.filter(m => {
    const matchesBatch = selectedBatchFilter === 'all' || m.batch_id === selectedBatchFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesSearch = searchQuery === '' ||
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesBatch && matchesStatus && matchesSearch;
  });

  const sortedMuallimah = [...filteredMuallimah].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'submitted_at') {
      aVal = new Date(aVal || 0).getTime();
      bVal = new Date(bVal || 0).getTime();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedMuallimah.length / itemsPerPage);
  const paginatedMuallimah = sortedMuallimah.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBatchFilter, statusFilter, searchQuery]);

  const stats: MuallimahStats = {
    total: filteredMuallimah.length,
    pending: filteredMuallimah.filter(m => m.status === 'pending').length,
    review: filteredMuallimah.filter(m => m.status === 'review').length,
    approved: filteredMuallimah.filter(m => m.status === 'approved').length,
    rejected: filteredMuallimah.filter(m => m.status === 'rejected').length,
    waitlist: filteredMuallimah.filter(m => m.status === 'waitlist').length,
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleApprove = async (registration: any) => {
    try {
      const response = await fetch('/api/admin/muallimah/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: registration.id }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to approve');

      toast.success('Muallimah registration approved');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const confirmReject = async () => {
    if (!selectedRegistration) return;
    try {
      const response = await fetch('/api/admin/muallimah/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedRegistration.id, reason: rejectReason }),
      });

      if (!response.ok) throw new Error('Failed to reject');

      toast.success('Registration rejected');
      setShowRejectModal(false);
      setRejectReason('');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      review: 'bg-blue-100 text-blue-700 border-blue-200',
      approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rejected: 'bg-rose-100 text-rose-700 border-rose-200',
      waitlist: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatScheduleDisplay = (schedule: any) => {
    if (!schedule) return '-';
    try {
      const s = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
      if (s.day && s.time_start && s.time_end) {
        return `${s.day}, ${s.time_start} - ${s.time_end} WIB`;
      }
      return JSON.stringify(s);
    } catch (e) {
      return String(schedule);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', count: stats.total, color: 'from-slate-600 to-slate-700', icon: Users, filter: 'all' },
          { label: 'Pending', count: stats.pending, color: 'from-amber-500 to-amber-600', icon: Clock, filter: 'pending' },
          { label: 'Review', count: stats.review, color: 'from-blue-500 to-blue-600', icon: Search, filter: 'review' },
          { label: 'Approved', count: stats.approved, color: 'from-emerald-600 to-emerald-700', icon: CheckCircle, filter: 'approved' },
          { label: 'Rejected', count: stats.rejected, color: 'from-rose-500 to-rose-600', icon: XCircle, filter: 'rejected' },
          { label: 'Waitlist', count: stats.waitlist, color: 'from-indigo-500 to-indigo-600', icon: AlertCircle, filter: 'waitlist' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setStatusFilter(item.filter)}
            className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br ${item.color} ${statusFilter === item.filter ? 'ring-4 ring-white/30' : ''}`}
          >
            <item.icon className="absolute -right-2 -top-2 h-16 w-16 opacity-10" />
            <p className="text-xs font-medium opacity-80">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{item.count}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={selectedBatchFilter}
                onChange={(e) => onBatchFilterChange(e.target.value)}
                className="bg-transparent text-sm font-medium border-none focus:ring-0 p-0 text-slate-700"
              >
                <option value="all">Semua Batch</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={onRefresh}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <button onClick={() => handleSort('full_name')} className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                    Muallimah
                    {sortField === 'full_name' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch & Kualifikasi</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kontak</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedMuallimah.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-12 w-12 text-slate-200" />
                      <p className="text-slate-400 font-medium">Tidak ada data ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMuallimah.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <button 
                          onClick={() => { setSelectedRegistration(m); setShowDetailModal(true); }}
                          className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors text-left"
                        >
                          {m.full_name}
                        </button>
                        <span className="text-xs text-slate-500 mt-0.5">{m.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <BookOpen className="h-3 w-3 text-emerald-500" />
                          {m.batch?.name || 'No Batch'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Award className="h-3 w-3 text-amber-500" />
                          Hafalan: {m.memorized_juz?.length || 0} Juz
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {m.phone && (
                        <a 
                          href={`https://wa.me/${m.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          WhatsApp
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(m.status === 'pending' || m.status === 'review') && (
                          <>
                            <button
                              onClick={() => handleApprove(m)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Setujui"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => { setSelectedRegistration(m); setShowRejectModal(true); }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Tolak"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { setSelectedRegistration(m); setShowDetailModal(true); }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Lihat Detail"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedMuallimah.length)} dari {sortedMuallimah.length} data
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-white transition-all"
              >
                Prev
              </button>
              <span className="text-xs font-bold px-3">Halaman {currentPage} dari {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-white transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertCircle className="h-8 w-8" />
              <h3 className="text-2xl font-bold">Konfirmasi Penolakan</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Apakah Anda yakin ingin menolak pendaftaran <strong>{selectedRegistration?.full_name}</strong>? Silakan berikan alasan penolakan.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Alasan penolakan..."
              className="w-full h-32 px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 transition-all mb-6"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-6 py-3 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-200"
              >
                Ya, Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRegistration && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8 overflow-hidden rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-xl">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Detail Pendaftar Muallimah</h2>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Profile Section */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nama Lengkap</p>
                  <p className="font-bold text-slate-900">{selectedRegistration.full_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(selectedRegistration.status)}`}>
                    {selectedRegistration.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {selectedRegistration.email}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">WhatsApp</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {selectedRegistration.phone || '-'}
                  </div>
                </div>
              </div>

              {/* Qualifications */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-600 pl-3">Kualifikasi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">Hafalan</p>
                    <p className="text-sm font-medium">{selectedRegistration.memorized_juz?.length || 0} Juz ({selectedRegistration.memorized_juz?.join(', ') || '-'})</p>
                  </div>
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-amber-600 uppercase">Tajwid</p>
                    <p className="text-sm font-medium">{selectedRegistration.tajweed_institution || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Akad if exists */}
              {selectedRegistration.akads && selectedRegistration.akads.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-purple-600 pl-3">Akad Batch Ini</h3>
                  <div className="p-5 bg-purple-50 rounded-3xl border border-purple-100 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-purple-600 uppercase">Jadwal 1</p>
                      <p className="text-sm font-medium">{selectedRegistration.akads[0].schedule1_day}, {selectedRegistration.akads[0].schedule1_time_start} - {selectedRegistration.akads[0].schedule1_time_end}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-purple-600 uppercase">Tipe Kelas</p>
                      <p className="text-sm font-medium uppercase">{selectedRegistration.akads[0].class_type?.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => setShowDetailModal(false)}>Tutup</Button>
              {selectedRegistration.status === 'pending' && (
                <Button 
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleApprove(selectedRegistration)}
                >
                  Setujui Sekarang
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default MuallimahTab;
