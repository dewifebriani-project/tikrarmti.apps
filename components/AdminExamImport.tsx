'use client';

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FileUp, X, AlertCircle, CheckCircle, Download, ClipboardPaste, Info } from 'lucide-react';
import { JuzNumber } from '@/types/exam';

interface AdminExamImportProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

type ImportMode = 'json' | 'paste';

interface ImportQuestion {
  section_number: number;
  section_title: string;
  question_number: number;
  question_text: string;
  question_type: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  points: number;
}

interface ImportData {
  juz_number: JuzNumber;
  sections: Array<{
    section_number: number;
    section_title: string;
    questions: ImportQuestion[];
  }>;
}

export function AdminExamImport({ onClose, onImportSuccess }: AdminExamImportProps) {
  const [mode, setMode] = useState<ImportMode>('paste');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [preview, setPreview] = useState<ImportData | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [selectedJuz, setSelectedJuz] = useState<JuzNumber>(30);
  const [showDetailedPreview, setShowDetailedPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParsePaste = async () => {
    if (!pastedText.trim()) {
      toast.error('Please paste some text first');
      return;
    }

    try {
      setParsing(true);

      const response = await fetch('/api/exam/parse-google-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: pastedText,
          juz_number: selectedJuz,
        }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setPreview(result.data);
        toast.success(`Parsed ${result.data.sections.reduce((sum: number, s: any) => sum + s.questions.length, 0)} questions!`);
      } else {
        toast.error(result.error || 'Failed to parse text');
      }
    } catch (error) {
      console.error('Error parsing paste:', error);
      toast.error('Failed to parse text');
    } finally {
      setParsing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ImportData;

      // Validate structure
      if (!data.juz_number || ![28, 29, 30].includes(data.juz_number)) {
        toast.error('Invalid juz_number. Must be 28, 29, or 30');
        return;
      }

      if (!data.sections || !Array.isArray(data.sections)) {
        toast.error('Invalid format: sections array required');
        return;
      }

      // Count total questions
      const totalQuestions = data.sections.reduce((sum, section) => {
        return sum + (section.questions?.length || 0);
      }, 0);

      if (totalQuestions === 0) {
        toast.error('No questions found in file');
        return;
      }

      setSelectedFile(file);
      setPreview(data);
      toast.success(`File loaded: ${totalQuestions} questions for Juz ${data.juz_number}`);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      toast.error('Invalid JSON file format');
      setSelectedFile(null);
      setPreview(null);
    }
  };

  const handleImport = async () => {
    if (!preview) {
      toast.error(mode === 'paste' ? 'Please paste and parse text first' : 'Please select a file first');
      return;
    }

    try {
      setImporting(true);

      // Flatten questions from sections
      const questions: any[] = [];
      preview.sections.forEach((section) => {
        section.questions.forEach((q) => {
          questions.push({
            section_number: section.section_number,
            section_title: section.section_title,
            question_number: q.question_number,
            question_text: q.question_text,
            question_type: q.question_type || 'multiple_choice',
            options: q.options,
            points: q.points || 1,
          });
        });
      });

      const response = await fetch('/api/exam/questions/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          juz_number: preview.juz_number,
          questions,
          replace_existing: replaceExisting,
        }),
      });

      const result = await response.json();

      if (response.ok || response.status === 207) {
        toast.success(result.message || 'Questions imported successfully');
        onImportSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to import questions');
      }
    } catch (error) {
      console.error('Error importing questions:', error);
      toast.error('Failed to import questions');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = (juzNumber: JuzNumber) => {
    const template = {
      juz_number: juzNumber,
      juz_name: `Juz ${juzNumber}`,
      total_questions: 100,
      sections: [
        {
          section_number: 2,
          section_title: "Tebak Nama Surat",
          questions: [
            {
              question_number: 1,
              question_text: "Example Arabic text here\n\nAyat ini terletak pada surat",
              question_type: "multiple_choice",
              options: [
                { text: "Correct Answer", isCorrect: true },
                { text: "Wrong Answer 1", isCorrect: false },
                { text: "Wrong Answer 2", isCorrect: false },
                { text: "Wrong Answer 3", isCorrect: false }
              ],
              points: 1
            }
          ]
        },
        {
          section_number: 3,
          section_title: "Tebak Ayat",
          questions: []
        },
        {
          section_number: 4,
          section_title: "Sambung Surat",
          questions: []
        },
        {
          section_number: 5,
          section_title: "Tebak Awal Ayat",
          questions: []
        },
        {
          section_number: 6,
          section_title: "Ayat Mutasyabihat",
          questions: []
        },
        {
          section_number: 7,
          section_title: "Pengenalan Surat",
          questions: []
        },
        {
          section_number: 8,
          section_title: "Tebak Halaman",
          questions: []
        }
      ],
      import_instructions: `Template untuk Juz ${juzNumber}. Section 1 (Ketentuan Ikhtibar) sudah default dan tidak perlu di-import.`
    };

    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam_import_template_juz${juzNumber}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Template for Juz ${juzNumber} downloaded`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Import Questions</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mode Selector */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => {
                setMode('paste');
                setPreview(null);
                setSelectedFile(null);
              }}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                mode === 'paste'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4" />
                Paste from Google Form
              </div>
            </button>
            <button
              onClick={() => {
                setMode('json');
                setPreview(null);
                setPastedText('');
              }}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                mode === 'json'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileUp className="w-4 h-4" />
                Upload JSON
              </div>
            </button>
          </div>

          {/* Paste Mode */}
          {mode === 'paste' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900">
                      <strong>Section 1 (Ketentuan Ikhtibar)</strong> sudah default untuk SEMUA juz dan tidak perlu di-import.
                      Parser akan otomatis skip section ini.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-900 mb-2">Cara Mudah - Paste dari Google Form</h3>
                    <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                      <li>Buka Google Form yang berisi soal ujian</li>
                      <li>Copy semua soal (Ctrl+A, Ctrl+C)</li>
                      <li>Paste di kotak dibawah</li>
                      <li>Pilih Juz number</li>
                      <li>Klik "Parse & Preview" - AI akan otomatis konversi</li>
                      <li>Review hasil, lalu klik "Import"</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Juz Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Juz Number
                </label>
                <select
                  value={selectedJuz}
                  onChange={(e) => setSelectedJuz(parseInt(e.target.value) as JuzNumber)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={28}>Juz 28</option>
                  <option value={29}>Juz 29</option>
                  <option value={30}>Juz 30</option>
                </select>
              </div>

              {/* Paste Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Google Form Text Here
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste soal dari Google Form disini...&#10;&#10;Contoh format:&#10;1. Ketentuan Ikhtibar&#10;Bismillah saya siap...&#10;&#10;2. Tebak Nama Surat&#10;ٱلنَّجْمُ ٱلثَّاقِبُ&#10;Ayat ini terletak pada surat&#10;Ath-Thariq&#10;Al-Ghasiyah&#10;..."
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {pastedText.length} characters
                </p>
              </div>

              {/* Parse Button */}
              <button
                onClick={handleParsePaste}
                disabled={!pastedText.trim() || parsing}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {parsing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Parsing dengan AI...
                  </>
                ) : (
                  <>
                    <ClipboardPaste className="w-5 h-5" />
                    Parse & Preview
                  </>
                )}
              </button>
            </>
          )}

          {/* JSON Mode */}
          {mode === 'json' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900">
                      <strong>Section 1 (Ketentuan Ikhtibar)</strong> sudah default untuk SEMUA juz dan tidak perlu di-import.
                      Pastikan file JSON tidak mengandung section 1.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-2">Need a template?</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Download a template file to see the correct JSON format:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadTemplate(28)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Juz 28
                      </button>
                      <button
                        onClick={() => downloadTemplate(29)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Juz 29
                      </button>
                      <button
                        onClick={() => downloadTemplate(30)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Juz 30
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select JSON File
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
              >
                <FileUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  {selectedFile ? selectedFile.name : 'Click to select JSON file'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  JSON format with questions for Juz 28, 29, or 30
                </p>
              </button>
            </div>
          </div>
            </>
          )}

          {/* Preview - shown for both modes */}
          {preview && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-900 mb-2">Preview Summary</h3>
                    <div className="space-y-1 text-sm text-green-800">
                      <p><strong>Juz Number:</strong> {preview.juz_number}</p>
                      <p><strong>Total Sections:</strong> {preview.sections.length}</p>
                      <p><strong>Total Questions:</strong> {preview.sections.reduce((sum, s) => sum + s.questions.length, 0)}</p>
                      <div className="mt-2">
                        <p className="font-medium mb-1">Sections:</p>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                          {preview.sections.map((section, idx) => (
                            <li key={`${section.section_number}-${idx}`}>
                              Section {section.section_number}: {section.section_title} ({section.questions.length} questions)
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={() => setShowDetailedPreview(!showDetailedPreview)}
                        className="mt-3 text-sm text-green-700 hover:text-green-900 font-medium underline"
                      >
                        {showDetailedPreview ? 'Hide' : 'Show'} Detailed Preview (All Questions)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Preview */}
              {showDetailedPreview && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-gray-900 mb-4">Detailed Question Preview</h3>
                  {preview.sections.map((section, sIdx) => (
                    <div key={`detail-${section.section_number}-${sIdx}`} className="mb-6 last:mb-0">
                      <h4 className="font-medium text-gray-800 bg-gray-100 px-3 py-2 rounded mb-3">
                        Section {section.section_number}: {section.section_title} ({section.questions.length} questions)
                      </h4>
                      <div className="space-y-4 pl-4">
                        {section.questions.map((q: any, qIdx: number) => (
                          <div key={`q-${qIdx}`} className="border-l-2 border-blue-300 pl-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Question {q.question_number}:
                            </p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap mb-2">
                              {q.question_text.substring(0, 150)}
                              {q.question_text.length > 150 && '...'}
                            </p>
                            {q.options && q.options.length > 0 && (
                              <div className="text-xs text-gray-500 space-y-1">
                                {q.options.map((opt: any, optIdx: number) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <span className={opt.isCorrect ? 'text-green-600 font-medium' : ''}>
                                      {String.fromCharCode(65 + optIdx)}. {opt.text}
                                      {opt.isCorrect && ' ✓'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Options */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="replace-existing"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="replace-existing" className="flex-1 text-sm">
              <span className="font-medium text-gray-900">Replace existing questions</span>
              <p className="text-gray-600 mt-0.5">
                This will delete all existing questions for this juz before importing
              </p>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!preview || importing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Importing...
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4" />
                Import Questions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
