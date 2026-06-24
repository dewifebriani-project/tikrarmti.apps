import re

with open('components/admin/daftar-ulang-v2/DaftarUlangV2Tab.tsx', 'r') as f:
    content = f.read()

# We need to find the start of `return (` at the main component level
# We can look for `  return (` that starts after the handlers.
# Actually, we can just split by `  return (` and take the last part? No, there might be other `return (` inside methods.
# Let's find `  return (\n    <div className="space-y-4">\n      {/* Header & Sub-tabs */}`

search_str = '  return (\n    <div className="space-y-4">\n      {/* Header & Sub-tabs */}'
idx = content.find(search_str)

if idx == -1:
    print("Could not find the target string")
    exit(1)

before_render = content[:idx]

new_render = """
  // Handlers for V2 Components
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(finalSubmissions.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async () => {
    setIsBulkProcessing(true);
    try {
      const response = await fetch('/api/admin/daftar-ulang/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionIds: Array.from(selectedIds),
          action: bulkAction,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process bulk action');
      }

      toast.success(
        `Berhasil ${bulkAction === 'approve' ? 'menyetujui' : 'menolak'} ${selectedIds.size} pendaftaran`
      );

      // Refresh data
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('[DaftarUlangV2Tab] Error in bulk action:', error);
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Derived final submissions
  const filteredByStatus = useMemo(() => {
    return submissions.filter(s => filterStatus === 'all' || s.status === filterStatus);
  }, [submissions, filterStatus]);

  const finalSubmissions = useMemo(() => {
    return [...filteredByStatus].sort((a, b) => {
      // Basic sorting mapped from the v2 table
      if (sortField === 'name') {
        const aName = a.confirmed_full_name || a.user?.full_name || '';
        const bName = b.confirmed_full_name || b.user?.full_name || '';
        return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
      }
      if (sortField === 'status') {
        return sortOrder === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      }
      if (sortField === 'submitted_at') {
        const aDate = new Date(a.submitted_at || a.created_at).getTime();
        const bDate = new Date(b.submitted_at || b.created_at).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      if (sortField === 'halaqah') {
        const aHal = a.ujian_halaqah?.name || '';
        const bHal = b.ujian_halaqah?.name || '';
        return sortOrder === 'asc' ? aHal.localeCompare(bHal) : bHal.localeCompare(aHal);
      }
      return 0;
    });
  }, [filteredByStatus, sortField, sortOrder]);


  return (
    <div className="space-y-6 relative">
      <DaftarUlangV2Stats 
        stats={stats as DaftarUlangStatsData}
        isLoading={statsLoading}
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('submissions')}
          className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
            activeSubTab === 'submissions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
          }`}
        >
          Semua Data
        </button>
        <button
          onClick={() => setActiveSubTab('per_juz')}
          className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
            activeSubTab === 'per_juz'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
          }`}
        >
          Per Juz
        </button>
        <button
          onClick={() => setActiveSubTab('halaqah')}
          className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
            activeSubTab === 'halaqah'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
          }`}
        >
          Per Halaqah
        </button>
      </div>

      {activeSubTab === 'submissions' && (
        <>
          <DaftarUlangV2Filters 
            searchQuery={searchQuery}
            batchId={localBatchId}
            status={filterStatus}
            batches={batches}
            onChange={(filters) => {
              setSearchQuery(filters.search);
              setLocalBatchId(filters.batchId);
              setFilterStatus(filters.status);
              setCurrentPage(1);
            }}
            onDownloadExcel={downloadExcel}
            onDownloadPDF={downloadPDF}
            isDownloadingExcel={downloadingExcel}
            isDownloadingPDF={downloadingPDF}
          />

          <DaftarUlangV2Table 
            submissions={finalSubmissions}
            isLoading={loading}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onViewDetail={(sub) => setSelectedSubmission(sub)}
            onResetHalaqah={handleResetHalaqah}
            resettingId={resettingId}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={(field) => {
              if (sortField === field) {
                setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
              } else {
                setSortField(field as SortField);
                setSortOrder('asc');
              }
            }}
          />

          {/* Pagination Component mapped here */}
          {!searchQuery && pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-white rounded-2xl shadow-sm">
              <div className="text-sm text-gray-500 font-medium">
                Halaman {currentPage} dari {pagination.totalPages} <span className="mx-2 text-gray-300">|</span> Total {pagination.total} data
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-8">
              <div className="flex items-center gap-2 border-r border-gray-700 pr-6">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold">
                  {selectedIds.size}
                </span>
                <span className="text-sm font-medium">Data Terpilih</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setBulkAction('approve');
                    setShowBulkConfirm(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Approve Terpilih
                </button>
                <button
                  onClick={() => {
                    setBulkAction('reject');
                    setShowBulkConfirm(true);
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Reject Terpilih
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeSubTab === 'per_juz' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Kelompok Per Juz</h2>
              <div className="text-sm text-gray-500">
                Filter by Batch is applied
              </div>
            </div>

            {juzGroupsLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : Object.keys(juzGroups).length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                Tidak ada data
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(juzGroups)
                  .sort(([a], [b]) => {
                    const getNum = (j: string) => parseInt(j.replace(/\D/g, '')) || 0;
                    return getNum(a) - getNum(b);
                  })
                  .map(([juz, juzSubmissions]) => {
                    return (
                      <div key={juz} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                          <h3 className="font-bold text-gray-900 text-lg">Juz {juz}</h3>
                          <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-blue-600 border border-blue-100">
                            {juzSubmissions.length} Thalibah
                          </span>
                        </div>
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {juzSubmissions.map(sub => (
                              <div key={sub.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <p className="font-bold text-sm text-gray-900">
                                  {sub.confirmed_full_name || sub.user?.full_name || '-'}
                                </p>
                                <div className="mt-2 space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Jadwal:</span>
                                    <span className="font-medium text-gray-700">{sub.confirmed_main_time_slot || '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Status:</span>
                                    <span className={`font-bold ${
                                      sub.status === 'approved' ? 'text-emerald-600' :
                                      sub.status === 'submitted' ? 'text-blue-600' :
                                      'text-gray-600'
                                    }`}>
                                      {sub.status.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
        </div>
      )}

      {activeSubTab === 'halaqah' && (
        <DaftarUlangHalaqahTab batchId={localBatchId === 'all' ? undefined : localBatchId} />
      )}

      {/* Modals */}
      {selectedSubmission && (
        <DetailModal 
          submission={selectedSubmission} 
          onClose={() => setSelectedSubmission(null)} 
        />
      )}

      <BulkConfirmModal 
        isOpen={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={handleBulkAction}
        action={bulkAction}
        count={selectedIds.size}
        isProcessing={isBulkProcessing}
      />
    </div>
  );
}
"""

with open('components/admin/daftar-ulang-v2/DaftarUlangV2Tab.tsx', 'w') as f:
    f.write(before_render + new_render)
