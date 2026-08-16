'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatTimeShort } from '@/lib/reminder-generator';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

interface TransferScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  activeBatch: any;
  currentHalaqah?: any;
  onSuccess?: () => void;
}

export function TransferScheduleModal({ isOpen, onClose, user, activeBatch, currentHalaqah, onSuccess }: TransferScheduleModalProps) {
  const [availableHalaqahs, setAvailableHalaqahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && activeBatch?.id) {
      fetchAvailableHalaqahs();
    }
  }, [isOpen, activeBatch?.id]);

  async function fetchAvailableHalaqahs() {
    setLoading(true);
    try {
      // Find the program type the user is in. We can derive from currentHalaqah
      const classType = currentHalaqah?.program?.class_type || 'tikrar_tahfidz';

      const { data, error } = await supabase
        .from('halaqah')
        .select(`
          id, name, day_of_week, start_time, max_students,
          muallimah:users!halaqah_muallimah_id_fkey(full_name),
          program:programs!inner(id, batch_id, class_type),
          students:halaqah_students(status)
        `)
        .eq('program.batch_id', activeBatch.id)
        .eq('program.class_type', classType)
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Filter out current halaqah and full halaqahs
      const filtered = (data || []).filter((h: any) => {
        if (h.id === currentHalaqah?.id) return false;
        const activeStudents = h.students?.filter((s: any) => s.status === 'active').length || 0;
        return activeStudents < (h.max_students || 999);
      });
      
      // Sort by day and time
      filtered.sort((a: any, b: any) => {
        if (a.day_of_week !== b.day_of_week) return (a.day_of_week || 0) - (b.day_of_week || 0);
        return (a.start_time || '').localeCompare(b.start_time || '');
      });
      
      setAvailableHalaqahs(filtered);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil jadwal tersedia');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!selectedHalaqahId) return;
    setSubmitting(true);
    try {
      const selectedHalaqah = availableHalaqahs.find(h => h.id === selectedHalaqahId);
      if (!selectedHalaqah) throw new Error('Halaqah not found');

      const response = await fetch('/api/alumni/mutasi-jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: activeBatch.id,
          program_id: selectedHalaqah.program.id,
          from_halaqah_id: currentHalaqah?.id || null,
          to_halaqah_id: selectedHalaqahId,
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal mengajukan perpindahan');

      toast.success('Pengajuan pindah jadwal berhasil dikirim. Menunggu persetujuan Admin.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Gagal mengajukan perpindahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-full rounded-[1.5rem] p-0 overflow-hidden bg-white max-h-[85vh] flex flex-col">
        <div className="p-6 pb-4 bg-orange-50/50 border-b border-orange-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 tracking-tight">Pindah Jadwal Halaqah</DialogTitle>
            <DialogDescription className="text-sm font-medium text-gray-600 mt-2">
              Pilih jadwal baru yang tersedia. Pengajuan Anda akan direview oleh Admin. Pasangan tidak akan berubah.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : availableHalaqahs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm italic">
              Tidak ada jadwal dengan kuota tersedia saat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {availableHalaqahs.map((halaqah) => {
                const activeCount = halaqah.students?.filter((s: any) => s.status === 'active').length || 0;
                const isSelected = selectedHalaqahId === halaqah.id;
                return (
                  <div 
                    key={halaqah.id} 
                    onClick={() => setSelectedHalaqahId(halaqah.id)}
                    className={`border p-4 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-50/30 ring-1 ring-orange-500 shadow-sm' 
                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
                          {DAYS[halaqah.day_of_week || 1]} • {formatTimeShort(halaqah.start_time)}
                        </div>
                        <div className="font-bold text-gray-900">{halaqah.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {halaqah.muallimah?.full_name || 'Menunggu Muallimah'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sisa Kuota</div>
                        <div className="text-sm font-black text-gray-900">{halaqah.max_students - activeCount}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 pt-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="rounded-xl font-bold">
            Batal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedHalaqahId || submitting}
            className="rounded-xl font-bold bg-orange-600 hover:bg-orange-700 text-white"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Ajukan Pindah
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
