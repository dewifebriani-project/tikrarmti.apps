'use client';

import { Search, Filter, RefreshCw, X, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MuallimahV2FiltersProps {
  onFilterChange: (filters: { 
    search: string; 
    batchId: string; 
    status: string;
    sortBy: string;
  }) => void;
  onRefresh: () => void;
  isLoading: boolean;
  batches: any[];
  defaultBatchId?: string;
  defaultStatus?: string;
}

export function MuallimahV2Filters({ 
  onFilterChange, 
  onRefresh, 
  isLoading, 
  batches, 
  defaultBatchId = 'all',
  defaultStatus = 'all' 
}: MuallimahV2FiltersProps) {
  const [search, setSearch] = useState('');
  const [batchId, setBatchId] = useState(defaultBatchId);
  const [status, setStatus] = useState(defaultStatus);
  const [sortBy, setSortBy] = useState('newest');

  // Sync batchId when defaultBatchId changes from parent
  useEffect(() => {
    setBatchId(defaultBatchId);
  }, [defaultBatchId]);

  // Sync status when defaultStatus changes from parent (e.g. from clicking stats cards)
  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search, batchId, status, sortBy });
    }, 500);
    return () => clearTimeout(timer);
  }, [search, batchId, status, sortBy, onFilterChange]);

  const handleClear = () => {
    setSearch('');
    setBatchId('all');
    setStatus('all');
    setSortBy('newest');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Nama, Email, atau WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-gray-500" />
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white cursor-pointer"
            >
              <option value="all">Semua Batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white cursor-pointer"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="name_asc">Nama (A-Z)</option>
              <option value="name_desc">Nama (Z-A)</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-all flex items-center gap-2"
            title="Refresh Data"
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            <span className="lg:hidden text-sm font-medium">Refresh</span>
          </button>

          {(search || batchId !== 'all' || status !== 'all') && (
            <button
              onClick={handleClear}
              className="text-sm font-bold text-red-600 hover:text-red-700 px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
