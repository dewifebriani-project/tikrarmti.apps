'use client'

import { useState, useEffect } from 'react'
import { HeartHandshake, UserCheck, Users, CheckCircle, XCircle, Clock, Search, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface SelfMatchRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_zona_waktu: string
  user_wa_phone: string
  chosen_juz: string
  main_time_slot: string
  backup_time_slot: string
  partner_user_id: string
  partner_details: {
    id: string
    full_name: string
    email: string
    zona_waktu: string
    wa_phone: string
    chosen_juz: string
    main_time_slot: string
    backup_time_slot: string
  } | null
  submitted_at: string
  batch_id: string
  batch_name: string
}

interface SystemMatchRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_zona_waktu: string
  chosen_juz: string
  main_time_slot: string
  backup_time_slot: string
  submitted_at: string
  batch_id: string
  batch_name: string
}

interface MatchCandidate {
  user_id: string
  full_name: string
  email: string
  zona_waktu: string
  wa_phone: string
  chosen_juz: string
  main_time_slot: string
  backup_time_slot: string
  match_score: number
  match_reasons: string[]
}

interface MatchData {
  user: {
    user_id: string
    full_name: string
    chosen_juz: string
    zona_waktu: string
    main_time_slot: string
    backup_time_slot: string
  }
  matches: {
    perfect: MatchCandidate[]
    zona_waktu: MatchCandidate[]
    same_juz: MatchCandidate[]
    cross_juz: MatchCandidate[]
  }
  total_matches: number
}

export function AdminPairingTab() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'self' | 'system'>('self')
  const [selfMatchRequests, setSelfMatchRequests] = useState<SelfMatchRequest[]>([])
  const [systemMatchRequests, setSystemMatchRequests] = useState<SystemMatchRequest[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')
  const [batches, setBatches] = useState<any[]>([])

  // Match modal state
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemMatchRequest | null>(null)
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<MatchCandidate | null>(null)

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<string>('')

  useEffect(() => {
    loadBatches()
  }, [])

  useEffect(() => {
    if (selectedBatchId) {
      loadPairingRequests()
    }
  }, [selectedBatchId])

  const loadBatches = async () => {
    try {
      const response = await fetch('/api/admin/batches')
      if (response.ok) {
        const result = await response.json()
        const activeBatches = (result.data || []).filter((b: any) =>
          b.status === 'open' || b.status === 'closed'
        )
        setBatches(activeBatches)
        if (activeBatches.length > 0) {
          setSelectedBatchId(activeBatches[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading batches:', error)
      toast.error('Failed to load batches')
    }
  }

  const loadPairingRequests = async () => {
    if (!selectedBatchId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/pairing?batch_id=${selectedBatchId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch pairing requests')
      }

      const result = await response.json()
      setSelfMatchRequests(result.data?.self_match_requests || [])
      setSystemMatchRequests(result.data?.system_match_requests || [])
    } catch (error) {
      console.error('Error loading pairing requests:', error)
      toast.error('Failed to load pairing requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request: SelfMatchRequest) => {
    const toastId = toast.loading('Approving pairing...')

    try {
      const response = await fetch('/api/admin/pairing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: request.id,
          user_1_id: request.user_id,
          user_2_id: request.partner_user_id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Pairing approved successfully!', { id: toastId })
        loadPairingRequests()
      } else {
        toast.error(result.error || 'Failed to approve pairing', { id: toastId })
      }
    } catch (error) {
      console.error('Error approving pairing:', error)
      toast.error('Failed to approve pairing', { id: toastId })
    }
  }

  const handleReject = async () => {
    const toastId = toast.loading('Rejecting request...')

    try {
      const response = await fetch('/api/admin/pairing/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: rejectingId,
          reason: rejectReason,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Request rejected', { id: toastId })
        setShowRejectModal(false)
        setRejectReason('')
        setRejectingId('')
        loadPairingRequests()
      } else {
        toast.error(result.error || 'Failed to reject request', { id: toastId })
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Failed to reject request', { id: toastId })
    }
  }

  const handleFindMatches = async (user: SystemMatchRequest) => {
    setSelectedUser(user)
    setShowMatchModal(true)
    setMatchData(null)
    setSelectedMatch(null)

    try {
      const response = await fetch(
        `/api/admin/pairing/match?user_id=${user.user_id}&batch_id=${user.batch_id}`
      )

      if (!response.ok) {
        throw new Error('Failed to find matches')
      }

      const result = await response.json()
      setMatchData(result.data)
    } catch (error) {
      console.error('Error finding matches:', error)
      toast.error('Failed to find matches')
    }
  }

  const handleCreatePairing = async () => {
    if (!selectedUser || !selectedMatch || !matchData) return

    const toastId = toast.loading('Creating pairing...')

    try {
      const response = await fetch('/api/admin/pairing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_1_id: selectedUser.user_id,
          user_2_id: selectedMatch.user_id,
          batch_id: selectedUser.batch_id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Pairing created successfully!', { id: toastId })
        setShowMatchModal(false)
        setSelectedUser(null)
        setMatchData(null)
        setSelectedMatch(null)
        loadPairingRequests()
      } else {
        toast.error(result.error || 'Failed to create pairing', { id: toastId })
      }
    } catch (error) {
      console.error('Error creating pairing:', error)
      toast.error('Failed to create pairing', { id: toastId })
    }
  }

  if (loading && batches.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Penentuan Pasangan Belajar</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review dan set pasangan belajar berdasarkan request daftar ulang
          </p>
        </div>
      </div>

      {/* Batch Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih Batch
        </label>
        <select
          value={selectedBatchId}
          onChange={(e) => {
            setSelectedBatchId(e.target.value)
            setLoading(true)
          }}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900"
        >
          <option value="">-- Pilih Batch --</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name} ({batch.status})
            </option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('self')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'self'
                  ? 'border-green-900 text-green-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Pilih Sendiri ({selfMatchRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'system'
                  ? 'border-green-900 text-green-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              Dipasangkan Sistem ({systemMatchRequests.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Self Match Requests */}
      {activeTab === 'self' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Request Pasangan Sendiri
          </h3>

          {selfMatchRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada request pasangan sendiri</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selfMatchRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {request.user_name}
                          </p>
                          <p className="text-sm text-gray-600">{request.user_email}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {request.user_zona_waktu || 'Zona tidak diketahui'}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                              {request.chosen_juz}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                              {request.main_time_slot}
                            </span>
                          </div>
                        </div>

                        <div className="text-green-600">
                          <ChevronRight className="w-5 h-5" />
                        </div>

                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {request.partner_details?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.partner_details?.email || 'Unknown email'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {request.partner_details?.zona_waktu || 'Zona tidak diketahui'}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                              {request.partner_details?.chosen_juz}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                              {request.partner_details?.main_time_slot}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => handleApprove(request)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(request.id)
                          setShowRejectModal(true)
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* System Match Requests */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Request Dipasangkan Sistem
          </h3>

          {systemMatchRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada request dipasangkan sistem</p>
            </div>
          ) : (
            <div className="space-y-4">
              {systemMatchRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {request.user_name}
                      </p>
                      <p className="text-sm text-gray-600">{request.user_email}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {request.user_zona_waktu || 'Zona tidak diketahui'}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                          {request.chosen_juz}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                          {request.main_time_slot}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => handleFindMatches(request)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                      >
                        <Search className="w-4 h-4" />
                        Cari Pasangan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Match Modal */}
      {showMatchModal && selectedUser && matchData && (
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
                    {selectedUser.chosen_juz} • {selectedUser.user_zona_waktu || 'Zona tidak diketahui'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowMatchModal(false)
                    setSelectedUser(null)
                    setMatchData(null)
                    setSelectedMatch(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {matchData.total_matches === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tidak ada kandidat pasangan tersedia</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Perfect Matches */}
                  {matchData.matches.perfect.length > 0 && (
                    <MatchSection
                      title="Perfect Match (Zona + Juz Sama)"
                      color="green"
                      candidates={matchData.matches.perfect}
                      selectedMatch={selectedMatch}
                      onSelectMatch={setSelectedMatch}
                    />
                  )}

                  {/* Zona Waktu Matches */}
                  {matchData.matches.zona_waktu.length > 0 && (
                    <MatchSection
                      title="Zona Waktu Sama"
                      color="purple"
                      candidates={matchData.matches.zona_waktu}
                      selectedMatch={selectedMatch}
                      onSelectMatch={setSelectedMatch}
                    />
                  )}

                  {/* Same Juz Matches */}
                  {matchData.matches.same_juz.length > 0 && (
                    <MatchSection
                      title="Juz Sama"
                      color="blue"
                      candidates={matchData.matches.same_juz}
                      selectedMatch={selectedMatch}
                      onSelectMatch={setSelectedMatch}
                    />
                  )}

                  {/* Cross Juz Matches */}
                  {matchData.matches.cross_juz.length > 0 && (
                    <MatchSection
                      title="Lintas Juz"
                      color="orange"
                      candidates={matchData.matches.cross_juz}
                      selectedMatch={selectedMatch}
                      onSelectMatch={setSelectedMatch}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMatchModal(false)
                  setSelectedUser(null)
                  setMatchData(null)
                  setSelectedMatch(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleCreatePairing}
                disabled={!selectedMatch}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Buat Pasangan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reject Request
              </h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Alasan reject (opsional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900"
                rows={3}
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                  setRejectingId('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MatchSection({
  title,
  color,
  candidates,
  selectedMatch,
  onSelectMatch,
}: {
  title: string
  color: 'green' | 'purple' | 'blue' | 'orange'
  candidates: MatchCandidate[]
  selectedMatch: MatchCandidate | null
  onSelectMatch: (candidate: MatchCandidate) => void
}) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {candidates.map((candidate) => (
          <div
            key={candidate.user_id}
            onClick={() => onSelectMatch(candidate)}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedMatch?.user_id === candidate.user_id
                ? 'ring-2 ring-green-500 bg-green-50'
                : colorClasses[color]
            } hover:bg-gray-50`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{candidate.full_name}</p>
                <p className="text-sm text-gray-600">{candidate.email}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-xs">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {candidate.zona_waktu || 'Zona tidak diketahui'}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                    {candidate.chosen_juz}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                    {candidate.main_time_slot}
                  </span>
                </div>
                {candidate.match_reasons.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    {candidate.match_reasons.join(' • ')}
                  </div>
                )}
              </div>
              <div className="text-lg font-bold text-green-600">
                {candidate.match_score}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
