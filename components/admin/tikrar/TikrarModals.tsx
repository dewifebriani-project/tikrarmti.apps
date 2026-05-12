'use client';

import { X, CheckCircle, XCircle, Clock, Undo2, AlertCircle, FileText } from 'lucide-react';
import { TikrarTahfidz } from './types';
import { OralAssessment } from '@/components/OralAssessment';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TikrarReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewData: TikrarTahfidz | null;
  onRefresh: () => void;
  user: any;
}

export function TikrarReviewModal({ isOpen, onClose, reviewData, onRefresh, user }: TikrarReviewModalProps) {
  if (!isOpen || !reviewData) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500/75 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto border border-gray-100">
          <div className="bg-white px-6 pt-6 pb-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Review Pendaftaran Tikrar</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">Lakukan penilaian komprehensif untuk thalibah ini.</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Profile & Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Section */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    Profil Thalibah
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Full Name</label>
                      <p className="text-sm font-bold text-gray-900">{reviewData.user?.full_name || reviewData.full_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Email</label>
                      <p className="text-sm font-bold text-gray-900 truncate">{reviewData.user?.email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">WhatsApp</label>
                      <p className="text-sm font-bold text-gray-900">{reviewData.user?.whatsapp || reviewData.wa_phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Domisili</label>
                      <p className="text-sm font-bold text-gray-900">{reviewData.user?.provinsi || reviewData.domicile || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    Detail Pendaftaran
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Batch</label>
                      <p className="text-sm font-bold text-gray-900">{reviewData.batch?.name || reviewData.batch_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Chosen Juz</label>
                      <p className="text-sm font-bold text-gray-900">Juz {reviewData.chosen_juz || '-'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Waktu Setoran</label>
                      <p className="text-sm font-bold text-gray-900 uppercase">{reviewData.main_time_slot || '-'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Status Registrasi</label>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit inline-block mt-1",
                        reviewData.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                        reviewData.status === 'rejected' ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {reviewData.status}
                      </span>
                    </div>
                  </div>
                  
                  {reviewData.motivation && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Motivasi</label>
                      <p className="text-sm font-medium text-gray-700 leading-relaxed italic">"{reviewData.motivation}"</p>
                    </div>
                  )}
                </div>

                {/* Oral Assessment Component */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <OralAssessment
                    registrationId={reviewData.id}
                    oralSubmissionUrl={reviewData.oral_submission_url}
                    currentAssessment={reviewData}
                    allowNoSubmission={true}
                    onSave={async (assessmentData) => {
                      try {
                        const response = await fetch(`/api/pendaftaran/tikrar/${reviewData.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({
                            ...assessmentData,
                            oral_assessed_by: user?.id,
                            oral_assessed_at: new Date().toISOString(),
                          }),
                        });

                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || 'Failed to save assessment');
                        }

                        // Update selection_status based on assessment result
                        const selectionStatus = assessmentData.oral_assessment_status === 'pass'
                          ? 'selected' // Changed from 'approved' to 'selected' as per standard
                          : 'not_selected';

                        await fetch(`/api/pendaftaran/tikrar/${reviewData.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({
                            selection_status: selectionStatus,
                          }),
                        });

                        toast.success('Penilaian oral berhasil disimpan!');
                        onRefresh();
                        onClose();
                      } catch (error: any) {
                        toast.error(error.message || 'Gagal menyimpan penilaian');
                        throw error;
                      }
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Written Results & Checklist */}
              <div className="space-y-6">
                {/* Written Score Card */}
                <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
                  <h4 className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Hasil Ujian Tulis
                  </h4>
                  
                  {reviewData.written_exam_submitted_at || reviewData.written_quiz_submitted_at ? (
                    <div className="space-y-4">
                      <div className="flex items-end gap-1">
                        <span className="text-5xl font-black tracking-tighter">
                          {reviewData.written_quiz_score || 0}
                        </span>
                        <span className="text-xl font-bold opacity-60 mb-1.5">/ 100</span>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white rounded-full transition-all duration-1000"
                            style={{ width: `${reviewData.written_quiz_score || 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-100">
                          <span>Progress</span>
                          <span>{reviewData.written_quiz_score >= 70 ? 'LULUS' : 'GAGAL'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6 text-indigo-100/60">
                      <Clock className="h-12 w-12 mb-2 stroke-1" />
                      <p className="text-xs font-bold uppercase tracking-wider">Belum Mengerjakan</p>
                    </div>
                  )}
                </div>

                {/* Readiness Checklist */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Readiness Check</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Memahami Komitmen', value: reviewData.understands_commitment },
                      { label: 'Mencoba Simulasi', value: reviewData.tried_simulation },
                      { label: 'Tidak Negosiasi', value: reviewData.no_negotiation },
                      { label: 'Simpan Kontak', value: reviewData.saved_contact },
                      { label: 'Punya Izin', value: reviewData.has_permission },
                      { label: 'Punya Telegram', value: reviewData.has_telegram },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">{item.label}</span>
                        {item.value ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bulk Confirmation Modal
interface BulkConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: 'approve' | 'reject' | null;
  count: number;
  isProcessing: boolean;
  rejectionReason: string;
  setRejectionReason: (val: string) => void;
}

export function TikrarBulkConfirmModal({
  isOpen, onClose, onConfirm, action, count, isProcessing, rejectionReason, setRejectionReason
}: BulkConfirmModalProps) {
  if (!isOpen || !action) return null;

  return (
    <div className="fixed z-[60] inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500/75 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
          <div className="bg-white px-6 pt-6 pb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl ${action === 'approve' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {action === 'approve' ? (
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  Bulk {action === 'approve' ? 'Approve' : 'Reject'} Applications
                </h3>
                <p className="text-sm font-medium text-gray-500">
                  Konfirmasi tindakan massal untuk {count} thalibah.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm text-gray-600 font-medium leading-relaxed">
              Anda akan melakukan <strong>{action === 'approve' ? 'Persetujuan' : 'Penolakan'}</strong> secara massal. Tindakan ini tidak dapat dibatalkan. Pastikan data sudah sesuai.
            </div>

            {action === 'reject' && (
              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
                  Alasan Penolakan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm font-medium"
                  placeholder="Berikan alasan penolakan untuk thalibah..."
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button
                onClick={onConfirm}
                disabled={isProcessing}
                className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 ${
                  action === 'approve' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                }`}
              >
                {isProcessing ? 'Memproses...' : `YA, ${action === 'approve' ? 'SETUJUI' : 'TOLAK'}`}
              </button>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 rounded-2xl font-black text-sm uppercase tracking-widest text-gray-600 bg-gray-50 hover:bg-gray-100 transition-all active:scale-95"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Unapprove Modal
interface UnapproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  data: TikrarTahfidz | null;
  isProcessing: boolean;
}

export function TikrarUnapproveModal({ isOpen, onClose, onConfirm, data, isProcessing }: UnapproveModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen || !data) return null;

  return (
    <div className="fixed z-[60] inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500/75 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
          <div className="bg-white px-6 pt-6 pb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl bg-orange-100">
                <Undo2 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Batalkan Persetujuan</h3>
                <p className="text-sm font-medium text-gray-500">
                  Membatalkan pendaftaran untuk "{data.full_name || data.user?.full_name}"
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
                Alasan Pembatalan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium"
                placeholder="Berikan alasan pembatalan..."
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button
                onClick={() => onConfirm(reason)}
                disabled={isProcessing || !reason.trim()}
                className="flex-1 py-3 px-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? 'Memproses...' : 'BATALKAN PERSETUJUAN'}
              </button>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 rounded-2xl font-black text-sm uppercase tracking-widest text-gray-600 bg-gray-50 hover:bg-gray-100 transition-all active:scale-95"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
