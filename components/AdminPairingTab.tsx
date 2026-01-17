'use client'

import { useState, useEffect } from 'react'
import { HeartHandshake, UserCheck, Users, CheckCircle, XCircle, Clock, Search, ChevronRight, Heart, ArrowRight, Bug, ChevronDown, BookOpen, Home } from 'lucide-react'
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
  user_wa_phone: string
  user_zona_waktu: string
  chosen_juz: string
  main_time_slot: string
  backup_time_slot: string
  submitted_at: string
  batch_id: string
  batch_name: string
  // Matching statistics
  total_matches: number
  perfect_matches: number
  zona_waktu_matches: number
  same_juz_matches: number
  cross_juz_matches: number
  main_time_matches: number
  backup_time_matches: number
  // Pairing info
  is_paired: boolean
  partner_name: string | null
  partner_user_id: string | null
}

interface TarteelRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_zona_waktu: string
  user_wa_phone: string
  chosen_juz: string
  main_time_slot: string
  backup_time_slot: string
  partner_name: string
  partner_relationship: string
  partner_notes: string
  partner_wa_phone: string
  submitted_at: string
  batch_id: string
  batch_name: string
  partner_type: string
}

interface FamilyRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_zona_waktu: string
  user_wa_phone: string
  chosen_juz: string
  main_time_slot: string
  backup_time_slot: string
  partner_name: string
  partner_relationship: string
  partner_notes: string
  partner_wa_phone: string
  submitted_at: string
  batch_id: string
  batch_name: string
  partner_type: string
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
    perfect: MatchCandidate[]      // Zona + Juz + Waktu Utama cocok
    zona_juz: MatchCandidate[]     // Zona + Juz sama (waktu beda)
    zona_waktu: MatchCandidate[]   // Zona waktu sama, juz beda
    same_juz: MatchCandidate[]     // Juz sama, zona beda
    cross_juz: MatchCandidate[]    // Lintas juz dan zona
  }
  total_matches: number
}

export function AdminPairingTab() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'self' | 'system' | 'tarteel' | 'family'>('self')
  const [selfMatchRequests, setSelfMatchRequests] = useState<SelfMatchRequest[]>([])
  const [systemMatchRequests, setSystemMatchRequests] = useState<SystemMatchRequest[]>([])
  const [tarteelRequests, setTarteelRequests] = useState<TarteelRequest[]>([])
  const [familyRequests, setFamilyRequests] = useState<FamilyRequest[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')
  const [batches, setBatches] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  // Statistics state
  const [stats, setStats] = useState({
    selfMatch: { submitted: 0, approved: 0 },
    systemMatch: { submitted: 0, approved: 0 },
    tarteel: { submitted: 0, approved: 0 },
    family: { submitted: 0, approved: 0 },
  })

  // Debug panel state
  const [showDebug, setShowDebug] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)

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

  // Sorting state for System Match table
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SystemMatchRequest | null
    direction: 'asc' | 'desc'
  }>({
    key: null,
    direction: 'asc'
  })

  // Sort function
  const handleSort = (key: keyof SystemMatchRequest) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc'
      } else {
        // Reset to unsorted
        setSortConfig({ key: null, direction: 'asc' })
        return
      }
    }
    setSortConfig({ key, direction })
  }

  // Get sorted data
  const getSortedSystemMatchRequests = () => {
    if (!sortConfig.key) return systemMatchRequests

    const sorted = [...systemMatchRequests].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue
      }

      return 0
    })

    return sorted
  }

  const sortedSystemMatchRequests = getSortedSystemMatchRequests()

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
      const response = await fetch(`/api/admin/pairing?batch_id=${selectedBatchId}&page=1&limit=1000`, {
        cache: 'no-store' // Disable cache to always get fresh data
      })
      if (!response.ok) {
        throw new Error('Failed to fetch pairing requests')
      }

      const result = await response.json()
      console.log('[AdminPairingTab] API Response:', result)

      setSelfMatchRequests(result.data?.self_match_requests || [])
      setSystemMatchRequests(result.data?.system_match_requests || [])
      setTarteelRequests(result.data?.tarteel_requests || [])
      setFamilyRequests(result.data?.family_requests || [])
      setPagination(result.pagination || null)

      // Store debug data with full API response
      setDebugData({
        apiResponse: result,
        selfMatchCount: result.data?.self_match_requests?.length || 0,
        systemMatchCount: result.data?.system_match_requests?.length || 0,
        tarteelCount: result.data?.tarteel_requests?.length || 0,
        familyCount: result.data?.family_requests?.length || 0,
        selfMatchRequests: result.data?.self_match_requests || [],
        pagination: result.pagination || null,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error loading pairing requests:', error)
      toast.error('Failed to load pairing requests')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    if (!selectedBatchId) return

    try {
      const response = await fetch(`/api/admin/pairing/statistics?batch_id=${selectedBatchId}`, {
        cache: 'no-store' // Disable cache to always get fresh data
      })
      if (!response.ok) {
        // If API doesn't exist, we'll calculate stats from current data
        return
      }

      const result = await response.json()
      if (result.success) {
        setStats(result.data)
        // Store statistics data in debug state
        setDebugData((prev: any) => ({
          ...prev,
          statisticsResponse: result.data,
        }))
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
      // Don't show toast for stats error, it's not critical
    }
  }

  // Load statistics when batch changes
  useEffect(() => {
    if (selectedBatchId) {
      loadStatistics()
    }
  }, [selectedBatchId])

  const handleApprove = async (request: SelfMatchRequest) => {
    // For mutual match, we need to approve both submissions
    const toastId = toast.loading('Approving pairing...')

    try {
      console.log('[FRONTEND] Starting approve for request:', request)

      // Approve the first user's submission
      const body1 = {
        submission_id: request.id,
        user_1_id: request.user_id,
        user_2_id: request.partner_user_id,
      }
      console.log('[FRONTEND] Sending approve request 1:', body1)

      const response1 = await fetch('/api/admin/pairing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body1),
      })

      const result1 = await response1.json()
      console.log('[FRONTEND] Approve response 1:', result1)

      // If mutual match, also approve the partner's submission
      if (request.is_mutual_match && request.partner_submission_id) {
        const body2 = {
          submission_id: request.partner_submission_id,
          user_1_id: request.partner_user_id,
          user_2_id: request.user_id,
        }
        console.log('[FRONTEND] Sending approve request 2 (mutual):', body2)

        const response2 = await fetch('/api/admin/pairing/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body2),
        })

        const result2 = await response2.json()
        console.log('[FRONTEND] Approve response 2:', result2)

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

      console.log('[FRONTEND] Refreshing data after approve...')
      loadPairingRequests()
      loadStatistics() // Refresh statistics after approve
    } catch (error) {
      console.error('[FRONTEND] Error approving pairing:', error)
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
        loadStatistics() // Refresh statistics after reject
      } else {
        toast.error(result.error || 'Failed to reject request', { id: toastId })
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Failed to reject request', { id: toastId })
    }
  }

  const handleFindMatches = async (user: SystemMatchRequest) => {
    console.log('[FRONTEND] Finding matches for user:', user)
    setSelectedUser(user)
    setShowMatchModal(true)
    setMatchData(null)
    setSelectedMatch(null)

    try {
      const url = `/api/admin/pairing/match?user_id=${user.user_id}&batch_id=${user.batch_id}`
      console.log('[FRONTEND] Fetching from:', url)

      const response = await fetch(url)

      console.log('[FRONTEND] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[FRONTEND] Error response:', errorText)
        throw new Error('Failed to find matches')
      }

      const result = await response.json()
      console.log('[FRONTEND] Match API result:', result)
      setMatchData(result.data)
    } catch (error) {
      console.error('[FRONTEND] Error finding matches:', error)
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
        loadStatistics() // Refresh statistics after reject
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
        loadStatistics() // Refresh statistics after reject
      } else {
        toast.error(result.error || 'Failed to create pairing', { id: toastId })
      }
    } catch (error) {
      console.error('Error creating manual pairing:', error)
      toast.error('Failed to create pairing', { id: toastId })
    }
  }

  const handleApproveTarteel = async (request: TarteelRequest) => {
    const toastId = toast.loading('Approving tarteel pairing...')

    try {
      const response = await fetch('/api/admin/pairing/approve-tarteel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: request.id,
          user_id: request.user_id,
          partner_name: request.partner_name,
          partner_relationship: request.partner_relationship,
          partner_notes: request.partner_notes,
          partner_wa_phone: request.partner_wa_phone,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Tarteel pairing approved successfully!', { id: toastId })
        loadPairingRequests()
        loadStatistics() // Refresh statistics after reject
      } else {
        toast.error(result.error || 'Failed to approve tarteel pairing', { id: toastId })
      }
    } catch (error) {
      console.error('Error approving tarteel pairing:', error)
      toast.error('Failed to approve tarteel pairing', { id: toastId })
    }
  }

  const handleApproveFamily = async (request: FamilyRequest) => {
    const toastId = toast.loading('Approving family pairing...')

    try {
      const response = await fetch('/api/admin/pairing/approve-family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: request.id,
          user_id: request.user_id,
          partner_name: request.partner_name,
          partner_relationship: request.partner_relationship,
          partner_notes: request.partner_notes,
          partner_wa_phone: request.partner_wa_phone,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Family pairing approved successfully!', { id: toastId })
        loadPairingRequests()
        loadStatistics() // Refresh statistics after reject
      } else {
        toast.error(result.error || 'Failed to approve family pairing', { id: toastId })
      }
    } catch (error) {
      console.error('Error approving family pairing:', error)
      toast.error('Failed to approve family pairing', { id: toastId })
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
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm"
        >
          <Bug className="w-4 h-4" />
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>

      {/* Debug Panel */}
      {showDebug && debugData && (
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs overflow-auto max-h-[600px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Debug Panel - Pairing API Data</h3>
            <span className="text-gray-400">{debugData.timestamp}</span>
          </div>

          <div className="space-y-4">
            {/* Debug Info from API */}
            {debugData.apiResponse?.debug && (
              <div className="border border-cyan-500 bg-cyan-900/20 p-3 rounded">
                <span className="text-cyan-400 mb-2 block font-bold">Server Debug Logs:</span>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <span className="text-yellow-400">Total Submissions:</span> {debugData.apiResponse.debug.totalSubmissions}
                  </div>
                  <div>
                    <span className="text-yellow-400">Unique Users:</span> {debugData.apiResponse.debug.uniqueUsersCount}
                  </div>
                </div>
                <div className="border-t border-cyan-700 pt-3">
                  <span className="text-cyan-400 mb-1 block">Partner Type Counts (Unique Users):</span>
                  <pre className="text-gray-300 overflow-auto bg-gray-800 p-2 rounded text-xs">
                    {JSON.stringify(debugData.apiResponse.debug.partnerTypeCounts, null, 2)}
                  </pre>
                </div>
                {debugData.apiResponse.debug.selfMatchBreakdown && (
                  <div className="border-t border-cyan-700 pt-3">
                    <span className="text-cyan-400 mb-2 block font-bold">Self Match Breakdown:</span>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <span className="text-yellow-400">Total Users:</span> {debugData.apiResponse.debug.selfMatchBreakdown.totalUsers}
                      </div>
                      <div>
                        <span className="text-yellow-400">Mutual Pairs:</span> {debugData.apiResponse.debug.selfMatchBreakdown.mutualMatchPairs}
                      </div>
                      <div>
                        <span className="text-yellow-400">Non-Mutual:</span> {debugData.apiResponse.debug.selfMatchBreakdown.nonMutualUsers}
                      </div>
                      <div>
                        <span className="text-yellow-400">Entries Shown:</span> {debugData.apiResponse.debug.selfMatchBreakdown.totalEntriesShown}
                      </div>
                    </div>
                    <div className="text-xs text-green-300 bg-green-900/30 p-2 rounded">
                      {debugData.apiResponse.debug.selfMatchBreakdown.explanation}
                    </div>
                  </div>
                )}
                <div className="border-t border-cyan-700 pt-3 mt-3">
                  <span className="text-cyan-400 mb-1 block">Final Counts (Entries Displayed):</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-yellow-400">Self Match:</span> {debugData.apiResponse.debug.finalCounts.selfMatch}
                    </div>
                    <div>
                      <span className="text-yellow-400">System Match:</span> {debugData.apiResponse.debug.finalCounts.systemMatch}
                    </div>
                    <div>
                      <span className="text-yellow-400">Tarteel:</span> {debugData.apiResponse.debug.finalCounts.tarteel}
                    </div>
                    <div>
                      <span className="text-yellow-400">Family:</span> {debugData.apiResponse.debug.finalCounts.family}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Counts */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-yellow-400">Self Match:</span> {debugData.selfMatchCount}
              </div>
              <div>
                <span className="text-yellow-400">System Match:</span> {debugData.systemMatchCount}
              </div>
              <div>
                <span className="text-yellow-400">Tarteel:</span> {debugData.tarteelCount}
              </div>
              <div>
                <span className="text-yellow-400">Family:</span> {debugData.familyCount}
              </div>
            </div>

            {/* Pagination Info */}
            {debugData.pagination && (
              <div className="border-t border-gray-700 pt-3">
                <span className="text-cyan-400 mb-2 block">Pagination Info:</span>
                <pre className="text-gray-300 overflow-auto bg-gray-800 p-2 rounded">
                  {JSON.stringify(debugData.pagination, null, 2)}
                </pre>
              </div>
            )}

            {/* Statistics Response */}
            {debugData.statisticsResponse && (
              <div className="border-t border-gray-700 pt-3">
                <span className="text-cyan-400 mb-2 block">Statistics API Response (/api/admin/pairing/statistics):</span>
                <pre className="text-gray-300 overflow-auto bg-gray-800 p-2 rounded max-h-40">
                  {JSON.stringify(debugData.statisticsResponse, null, 2)}
                </pre>
              </div>
            )}

            {/* Full API Response */}
            <div className="border-t border-gray-700 pt-3">
              <span className="text-cyan-400 mb-2 block">Full API Response (/api/admin/pairing):</span>
              <pre className="text-gray-300 overflow-auto bg-gray-800 p-2 rounded max-h-60">
                {JSON.stringify(debugData.apiResponse, null, 2)}
              </pre>
            </div>

            {/* Individual Requests */}
            {debugData.selfMatchRequests && debugData.selfMatchRequests.length > 0 && (
              <div className="border-t border-gray-700 pt-3">
                <span className="text-cyan-400 mb-2 block">Self Match Requests ({debugData.selfMatchRequests.length}):</span>
                <pre className="text-gray-300 overflow-auto bg-gray-800 p-2 rounded max-h-40">
                  {JSON.stringify(debugData.selfMatchRequests, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Self Match Stats */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Pilih Sendiri</p>
              <p className="text-2xl font-bold mt-1">
                {stats.selfMatch.approved}
                <span className="text-blue-200 text-sm font-normal"> / {stats.selfMatch.submitted}</span>
              </p>
              <p className="text-blue-100 text-xs mt-1">Approved / Submitted</p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-200 opacity-80" />
          </div>
        </div>

        {/* System Match Stats */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-medium uppercase tracking-wide">Dipasangkan Sistem</p>
              <p className="text-2xl font-bold mt-1">
                {stats.systemMatch.approved}
                <span className="text-green-200 text-sm font-normal"> / {stats.systemMatch.submitted}</span>
              </p>
              <p className="text-green-100 text-xs mt-1">Approved / Submitted</p>
            </div>
            <HeartHandshake className="w-8 h-8 text-green-200 opacity-80" />
          </div>
        </div>

        {/* Tarteel Stats */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">Tarteel</p>
              <p className="text-2xl font-bold mt-1">
                {stats.tarteel.approved}
                <span className="text-purple-200 text-sm font-normal"> / {stats.tarteel.submitted}</span>
              </p>
              <p className="text-purple-100 text-xs mt-1">Approved / Submitted</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-200 opacity-80" />
          </div>
        </div>

        {/* Family Stats */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">Family</p>
              <p className="text-2xl font-bold mt-1">
                {stats.family.approved}
                <span className="text-amber-200 text-sm font-normal"> / {stats.family.submitted}</span>
              </p>
              <p className="text-amber-100 text-xs mt-1">Approved / Submitted</p>
            </div>
            <Home className="w-8 h-8 text-amber-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('self')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
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
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'system'
                  ? 'border-green-900 text-green-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              Dipasangkan Sistem ({systemMatchRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('tarteel')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'tarteel'
                  ? 'border-green-900 text-green-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Tarteel ({tarteelRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'family'
                  ? 'border-green-900 text-green-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Home className="w-4 h-4" />
              Family ({familyRequests.length})
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Request Dipasangkan Sistem
            </h3>
            <span className="text-sm text-gray-600">{systemMatchRequests.length} permintaan</span>
          </div>

          {systemMatchRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada request dipasangkan sistem</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('user_name')}>
                      Nama {sortConfig.key === 'user_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pasangan
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('chosen_juz')}>
                      Juz {sortConfig.key === 'chosen_juz' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('user_zona_waktu')}>
                      Zona {sortConfig.key === 'user_zona_waktu' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('perfect_matches')}>
                      Perfect {sortConfig.key === 'perfect_matches' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('main_time_matches')}>
                      W. Utama {sortConfig.key === 'main_time_matches' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('backup_time_matches')}>
                      W. Cadangan {sortConfig.key === 'backup_time_matches' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('zona_waktu_matches')}>
                      Zona {sortConfig.key === 'zona_waktu_matches' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('same_juz_matches')}>
                      Juz {sortConfig.key === 'same_juz_matches' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('cross_juz_matches')}>
                      Lintas {sortConfig.key === 'cross_juz_matches' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total_matches')}>
                      Total {sortConfig.key === 'total_matches' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedSystemMatchRequests.map((request) => (
                    <tr key={request.id} className={`hover:bg-gray-50 ${request.is_paired ? 'bg-green-50' : ''}`}>
                      <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.user_name}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm">
                        {request.is_paired ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            {request.partner_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Belum ada</span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-600">
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {request.chosen_juz}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-600">
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {request.user_zona_waktu || 'WIB'}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          request.perfect_matches > 0 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {request.perfect_matches || 0}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          request.main_time_matches > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {request.main_time_matches || 0}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          request.backup_time_matches > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {request.backup_time_matches || 0}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-purple-600">
                        {request.zona_waktu_matches || 0}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-blue-600">
                        {request.same_juz_matches || 0}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-orange-600">
                        {request.cross_juz_matches || 0}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                          request.total_matches > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {request.total_matches}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                        {!request.is_paired ? (
                          <button
                            onClick={() => handleFindMatches(request)}
                            className="px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-xs mx-auto"
                          >
                            <Search className="w-3.5 h-3.5" />
                            Cari
                          </button>
                        ) : (
                          <span className="text-green-600 text-xs font-medium">Sudah berpasangan</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tarteel Requests */}
      {activeTab === 'tarteel' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Request Pasangan Tarteel
          </h3>

          {tarteelRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada request pasangan tarteel</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tarteelRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-purple-200 rounded-lg p-4 hover:shadow-md transition-all bg-gradient-to-r from-purple-50 to-pink-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded font-medium">
                          TARTEEL
                        </span>
                        <p className="font-semibold text-gray-900">{request.user_name}</p>
                        <p className="text-sm text-gray-600">{request.user_email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Juz Pilihan:</p>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                            {request.chosen_juz}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Zona Waktu:</p>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                            {request.user_zona_waktu || 'WIB'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
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

                      <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                        <p className="text-xs font-semibold text-purple-900 mb-2">Pasangan Tarteel:</p>
                        <p className="text-sm text-gray-900 font-medium">{request.partner_name || '-'}</p>
                        {request.partner_relationship && (
                          <p className="text-xs text-gray-600">Hubungan: {request.partner_relationship}</p>
                        )}
                        {request.partner_notes && (
                          <p className="text-xs text-gray-600 mt-1">Catatan: {request.partner_notes}</p>
                        )}
                        {request.partner_wa_phone && (
                          <p className="text-xs text-gray-600 mt-1">WA: {request.partner_wa_phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleApproveTarteel(request)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Family Requests */}
      {activeTab === 'family' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Request Pasangan Family
          </h3>

          {familyRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada request pasangan family</p>
            </div>
          ) : (
            <div className="space-y-4">
              {familyRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-amber-200 rounded-lg p-4 hover:shadow-md transition-all bg-gradient-to-r from-amber-50 to-orange-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-amber-600 text-white text-xs rounded font-medium">
                          FAMILY
                        </span>
                        <p className="font-semibold text-gray-900">{request.user_name}</p>
                        <p className="text-sm text-gray-600">{request.user_email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Juz Pilihan:</p>
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm font-medium">
                            {request.chosen_juz}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Zona Waktu:</p>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                            {request.user_zona_waktu || 'WIB'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
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

                      <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                        <p className="text-xs font-semibold text-amber-900 mb-2">Pasangan Family:</p>
                        <p className="text-sm text-gray-900 font-medium">{request.partner_name || '-'}</p>
                        {request.partner_relationship && (
                          <p className="text-xs text-gray-600">Hubungan: {request.partner_relationship}</p>
                        )}
                        {request.partner_notes && (
                          <p className="text-xs text-gray-600 mt-1">Catatan: {request.partner_notes}</p>
                        )}
                        {request.partner_wa_phone && (
                          <p className="text-xs text-gray-600 mt-1">WA: {request.partner_wa_phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleApproveFamily(request)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
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
              {/* User Info - Yang Dicari Pasangan */}
              {matchData && matchData.user && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Yang Dicari Pasangan:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="font-medium">Nama:</span> {matchData.user.full_name}</div>
                    <div><span className="font-medium">Juz:</span> {matchData.user.chosen_juz}</div>
                    <div><span className="font-medium">Zona Waktu:</span> {matchData.user.zona_waktu}</div>
                    <div><span className="font-medium">Waktu Utama:</span> {matchData.user.main_time_slot}</div>
                    <div><span className="font-medium">Waktu Cadangan:</span> {matchData.user.backup_time_slot}</div>
                  </div>
                </div>
              )}

              {!matchData ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Mencari kandidat pasangan...</p>
                </div>
              ) : matchData.total_matches === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tidak ada kandidat pasangan tersedia</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Perfect Matches - Zona + Juz + Waktu Utama cocok */}
                  {matchData.matches.perfect.length > 0 && (
                    <MatchTableSection
                      title="Perfect Match (Zona + Juz + Waktu Utama Cocok)"
                      color="green"
                      candidates={matchData.matches.perfect}
                      selectedMatch={selectedMatch}
                      onSelectMatch={setSelectedMatch}
                    />
                  )}

                  {/* Zona + Juz Matches - Zona + Juz sama tapi waktu beda */}
                  {matchData.matches.zona_juz.length > 0 && (
                    <MatchTableSection
                      title="Zona + Juz Sama (Waktu Beda)"
                      color="emerald"
                      candidates={matchData.matches.zona_juz}
                      selectedMatch={selectedMatch}
                      onSelectMatch={setSelectedMatch}
                    />
                  )}

                  {/* Zona Waktu Matches - Zona sama, juz beda */}
                  {matchData.matches.zona_waktu.length > 0 && (
                    <MatchTableSection
                      title="Zona Waktu Sama (Juz Beda)"
                      color="purple"
                      candidates={matchData.matches.zona_waktu}
                      selectedMatch={selectedMatch}
                      onSelectMatch={setSelectedMatch}
                    />
                  )}

                  {/* Same Juz Matches - Juz sama, zona beda */}
                  {matchData.matches.same_juz.length > 0 && (
                    <MatchTableSection
                      title="Juz Sama (Zona Beda)"
                      color="blue"
                      candidates={matchData.matches.same_juz}
                      selectedMatch={selectedMatch}
                      onSelectMatch={setSelectedMatch}
                    />
                  )}

                  {/* Cross Juz Matches - Lintas juz dan zona */}
                  {matchData.matches.cross_juz.length > 0 && (
                    <MatchTableSection
                      title="Lintas Juz & Zona"
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
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedMatch?.user_id === candidate.user_id
                ? 'ring-2 ring-green-500 bg-green-50 shadow-lg'
                : colorClasses[color]
            } hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{candidate.full_name}</p>
                    <p className="text-sm text-gray-600">{candidate.email}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-full font-bold">
                      <span className="text-lg">{candidate.match_score}</span>
                      <span className="text-xs">peluang</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  {/* Left Column - Juz & Zona Waktu */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Juz:</p>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                        {candidate.chosen_juz}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Zona Waktu:</p>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {candidate.zona_waktu || 'WIB'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column - Waktu Belajar */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Waktu Utama:</p>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                        {candidate.main_time_slot || '-'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Waktu Cadangan:</p>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
                        {candidate.backup_time_slot || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {candidate.match_reasons.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 flex flex-wrap gap-2">
                      {candidate.match_reasons.map((reason, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          {reason}
                        </span>
                      ))}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// New table-based component for match candidates
function MatchTableSection({
  title,
  color,
  candidates,
  selectedMatch,
  onSelectMatch,
}: {
  title: string
  color: 'green' | 'emerald' | 'purple' | 'blue' | 'orange'
  candidates: MatchCandidate[]
  selectedMatch: MatchCandidate | null
  onSelectMatch: (candidate: MatchCandidate) => void
}) {
  const colorClasses = {
    green: { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100', text: 'text-green-800' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100', text: 'text-emerald-800' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100', text: 'text-purple-800' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100', text: 'text-blue-800' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-100', text: 'text-orange-800' },
  }

  const colors = colorClasses[color]

  return (
    <div className={`border ${colors.border} rounded-lg overflow-hidden`}>
      <h4 className={`${colors.header} ${colors.text} px-4 py-2 text-sm font-medium`}>{title} ({candidates.length})</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Pilih</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Nama</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Juz</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Zona</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Waktu Utama</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Waktu Cadangan</th>
              <th className="px-4 py-2 text-center font-medium text-gray-700">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {candidates.map((candidate) => (
              <tr
                key={candidate.user_id}
                onClick={() => onSelectMatch(candidate)}
                className={`cursor-pointer transition-colors ${
                  selectedMatch?.user_id === candidate.user_id
                    ? 'bg-green-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-4 py-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMatch?.user_id === candidate.user_id
                      ? 'border-green-600 bg-green-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedMatch?.user_id === candidate.user_id && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 font-medium text-gray-900">{candidate.full_name || '-'}</td>
                <td className="px-4 py-2 text-gray-600 text-xs">{candidate.email || '-'}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                    {candidate.chosen_juz || '-'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {candidate.zona_waktu || 'WIB'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    {candidate.main_time_slot || '-'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                    {candidate.backup_time_slot || '-'}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-full text-xs font-bold">
                    {candidate.match_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
