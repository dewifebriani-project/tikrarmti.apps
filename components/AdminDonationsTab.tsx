'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Trash2, Clock, DollarSign, Phone, FileText, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Donation {
  id: string;
  user_id: string;
  amount: number;
  donor_name: string;
  whatsapp: string;
  proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function AdminDonationsTab() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Note Modal States
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/donations');
      if (!res.ok) throw new Error('Gagal memuat donasi');
      const data = await res.json();
      if (data.success) {
        setDonations(data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (donation: Donation, type: 'approved' | 'rejected') => {
    setCurrentDonation(donation);
    setActionType(type);
    setAdminNotes(donation.notes || '');
    setNoteModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!currentDonation || !actionType) return;

    try {
      setSubmittingAction(true);
      const res = await fetch('/api/admin/donations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDonation.id,
          status: actionType,
          notes: adminNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Donasi berhasil ${actionType === 'approved' ? 'disetujui' : 'ditolak'}`);
        setDonations(prev =>
          prev.map(d => (d.id === currentDonation.id ? { ...d, status: actionType, notes: adminNotes } : d))
        );
        setNoteModalOpen(false);
        setCurrentDonation(null);
        setActionType(null);
        setAdminNotes('');
      } else {
        toast.error(data.error || 'Gagal memproses donasi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah antum yakin ingin menghapus catatan donasi ini?')) return;

    try {
      const res = await fetch(`/api/admin/donations?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Catatan donasi berhasil dihapus');
        setDonations(prev => prev.filter(d => d.id !== id));
      } else {
        toast.error(data.error || 'Gagal menghapus catatan donasi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan koneksi');
    }
  };

  const filteredDonations = donations.filter(d => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const totalApproved = donations
    .filter(d => d.status === 'approved')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800 mr-2"></div>
        <p className="text-gray-500 font-medium">Memuat Data Donasi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-white overflow-hidden rounded-2xl relative">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 rounded-full bg-emerald-500/10 blur-xl" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800 border border-emerald-100">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Donasi Disetujui</p>
              <h3 className="text-2xl font-extrabold text-emerald-950 mt-1">{formatIDR(totalApproved)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white overflow-hidden rounded-2xl relative">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 rounded-full bg-amber-500/10 blur-xl" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 border border-amber-100">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Menunggu Verifikasi</p>
              <h3 className="text-2xl font-extrabold text-amber-950 mt-1">
                {donations.filter(d => d.status === 'pending').length} transaksi
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Riwayat Dukungan Donasi</h2>
            <p className="text-xs text-gray-450 mt-0.5">Verifikasi laporan pembayaran donasi dari alumni MTI.</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'all' ? 'bg-white text-emerald-950 shadow-sm' : 'text-gray-650 hover:text-emerald-950'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'pending' ? 'bg-white text-emerald-950 shadow-sm' : 'text-gray-650 hover:text-emerald-950'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'approved' ? 'bg-white text-emerald-950 shadow-sm' : 'text-gray-650 hover:text-emerald-950'
              }`}
            >
              Berhasil
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'rejected' ? 'bg-white text-emerald-950 shadow-sm' : 'text-gray-650 hover:text-emerald-950'
              }`}
            >
              Ditolak
            </button>
          </div>
        </div>

        {filteredDonations.length === 0 ? (
          <div className="text-center py-16 text-gray-450 text-sm">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            Tidak ada data donasi untuk filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-550 uppercase tracking-wide">
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Donatur</th>
                  <th className="py-4 px-6">Jumlah</th>
                  <th className="py-4 px-6">WhatsApp</th>
                  <th className="py-4 px-6">Catatan Admin</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                      {new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      <div>
                        {d.donor_name}
                        {d.user?.email && <p className="text-xs text-gray-400 font-normal mt-0.5">{d.user.email}</p>}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-950 whitespace-nowrap">
                      {formatIDR(d.amount)}
                    </td>
                    <td className="py-4 px-6">
                      {d.whatsapp ? (
                        <a
                          href={`https://wa.me/${d.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-medium hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {d.whatsapp}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-550 max-w-xs truncate" title={d.notes}>
                      {d.notes || '-'}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {d.status === 'approved' && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Berhasil
                        </span>
                      )}
                      {d.status === 'rejected' && (
                        <span className="bg-red-50 text-red-700 border border-red-100 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Ditolak
                        </span>
                      )}
                      {d.status === 'pending' && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="border-gray-250 text-gray-650 hover:bg-gray-100 rounded-lg text-xs h-8">
                          <a href={d.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> Bukti
                          </a>
                        </Button>
                        
                        {d.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => handleOpenActionModal(d, 'approved')}
                              className="bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs px-3 h-8 shadow-sm"
                            >
                              Terima
                            </Button>
                            <Button
                              onClick={() => handleOpenActionModal(d, 'rejected')}
                              variant="outline"
                              className="border-red-250 text-red-700 hover:bg-red-50 rounded-lg text-xs px-3 h-8"
                            >
                              Tolak
                            </Button>
                          </>
                        )}
                        
                        <Button
                          onClick={() => handleDelete(d.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-100 text-red-750 hover:bg-red-50 rounded-lg p-2 h-8 w-8 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Notes Modal */}
      {noteModalOpen && currentDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border-0 shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`h-1.5 ${actionType === 'approved' ? 'bg-emerald-700' : 'bg-red-650'}`} />
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                {actionType === 'approved' ? 'Setujui Penerimaan Donasi' : 'Tolak Bukti Donasi'}
              </h3>
              <p className="text-xs text-gray-550 leading-relaxed">
                Antum akan {actionType === 'approved' ? 'menyetujui' : 'menolak'} donasi sebesar <strong>{formatIDR(currentDonation.amount)}</strong> dari <strong>{currentDonation.donor_name}</strong>. Silakan masukkan catatan admin tambahan jika diperlukan (misal: alasan penolakan).
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="adminNotes" className="text-sm font-semibold text-gray-700">Catatan Admin</Label>
                <textarea
                  id="adminNotes"
                  className="w-full rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm p-3 h-24 resize-none border"
                  placeholder={actionType === 'approved' ? 'Jazakumullahu khairan...' : 'Bukti transfer tidak terbaca, mohon unggah ulang bukti yang sah...'}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={() => {
                    setNoteModalOpen(false);
                    setCurrentDonation(null);
                    setActionType(null);
                    setAdminNotes('');
                  }}
                  variant="ghost"
                  className="rounded-xl text-gray-500"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleConfirmAction}
                  disabled={submittingAction}
                  className={`rounded-xl px-6 ${
                    actionType === 'approved' 
                      ? 'bg-emerald-800 hover:bg-emerald-700 text-white' 
                      : 'bg-red-750 hover:bg-red-700 text-white'
                  }`}
                >
                  {submittingAction ? 'Memproses...' : 'Konfirmasi'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
