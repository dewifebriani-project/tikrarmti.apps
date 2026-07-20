import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function QuotaDetails({ halaqah }: any) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="text-xs space-y-1 mt-1">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 font-medium w-full justify-between"
      >
        <span>Details Quota</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      
      {expanded && (
        <div className="pt-1 space-y-1 border-t border-gray-100">
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Terpakai:</span>
            <span className="font-medium text-gray-900">{halaqah.quota_details?.total_used || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-green-600">✓ Approved:</span>
            <span className="font-medium text-green-700">{halaqah.quota_details?.approved || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-blue-600">✓ Submitted:</span>
            <span className="font-medium text-blue-700">{halaqah.quota_details?.submitted || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">○ Draft:</span>
            <span className="font-medium text-gray-500">{halaqah.quota_details?.draft || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-green-600">✓ Active:</span>
            <span className="font-medium text-green-700">{halaqah.quota_details?.active || 0}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-yellow-600">⏱ Waitlist:</span>
            <span className="font-medium text-yellow-700">{halaqah.quota_details?.waitlist || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}
