'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';

import { MuallimahV2Type, MuallimahV2StatsData } from './types';
import { MuallimahV2Stats } from './MuallimahV2Stats';
import { MuallimahV2Filters } from './MuallimahV2Filters';
import { MuallimahV2Table } from './MuallimahV2Table';
import { MuallimahReviewModal, MuallimahBulkConfirmModal, MuallimahUnapproveModal, MuallimahEditModal } from './MuallimahV2Modals';
import { AdminDeleteModal } from '@/components/AdminDeleteModal';

export function MuallimahV2Tab({ user }: { user: any }) {
  const supabase = createClient();
  
  // State
  const [muallimah, setMuallimah] = useState<MuallimahV2Type[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<MuallimahV2StatsData | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals State
  const [selectedRegistration, setSelectedRegistration] = useState<MuallimahV2Type | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnapproveModal, setShowUnapproveModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    batchId: 'all',
    status: 'all'
  });

  const fetchBatches = async () => {
    const { data } = await supabase.from('batches').select('*').order('name', { ascending: false });
    setBatches(data || []);
    
    // Default to open batch if no batch is selected yet
    if (data && filters.batchId === 'all') {
      const activeBatch = data.find((b: any) => b.status === 'open');
      if (activeBatch) {
        setFilters(prev => ({ ...prev, batchId: activeBatch.id }));
      }
    }
  };

  const fetchMuallimahData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('skipCount', 'true');
      if (filters.batchId !== 'all') queryParams.set('batchId', filters.batchId);
      
      const response = await fetch('/api/admin/muallimah?' + queryParams.toString());
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || 'Failed to fetch');
      
      let filteredData = (result.data?.data || []) as MuallimahV2Type[];

      if (filters.status !== 'all') {
        filteredData = filteredData.filter(t => t.status === filters.status);
      }

      if (filters.search) {
        const s = filters.search.toLowerCase();
        filteredData = filteredData.filter(t => 
          t.full_name?.toLowerCase().includes(s) ||
          t.user?.full_name?.toLowerCase().includes(s) ||
          t.email?.toLowerCase().includes(s) ||
          t.user?.email?.toLowerCase().includes(s) ||
          t.whatsapp?.includes(s)
        );
      }

      setMuallimah(filteredData);
      
      setStats({
        total: filteredData.length,
        pending: filteredData.filter(t => t.status === 'pending').length,
        approved: filteredData.filter(t => t.status === 'approved').length,
        rejected: filteredData.filter(t => t.status === 'rejected').length,
      });
    } catch (error: any) {
      toast.error('Gagal mengambil data Muallimah: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchMuallimahData();
  }, [fetchMuallimahData]);

  // Handlers
  const handleAction = (action: 'review' | 'edit' | 'delete' | 'unapprove', data: MuallimahV2Type) => {
    setSelectedRegistration(data);
    if (action === 'review') setShowReviewModal(true);
    if (action === 'edit') setShowEditModal(true);
    if (action === 'delete') setShowDeleteModal(true);
    if (action === 'unapprove') setShowUnapproveModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRegistration) return;
    try {
      const { error } = await supabase
        .from('muallimah_akads')
        .delete()
        .eq('id', selectedRegistration.id);
      
      if (error) throw error;
      toast.success('Pendaftaran berhasil dihapus');
      fetchMuallimahData();
    } catch (error: any) {
      toast.error('Gagal menghapus: ' + error.message);
    } finally {
      setShowDeleteModal(false);
      setSelectedRegistration(null);
    }
  };

  const handleUnapproveConfirm = async (reason: string) => {
    if (!selectedRegistration) return;
    try {
      const { error } = await supabase
        .from('muallimah_akads')
        .update({
          status: 'pending',
          review_notes: reason
        })
        .eq('id', selectedRegistration.id);
      
      if (error) throw error;
      toast.success('Persetujuan dibatalkan');
      fetchMuallimahData();
    } catch (error: any) {
      toast.error('Gagal membatalkan: ' + error.message);
    } finally {
      setShowUnapproveModal(false);
      setSelectedRegistration(null);
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedIds.length === 0 || !bulkAction) return;
    setIsBulkProcessing(true);
    try {
      const { error } = await supabase
        .from('muallimah_akads')
        .update({
          status: bulkAction === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          review_notes: null
        })
        .in('id', selectedIds);
      
      if (error) throw error;
      toast.success(`${selectedIds.length} pendaftaran berhasil di-${bulkAction}`);
      setSelectedIds([]);
      fetchMuallimahData();
    } catch (error: any) {
      toast.error('Gagal memproses massal: ' + error.message);
    } finally {
      setIsBulkProcessing(false);
      setShowBulkModal(false);
      setBulkAction(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = muallimah.filter(t => t.status === 'pending').map(t => t.id);
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  return (
    <div className="space-y-6">
      <MuallimahV2Stats stats={stats} isLoading={isLoading} />
      
      <MuallimahV2Filters 
        batches={batches}
        isLoading={isLoading}
        onFilterChange={setFilters}
        onRefresh={fetchMuallimahData}
      />

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-gray-900">{selectedIds.length} pendaftaran dipilih</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setBulkAction('approve'); setShowBulkModal(true); }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
            >
              Setujui Semua
            </button>
            <button
              onClick={() => { setBulkAction('reject'); setShowBulkModal(true); }}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
            >
              Tolak Semua
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs font-bold text-gray-500 hover:text-gray-700 px-2"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <MuallimahV2Table 
        muallimah={muallimah}
        isLoading={isLoading}
        onAction={handleAction}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
      />

      {/* Modals */}
      <MuallimahReviewModal 
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        reviewData={selectedRegistration}
        onRefresh={fetchMuallimahData}
        user={user}
      />

      <MuallimahUnapproveModal 
        isOpen={showUnapproveModal}
        onClose={() => setShowUnapproveModal(false)}
        onConfirm={handleUnapproveConfirm}
        data={selectedRegistration}
        isProcessing={false}
      />

      <MuallimahBulkConfirmModal 
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onConfirm={handleBulkConfirm}
        action={bulkAction}
        count={selectedIds.length}
        isProcessing={isBulkProcessing}
      />

      <AdminDeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Akad Mu'allimah"
        message={`Apakah Anda yakin ingin menghapus pendaftaran/akad "${selectedRegistration?.full_name}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      {showEditModal && (
        <MuallimahEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          editData={selectedRegistration}
          batches={batches}
          onRefresh={() => {
            fetchMuallimahData();
            fetchBatches();
          }}
        />
      )}
    </div>
  );
}
