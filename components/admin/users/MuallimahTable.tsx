'use client';

import { 
  User, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  BookOpen,
  Calendar,
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import { MuallimahRegistration } from './types';
import { cn } from '@/lib/utils';
import { getWhatsAppUrl } from '@/lib/utils/whatsapp';

interface MuallimahTableProps {
  registrations: MuallimahRegistration[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  onPageChange: (page: number) => void;
  onViewDetail?: (reg: MuallimahRegistration) => void;
}

export function MuallimahTable({ registrations, isLoading, pagination, onPageChange, onViewDetail }: MuallimahTableProps) {
  if (isLoading && registrations.length === 0) {
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

  const getStatusBadge = (status: MuallimahRegistration['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold">
            <AlertCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
            <Clock className="h-3 w-3" />
            Under Review
          </span>
        );
      case 'waitlist':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">
            <Clock className="h-3 w-3" />
            Waitlist
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pendaftar</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Quran Info</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Experience</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                  Belum ada data pendaftaran muallimah.
                </td>
              </tr>
            ) : (
              registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-gray-900 truncate">
                          {reg.full_name}
                        </span>
                        <a 
                          href={getWhatsAppUrl(reg.whatsapp, reg.full_name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded inline-block w-fit mt-0.5 hover:bg-emerald-100 transition-colors"
                          title="Chat WhatsApp"
                        >
                          {reg.whatsapp}
                        </a>
                        <span className="text-[10px] text-gray-400 truncate">{reg.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <BookOpen className="h-3 w-3 text-emerald-500" />
                        <span>Lev. {reg.memorization_level}</span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Hafalan: <span className="font-bold text-gray-700">{reg.memorized_juz} Juz</span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Pilihan: <span className="font-bold text-green-700">{reg.preferred_juz}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <GraduationCap className="h-3 w-3 text-blue-500" />
                        <span>Exp {reg.teaching_years || '0'} Tahun</span>
                      </div>
                      <span className="text-[10px] text-gray-400 italic truncate max-w-[150px]">
                        {reg.teaching_experience}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                       <Calendar className="h-3.5 w-3.5 text-gray-400" />
                       <span className="text-xs font-bold text-gray-700">
                          {reg.batch?.name || 'Unknown Batch'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(reg.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a 
                        href={getWhatsAppUrl(reg.whatsapp, reg.full_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all border border-emerald-100 font-bold text-xs shadow-sm"
                        title="Chat via WhatsApp"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat</span>
                      </a>
                      <button 
                        onClick={() => onViewDetail?.(reg)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-700 transition-all border border-transparent hover:border-green-100 font-bold text-xs"
                      >
                        <span>Detail</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium text-gray-900">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span> of{' '}
            <span className="font-medium text-gray-900">{pagination.total}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1 px-2 text-xs font-bold text-gray-600">
              Page {pagination.page} <span className="opacity-40">of</span> {pagination.totalPages}
            </div>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
