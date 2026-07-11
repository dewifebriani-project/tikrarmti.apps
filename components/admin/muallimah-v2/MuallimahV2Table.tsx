'use client';

import { Award, Clock, CheckCircle, XCircle, Info, Edit, Trash2, Undo2, MessageSquare, AlertCircle, FileText } from 'lucide-react';
import { MuallimahV2Type } from './types';
import { cn } from '@/lib/utils';

interface MuallimahV2TableProps {
  muallimah: MuallimahV2Type[];
  isLoading: boolean;
  onAction: (action: 'review' | 'edit' | 'delete' | 'unapprove', data: MuallimahV2Type) => void;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
}

export function MuallimahV2Table({ 
  muallimah, 
  isLoading, 
  onAction, 
  selectedIds, 
  onSelectAll, 
  onSelectOne 
}: MuallimahV2TableProps) {
  
  const isSelected = (id: string) => selectedIds.includes(id);
  const isAllSelected = muallimah.length > 0 && muallimah.every(t => t.status !== 'pending' || isSelected(t.id));

  const getWhatsAppUrl = (t: MuallimahV2Type) => {
    const contactNumber = t.whatsapp || t.user?.whatsapp;
    if (!contactNumber) return null;

    let phoneNumber = contactNumber.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('62')) {
      phoneNumber = '62' + phoneNumber;
    }

    const userName = t.full_name || t.user?.full_name || 'Ukhti';
    const batchName = t.batch?.name || '';
    const message = `Assalamu'alaikum warahmatullahi wabarakatuh, Ustadzah ${userName}\n\nBarakallahu fiik atas kesediaan Anda untuk mengajar di *Markaz Tikrar Indonesia*${batchName ? ` (${batchName})` : ''} 🌙\n\nKami ingin menginformasikan mengenai status Anda...`;
    
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  const checkReadiness = (t: MuallimahV2Type) => {
    const missingFields: string[] = [];
    if (!t.understands_commitment) missingFields.push('Menyetujui akad');
    if (!t.class_type) missingFields.push('Tipe Kelas');
    if (!t.preferred_juz) missingFields.push('Pilihan Juz');
    if (!t.preferred_schedule) missingFields.push('Jadwal');
    
    return {
      isReady: missingFields.length === 0,
      missingFields
    };
  };

  if (isLoading && muallimah.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-50 border-b border-gray-100" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-100 mx-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Muallimah</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Daftar</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kesiapan Data</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas & Juz</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Jadwal Utama</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {muallimah.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
                  Tidak ada data Muallimah ditemukan.
                </td>
              </tr>
            ) : (
              muallimah.map((t) => {
                const readiness = checkReadiness(t);
                const waUrl = getWhatsAppUrl(t);
                
                // Parse jadwal
                let schedule = { day: '-', time_start: '-', time_end: '-' };
                let isNewFormat = false;
                let scheduleObj: any = null;
                
                if (t.preferred_schedule) {
                  try {
                    const parsed = typeof t.preferred_schedule === 'string' 
                      ? JSON.parse(t.preferred_schedule) 
                      : t.preferred_schedule;
                    
                    if (parsed) {
                      if (parsed.tikrar || parsed.pra_tahfidz || parsed.berbayar) {
                        isNewFormat = true;
                        scheduleObj = parsed;
                      } else if (parsed.day) {
                        schedule = parsed;
                      }
                    }
                  } catch (e) { }
                }

                // Ambil jadwal representatif untuk ditampilkan di kolom tabel
                if (isNewFormat && scheduleObj) {
                  const firstProgram = scheduleObj.tikrar || scheduleObj.pra_tahfidz || scheduleObj.berbayar;
                  if (firstProgram && firstProgram.day) {
                    schedule = {
                      day: firstProgram.day || '-',
                      time_start: firstProgram.time_start || '-',
                      time_end: firstProgram.time_end || '-'
                    };
                  }
                }
                
                const classTypesList: string[] = [];
                const rawTypes = (t.class_type || '').split(', ').map(type => type.trim().toLowerCase());
                
                if (rawTypes.includes('tikrar_tahfidz')) {
                  classTypesList.push('Tikrar');
                }
                if (rawTypes.includes('pra_tahfidz')) {
                  classTypesList.push('Pra-Tikrar');
                }
                if (t.paid_class_scheme && t.paid_class_scheme !== 'none') {
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
                  
                const dayStr = (schedule && schedule.day && schedule.day !== '-') 
                  ? String(schedule.day).charAt(0).toUpperCase() + String(schedule.day).slice(1).toLowerCase() 
                  : '-';
                  
                const statusStr = (t.status || 'pending').toUpperCase();

                return (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      {t.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={isSelected(t.id)}
                          onChange={(e) => onSelectOne(t.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col min-w-0">
                        <button
                          onClick={() => onAction('review', t)}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline text-left truncate"
                        >
                          {t.full_name || t.user?.full_name || 'Hamba Allah'}
                        </button>
                        <span className="text-xs text-gray-500 truncate">{t.email || t.user?.email || '-'}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">{t.batch?.name || 'No Batch'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">
                        {t.submitted_at ? new Date(t.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : (t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {readiness.isReady ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs" title="Semua data lengkap">
                          <CheckCircle className="h-4 w-4" />
                          <span>READY</span>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-1.5 text-red-500 font-bold text-xs cursor-help group/ready relative"
                          title={`Belum lengkap: ${readiness.missingFields.join(', ')}`}
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span>INCOMPLETE</span>
                          
                          <div className="invisible group-hover/ready:visible absolute z-50 left-0 top-6 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-lg">
                            <ul className="list-disc list-inside space-y-0.5">
                              {readiness.missingFields.slice(0, 5).map((f, i) => <li key={i}>{f}</li>)}
                              {readiness.missingFields.length > 5 && <li>...dan {readiness.missingFields.length - 5} lainnya</li>}
                            </ul>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-700">{classTypeStr}</span>
                        <span className="text-[10px] text-gray-500 font-medium">Juz: {t.preferred_juz || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-700">{dayStr}</span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {schedule.time_start && schedule.time_start !== '-' && schedule.time_end && schedule.time_end !== '-'
                            ? `${schedule.time_start} - ${schedule.time_end}`
                            : 'Jam belum diisi'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider w-fit",
                        t.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                        t.status === 'rejected' ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {statusStr}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {waUrl && (
                          <a 
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm border border-emerald-100"
                            title="Chat via WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4 shrink-0" />
                            <span className="hidden lg:inline">Chat</span>
                          </a>
                        )}
                        <button
                          onClick={() => onAction('review', t)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm border border-blue-100"
                          title="Review Detail"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="hidden lg:inline">Review</span>
                        </button>
                        <button
                          onClick={() => onAction('edit', t)}
                          className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm border border-gray-200"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 shrink-0" />
                          <span className="hidden lg:inline">Edit</span>
                        </button>
                        {t.status === 'approved' && (
                          <button
                            onClick={() => onAction('unapprove', t)}
                            className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm border border-orange-100"
                            title="Batalkan Persetujuan"
                          >
                            <Undo2 className="h-4 w-4 shrink-0" />
                            <span className="hidden lg:inline">Batal</span>
                          </button>
                        )}
                        <button
                          onClick={() => onAction('delete', t)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm border border-red-100"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4 shrink-0" />
                          <span className="hidden lg:inline">Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
