'use client';

import { ShieldAlert, Clock, Info } from 'lucide-react';

interface BlacklistStatsProps {
  totalItems: number;
  monthStats: number;
}

export function BlacklistStats({ totalItems, monthStats }: BlacklistStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-600 font-medium">Total Blacklist</p>
            <p className="text-2xl font-bold text-red-700">{totalItems}</p>
          </div>
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-600 font-medium">Bulan Ini</p>
            <p className="text-2xl font-bold text-yellow-700">{monthStats}</p>
          </div>
          <Clock className="h-8 w-8 text-yellow-600" />
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Info</p>
            <p className="text-sm text-blue-700">
              User di-blacklist tidak bisa mendaftar
            </p>
          </div>
          <Info className="h-8 w-8 text-blue-600" />
        </div>
      </div>
    </div>
  );
}
