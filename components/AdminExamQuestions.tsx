'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FileUp, Plus, Edit2, Trash2, Eye, Filter, Download, ChevronLeft, ChevronRight, X, Sparkles, Loader2, ArrowUpDown, Search, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { JuzNumber, ExamQuestion, AdminQuestionEditForm, QuestionAnalytics } from '@/types/exam';

interface AdminExamQuestionsProps {
  onImportClick: () => void;
  onAddManualClick: () => void;
  onSuccess?: () => void;
}

const ITEMS_PER_PAGE = 20;

const SECTION_OPTIONS = [
  { value: 1, label: '1 - Tebak Nama Surat' },
  { value: 2, label: '2 - Tebak Ayat' },
  { value: 3, label: '3 - Sambung Surat' },
  { value: 4, label: '4 - Tebak Awal Ayat' },
  { value: 5, label: '5 - Ayat Mutasyabihat' },
  { value: 6, label: '6 - Pengenalan Surat' },
  { value: 7, label: '7 - Tebak Halaman' },
];

type SortField = 'juz_number' | 'section_number' | 'question_number' | 'created_at' | 'updated_at';
type SortOrder = 'asc' | 'desc';

interface JuzOption {
  id: string;
  code: string;
  name: string;
  juz_number: number;
  part: string;
  start_page: number;
  end_page: number;
  total_pages: number;
  is_active: boolean;
  sort_order: number;
}

export function AdminExamQuestions({ onImportClick, onAddManualClick, onSuccess }: AdminExamQuestionsProps) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJuz, setSelectedJuz] = useState<JuzNumber | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [juzOptions, setJuzOptions] = useState<JuzOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterType, setFilterType] = useState<'all' | 'multiple_choice' | 'introduction'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<ExamQuestion | null>(null);

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<QuestionAnalytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);

  // AI Generate states
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiForm, setAiForm] = useState({
    juz_code: '',
    section_number: 1,
    question_count: 5,
  });

  useEffect(() => {
    loadQuestions();
    loadJuzOptions();
  }, [selectedJuz, selectedSection, sortField, sortOrder, searchQuery, filterType, filterActive]);

  // Set default juz_code when juzOptions are loaded
  useEffect(() => {
    if (juzOptions.length > 0 && !aiForm.juz_code) {
      setAiForm(prev => ({ ...prev, juz_code: juzOptions[0].code }));
    }
  }, [juzOptions]);

  const loadJuzOptions = async () => {
    try {
      const response = await fetch('/api/juz');
      const result = await response.json();
      if (response.ok) {
        setJuzOptions(result.data || []);
      }
    } catch (error) {
      console.error('Error loading juz options:', error);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedJuz, selectedSection, searchQuery, filterType, filterActive]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      let url = '/api/exam/questions';

      const params = new URLSearchParams();
      params.append('active', 'true');

      if (selectedJuz !== 'all') {
        params.append('juz', selectedJuz.toString());
      }

      if (selectedSection !== 'all') {
        params.append('section', selectedSection.toString());
      }

      const response = await fetch(`${url}?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        let filteredQuestions = result.data || [];

        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredQuestions = filteredQuestions.filter((q: ExamQuestion) =>
            q.question_text.toLowerCase().includes(query) ||
            q.section_title?.toLowerCase().includes(query) ||
            q.options?.some((opt: any) => opt.text.toLowerCase().includes(query))
          );
        }

        // Apply type filter
        if (filterType !== 'all') {
          filteredQuestions = filteredQuestions.filter((q: ExamQuestion) => q.question_type === filterType);
        }

        // Apply active filter
        if (filterActive === 'active') {
          filteredQuestions = filteredQuestions.filter((q: ExamQuestion) => q.is_active !== false);
        } else if (filterActive === 'inactive') {
          filteredQuestions = filteredQuestions.filter((q: ExamQuestion) => q.is_active === false);
        }

        // Apply sorting
        filteredQuestions = [...filteredQuestions].sort((a: any, b: any) => {
          let aVal = a[sortField];
          let bVal = b[sortField];

          // Handle null values
          if (aVal === null || aVal === undefined) return sortOrder === 'asc' ? 1 : -1;
          if (bVal === null || bVal === undefined) return sortOrder === 'asc' ? -1 : 1;

          if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

        setQuestions(filteredQuestions);
      } else {
        toast.error(result.error || 'Failed to load questions');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    setShowAnalytics(true);
    try {
      const params = new URLSearchParams();
      if (selectedJuz !== 'all') params.append('juz', selectedJuz.toString());
      if (selectedSection !== 'all') params.append('section', selectedSection.toString());

      const response = await fetch(`/api/exam/questions/analytics?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setAnalytics(result.data || []);
        setAnalyticsSummary(result.summary);
      } else {
        toast.error(result.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      const response = await fetch(`/api/exam/questions?id=${questionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Question deleted successfully');
        loadQuestions();
        setShowDeleteModal(false);
        setDeletingQuestionId(null);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const handleUpdate = async (formData: AdminQuestionEditForm) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/exam/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingQuestion?.id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Question updated successfully');
        loadQuestions();
        setShowEditModal(false);
        setEditingQuestion(null);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || 'Failed to update question');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiGenerating(true);

    try {
      const response = await fetch('/api/exam/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully generated ${result.data?.length || 0} questions`);
        loadQuestions();
        setShowAIModal(false);
        // Reset form to first available juz
        setAiForm({
          juz_code: juzOptions.length > 0 ? juzOptions[0].code : '',
          section_number: 1,
          question_count: 5,
        });
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions');
    } finally {
      setAiGenerating(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedQuestions = questions.slice(startIndex, endIndex);

  const sections = selectedJuz !== 'all'
    ? Array.from(new Set(questions.map(q => q.section_number))).sort()
    : [];

  // Use paginated questions for display

  // Calculate statistics per juz and section
  const getStatistics = () => {
    const stats: Record<string, Record<number, number>> = {};

    questions.forEach(q => {
      const juzKey = `Juz ${q.juz_number}`;
      if (!stats[juzKey]) {
        stats[juzKey] = {};
      }
      if (!stats[juzKey][q.section_number]) {
        stats[juzKey][q.section_number] = 0;
      }
      stats[juzKey][q.section_number]++;
    });

    return stats;
  };

  const statistics = getStatistics();

  const sectionNames: Record<number, string> = {
    1: 'Tebak Nama Surat',
    2: 'Tebak Ayat',
    3: 'Sambung Surat',
    4: 'Tebak Awal Ayat',
    5: 'Ayat Mutasyabihat',
    6: 'Pengenalan Surat',
    7: 'Tebak Halaman',
    8: 'Lainnya',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Questions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage multiple-choice exam questions for Juz 28, 29, and 30
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Sparkles className="w-4 h-4" />
            AI Generate
          </button>
          <button
            onClick={onAddManualClick}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Manual
          </button>
          <button
            onClick={onImportClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FileUp className="w-4 h-4" />
            Bulk Import
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Soal per Juz & Tipe</h3>
        <div className="space-y-4">
          {Object.keys(statistics).length === 0 ? (
            <p className="text-gray-500 text-sm">Belum ada data soal</p>
          ) : (
            Object.entries(statistics).map(([juz, sections]) => (
              <div key={juz} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{juz}</h4>
                  <span className="text-sm text-gray-600">
                    Total: {Object.values(sections).reduce((a, b) => a + b, 0)} soal
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(sections)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([sectionNum, count]) => (
                      <div
                        key={sectionNum}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          {sectionNames[parseInt(sectionNum)] || `Section ${sectionNum}`}
                        </div>
                        <div className="text-xl font-bold text-blue-600">{count}</div>
                        <div className="text-xs text-gray-400">soal</div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search question text..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Juz Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Juz
            </label>
            <select
              value={selectedJuz}
              onChange={(e) => {
                setSelectedJuz(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as JuzNumber);
                setSelectedSection('all');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Juz</option>
              {juzOptions.map((option) => (
                <option key={option.code} value={option.juz_number}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              disabled={selectedJuz === 'all'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="all">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>
                  Section {section}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="introduction">Introduction</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Result count */}
        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{questions.length}</span> questions
          </span>
          {(searchQuery || filterType !== 'all' || filterActive !== 'all' || selectedJuz !== 'all' || selectedSection !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterActive('all');
                setSelectedJuz('all');
                setSelectedSection('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">No questions found</p>
            <button
              onClick={onImportClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FileUp className="w-4 h-4" />
              Import Questions
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-300">
                  <tr>
                    <th
                      onClick={() => handleSort('juz_number')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        Juz
                        {sortField === 'juz_number' && (
                          <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                        {sortField !== 'juz_number' && <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Section
                    </th>
                    <th
                      onClick={() => handleSort('question_number')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        Q#
                        {sortField === 'question_number' && (
                          <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                        {sortField !== 'question_number' && <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Options
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Points
                    </th>
                    <th
                      onClick={() => handleSort('created_at')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        Created
                        {sortField === 'created_at' && (
                          <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                        {sortField !== 'created_at' && <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedQuestions.map((question, idx) => (
                  <tr key={question.id} className={`hover:bg-blue-50/50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {question.juz_code || `Juz ${question.juz_number}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">Sec {question.section_number}</span>
                        <div className="text-xs text-gray-500 truncate max-w-[120px]" title={question.section_title}>
                          {question.section_title}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                        {question.question_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-md text-sm text-gray-700 line-clamp-2" title={question.question_text}>
                        {question.question_text}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        question.question_type === 'multiple_choice'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Introduction'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {question.options?.length || 0} options
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800">
                        {question.points} pts
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {new Date(question.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setPreviewQuestion(question);
                            setShowPreviewModal(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Preview question"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingQuestion(question);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Edit question"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingQuestionId(question.id);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50 rounded-b-lg">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(endIndex, questions.length)}</span> of <span className="font-semibold text-gray-900">{questions.length}</span> questions
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[2.5rem] px-2 py-1 text-sm font-medium rounded-lg transition ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Question
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingQuestionId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deletingQuestionId && handleDelete(deletingQuestionId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditModal && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Question</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingQuestion(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <EditQuestionForm
              question={editingQuestion}
              juzOptions={juzOptions}
              onSave={handleUpdate}
              onCancel={() => {
                setShowEditModal(false);
                setEditingQuestion(null);
              }}
              isSaving={isSaving}
            />
          </div>
        </div>
      )}

      {/* AI Generate Questions Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Generate Questions
              </h2>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAIGenerate} className="p-6 space-y-4">
              {/* Juz Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilihan Juz *
                </label>
                {juzOptions.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <select
                    value={aiForm.juz_code}
                    onChange={(e) => setAiForm({ ...aiForm, juz_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Pilih juz</option>
                    {juzOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.name} (halaman {option.start_page} - {option.end_page})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Section Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type / Section *
                </label>
                <select
                  value={aiForm.section_number}
                  onChange={(e) => setAiForm({ ...aiForm, section_number: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {SECTION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={aiForm.question_count}
                  onChange={(e) => setAiForm({ ...aiForm, question_count: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Generate 1-20 questions at a time
                </p>
              </div>

              {/* Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-800">
                  <strong>Info:</strong> AI akan generate soal-soal ujian sesuai dengan tipe yang dipilih.
                  Soal akan disimpan otomatis ke database setelah generate selesai.
                </p>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Catatan:</strong> Proses generate mungkin memerlukan waktu beberapa detik.
                  Pastikan koneksi internet stabil.
                </p>
              </div>

              {/* Footer */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  disabled={aiGenerating}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={aiGenerating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Questions
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Question Modal */}
      {showPreviewModal && previewQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-600" />
                Question Preview
              </h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewQuestion(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                  {previewQuestion.juz_code || `Juz ${previewQuestion.juz_number}`}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Sec {previewQuestion.section_number}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  Q#{previewQuestion.question_number}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {previewQuestion.points} pts
                </span>
              </div>

              {/* Question Text */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Question:</h4>
                <p className="text-gray-900">{previewQuestion.question_text}</p>
              </div>

              {/* Options */}
              {previewQuestion.options && previewQuestion.options.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Options:</h4>
                  <div className="space-y-2">
                    {previewQuestion.options.map((option, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          option.isCorrect
                            ? 'bg-green-50 border-green-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          option.isCorrect ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={`flex-1 ${option.isCorrect ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                          {option.text}
                        </span>
                        {option.isCorrect && (
                          <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Section:</h4>
                <p className="text-blue-800">{previewQuestion.section_title}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Question Analytics
              </h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : analyticsSummary ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="text-sm text-blue-700 font-medium">Total Questions</div>
                      <div className="text-2xl font-bold text-blue-900">{analyticsSummary.totalQuestions}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <div className="text-sm text-green-700 font-medium">Overall Correct Rate</div>
                      <div className="text-2xl font-bold text-green-900">{analyticsSummary.overallCorrectRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
                      <div className="text-sm text-emerald-700 font-medium">Easy Questions</div>
                      <div className="text-2xl font-bold text-emerald-900">{analyticsSummary.easyQuestions}</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                      <div className="text-sm text-red-700 font-medium">Hard Questions</div>
                      <div className="text-2xl font-bold text-red-900">{analyticsSummary.hardQuestions}</div>
                    </div>
                  </div>

                  {/* Questions Table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Question</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Attempts</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Correct %</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Difficulty</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Most Wrong Answer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {analytics.map((q) => (
                          <tr key={q.questionId} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="max-w-sm">
                                <p className="text-sm text-gray-900 line-clamp-2">{q.question.question_text}</p>
                                <div className="flex gap-1 mt-1">
                                  <span className="text-xs text-gray-500">{q.question.juz_code || `Juz ${q.question.juz_number}`}</span>
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-500">Q{q.question.question_number}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-700">{q.totalAttempts}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                q.correctRate >= 70
                                  ? 'bg-green-100 text-green-800'
                                  : q.correctRate >= 40
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {q.correctRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                q.difficulty === 'easy'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : q.difficulty === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {q.difficulty}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {q.optionStats
                                .filter((opt) => !opt.isCorrect && opt.timesChosen > 0)
                                .sort((a, b) => b.timesChosen - a.timesChosen)[0]?.optionText || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Empty State */}
                  {analytics.length === 0 && (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No analytics data available yet.</p>
                      <p className="text-sm text-gray-500 mt-1">Analytics will be available once users have submitted exam attempts.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">Failed to load analytics.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Edit Question Form Component
function EditQuestionForm({
  question,
  juzOptions,
  onSave,
  onCancel,
  isSaving
}: {
  question: ExamQuestion;
  juzOptions: JuzOption[];
  onSave: (data: AdminQuestionEditForm) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  // Find juz code from juz number for the current question
  const getCurrentJuzCode = () => {
    const juzOption = juzOptions.find(opt => opt.juz_number === question.juz_number);
    return juzOption?.code || '';
  };

  const [formData, setFormData] = useState<AdminQuestionEditForm>({
    juz_number: question.juz_number,
    section_number: question.section_number,
    section_title: question.section_title || '',
    question_number: question.question_number,
    question_text: question.question_text,
    question_type: question.question_type || 'multiple_choice',
    options: question.options || [],
    points: question.points || 1,
    is_active: question.is_active !== false,
  });

  const [juzCode, setJuzCode] = useState(getCurrentJuzCode());

  const handleJuzChange = (newJuzCode: string) => {
    setJuzCode(newJuzCode);
    const selectedJuz = juzOptions.find(opt => opt.code === newJuzCode);
    if (selectedJuz) {
      setFormData({ ...formData, juz_number: selectedJuz.juz_number as JuzNumber });
    }
  };

  const sectionOptions = [
    { number: 1, title: 'Tebak Nama Surat' },
    { number: 2, title: 'Tebak Ayat' },
    { number: 3, title: 'Sambung Surat' },
    { number: 4, title: 'Tebak Awal Ayat' },
    { number: 5, title: 'Ayat Mutasyabihat' },
    { number: 6, title: 'Pengenalan Surat' },
    { number: 7, title: 'Tebak Halaman' },
    { number: 8, title: 'Lainnya' },
  ];

  const handleSectionChange = (value: string) => {
    const num = parseInt(value);
    setFormData({ ...formData, section_number: num });
    const section = sectionOptions.find(s => s.number === num);
    if (section) {
      setFormData(prev => ({ ...prev, section_title: section.title }));
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { text: '', isCorrect: false }]
    });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pilihan Juz *</label>
          <select
            value={juzCode}
            onChange={(e) => handleJuzChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Pilih juz</option>
            {juzOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
          <select
            value={formData.section_number}
            onChange={(e) => handleSectionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            {sectionOptions.map(section => (
              <option key={section.number} value={section.number}>
                {section.number}. {section.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Question Number</label>
        <input
          type="number"
          value={formData.question_number}
          onChange={(e) => setFormData({ ...formData, question_number: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
        <textarea
          value={formData.question_text}
          onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
        <select
          value={formData.question_type}
          onChange={(e) => setFormData({ ...formData, question_type: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="introduction">Introduction</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Options</label>
          <button
            type="button"
            onClick={addOption}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Option
          </button>
        </div>
        <div className="space-y-2">
          {formData.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={option.isCorrect}
                onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                className="w-4 h-4 text-green-600"
              />
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Option text"
                required
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                disabled={formData.options.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">Check the box next to the correct answer</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
          <input
            type="number"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            min="1"
            required
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
