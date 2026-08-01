import { useState, useEffect } from 'react';
import { X, Save, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Batch } from './types';

interface BatchJuzModalProps {
  batch: Batch;
  isOpen: boolean;
  onClose: () => void;
}

interface JuzOption {
  id: string;
  code: string;
  name: string;
  is_mapped_to_batch: boolean;
}

export function BatchJuzModal({ batch, isOpen, onClose }: BatchJuzModalProps) {
  const [juzList, setJuzList] = useState<JuzOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchJuzData();
    }
  }, [isOpen, batch.id]);

  const fetchJuzData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/batch/${batch.id}/juz`);
      const result = await res.json();
      if (res.ok && result.success) {
        setJuzList(result.data);
      } else {
        toast.error(result.error || 'Gagal memuat data juz');
      }
    } catch (error) {
      console.error('Error fetching batch juz:', error);
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (code: string) => {
    setJuzList(prev => prev.map(j => 
      j.code === code ? { ...j, is_mapped_to_batch: !j.is_mapped_to_batch } : j
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeCodes = juzList.filter(j => j.is_mapped_to_batch).map(j => j.code);
      const res = await fetch(`/api/admin/batch/${batch.id}/juz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ juz_codes: activeCodes })
      });
      const result = await res.json();
      
      if (res.ok && result.success) {
        toast.success(result.message || 'Berhasil menyimpan pengaturan juz untuk batch ini');
        onClose();
      } else {
        toast.error(result.error || 'Gagal menyimpan pengaturan juz');
      }
    } catch (error) {
      console.error('Error saving batch juz:', error);
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 p-6 flex items-center justify-between text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold">Pengaturan Juz Batch</h2>
            <p className="text-emerald-100 text-sm mt-1">{batch.name}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-gray-500 mb-4">
            Pilih juz apa saja yang dibuka atau tersedia untuk pendaftaran pada batch ini.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {juzList.map(juz => (
                <label 
                  key={juz.id} 
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    juz.is_mapped_to_batch 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    juz.is_mapped_to_batch 
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {juz.is_mapped_to_batch && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${juz.is_mapped_to_batch ? 'text-emerald-900' : 'text-gray-700'}`}>
                      {juz.name}
                    </p>
                  </div>
                  {/* Hidden input for accessibility if needed, or just handle onClick */}
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={juz.is_mapped_to_batch}
                    onChange={() => handleToggle(juz.code)}
                  />
                </label>
              ))}
              {juzList.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Belum ada master data Juz. Silakan tambahkan di tab "Pengaturan Pilihan Juz".
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-bold text-gray-700 transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isLoading}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white text-sm font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  );
}
