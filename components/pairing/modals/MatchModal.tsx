import React from 'react'
import { Users, X } from 'lucide-react'
import { SystemMatchRequest, MatchData, MatchCandidate, SortConfig } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  selectedUser: SystemMatchRequest | null
  matchData: MatchData | null
  selectedMatch: MatchCandidate | null
  onSelectMatch: (match: MatchCandidate) => void
  onConfirm: () => void
  calculateAge: (date: string) => number | string
  matchSortConfigs: SortConfig[]
  onMatchSort: (key: string) => void
}

export function MatchModal({
  isOpen,
  onClose,
  selectedUser,
  matchData,
  selectedMatch,
  onSelectMatch,
  onConfirm,
  calculateAge,
  matchSortConfigs,
  onMatchSort
}: Props) {
  if (!isOpen || !selectedUser) return null

  const getSortIndicator = (key: string) => {
    const config = matchSortConfigs.find(c => c.key === key)
    if (!config) return null
    return config.direction === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Pasangan untuk {selectedUser.user_name}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedUser.chosen_juz} • {selectedUser.user_zona_waktu || 'WIB'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedUser && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Yang Dicari Pasangan:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="font-medium">Nama:</span> {selectedUser.user_name}</div>
                <div><span className="font-medium">Usia:</span> {calculateAge(selectedUser.user_tanggal_lahir)}</div>
                <div><span className="font-medium">Juz:</span> {selectedUser.chosen_juz}</div>
                <div><span className="font-medium">Zona Waktu:</span> {selectedUser.user_zona_waktu}</div>
                <div><span className="font-medium">Waktu Utama:</span> {selectedUser.main_time_slot}</div>
                <div><span className="font-medium">Waktu Cadangan:</span> {selectedUser.backup_time_slot}</div>
              </div>
            </div>
          )}

          {!matchData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Mencari kandidat pasangan...</p>
            </div>
          ) : matchData.total_matches === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada kandidat pasangan tersedia</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Pilih</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => onMatchSort('full_name')}>
                        Nama {getSortIndicator('full_name')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => onMatchSort('tanggal_lahir')}>
                        Usia {getSortIndicator('tanggal_lahir')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => onMatchSort('chosen_juz')}>
                        Juz {getSortIndicator('chosen_juz')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => onMatchSort('zona_waktu')}>
                        Zona {getSortIndicator('zona_waktu')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => onMatchSort('main_time_slot')}>
                        Waktu Utama {getSortIndicator('main_time_slot')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => onMatchSort('backup_time_slot')}>
                        Waktu Cadangan {getSortIndicator('backup_time_slot')}
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => onMatchSort('match_score')}>
                        Score {getSortIndicator('match_score')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {matchData.candidates.map((candidate) => (
                      <tr
                        key={candidate.user_id}
                        onClick={() => onSelectMatch(candidate)}
                        className={`cursor-pointer transition-colors ${
                          selectedMatch?.user_id === candidate.user_id ? 'bg-green-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedMatch?.user_id === candidate.user_id ? 'border-green-600 bg-green-600' : 'border-gray-300'
                          }`}>
                            {selectedMatch?.user_id === candidate.user_id && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900">{candidate.full_name || '-'}</td>
                        <td className="px-4 py-2 text-gray-700">{calculateAge(candidate.tanggal_lahir)}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            {candidate.chosen_juz || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {candidate.zona_waktu || 'WIB'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            {candidate.main_time_slot || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                            {candidate.backup_time_slot || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            candidate.match_score >= 100 ? 'bg-green-100 text-green-800' :
                            candidate.match_score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {candidate.match_score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedMatch}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Buat Pasangan
          </button>
        </div>
      </div>
    </div>
  )
}
