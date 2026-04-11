'use client';

import { 
  X, 
  User, 
  Clock, 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin,
  CheckCircle,
  AlertCircle,
  History
} from 'lucide-react';
import { MuallimahRegistration } from './types';
import { cn } from '@/lib/utils';
import { useMuallimahRegistrations } from '@/lib/hooks/useAdminData';

interface MuallimahDetailModalProps {
  registration: MuallimahRegistration;
  isOpen: boolean;
  onClose: () => void;
}

export function MuallimahDetailModal({ registration, isOpen, onClose }: MuallimahDetailModalProps) {
  // Fetch registration history for this user
  const { 
    registrations: history, 
    isLoading: historyLoading 
  } = useMuallimahRegistrations(isOpen, { userId: registration.user_id });

  if (!isOpen) return null;

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'approved': return { label: 'DISETUJUI', color: 'bg-green-100 text-green-700' };
      case 'rejected': return { label: 'DITOLAK', color: 'bg-red-100 text-red-700' };
      case 'review': return { label: 'DALAM REVIEW', color: 'bg-blue-100 text-blue-700' };
      case 'waitlist': return { label: 'WAITLIST', color: 'bg-amber-100 text-amber-700' };
      default: return { label: 'PENDING', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const status = getStatusDisplay(registration.status);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-white">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-emerald-900 to-green-800 p-8 flex flex-col items-center text-white relative">
          <button onClick={onClose} className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="h-6 w-6" />
          </button>
          
          <div className="h-24 w-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden mb-4 shadow-xl">
            <User className="h-12 w-12 opacity-50" />
          </div>
          
          <h2 className="text-2xl font-black tracking-tight">{registration.full_name}</h2>
          <div className="flex gap-2 mt-3">
            <span className={cn("px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/20", status.color.replace('bg-', 'bg-white/10 text-'))}>
              {status.label}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black tracking-[0.2em] uppercase border border-white/20">
              {registration.batch?.name || 'REGISTRASI'}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          {/* Section: Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="h-1 w-4 bg-emerald-600 rounded-full" />
                Informasi Kontak
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-gray-50 text-emerald-600"><Phone className="h-4 w-4" /></div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp</div>
                    <div className="font-bold text-gray-900">{registration.whatsapp}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-gray-50 text-blue-600"><Mail className="h-4 w-4" /></div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Email</div>
                    <div className="font-bold text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">{registration.email}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-gray-50 text-amber-600"><MapPin className="h-4 w-4" /></div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Alamat</div>
                    <div className="font-bold text-gray-900 leading-relaxed">{registration.address}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="h-1 w-4 bg-emerald-600 rounded-full" />
                Profil Muallimah
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-gray-50 text-purple-600"><Calendar className="h-4 w-4" /></div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">TTL</div>
                    <div className="font-bold text-gray-900">{registration.birth_place}, {new Date(registration.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-gray-50 text-indigo-600"><Briefcase className="h-4 w-4" /></div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Pekerjaan</div>
                    <div className="font-bold text-gray-900">{registration.occupation}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-gray-50 text-rose-600"><GraduationCap className="h-4 w-4" /></div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Pendidikan</div>
                    <div className="font-bold text-gray-900">{registration.education}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section: Quran expertise */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="h-1 w-4 bg-emerald-600 rounded-full" />
              Kompetensi & Hafalan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-emerald-50/50 p-6 rounded-[24px] border border-emerald-100/50">
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Level Hafalan</div>
                <div className="text-lg font-black text-emerald-700">{registration.memorization_level}</div>
              </div>
              <div className="text-center md:border-x border-emerald-100 px-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Jumlah Juz</div>
                <div className="text-lg font-black text-emerald-700">{registration.memorized_juz} Juz</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Program Pilihan</div>
                <div className="text-lg font-black text-emerald-700">{registration.preferred_juz}</div>
              </div>
            </div>
          </div>

          {/* Section: Teaching Exp */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="h-1 w-4 bg-emerald-600 rounded-full" />
              Pengalaman Mengajar
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 rounded-xl bg-white text-emerald-600 shadow-sm"><BookOpen className="h-4 w-4" /></div>
                     <span className="text-sm font-black text-gray-900">{registration.teaching_years || '0'} Tahun Pengalaman</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                   "{registration.teaching_experience}"
                </p>
                {registration.teaching_institutions && (
                  <div className="mt-4 pt-4 border-t border-gray-200/50">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Institusi Sebelumnya:</div>
                    <div className="text-sm font-bold text-gray-800">{registration.teaching_institutions}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Schedule */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="h-1 w-4 bg-emerald-600 rounded-full" />
              Preferensi Jam Mengajar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><Clock className="h-5 w-5" /></div>
                  <div>
                    <div className="text-[10px] font-bold text-blue-400 uppercase">Jadwal Utama</div>
                    <div className="text-sm font-black text-blue-900">{registration.preferred_schedule}</div>
                  </div>
               </div>
               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center"><Clock className="h-5 w-5" /></div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Jadwal Cadangan</div>
                    <div className="text-sm font-black text-slate-900">{registration.backup_schedule}</div>
                  </div>
               </div>
            </div>
          </div>

          {/* Registration History */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="h-1 w-4 bg-emerald-600 rounded-full" />
              Riwayat Pendaftaran
            </h3>
            
            <div className="space-y-2">
              {historyLoading ? (
                <div className="flex items-center gap-3 text-gray-400 p-4 bg-gray-50 rounded-2xl animate-pulse">
                  <History className="h-4 w-4 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Memuat Riwayat...</span>
                </div>
              ) : history.length <= 1 ? (
                <div className="text-xs font-bold text-gray-400 italic p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  Ini adalah pendaftaran pertama user ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {history.map((h: any) => (
                    <div key={h.id} className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all",
                      h.id === registration.id ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100 opacity-60"
                    )}>
                       <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center",
                            h.status === 'approved' ? "bg-green-100 text-green-600" :
                            h.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-500"
                          )}>
                             <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                             <div className="text-xs font-black text-gray-900">{h.batch?.name || 'Unknown Batch'}</div>
                             <div className="text-[10px] font-bold text-gray-400 capitalize">{h.status} • {new Date(h.submitted_at).toLocaleDateString('id-ID')}</div>
                          </div>
                       </div>
                       {h.id === registration.id && (
                         <span className="text-[8px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Current</span>
                       )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Motivation */}
          {registration.motivation && (
             <div className="space-y-4">
               <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Motivasi</h3>
               <p className="text-sm text-gray-700 italic bg-gray-50 p-8 rounded-[32px] leading-relaxed border border-gray-100 shadow-inner">
                  "{registration.motivation}"
               </p>
             </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            <Clock className="h-3 w-3" />
            Terdaftar: {new Date(registration.submitted_at).toLocaleString('id-ID')}
          </div>
          <button
            onClick={onClose}
            className="px-10 py-3 bg-emerald-900 text-white text-xs font-black rounded-2xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            TUTUP DETAIL
          </button>
        </div>
      </div>
      
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
