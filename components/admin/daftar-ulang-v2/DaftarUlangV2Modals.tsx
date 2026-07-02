'use client';

import { X, FileText, Download, AlertTriangle } from 'lucide-react';
import { DaftarUlangSubmission } from './types';
import { cn } from '@/lib/utils';

export function DetailModal({
  submission,
  onClose,
}: {
  submission: DaftarUlangSubmission;
  onClose: () => void;
}) {
  const formatDate = (dateString?: string) => {
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
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      submitted: 'bg-blue-50 text-blue-700 border-blue-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border", styles[status as keyof typeof styles] || styles.draft)}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Detail Daftar Ulang</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 bg-gray-50/50">
          
          {/* Thalibah Info */}
          <section>
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Informasi Thalibah</h4>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Nama Lengkap</p>
                <p className="text-sm font-bold text-gray-900">{submission.confirmed_full_name || submission.user?.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{submission.user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Juz Pilihan</p>
                <p className="text-sm font-bold text-gray-900">{submission.confirmed_chosen_juz || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Jadwal</p>
                <p className="text-sm font-medium text-gray-900">
                  {submission.confirmed_main_time_slot || '-'} 
                  {submission.confirmed_backup_time_slot ? ` (Cadangan: ${submission.confirmed_backup_time_slot})` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Skor Test Tertulis</p>
                <p className="text-sm font-bold text-gray-900">
                  {submission.registration?.written_quiz_score !== null && submission.registration?.written_quiz_score !== undefined
                    ? `${submission.registration.written_quiz_score} / 100`
                    : (submission.registration?.written_quiz_submitted_at || submission.registration?.written_exam_submitted_at ? 'Selesai' : '-')}
                </p>
              </div>
            </div>
          </section>

          {/* Partner Info */}
          <section>
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Informasi Partner</h4>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Tipe Partner</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{submission.partner_type?.replace('_', ' ') || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Nama Partner</p>
                  <p className="text-sm font-medium text-gray-900">
                    {submission.partner_type === 'self_match' && submission.partner_user
                      ? submission.partner_user.full_name
                      : submission.partner_name || '-'}
                  </p>
                </div>
                {submission.partner_relationship && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Hubungan</p>
                    <p className="text-sm font-medium text-gray-900">{submission.partner_relationship}</p>
                  </div>
                )}
                {submission.partner_wa_phone && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">WhatsApp</p>
                    <p className="text-sm font-medium text-gray-900">{submission.partner_wa_phone}</p>
                  </div>
                )}
              </div>
              {submission.partner_notes && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Catatan</p>
                  <p className="text-sm font-medium text-gray-900">{submission.partner_notes}</p>
                </div>
              )}
            </div>
          </section>

          {/* Halaqah Info */}
          <section>
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Pilihan Halaqah</h4>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Ujian Halaqah</p>
                <p className="text-sm font-bold text-gray-900">
                  {submission.ujian_halaqah?.name || (submission.is_tashih_umum ? '-' : 'Belum memilih')}
                </p>
                {submission.ujian_halaqah && (
                  <p className="text-xs text-gray-500 mt-1">
                    {submission.ujian_halaqah.day_of_week !== undefined && `Hari ${submission.ujian_halaqah.day_of_week}, `}
                    {submission.ujian_halaqah.start_time} - {submission.ujian_halaqah.end_time}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Tashih Halaqah</p>
                <p className="text-sm font-bold text-gray-900">
                  {submission.is_tashih_umum
                    ? 'Kelas Tashih Umum'
                    : (submission.tashih_halaqah?.name || 'Belum memilih')}
                </p>
                {submission.tashih_halaqah && (
                  <p className="text-xs text-gray-500 mt-1">
                    {submission.tashih_halaqah.day_of_week !== undefined && `Hari ${submission.tashih_halaqah.day_of_week}, `}
                    {submission.tashih_halaqah.start_time} - {submission.tashih_halaqah.end_time}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Akad Files */}
          <section>
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">File Akad</h4>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              {submission.akad_files && submission.akad_files.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    {submission.akad_files.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                      >
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 flex-1">{file.name}</span>
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </a>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Diunggah pada: {formatDate(submission.akad_submitted_at || '')}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-400">Belum ada file yang diunggah</p>
              )}
            </div>
          </section>

          {/* Status */}
          <section>
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Status</h4>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div>
                {getStatusBadge(submission.status)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500">Dibuat pada</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(submission.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">Diperbarui pada</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(submission.updated_at)}</p>
                </div>
                {submission.submitted_at && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Disubmit pada</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(submission.submitted_at)}</p>
                  </div>
                )}
                {submission.reviewed_at && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Direview pada</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(submission.reviewed_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export function BulkConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  count,
  isProcessing
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: 'approve' | 'reject';
  count: number;
  isProcessing: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-4 mx-auto">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
        </div>
        <h3 className="text-lg font-black text-center text-gray-900 mb-2">
          Konfirmasi {action === 'approve' ? 'Approve' : 'Reject'}
        </h3>
        <p className="text-sm text-center text-gray-500 mb-6 font-medium">
          Apakah Anda yakin ingin {action === 'approve' ? 'menyetujui' : 'menolak'} <span className="font-bold text-gray-900">{count}</span> data daftar ulang yang dipilih?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={cn(
              "flex-1 px-4 py-2 rounded-xl text-white text-sm font-bold transition-colors shadow-lg disabled:opacity-50",
              action === 'approve' 
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" 
                : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
            )}
          >
            {isProcessing ? 'Memproses...' : 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
