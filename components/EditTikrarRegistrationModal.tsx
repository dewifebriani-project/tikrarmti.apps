'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Loader2 } from 'lucide-react';

interface EditTikrarRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  registration: {
    id: string;
    chosen_juz: string;
    main_time_slot: string;
    backup_time_slot: string;
    full_name?: string;
    wa_phone?: string;
    address?: string;
    motivation?: string;
  };
}

const JUZ_OPTIONS = [
  { value: '30A', label: 'Juz 30A (halaman 1-20)' },
  { value: '30B', label: 'Juz 30B (halaman 21-40)' },
  { value: '28', label: 'Juz 28' },
  { value: '29', label: 'Juz 29' },
];

const TIME_SLOT_OPTIONS = [
  { value: 'pagi', label: 'Pagi (06:00 - 12:00)' },
  { value: 'siang', label: 'Siang (12:00 - 15:00)' },
  { value: 'sore', label: 'Sore (15:00 - 18:00)' },
  { value: 'malam', label: 'Malam (18:00 - 21:00)' },
];

export function EditTikrarRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  registration
}: EditTikrarRegistrationProps) {
  const [formData, setFormData] = useState({
    chosen_juz: registration.chosen_juz,
    main_time_slot: registration.main_time_slot,
    backup_time_slot: registration.backup_time_slot,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/pendaftaran/tikrar/${registration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal mengupdate pendaftaran');
      }

      toast.success('Pendaftaran berhasil diperbarui');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating registration:', error);
      toast.error(error.message || 'Gagal mengupdate pendaftaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">Edit Pendaftaran Tikrar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Card - Current Registration */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-2">Informasi Saat Ini</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Nama:</strong> {registration.full_name}</p>
              <p><strong>WhatsApp:</strong> {registration.wa_phone}</p>
              <p><strong>Alamat:</strong> {registration.address}</p>
            </div>
          </div>

          {/* Pilihan Juz */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilihan Juz *
            </label>
            <select
              value={formData.chosen_juz}
              onChange={(e) => setFormData({ ...formData, chosen_juz: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              {JUZ_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Pilihan juz dapat diubah hingga batas waktu yang ditentukan
            </p>
          </div>

          {/* Jadwal Utama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jadwal Utama *
            </label>
            <select
              value={formData.main_time_slot}
              onChange={(e) => setFormData({ ...formData, main_time_slot: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih jadwal utama</option>
              {TIME_SLOT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Jadwal Cadangan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jadwal Cadangan *
            </label>
            <select
              value={formData.backup_time_slot}
              onChange={(e) => setFormData({ ...formData, backup_time_slot: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih jadwal cadangan</option>
              {TIME_SLOT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Pilih jadwal yang berbeda dari jadwal utama
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Catatan:</strong> Perubahan pilihan juz dan jadwal hanya dapat dilakukan
              sebelum batas waktu yang ditentukan oleh admin. Setelah melewati batas waktu,
              perubahan memerlukan persetujuan admin.
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
