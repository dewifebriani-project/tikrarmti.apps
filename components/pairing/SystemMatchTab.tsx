import React from 'react'
import { Clock, Users, RotateCcw, Search, Eye } from 'lucide-react'
import { SystemMatchRequest, SortConfig } from './types'

interface Props {
  requests: SystemMatchRequest[]
  onFindMatches: (request: SystemMatchRequest) => void
  onBulkPair: () => void
  onRevertAll: () => void
  onViewDetail: (request: SystemMatchRequest) => void
  onRevertPairing: (request: SystemMatchRequest) => void
  onAddToPair: (user: any) => void
  onChangePartnerType: (user: any, type: 'family' | 'tarteel') => void
  sortConfigs: SortConfig[]
  onSort: (key: string) => void
  calculateAge: (date: string) => number | string
  renderMatchAnalysis: (request: SystemMatchRequest) => React.ReactNode
  hasExistingPairings: boolean
}

export function SystemMatchTab({
  requests,
  onFindMatches,
  onBulkPair,
  onRevertAll,
  onViewDetail,
  onRevertPairing,
  onAddToPair,
  onChangePartnerType,
  sortConfigs,
  onSort,
  calculateAge,
  renderMatchAnalysis,
  hasExistingPairings
}: Props) {
  const getSortIndicator = (key: string) => {
    const config = sortConfigs.find(c => c.key === key)
    if (!config) return null
    return config.direction === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Request Dipasangkan Sistem
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{requests.length} permintaan</span>
          <button
            onClick={onBulkPair}
            disabled={!requests.some(r => !r.is_paired)}
            className={`px-3 py-1.5 text-white rounded-lg flex items-center gap-1.5 text-xs font-medium shadow-sm ${
              requests.some(r => !r.is_paired)
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Cari Pasangan Massal
          </button>
          {requests.some(r => r.is_paired) && (
            <button
              onClick={onRevertAll}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1.5 text-xs font-medium shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Revert All
            </button>
          )}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada request dipasangkan sistem</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => onSort('user_name')}>
                  Nama {getSortIndicator('user_name')}
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasangan
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => onSort('user_zona_waktu')}>
                  Zona {getSortIndicator('user_zona_waktu')}
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => onSort('chosen_juz')}>
                  Juz {getSortIndicator('chosen_juz')}
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usia
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  W. Utama
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  W. Cadangan
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Analisis Kecocokan
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className={`hover:bg-gray-50 ${request.is_paired ? 'bg-green-50' : ''}`}>
                  <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {request.user_name}
                  </td>
                  <td className="px-2 py-2 text-sm">
                    {request.is_paired ? (
                      <div className="flex flex-col gap-1">
                        {(request.partner_names || [request.partner_name]).filter(Boolean).map((name, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                            {name}
                          </span>
                        ))}
                        {(request.partner_names?.length || 0) >= 2 && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            Grup 3
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Belum ada</span>
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-600">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {request.user_zona_waktu || 'WIB'}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-600">
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      {request.chosen_juz}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-left">
                    <span className="text-gray-700">{calculateAge(request.user_tanggal_lahir)}</span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-600">
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {request.main_time_slot || '-'}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-600">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                      {request.backup_time_slot || '-'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-700 min-w-[300px]">
                    {renderMatchAnalysis(request)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                    {!request.is_paired ? (
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => onFindMatches(request)}
                          className="px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-xs"
                        >
                          <Search className="w-3.5 h-3.5" />
                          Cari
                        </button>
                        {hasExistingPairings && (
                          <button
                            onClick={() => onAddToPair({
                              userId: request.user_id,
                              userName: request.user_name,
                              mainTimeSlot: request.main_time_slot,
                              chosenJuz: request.chosen_juz
                            })}
                            className="px-2 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1 text-xs"
                            title="Tambahkan ke pasangan yang sudah ada"
                          >
                            <Users className="w-3.5 h-3.5" />
                            +Grup
                          </button>
                        )}
                        <button
                          onClick={() => onChangePartnerType(request, 'family')}
                          className="px-2 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-1 text-xs"
                          title="Pindah ke Family"
                        >
                          <HeartHandshake className="w-3.5 h-3.5" />
                          Family
                        </button>
                        <button
                          onClick={() => onChangePartnerType(request, 'tarteel')}
                          className="px-2 py-1.5 bg-purple-700 text-white rounded-lg hover:bg-purple-800 flex items-center gap-1 text-xs"
                          title="Pindah ke Tarteel"
                        >
                          <Users className="w-3.5 h-3.5" />
                          Tarteel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => onViewDetail(request)}
                          className="px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                        <button
                          onClick={() => onRevertPairing(request)}
                          className="px-2 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1 text-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Revert
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
