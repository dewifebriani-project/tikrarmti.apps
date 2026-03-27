'use client'

import React from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'
import { useAdminPairing } from '@/hooks/useAdminPairing'
import { PairingStatsCard } from './pairing/PairingStatsCard'
import { SelfMatchTab } from './pairing/SelfMatchTab'
import { SystemMatchTab } from './pairing/SystemMatchTab'
import { TarteelTab } from './pairing/TarteelTab'
import { FamilyTab } from './pairing/FamilyTab'
import { MatchModal } from './pairing/modals/MatchModal'
import { RejectModal } from './pairing/modals/RejectModal'
import { ManualPairModal } from './pairing/modals/ManualPairModal'
import { AddToPairModal } from './pairing/modals/AddToPairModal'
import { PartnerTypeModal } from './pairing/modals/PartnerTypeModal'
import { PairingDetailModal } from './pairing/modals/PairingDetailModal'

export default function AdminPairingTab() {
  const {
    batches,
    selectedBatchId,
    setSelectedBatchId,
    activeTab,
    setActiveTab,
    loading,
    stats,
    selfMatchRequests,
    systemMatchRequests,
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
    // Actions
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
  } = useAdminPairing()

  const hasTimeSlotOverlap = (s1: string, s2: string) => {
    if (!s1 || !s2) return false
    const extractHours = (s: string) => s.match(/\d{2}:\d{2}/g) || []
    const h1 = extractHours(s1)
    const h2 = extractHours(s2)
    return h1.some(time => h2.includes(time))
  }

  const renderMatchAnalysis = (request: any) => {
    if (request.is_paired) {
      if (!request.partner_details) return <span className="text-gray-400">Loading details...</span>
      const juzMatch = request.chosen_juz === request.partner_details.chosen_juz
      const zonaMatch = request.user_zona_waktu === request.partner_details.zona_waktu
      const timeMatch = hasTimeSlotOverlap(request.main_time_slot, request.partner_details.main_time_slot)
      
      return (
        <div className="flex flex-wrap gap-1">
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${juzMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            Juz {juzMatch ? '✓' : '✗'}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${zonaMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            Zona {zonaMatch ? '✓' : '✗'}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${timeMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            Waktu {timeMatch ? '✓' : '✗'}
          </span>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-gray-500">Perfect:</span>
          <span className="font-semibold text-green-600">{request.perfect_matches || 0}</span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-gray-500">Zona:</span>
          <span className="font-semibold text-blue-600">{request.zona_waktu_matches || 0}</span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-gray-500">Juz:</span>
          <span className="font-semibold text-purple-600">{request.same_juz_matches || 0}</span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-gray-500">Waktu:</span>
          <span className="font-semibold text-orange-600">{(request.main_time_matches || 0) + (request.backup_time_matches || 0)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6">
      {/* Batch Selector & Overall Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Info className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Admin Pairing Panel</h2>
            <p className="text-sm text-gray-500">Management pasangan belajar thalibah</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium text-gray-700"
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} {batch.status === 'ACTIVE' ? '(Active)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={() => { loadPairingRequests(); loadStatistics(); }}
            className="w-full sm:w-auto px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-black transition-colors font-medium text-sm shadow-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <PairingStatsCard stats={stats} />

      {/* Tabs Control */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200">
        {[
          { id: 'self', label: 'Pilih Sendiri', count: stats.selfMatch.submitted },
          { id: 'system', label: 'Cari Sistem', count: stats.systemMatch.submitted },
          { id: 'tarteel', label: 'Tarteel', count: stats.tarteel.submitted },
          { id: 'family', label: 'Family', count: stats.family.submitted }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 relative ${
              activeTab === tab.id
                ? 'border-green-800 text-green-900 bg-green-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-green-800 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-lg shadow h-96 flex flex-col items-center justify-center border border-gray-100">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-green-800 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Memuat data permintaan...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'self' && (
            <SelfMatchTab
              requests={selfMatchRequests}
              onApprove={handleApprove}
              onManualPair={(user) => { setManualPairUser1(user); setShowManualPairModal(true); }}
              onReject={(id) => { setRejectingId(id); setShowRejectModal(true); }}
            />
          )}

          {activeTab === 'system' && (
            <SystemMatchTab
              requests={systemMatchRequests}
              onFindMatches={handleFindMatches}
              onBulkPair={handleBulkPair}
              onRevertAll={handleRevertAllPairings}
              onViewDetail={handleViewPairingDetail}
              onRevertPairing={handleRevertPairing}
              onAddToPair={(user) => setAddToPairModal(user)}
              onChangePartnerType={(user, type) => handleChangePartnerType(user, type)}
              sortConfigs={sortConfigs}
              onSort={handleSort}
              calculateAge={calculateAge}
              renderMatchAnalysis={renderMatchAnalysis}
              hasExistingPairings={pairingsWithSlots.length > 0}
            />
          )}

          {activeTab === 'tarteel' && (
            <TarteelTab
              requests={tarteelRequests}
              onApprove={handleApproveTarteel}
              onRevert={handleRevertTarteelPairing}
              onChangePartnerType={(user, type) => handleChangePartnerType(user, type as any)}
              calculateAge={calculateAge}
            />
          )}

          {activeTab === 'family' && (
            <FamilyTab
              requests={familyRequests}
              onApprove={handleApproveFamily}
              onRevert={handleRevertFamilyPairing}
              onChangePartnerType={(user, type) => handleChangePartnerType(user, type as any)}
              calculateAge={calculateAge}
            />
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200 rounded-lg shadow-sm">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Menampilkan <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span> sampai{' '}
                    <span className="font-medium">{Math.min(currentPage * pagination.limit, pagination.total)}</span> dari{' '}
                    <span className="font-medium">{pagination.total}</span> hasil
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Halaman {currentPage} dari {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(pagination.totalPages)}
                      disabled={currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                    >
                      Last
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <MatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        selectedUser={selectedUser}
        matchData={matchData}
        selectedMatch={selectedMatch}
        onSelectMatch={setSelectedMatch}
        onConfirm={handleCreatePairing}
        calculateAge={calculateAge}
        matchSortConfigs={matchSortConfigs}
        onMatchSort={handleMatchSort}
      />

      <RejectModal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectReason(''); setRejectingId(''); }}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleReject}
      />

      <ManualPairModal
        isOpen={showManualPairModal}
        onClose={() => setShowManualPairModal(false)}
        user1={manualPairUser1}
        user2={manualPairUser2}
        onUser2Select={setManualPairUser2}
        allRequests={selfMatchRequests}
        onConfirm={handleManualPair}
      />

      <AddToPairModal
        isOpen={!!addToPairModal}
        onClose={() => setAddToPairModal(null)}
        data={addToPairModal}
        pairings={pairingsWithSlots}
        onConfirm={handleAddToPair}
      />

      <PartnerTypeModal
        isOpen={showPartnerTypeModal}
        onClose={() => setShowPartnerTypeModal(false)}
        user={partnerTypeUser}
        newType={newPartnerType}
        partnerName={partnerName}
        onPartnerNameChange={setPartnerName}
        relationship={partnerRelationship}
        onRelationshipChange={setPartnerRelationship}
        notes={partnerNotes}
        onNotesChange={setPartnerNotes}
        onConfirm={handleConfirmPartnerTypeChange}
      />

      <PairingDetailModal
        isOpen={showPairingDetailModal}
        onClose={() => setShowPairingDetailModal(false)}
        loading={loadingPairingDetail}
        detail={pairingDetail}
        calculateAge={calculateAge}
        hasTimeSlotOverlap={hasTimeSlotOverlap}
      />
    </div>
  )
}
