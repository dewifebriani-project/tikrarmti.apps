'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FileUp, Plus, Edit2, Trash2, Eye, Filter, Download } from 'lucide-react';
import { JuzNumber, ExamQuestion } from '@/types/exam';

interface AdminExamQuestionsProps {
  onImportClick: () => void;
  onAddManualClick: () => void;
}

export function AdminExamQuestions({ onImportClick, onAddManualClick }: AdminExamQuestionsProps) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJuz, setSelectedJuz] = useState<JuzNumber | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<number | 'all'>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [selectedJuz, selectedSection]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      let url = '/api/exam/questions?active=true';

      if (selectedJuz !== 'all') {
        url += `&juz=${selectedJuz}`;
      }

      if (selectedSection !== 'all') {
        url += `&section=${selectedSection}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (response.ok) {
        setQuestions(result.data || []);
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
      } else {
        toast.error(result.error || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam_questions_juz${selectedJuz}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Questions exported to JSON');
  };

  const sections = selectedJuz !== 'all'
    ? Array.from(new Set(questions.map(q => q.section_number))).sort()
    : [];

  const filteredQuestions = questions;

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
            onClick={exportToJSON}
            disabled={questions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Download className="w-4 h-4" />
            Export JSON
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
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Juz Number
            </label>
            <select
              value={selectedJuz}
              onChange={(e) => {
                setSelectedJuz(e.target.value as JuzNumber | 'all');
                setSelectedSection('all');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Juz</option>
              <option value={28}>Juz 28</option>
              <option value={29}>Juz 29</option>
              <option value={30}>Juz 30</option>
            </select>
          </div>

          <div className="flex-1">
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

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Questions
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-semibold">
              {filteredQuestions.length} questions
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Juz
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Q#
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Options
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {question.juz_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900">{question.section_number}</div>
                        <div className="text-xs text-gray-500 truncate">{question.section_title}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {question.question_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="max-w-md truncate" title={question.question_text}>
                        {question.question_text.substring(0, 100)}
                        {question.question_text.length > 100 && '...'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        question.question_type === 'multiple_choice'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {question.question_type === 'multiple_choice' ? 'MC' : 'Intro'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {question.options?.length || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {question.points}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingQuestion(question);
                            setShowEditModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit question"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingQuestionId(question.id);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
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
    </div>
  );
}
