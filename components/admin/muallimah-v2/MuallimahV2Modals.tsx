'use client';

import { X, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { MuallimahV2Type } from './types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MuallimahReviewModal({ 
  isOpen, 
  onClose, 
  reviewData, 
  onRefresh, 
  user 
}: BaseModalProps & { 
  reviewData: MuallimahV2Type | null, 
  onRefresh: () => void,
  user: any
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const supabase = createClient();

  if (!isOpen || !reviewData) return null;

  const handleAction = async (status: 'approved' | 'rejected') => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('muallimah_akads')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', reviewData.id);
      
      if (error) throw error;
      toast.success(`Pendaftaran berhasil di-${status}`);
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error('Gagal memproses: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const scheduleStr = (() => {
    try {
      const s = typeof reviewData.preferred_schedule === 'string' 
        ? JSON.parse(reviewData.preferred_schedule) 
        : reviewData.preferred_schedule;
      if (s && s.day) {
        const day = s.day.charAt(0).toUpperCase() + s.day.slice(1).toLowerCase();
        return `${day}, ${s.time_start || ''} - ${s.time_end || ''}`;
      }
      return typeof reviewData.preferred_schedule === 'string' ? reviewData.preferred_schedule : JSON.stringify(reviewData.preferred_schedule || {});
    } catch {
      return typeof reviewData.preferred_schedule === 'string' ? reviewData.preferred_schedule : '-';
    }
  })();

  const classTypeStr = (reviewData.class_type || '').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || '-';
  const paidSchemeStr = (!reviewData.paid_class_scheme || reviewData.paid_class_scheme === 'none') ? 'Tidak ada' : (reviewData.paid_class_scheme.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-black text-gray-900">Review Mu'allimah</h3>
            <p className="text-sm text-gray-500 font-medium">Batch: {reviewData.batch?.name || '-'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Profil Pendaftar */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                  <span>Profil Pribadi</span>
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Nama Lengkap</label>
                    <p className="font-semibold text-gray-900">{reviewData.full_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pendidikan & Pekerjaan</label>
                    <p className="text-sm text-gray-700">{reviewData.education || '-'} / {reviewData.occupation || '-'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Kontak</label>
                    <p className="text-sm text-gray-700">WA: {reviewData.whatsapp || '-'}</p>
                    <p className="text-sm text-gray-700">Email: {reviewData.email || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-4">Pengalaman & Kualifikasi</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Hafalan Juz</label>
                    <p className="text-sm text-gray-700">{reviewData.memorized_juz || '-'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Lembaga Al Quran & Tajwid</label>
                    <p className="text-sm text-gray-700">Quran: {reviewData.quran_institution || '-'}</p>
                    <p className="text-sm text-gray-700">Tajwid: {reviewData.tajweed_institution || '-'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Matan Tajwid</label>
                    <p className="text-sm text-gray-700">Hafal: {reviewData.memorized_tajweed_matan || '-'}</p>
                    <p className="text-sm text-gray-700">Dipelajari: {reviewData.studied_matan_exegesis || '-'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pengalaman Mengajar</label>
                    <p className="text-sm text-gray-700">{reviewData.teaching_experience || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Akad */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-4">Komitmen Mengajar (Akad)</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tipe Kelas</label>
                    <p className="font-bold text-gray-900">{classTypeStr}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Skema Kelas Berbayar</label>
                    <p className="text-sm text-gray-700">{paidSchemeStr}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Juz yang dipilih</label>
                    <p className="text-sm font-semibold text-blue-700 bg-blue-50 w-fit px-2 py-1 rounded-md">{reviewData.preferred_juz || '-'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Maksimal Thalibah</label>
                    <p className="text-sm text-gray-700">{reviewData.preferred_max_thalibah || '-'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Jadwal Pilihan</label>
                    <p className="text-sm text-gray-700">{scheduleStr}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Setuju Komitmen?</label>
                    <div className="flex items-center gap-2 mt-1">
                      {reviewData.understands_commitment ? (
                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold"><CheckCircle className="h-3 w-3" /> YA</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold"><XCircle className="h-3 w-3" /> TIDAK</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors"
          >
            Tutup
          </button>
          
          {reviewData.status === 'pending' && (
            <>
              <button
                onClick={() => handleAction('rejected')}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? <span className="animate-spin text-lg leading-none">⟳</span> : <XCircle className="h-4 w-4" />}
                Tolak
              </button>
              <button
                onClick={() => handleAction('approved')}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200"
              >
                {isProcessing ? <span className="animate-spin text-lg leading-none">⟳</span> : <CheckCircle className="h-4 w-4" />}
                Setujui
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MuallimahBulkConfirmModal({ 
  isOpen, onClose, onConfirm, action, count, isProcessing 
}: BaseModalProps & { 
  onConfirm: () => void, 
  action: 'approve' | 'reject' | null, 
  count: number,
  isProcessing: boolean,
  rejectionReason?: string,
  setRejectionReason?: (r: string) => void
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 text-center space-y-4">
          <div className={cn(
            "w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4",
            action === 'approve' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
          )}>
            {action === 'approve' ? <CheckCircle className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
          </div>
          <h3 className="text-xl font-black text-gray-900">Konfirmasi Aksi Massal</h3>
          <p className="text-gray-500 text-sm">
            Anda akan me-{action === 'approve' ? 'nyetujui' : 'nolak'} <strong className="text-gray-900">{count}</strong> pendaftaran Mu'allimah sekaligus.
          </p>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition">Batal</button>
          <button onClick={onConfirm} disabled={isProcessing} className={cn("px-4 py-2 font-bold text-white rounded-xl shadow-lg transition", action === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
            {isProcessing ? 'Memproses...' : 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MuallimahUnapproveModal({ isOpen, onClose, onConfirm, data, isProcessing }: BaseModalProps & { onConfirm: (reason: string) => void, data: MuallimahV2Type | null, isProcessing: boolean }) {
  const [reason, setReason] = useState('');
  if (!isOpen || !data) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900">Batalkan Persetujuan</h3>
          <p className="text-sm text-gray-500">Anda akan membatalkan persetujuan untuk <strong>{data.full_name}</strong> dan mengembalikannya ke status Pending.</p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Alasan (opsional)" className="w-full border rounded-xl p-3 text-sm" rows={3} />
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-200 rounded-xl">Batal</button>
          <button onClick={() => onConfirm(reason)} disabled={isProcessing} className="px-4 py-2 font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg">Ya, Batalkan</button>
        </div>
      </div>
    </div>
  );
}
