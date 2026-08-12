'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, MessageCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Batch } from './types';

interface CommunicationLinks {
  whatsapp_group_link: string;
  group_reminder_link: string;
  group_diskusi_link: string;
}

export function AdminCommunicationTab({ batches }: { batches: Batch[] }) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [links, setLinks] = useState<CommunicationLinks>({
    whatsapp_group_link: '',
    group_reminder_link: '',
    group_diskusi_link: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (batches && batches.length > 0 && !selectedBatchId) {
      const activeBatch = batches.find(b => b.status === 'open' || b.status === 'ACTIVE');
      setSelectedBatchId(activeBatch ? activeBatch.id : batches[0].id);
    }
  }, [batches, selectedBatchId]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchLinks();
    }
  }, [selectedBatchId]);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/batch/${selectedBatchId}/communication-links`);
      const result = await res.json();
      if (res.ok && result.success) {
        setLinks({
          whatsapp_group_link: result.data?.whatsapp_group_link || '',
          group_reminder_link: result.data?.group_reminder_link || '',
          group_diskusi_link: result.data?.group_diskusi_link || ''
        });
      } else {
        toast.error(result.error || 'Gagal memuat link komunikasi');
      }
    } catch (error) {
      console.error('Error fetching communication links:', error);
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBatchId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/batch/${selectedBatchId}/communication-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(links)
      });
      const result = await res.json();
      
      if (res.ok && result.success) {
        toast.success(result.message || 'Berhasil menyimpan link komunikasi');
      } else {
        toast.error(result.error || 'Gagal menyimpan link komunikasi');
      }
    } catch (error) {
      console.error('Error saving communication links:', error);
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Batch Selector Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl">
            <MessageCircle className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Link Komunikasi Grup</h2>
            <p className="text-sm text-gray-500">Kelola link grup WhatsApp/Telegram untuk batch ini.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-gray-700"
            >
              {batches?.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} {batch.status === 'open' ? '(Active)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={fetchLinks}
            disabled={isLoading || !selectedBatchId}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Link Grup Informasi (Satu Arah)
                </label>
                <input
                  type="url"
                  value={links.whatsapp_group_link}
                  onChange={(e) => setLinks({...links, whatsapp_group_link: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Link Grup Diskusi (Terbuka)
                </label>
                <input
                  type="url"
                  value={links.group_diskusi_link}
                  onChange={(e) => setLinks({...links, group_diskusi_link: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Link Komunitas/Reminder Tambahan
                </label>
                <input
                  type="url"
                  value={links.group_reminder_link}
                  onChange={(e) => setLinks({...links, group_reminder_link: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !selectedBatchId}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
