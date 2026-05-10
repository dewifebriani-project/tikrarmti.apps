'use client';

import { X, User, ArrowRight, Search, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { AdminUser } from './types';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MergeUserModalProps {
  sourceUser: AdminUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * MergeUserModal
 * 
 * Component to handle merging two users.
 * Allows choosing a target user and подтверждает removal of the source user.
 */
export function MergeUserModal({ sourceUser, isOpen, onClose, onSuccess }: MergeUserModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [targetUser, setTargetUser] = useState<AdminUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  // Search for target user when searchTerm changes
  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}&pageSize=5`);
        const result = await response.json();
        if (result.success) {
          // Exclude source user from results
          setSearchResults(result.data.users.filter((u: AdminUser) => u.id !== sourceUser.id));
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, sourceUser.id]);

  if (!isOpen) return null;

  const handleMerge = async () => {
    if (!targetUser) return;

    // Final confirmation before destructive action
    const isConfirmed = window.confirm(`Apakah Ukhti yakin ingin menggabungkan data ${sourceUser.full_name} ke ${targetUser.full_name}? Akun ${sourceUser.email} akan dihapus secara permanen dari sistem.`);
    
    if (!isConfirmed) return;

    setIsMerging(true);
    try {
      const response = await fetch('/api/admin/users/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUserId: sourceUser.id,
          targetUserId: targetUser.id
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message || 'Akun berhasil digabungkan');
        onSuccess();
        onClose();
      } else {
        throw new Error(result.message || 'Gagal menggabungkan akun');
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200 shadow-sm">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gabungkan Akun (Merge)</h2>
              <p className="text-xs text-gray-500 font-medium">Konsolidasi data thalibah yang duplikat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex flex-col md:flex-row items-stretch gap-6">
            {/* SOURCE USER (COLD) */}
            <div className="flex-1 p-6 rounded-3xl bg-red-50/50 border border-red-100 flex flex-col">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-4">Akun Sumber (Dihapus)</span>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-white border border-red-100 flex items-center justify-center text-red-600 font-bold shadow-sm">
                  {sourceUser.full_name?.charAt(0) || 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-900 truncate" title={sourceUser.full_name || ''}>{sourceUser.full_name}</div>
                  <div className="text-xs text-gray-500 truncate" title={sourceUser.email}>{sourceUser.email}</div>
                </div>
              </div>
              <div className="mt-auto space-y-2 pt-4 border-t border-red-100/50">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">Total Jurnal:</span>
                  <span className="font-bold text-gray-900">{sourceUser.activity_meta?.total_jurnal || 0}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">WhatsApp:</span>
                  <span className="font-medium text-gray-900">{sourceUser.whatsapp || '-'}</span>
                </div>
              </div>
            </div>

            {/* ARROW */}
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                <ArrowRight className="h-6 w-6" />
              </div>
            </div>

            {/* TARGET USER (HOT) */}
            <div className={cn(
              "flex-1 p-6 rounded-3xl border transition-all flex flex-col",
              targetUser 
                ? "bg-green-50/50 border-green-200 shadow-inner" 
                : "bg-gray-50 border-gray-200 border-dashed"
            )}>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-4">Akun Utama (Disimpan)</span>
              
              {!targetUser ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium px-4">
                    Cari dan pilih akun yang ingin dijadikan sebagai akun utama.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-white border border-green-100 flex items-center justify-center text-green-600 font-bold shadow-sm">
                      {targetUser.full_name?.charAt(0) || 'T'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-900 truncate" title={targetUser.full_name || ''}>{targetUser.full_name}</div>
                      <div className="text-xs text-gray-500 truncate" title={targetUser.email}>{targetUser.email}</div>
                    </div>
                    <button 
                      onClick={() => setTargetUser(null)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto space-y-2 pt-4 border-t border-green-100/50">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">Total Jurnal:</span>
                      <span className="font-bold text-gray-900">{targetUser.activity_meta?.total_jurnal || 0}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">WhatsApp:</span>
                      <span className="font-medium text-gray-900">{targetUser.whatsapp || '-'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-8">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block px-1">Cari Akun Utama</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan Email, WhatsApp, atau Nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-green-600/10 focus:border-green-600 transition-all text-sm font-medium"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <RefreshCw className="h-5 w-5 animate-spin text-green-600" />
                </div>
              )}
            </div>

            {searchResults.length > 0 && !targetUser && (
              <div className="mt-2 p-3 bg-white rounded-[2rem] border border-gray-100 shadow-2xl max-h-56 overflow-y-auto z-10 animate-in slide-in-from-top-2 duration-200">
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                        setTargetUser(user);
                        setSearchTerm('');
                        setSearchResults([]);
                    }}
                    className="w-full p-3 flex items-center justify-between hover:bg-green-50 rounded-2xl transition-all group mb-1 last:mb-0"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-green-100">
                        {user.full_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{user.full_name}</div>
                        <div className="text-[11px] text-gray-500 font-medium">{user.email} • {user.whatsapp || '-'}</div>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-transparent group-hover:bg-green-100 text-green-600 transition-all">
                      <CheckCircle className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {targetUser && (
            <div className="mt-8 p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                   <h4 className="text-sm font-bold text-amber-900 mb-1">Konfirmasi Migrasi Data</h4>
                   <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      Seluruh data jurnal, tashih, registrasi, dan preferensi dari akun <span className="font-bold underline decoration-amber-300">{sourceUser.email}</span> akan dipindahkan ke akun <span className="font-bold underline decoration-amber-300">{targetUser.email}</span>. Akun sumber akan dihapus permanen.
                   </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isMerging}
            className="px-8 py-3 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleMerge}
            disabled={!targetUser || isMerging}
            className={cn(
                "px-12 py-3.5 rounded-2xl text-sm font-bold shadow-xl transition-all flex items-center gap-2",
                targetUser && !isMerging
                  ? "bg-green-600 text-white hover:bg-green-700 shadow-green-600/20 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            )}
          >
            {isMerging ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            {isMerging ? 'Memproses...' : 'Gabungkan Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}
