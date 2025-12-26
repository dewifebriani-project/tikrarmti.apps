'use client';

import { useState } from 'react';
import { Volume2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface OralAssessmentProps {
  registrationId: string;
  oralSubmissionUrl?: string | null;
  currentAssessment?: {
    oral_makhraj_errors?: number;
    oral_sifat_errors?: number;
    oral_mad_errors?: number;
    oral_ghunnah_errors?: number;
    oral_harakat_errors?: number;
    oral_total_score?: number;
    oral_assessment_status?: string;
    oral_assessment_notes?: string;
  };
  onSave?: (data: any) => void;
  readOnly?: boolean;
}

interface ErrorCounts {
  makhraj: number;
  sifat: number;
  mad: number;
  ghunnah: number;
  harakat: number;
}

const PASSING_SCORE = 70;
const MAX_ERRORS_PER_CATEGORY = 10;

export function OralAssessment({
  registrationId,
  oralSubmissionUrl,
  currentAssessment,
  onSave,
  readOnly = false
}: OralAssessmentProps) {
  const [errors, setErrors] = useState<ErrorCounts>({
    makhraj: currentAssessment?.oral_makhraj_errors || 0,
    sifat: currentAssessment?.oral_sifat_errors || 0,
    mad: currentAssessment?.oral_mad_errors || 0,
    ghunnah: currentAssessment?.oral_ghunnah_errors || 0,
    harakat: currentAssessment?.oral_harakat_errors || 0,
  });

  const [notes, setNotes] = useState(currentAssessment?.oral_assessment_notes || '');
  const [saving, setSaving] = useState(false);

  const calculateScore = (): number => {
    const categories = ['makhraj', 'sifat', 'mad', 'ghunnah', 'harakat'] as const;
    const pointsPerCategory = 20;
    const penaltyPerError = 2;

    const totalScore = categories.reduce((total, category) => {
      const categoryErrors = errors[category];
      if (categoryErrors >= MAX_ERRORS_PER_CATEGORY) {
        return total + 0;
      }
      const categoryScore = Math.max(0, pointsPerCategory - (categoryErrors * penaltyPerError));
      return total + categoryScore;
    }, 0);

    return Math.round(totalScore * 100) / 100;
  };

  const categories = [
    { key: 'makhraj' as const, label: 'Makhraj Huruf', description: 'Kebenaran titik keluar huruf' },
    { key: 'sifat' as const, label: 'Sifatul Huruf', description: 'Sifat-sifat huruf (jahr, hams, dll)' },
    { key: 'mad' as const, label: 'Mad', description: 'Panjang mad (mad thobii, wajib, dll)' },
    { key: 'ghunnah' as const, label: 'Ghunnah', description: 'Dengung pada huruf mim dan nun' },
    { key: 'harakat' as const, label: 'Harakat', description: 'Tanda baca (fathah, kasrah, dhommah)' },
  ];

  const score = calculateScore();
  const isPassing = score >= PASSING_SCORE;
  const assessmentStatus = score >= PASSING_SCORE ? 'pass' : 'fail';

  const handleErrorChange = (category: keyof ErrorCounts, value: number) => {
    setErrors(prev => ({
      ...prev,
      [category]: Math.max(0, Math.min(MAX_ERRORS_PER_CATEGORY, value))
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave({
        oral_makhraj_errors: errors.makhraj,
        oral_sifat_errors: errors.sifat,
        oral_mad_errors: errors.mad,
        oral_ghunnah_errors: errors.ghunnah,
        oral_harakat_errors: errors.harakat,
        oral_total_score: score,
        oral_assessment_status: assessmentStatus,
        oral_assessment_notes: notes,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!oralSubmissionUrl) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center gap-2 text-gray-600">
          <AlertCircle className="w-5 h-5" />
          <p>Rekaman oral belum disubmit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="w-5 h-5 text-green-700" />
          <h4 className="font-semibold text-green-900">Rekaman QS. Al-Fath 29</h4>
        </div>
        <audio
          src={oralSubmissionUrl}
          controls
          className="w-full"
          preload="auto"
        />
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Penilaian Tajweed</h4>

        <div className="space-y-6">
          {categories.map(category => (
            <div key={category.key} className="pb-4 border-b last:border-b-0">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900">
                  {category.label}
                </label>
                <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-gray-600 font-medium">Jumlah kesalahan:</span>
                <div className="flex items-center gap-3 flex-wrap">
                  {[0, 1, 2, 3, 4, 5].map((errorCount) => (
                    <label
                      key={errorCount}
                      className={`flex items-center justify-center min-w-[48px] px-3 py-2 border-2 rounded-lg cursor-pointer transition-all ${
                        errors[category.key] === errorCount
                          ? 'border-green-600 bg-green-50 text-green-900 font-semibold'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-green-400 hover:bg-green-50'
                      } ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`error-${category.key}`}
                        value={errorCount}
                        checked={errors[category.key] === errorCount}
                        onChange={() => handleErrorChange(category.key, errorCount)}
                        disabled={readOnly}
                        className="sr-only"
                      />
                      <span className="text-sm">{errorCount}</span>
                    </label>
                  ))}
                  {errors[category.key] >= MAX_ERRORS_PER_CATEGORY && (
                    <div className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium">
                      Kategori ini: 0 poin
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Nilai</p>
              <p className="text-3xl font-bold text-gray-900">{score.toFixed(2)}</p>
            </div>

            <div className="flex items-center gap-2">
              {isPassing ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">LULUS</p>
                    <p className="text-xs text-green-600">≥ {PASSING_SCORE}</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">TIDAK LULUS</p>
                    <p className="text-xs text-red-600">&#60; {PASSING_SCORE}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {!isPassing && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Himbauan:</strong> Peserta akan diminta mendaftar ulang pada batch berikutnya
                dan dihimbau untuk mengikuti Kelas Tashih Umum untuk memperbaiki bacaan.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Catatan Penilaian (Opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={readOnly}
            rows={3}
            placeholder="Tambahkan catatan untuk peserta..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
          />
        </div>

        {!readOnly && onSave && (
          <div className="mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Menyimpan...' : 'Simpan Penilaian'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
        <p className="font-semibold mb-2">Formula Penilaian:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Setiap kategori bernilai 20 poin (Total: 100 poin)</li>
          <li>Setiap kesalahan mengurangi 2 poin dari kategori tersebut</li>
          <li>Maksimal 10 kesalahan per kategori (jika ≥10, kategori = 0 poin)</li>
          <li>Nilai kelulusan: ≥ {PASSING_SCORE}</li>
        </ul>
      </div>
    </div>
  );
}
