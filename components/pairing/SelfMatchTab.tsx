import React from 'react'
import { Clock, CheckCircle, Heart, ArrowRight, Users, XCircle } from 'lucide-react'
import { SelfMatchRequest } from './types'

interface Props {
  requests: SelfMatchRequest[]
  onApprove: (request: SelfMatchRequest) => void
  onManualPair: (request: SelfMatchRequest) => void
  onReject: (id: string) => void
}

export function SelfMatchTab({ requests, onApprove, onManualPair, onReject }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Request Pasangan Sendiri
      </h3>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada request pasangan sendiri</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`border rounded-lg overflow-hidden hover:shadow-md transition-all ${
                request.is_paired
                  ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50'
                  : request.is_mutual_match
                    ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50'
                    : 'border-gray-200'
              }`}
            >
              {/* Paired Header */}
              {request.is_paired && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold text-sm">SUDAH DIPASANGKAN</span>
                  </div>
                  <span className="text-white/90 text-xs">Pasangan: {request.paired_partner_name}</span>
                </div>
              )}
              {/* Mutual Match Header (only if not yet paired) */}
              {!request.is_paired && request.is_mutual_match && (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Heart className="w-4 h-4" />
                    <span className="font-semibold text-sm">MUTUAL MATCH</span>
                  </div>
                  <span className="text-white/90 text-xs">Keduanya saling memilih</span>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center gap-4">
                  {/* User 1 Card */}
                  <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">1</span>
                      </div>
                      <p className="font-semibold text-gray-900">{request.user_name}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                          {request.user_zona_waktu || 'WIB'}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded font-medium">
                          {request.chosen_juz}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Waktu Belajar:</p>
                        <div className="flex flex-wrap gap-1 text-xs">
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">
                            Utama: {request.main_time_slot}
                          </span>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded">
                            Cadangan: {request.backup_time_slot}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connection Icon */}
                  <div className={`flex flex-col items-center justify-center ${request.is_mutual_match ? 'text-green-600' : 'text-gray-400'}`}>
                    {request.is_mutual_match ? (
                      <>
                        <Heart className="w-8 h-8 fill-current" />
                        <span className="text-xs font-medium mt-1">Match!</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-6 h-6" />
                        <span className="text-xs mt-1">memilih</span>
                      </>
                    )}
                  </div>

                  {/* User 2 Card */}
                  <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">2</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {request.partner_details?.full_name || 'Unknown'}
                      </p>
                      {!request.is_mutual_match && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          belum memilih
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                          {request.partner_details?.zona_waktu || 'WIB'}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded font-medium">
                          {request.partner_details?.chosen_juz}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Waktu Belajar:</p>
                        <div className="flex flex-wrap gap-1 text-xs">
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">
                            Utama: {request.partner_details?.main_time_slot || '-'}
                          </span>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded">
                            Cadangan: {request.partner_details?.backup_time_slot || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {request.is_mutual_match ? (
                      <button
                        onClick={() => onApprove(request)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onManualPair(request)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-sm"
                          title="Pasangkan manual dengan thalibah lain"
                        >
                          <Users className="w-4 h-4" />
                          Manual Pair
                        </button>
                        <button
                          onClick={() => onReject(request.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-medium shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
