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
  History,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { MuallimahRegistration } from './types';
import { cn } from '@/lib/utils';
import { useMuallimahRegistrations } from '@/lib/hooks/useAdminData';
import { getWhatsAppUrl } from '@/lib/utils/whatsapp';

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
      case 'approved': return { label: 'DISETUJUI', color: 'bg-green-100 text-green-700', border: 'border-green-200' };
      case 'rejected': return { label: 'DITOLAK', color: 'bg-red-100 text-red-700', border: 'border-red-200' };
      case 'review': return { label: 'REVIEW', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' };
      case 'waitlist': return { label: 'WAITLIST', color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' };
      default: return { label: 'PENDING', color: 'bg-gray-100 text-gray-700', border: 'border-gray-200' };
    }
  };

  const status = getStatusDisplay(registration.status);

  // Helper to format JSON schedule into readable text
  const formatScheduleText = (scheduleStr: string | null | undefined) => {
    if (!scheduleStr) return '-';
    if (!scheduleStr.startsWith('{') && !scheduleStr.startsWith('[')) return scheduleStr;

    try {
      const schedule = JSON.parse(scheduleStr);
      const items = Array.isArray(schedule) ? schedule : [schedule];
      
      return items.map((item: any) => {
        const day = item.day ? item.day.charAt(0).toUpperCase() + item.day.slice(1) : '';
        const time = item.time_start && item.time_end ? `${item.time_start} - ${item.time_end}` : '';
        return `${day}${time ? ` (${time})` : ''}`;
      }).join(', ');
    } catch {
      return scheduleStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[94vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-gray-100">
        
        {/* Header Section - ULTRA SLIM VERSION */}
        <div className="bg-emerald-900 px-6 py-4 text-white relative flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              <User className="h-5 w-5 opacity-70" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-tight leading-none truncate">
                {registration.full_name}
              </h2>
              <div className="flex gap-2 mt-1">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase border",
                  status.label === 'DISETUJUI' ? "bg-green-500/20 text-green-300 border-green-500/30" :
                  status.label === 'DITOLAK' ? "bg-red-500/20 text-red-300 border-red-500/30" :
                  "bg-white/10 text-white/70 border-white/20"
                )}>
                  {status.label}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-emerald-200 text-[8px] font-black tracking-widest uppercase border border-white/10">
                  {registration.batch?.name || 'REGISTRASI'}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Contact Info Card */}
             <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 flex flex-col gap-4">
                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <Phone className="h-3 w-3" /> Kontak
                </h3>
                <div className="space-y-4">
                   <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">WhatsApp</div>
                      <a 
                        href={getWhatsAppUrl(registration.whatsapp, registration.full_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-all border border-emerald-100 inline-flex items-center gap-1.5 hover:bg-emerald-100"
                      >
                        {registration.whatsapp}
                        <MessageSquare className="h-3 w-3" />
                      </a>
                   </div>
                   <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Email</div>
                      <div className="text-xs font-black text-gray-800 break-all leading-relaxed whitespace-pre-wrap">{registration.email}</div>
                   </div>
                   <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Alamat</div>
                      <div className="text-xs font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">{registration.address}</div>
                   </div>
                </div>
             </div>

             {/* Personal Profile Card */}
             <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 flex flex-col gap-4">
                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <User className="h-3 w-3" /> Profil
                </h3>
                <div className="space-y-4">
                   <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">TTL</div>
                      <div className="text-xs font-black text-gray-800 leading-relaxed">
                        {registration.birth_place}, {new Date(registration.birth_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                   </div>
                   <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Pekerjaan</div>
                      <div className="text-xs font-black text-gray-800 leading-relaxed">{registration.occupation}</div>
                   </div>
                   <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Pendidikan</div>
                      <div className="text-xs font-black text-gray-800 leading-relaxed">{registration.education}</div>
                   </div>
                </div>
             </div>
          </div>

          {/* Kompetensi Section */}
          <div className="bg-emerald-50 p-6 rounded-[24px] border border-emerald-100 flex flex-wrap items-center justify-between gap-6 text-center shadow-sm">
             <div className="flex-1">
                <div className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest mb-1">Level Hafalan</div>
                <div className="text-base font-black text-emerald-900">{registration.memorization_level}</div>
             </div>
             <div className="h-8 w-px bg-emerald-200/50 hidden md:block" />
             <div className="flex-1">
                <div className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest mb-1">Total Hafalan</div>
                <div className="text-base font-black text-emerald-900">{registration.memorized_juz} Juz</div>
             </div>
             <div className="h-8 w-px bg-emerald-200/50 hidden md:block" />
             <div className="flex-1">
                <div className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest mb-1">Target Program</div>
                <div className="text-base font-black text-emerald-900">{registration.preferred_juz}</div>
             </div>
          </div>

          {/* Experience Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <BookOpen className="h-3 w-3" /> Pengalaman Mengajar
            </h3>
            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm">
               <div className="flex items-center gap-2 mb-3 bg-emerald-50 w-fit px-3 py-1 rounded-full text-emerald-700">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{registration.teaching_years || '0'} Tahun Dedikasi</span>
               </div>
               <p className="text-sm text-gray-700 leading-relaxed italic font-medium whitespace-pre-wrap">
                  "{registration.teaching_experience}"
               </p>
               {registration.teaching_institutions && (
                 <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
                   <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Lembaga: <span className="text-gray-900">{registration.teaching_institutions}</span></div>
                 </div>
               )}
            </div>
          </div>

          {/* Schedule Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <Clock className="h-3 w-3" /> Preferensi Waktu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Clock className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <div className="text-[8px] font-black text-blue-400 uppercase tracking-tighter line-height-none mb-0.5">Jadwal Utama</div>
                    <div className="text-xs font-bold text-blue-900 break-words">{formatScheduleText(registration.preferred_schedule)}</div>
                  </div>
               </div>
               <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white text-slate-400 flex items-center justify-center shrink-0 shadow-sm"><Clock className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter line-height-none mb-0.5">Jadwal Cadangan</div>
                    <div className="text-xs font-bold text-slate-900 break-words">{formatScheduleText(registration.backup_schedule)}</div>
                  </div>
               </div>
            </div>
          </div>

          {/* Registration History */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <History className="h-3 w-3" /> Riwayat
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {historyLoading ? (
                <div className="h-12 w-full bg-gray-50 rounded-xl animate-pulse" />
              ) : history.length <= 1 ? (
                <div className="text-[9px] font-bold text-gray-400 bg-gray-50 w-full p-4 italic text-center rounded-xl border border-dashed border-gray-200">
                  Pendaftaran Pertama
                </div>
              ) : (
                history.map((h: any) => (
                  <div key={h.id} className={cn(
                    "flex-shrink-0 w-36 p-3 rounded-xl border transition-all",
                    h.id === registration.id ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/10" : "bg-white border-gray-100 opacity-60"
                  )}>
                     <div className="text-[9px] font-black text-gray-900 truncate mb-1">{h.batch?.name || 'Batch'}</div>
                     <span className={cn(
                        "text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                        h.status === 'approved' ? "bg-green-100 text-green-700" :
                        h.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
                     )}>{h.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Motivation Quote */}
          {registration.motivation && (
             <div className="pt-2">
                <div className="bg-emerald-900 p-6 rounded-[28px] shadow-xl text-center relative overflow-hidden">
                   <div className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2 opacity-60">Motivasi Muallimah</div>
                   <p className="text-white text-sm leading-relaxed font-bold italic whitespace-pre-wrap">
                      "{registration.motivation}"
                   </p>
                </div>
             </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-tighter">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            {new Date(registration.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-emerald-900 text-white text-[10px] font-black tracking-widest rounded-xl hover:bg-black transition-all shadow-md active:scale-95 uppercase"
          >
            Selesai
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
