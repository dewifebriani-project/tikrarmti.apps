'use client';

import { useState, useEffect } from 'react';
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

export function EditTikrarRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  registration
}: EditTikrarRegistrationProps) {
  const [juzOptions, setJuzOptions] = useState<JuzOption[]>([]);
  const [isLoadingJuz, setIsLoadingJuz] = useState(false);
  const [formData, setFormData] = useState({
    chosen_juz: registration.chosen_juz,
    main_time_slot: registration.main_time_slot,
    backup_time_slot: registration.backup_time_slot,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch juz options from database when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchJuzOptions();
      // Reset form data with current registration values
      setFormData({
        chosen_juz: registration.chosen_juz,
        main_time_slot: registration.main_time_slot,
        backup_time_slot: registration.backup_time_slot,
      });
    }
  }, [isOpen, registration]);

  const fetchJuzOptions = async () => {
    setIsLoadingJuz(true);
    try {
      const response = await fetch('/api/juz');
      const result = await response.json();

      if (response.ok) {
        setJuzOptions(result.data || []);
      } else {
        toast.error('Gagal memuat opsi juz');
      }
    } catch (error) {
      console.error('Error fetching juz options:', error);
      toast.error('Gagal memuat opsi juz');
    } finally {
      setIsLoadingJuz(false);
    }
  };

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

  if (!isOpen) return null;

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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pilihan juz yang akan dihafalkan <span className="text-red-500">*</span>
            </label>
            {isLoadingJuz ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              </div>
            ) : (
              <select
                value={formData.chosen_juz}
                onChange={(e) => setFormData({ ...formData, chosen_juz: e.target.value })}
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
            )}
          </div>

          {/* Jadwal Utama */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pilih waktu utama untuk jadwal setoran dengan pasangan
            </label>
            <select
              value={formData.main_time_slot}
              onChange={(e) => setFormData({ ...formData, main_time_slot: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih waktu utama</option>
              <option value="04-06">04.00 - 06.00 WIB/WITA/WIT</option>
              <option value="06-09">06.00 - 09.00 WIB/WITA/WIT</option>
              <option value="09-12">09.00 - 12.00 WIB/WITA/WIT</option>
              <option value="12-15">12.00 - 15.00 WIB/WITA/WIT</option>
              <option value="15-18">15.00 - 18.00 WIB/WITA/WIT</option>
              <option value="18-21">18.00 - 21.00 WIB/WITA/WIT</option>
              <option value="21-24">21.00 - 24.00 WIB/WITA/WIT</option>
            </select>
          </div>

          {/* Jadwal Cadangan */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pilih waktu cadangan untuk jadwal setoran dengan pasangan
            </label>
            <select
              value={formData.backup_time_slot}
              onChange={(e) => setFormData({ ...formData, backup_time_slot: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih waktu cadangan</option>
              <option value="04-06">04.00 - 06.00 WIB/WITA/WIT</option>
              <option value="06-09">06.00 - 09.00 WIB/WITA/WIT</option>
              <option value="09-12">09.00 - 12.00 WIB/WITA/WIT</option>
              <option value="12-15">12.00 - 15.00 WIB/WITA/WIT</option>
              <option value="15-18">15.00 - 18.00 WIB/WITA/WIT</option>
              <option value="18-21">18.00 - 21.00 WIB/WITA/WIT</option>
              <option value="21-24">21.00 - 24.00 WIB/WITA/WIT</option>
            </select>
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
