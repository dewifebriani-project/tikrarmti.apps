'use client';

import { Search, Filter, RefreshCw, X, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TikrarFiltersProps {
  onFilterChange: (filters: { 
    search: string; 
    batchId: string; 
    status: string;
    selectionStatus: string;
  }) => void;
  onRefresh: () => void;
  isLoading: boolean;
  batches: any[];
}

export function TikrarFilters({ onFilterChange, onRefresh, isLoading, batches }: TikrarFiltersProps) {
  const [search, setSearch] = useState('');
  const [batchId, setBatchId] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectionStatus, setSelectionStatus] = useState('all');

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search, batchId, status, selectionStatus });
    }, 500);
    return () => clearTimeout(timer);
  }, [search, batchId, status, selectionStatus]);

  const handleClear = () => {
    setSearch('');
    setBatchId('all');
    setStatus('all');
    setSelectionStatus('all');
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all text-sm font-medium"
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
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 bg-white cursor-pointer"
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
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 bg-white cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <select
            value={selectionStatus}
            onChange={(e) => setSelectionStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 bg-white cursor-pointer"
          >
            <option value="all">Semua Seleksi</option>
            <option value="pending">Pending Seleksi</option>
            <option value="selected">Terpilih</option>
            <option value="not_selected">Tidak Terpilih</option>
            <option value="waitlist">Waitlist</option>
          </select>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-all flex items-center gap-2"
            title="Refresh Data"
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            <span className="lg:hidden text-sm font-medium">Refresh</span>
          </button>

          {(search || batchId !== 'all' || status !== 'all' || selectionStatus !== 'all') && (
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
