'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  X,
  Users,
  Loader2,
  Check,
  Search,
  BookOpen,
  UserPlus
} from 'lucide-react';

interface Thalibah {
  id: string;
  user_id: string;
  full_name: string;
  chosen_juz?: string;
  selection_status?: string;
  re_enrollment_completed?: boolean;
}

interface Halaqah {
  id: string;
  name: string;
  max_students?: number;
  available_slots?: number;
  is_full?: boolean;
  muallimah_name?: string;
}

interface AddThalibahModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  halaqah: Halaqah | null;
  batchId: string;
  halaqahType: 'ujian' | 'tashih' | 'both';
}

export function AddThalibahModal({
  isOpen,
  onClose,
  onSuccess,
  halaqah,
  batchId,
  halaqahType
}: AddThalibahModalProps) {
  const [eligibleThalibah, setEligibleThalibah] = useState<Thalibah[]>([]);
  const [selectedThalibahIds, setSelectedThalibahIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      loadEligibleThalibah();
    } else {
      setEligibleThalibah([]);
      setSelectedThalibahIds(new Set());
      setSearchQuery('');
    }
  }, [isOpen, batchId]);

  const loadEligibleThalibah = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (batchId && batchId !== 'all') {
        params.append('batch_id', batchId);
      }

      console.log('[AddThalibahModal] Loading eligible thalibah, batchId:', batchId);
      const response = await fetch(`/api/admin/daftar-ulang/halaqah/add-thalibah?${params.toString()}`);
      const result = await response.json();

      console.log('[AddThalibahModal] Response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load eligible thalibah');
      }

      // Ensure result.data is an array
      const thalibahData = result.data || [];
      console.log('[AddThalibahModal] Loaded', thalibahData.length, 'eligible thalibah');
      setEligibleThalibah(thalibahData);
    } catch (error: any) {
      console.error('[AddThalibahModal] Error loading eligible thalibah:', error);
      toast.error('Gagal memuat daftar thalibah: ' + error.message);
      setEligibleThalibah([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleThalibahSelection = (thalibahId: string) => {
    const newSelection = new Set(selectedThalibahIds);
    if (newSelection.has(thalibahId)) {
      newSelection.delete(thalibahId);
    } else {
      // Check capacity
      const availableSlots = halaqah?.available_slots ?? (halaqah?.max_students ?? 20);
      if (newSelection.size >= availableSlots) {
        toast.error(`Kuota halaqah penuh. Maksimal ${availableSlots} thalibah.`);
        return;
      }
      newSelection.add(thalibahId);
    }
    setSelectedThalibahIds(newSelection);
  };

  const handleSubmit = async () => {
    if (!halaqah) {
      toast.error('Halaqah tidak valid');
      return;
    }

    if (selectedThalibahIds.size === 0) {
      toast.error('Pilih minimal satu thalibah');
      return;
    }

    const thalibahIdsArray = Array.from(selectedThalibahIds);
    console.log('[AddThalibahModal] Adding thalibah:', {
      halaqahId: halaqah.id,
      halaqahName: halaqah.name,
      halaqahType,
      thalibahIds: thalibahIdsArray
    });

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/daftar-ulang/halaqah/add-thalibah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          halaqahId: halaqah.id,
          thalibahIds: thalibahIdsArray,
          halaqahType
        })
      });

      const result = await response.json();
      console.log('[AddThalibahModal] Add response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add thalibah');
      }

      // Show detailed results
      const { data } = result;
      if (data && data.success && data.success.length > 0) {
        toast.success(`Berhasil menambahkan ${data.success.length} thalibah ke ${halaqah.name}`);
      }
      if (data && data.failed && data.failed.length > 0) {
        // Show each failed reason
        data.failed.forEach((failed: any) => {
          const name = failed.name || failed.thalibah_id;
          toast.error(`${name}: ${failed.reason}`);
        });
        console.error('[AddThalibahModal] Failed:', data.failed);
      }

      // Only close if at least one success
      if (data && data.success && data.success.length > 0) {
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('[AddThalibahModal] Error adding thalibah:', error);
      toast.error('Gagal menambahkan thalibah: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredThalibah = eligibleThalibah.filter(t =>
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.chosen_juz && t.chosen_juz.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {halaqah?.name || 'Halaqah'}
            </h3>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              {halaqah?.muallimah_name && (
                <span>Ustadzah {halaqah.muallimah_name}</span>
              )}
              <span className={halaqah?.is_full ? 'text-red-600 font-medium' : 'text-green-600'}>
                Kuota: {selectedThalibahIds.size} / {halaqah?.max_students || 20}
                {halaqah?.is_full && ' (Penuh)'}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 border border-purple-200 text-purple-900">
                {halaqahType === 'both' ? 'Paket Lengkap' : halaqahType === 'ujian' ? 'Ujian' : 'Tashih'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau juz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> Menampilkan semua thalibah yang lolos seleksi (selection_status = 'selected')
              dan belum memiliki halaqah. Jika thalibah sudah berada di halaqah lain, mereka akan dipindahkan ke halaqah ini.
            </p>
          </div>

          {/* Thalibah List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : filteredThalibah.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'Tidak ada thalibah yang cocok dengan pencarian' : 'Tidak ada thalibah yang memenuhi syarat'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>Menampilkan {filteredThalibah.length} thalibah</span>
                <span>{selectedThalibahIds.size} dipilih</span>
              </div>

              {filteredThalibah.map((thalibah) => {
                const isSelected = selectedThalibahIds.has(thalibah.user_id);
                return (
                  <div
                    key={thalibah.id}
                    onClick={() => toggleThalibahSelection(thalibah.user_id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-green-50 border-green-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{thalibah.full_name}</p>
                        {thalibah.chosen_juz && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <BookOpen className="w-3 h-3" />
                            <span>Juz: {thalibah.chosen_juz}</span>
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-xs text-green-600 font-medium">Dipilih</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedThalibahIds.size === 0}
            className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menambahkan...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Tambah {selectedThalibahIds.size} Thalibah
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
