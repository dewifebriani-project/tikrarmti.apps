'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Plus, Trash2 } from 'lucide-react';
import { JuzNumber } from '@/types/exam';

interface AdminAddQuestionProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAddQuestion({ onClose, onSuccess }: AdminAddQuestionProps) {
  const [juzNumber, setJuzNumber] = useState<JuzNumber>(30);
  const [sectionNumber, setSectionNumber] = useState(1);
  const [sectionTitle, setSectionTitle] = useState('Ketentuan Ikhtibar');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'introduction'>('multiple_choice');
  const [options, setOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [points, setPoints] = useState(1);
  const [saving, setSaving] = useState(false);

  const sectionOptions = [
    { number: 1, title: 'Ketentuan Ikhtibar' },
    { number: 2, title: 'Tebak Nama Surat' },
    { number: 3, title: 'Tebak Ayat' },
    { number: 4, title: 'Sambung Surat' },
    { number: 5, title: 'Tebak Awal Ayat' },
    { number: 6, title: 'Ayat Mutasyabihat' },
    { number: 7, title: 'Pengenalan Surat' },
    { number: 8, title: 'Tebak Halaman' },
    { number: 9, title: 'Lainnya' },
  ];

  const handleSectionChange = (value: string) => {
    const num = parseInt(value);
    setSectionNumber(num);
    const section = sectionOptions.find(s => s.number === num);
    if (section) {
      setSectionTitle(section.title);
      setQuestionType(num === 1 ? 'introduction' : 'multiple_choice');
      setPoints(num === 1 ? 0 : 1);
    }
  };

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const handleCorrectChange = (index: number) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index
    }));
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('Minimal 2 opsi jawaban');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validation
    if (!questionText.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (questionType === 'multiple_choice') {
      const filledOptions = options.filter(opt => opt.text.trim());
      if (filledOptions.length < 2) {
        toast.error('Minimal 2 opsi jawaban harus diisi');
        return;
      }

      const hasCorrect = filledOptions.some(opt => opt.isCorrect);
      if (!hasCorrect) {
        toast.error('Pilih jawaban yang benar');
        return;
      }
    }

    try {
      setSaving(true);

      const response = await fetch('/api/exam/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          juz_number: juzNumber,
          section_number: sectionNumber,
          section_title: sectionTitle,
          question_number: questionNumber,
          question_text: questionText,
          question_type: questionType,
          options: questionType === 'introduction'
            ? [{ text: questionText, isCorrect: true }]
            : options.filter(opt => opt.text.trim()),
          points,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Soal berhasil ditambahkan');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to add question');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">Tambah Soal Manual</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Juz & Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Juz Number *
              </label>
              <select
                value={juzNumber}
                onChange={(e) => setJuzNumber(parseInt(e.target.value) as JuzNumber)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={28}>Juz 28</option>
                <option value={29}>Juz 29</option>
                <option value={30}>Juz 30</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section *
              </label>
              <select
                value={sectionNumber}
                onChange={(e) => handleSectionChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {sectionOptions.map(section => (
                  <option key={section.number} value={section.number}>
                    {section.number}. {section.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Number *
            </label>
            <input
              type="number"
              min="1"
              value={questionNumber}
              onChange={(e) => setQuestionNumber(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soal *
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={4}
              placeholder="Contoh:&#10;ٱلنَّجْمُ ٱلثَّاقِبُ&#10;&#10;Ayat ini terletak pada surat"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Soal
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={questionType === 'multiple_choice'}
                  onChange={() => setQuestionType('multiple_choice')}
                  className="mr-2"
                />
                <span>Multiple Choice</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={questionType === 'introduction'}
                  onChange={() => setQuestionType('introduction')}
                  className="mr-2"
                />
                <span>Introduction</span>
              </label>
            </div>
          </div>

          {/* Options for Multiple Choice */}
          {questionType === 'multiple_choice' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Pilihan Jawaban *
                </label>
                <button
                  onClick={addOption}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Opsi
                </button>
              </div>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={option.isCorrect}
                      onChange={() => handleCorrectChange(index)}
                      className="flex-shrink-0"
                      title="Pilih sebagai jawaban benar"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Opsi ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Klik radio button untuk menandai jawaban yang benar
              </p>
            </div>
          )}

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points
            </label>
            <input
              type="number"
              min="0"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Tambah Soal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
