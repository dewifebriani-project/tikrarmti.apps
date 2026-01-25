'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ReEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrationId: string;
  batchName: string;
  onSuccess?: () => void;
}

export function ReEnrollmentModal({
  isOpen,
  onClose,
  registrationId,
  batchName,
  onSuccess
}: ReEnrollmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) {
      toast.error('Silakan setujui komitmen akad untuk melanjutkan');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/pendaftaran/tikrar/re-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Daftar ulang berhasil!');
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || 'Gagal melakukan daftar ulang');
      }
    } catch (error) {
      console.error('Error re-enrolling:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Konfirmasi Daftar Ulang</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              disabled={isSubmitting}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Success Message */}
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Selamat! Anda Lulus Seleksi</h3>
              <p className="text-sm text-green-700 mt-1">
                Alhamdulillah, Anda telah dinyatakan lulus seleksi Program Tikrar Tahfidz {batchName}.
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Langkah Selanjutnya</h3>
              <p className="text-sm text-blue-700 mt-1">
                Silakan konfirmasi daftar ulang untuk mengunci posisi Anda dan memulai perjalanan menghafal Al-Qur'an.
              </p>
            </div>
          </div>

          {/* Commitment Agreement */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">Komitmen Akad</h3>
            <p className="text-sm text-gray-700 mb-3">
              Dengan menyetujui daftar ulang, saya berkomitmen untuk:
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Menghafal Al-Qur'an dengan ikhlas karena Allah SWT</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Mengikuti kelas dan tashih secara rutin</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Mempertahankan target hafalan minimal sesuai kurikulum</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Menghormati aturan dan nilai-nilai MTI Tikrar Indonesia</span>
              </li>
            </ul>
          </div>

          {/* Checkbox Agreement */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">
              Saya menyetujui komitmen akad di atas dan siap memulai perjalanan menghafal Al-Qur'an
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!agreed || isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Konfirmasi Daftar Ulang
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
