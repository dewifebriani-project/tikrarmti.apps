'use client';

import { Eye, FileText, RefreshCw, RotateCcw, MessageSquare, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
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

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      submitted: 'bg-blue-50 text-blue-700 border-blue-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };

    const labels = {
      draft: 'Draft',
      submitted: 'Submitted',
      approved: 'Approved',
      rejected: 'Rejected',
    };

    return (
      <span className={cn(
        "px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-sm",
        styles[status as keyof typeof styles] || styles.draft
      )}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getPartnerLabel = (submission: DaftarUlangSubmission) => {
    if (submission.partner_type === 'self_match' && submission.partner_user) {
      return submission.partner_user.full_name || submission.partner_user_id || '-';
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
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Test Tertulis</th>
              <th 
                className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => onSort('halaqah')}
              >
                <div className="flex items-center gap-2">Halaqah {getSortIcon('halaqah')}</div>
              </th>
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
                    {submission.registration?.written_quiz_score !== null && submission.registration?.written_quiz_score !== undefined ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">
                          {submission.registration.written_quiz_score}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Skor</span>
                      </div>
                    ) : submission.registration?.written_quiz_submitted_at || submission.registration?.written_exam_submitted_at ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5 mt-0.5 w-fit" title="Sudah mengerjakan test tertulis">
                        ✓ SELESAI
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 font-bold italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-medium text-gray-700 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 w-12">Ujian:</span> 
                        <span className={cn("font-bold", submission.ujian_halaqah?.name ? "text-blue-700" : "text-gray-900")}>
                          {submission.ujian_halaqah?.name || (submission.is_tashih_umum ? '-' : 'Belum pilih')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 w-12">Tashih:</span> 
                        <span className={cn("font-bold", submission.is_tashih_umum || submission.tashih_halaqah?.name ? "text-purple-700" : "text-gray-900")}>
                          {submission.is_tashih_umum ? 'Umum' : (submission.tashih_halaqah?.name || 'Belum pilih')}
                        </span>
                      </div>
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
                    {getStatusBadge(submission.status)}
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
