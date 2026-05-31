'use client';

import { X, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { MuallimahV2Type } from './types';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
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

  const parseSchedule = (scheduleData: any) => {
    try {
      if (!scheduleData) return null;
      const s = typeof scheduleData === 'string' ? JSON.parse(scheduleData) : scheduleData;
      if (!s) return null;
      
      if (s.tikrar || s.pra_tahfidz || s.berbayar) {
        return s;
      }
      if (s.day) {
        return { legacy: s };
      }
      return null;
    } catch {
      return null;
    }
  };

  const parsedPreferred = parseSchedule(reviewData.preferred_schedule);
  const parsedBackup = parseSchedule(reviewData.backup_schedule);

  const formatScheduleItem = (item: any) => {
    if (!item || !item.day) return null;
    try {
      const dayStr = String(item.day).trim();
      if (!dayStr) return null;
      const dayFormatted = dayStr.charAt(0).toUpperCase() + dayStr.slice(1).toLowerCase();
      if (item.time_start && item.time_end && item.time_start !== '-' && item.time_end !== '-') {
        return `${dayFormatted}, ${item.time_start} - ${item.time_end}`;
      }
      return `${dayFormatted} (Jam belum diisi)`;
    } catch {
      return null;
    }
  };

  const classTypesList: string[] = [];
  const rawTypes = (reviewData.class_type || '').split(', ').map(type => type.trim().toLowerCase());
  
  if (rawTypes.includes('tikrar_tahfidz')) {
    classTypesList.push('Tikrar');
  }
  if (rawTypes.includes('pra_tahfidz')) {
    classTypesList.push('Pra-Tikrar');
  }
  if (reviewData.paid_class_scheme && reviewData.paid_class_scheme !== 'none') {
    classTypesList.push('Berbayar');
  }
  
  // Fallback untuk tipe kelas kustom legacy lainnya
  rawTypes.forEach(rt => {
    if (rt !== 'tikrar_tahfidz' && rt !== 'pra_tahfidz' && rt) {
      const formatted = rt.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      if (!classTypesList.includes(formatted)) {
        classTypesList.push(formatted);
      }
    }
  });

  const classTypeStr = classTypesList.join(', ') || '-';

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
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Jadwal Mengajar</label>
                    <div className="space-y-2 mt-1.5">
                      {/* Tampilkan jika tidak ada parsedPreferred yang valid */}
                      {!parsedPreferred && <p className="text-sm text-gray-500 font-medium">-</p>}
                      
                      {parsedPreferred && parsedPreferred.legacy && formatScheduleItem(parsedPreferred.legacy) && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Jadwal Utama (Legacy)</p>
                          <p className="text-xs font-semibold text-gray-800 mt-0.5">
                            {formatScheduleItem(parsedPreferred.legacy)}
                          </p>
                          {parsedBackup?.legacy && formatScheduleItem(parsedBackup.legacy) && (
                            <p className="text-[10px] text-gray-500 mt-1 italic">
                              Cadangan: {formatScheduleItem(parsedBackup.legacy)}
                            </p>
                          )}
                        </div>
                      )}

                      {parsedPreferred && parsedPreferred.tikrar && formatScheduleItem(parsedPreferred.tikrar) && (
                        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                          <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">🗓️ Kelas Tikrar</p>
                          <p className="text-xs font-semibold text-emerald-950 mt-0.5">
                            {formatScheduleItem(parsedPreferred.tikrar)}
                          </p>
                          {parsedBackup?.tikrar && formatScheduleItem(parsedBackup.tikrar) && (
                            <p className="text-[10px] text-emerald-700/80 mt-1 italic">
                              Cadangan: {formatScheduleItem(parsedBackup.tikrar)}
                            </p>
                          )}
                        </div>
                      )}

                      {parsedPreferred && parsedPreferred.pra_tahfidz && formatScheduleItem(parsedPreferred.pra_tahfidz) && (
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                          <p className="text-[9px] font-bold text-blue-800 uppercase tracking-wider">🗓️ Kelas Pra-Tikrar</p>
                          <p className="text-xs font-semibold text-blue-950 mt-0.5">
                            {formatScheduleItem(parsedPreferred.pra_tahfidz)}
                          </p>
                          {parsedBackup?.pra_tahfidz && formatScheduleItem(parsedBackup.pra_tahfidz) && (
                            <p className="text-[10px] text-blue-700/80 mt-1 italic">
                              Cadangan: {formatScheduleItem(parsedBackup.pra_tahfidz)}
                            </p>
                          )}
                        </div>
                      )}

                      {parsedPreferred && parsedPreferred.berbayar && formatScheduleItem(parsedPreferred.berbayar) && (
                        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                          <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">🗓️ Kelas Berbayar</p>
                          <p className="text-xs font-semibold text-amber-950 mt-0.5">
                            {formatScheduleItem(parsedPreferred.berbayar)}
                          </p>
                          {parsedBackup?.berbayar && formatScheduleItem(parsedBackup.berbayar) && (
                            <p className="text-[10px] text-amber-700/80 mt-1 italic">
                              Cadangan: {formatScheduleItem(parsedBackup.berbayar)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Jika tidak ada satupun jadwal yang ter-render valid */}
                      {parsedPreferred && 
                       !(parsedPreferred.legacy && formatScheduleItem(parsedPreferred.legacy)) &&
                       !(parsedPreferred.tikrar && formatScheduleItem(parsedPreferred.tikrar)) &&
                       !(parsedPreferred.pra_tahfidz && formatScheduleItem(parsedPreferred.pra_tahfidz)) &&
                       !(parsedPreferred.berbayar && formatScheduleItem(parsedPreferred.berbayar)) && (
                         <p className="text-sm text-gray-500 font-medium">-</p>
                       )}
                    </div>
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

const dayOptions = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
  { value: 'ahad', label: 'Ahad' },
];

const allJuzOptions = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: `Juz ${i + 1}`,
}));

export function MuallimahEditModal({
  isOpen,
  onClose,
  editData,
  onRefresh
}: BaseModalProps & {
  editData: MuallimahV2Type | null;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);

  // States
  const [status, setStatus] = useState('pending');
  const [classTikrar, setClassTikrar] = useState(false);
  const [classPratikrar, setClassPratikrar] = useState(false);
  const [classPaid, setClassPaid] = useState(false);
  const [paidClassScheme, setPaidClassScheme] = useState('none');
  const [preferredJuz, setPreferredJuz] = useState<string[]>([]);
  const [preferredMaxThalibah, setPreferredMaxThalibah] = useState(10);

  // Schedule States
  const [scheduleTikrarDay, setScheduleTikrarDay] = useState('');
  const [scheduleTikrarTimeStart, setScheduleTikrarTimeStart] = useState('');
  const [scheduleTikrarTimeEnd, setScheduleTikrarTimeEnd] = useState('');
  const [scheduleTikrarDay2, setScheduleTikrarDay2] = useState('');
  const [scheduleTikrarTimeStart2, setScheduleTikrarTimeStart2] = useState('');
  const [scheduleTikrarTimeEnd2, setScheduleTikrarTimeEnd2] = useState('');

  const [schedulePratikrarDay, setSchedulePratikrarDay] = useState('');
  const [schedulePratikrarTimeStart, setSchedulePratikrarTimeStart] = useState('');
  const [schedulePratikrarTimeEnd, setSchedulePratikrarTimeEnd] = useState('');
  const [schedulePratikrarDay2, setSchedulePratikrarDay2] = useState('');
  const [schedulePratikrarTimeStart2, setSchedulePratikrarTimeStart2] = useState('');
  const [schedulePratikrarTimeEnd2, setSchedulePratikrarTimeEnd2] = useState('');

  const [schedulePaidDay, setSchedulePaidDay] = useState('');
  const [schedulePaidTimeStart, setSchedulePaidTimeStart] = useState('');
  const [schedulePaidTimeEnd, setSchedulePaidTimeEnd] = useState('');
  const [schedulePaidDay2, setSchedulePaidDay2] = useState('');
  const [schedulePaidTimeStart2, setSchedulePaidTimeStart2] = useState('');
  const [schedulePaidTimeEnd2, setSchedulePaidTimeEnd2] = useState('');

  useEffect(() => {
    if (!editData) return;

    setStatus(editData.status || 'pending');
    
    const rawTypes = (editData.class_type || '').split(',').map(t => t.trim().toLowerCase());
    setClassTikrar(rawTypes.includes('tikrar_tahfidz'));
    setClassPratikrar(rawTypes.includes('pra_tahfidz'));
    
    const hasPaid = editData.paid_class_scheme && editData.paid_class_scheme !== 'none';
    setClassPaid(!!hasPaid);
    setPaidClassScheme(editData.paid_class_scheme || 'none');
    
    const juzArray = editData.preferred_juz 
      ? editData.preferred_juz.split(',').map(j => j.trim()) 
      : [];
    setPreferredJuz(juzArray);
    
    setPreferredMaxThalibah(editData.preferred_max_thalibah || 10);

    // Parse schedules
    let preferredObj: any = null;
    if (editData.preferred_schedule) {
      try {
        preferredObj = typeof editData.preferred_schedule === 'string'
          ? JSON.parse(editData.preferred_schedule)
          : editData.preferred_schedule;
      } catch (e) {}
    }

    let backupObj: any = null;
    if (editData.backup_schedule) {
      try {
        backupObj = typeof editData.backup_schedule === 'string'
          ? JSON.parse(editData.backup_schedule)
          : editData.backup_schedule;
      } catch (e) {}
    }

    // Reset
    setScheduleTikrarDay(''); setScheduleTikrarTimeStart(''); setScheduleTikrarTimeEnd('');
    setScheduleTikrarDay2(''); setScheduleTikrarTimeStart2(''); setScheduleTikrarTimeEnd2('');
    setSchedulePratikrarDay(''); setSchedulePratikrarTimeStart(''); setSchedulePratikrarTimeEnd('');
    setSchedulePratikrarDay2(''); setSchedulePratikrarTimeStart2(''); setSchedulePratikrarTimeEnd2('');
    setSchedulePaidDay(''); setSchedulePaidTimeStart(''); setSchedulePaidTimeEnd('');
    setSchedulePaidDay2(''); setSchedulePaidTimeStart2(''); setSchedulePaidTimeEnd2('');

    if (preferredObj) {
      if (preferredObj.tikrar) {
        setScheduleTikrarDay(preferredObj.tikrar.day || '');
        setScheduleTikrarTimeStart(preferredObj.tikrar.time_start || '');
        setScheduleTikrarTimeEnd(preferredObj.tikrar.time_end || '');
      }
      if (preferredObj.pra_tahfidz) {
        setSchedulePratikrarDay(preferredObj.pra_tahfidz.day || '');
        setSchedulePratikrarTimeStart(preferredObj.pra_tahfidz.time_start || '');
        setSchedulePratikrarTimeEnd(preferredObj.pra_tahfidz.time_end || '');
      }
      if (preferredObj.berbayar) {
        setSchedulePaidDay(preferredObj.berbayar.day || '');
        setSchedulePaidTimeStart(preferredObj.berbayar.time_start || '');
        setSchedulePaidTimeEnd(preferredObj.berbayar.time_end || '');
      }
      if (preferredObj.day && !preferredObj.tikrar && !preferredObj.pra_tahfidz && !preferredObj.berbayar) {
        setScheduleTikrarDay(preferredObj.day || '');
        setScheduleTikrarTimeStart(preferredObj.time_start || '');
        setScheduleTikrarTimeEnd(preferredObj.time_end || '');
      }
    }

    if (backupObj) {
      if (backupObj.tikrar) {
        setScheduleTikrarDay2(backupObj.tikrar.day || '');
        setScheduleTikrarTimeStart2(backupObj.tikrar.time_start || '');
        setScheduleTikrarTimeEnd2(backupObj.tikrar.time_end || '');
      }
      if (backupObj.pra_tahfidz) {
        setSchedulePratikrarDay2(backupObj.pra_tahfidz.day || '');
        setSchedulePratikrarTimeStart2(backupObj.pra_tahfidz.time_start || '');
        setSchedulePratikrarTimeEnd2(backupObj.pra_tahfidz.time_end || '');
      }
      if (backupObj.berbayar) {
        setSchedulePaidDay2(backupObj.berbayar.day || '');
        setSchedulePaidTimeStart2(backupObj.berbayar.time_start || '');
        setSchedulePaidTimeEnd2(backupObj.berbayar.time_end || '');
      }
      if (backupObj.day && !backupObj.tikrar && !backupObj.pra_tahfidz && !backupObj.berbayar) {
        setScheduleTikrarDay2(backupObj.day || '');
        setScheduleTikrarTimeStart2(backupObj.time_start || '');
        setScheduleTikrarTimeEnd2(backupObj.time_end || '');
      }
    }
  }, [editData, isOpen]);

  if (!isOpen || !editData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const preferredScheduleObj: Record<string, any> = {};
      const backupScheduleObj: Record<string, any> = {};

      if (classTikrar) {
        preferredScheduleObj.tikrar = {
          day: scheduleTikrarDay,
          time_start: scheduleTikrarTimeStart,
          time_end: scheduleTikrarTimeEnd
        };
        if (scheduleTikrarDay2 && scheduleTikrarTimeStart2 && scheduleTikrarTimeEnd2) {
          backupScheduleObj.tikrar = {
            day: scheduleTikrarDay2,
            time_start: scheduleTikrarTimeStart2,
            time_end: scheduleTikrarTimeEnd2
          };
        }
      }

      if (classPratikrar) {
        preferredScheduleObj.pra_tahfidz = {
          day: schedulePratikrarDay,
          time_start: schedulePratikrarTimeStart,
          time_end: schedulePratikrarTimeEnd
        };
        if (schedulePratikrarDay2 && schedulePratikrarTimeStart2 && schedulePratikrarTimeEnd2) {
          backupScheduleObj.pra_tahfidz = {
            day: schedulePratikrarDay2,
            time_start: schedulePratikrarTimeStart2,
            time_end: schedulePratikrarTimeEnd2
          };
        }
      }

      if (classPaid) {
        preferredScheduleObj.berbayar = {
          day: schedulePaidDay,
          time_start: schedulePaidTimeStart,
          time_end: schedulePaidTimeEnd
        };
        if (schedulePaidDay2 && schedulePaidTimeStart2 && schedulePaidTimeEnd2) {
          backupScheduleObj.berbayar = {
            day: schedulePaidDay2,
            time_start: schedulePaidTimeStart2,
            time_end: schedulePaidTimeEnd2
          };
        }
      }

      const classTypesSelected = [];
      if (classTikrar) classTypesSelected.push('tikrar_tahfidz');
      if (classPratikrar) classTypesSelected.push('pra_tahfidz');

      const payload = {
        status,
        class_type: classTypesSelected.join(', ') || 'tikrar_tahfidz',
        paid_class_scheme: classPaid ? (paidClassScheme || 'none') : 'none',
        preferred_juz: preferredJuz.map(j => parseInt(j)).sort((a,b) => a-b).join(', '),
        preferred_max_thalibah: preferredMaxThalibah,
        preferred_schedule: JSON.stringify(preferredScheduleObj),
        backup_schedule: Object.keys(backupScheduleObj).length > 0 ? JSON.stringify(backupScheduleObj) : null,
      };

      const { error } = await supabase
        .from('muallimah_akads')
        .update(payload)
        .eq('id', editData.id);

      if (error) throw error;
      toast.success('Pendaftaran Akad berhasil diperbarui');
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error('Gagal memperbarui: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-black text-gray-900">Edit Akad Mu'allimah</h3>
            <p className="text-sm text-gray-500 font-medium">Ustadzah: {editData.full_name || editData.user?.full_name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Kolom Kiri: Konfigurasi Kelas, Juz, & Status */}
            <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h4 className="text-sm font-black uppercase tracking-wider text-gray-400 border-b pb-2 mb-4">Pengaturan Akad & Komitmen</h4>
              
              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status Akad</Label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-medium text-gray-800"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Tipe Program Checkbox */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Program Kelas yang Diampu</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2 p-2 border rounded-xl hover:bg-emerald-50/10 cursor-pointer">
                    <Checkbox 
                      id="edit-class-tikrar"
                      checked={classTikrar}
                      onCheckedChange={(checked) => setClassTikrar(!!checked)}
                    />
                    <Label htmlFor="edit-class-tikrar" className="text-xs font-bold text-gray-700 cursor-pointer">Tikrar</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded-xl hover:bg-blue-50/10 cursor-pointer">
                    <Checkbox 
                      id="edit-class-pratikrar"
                      checked={classPratikrar}
                      onCheckedChange={(checked) => setClassPratikrar(!!checked)}
                    />
                    <Label htmlFor="edit-class-pratikrar" className="text-xs font-bold text-gray-700 cursor-pointer">Pra-Tikrar</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded-xl hover:bg-amber-50/10 cursor-pointer">
                    <Checkbox 
                      id="edit-class-paid"
                      checked={classPaid}
                      onCheckedChange={(checked) => setClassPaid(!!checked)}
                    />
                    <Label htmlFor="edit-class-paid" className="text-xs font-bold text-gray-700 cursor-pointer">Berbayar</Label>
                  </div>
                </div>
              </div>

              {/* Skema & Max Thalibah */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Skema Kelas Berbayar</Label>
                  <select 
                    value={paidClassScheme} 
                    onChange={e => setPaidClassScheme(e.target.value)} 
                    disabled={!classPaid}
                    className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-medium text-gray-800 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="none">Tidak Ikut</option>
                    <option value="berbayar_80_20">Berbayar 80-20</option>
                    <option value="berbayar_60_40">Berbayar 60-40</option>
                    <option value="berbayar_100">Berbayar 100</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Maksimal Thalibah</Label>
                  <Input 
                    type="number" 
                    value={preferredMaxThalibah} 
                    onChange={e => setPreferredMaxThalibah(parseInt(e.target.value) || 10)}
                    min={1} max={50}
                    className="h-10 border-gray-200 text-sm"
                  />
                </div>
              </div>

              {/* Juz bersedia diampu */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Juz Yang Bersedia Diampu</Label>
                <div className="grid grid-cols-5 gap-1 p-3 border rounded-2xl bg-gray-50/50 max-h-[180px] overflow-y-auto">
                  {allJuzOptions.map(juz => (
                    <div key={juz.value} className="flex items-center space-x-1.5 py-1 hover:bg-white rounded-lg px-2 border border-transparent hover:border-gray-100 transition-all">
                      <Checkbox 
                        id={`edit-pref-juz-${juz.value}`}
                        checked={preferredJuz.includes(juz.value)}
                        onCheckedChange={(checked) => {
                          const newJuz = checked 
                            ? [...preferredJuz, juz.value]
                            : preferredJuz.filter(v => v !== juz.value);
                          setPreferredJuz(newJuz);
                        }}
                      />
                      <Label htmlFor={`edit-pref-juz-${juz.value}`} className="text-[10px] font-bold text-gray-700 cursor-pointer whitespace-nowrap">{juz.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Detail Jadwal (Hanya tampil jika program bersangkutan dicentang) */}
            <div className="space-y-6">
              {/* Jika tidak ada satupun program yang dicentang */}
              {!classTikrar && !classPratikrar && !classPaid && (
                <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 font-bold text-sm">
                  Centang program kelas di samping kiri untuk mengatur jadwal mengajar
                </div>
              )}

              {/* Jadwal Tikrar */}
              {classTikrar && (
                <div className="bg-emerald-50/10 p-5 rounded-2xl border border-emerald-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <h4 className="text-sm font-black text-emerald-900 border-b border-emerald-100 pb-1.5 flex items-center gap-1.5">
                    🗓️ Jadwal Kelas Tikrar
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Utama */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Jadwal Utama</Label>
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-white rounded-xl border border-emerald-100/50">
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">HARI</Label>
                          <select value={scheduleTikrarDay} onChange={e => setScheduleTikrarDay(e.target.value)} className="w-full text-xs h-7 border rounded bg-white mt-0.5 focus:outline-none">
                            <option value="">Hari</option>
                            {dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">MULAI</Label>
                          <input type="time" value={scheduleTikrarTimeStart} onChange={e => setScheduleTikrarTimeStart(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">SELESAI</Label>
                          <input type="time" value={scheduleTikrarTimeEnd} onChange={e => setScheduleTikrarTimeEnd(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                      </div>
                    </div>
                    {/* Cadangan */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jadwal Cadangan</Label>
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-white rounded-xl border border-gray-100">
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">HARI</Label>
                          <select value={scheduleTikrarDay2} onChange={e => setScheduleTikrarDay2(e.target.value)} className="w-full text-xs h-7 border rounded bg-white mt-0.5 focus:outline-none">
                            <option value="">Hari</option>
                            {dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">MULAI</Label>
                          <input type="time" value={scheduleTikrarTimeStart2} onChange={e => setScheduleTikrarTimeStart2(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">SELESAI</Label>
                          <input type="time" value={scheduleTikrarTimeEnd2} onChange={e => setScheduleTikrarTimeEnd2(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Jadwal Pra-Tikrar */}
              {classPratikrar && (
                <div className="bg-blue-50/10 p-5 rounded-2xl border border-blue-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <h4 className="text-sm font-black text-blue-900 border-b border-blue-100 pb-1.5 flex items-center gap-1.5">
                    🗓️ Jadwal Kelas Pra-Tikrar
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Utama */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Jadwal Utama</Label>
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-white rounded-xl border border-blue-100/50">
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">HARI</Label>
                          <select value={schedulePratikrarDay} onChange={e => setSchedulePratikrarDay(e.target.value)} className="w-full text-xs h-7 border rounded bg-white mt-0.5 focus:outline-none">
                            <option value="">Hari</option>
                            {dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">MULAI</Label>
                          <input type="time" value={schedulePratikrarTimeStart} onChange={e => setSchedulePratikrarTimeStart(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">SELESAI</Label>
                          <input type="time" value={schedulePratikrarTimeEnd} onChange={e => setSchedulePratikrarTimeEnd(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                      </div>
                    </div>
                    {/* Cadangan */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jadwal Cadangan</Label>
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-white rounded-xl border border-gray-100">
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">HARI</Label>
                          <select value={schedulePratikrarDay2} onChange={e => setSchedulePratikrarDay2(e.target.value)} className="w-full text-xs h-7 border rounded bg-white mt-0.5 focus:outline-none">
                            <option value="">Hari</option>
                            {dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">MULAI</Label>
                          <input type="time" value={schedulePratikrarTimeStart2} onChange={e => setSchedulePratikrarTimeStart2(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">SELESAI</Label>
                          <input type="time" value={schedulePratikrarTimeEnd2} onChange={e => setSchedulePratikrarTimeEnd2(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Jadwal Berbayar */}
              {classPaid && (
                <div className="bg-amber-50/10 p-5 rounded-2xl border border-amber-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <h4 className="text-sm font-black text-amber-900 border-b border-amber-100 pb-1.5 flex items-center gap-1.5">
                    🗓️ Jadwal Kelas Berbayar
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Utama */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Jadwal Utama</Label>
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-white rounded-xl border border-amber-100/50">
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">HARI</Label>
                          <select value={schedulePaidDay} onChange={e => setSchedulePaidDay(e.target.value)} className="w-full text-xs h-7 border rounded bg-white mt-0.5 focus:outline-none">
                            <option value="">Hari</option>
                            {dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">MULAI</Label>
                          <input type="time" value={schedulePaidTimeStart} onChange={e => setSchedulePaidTimeStart(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">SELESAI</Label>
                          <input type="time" value={schedulePaidTimeEnd} onChange={e => setSchedulePaidTimeEnd(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                      </div>
                    </div>
                    {/* Cadangan */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jadwal Cadangan</Label>
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-white rounded-xl border border-gray-100">
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">HARI</Label>
                          <select value={schedulePaidDay2} onChange={e => setSchedulePaidDay2(e.target.value)} className="w-full text-xs h-7 border rounded bg-white mt-0.5 focus:outline-none">
                            <option value="">Hari</option>
                            {dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">MULAI</Label>
                          <input type="time" value={schedulePaidTimeStart2} onChange={e => setSchedulePaidTimeStart2(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                        <div>
                          <Label className="text-[9px] text-gray-400 font-bold">SELESAI</Label>
                          <input type="time" value={schedulePaidTimeEnd2} onChange={e => setSchedulePaidTimeEnd2(e.target.value)} className="w-full text-xs h-7 border rounded px-1 mt-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200"
          >
            {isSaving ? <span className="animate-spin text-lg leading-none">⟳</span> : null}
            {isSaving ? 'Menyimpan...' : 'Simpan Akad'}
          </button>
        </div>
      </div>
    </div>
  );
}
