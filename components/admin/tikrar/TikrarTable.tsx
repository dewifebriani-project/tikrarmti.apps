'use client';

import { Award, Clock, CheckCircle, XCircle, Info, Edit, Trash2, Undo2, MessageSquare, AlertCircle, FileText } from 'lucide-react';
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
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thalibah</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Readiness</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Juz & Slot</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Scores</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tikrar.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
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
                      {t.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={isSelected(t.id)}
                          onChange={(e) => onSelectOne(t.id, e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
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
                        <span className="text-xs text-gray-500 truncate">{t.user?.email || '-'}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">{t.batch_name || t.batch?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {readiness.isReady ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs" title="Semua field lengkap">
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
                        <span className="text-xs font-bold text-gray-700">Juz {t.chosen_juz || '-'}</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-tight font-medium">{t.main_time_slot || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Oral</span>
                          {t.oral_total_score !== null && t.oral_total_score !== undefined ? (
                            <span className={cn(
                              "text-sm font-black",
                              t.oral_total_score >= 70 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {t.oral_total_score.toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 font-bold italic">N/A</span>
                          )}
                        </div>
                        <div className="w-px h-6 bg-gray-100" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Written</span>
                          {t.written_quiz_score !== null && t.written_quiz_score !== undefined ? (
                            <span className={cn(
                              "text-sm font-black",
                              t.written_quiz_score >= 70 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {t.written_quiz_score}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 font-bold italic">N/A</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit",
                          t.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                          t.status === 'rejected' ? "bg-red-100 text-red-700" :
                          t.status === 'withdrawn' ? "bg-gray-100 text-gray-600" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {t.status}
                        </span>
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
                            className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-100"
                            title="Chat via WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => onAction('review', t)}
                          className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-100"
                          title="Review Detail"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onAction('edit', t)}
                          className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors border border-gray-100"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {t.status === 'approved' && (
                          <button
                            onClick={() => onAction('unapprove', t)}
                            className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors border border-orange-100"
                            title="Batalkan Persetujuan"
                          >
                            <Undo2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onAction('delete', t)}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors border border-red-100"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
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
