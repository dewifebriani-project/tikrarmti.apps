'use client';

import { Search, Filter, RefreshCw, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UserFiltersProps {
  onFilterChange: (filters: { search: string; role: string; status: string }) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function UserFilters({ onFilterChange, onRefresh, isLoading }: UserFiltersProps) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search, role, status });
    }, 500);
    return () => clearTimeout(timer);
  }, [search, role, status]);

  const handleClear = () => {
    setSearch('');
    setRole('all');
    setStatus('all');
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
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
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 bg-white"
            >
              <option value="all">Semua Peran</option>
              <option value="admin">Administrator</option>
              <option value="thalibah">Thalibah</option>
            </select>
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 bg-white"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
            <option value="blacklisted">Blacklisted</option>
          </select>

          <div className="h-8 w-px bg-gray-200 mx-1 hidden lg:block" />

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-all flex items-center gap-2"
            title="Refresh Data"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="lg:hidden text-sm font-medium">Refresh</span>
          </button>

          {(search || role !== 'all' || status !== 'all') && (
            <button
              onClick={handleClear}
              className="text-sm font-medium text-red-600 hover:text-red-700 px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
