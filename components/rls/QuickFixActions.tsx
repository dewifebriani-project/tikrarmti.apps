'use client';

import { CheckCircle, Eye, ShieldCheck } from 'lucide-react';

interface QuickFixActionsProps {
  onFix: (table: string, type: 'thalibah' | 'musyrifah' | 'admin') => void;
}

export function QuickFixActions({ onFix }: QuickFixActionsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <h4 className="text-md font-medium text-gray-900 mb-4">Quick Fix Actions</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2"><CheckCircle className="h-5 w-5 text-green-600" /><h5 className="font-medium">Thalibah Access</h5></div>
          <div className="space-y-2 mt-3">
            <button onClick={() => onFix('tashih_records', 'thalibah')} className="w-full px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">Fix tashih_records</button>
            <button onClick={() => onFix('jurnal_records', 'thalibah')} className="w-full px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">Fix jurnal_records</button>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2"><Eye className="h-5 w-5 text-blue-600" /><h5 className="font-medium">Musyrifah View</h5></div>
          <div className="space-y-2 mt-3">
            <button onClick={() => onFix('tashih_records', 'musyrifah')} className="w-full px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Fix tashih_records</button>
            <button onClick={() => onFix('jurnal_records', 'musyrifah')} className="w-full px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Fix jurnal_records</button>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-5 w-5 text-purple-600" /><h5 className="font-medium">Admin Full Access</h5></div>
          <div className="space-y-2 mt-3">
            <button onClick={() => onFix('tashih_records', 'admin')} className="w-full px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100">Fix tashih_records</button>
            <button onClick={() => onFix('jurnal_records', 'admin')} className="w-full px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100">Fix jurnal_records</button>
          </div>
        </div>
      </div>
    </div>
  );
}
