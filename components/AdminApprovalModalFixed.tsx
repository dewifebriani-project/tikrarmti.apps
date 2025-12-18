'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
  onRefresh: () => void
}

export default function AdminApprovalModalFixed({ isOpen, onClose, application, onRefresh }: ApprovalModalProps) {
  // Early return if modal is closed or no application
  if (!isOpen) {
    return null
  }

  // Validate application prop
  if (!application) {
    console.error('AdminApprovalModalFixed: No application prop provided')
    return null
  }

  console.log('=== AdminApprovalModalFixed Render ===')
  console.log('Props:', {
    isOpen,
    hasApplication: !!application,
    applicationId: application?.id,
    applicationKeys: application ? Object.keys(application) : []
  })

  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [detailedData, setDetailedData] = useState<any>(null)
  const [dataError, setDataError] = useState<string | null>(null)

  // Fetch detailed data when modal opens
  useEffect(() => {
    // Skip if modal is not open or no application
    if (!isOpen || !application) {
      return
    }

    // Add a small delay to ensure the modal is fully rendered
    const timer = setTimeout(async () => {
      console.log('About to call fetchDetailedData...')
      console.log('Application object:', application)
      console.log('Application ID:', application?.id)

      try {
        await fetchDetailedData()
        console.log('fetchDetailedData completed successfully')
      } catch (error: any) {
        console.error('Caught error in useEffect fetchDetailedData:', error)
        console.error('Error type:', typeof error)
        console.error('Error constructor:', error?.constructor?.name)
        console.error('Error properties:', Object.getOwnPropertyNames(error || {}))
        console.error('Error message:', error?.message || 'No message')
        console.error('Error stack:', error?.stack)

        // Get the actual error message
        const errorMessage = error?.message ||
                           (error && typeof error === 'object' && JSON.stringify(error)) ||
                           'An unexpected error occurred while loading data'

        setDataError(errorMessage)
        setDetailedData(application) // Fallback to original data
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isOpen, application])

  const fetchDetailedData = async () => {
    console.log('=== fetchDetailedData START ===')

    // Validate application prop
    if (!application) {
      console.error('Application prop is null or undefined')
      setDataError('No application data available')
      setDetailedData({
        id: null,
        full_name: 'Unknown Applicant',
        user: { email: 'unknown@example.com' },
        status: 'unknown'
      })
      return
    }

    console.log('Application validation passed')

    // Check if application ID exists
    if (!application.id) {
      console.error('No application ID available for fetching detailed data')
      setDataError('Invalid application ID')
      setDetailedData(application) // Fallback to original data
      return
    }

    console.log('Application ID exists:', application.id)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    try {
      const applicationId = application.id
      console.log('Fetching detailed data for application:', applicationId)

      // Use API endpoint to get detailed data with admin privileges
      const url = `/api/admin/tikrar/${applicationId}`
      console.log('Fetching from URL:', url)

      // Validate inputs before making request
      if (!url || !applicationId) {
        console.error('Invalid parameters for fetch request')
        setDataError('Invalid request parameters')
        setDetailedData(application)
        return
      }

      let response = null

      // Create fetch options object - rely on cookies for authentication
      const fetchOptions: RequestInit = {
        credentials: 'include',
        signal: controller.signal
      }

      try {
        console.log('Starting fetch request to:', url)
        response = await fetch(url, fetchOptions)

        // Validate response
        if (!response) {
          throw new Error('No response received from fetch')
        }

        console.log('Fetch completed, response status:', response.status)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        console.error('Fetch failed:', fetchError)
        setDataError('Failed to fetch application details. Using basic data.')
        setDetailedData(application) // Fallback to original data
        return
      }

      clearTimeout(timeoutId)

      if (response.ok) {
        let result;
        try {
          result = await response.json()
          console.log('Detailed data fetched via API:', result)
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError)
          setDataError('Error parsing server response')
          setDetailedData(application) // Fallback to original data
          return
        }

        if (result && result.success && result.data) {
          setDetailedData(result.data)
          setDataError(null)
        } else if (result && result.data) {
          // Handle case where API doesn't wrap in success property
          setDetailedData(result.data)
          setDataError(null)
        } else {
          console.error('No data in API response:', result)
          setDataError('No data received from server')
          setDetailedData(application) // Fallback to original data
        }
      } else {
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('Error fetching detailed data via API:', errorData)
        console.error('Response status:', response.status)
        console.error('Response statusText:', response.statusText)
        console.error('Full error data:', JSON.stringify(errorData, null, 2))

        // Extract a meaningful error message
        const errorMessage = errorData?.details || errorData?.message || errorData?.error ||
                           `Failed to fetch application data (${response.status}: ${response.statusText})`

        setDataError(errorMessage)
        setDetailedData(application) // Fallback to original data
        // Don't throw - we've already handled the error by setting state
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.error('Fetch detailed data timeout after 8 seconds')
        setDataError('Request timed out. Using basic data.')
        // Use basic application data as fallback
        setDetailedData(application)
      } else {
        // Better error handling for empty errors
        const errorMessage = error?.message ||
                           (error && typeof error === 'object' && Object.keys(error).length === 0
                             ? 'Unknown error occurred (empty error object)'
                             : 'Unexpected error occurred while fetching data')

        console.error('Error in fetchDetailedData:', error)
        console.error('Error type:', typeof error)
        console.error('Error message:', errorMessage)
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
        setDataError(errorMessage)
        setDetailedData(application) // Fallback to original data
      }
    }
  }

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

      console.log('Sending approve request for application ID:', application.id)
      console.log('Update data:', updateData)

      // Use API route to update with admin privileges - cookies handle authentication
      const response = await fetch('/api/admin/tikrar/approve', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: application.id,
          updateData
        })
      })

      console.log('Approve API response status:', response.status)

      const responseData = await response.json()
      console.log('Approve API response data:', responseData)

      if (!response.ok) {
        const errorMessage = (responseData as any).message || (responseData as any).error || 'Failed to update application'
        console.error('Approve API error:', responseData)
        throw new Error(errorMessage)
      }

      console.log('Application updated successfully')
      onRefresh()
      onClose()
      setAction(null)
      setReason('')
    } catch (error) {
      console.error('Error updating application:', error)
      alert(`Gagal memperbarui status aplikasi: ${(error as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Defensive checks to ensure we have the data we need
  const applicationName = application?.full_name || application?.user?.full_name || 'Unknown Applicant';
  const applicationEmail = application?.email || application?.user?.email || 'unknown@example.com';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-25" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Review Application: {applicationName}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Email: {applicationEmail}
            </p>
            {(detailedData || application) && (
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-gray-500">
                  ID: {detailedData?.id || application?.id || 'unknown'}
                </span>
                <span className="text-xs text-gray-500">
                  User ID: {detailedData?.user_id || application?.user_id || 'unknown'}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                  {detailedData?.status || application?.status || 'unknown'}
                </span>
              </div>
            )}
          </div>

          {!action && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {!detailedData && !dataError ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Loading detailed data...</div>
                </div>
              ) : dataError ? (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                    <p className="text-sm text-yellow-800 font-medium">Warning</p>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">{dataError}</p>
                  <p className="text-xs text-yellow-600 mt-2">Showing basic application data</p>
                </div>
              ) : (
              <>
                {/* Personal Data Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
                  Data Personal Lengkap
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Nama Lengkap:</div>
                  <div className="font-medium">{detailedData?.full_name || detailedData?.user?.full_name || application?.full_name || application?.user?.full_name || '-'}</div>

                  <div className="text-gray-600">Email:</div>
                  <div className="font-medium">{detailedData?.user?.email || application?.user?.email || application?.email || '-'}</div>

                  <div className="text-gray-600">Tanggal Lahir:</div>
                  <div className="font-medium">
                    {application?.tanggal_lahir
                      ? new Date(application.tanggal_lahir).toLocaleDateString('id-ID')
                      : '-'}
                  </div>

                  <div className="text-gray-600">Umur:</div>
                  <div className="font-medium">{detailedData?.age || application?.age || '-'} tahun</div>

                  <div className="text-gray-600">No. Telepon:</div>
                  <div className="font-medium">{application?.wa_phone || '-'}</div>

                  <div className="text-gray-600">Domisili:</div>
                  <div className="font-medium">{application?.provinsi || '-'}</div>

                  <div className="text-gray-600">Alamat Lengkap:</div>
                  <div className="font-medium col-span-2">{application?.address || '-'}</div>

                  <div className="text-gray-600">Time Zone:</div>
                  <div className="font-medium">{application?.zona_waktu || 'WIB'}</div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                  Informasi Kontak
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">No. WhatsApp:</div>
                  <div className="font-medium">{application?.wa_phone || '-'}</div>

                  <div className="text-gray-600">No. Telegram:</div>
                  <div className="font-medium">{application?.telegram_phone || '-'}</div>

                  <div className="text-gray-600">Alamat:</div>
                  <div className="font-medium col-span-2">{application?.address || '-'}</div>
                </div>
              </div>

              {/* Program Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
                  Detail Program Lengkap
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Batch:</div>
                  <div className="font-medium">{detailedData?.batch?.name || detailedData?.batch_name || application?.batch?.name || application?.batch_name || '-'}</div>

                  {detailedData?.batch?.start_date && (
                    <>
                      <div className="text-gray-600">Batch Period:</div>
                      <div className="font-medium">
                        {new Date(detailedData.batch.start_date).toLocaleDateString('id-ID')} -
                        {detailedData.batch.end_date ? new Date(detailedData.batch.end_date).toLocaleDateString('id-ID') : 'Ongoing'}
                      </div>
                    </>
                  )}

                  <div className="text-gray-600">Program:</div>
                  <div className="font-medium">{detailedData?.program?.name || application?.program?.name || 'Tikrar Tahfidz'}</div>

                  {detailedData?.program?.description && (
                    <>
                      <div className="text-gray-600">Deskripsi Program:</div>
                      <div className="font-medium col-span-2">{detailedData.program.description}</div>
                    </>
                  )}

                  <div className="text-gray-600">Juz Pilihan:</div>
                  <div className="font-medium">{detailedData?.chosen_juz || application?.chosen_juz || '-'}</div>

                  <div className="text-gray-600">Main Time Slot:</div>
                  <div className="font-medium">{detailedData?.main_time_slot || application?.main_time_slot || '-'}</div>

                  <div className="text-gray-600">Backup Time Slot:</div>
                  <div className="font-medium">{detailedData?.backup_time_slot || application?.backup_time_slot || '-'}</div>

                  <div className="text-gray-600">Tgl Pengajuan:</div>
                  <div className="font-medium">
                    {new Date(detailedData?.submission_date || application?.submission_date).toLocaleDateString('id-ID')}
                  </div>

                  {detailedData?.approved_at && (
                    <>
                      <div className="text-gray-600">Tgl Disetujui:</div>
                      <div className="font-medium">{new Date(detailedData.approved_at).toLocaleString('id-ID')}</div>
                    </>
                  )}

                  {detailedData?.approved_by && (
                    <>
                      <div className="text-gray-600">Disetujui Oleh:</div>
                      <div className="font-medium">{detailedData?.approver?.full_name || 'Admin'}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Commitment Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
                  Komitmen & Persetujuan
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded ${application?.understands_commitment ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Memahami komitmen program</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded ${application?.tried_simulation ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Sudah coba simulasi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded ${application?.no_negotiation ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Tidak ada negosiasi jadwal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded ${application?.has_telegram ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Memiliki akun Telegram</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded ${application?.saved_contact ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Menyimpan nomor kontak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded ${application?.no_travel_plans ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Tidak ada rencana traveling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded ${application?.time_commitment ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Komitmen waktu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded ${application?.understands_program ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Memahami program</span>
                  </div>
                </div>
              </div>

              {/* Permission Section */}
              {application?.has_permission && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 bg-pink-500 rounded-full"></span>
                    Izin Wali
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Status Izin:</div>
                    <div className="font-medium capitalize">{application.has_permission}</div>

                    {application.has_permission !== 'yes' && (
                      <>
                        <div className="text-gray-600">Nama Wali:</div>
                        <div className="font-medium">{application.permission_name || '-'}</div>

                        <div className="text-gray-600">No. Telp Wali:</div>
                        <div className="font-medium">{application.permission_phone || '-'}</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(application?.motivation || application?.questions) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 bg-indigo-500 rounded-full"></span>
                    Informasi Tambahan
                  </h4>
                  <div className="space-y-2 text-sm">
                    {application.motivation && (
                      <div>
                        <div className="text-gray-600">Motivasi:</div>
                        <div className="font-medium">{application.motivation}</div>
                      </div>
                    )}
                    {application.ready_for_team && (
                      <div>
                        <div className="text-gray-600">Kesiapan Tim:</div>
                        <div className="font-medium capitalize">{application.ready_for_team.replace('_', ' ')}</div>
                      </div>
                    )}
                    {application.questions && (
                      <div>
                        <div className="text-gray-600">Pertanyaan:</div>
                        <div className="font-medium">{application.questions}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Test/Oral Submission Section */}
              {(detailedData?.oral_submitted_at || detailedData?.written_submitted_at || application?.oral_submitted_at || application?.written_submitted_at) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 bg-teal-500 rounded-full"></span>
                    Hasil Tes
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {(detailedData?.oral_submitted_at || application?.oral_submitted_at) && (
                      <>
                        <div className="text-gray-600">Oral Submitted:</div>
                        <div className="font-medium">
                          {new Date(detailedData?.oral_submitted_at || application?.oral_submitted_at).toLocaleString('id-ID')}
                        </div>

                        {(detailedData?.oral_submission_file_name || application?.oral_submission_file_name) && (
                          <>
                            <div className="text-gray-600">Oral File:</div>
                            <div className="font-medium">
                              {detailedData?.oral_submission_file_name || application?.oral_submission_file_name}
                            </div>
                          </>
                        )}

                        {(detailedData?.oral_submission_url || application?.oral_submission_url) && (
                          <>
                            <div className="text-gray-600">Oral Recording:</div>
                            <div className="font-medium">
                              <a
                                href={detailedData?.oral_submission_url || application?.oral_submission_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                Lihat Recording
                              </a>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {(detailedData?.written_submitted_at || application?.written_submitted_at) && (
                      <>
                        <div className="text-gray-600">Written Submitted:</div>
                        <div className="font-medium">
                          {new Date(detailedData?.written_submitted_at || application?.written_submitted_at).toLocaleString('id-ID')}
                        </div>

                        {(detailedData?.written_quiz_score !== null || application?.written_quiz_score !== null) && (
                          <>
                            <div className="text-gray-600">Written Score:</div>
                            <div className="font-medium">
                              {detailedData?.written_quiz_score || application?.written_quiz_score}/
                              {detailedData?.written_quiz_total_questions || application?.written_quiz_total_questions || '-'}
                              ({detailedData?.written_quiz_correct_answers || application?.written_quiz_correct_answers || '-'} benar)
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
              </>
              )}

              {application?.status === 'pending' && (
                <div className="flex gap-3 pt-2">
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
              )}
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
                  You are about to <strong>{action || 'process'}</strong> this application.
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