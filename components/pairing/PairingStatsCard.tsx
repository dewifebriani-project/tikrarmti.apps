import React from 'react'
import { UserCheck, HeartHandshake, BookOpen, Home } from 'lucide-react'
import { PairingStats } from './types'

interface Props {
  stats: PairingStats
}

export function PairingStatsCard({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Self Match Stats */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95 group">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">Pilih Sendiri</p>
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">
            {stats.selfMatch.approved}
            <span className="text-gray-400 text-sm font-normal"> / {stats.selfMatch.submitted}</span>
          </h3>
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Approved / Submitted</p>
        </div>
        <div className="p-4 rounded-xl text-white bg-blue-500 shadow-lg shadow-blue-200 transition-transform duration-300 group-hover:scale-110">
          <UserCheck className="h-6 w-6" />
        </div>
      </div>

      {/* System Match Stats */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95 group">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">Dipasangkan Sistem</p>
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">
            {stats.systemMatch.approved}
            <span className="text-gray-400 text-sm font-normal"> / {stats.systemMatch.submitted}</span>
          </h3>
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Approved / Submitted</p>
        </div>
        <div className="p-4 rounded-xl text-white bg-emerald-500 shadow-lg shadow-emerald-200 transition-transform duration-300 group-hover:scale-110">
          <HeartHandshake className="h-6 w-6" />
        </div>
      </div>

      {/* Tarteel Stats */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95 group">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">Tarteel</p>
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">
            {stats.tarteel.approved}
            <span className="text-gray-400 text-sm font-normal"> / {stats.tarteel.submitted}</span>
          </h3>
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Approved / Submitted</p>
        </div>
        <div className="p-4 rounded-xl text-white bg-purple-500 shadow-lg shadow-purple-200 transition-transform duration-300 group-hover:scale-110">
          <BookOpen className="h-6 w-6" />
        </div>
      </div>

      {/* Family Stats */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95 group">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">Family</p>
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">
            {stats.family.approved}
            <span className="text-gray-400 text-sm font-normal"> / {stats.family.submitted}</span>
          </h3>
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Approved / Submitted</p>
        </div>
        <div className="p-4 rounded-xl text-white bg-amber-500 shadow-lg shadow-amber-200 transition-transform duration-300 group-hover:scale-110">
          <Home className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
