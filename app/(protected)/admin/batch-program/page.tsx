'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, BookOpen, Plus, RefreshCw, Search, Filter, X, Layers } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAdminBatches, useAdminPrograms } from '@/lib/hooks/useAdminData';
import { Batch, Program, BATCH_STATUSES, PROGRAM_STATUSES } from '@/components/admin/batch-program/types';
import { BatchTable } from '@/components/admin/batch-program/BatchTable';
import { BatchFormModal } from '@/components/admin/batch-program/BatchFormModal';
import { ProgramTable } from '@/components/admin/batch-program/ProgramTable';
import { ProgramFormModal } from '@/components/admin/batch-program/ProgramFormModal';

type TabType = 'batches' | 'programs';

export default function AdminBatchProgramPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('batches');

  // Filters
  const [batchSearch, setBatchSearch] = useState('');
  const [batchStatus, setBatchStatus] = useState<string>('all');

  const [programSearch, setProgramSearch] = useState('');
  const [programStatus, setProgramStatus] = useState<string>('all');
  const [programBatchFilter, setProgramBatchFilter] = useState<string>('all');

  // Modals
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { batches, pagination: batchPagination, isLoading: batchesLoading, mutate: mutateBatches } = useAdminBatches(true);
  const { programs, pagination: programPagination, isLoading: programsLoading, mutate: mutatePrograms } = useAdminPrograms(true);

  const filteredBatches = useMemo(() => {
    return (batches as Batch[]).filter((b) => {
      const matchSearch = !batchSearch ||
        b.name?.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.description?.toLowerCase().includes(batchSearch.toLowerCase());
      const matchStatus = batchStatus === 'all' || b.status === batchStatus;
      return matchSearch && matchStatus;
    });
  }, [batches, batchSearch, batchStatus]);

  const filteredPrograms = useMemo(() => {
    return (programs as Program[]).filter((p) => {
      const matchSearch = !programSearch ||
        p.name?.toLowerCase().includes(programSearch.toLowerCase()) ||
        p.target_level?.toLowerCase().includes(programSearch.toLowerCase()) ||
        p.batch?.name?.toLowerCase().includes(programSearch.toLowerCase());
      const matchStatus = programStatus === 'all' || p.status === programStatus;
      const matchBatch = programBatchFilter === 'all' || p.batch_id === programBatchFilter;
      return matchSearch && matchStatus && matchBatch;
    });
  }, [programs, programSearch, programStatus, programBatchFilter]);

  const handleRefresh = async () => {
    await Promise.all([mutateBatches(), mutatePrograms()]);
    toast.success('Data berhasil diperbarui');
  };

  const handleBatchSuccess = () => {
    setShowBatchModal(false);
    setEditingBatch(null);
    mutateBatches();
  };

  const handleProgramSuccess = () => {
    setShowProgramModal(false);
    setEditingProgram(null);
    mutatePrograms();
  };

  const stats = useMemo(() => {
    const batchList = batches as Batch[];
    const programList = programs as Program[];
    return {
      totalBatches: batchList.length,
      activeBatches: batchList.filter(b => b.status === 'open' || b.status === 'ongoing').length,
      totalPrograms: programList.length,
      openPrograms: programList.filter(p => p.status === 'open' || p.status === 'ongoing').length,
    };
  }, [batches, programs]);

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50/50" />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Toaster position="top-right" richColors />

      {/* Header */}
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
                  <Layers className="h-3 w-3" />
                  <span>Authority Console</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  Manajemen Batch &amp; Program
                  <span className="px-2 py-0.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                    Scalable v2.0
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 px-4 rounded-xl bg-gray-100/50 border border-gray-100 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">
                  {stats.totalBatches} <span className="font-medium opacity-60">Batch</span>
                </span>
              </div>
              <div className="h-10 px-4 rounded-xl bg-gray-100/50 border border-gray-100 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">
                  {stats.totalPrograms} <span className="font-medium opacity-60">Program</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Batch"
            value={stats.totalBatches}
            icon={<Calendar className="h-6 w-6 text-green-600" />}
            bg="bg-green-50"
            border="border-green-100"
            isLoading={batchesLoading}
          />
          <StatCard
            label="Batch Aktif"
            value={stats.activeBatches}
            icon={<Calendar className="h-6 w-6 text-emerald-600" />}
            bg="bg-emerald-50"
            border="border-emerald-100"
            isLoading={batchesLoading}
          />
          <StatCard
            label="Total Program"
            value={stats.totalPrograms}
            icon={<BookOpen className="h-6 w-6 text-purple-600" />}
            bg="bg-purple-50"
            border="border-purple-100"
            isLoading={programsLoading}
          />
          <StatCard
            label="Program Berjalan"
            value={stats.openPrograms}
            icon={<BookOpen className="h-6 w-6 text-blue-600" />}
            bg="bg-blue-50"
            border="border-blue-100"
            isLoading={programsLoading}
          />
        </div>

        {/* Custom Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-100 mb-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('batches')}
            className={cn(
              'pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2',
              activeTab === 'batches' ? 'text-green-900' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Calendar className="h-4 w-4" />
            Manajemen Batch
            {activeTab === 'batches' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-900 rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={cn(
              'pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2',
              activeTab === 'programs' ? 'text-purple-900' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <BookOpen className="h-4 w-4" />
            Manajemen Program
            {activeTab === 'programs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-900 rounded-full" />}
          </button>
        </div>

        {activeTab === 'batches' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari batch berdasarkan nama atau deskripsi..."
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
                  />
                  {batchSearch && (
                    <button
                      onClick={() => setBatchSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={batchStatus}
                      onChange={(e) => setBatchStatus(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 bg-white"
                    >
                      <option value="all">Semua Status</option>
                      {BATCH_STATUSES.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleRefresh}
                    disabled={batchesLoading}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-all flex items-center gap-2"
                    title="Refresh Data"
                  >
                    <RefreshCw className={cn('h-5 w-5', batchesLoading && 'animate-spin')} />
                  </button>

                  <button
                    onClick={() => {
                      setEditingBatch(null);
                      setShowBatchModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Batch
                  </button>
                </div>
              </div>
            </div>

            <BatchTable
              batches={filteredBatches}
              isLoading={batchesLoading}
              pagination={batchPagination}
              onEdit={(b) => {
                setEditingBatch(b);
                setShowBatchModal(true);
              }}
            />
          </>
        )}

        {activeTab === 'programs' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari program berdasarkan nama, level, atau batch..."
                    value={programSearch}
                    onChange={(e) => setProgramSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all"
                  />
                  {programSearch && (
                    <button
                      onClick={() => setProgramSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={programBatchFilter}
                    onChange={(e) => setProgramBatchFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 bg-white max-w-[200px]"
                  >
                    <option value="all">Semua Batch ({(programs as Program[]).length})</option>
                    {(batches as Batch[]).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({(programs as Program[]).filter(p => p.batch_id === b.id).length})
                      </option>
                    ))}
                  </select>

                  <select
                    value={programStatus}
                    onChange={(e) => setProgramStatus(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 bg-white"
                  >
                    <option value="all">Semua Status</option>
                    {PROGRAM_STATUSES.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleRefresh}
                    disabled={programsLoading}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-all flex items-center gap-2"
                    title="Refresh Data"
                  >
                    <RefreshCw className={cn('h-5 w-5', programsLoading && 'animate-spin')} />
                  </button>

                  <button
                    onClick={() => {
                      setEditingProgram(null);
                      setShowProgramModal(true);
                    }}
                    disabled={(batches as Batch[]).length === 0}
                    className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                    title={(batches as Batch[]).length === 0 ? 'Buat batch terlebih dahulu' : ''}
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Program
                  </button>
                </div>
              </div>
            </div>

            <ProgramTable
              programs={filteredPrograms}
              isLoading={programsLoading}
              pagination={programPagination}
              onEdit={(p) => {
                setEditingProgram(p);
                setShowProgramModal(true);
              }}
            />
          </>
        )}
      </div>

      {/* Modals */}
      {showBatchModal && (
        <BatchFormModal
          key={editingBatch?.id || 'new-batch'}
          batch={editingBatch}
          isOpen={showBatchModal}
          onClose={() => {
            setShowBatchModal(false);
            setEditingBatch(null);
          }}
          onSuccess={handleBatchSuccess}
        />
      )}

      {showProgramModal && (
        <ProgramFormModal
          key={editingProgram?.id || 'new-program'}
          program={editingProgram}
          batches={batches as Batch[]}
          isOpen={showProgramModal}
          onClose={() => {
            setShowProgramModal(false);
            setEditingProgram(null);
          }}
          onSuccess={handleProgramSuccess}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
  border: string;
  isLoading?: boolean;
}

function StatCard({ label, value, icon, bg, border, isLoading }: StatCardProps) {
  return (
    <div className={cn('p-6 rounded-2xl border transition-all duration-300 hover:shadow-md hover:-translate-y-1 group', bg, border)}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100/50 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-gray-600 transition-colors">
          Overview
        </span>
      </div>
      <div className="space-y-1">
        {isLoading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
        ) : (
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value.toLocaleString()}</h3>
        )}
        <p className="text-sm font-bold text-gray-600 tracking-tight group-hover:text-gray-900 transition-colors">
          {label}
        </p>
      </div>
    </div>
  );
}
