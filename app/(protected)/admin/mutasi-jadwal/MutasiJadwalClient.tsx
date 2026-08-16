'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTimeShort } from '@/lib/reminder-generator';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

interface MutasiJadwalClientProps {
  initialRequests: any[];
  batches: any[];
}

export function MutasiJadwalClient({ initialRequests, batches }: MutasiJadwalClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Yakin ingin ${action === 'approve' ? 'MENYETUJUI' : 'MENOLAK'} pengajuan ini?`)) return;

    setLoadingId(requestId);
    try {
      const response = await fetch(`/api/admin/mutasi-jadwal/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal memproses pengajuan');

      toast.success(action === 'approve' ? 'Jadwal berhasil dipindah!' : 'Pengajuan ditolak');
      
      // Update local state
      setRequests(requests.filter(req => req.id !== requestId));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mutasi Jadwal</h1>
        <p className="text-gray-500 mt-2 font-medium">Kelola pengajuan pindah jadwal (Halaqah) dari Thalibah</p>
      </div>

      {requests.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Tidak ada pengajuan</h3>
            <p className="text-gray-500 mt-2">Belum ada pengajuan pindah jadwal yang perlu direview.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="shadow-sm border-gray-200 overflow-hidden">
              <div className="h-1 w-full bg-orange-500"></div>
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  
                  {/* Thalibah Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Pending
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(req.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{req.profile?.full_name}</h3>
                    <p className="text-sm text-gray-500">{req.profile?.phone_number}</p>
                    <p className="text-xs text-gray-400 mt-1">Batch: {req.batch?.name}</p>
                  </div>

                  {/* Transfer Details */}
                  <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-xl w-full md:w-auto">
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Dari Halaqah</p>
                      {req.from_halaqah ? (
                        <>
                          <p className="font-bold text-gray-800 text-sm">{req.from_halaqah.name}</p>
                          <p className="text-xs text-gray-500">
                            {DAYS[req.from_halaqah.day_of_week]} • {formatTimeShort(req.from_halaqah.start_time)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Belum dapat Halaqah</p>
                      )}
                    </div>

                    <ArrowRight className="w-5 h-5 text-gray-300 hidden sm:block" />

                    <div className="flex-1 text-center sm:text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ke Halaqah Baru</p>
                      <p className="font-bold text-emerald-700 text-sm">{req.to_halaqah.name}</p>
                      <p className="text-xs text-gray-500">
                        {DAYS[req.to_halaqah.day_of_week]} • {formatTimeShort(req.to_halaqah.start_time)}
                      </p>
                      <p className={`text-[10px] font-bold mt-1 ${req.to_halaqah.current_students >= req.to_halaqah.max_students ? 'text-red-500' : 'text-emerald-500'}`}>
                        Kuota: {req.to_halaqah.current_students} / {req.to_halaqah.max_students} Terisi
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex w-full md:w-auto flex-row md:flex-col gap-2 shrink-0">
                    <Button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={loadingId === req.id || req.to_halaqah.current_students >= req.to_halaqah.max_students}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      {loadingId === req.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Setujui
                    </Button>
                    <Button
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={loadingId === req.id}
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold border-red-200"
                    >
                      {loadingId === req.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Tolak
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
