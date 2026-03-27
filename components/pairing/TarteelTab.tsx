import React from 'react'
import { Clock, CheckCircle, RotateCcw, BookOpen, HeartHandshake } from 'lucide-react'
import { TarteelRequest } from './types'

interface Props {
  requests: TarteelRequest[]
  onApprove: (request: TarteelRequest) => void
  onRevert: (request: TarteelRequest) => void
  onChangePartnerType: (user: any, type: 'system_match') => void
  calculateAge: (date: string) => number | string
}

export function TarteelTab({ requests, onApprove, onRevert, onChangePartnerType, calculateAge }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Request Pasangan Tarteel
        </h3>
        <span className="text-sm text-gray-600">{requests.length} permintaan</span>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada request pasangan tarteel</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasangan Tarteel
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zona
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Juz
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
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detail Pasangan
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {request.paired_partner_name}
                        </span>
                        {(request.paired_partner_names?.length || 0) >= 2 && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            Grup 3
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Belum dipasangkan</span>
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
                  <td className="px-2 py-2 text-sm text-gray-700 max-w-xs">
                    <div className="space-y-1">
                      <div>
                        <span className="text-xs text-gray-500">Nama:</span>
                        <p className="text-xs font-medium truncate">{request.partner_name || '-'}</p>
                      </div>
                      {request.partner_relationship && (
                        <div>
                          <span className="text-xs text-gray-500">Hubungan:</span>
                          <p className="text-xs">{request.partner_relationship}</p>
                        </div>
                      )}
                      {request.partner_notes && (
                        <div>
                          <span className="text-xs text-gray-500">Catatan:</span>
                          <p className="text-xs truncate" title={request.partner_notes}>{request.partner_notes.substring(0, 50)}{request.partner_notes.length > 50 ? '...' : ''}</p>
                        </div>
                      )}
                      {request.partner_wa_phone && (
                        <div>
                          <span className="text-xs text-gray-500">WA:</span>
                          <p className="text-xs text-green-700">{request.partner_wa_phone}</p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-xs">
                    {request.is_paired ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        Dipasangkan
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        Menunggu
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center text-sm">
                    {!request.is_paired ? (
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => onApprove(request)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-xs font-medium shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => onChangePartnerType(request, 'system_match')}
                          className="px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-xs font-medium shadow-sm"
                          title="Pindah ke System Match"
                        >
                          <HeartHandshake className="w-3.5 h-3.5" />
                          System
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => onRevert(request)}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1 text-xs font-medium shadow-sm"
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
