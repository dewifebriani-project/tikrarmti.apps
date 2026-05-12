'use client';

import { useState, useTransition, useEffect } from 'react';
import { Shield, Users, ArrowLeft, RefreshCw, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminUsers, useAdminStats, useMuallimahRegistrations, useAdminBatches } from '@/lib/hooks/useAdminData';
import { resetUserPassword } from '../actions';
import { toast } from 'sonner';
import { UserStats } from '@/components/admin/users/UserStats';
import { UserFilters } from '@/components/admin/users/UserFilters';
import { UserTable } from '@/components/admin/users/UserTable';
import { UserDetailModal, EditRoleModal, BlacklistModal, MergeUserModal } from '@/components/admin/users/UserModals';
import { MuallimahRegistration, AdminUser } from '@/components/admin/users/types';
import { MuallimahTable } from '@/components/admin/users/MuallimahTable';
import { MuallimahDetailModal } from '@/components/admin/users/MuallimahDetailModal';
import { Toaster } from 'sonner';

export default function AdminUsersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // --- STATE ---
  const [filterState, setFilterState] = useState({
    page: 1,
    pageSize: 10, // Default to a smaller page size for snappiness
    search: '',
    role: 'all',
    status: 'all',
    detectDuplicates: false,
  });

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [activeModal, setActiveModal] = useState<'detail' | 'role' | 'blacklist' | 'muallimahDetail' | 'merge' | null>(null);
  const [selectedMuallimah, setSelectedMuallimah] = useState<MuallimahRegistration | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'muallimah'>('users');
  const [muallimahPage, setMuallimahPage] = useState(1);
  const [muallimahBatchId, setMuallimahBatchId] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  // Handle Hydration - Delay rendering until client is ready
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- DATA FETCHING ---
  const { 
    users, 
    pagination, 
    isLoading: usersLoading, 
    mutate: mutateUsers 
  } = useAdminUsers(true, filterState);

  const { 
    stats, 
    isLoading: statsLoading, 
    mutate: mutateStats 
  } = useAdminStats(true);

  const {
    batches,
    isLoading: batchesLoading
  } = useAdminBatches(true);

  // Hook for muallimah registrations
  const {
    registrations: muallimahData,
    pagination: muallimahPagination,
    isLoading: muallimahLoading,
    mutate: mutateMuallimah
  } = useMuallimahRegistrations(activeTab === 'muallimah', { 
    page: muallimahPage,
    batchId: muallimahBatchId === 'all' ? undefined : muallimahBatchId
  });

  // --- HANDLERS ---
  const handleFilterChange = (newFilters: Partial<typeof filterState>) => {
    startTransition(() => {
      setFilterState(prev => ({ 
        ...prev, 
        ...newFilters, 
        page: newFilters.page || (newFilters.detectDuplicates !== undefined ? 1 : prev.page) 
      }));
    });
  };

  const handleStatClick = (type: string) => {
    startTransition(() => {
      setFilterState({
        page: 1,
        pageSize: 10,
        search: '',
        role: type === 'admin' ? 'admin' : type === 'thalibah' ? 'thalibah' : 'all',
        status: type === 'blacklisted' ? 'blacklisted' : type === 'thalibah' ? 'active' : 'all',
        detectDuplicates: false,
      });
    });
  };

  const handleAction = async (action: 'detail' | 'role' | 'blacklist' | 'resetPassword' | 'preview' | 'merge', user: AdminUser) => {
    if (action === 'preview') {
      router.push(`/dashboard?user_id=${user.id}`);
      return;
    }

    if (action === 'resetPassword') {
      if (window.confirm(`Reset password untuk ${user.full_name || user.email} menjadi default 'MTI123!'?`)) {
        try {
          const result = await resetUserPassword(user.id);
          if (result.success) {
            toast.success(result.message || 'Password reset successful');
          } else {
            toast.error(result.error || 'Failed to reset password');
          }
        } catch (error) {
          toast.error('Unexpected error resetting password');
        }
      }
      return;
    }
    
    setSelectedUser(user);
    setActiveModal(action as 'detail' | 'role' | 'blacklist' | 'merge');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
  };

  const handleRefresh = async () => {
    await Promise.all([mutateUsers(), mutateStats(), mutateMuallimah()]);
  };

  // Prepare stats for UserStats component
  const statsData = {
    totalUsers: stats?.totalUsers || 0,
    totalAdmins: stats?.totalMentors || 0,
    totalThalibah: stats?.totalThalibah || 0,
    totalBlacklisted: stats?.totalBlacklisted || 0,
  };

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50/50" />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Toaster position="top-right" richColors />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 mb-8 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all border border-transparent hover:border-gray-200"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-[0.2em] mb-1">
                  <Shield className="h-3 w-3" />
                  <span>Authority Console</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  Manajemen Users
                  <span className="px-2 py-0.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                    Scalable v2.0
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 px-4 rounded-xl bg-gray-100/50 border border-gray-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">
                  {pagination?.totalCount || 0} <span className="font-medium opacity-60">Total Registered</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <UserStats 
          stats={statsData} 
          isLoading={statsLoading} 
          onCardClick={handleStatClick}
        />

        {/* Custom Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-100 mb-8 overflow-x-auto scrollbar-hide">
           <button
             onClick={() => setActiveTab('users')}
             className={cn(
                "pb-4 px-2 text-sm font-bold transition-all relative",
                activeTab === 'users' ? "text-green-900" : "text-gray-400 hover:text-gray-600"
             )}
           >
             Database Users
             {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-900 rounded-full" />}
           </button>
           <button
             onClick={() => setActiveTab('muallimah')}
             className={cn(
                "pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2",
                activeTab === 'muallimah' ? "text-green-900" : "text-gray-400 hover:text-gray-600"
             )}
           >
             Pendaftaran Muallimah
             <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">New</span>
             {activeTab === 'muallimah' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-900 rounded-full" />}
           </button>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Filters & Search - only for users tab */}
            <UserFilters 
              onFilterChange={(f) => handleFilterChange(f)} 
              onRefresh={handleRefresh}
              isLoading={usersLoading || isPending}
            />

            {/* User Table */}
            <UserTable 
              users={users} 
              isLoading={usersLoading || isPending}
              pagination={pagination}
              onPageChange={(p) => handleFilterChange({ page: p })}
              onAction={handleAction}
              detectDuplicates={filterState.detectDuplicates}
            />
          </>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Filter Batch</label>
                    <select
                      value={muallimahBatchId}
                      onChange={(e) => setMuallimahBatchId(e.target.value)}
                      className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-green-900/10 transition-all cursor-pointer outline-none"
                    >
                      <option value="all">Semua Batch</option>
                      {batches?.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
               </div>
               
               <button 
                 onClick={handleRefresh}
                 disabled={muallimahLoading}
                 className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:text-green-900 hover:bg-green-50 transition-all border border-gray-100"
                 title="Refresh Data"
               >
                 <RefreshCw className={cn("w-5 h-5", muallimahLoading && "animate-spin")} />
               </button>
            </div>

            <MuallimahTable 
              registrations={muallimahData}
              isLoading={muallimahLoading}
              pagination={muallimahPagination}
              onPageChange={(p) => setMuallimahPage(p)}
              onViewDetail={(reg) => {
                setSelectedMuallimah(reg);
                setActiveModal('muallimahDetail');
              }}
            />
          </>
        )}
      </div>

      {/* --- MODALS --- */}
      {selectedUser && activeModal === 'detail' && (
        <UserDetailModal 
          user={selectedUser} 
          isOpen={true} 
          onClose={closeModal} 
        />
      )}

      {selectedUser && activeModal === 'role' && (
        <EditRoleModal 
          user={selectedUser} 
          isOpen={true} 
          onClose={closeModal}
          onSuccess={handleRefresh}
        />
      )}

      {selectedUser && activeModal === 'blacklist' && (
        <BlacklistModal 
          user={selectedUser} 
          isOpen={true} 
          onClose={closeModal}
          onSuccess={handleRefresh}
        />
      )}

      {selectedUser && activeModal === 'merge' && (
        <MergeUserModal 
          sourceUser={selectedUser} 
          isOpen={true} 
          onClose={closeModal}
          onSuccess={handleRefresh}
        />
      )}

      {selectedMuallimah && activeModal === 'muallimahDetail' && (
        <MuallimahDetailModal 
          registration={selectedMuallimah}
          isOpen={true}
          onClose={() => {
            setSelectedMuallimah(null);
            setActiveModal(null);
          }}
        />
      )}
    </div>
  );
}
