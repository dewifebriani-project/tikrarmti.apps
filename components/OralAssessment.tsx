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
  const [manualScore, setManualScore] = useState<number | null>(currentAssessment?.oral_total_score || null);
  const [useManualScore, setUseManualScore] = useState<boolean>(false);

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
    { key: 'makhraj' as const, label: 'Makhraj', shortLabel: 'Makhraj', description: 'Titik keluar huruf' },
    { key: 'sifat' as const, label: 'Sifat', shortLabel: 'Sifat', description: 'Sifat huruf' },
    { key: 'mad' as const, label: 'Mad', shortLabel: 'Mad', description: 'Panjang mad' },
    { key: 'ghunnah' as const, label: 'Ghunnah', shortLabel: 'Ghunnah', description: 'Dengung' },
    { key: 'harakat' as const, label: 'Harakat', shortLabel: 'Harakat', description: 'Tanda baca' },
  ];

  const calculatedScore = calculateScore();
  const finalScore = useManualScore ? (manualScore || 0) : calculatedScore;
  const isPassing = finalScore >= PASSING_SCORE;
  const assessmentStatus = finalScore >= PASSING_SCORE ? 'pass' : 'fail';

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
        oral_total_score: finalScore,
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
        <h4 className="font-semibold text-gray-900 mb-4">Penilaian Tajweed - Klik kategori yang salah</h4>

        {/* Compact Grid Layout - All categories visible at once */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {categories.map(category => (
            <div key={category.key} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                {/* Category Name */}
                <div className="flex-shrink-0 w-24">
                  <p className="text-sm font-semibold text-gray-900">{category.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                </div>

                {/* Error Count Buttons - Compact inline */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[0, 1, 2, 3, 4, 5].map((errorCount) => (
                    <button
                      key={errorCount}
                      type="button"
                      onClick={() => handleErrorChange(category.key, errorCount)}
                      disabled={readOnly}
                      className={`w-10 h-10 flex items-center justify-center border-2 rounded-md font-medium transition-all ${
                        errors[category.key] === errorCount
                          ? 'border-green-600 bg-green-600 text-white shadow-md'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-green-500 hover:bg-green-50'
                      } ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      {errorCount}
                    </button>
                  ))}
                  {errors[category.key] >= 5 && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded font-medium">
                      0 poin
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Score Display and Manual Override */}
        <div className="mt-6 space-y-4">
          {/* Calculated Score */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Nilai Otomatis (dari hitungan kesalahan)</p>
                <p className="text-2xl font-bold text-blue-900">{calculatedScore.toFixed(2)}</p>
              </div>
              {!useManualScore && (
                <div className="flex items-center gap-2">
                  {calculatedScore >= PASSING_SCORE ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Manual Override Option */}
          {!readOnly && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useManualScore}
                  onChange={(e) => {
                    setUseManualScore(e.target.checked);
                    if (!e.target.checked) {
                      setManualScore(null);
                    }
                  }}
                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-900">Atur Nilai Manual (Override)</p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    Centang untuk mengatur nilai final secara manual. Gunakan prerogatif ini untuk penyesuaian khusus.
                  </p>
                </div>
              </label>

              {useManualScore && (
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Nilai Final:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={manualScore || ''}
                    onChange={(e) => setManualScore(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md text-center font-bold focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <span className="text-xs text-gray-500">(0-100)</span>
                </div>
              )}
            </div>
          )}

          {/* Final Score Display */}
          <div className={`p-4 rounded-lg ${isPassing ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: isPassing ? '#065f46' : '#991b1b' }}>
                  Nilai Final {useManualScore && '(Manual Override)'}
                </p>
                <p className="text-3xl font-bold" style={{ color: isPassing ? '#047857' : '#dc2626' }}>
                  {finalScore.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isPassing ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-lg font-bold text-green-900">LULUS</p>
                      <p className="text-xs text-green-600">≥ {PASSING_SCORE}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-lg font-bold text-red-900">TIDAK LULUS</p>
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

      <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-900">
        <p className="font-semibold mb-1">Formula: 5 kategori × 20 poin | 1 kesalahan = -2 poin | ≥5 kesalahan = 0 poin | Lulus ≥{PASSING_SCORE}</p>
      </div>
    </div>
  );
}
