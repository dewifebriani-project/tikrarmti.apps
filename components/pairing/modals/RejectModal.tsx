import React from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  reason: string
  onReasonChange: (reason: string) => void
  onConfirm: () => void
}

export function RejectModal({ isOpen, onClose, reason, onReasonChange, onConfirm }: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reject Request
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Request ini akan dipindahkan ke tab "Dipasangkan Sistem" untuk dicarikan pasangan oleh admin.
          </p>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Alasan reject (opsional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900"
            rows={3}
          />
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
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}
