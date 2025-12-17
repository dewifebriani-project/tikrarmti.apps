'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
  onRefresh: () => void
}

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export default function AdminApprovalModalFixed({ isOpen, onClose, application, onRefresh }: ApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!action) return

    setIsSubmitting(true)
    try {
      const updateData = {
        status: action === 'approve' ? 'approved' : 'rejected',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (action === 'reject' && reason) {
        (updateData as any).rejection_reason = reason
      }

      // Use admin client to update
      const { error } = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .update(updateData)
        .eq('id', application.id)

      if (error) throw error

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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          )}

          {action && (
            <div className="space-y-4">
              {action === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              )}

              <div className="bg-yellow-50 p-3 rounded-md">
                <p className="text-sm text-yellow-800">
                  You are about to <strong>{action}</strong> this application.
                  {action === 'reject' && ' The applicant will be notified of your decision.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAction(null)
                    setReason('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (action === 'reject' && !reason)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Processing...' : `Confirm ${action}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}