'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { RefreshCw, Trash2, CheckCircle, XCircle } from 'lucide-react';

import { TikrarTahfidz, TikrarStatsData as TikrarStatsType } from './types';
import { TikrarStats } from './TikrarStats';
import { TikrarFilters } from './TikrarFilters';
import { TikrarTable } from './TikrarTable';
import { TikrarReviewModal, TikrarBulkConfirmModal, TikrarUnapproveModal } from './TikrarModals';
import { AdminCrudModal } from '@/components/AdminCrudModal';
import { AdminDeleteModal } from '@/components/AdminDeleteModal';

export function TikrarTab({ user }: { user: any }) {
  const supabase = createClient();
  
  // State
  const [tikrar, setTikrar] = useState<TikrarTahfidz[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<TikrarStatsType | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals State
  const [selectedRegistration, setSelectedRegistration] = useState<TikrarTahfidz | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnapproveModal, setShowUnapproveModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    batchId: 'all',
    status: 'all',
    selectionStatus: 'all'
  });

  // Fetch Batches
  const fetchBatches = async () => {
    const { data } = await supabase.from('batches').select('*').order('name', { ascending: false });
    setBatches(data || []);
  };

  // Fetch Tikrar Data
  const fetchTikrarData = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select(`
          *,
          user:users!pendaftaran_tikrar_tahfidz_user_id_fkey(*),
          batch:batches(*),
          program:programs(*)
        `)
        .order('submission_date', { ascending: false });

      if (filters.batchId !== 'all') {
        query = query.eq('batch_id', filters.batchId);
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.selectionStatus !== 'all') {
        query = query.eq('selection_status', filters.selectionStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data as TikrarTahfidz[];

      // Client-side search
      if (filters.search) {
        const s = filters.search.toLowerCase();
        filteredData = filteredData.filter(t => 
          t.full_name?.toLowerCase().includes(s) ||
          t.user?.full_name?.toLowerCase().includes(s) ||
          t.user?.email?.toLowerCase().includes(s) ||
          t.user?.whatsapp?.includes(s) ||
          t.wa_phone?.includes(s)
        );
      }

      setTikrar(filteredData || []);
      
      // Calculate Stats
      const total = filteredData.length;
      const pending = filteredData.filter(t => t.status === 'pending').length;
      const approved = filteredData.filter(t => t.status === 'approved').length;
      const rejected = filteredData.filter(t => t.status === 'rejected').length;
      const selectionPending = filteredData.filter(t => t.selection_status === 'pending').length;
      const selected = filteredData.filter(t => t.selection_status === 'selected').length;

      setStats({
        total,
        pending,
        approved,
        rejected,
        selectionPending,
        selected
      });

    } catch (error: any) {
      toast.error('Gagal mengambil data Tikrar: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, supabase]);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchTikrarData();
  }, [fetchTikrarData]);

  // Handlers
  const handleAction = (action: 'review' | 'edit' | 'delete' | 'unapprove', data: TikrarTahfidz) => {
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
        .from('pendaftaran_tikrar_tahfidz')
        .delete()
        .eq('id', selectedRegistration.id);
      
      if (error) throw error;
      toast.success('Pendaftaran berhasil dihapus');
      fetchTikrarData();
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
        .from('pendaftaran_tikrar_tahfidz')
        .update({
          status: 'pending',
          review_notes: reason
        })
        .eq('id', selectedRegistration.id);
      
      if (error) throw error;
      toast.success('Persetujuan dibatalkan');
      fetchTikrarData();
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
        .from('pendaftaran_tikrar_tahfidz')
        .update({
          status: bulkAction === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          review_notes: bulkAction === 'reject' ? bulkRejectionReason : null
        })
        .in('id', selectedIds);
      
      if (error) throw error;
      toast.success(`${selectedIds.length} pendaftaran berhasil di-${bulkAction}`);
      setSelectedIds([]);
      fetchTikrarData();
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
      const pendingIds = tikrar.filter(t => t.status === 'pending').map(t => t.id);
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
      <TikrarStats stats={stats} isLoading={isLoading} />
      
      <TikrarFilters 
        batches={batches}
        isLoading={isLoading}
        onFilterChange={setFilters}
        onRefresh={fetchTikrarData}
      />

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
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

      <TikrarTable 
        tikrar={tikrar}
        isLoading={isLoading}
        onAction={handleAction}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
      />

      {/* Modals */}
      <TikrarReviewModal 
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        reviewData={selectedRegistration}
        onRefresh={fetchTikrarData}
        user={user}
      />

      <TikrarUnapproveModal 
        isOpen={showUnapproveModal}
        onClose={() => setShowUnapproveModal(false)}
        onConfirm={handleUnapproveConfirm}
        data={selectedRegistration}
        isProcessing={false}
      />

      <TikrarBulkConfirmModal 
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onConfirm={handleBulkConfirm}
        action={bulkAction}
        count={selectedIds.length}
        isProcessing={isBulkProcessing}
        rejectionReason={bulkRejectionReason}
        setRejectionReason={setBulkRejectionReason}
      />

      <AdminDeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Pendaftaran Tikrar"
        message={`Apakah Anda yakin ingin menghapus pendaftaran "${selectedRegistration?.full_name}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      <AdminCrudModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Pendaftaran Tikrar"
        fields={[
          { name: 'full_name', label: 'Full Name', type: 'text', required: true },
          { name: 'status', label: 'Status', type: 'select', options: [
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'withdrawn', label: 'Withdrawn' },
            { value: 'completed', label: 'Completed' }
          ] },
          { name: 'selection_status', label: 'Selection Status', type: 'select', options: [
            { value: 'pending', label: 'Pending' },
            { value: 'selected', label: 'Selected' },
            { value: 'not_selected', label: 'Not Selected' },
            { value: 'waitlist', label: 'Waitlist' }
          ] },
          { name: 'chosen_juz', label: 'Juz', type: 'number' },
          { name: 'oral_total_score', label: 'Oral Score', type: 'number' },
          { name: 'written_quiz_score', label: 'Written Score', type: 'number' },
          { name: 'wa_phone', label: 'WhatsApp', type: 'text' },
          { name: 'domicile', label: 'Domisili', type: 'text' },
        ]}
        initialData={selectedRegistration || {}}
        onSubmit={async (formData) => {
          if (!selectedRegistration) return;
          try {
            const { error } = await supabase
              .from('pendaftaran_tikrar_tahfidz')
              .update(formData)
              .eq('id', selectedRegistration.id);
            
            if (error) throw error;
            toast.success('Pendaftaran berhasil diupdate');
            fetchTikrarData();
            setShowEditModal(false);
          } catch (error: any) {
            toast.error('Gagal mengupdate: ' + error.message);
          }
        }}
      />
    </div>
  );
}
