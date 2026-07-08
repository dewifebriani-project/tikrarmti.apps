'use client';

import { Award, Clock, CheckCircle, XCircle, Info, Edit, Trash2, Undo2, MessageSquare, AlertCircle, FileText, Mic } from 'lucide-react';
import { TikrarTahfidz } from './types';
import { cn } from '@/lib/utils';

interface TikrarTableProps {
  tikrar: TikrarTahfidz[];
  isLoading: boolean;
  onAction: (action: 'review' | 'edit' | 'delete' | 'unapprove', data: TikrarTahfidz) => void;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
}

export function TikrarTable({ 
  tikrar, 
  isLoading, 
  onAction, 
  selectedIds, 
  onSelectAll, 
  onSelectOne 
}: TikrarTableProps) {
  
  const isSelected = (id: string) => selectedIds.includes(id);
  const isAllSelected = tikrar.length > 0 && tikrar.every(t => t.status !== 'pending' || isSelected(t.id));

  const getWhatsAppUrl = (t: TikrarTahfidz) => {
    const contactNumber = t.wa_phone || t.user?.whatsapp;
    if (!contactNumber) return null;

    let phoneNumber = contactNumber.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('62')) {
      phoneNumber = '62' + phoneNumber;
    }

    const userName = t.full_name || t.user?.full_name || 'Ukhti';
    const batchName = t.batch_name || t.batch?.name || '';
    const message = `Assalamu'alaikum warahmatullahi wabarakatuh, Ukhti ${userName}\n\nBarakallahu fiik atas pendaftaran Ukhti di *Program Tikrar Tahfidz MTI*${batchName ? ` (${batchName})` : ''} 🌙\n\nKami dari Markaz Tikrar Indonesia ingin menginformasikan mengenai status pendaftaran Ukhti...`;
    
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  const checkReadiness = (t: TikrarTahfidz) => {
    const missingFields: string[] = [];
    if (!t.understands_commitment) missingFields.push('Memahami komitmen');
    if (!t.tried_simulation) missingFields.push('Mencoba simulasi');
    if (!t.no_negotiation) missingFields.push('Tidak ada negosiasi');
    if (!t.has_telegram) missingFields.push('Punya Telegram');
    if (!t.saved_contact) missingFields.push('Simpan kontak');
    if (!t.has_permission) missingFields.push('Punya izin');
    if (!t.chosen_juz) missingFields.push('Juz yang dipilih');
    if (!t.main_time_slot) missingFields.push('Waktu setoran utama');
    
    return {
      isReady: missingFields.length === 0,
      missingFields
    };
  };

  if (isLoading && tikrar.length === 0) {
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
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Thalibah</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Tgl Daftar</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Readiness</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Infaq / Kader</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Juz & Slot</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Nilai VN</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tikrar.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">
                  Tidak ada pendaftaran Tikrar ditemukan.
                </td>
              </tr>
            ) : (
              tikrar.map((t) => {
                const readiness = checkReadiness(t);
                const waUrl = getWhatsAppUrl(t);
                
                return (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => onAction('review', t)}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline text-left truncate"
                          >
                            {t.full_name || t.user?.full_name || 'Hamba Allah'}
                          </button>
                          {t.isAlumni ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100 select-none">
                              Alumni
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-gray-50 text-gray-400 border border-gray-100 select-none">
                              Baru
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-550 truncate">{t.user?.email || '-'}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">{t.batch_name || t.batch?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-bold">{t.submission_date ? new Date(t.submission_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{t.submission_date ? new Date(t.submission_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {readiness.isReady ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5 select-none">
                          <CheckCircle className="h-3.5 w-3.5" />
                          READY
                        </span>
                      ) : (
                        <div className="relative group/tooltip inline-block cursor-help">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-full px-2.5 py-0.5 select-none">
                            <Info className="h-3.5 w-3.5" />
                            {readiness.missingFields.length} LEWAT
                          </span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-48 p-3 bg-gray-900/95 backdrop-blur-sm text-white text-[10px] font-medium rounded-xl shadow-xl z-50 leading-relaxed border border-gray-800 animate-in fade-in slide-in-from-bottom-1">
                            <p className="font-bold text-red-400 mb-1">Belum Terisi:</p>
                            <ul className="list-disc pl-3.5 space-y-0.5">
                              {readiness.missingFields.slice(0, 5).map((f, i) => <li key={i}>{f}</li>)}
                              {readiness.missingFields.length > 5 && <li>...dan {readiness.missingFields.length - 5} lainnya</li>}
                            </ul>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-700">Juz {t.chosen_juz || '-'}</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-tight font-medium">{t.main_time_slot || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Oral VN</span>
                        {t.oral_total_score !== null && t.oral_total_score !== undefined ? (
                          <span className={cn(
                            "text-sm font-black",
                            t.oral_total_score >= 80 ? "text-emerald-600" : "text-red-600"
                          )}>
                            {t.oral_total_score.toFixed(0)}
                          </span>
                        ) : t.oral_submission_url || t.oral_submitted_at ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5 mt-0.5 w-fit" title="Sudah mengirim rekaman (VN) - Menunggu penilaian">
                            <Mic className="h-2.5 w-2.5 text-emerald-600" />
                            ✓ VN
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 font-bold italic">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider select-none">Seleksi VN</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit border",
                          t.selection_status === 'selected' ? "bg-blue-50 text-blue-700 border-blue-100" :
                          t.selection_status === 'not_selected' ? "bg-orange-50 text-orange-700 border-orange-100" :
                          "bg-white text-gray-400 border-gray-100"
                        )}>
                          {t.selection_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {waUrl && (
                          <a 
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs flex items-center gap-1.5 transition-colors border border-emerald-100"
                            title="Chat via WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Chat
                          </a>
                        )}
                        <button
                          onClick={() => onAction('review', t)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs flex items-center gap-1.5 transition-colors border border-blue-100"
                          title="Review Detail"
                        >
                          <FileText className="h-4 w-4" />
                          Detail
                        </button>
                        <button
                          onClick={() => onAction('edit', t)}
                          className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-xs flex items-center gap-1.5 transition-colors border border-gray-100"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => onAction('delete', t)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium text-xs flex items-center gap-1.5 transition-colors border border-red-100"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
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
