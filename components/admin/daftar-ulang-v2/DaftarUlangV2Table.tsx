'use client';

import { Eye, FileText, RefreshCw, RotateCcw, MessageSquare, ArrowUp, ArrowDown, ArrowUpDown, Heart, CheckCircle, XCircle } from 'lucide-react';
import { DaftarUlangSubmission } from './types';
import { getWhatsAppUrl } from '@/lib/utils/whatsapp';
import { cn } from '@/lib/utils';

interface DaftarUlangV2TableProps {
  submissions: DaftarUlangSubmission[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onViewDetail: (submission: DaftarUlangSubmission) => void;
  onResetHalaqah: (submissionId: string) => void;
  onRevertToDraft: (submissionId: string) => void;
  onApprove: (submissionId: string) => void;
  onUnapprove: (submissionId: string) => void;
  resettingId: string | null;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function DaftarUlangV2Table({
  submissions,
  isLoading,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onViewDetail,
  onResetHalaqah,
  onRevertToDraft,
  onApprove,
  onUnapprove,
  resettingId,
  sortField,
  sortOrder,
  onSort,
}: DaftarUlangV2TableProps) {
  
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

  const renderStatusDropdown = (submission: DaftarUlangSubmission) => {
    const status = submission.status;
    const styles = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      submitted: 'bg-blue-50 text-blue-700 border-blue-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
      <div className="relative inline-block">
        <select
          value={status}
          disabled={resettingId === submission.id}
          onChange={(e) => {
            const newStatus = e.target.value;
            if (newStatus === status) return;
            
            if (newStatus === 'approved' && status === 'submitted') {
              onApprove(submission.id);
            } else if (newStatus === 'submitted' && status === 'approved') {
              onUnapprove(submission.id);
            } else if (newStatus === 'draft' && (status === 'submitted' || status === 'approved')) {
              if (window.confirm('Yakin ingin mengembalikan ke Draft?')) {
                onRevertToDraft(submission.id);
              } else {
                e.target.value = status;
              }
            } else {
              e.target.value = status;
              window.alert('Transisi status tidak valid.');
            }
          }}
          className={cn(
            "appearance-none px-2.5 py-1 pr-6 rounded-lg text-[11px] font-bold border shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50",
            styles[status as keyof typeof styles] || styles.draft
          )}
        >
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
        </select>
        {resettingId === submission.id ? (
          <RefreshCw className="w-3 h-3 animate-spin absolute right-1.5 top-1/2 -translate-y-1/2 text-current opacity-70 pointer-events-none" />
        ) : (
          <ArrowUpDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-current opacity-50 pointer-events-none" />
        )}
      </div>
    );
  };

  const getPartnerLabel = (submission: DaftarUlangSubmission) => {
    if (submission.partner_type === 'self_match') {
      return (
        <div className="flex items-center gap-1.5">
          <span>{submission.partner_user?.full_name || (submission.partner_user_id ? 'User Deleted / Not Found' : '-')}</span>
          {submission.is_mutual_match && (
            <span title="Mutual Self Match (Jodoh)" className="inline-flex">
              <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
            </span>
          )}
        </div>
      );
    }
    if (submission.partner_type === 'family' || submission.partner_type === 'tarteel') {
      return submission.partner_name || '-';
    }
    if (submission.partner_type === 'system_match') {
      return 'System Match';
    }
    return '-';
  };

  const getWhatsAppButton = (phoneNumber?: string, name?: string) => {
    if (!phoneNumber) return null;

    const whatsappUrl = getWhatsAppUrl(
      phoneNumber, 
      name, 
      `Assalamu'alaikum ${name || 'Thalibah'},\n\nIni adalah pesan dari admin Markaz Tikrar Indonesia terkait pendaftaran ulang Program Tikrar Tahfidz MTI.\n\nJazakillahu khairan`
    );

    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center p-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all"
        title={`WhatsApp ${phoneNumber}`}
      >
        <MessageSquare className="w-4 h-4" />
      </a>
    );
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> 
      : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Tidak ada data daftar ulang ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden relative">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={submissions.length > 0 && selectedIds.size === submissions.length}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                />
              </th>
              <th 
                className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center gap-2">Thalibah {getSortIcon('name')}</div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Partner</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Score Test</th>
              <th 
                className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => onSort('halaqah')}
              >
                <div className="flex items-center gap-2">Halaqah {getSortIcon('halaqah')}</div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pengabdian</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Akad Files</th>
              <th 
                className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => onSort('status')}
              >
                <div className="flex items-center gap-2">Status {getSortIcon('status')}</div>
              </th>
              <th 
                className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => onSort('submitted_at')}
              >
                <div className="flex items-center gap-2">Submitted {getSortIcon('submitted_at')}</div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kontak</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.map((submission) => {
              const isSelected = selectedIds.has(submission.id);
              return (
                <tr 
                  key={submission.id} 
                  className={cn(
                    "hover:bg-blue-50/30 transition-colors group",
                    isSelected ? "bg-blue-50/50" : "bg-white"
                  )}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectOne(submission.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {submission.confirmed_full_name || submission.user?.full_name || '-'}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1.5">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded-md text-gray-600">
                          Juz {submission.confirmed_chosen_juz || '-'}
                          {submission.registration?.final_juz ? ` (Turun ke: ${submission.registration.final_juz})` : ''}
                        </span>
                        <span>{submission.confirmed_main_time_slot || '-'}</span>
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">
                      {getPartnerLabel(submission)}
                    </div>
                    <div className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mt-0.5">
                      {submission.partner_type ? submission.partner_type.replace('_', ' ') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      {/* Kuis Akad (Fase 3) */}
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">
                          {submission.akad_quiz?.score ?? '-'}
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">KUIS AKAD (F3)</span>
                      </div>

                      {/* Ujian Tulis (Fase 3 Placement) */}
                      <div className="flex flex-col pl-3 border-l border-gray-100">
                        <span className="text-sm font-black text-gray-900 flex items-center gap-1">
                          {submission.registration?.exam_score ?? '-'}
                        </span>
                        <div className="flex flex-col mt-0.5">
                          <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">UJIAN TULIS (F3)</span>
                          {submission.registration?.exam_score == null && submission.is_alumni && (
                            <span className="text-[8px] text-blue-500 font-semibold">(Alumni)</span>
                          )}
                          {submission.registration?.exam_score == null && !submission.is_alumni && submission.registration?.chosen_juz?.startsWith('30') && (
                            <span className="text-[8px] text-orange-500 font-semibold">(Juz 30)</span>
                          )}
                        </div>
                      </div>

                      {/* Lisan / Oral */}
                      {submission.registration?.oral_total_score !== null && submission.registration?.oral_total_score !== undefined ? (
                        <div className="flex flex-col pl-3 border-l border-gray-100">
                          <span className="text-sm font-black text-blue-600">
                            {submission.registration.oral_total_score}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium">LISAN</span>
                        </div>
                      ) : (
                        <div className="flex flex-col pl-3 border-l border-gray-100">
                          <span className="text-xs text-gray-300 font-bold italic">N/A</span>
                          <span className="text-[9px] text-gray-400 font-medium mt-0.5">LISAN</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-medium text-gray-700">
                      <div className="flex flex-col gap-0.5">
                        <span className={cn("font-bold text-sm", submission.ujian_halaqah?.name ? "text-blue-700" : "text-gray-900")}>
                          {submission.ujian_halaqah?.name || 'Belum pilih'}
                        </span>
                        {submission.ujian_halaqah?.program?.batch?.name && (
                          <span className="text-orange-600 font-semibold text-[10px] bg-orange-50 w-fit px-1.5 py-0.5 rounded border border-orange-100">
                            {submission.ujian_halaqah.program.batch.name}
                          </span>
                        )}
                        {submission.ujian_halaqah?.muallimah_name && (
                          <span className="text-gray-500 text-[11px] mt-0.5">
                            {submission.ujian_halaqah.muallimah_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-medium text-gray-700">
                      {(() => {
                        const val = (submission.pengabdian_type || submission.pengabdian_choice || '').toLowerCase();
                        if (!val || val === '-' || val === 'tidak, qadarullah belum bisa.') {
                          return <span className="text-gray-400 italic">-</span>;
                        }
                        
                        if (val.includes('muallimah')) {
                          return (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                              Muallimah
                            </span>
                          );
                        }
                        if (val.includes('musyrifah')) {
                          return (
                            <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                              Musyrifah
                            </span>
                          );
                        }
                        if (val.includes('admin')) {
                          return (
                            <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                              Admin
                            </span>
                          );
                        }
                        if (val.includes('donasi') || val.includes('donatur')) {
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-1 rounded-md border border-amber-100 w-fit">
                                Donasi
                              </span>
                              {submission.donasi_amount && (
                                <span className="text-[11px] text-gray-600 font-medium">
                                  Rp {submission.donasi_amount.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                          );
                        }
                        
                        return (
                          <span className="text-gray-700 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                            {submission.pengabdian_type || submission.pengabdian_choice}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {submission.akad_files && submission.akad_files.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {submission.akad_files.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors w-max"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            File {idx + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Belum upload</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {renderStatusDropdown(submission)}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-600">
                    {formatDate(submission.submitted_at || submission.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    {getWhatsAppButton(
                      submission.user?.whatsapp,
                      submission.confirmed_full_name || submission.user?.full_name
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewDetail(submission)}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {submission.status === 'draft' && (submission.ujian_halaqah_id || submission.tashih_halaqah_id) && (
                        <button
                          onClick={() => onResetHalaqah(submission.id)}
                          disabled={resettingId === submission.id}
                          className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors disabled:opacity-50"
                          title="Reset Halaqah"
                        >
                          {resettingId === submission.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
