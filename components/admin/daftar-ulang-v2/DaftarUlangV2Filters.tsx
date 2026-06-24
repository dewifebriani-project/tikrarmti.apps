'use client';

import { Search, Filter, RefreshCw, X, Award, Download, FileSpreadsheet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DaftarUlangV2FiltersProps {
  searchQuery: string;
  batchId: string;
  status: string;
  onChange: (filters: { 
    search: string; 
    batchId: string; 
    status: string;
  }) => void;
  onRefresh: () => void;
  isLoading: boolean;
  batches: any[];
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
  isDownloadingExcel: boolean;
  isDownloadingPDF: boolean;
}

export function DaftarUlangV2Filters({ 
  searchQuery,
  batchId,
  status,
  onChange,
  onRefresh, 
  isLoading, 
  batches,
  onDownloadExcel,
  onDownloadPDF,
  isDownloadingExcel,
  isDownloadingPDF
}: DaftarUlangV2FiltersProps) {
  
  const handleClear = () => {
    onChange({ search: '', batchId: 'all', status: 'all' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left side: Search & Filters */}
        <div className="flex flex-col sm:flex-row flex-1 gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari Nama, Email, WhatsApp..."
              value={searchQuery}
              onChange={(e) => onChange({ search: e.target.value, batchId, status })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onChange({ search: '', batchId, status })}
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
                onChange={(e) => onChange({ search: searchQuery, batchId: e.target.value, status })}
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
                onChange={(e) => onChange({ search: searchQuery, batchId, status: e.target.value })}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-all flex items-center gap-2"
              title="Refresh Data"
            >
              <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            </button>

            {(searchQuery || batchId !== 'all' || status !== 'all') && (
              <button
                onClick={handleClear}
                className="text-sm font-bold text-red-600 hover:text-red-700 px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right side: Exports */}
        <div className="flex items-center gap-2 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-4">
          <button
            onClick={onDownloadExcel}
            disabled={isDownloadingExcel}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors font-semibold text-sm border border-emerald-200 flex-1 lg:flex-none"
          >
            {isDownloadingExcel ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Excel</span>
          </button>
          
          <button
            onClick={onDownloadPDF}
            disabled={isDownloadingPDF}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl transition-colors font-semibold text-sm border border-red-200 flex-1 lg:flex-none"
          >
            {isDownloadingPDF ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
}
