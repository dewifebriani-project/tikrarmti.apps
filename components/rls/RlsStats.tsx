'use client';

import { ShieldCheck, Shield, ShieldAlert } from 'lucide-react';

interface RlsStatsProps {
  tables: any[];
}

export function RlsStats({ tables }: RlsStatsProps) {
  const rlsCount = tables.filter(t => t.has_rls).length;
  const policyCount = tables.reduce((sum, t) => sum + t.policy_count, 0);
  const noRlsCount = tables.filter(t => !t.has_rls).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Tables with RLS</p>
            <p className="text-2xl font-semibold text-gray-900">{rlsCount} / {tables.length}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg"><ShieldCheck className="h-6 w-6 text-green-600" /></div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Policies</p>
            <p className="text-2xl font-semibold text-gray-900">{policyCount}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg"><Shield className="h-6 w-6 text-blue-600" /></div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">No RLS</p>
            <p className="text-2xl font-semibold text-red-600">{noRlsCount}</p>
          </div>
          <div className="p-3 bg-red-100 rounded-lg"><ShieldAlert className="h-6 w-6 text-red-600" /></div>
        </div>
      </div>
    </div>
  );
}
