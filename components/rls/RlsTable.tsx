'use client';

import { Shield, Eye, Plus, RefreshCw, Trash2, Settings, CheckCircle, XCircle } from 'lucide-react';

interface RlsTableProps {
  filteredPolicies: any[];
  getCommandBadgeColor: (cmd: string) => string;
}

export function RlsTable({ filteredPolicies, getCommandBadgeColor }: RlsTableProps) {
  const getCommandIcon = (cmd: string) => {
    switch (cmd) {
      case 'SELECT': return <Eye className="h-4 w-4" />;
      case 'INSERT': return <Plus className="h-4 w-4" />;
      case 'UPDATE': return <RefreshCw className="h-4 w-4" />;
      case 'DELETE': return <Trash2 className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-100">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">RLS Policies ({filteredPolicies.length})</h3>
      </div>
      {filteredPolicies.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No RLS policies found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Command</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPolicies.map((policy, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">{policy.tablename}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{policy.policyname}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getCommandBadgeColor(policy.cmd)}`}>
                      {getCommandIcon(policy.cmd)} {policy.cmd}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{policy.roles?.length > 0 ? policy.roles.join(', ') : 'authenticated'}</td>
                  <td className="px-4 py-3">
                    {policy.permissive === 'PERMISSIVE' ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium"><CheckCircle className="h-4 w-4" /> Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium"><XCircle className="h-4 w-4" /> Restrictive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
