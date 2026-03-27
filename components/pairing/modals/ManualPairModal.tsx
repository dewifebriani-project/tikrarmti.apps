import React from 'react'
import { X } from 'lucide-react'
import { SelfMatchRequest } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  user1: SelfMatchRequest | null
  user2: SelfMatchRequest | null
  onUser2Select: (user: SelfMatchRequest) => void
  allRequests: SelfMatchRequest[]
  onConfirm: () => void
}

export function ManualPairModal({
  isOpen,
  onClose,
  user1,
  user2,
  onUser2Select,
  allRequests,
  onConfirm
}: Props) {
  if (!isOpen || !user1) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Pasangkan Manual
              </h3>
              <p className="text-sm text-gray-600">
                Pilih pasangan untuk {user1.user_name}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="font-medium text-gray-900">{user1.user_name}</p>
            <p className="text-sm text-gray-600">
              {user1.user_zona_waktu} • {user1.chosen_juz} • {user1.main_time_slot}
            </p>
          </div>

          <p className="text-sm font-medium text-gray-700 mb-3">Pilih pasangan:</p>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {allRequests
              .filter(r => r.user_id !== user1.user_id)
              .map((request) => (
                <div
                  key={request.id}
                  onClick={() => onUser2Select(request)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    user2?.id === request.id
                      ? 'ring-2 ring-green-500 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-900">{request.user_name}</p>
                  <p className="text-sm text-gray-600">
                    {request.user_zona_waktu} • {request.chosen_juz} • {request.main_time_slot}
                  </p>
                </div>
              ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={!user2}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Pasangkan
          </button>
        </div>
      </div>
    </div>
  )
}
