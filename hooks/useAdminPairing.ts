'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { 
  Batch, 
  PairingStats, 
  SelfMatchRequest, 
  SystemMatchRequest, 
  TarteelRequest, 
  FamilyRequest, 
  MatchData, 
  MatchCandidate,
  PairingDetail,
  SortConfig
} from '@/components/pairing/types'

export function useAdminPairing() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'self' | 'system' | 'tarteel' | 'family'>('self')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PairingStats>({
    selfMatch: { submitted: 0, approved: 0 },
    systemMatch: { submitted: 0, approved: 0 },
    tarteel: { submitted: 0, approved: 0 },
    family: { submitted: 0, approved: 0 },
  })

  // Data state
  const [selfMatchRequests, setSelfMatchRequests] = useState<SelfMatchRequest[]>([])
  const [systemMatchRequests, setSystemMatchRequests] = useState<SystemMatchRequest[]>([])
  const [tarteelRequests, setTarteelRequests] = useState<TarteelRequest[]>([])
  const [familyRequests, setFamilyRequests] = useState<FamilyRequest[]>([])

  // Modal & UI state
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemMatchRequest | null>(null)
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<MatchCandidate | null>(null)

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState('')

  const [showManualPairModal, setShowManualPairModal] = useState(false)
  const [manualPairUser1, setManualPairUser1] = useState<SelfMatchRequest | null>(null)
  const [manualPairUser2, setManualPairUser2] = useState<SelfMatchRequest | null>(null)

  const [addToPairModal, setAddToPairModal] = useState<{
    userId: string
    userName: string
    mainTimeSlot: string
    chosenJuz: string
  } | null>(null)

  const [showPairingDetailModal, setShowPairingDetailModal] = useState(false)
  const [loadingPairingDetail, setLoadingPairingDetail] = useState(false)
  const [pairingDetail, setPairingDetail] = useState<PairingDetail | null>(null)

  const [showPartnerTypeModal, setShowPartnerTypeModal] = useState(false)
  const [partnerTypeUser, setPartnerTypeUser] = useState<any>(null)
  const [newPartnerType, setNewPartnerType] = useState<'family' | 'tarteel' | 'system_match' | null>(null)
  const [partnerName, setPartnerName] = useState('')
  const [partnerRelationship, setPartnerRelationship] = useState('')
  const [partnerNotes, setPartnerNotes] = useState('')

  // Sorting & Pagination
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([])
  const [matchSortConfigs, setMatchSortConfigs] = useState<SortConfig[]>([
    { key: 'match_score', direction: 'desc' }
  ])
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  } | null>(null)

  // Memoized derived data
  const pairingsWithSlots = useMemo(() => {
    return systemMatchRequests
      .filter(r => r.is_paired && r.partner_id)
      .map(r => ({
        id: r.id, // submission id
        user_1_name: r.user_name,
        user_2_name: r.partner_name,
        user_1_time: r.main_time_slot,
        user_2_time: r.partner_details?.main_time_slot,
        user_1_juz: r.chosen_juz,
        user_2_juz: r.partner_details?.chosen_juz
      }))
  }, [systemMatchRequests])

  // Data Fetching
  const loadBatches = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/pairing/batches', { cache: 'no-store' })
      const result = await response.json()
      if (result.success) {
        setBatches(result.data)
        if (result.data.length > 0 && !selectedBatchId) {
          const activeBatch = result.data.find((b: Batch) => b.status === 'ACTIVE')
          setSelectedBatchId(activeBatch ? activeBatch.id : result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading batches:', error)
      toast.error('Gagal memuat daftar batch')
    }
  }, [selectedBatchId])

  const loadStatistics = useCallback(async () => {
    if (!selectedBatchId) return
    try {
      const response = await fetch(`/api/admin/pairing/statistics?batch_id=${selectedBatchId}`, { cache: 'no-store' })
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }, [selectedBatchId])

  const loadPairingRequests = useCallback(async () => {
    if (!selectedBatchId) return
    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/pairing/requests?batch_id=${selectedBatchId}&tab=${activeTab}&page=${currentPage}&limit=50`,
        { cache: 'no-store' }
      )
      const result = await response.json()

      if (result.success) {
        if (activeTab === 'self') setSelfMatchRequests(result.data)
        else if (activeTab === 'system') setSystemMatchRequests(result.data)
        else if (activeTab === 'tarteel') setTarteelRequests(result.data)
        else if (activeTab === 'family') setFamilyRequests(result.data)
        
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error('Error loading pairing requests:', error)
      toast.error('Gagal memuat data request')
    } finally {
      setLoading(false)
    }
  }, [selectedBatchId, activeTab, currentPage])

  useEffect(() => {
    loadBatches()
  }, [])

  useEffect(() => {
    if (selectedBatchId) {
      loadPairingRequests()
      loadStatistics()
    }
  }, [selectedBatchId, activeTab, currentPage, loadPairingRequests, loadStatistics])

  // Helpers
  const handleSort = (key: string) => {
    setSortConfigs(prev => {
      const existing = prev.find(c => c.key === key)
      if (existing) {
        if (existing.direction === 'asc') return [{ key, direction: 'desc' }]
        return []
      }
      return [{ key, direction: 'asc' }]
    })
  }

  const handleMatchSort = (key: string) => {
    setMatchSortConfigs(prev => {
      const existing = prev.find(c => c.key === key)
      if (existing) {
        if (existing.direction === 'asc') return [{ key, direction: 'desc' }]
        return [{ key, direction: 'asc' }]
      }
      return [{ key, direction: 'asc' }]
    })
  }

  const sortedSystemMatchRequests = useMemo(() => {
    if (sortConfigs.length === 0) return systemMatchRequests
    const { key, direction } = sortConfigs[0]
    return [...systemMatchRequests].sort((a, b) => {
      const valA = (a as any)[key] || ''
      const valB = (b as any)[key] || ''
      if (direction === 'asc') return valA > valB ? 1 : -1
      return valA < valB ? 1 : -1
    })
  }, [systemMatchRequests, sortConfigs])

  const calculateAge = (birthDate: string | null | undefined) => {
    if (!birthDate) return '-'
    let birth: Date
    if (birthDate.includes('-') && !birthDate.includes('/')) {
      const isoMatch = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (isoMatch) {
        birth = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10))
      } else {
        birth = new Date(birthDate)
      }
    } else if (birthDate.includes('/')) {
      const parts = birthDate.split('/')
      if (parts.length === 3) {
        const thirdPart = parseInt(parts[2], 10)
        if (thirdPart >= 1000) {
          const day = parseInt(parts[0], 10) > 12 ? parseInt(parts[0], 10) : parseInt(parts[1], 10)
          const month = parseInt(parts[0], 10) > 12 ? (parseInt(parts[1], 10) - 1) : (parseInt(parts[0], 10) - 1)
          birth = new Date(thirdPart, month, day)
        } else birth = new Date(birthDate)
      } else birth = new Date(birthDate)
    } else birth = new Date(birthDate)

    if (isNaN(birth.getTime())) return '-'
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const handleApprove = async (request: SelfMatchRequest) => {
    const toastId = toast.loading('Memproses approval...')
    try {
      const response = await fetch('/api/admin/pairing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: request.id,
          user_id: request.user_id,
          partner_id: request.partner_id,
          batch_id: selectedBatchId,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Pasangan berhasil disetujui!', { id: toastId })
        loadPairingRequests()
        loadStatistics()
      } else {
        toast.error(result.error || 'Gagal menyetujui pasangan', { id: toastId })
      }
    } catch (error) {
      console.error('Error approving pairing:', error)
      toast.error('Gagal menyetujui pasangan', { id: toastId })
    }
  }

  const handleReject = async () => {
    if (!rejectingId) return
    const toastId = toast.loading('Memproses reject...')
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
        toast.success('Request berhasil direject dan dipindah ke System Match', { id: toastId })
        setShowRejectModal(false)
        setRejectReason('')
        setRejectingId('')
        loadPairingRequests()
        loadStatistics()
      } else {
        toast.error(result.error || 'Gagal mereject request', { id: toastId })
      }
    } catch (error) {
      console.error('Error rejecting pairing:', error)
      toast.error('Gagal mereject request', { id: toastId })
    }
  }

  const handleManualPair = async () => {
    if (!manualPairUser1 || !manualPairUser2) return
    const toastId = toast.loading('Memasangkan manual...')
    try {
      const response = await fetch('/api/admin/pairing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: manualPairUser1.id,
          user_id: manualPairUser1.user_id,
          partner_id: manualPairUser2.user_id,
          batch_id: selectedBatchId,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Berhasil dipasangkan secara manual!', { id: toastId })
        setShowManualPairModal(false)
        setManualPairUser1(null)
        setManualPairUser2(null)
        loadPairingRequests()
        loadStatistics()
      } else {
        toast.error(result.error || 'Gagal memasangkan manual', { id: toastId })
      }
    } catch (error) {
      console.error('Error manual pairing:', error)
      toast.error('Gagal memasangkan manual', { id: toastId })
    }
  }

  const handleFindMatches = async (request: SystemMatchRequest) => {
    setSelectedUser(request)
    setShowMatchModal(true)
    setMatchData(null)
    setSelectedMatch(null)
    try {
      const response = await fetch(
        `/api/admin/pairing/find-match?user_id=${request.user_id}&batch_id=${selectedBatchId}`,
        { cache: 'no-store' }
      )
      const result = await response.json()
      if (result.success) setMatchData(result.data)
      else toast.error(result.error || 'Gagal mencari kandidat pasangan')
    } catch (error) {
      console.error('Error searching for matches:', error)
      toast.error('Gagal mencari kandidat pasangan')
    }
  }

  const handleCreatePairing = async () => {
    if (!selectedUser || !selectedMatch) return
    const toastId = toast.loading('Membuat pasangan...')
    try {
      const response = await fetch('/api/admin/pairing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: selectedUser.id,
          user_id: selectedUser.user_id,
          partner_id: selectedMatch.user_id,
          batch_id: selectedBatchId,
          pairing_type: 'system_match',
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Pasangan berhasil dibuat!', { id: toastId })
        setShowMatchModal(false)
        setSelectedUser(null)
        setMatchData(null)
        setSelectedMatch(null)
        loadPairingRequests()
        loadStatistics()
      } else {
        toast.error(result.error || 'Gagal membuat pasangan', { id: toastId })
      }
    } catch (error) {
      console.error('Error creating pairing:', error)
      toast.error('Gagal membuat pasangan', { id: toastId })
    }
  }

  const handleApproveTarteel = async (request: TarteelRequest) => {
    const toastId = toast.loading('Approving tarteel pairing...')
    try {
      const response = await fetch('/api/admin/pairing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: request.id,
          user_id: request.user_id,
          pairing_type: 'tarteel',
          batch_id: selectedBatchId,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Tarteel pairing approved successfully!', { id: toastId })
        loadPairingRequests()
        loadStatistics()
      } else toast.error(result.error || 'Failed to approve tarteel pairing', { id: toastId })
    } catch (error) {
      console.error('Error approving tarteel pairing:', error)
      toast.error('Failed to approve tarteel pairing', { id: toastId })
    }
  }

  const handleApproveFamily = async (request: FamilyRequest) => {
    const toastId = toast.loading('Approving family pairing...')
    try {
      const response = await fetch('/api/admin/pairing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: request.id,
          user_id: request.user_id,
          pairing_type: 'family',
          batch_id: selectedBatchId,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Family pairing approved successfully!', { id: toastId })
        loadPairingRequests()
        loadStatistics()
      } else toast.error(result.error || 'Failed to approve family pairing', { id: toastId })
    } catch (error) {
      console.error('Error approving family pairing:', error)
      toast.error('Failed to approve family pairing', { id: toastId })
    }
  }

  const handleViewPairingDetail = async (request: SystemMatchRequest) => {
    setShowPairingDetailModal(true)
    setLoadingPairingDetail(true)
    setPairingDetail(null)
    try {
      const resp = await fetch(`/api/admin/pairing/delete?user_id=${request.user_id}&batch_id=${request.batch_id}`, { cache: 'no-store' })
      if (!resp.ok) throw new Error('Failed to fetch pairing details')
      const result = await resp.json()
      if (result.success) setPairingDetail(result.data)
      else {
        toast.error(result.error || 'Failed to fetch pairing details')
        setShowPairingDetailModal(false)
      }
    } catch (error) {
      console.error('Error fetching pairing details:', error)
      toast.error('Failed to fetch pairing details')
      setShowPairingDetailModal(false)
    } finally {
      setLoadingPairingDetail(false)
    }
  }

  const handleRevertPairing = async (request: SystemMatchRequest) => {
    const toastId = toast.loading('Removing pairing...')
    try {
      const resp = await fetch(`/api/admin/pairing/delete?user_id=${request.user_id}&batch_id=${request.batch_id}`, {
        method: 'DELETE', cache: 'no-store'
      })
      const result = await resp.json()
      if (result.success) {
        toast.success('Pairing removed successfully!', { id: toastId })
        setShowPairingDetailModal(false)
        setPairingDetail(null)
        loadPairingRequests()
        loadStatistics()
      } else toast.error(result.error || 'Failed to revert pairing', { id: toastId })
    } catch (error) {
      toast.error('Failed to revert pairing', { id: toastId })
    }
  }

  const handleRevertTarteelPairing = async (request: TarteelRequest) => {
    if (!request.is_paired || !request.pairing_id) return toast.error('This request has not been paired yet')
    const toastId = toast.loading('Removing tarteel pairing...')
    try {
      const resp = await fetch(`/api/admin/pairing/delete?user_id=${request.user_id}&batch_id=${request.batch_id}`, {
        method: 'DELETE', cache: 'no-store'
      })
      const result = await resp.json()
      if (result.success) {
        toast.success('Tarteel pairing removed successfully!', { id: toastId })
        loadPairingRequests()
        loadStatistics()
      } else toast.error(result.error || 'Failed to revert tarteel pairing', { id: toastId })
    } catch (error) {
      toast.error('Failed to revert tarteel pairing', { id: toastId })
    }
  }

  const handleRevertFamilyPairing = async (request: FamilyRequest) => {
    if (!request.is_paired || !request.pairing_id) return toast.error('This request has not been paired yet')
    const toastId = toast.loading('Removing family pairing...')
    try {
      const resp = await fetch(`/api/admin/pairing/delete?user_id=${request.user_id}&batch_id=${request.batch_id}`, {
        method: 'DELETE', cache: 'no-store'
      })
      const result = await resp.json()
      if (result.success) {
        toast.success('Family pairing removed successfully!', { id: toastId })
        loadPairingRequests()
        loadStatistics()
      } else toast.error(result.error || 'Failed to revert family pairing', { id: toastId })
    } catch (error) {
      toast.error('Failed to revert family pairing', { id: toastId })
    }
  }

  const handleRevertAllPairings = async () => {
    if (!selectedBatchId) return
    const pairedCount = systemMatchRequests.filter(r => r.is_paired).length
    if (pairedCount === 0) return toast.error('Tidak ada pasangan sistem untuk dihapus')
    if (!window.confirm(`Anda yakin ingin menghapus SEMUA pasangan sistem (${pairedCount} pasangan)?`)) return
    const toastId = toast.loading('Menghapus semua pasangan sistem...')
    try {
      const resp = await fetch(`/api/admin/pairing/delete?user_id=all&batch_id=${selectedBatchId}&pairing_type=system_match`, {
        method: 'DELETE', cache: 'no-store'
      })
      const result = await resp.json()
      if (result.success) {
        toast.success(`Berhasil menghapus ${result.data.deleted_count} pasangan!`, { id: toastId })
        loadPairingRequests()
        loadStatistics()
      } else toast.error(result.error || 'Failed to revert all pairings', { id: toastId })
    } catch (error) {
      toast.error('Failed to revert all pairings', { id: toastId })
    }
  }

  const handleChangePartnerType = (user: any, toType: 'family' | 'tarteel' | 'system_match') => {
    setPartnerTypeUser(user)
    setNewPartnerType(toType)
    setPartnerName(user.partner_name || '')
    setPartnerRelationship(user.partner_relationship || '')
    setPartnerNotes(user.partner_notes || '')
    setShowPartnerTypeModal(true)
  }

  const handleConfirmPartnerTypeChange = async () => {
    if (!partnerTypeUser || !newPartnerType) return
    const toastId = toast.loading('Mengubah tipe partner...')
    try {
      const resp = await fetch('/api/admin/pairing/change-partner-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: partnerTypeUser.id,
          user_id: partnerTypeUser.user_id,
          new_partner_type: newPartnerType,
          partner_name: newPartnerType !== 'system_match' ? partnerName : null,
          partner_relationship: newPartnerType === 'family' ? partnerRelationship : null,
          partner_notes: newPartnerType !== 'system_match' ? partnerNotes : null,
        }),
      })
      const result = await resp.json()
      if (result.success) {
        toast.success('Tipe partner berhasil diubah!', { id: toastId })
        setShowPartnerTypeModal(false)
        loadPairingRequests()
        loadStatistics()
      } else toast.error(result.error || 'Gagal mengubah tipe partner', { id: toastId })
    } catch (error) {
      toast.error('Gagal mengubah tipe partner', { id: toastId })
    }
  }

  const handleBulkPair = async () => {
    if (!selectedBatchId) return
    const unpairedCount = systemMatchRequests.filter(r => !r.is_paired).length
    if (unpairedCount < 2) return toast.error('Butuh minimal 2 user yang belum berpasangan')
    if (!window.confirm(`Pasangkan otomatis ${unpairedCount} user?`)) return
    const toastId = toast.loading('Memasangkan otomatis...')
    try {
      const resp = await fetch('/api/admin/pairing/bulk-pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: selectedBatchId }),
      })
      const result = await resp.json()
      if (result.success) {
        toast.success(`Berhasil membuat ${result.data.created_count} pasangan!`, { id: toastId, duration: 8000 })
        loadPairingRequests()
        loadStatistics()
      } else toast.error(result.error || 'Failed to create bulk pairings', { id: toastId })
    } catch (error) {
      toast.error('Failed to create bulk pairings', { id: toastId })
    }
  }

  const handleAddToPair = async (pairingId: string, userId: string) => {
    const toastId = toast.loading('Menambahkan ke pasangan...')
    try {
      const resp = await fetch('/api/admin/pairing/add-to-pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairing_id: pairingId, user_id: userId }),
      })
      const result = await resp.json()
      if (result.success) {
        toast.success('Berhasil menambahkan ke pasangan', { id: toastId })
        setAddToPairModal(null)
        loadPairingRequests()
        loadStatistics()
      } else toast.error(result.error || 'Gagal menambahkan ke pasangan', { id: toastId })
    } catch (error) {
      toast.error('Gagal menambahkan ke pasangan', { id: toastId })
    }
  }

  const getSortedMatchCandidates = () => {
    if (!matchData) return []
    if (matchSortConfigs.length === 0) return matchData.candidates
    const { key, direction } = matchSortConfigs[0]
    return [...matchData.candidates].sort((a, b) => {
      const valA = (a as any)[key] || ''
      const valB = (b as any)[key] || ''
      if (direction === 'asc') return valA > valB ? 1 : -1
      return valA < valB ? 1 : -1
    })
  }

  return {
    batches,
    selectedBatchId,
    setSelectedBatchId,
    activeTab,
    setActiveTab,
    loading,
    stats,
    selfMatchRequests,
    systemMatchRequests: sortedSystemMatchRequests,
    tarteelRequests,
    familyRequests,
    pagination,
    currentPage,
    setCurrentPage,
    // Modals
    showMatchModal, setShowMatchModal,
    selectedUser, setSelectedUser,
    matchData, setMatchData,
    selectedMatch, setSelectedMatch,
    showRejectModal, setShowRejectModal,
    rejectReason, setRejectReason,
    rejectingId, setRejectingId,
    showManualPairModal, setShowManualPairModal,
    manualPairUser1, setManualPairUser1,
    manualPairUser2, setManualPairUser2,
    addToPairModal, setAddToPairModal,
    showPairingDetailModal, setShowPairingDetailModal,
    loadingPairingDetail,
    pairingDetail,
    showPartnerTypeModal, setShowPartnerTypeModal,
    partnerTypeUser, setPartnerTypeUser,
    newPartnerType, setNewPartnerType,
    partnerName, setPartnerName,
    partnerRelationship, setPartnerRelationship,
    partnerNotes, setPartnerNotes,
    // Actions & Helpers
    handleSort,
    handleMatchSort,
    loadPairingRequests,
    loadStatistics,
    pairingsWithSlots,
    sortConfigs,
    matchSortConfigs,
    calculateAge,
    handleApprove,
    handleReject,
    handleManualPair,
    handleFindMatches,
    handleCreatePairing,
    handleApproveTarteel,
    handleApproveFamily,
    handleViewPairingDetail,
    handleRevertPairing,
    handleRevertTarteelPairing,
    handleRevertFamilyPairing,
    handleRevertAllPairings,
    handleChangePartnerType,
    handleConfirmPartnerTypeChange,
    handleBulkPair,
    handleAddToPair,
    getSortedMatchCandidates,
    setRejectingId,
  }
}
