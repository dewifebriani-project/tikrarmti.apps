'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { ExamQuestion, AdminQuestionEditForm, QuestionAnalytics, JuzNumber } from '@/types/exam';

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

export function useAdminExamQuestions(onSuccess?: () => void) {
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
  const [sortField, setSortField] = useState<'juz_number' | 'section_number' | 'question_number' | 'created_at' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  const loadJuzOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/juz');
      const result = await response.json();
      if (response.ok) {
        setJuzOptions(result.data || []);
      }
    } catch (error) {
      console.error('Error loading juz options:', error);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
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
  }, [selectedJuz, selectedSection, sortField, sortOrder, searchQuery, filterType, filterActive]);

  useEffect(() => {
    loadQuestions();
    loadJuzOptions();
  }, [loadQuestions, loadJuzOptions]);

  useEffect(() => {
    if (juzOptions.length > 0 && !aiForm.juz_code) {
      setAiForm(prev => ({ ...prev, juz_code: juzOptions[0].code }));
    }
  }, [juzOptions, aiForm.juz_code]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedJuz, selectedSection, searchQuery, filterType, filterActive]);

  const handleSort = (field: typeof sortField) => {
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

  const statistics = useMemo(() => {
    const stats: Record<string, Record<number, number>> = {};
    questions.forEach(q => {
      const juzKey = `Juz ${q.juz_number}`;
      if (!stats[juzKey]) stats[juzKey] = {};
      if (!stats[juzKey][q.section_number]) stats[juzKey][q.section_number] = 0;
      stats[juzKey][q.section_number]++;
    });
    return stats;
  }, [questions]);

  return {
    questions,
    loading,
    selectedJuz,
    setSelectedJuz,
    selectedSection,
    setSelectedSection,
    currentPage,
    setCurrentPage,
    showEditModal,
    setShowEditModal,
    editingQuestion,
    setEditingQuestion,
    showDeleteModal,
    setShowDeleteModal,
    deletingQuestionId,
    setDeletingQuestionId,
    isSaving,
    juzOptions,
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    handleSort,
    filterType,
    setFilterType,
    filterActive,
    setFilterActive,
    showPreviewModal,
    setShowPreviewModal,
    previewQuestion,
    setPreviewQuestion,
    showAnalytics,
    setShowAnalytics,
    analytics,
    analyticsLoading,
    analyticsSummary,
    loadAnalytics,
    showAIModal,
    setShowAIModal,
    aiGenerating,
    aiForm,
    setAiForm,
    handleDelete,
    handleUpdate,
    handleAIGenerate,
    statistics,
  };
}
