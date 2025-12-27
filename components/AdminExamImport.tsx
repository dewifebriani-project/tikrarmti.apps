'use client';

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FileUp, X, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { JuzNumber } from '@/types/exam';

interface AdminExamImportProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [preview, setPreview] = useState<ImportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!selectedFile || !preview) {
      toast.error('Please select a file first');
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
          section_number: 1,
          section_title: "Ketentuan Ikhtibar",
          questions: [
            {
              question_number: 1,
              question_text: "Bismillah saya siap dan paham semua ketentuan di atas",
              question_type: "introduction",
              options: [
                {
                  text: "Bismillah saya siap dan paham semua ketentuan di atas",
                  isCorrect: true
                }
              ],
              points: 0
            }
          ]
        },
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
        }
      ],
      import_instructions: `Template untuk Juz ${juzNumber}. Lengkapi semua soal sesuai format ini.`
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
          {/* Download Templates */}
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

          {/* Preview */}
          {preview && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-green-900 mb-2">File Preview</h3>
                  <div className="space-y-1 text-sm text-green-800">
                    <p><strong>Juz Number:</strong> {preview.juz_number}</p>
                    <p><strong>Total Sections:</strong> {preview.sections.length}</p>
                    <p><strong>Total Questions:</strong> {preview.sections.reduce((sum, s) => sum + s.questions.length, 0)}</p>
                    <div className="mt-2">
                      <p className="font-medium mb-1">Sections:</p>
                      <ul className="list-disc list-inside space-y-1 pl-2">
                        {preview.sections.map((section) => (
                          <li key={section.section_number}>
                            Section {section.section_number}: {section.section_title} ({section.questions.length} questions)
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
            disabled={!selectedFile || importing}
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
