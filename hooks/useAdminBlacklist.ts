'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface BlacklistedUser {
  id: string;
  email: string;
  full_name: string | null;
  whatsapp: string | null;
  blacklist_reason: string | null;
  blacklisted_at: string;
  blacklist_notes: string | null;
  created_at: string;
}

interface BlacklistApiResponse {
  blacklist: BlacklistedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useAdminBlacklist() {
  const [blacklistedUsers, setBlacklistedUsers] = useState<BlacklistedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BlacklistedUser | null>(null);
  const [addForm, setAddForm] = useState({ userId: '', reason: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBlacklist = useCallback(async (page: number = currentPage, searchQuery: string = search) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/blacklist?${params}`);
      const result: BlacklistApiResponse = await response.json();

      if (response.ok) {
        setBlacklistedUsers(result.blacklist);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.total);
      } else {
        toast.error((result as any).error?.message || 'Gagal memuat data blacklist');
      }
    } catch (error) {
      console.error('Error fetching blacklist:', error);
      toast.error('Terjadi kesalahan saat memuat data blacklist');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchBlacklist();
  }, [fetchBlacklist]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchBlacklist(1, search);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]); // intentionally omitting currentPage and fetchBlacklist to only trigger on search change

  const handleAddToBlacklist = async () => {
    if (!addForm.userId.trim()) {
      toast.error('User ID harus diisi');
      return;
    }
    if (!addForm.reason.trim()) {
      toast.error('Alasan harus diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: addForm.userId,
          reason: addForm.reason,
          notes: addForm.notes || undefined
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'User berhasil di-blacklist');
        setIsAddModalOpen(false);
        setAddForm({ userId: '', reason: '', notes: '' });
        fetchBlacklist(1);
      } else {
        toast.error(result.error?.message || 'Gagal menambahkan ke blacklist');
      }
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      toast.error('Terjadi kesalahan saat menambahkan ke blacklist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromBlacklist = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini dari blacklist?')) {
      return;
    }

    try {
      const response = await fetch(`/api/blacklist/${userId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'User berhasil dihapus dari blacklist');
        fetchBlacklist();
      } else {
        toast.error(result.error?.message || 'Gagal menghapus dari blacklist');
      }
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      toast.error('Terjadi kesalahan saat menghapus dari blacklist');
    }
  };

  const monthStats = blacklistedUsers.filter(u => {
    const date = new Date(u.blacklisted_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return {
    blacklistedUsers,
    isLoading,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    isAddModalOpen,
    setIsAddModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedUser,
    setSelectedUser,
    addForm,
    setAddForm,
    isSubmitting,
    fetchBlacklist,
    handleAddToBlacklist,
    handleRemoveFromBlacklist,
    monthStats,
  };
}
