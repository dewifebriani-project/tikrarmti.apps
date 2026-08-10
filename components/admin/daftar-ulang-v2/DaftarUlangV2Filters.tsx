'use client';

import { Search, Filter, RefreshCw, X, Award, Download, FileSpreadsheet, Users, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DaftarUlangV2FiltersProps {
  searchQuery: string;
  batchId: string;
  submissionStatus: string;
  akadStatus: string;
  halaqahStatus: string;
  onChange: (filters: { 
    search: string; 
    batchId: string; 
    submissionStatus: string;
    akadStatus: string;
    halaqahStatus: string;
    juz: string;
  }) => void;
  onRefresh: () => void;
  isLoading: boolean;
  batches: any[];
  juzOptions: any[];
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
  onDownloadVCF: () => void;
  isDownloadingExcel: boolean;
  isDownloadingPDF: boolean;
  isDownloadingVCF: boolean;
  juz: string;
}

export function DaftarUlangV2Filters({ 
  searchQuery,
  batchId,
  submissionStatus,
  akadStatus,
  halaqahStatus,
  onChange,
  onRefresh, 
  isLoading, 
  batches,
  juzOptions,
  onDownloadExcel,
  onDownloadPDF,
  onDownloadVCF,
  isDownloadingExcel,
  isDownloadingPDF,
  isDownloadingVCF,
  juz
}: DaftarUlangV2FiltersProps) {
  
  const handleClear = () => {
    onChange({ search: '', batchId: 'all', submissionStatus: 'all', akadStatus: 'all', halaqahStatus: 'all', juz: 'all' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-col gap-4">
        
        {/* Top Row: Search & Export Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari Nama, Email, WhatsApp..."
              value={searchQuery}
              onChange={(e) => onChange({ search: e.target.value, batchId, submissionStatus, akadStatus, halaqahStatus, juz })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onChange({ search: '', batchId, submissionStatus, akadStatus, halaqahStatus, juz })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Export Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onDownloadExcel}
              disabled={isDownloadingExcel}
              className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 flex items-center gap-2 text-sm font-bold transition-colors border border-emerald-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingExcel ? (
                <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              <span>Excel</span>
            </button>
            
            <button
              onClick={onDownloadPDF}
              disabled={isDownloadingPDF}
              className="px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 flex items-center gap-2 text-sm font-bold transition-colors border border-red-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingPDF ? (
                <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span>PDF</span>
            </button>

            <button
              onClick={onDownloadVCF}
              disabled={isDownloadingVCF}
              className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 flex items-center gap-2 text-sm font-bold transition-colors border border-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingVCF ? (
                <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>VCF</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-gray-500" />
            <select
              value={batchId}
              onChange={(e) => onChange({ search: searchQuery, batchId: e.target.value, submissionStatus, akadStatus, halaqahStatus, juz })}
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
              value={submissionStatus}
              onChange={(e) => onChange({ search: searchQuery, batchId, submissionStatus: e.target.value, akadStatus, halaqahStatus, juz })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white cursor-pointer"
            >
              <option value="all">Status Pendaftaran</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={akadStatus}
              onChange={(e) => onChange({ search: searchQuery, batchId, submissionStatus, akadStatus: e.target.value, halaqahStatus, juz })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white cursor-pointer"
            >
              <option value="all">Status Akad</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <select
              value={halaqahStatus}
              onChange={(e) => onChange({ search: searchQuery, batchId, submissionStatus, akadStatus, halaqahStatus: e.target.value, juz })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white cursor-pointer"
            >
              <option value="all">Status Halaqah</option>
              <option value="has_halaqah">Sudah Ada Halaqah</option>
              <option value="no_halaqah">Belum Ada Halaqah</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <select
              value={juz}
              onChange={(e) => onChange({ search: searchQuery, batchId, submissionStatus, akadStatus, halaqahStatus, juz: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white cursor-pointer"
            >
              <option value="all">Semua Juz</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num.toString()}>
                  Juz {num}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || batchId !== 'all' || submissionStatus !== 'all' || akadStatus !== 'all' || halaqahStatus !== 'all' || juz !== 'all') && (
            <button
              onClick={handleClear}
              className="px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
