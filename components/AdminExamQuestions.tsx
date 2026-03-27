'use client';

import { FileUp, Plus, Sparkles, BarChart3 } from 'lucide-react';
import { useAdminExamQuestions } from '@/hooks/useAdminExamQuestions';
import { QuestionStats } from './exam/QuestionStats';
import { QuestionFilters } from './exam/QuestionFilters';
import { QuestionTable } from './exam/QuestionTable';
import { QuestionModals } from './exam/QuestionModals';

interface AdminExamQuestionsProps {
  onImportClick: () => void;
  onAddManualClick: () => void;
  onSuccess?: () => void;
}

const SECTION_OPTIONS = [
  { value: 1, label: '1 - Tebak Nama Surat' },
  { value: 2, label: '2 - Tebak Ayat' },
  { value: 3, label: '3 - Sambung Surat' },
  { value: 4, label: '4 - Tebak Awal Ayat' },
  { value: 5, label: '5 - Ayat Mutasyabihat' },
  { value: 6, label: '6 - Pengenalan Surat' },
  { value: 7, label: '7 - Tebak Halaman' },
];

const ITEMS_PER_PAGE = 20;

export function AdminExamQuestions({ onImportClick, onAddManualClick, onSuccess }: AdminExamQuestionsProps) {
  const {
    questions, loading, selectedJuz, setSelectedJuz, selectedSection, setSelectedSection,
    currentPage, setCurrentPage, showEditModal, setShowEditModal, editingQuestion, setEditingQuestion,
    showDeleteModal, setShowDeleteModal, deletingQuestionId, isSaving, juzOptions, searchQuery,
    setSearchQuery, sortField, sortOrder, handleSort, filterType, setFilterType,
    filterActive, setFilterActive, showPreviewModal, setShowPreviewModal, previewQuestion,
    setPreviewQuestion, showAnalytics, setShowAnalytics, analytics, analyticsLoading,
    analyticsSummary, loadAnalytics, showAIModal, setShowAIModal, aiGenerating, aiForm,
    setAiForm, handleDelete, handleUpdate, handleAIGenerate, statistics
  } = useAdminExamQuestions(onSuccess);

  // Pagination calculations
  const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedQuestions = questions.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Exam Questions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage multiple-choice exam questions for Juz 28, 29, and 30
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            AI Generate
          </button>
          <button
            onClick={onAddManualClick}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Manual
          </button>
          <button
            onClick={onImportClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <FileUp className="w-4 h-4" />
            Bulk Import
          </button>
        </div>
      </div>

      {/* Statistics */}
      <QuestionStats statistics={statistics} />

      {/* Filters */}
      <QuestionFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedJuz={selectedJuz}
        setSelectedJuz={setSelectedJuz}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        filterType={filterType}
        setFilterType={setFilterType}
        filterActive={filterActive}
        setFilterActive={setFilterActive}
        juzOptions={juzOptions}
        sections={Array.from(new Set(questions.map(q => q.section_number))).sort()}
        totalQuestions={questions.length}
      />

      {/* Table */}
      <QuestionTable
        questions={questions}
        paginatedQuestions={paginatedQuestions}
        startIndex={startIndex}
        endIndex={endIndex}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        sortField={sortField}
        sortOrder={sortOrder}
        handleSort={handleSort}
        onPreview={(q) => { setPreviewQuestion(q); setShowPreviewModal(true); }}
        onEdit={(q) => { setEditingQuestion(q); setShowEditModal(true); }}
        onDelete={(id) => { setShowDeleteModal(true); }}
      />

      {/* Modals */}
      <QuestionModals
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        deletingQuestionId={deletingQuestionId}
        onDelete={handleDelete}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        editingQuestion={editingQuestion}
        setEditingQuestion={setEditingQuestion}
        juzOptions={juzOptions}
        onUpdate={handleUpdate}
        isSaving={isSaving}
        showAIModal={showAIModal}
        setShowAIModal={setShowAIModal}
        aiForm={aiForm}
        setAiForm={setAiForm}
        aiGenerating={aiGenerating}
        onAIGenerate={handleAIGenerate}
        sectionOptions={SECTION_OPTIONS}
        showPreviewModal={showPreviewModal}
        setShowPreviewModal={setShowPreviewModal}
        previewQuestion={previewQuestion}
        setPreviewQuestion={setPreviewQuestion}
        showAnalytics={showAnalytics}
        setShowAnalytics={setShowAnalytics}
        analytics={analytics}
        analyticsLoading={analyticsLoading}
        analyticsSummary={analyticsSummary}
      />
    </div>
  );
}
