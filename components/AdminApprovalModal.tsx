'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
  onRefresh: () => void
}

export default function AdminApprovalModal({ isOpen, onClose, application, onRefresh }: ApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!action) return

    setIsSubmitting(true)
    try {
      const currentUser = (await supabase.auth.getUser()).data.user

      let updateResult: any

      if (action === 'reject' && reason) {
        // @ts-ignore - TypeScript has issues with Supabase update typing
        updateResult = await supabase
          .from('pendaftaran_tikrar_tahfidz')
          .update({
            status: 'rejected',
            approved_by: currentUser?.id,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            rejection_reason: reason
          })
          .eq('id', application.id)
      } else {
        // @ts-ignore - TypeScript has issues with Supabase update typing
        updateResult = await supabase
          .from('pendaftaran_tikrar_tahfidz')
          .update({
            status: action === 'approve' ? 'approved' : 'rejected',
            approved_by: currentUser?.id,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', application.id)
      }

      if (updateResult.error) throw updateResult.error

      onRefresh()
      onClose()
      setAction(null)
      setReason('')
    } catch (error) {
      console.error('Error updating application:', error)
      alert('Gagal memperbarui status aplikasi')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !application) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-25" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Review Application: {application.full_name || application.user?.full_name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Email: {application.user?.email}
            </p>
          </div>

          {!action && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Application Details:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Batch:</strong> {application.batch_name || application.batch?.name}</p>
                  <p><strong>Chosen Juz:</strong> {application.chosen_juz}</p>
                  <p><strong>Submission Date:</strong> {new Date(application.submission_date).toLocaleDateString('id-ID')}</p>
                  <p><strong>Time Slot:</strong> {application.main_time_slot}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAction('approve')}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {action && (
            <div className="space-y-4">
              {action === 'approve' ? (
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-green-800">Approve this application?</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center p-3 bg-red-50 rounded-lg mb-3">
                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-red-800">Reject this application?</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for rejection (optional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter reason for rejection..."
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg ${
                    action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:bg-gray-400`}
                >
                  {isSubmitting ? 'Processing...' : `Confirm ${action}`}
                </button>
                <button
                  onClick={() => {
                    setAction(null)
                    setReason('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}