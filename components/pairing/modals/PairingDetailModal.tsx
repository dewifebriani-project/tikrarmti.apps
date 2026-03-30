import React from 'react'
import { HeartHandshake, Info } from 'lucide-react'
import { PairingDetail } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  loading: boolean
  detail: PairingDetail | null
  calculateAge: (date: string | undefined | null) => number | string
  hasTimeSlotOverlap: (s1: string, s2: string) => boolean
}

export function PairingDetailModal({
  isOpen,
  onClose,
  loading,
  detail,
  calculateAge,
  hasTimeSlotOverlap
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detail Pasangan</h3>
                <p className="text-sm text-gray-600">Informasi lengkap pasangan belajar</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat detail pasangan...</p>
            </div>
          ) : !detail ? (
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Detail pasangan tidak tersedia</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pairing Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-green-900">Informasi Pasangan</h4>
                  {detail.pairing.is_group_of_3 && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      Grup 3 Orang
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-green-700">Tipe Pairing:</span>{' '}
                    <span className="font-medium">{detail.pairing.pairing_type}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Tanggal Dibuat:</span>{' '}
                    <span className="font-medium">
                      {detail.pairing.paired_at
                        ? new Date(detail.pairing.paired_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Users Grid - 2 or 3 columns */}
              <div className={`grid gap-4 ${detail.user_3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {/* User 1 */}
                <div className="border border-blue-200 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="bg-blue-600 text-white px-3 py-2 flex items-center gap-2">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xs">1</span>
                    </div>
                    <span className="font-semibold text-xs">Thalibah Pertama</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Nama</p>
                      <p className="font-semibold text-gray-900 text-sm">{detail.user_1.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Usia</p>
                      <p className="text-xs text-gray-700">{calculateAge(detail.user_1.tanggal_lahir)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-xs text-gray-700 truncate">{detail.user_1.email}</p>
                    </div>
                    <div className="flex gap-2">
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      Juz {detail.user_1.chosen_juz}
                    </span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {detail.user_1.zona_waktu}
                    </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Waktu Utama</p>
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {detail.user_1.main_time_slot}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Waktu Cadangan</p>
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                        {detail.user_1.backup_time_slot}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User 2 */}
                <div className="border border-purple-200 rounded-lg overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="bg-purple-600 text-white px-3 py-2 flex items-center gap-2">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-xs">2</span>
                    </div>
                    <span className="font-semibold text-xs">Thalibah Kedua</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Nama</p>
                      <p className="font-semibold text-gray-900 text-sm">{detail.user_2.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Usia</p>
                      <p className="text-xs text-gray-700">{calculateAge(detail.user_2.tanggal_lahir)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-xs text-gray-700 truncate">{detail.user_2.email}</p>
                    </div>
                    <div className="flex gap-2">
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      Juz {detail.user_2.chosen_juz}
                    </span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {detail.user_2.zona_waktu}
                    </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Waktu Utama</p>
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {detail.user_2.main_time_slot}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Waktu Cadangan</p>
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                        {detail.user_2.backup_time_slot}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User 3 (if exists) */}
                {detail.user_3 && (
                  <div className="border border-amber-200 rounded-lg overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
                    <div className="bg-amber-600 text-white px-3 py-2 flex items-center gap-2">
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <span className="text-amber-600 font-bold text-xs">3</span>
                      </div>
                      <span className="font-semibold text-xs">Thalibah Ketiga</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Nama</p>
                        <p className="font-semibold text-gray-900 text-sm">{detail.user_3.full_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Usia</p>
                        <p className="text-xs text-gray-700">{calculateAge(detail.user_3?.tanggal_lahir)}</p>
                      </div>
                      <div className="flex gap-2">
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        Juz {detail.user_3.chosen_juz}
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {detail.user_3.zona_waktu}
                      </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Match Analysis */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Analisis Kecocokan</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      detail.user_1.chosen_juz === detail.user_2.chosen_juz ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span>
                      Juz: {detail.user_1.chosen_juz === detail.user_2.chosen_juz ? 'Sama ✓' : 'Beda'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      detail.user_1.zona_waktu === detail.user_2.zona_waktu ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span>
                      Zona: {detail.user_1.zona_waktu === detail.user_2.zona_waktu ? 'Sama ✓' : 'Beda'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      hasTimeSlotOverlap(detail.user_1.main_time_slot, detail.user_2.main_time_slot) ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span>
                      Waktu Utama: {hasTimeSlotOverlap(detail.user_1.main_time_slot, detail.user_2.main_time_slot) ? 'Cocok ✓' : 'Tidak cocok'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
