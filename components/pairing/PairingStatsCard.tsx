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
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Pilih Sendiri</p>
            <p className="text-2xl font-bold mt-1">
              {stats.selfMatch.approved}
              <span className="text-blue-200 text-sm font-normal"> / {stats.selfMatch.submitted}</span>
            </p>
            <p className="text-blue-100 text-xs mt-1">Approved / Submitted</p>
          </div>
          <UserCheck className="w-8 h-8 text-blue-200 opacity-80" />
        </div>
      </div>

      {/* System Match Stats */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-xs font-medium uppercase tracking-wide">Dipasangkan Sistem</p>
            <p className="text-2xl font-bold mt-1">
              {stats.systemMatch.approved}
              <span className="text-green-200 text-sm font-normal"> / {stats.systemMatch.submitted}</span>
            </p>
            <p className="text-green-100 text-xs mt-1">Approved / Submitted</p>
          </div>
          <HeartHandshake className="w-8 h-8 text-green-200 opacity-80" />
        </div>
      </div>

      {/* Tarteel Stats */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">Tarteel</p>
            <p className="text-2xl font-bold mt-1">
              {stats.tarteel.approved}
              <span className="text-purple-200 text-sm font-normal"> / {stats.tarteel.submitted}</span>
            </p>
            <p className="text-purple-100 text-xs mt-1">Approved / Submitted</p>
          </div>
          <BookOpen className="w-8 h-8 text-purple-200 opacity-80" />
        </div>
      </div>

      {/* Family Stats */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">Family</p>
            <p className="text-2xl font-bold mt-1">
              {stats.family.approved}
              <span className="text-amber-200 text-sm font-normal"> / {stats.family.submitted}</span>
            </p>
            <p className="text-amber-100 text-xs mt-1">Approved / Submitted</p>
          </div>
          <Home className="w-8 h-8 text-amber-200 opacity-80" />
        </div>
      </div>
    </div>
  )
}
