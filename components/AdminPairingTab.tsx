'use client'

import { useState, useEffect } from 'react'
import { HeartHandshake, UserCheck, Users, CheckCircle, XCircle, Clock, Search, ChevronRight, Heart, ArrowRight } from 'lucide-react'
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
  is_mutual_match: boolean
  partner_submission_id: string | null
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
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  // Match modal state
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemMatchRequest | null>(null)
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<MatchCandidate | null>(null)

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<string>('')

  // Manual pairing modal state
  const [showManualPairModal, setShowManualPairModal] = useState(false)
  const [manualPairUser1, setManualPairUser1] = useState<SelfMatchRequest | null>(null)
  const [manualPairUser2, setManualPairUser2] = useState<SelfMatchRequest | null>(null)

  useEffect(() => {
    loadBatches()
  }, [])

  useEffect(() => {
    if (selectedBatchId) {
      loadPairingRequests()
    }
  }, [selectedBatchId, currentPage])

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
      const response = await fetch(`/api/admin/pairing?batch_id=${selectedBatchId}&page=${currentPage}&limit=50`)
      if (!response.ok) {
        throw new Error('Failed to fetch pairing requests')
      }

      const result = await response.json()
      setSelfMatchRequests(result.data?.self_match_requests || [])
      setSystemMatchRequests(result.data?.system_match_requests || [])
      setPagination(result.pagination || null)
    } catch (error) {
      console.error('Error loading pairing requests:', error)
      toast.error('Failed to load pairing requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request: SelfMatchRequest) => {
    // For mutual match, we need to approve both submissions
    const toastId = toast.loading('Approving pairing...')

    try {
      // Approve the first user's submission
      const response1 = await fetch('/api/admin/pairing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: request.id,
          user_1_id: request.user_id,
          user_2_id: request.partner_user_id,
        }),
      })

      const result1 = await response1.json()

      // If mutual match, also approve the partner's submission
      if (request.is_mutual_match && request.partner_submission_id) {
        const response2 = await fetch('/api/admin/pairing/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submission_id: request.partner_submission_id,
            user_1_id: request.partner_user_id,
            user_2_id: request.user_id,
          }),
        })

        const result2 = await response2.json()

        if (result1.success && result2.success) {
          toast.success('Mutual pairing approved successfully!', { id: toastId })
        } else {
          toast.error(result1.error || result2.error || 'Failed to approve pairing', { id: toastId })
        }
      } else if (result1.success) {
        toast.success('Pairing approved successfully!', { id: toastId })
      } else {
        toast.error(result1.error || 'Failed to approve pairing', { id: toastId })
      }

      loadPairingRequests()
    } catch (error) {
      console.error('Error approving pairing:', error)
      toast.error('Failed to approve pairing', { id: toastId })
    }
  }

  const handleReject = async () => {
    const toastId = toast.loading('Rejecting request...')

    try {
      // Reject the submission and move to system match
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
        toast.success('Request rejected and moved to system match', { id: toastId })
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

  const openManualPairModal = (user: SelfMatchRequest) => {
    setManualPairUser1(user)
    setManualPairUser2(null)
    setShowManualPairModal(true)
  }

  const handleManualPair = async () => {
    if (!manualPairUser1 || !manualPairUser2) return

    const toastId = toast.loading('Creating manual pairing...')

    try {
      const response = await fetch('/api/admin/pairing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_1_id: manualPairUser1.user_id,
          user_2_id: manualPairUser2.user_id,
          batch_id: manualPairUser1.batch_id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Manual pairing created successfully!', { id: toastId })
        setShowManualPairModal(false)
        setManualPairUser1(null)
        setManualPairUser2(null)
        loadPairingRequests()
      } else {
        toast.error(result.error || 'Failed to create pairing', { id: toastId })
      }
    } catch (error) {
      console.error('Error creating manual pairing:', error)
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
                  className={`border rounded-lg overflow-hidden hover:shadow-md transition-all ${
                    request.is_mutual_match ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-gray-200'
                  }`}
                >
                  {/* Mutual Match Header */}
                  {request.is_mutual_match && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 flex items-center justify-between">
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
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">1</span>
                          </div>
                          <p className="font-semibold text-gray-900">{request.user_name}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{request.user_email}</p>
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
                        <p className="text-sm text-gray-600 mb-3">
                          {request.partner_details?.email || 'Unknown email'}
                        </p>
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
                            onClick={() => handleApprove(request)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openManualPairModal(request)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-sm"
                              title="Pasangkan manual dengan thalibah lain"
                            >
                              <Users className="w-4 h-4" />
                              Manual Pair
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(request.id)
                                setShowRejectModal(true)
                              }}
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
                          {request.user_zona_waktu || 'WIB'}
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Menampilkan {Math.min(pagination.limit, pagination.total - (pagination.page - 1) * pagination.limit)} dari {pagination.total} requests
              (Halaman {pagination.page} dari {pagination.totalPages})
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Pertama
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 text-sm">
                Hal {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Selanjutnya
              </button>
              <button
                onClick={() => setCurrentPage(pagination.totalPages)}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Terakhir
              </button>
            </div>
          </div>
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
                    {selectedUser.chosen_juz} • {selectedUser.user_zona_waktu || 'WIB'}
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
              <p className="text-sm text-gray-600 mb-4">
                Request ini akan dipindahkan ke tab "Dipasangkan Sistem" untuk dicarikan pasangan oleh admin.
              </p>
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

      {/* Manual Pair Modal */}
      {showManualPairModal && manualPairUser1 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pasangkan Manual
                  </h3>
                  <p className="text-sm text-gray-600">
                    Pilih pasangan untuk {manualPairUser1.user_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowManualPairModal(false)
                    setManualPairUser1(null)
                    setManualPairUser2(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-gray-900">{manualPairUser1.user_name}</p>
                <p className="text-sm text-gray-600">
                  {manualPairUser1.user_zona_waktu} • {manualPairUser1.chosen_juz} • {manualPairUser1.main_time_slot}
                </p>
              </div>

              <p className="text-sm font-medium text-gray-700 mb-3">Pilih pasangan:</p>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {selfMatchRequests
                  .filter(r => r.user_id !== manualPairUser1.user_id)
                  .map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setManualPairUser2(request)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        manualPairUser2?.id === request.id
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
                onClick={() => {
                  setShowManualPairModal(false)
                  setManualPairUser1(null)
                  setManualPairUser2(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleManualPair}
                disabled={!manualPairUser2}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Pasangkan
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
                    {candidate.zona_waktu || 'WIB'}
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
