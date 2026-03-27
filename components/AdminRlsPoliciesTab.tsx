'use client';

import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useAdminRlsPolicies } from '@/hooks/useAdminRlsPolicies';
import { RlsStats } from './rls/RlsStats';
import { QuickFixActions } from './rls/QuickFixActions';
import { RlsTable } from './rls/RlsTable';

export function AdminRlsPoliciesTab() {
  const {
    tables, selectedTable, setSelectedTable, selectedCommand, setSelectedCommand,
    isRefreshing, loadPolicies, filteredPolicies, applyQuickFix
  } = useAdminRlsPolicies();

  const getCommandBadgeColor = (cmd: string) => {
    switch (cmd) {
      case 'SELECT': return 'bg-blue-100 text-blue-800';
      case 'INSERT': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-amber-100 text-amber-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">RLS Policies Management</h3>
          <p className="mt-1 text-sm text-gray-500">Manage Row Level Security policies for data protection</p>
        </div>
        <button
          onClick={loadPolicies}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 transition shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <RlsStats tables={tables} />

      {/* Quick Fix Actions */}
      <QuickFixActions onFix={applyQuickFix} />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Table</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Tables</option>
              {tables.map(t => (
                <option key={t.tablename} value={t.tablename}>{t.tablename} ({t.policy_count})</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Command</label>
            <select
              value={selectedCommand}
              onChange={(e) => setSelectedCommand(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">All Commands</option>
              <option value="SELECT">SELECT</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Policies Table */}
      <RlsTable filteredPolicies={filteredPolicies} getCommandBadgeColor={getCommandBadgeColor} />

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 font-bold">About RLS Policies</h4>
            <p className="text-xs text-blue-700 mt-1">
              Row Level Security (RLS) policies control which data users can access based on their role.
              Quick Fix actions create standard policies. For custom policies, use Supabase SQL Editor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
