import React from 'react'
import { XCircle } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  user: any
  newType: 'family' | 'tarteel' | 'system_match' | null
  partnerName: string
  onPartnerNameChange: (val: string) => void
  relationship: string
  onRelationshipChange: (val: string) => void
  notes: string
  onNotesChange: (val: string) => void
  onConfirm: () => void
}

export function PartnerTypeModal({
  isOpen,
  onClose,
  user,
  newType,
  partnerName,
  onPartnerNameChange,
  relationship,
  onRelationshipChange,
  notes,
  onNotesChange,
  onConfirm
}: Props) {
  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ubah Tipe Partner
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Untuk: <span className="font-medium">{user.user_name}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {newType === 'family' && 'User akan dipindahkan ke Family. Pasangan adalah keluarga di luar aplikasi.'}
              {newType === 'tarteel' && 'User akan dipindahkan ke Tarteel. Pasangan adalah akun Tarteel di luar aplikasi.'}
              {newType === 'system_match' && 'User akan dipindahkan ke System Match untuk dipasangkan dengan user lain di sistem.'}
            </p>
          </div>

          {newType !== 'system_match' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Pasangan {newType === 'family' ? 'Keluarga' : 'Tarteel'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => onPartnerNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={newType === 'family' ? 'Contoh: Ibu/Suami/Kakak' : 'Username akun Tarteel'}
                />
              </div>

              {newType === 'family' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hubungan Keluarga
                  </label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => onRelationshipChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: Ibu, Suami, Kakak, Adik"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={newType !== 'system_match' && !partnerName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Ubah Tipe Partner
          </button>
        </div>
      </div>
    </div>
  )
}
