'use client';

import { useState, useTransition } from 'react';
import { Shield, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAdminUsers, useAdminStats } from '@/lib/hooks/useAdminData';
import { UserStats } from '@/components/admin/users/UserStats';
import { UserFilters } from '@/components/admin/users/UserFilters';
import { UserTable } from '@/components/admin/users/UserTable';
import { UserDetailModal, EditRoleModal, BlacklistModal } from '@/components/admin/users/UserModals';
import { AdminUser } from '@/components/admin/users/types';
import { Toaster } from 'sonner';

export default function AdminUsersPage() {
  // --- STATE ---
  const [filterState, setFilterState] = useState({
    page: 1,
    pageSize: 10, // Default to a smaller page size for snappiness
    search: '',
    role: 'all',
    status: 'all',
  });

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [activeModal, setActiveModal] = useState<'detail' | 'role' | 'blacklist' | null>(null);
  const [isPending, startTransition] = useTransition();

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

  // --- HANDLERS ---
  const handleFilterChange = (newFilters: Partial<typeof filterState>) => {
    startTransition(() => {
      setFilterState(prev => ({ ...prev, ...newFilters, page: newFilters.page || 1 }));
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
      });
    });
  };

  const handleAction = (action: 'detail' | 'role' | 'blacklist', user: AdminUser) => {
    setSelectedUser(user);
    setActiveModal(action);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
  };

  const handleRefresh = async () => {
    await Promise.all([mutateUsers(), mutateStats()]);
  };

  // Prepare stats for UserStats component
  const statsData = {
    totalUsers: stats.totalUsers || 0,
    totalAdmins: stats.totalMentors || 0,
    totalThalibah: stats.totalThalibah || 0,
    totalBlacklisted: stats.totalBlacklisted || 0,
  };

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

        {/* Filters & Search */}
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
        />
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
    </div>
  );
}
