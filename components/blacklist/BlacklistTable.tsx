'use client';

import { Loader2, FileText, ShieldCheck, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWhatsAppUrl } from '@/lib/utils/whatsapp';
import { cn } from '@/lib/utils';

interface BlacklistTableProps {
  blacklistedUsers: any[];
  isLoading: boolean;
  search: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onViewDetails: (user: any) => void;
  onRemove: (id: string) => void;
}

export function BlacklistTable({
  blacklistedUsers, isLoading, search, currentPage, totalPages, totalItems, onPageChange, onViewDetails, onRemove
}: BlacklistTableProps) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alasan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Blacklist</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                    <span className="text-gray-500">Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : blacklistedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {search ? 'Tidak ada data blacklist yang cocok dengan pencarian' : 'Belum ada user di-blacklist'}
                </td>
              </tr>
            ) : (
              blacklistedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name || '-'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.whatsapp ? (
                      <a 
                        href={getWhatsAppUrl(user.whatsapp, user.full_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5"
                        title="Chat WhatsApp"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {user.whatsapp}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400">-</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600 max-w-xs truncate">{user.blacklist_reason || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">
                      {new Date(user.blacklisted_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.whatsapp && (
                        <a 
                          href={getWhatsAppUrl(user.whatsapp, user.full_name, `Assalamu'alaikum ${user.full_name || 'Thalibah'},\n\nIni adalah pesan dari admin Markaz Tikrar Indonesia terkait status akun Anda.\n\nJazakillahu khairan`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Chat
                        </a>
                      )}
                      <Button size="sm" variant="outline" onClick={() => onViewDetails(user)}>
                        <FileText className="h-3 w-3 mr-1" /> Detail
                      </Button>
                      <Button
                        size="sm" variant="outline" onClick={() => onRemove(user.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" /> Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Menampilkan {((currentPage - 1) * 20) + 1} sampai {Math.min(currentPage * 20, totalItems)} dari {totalItems} data
          </p>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm text-gray-600">Hal {currentPage} dari {totalPages}</span>
            <Button size="sm" variant="outline" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
