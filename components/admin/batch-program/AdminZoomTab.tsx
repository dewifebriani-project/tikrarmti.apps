'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Plus, Trash2, Video, Info, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Batch } from './types';

interface ZoomLink {
  id?: string;
  name: string;
  url: string;
  meeting_id?: string;
  passcode?: string;
  claim_host?: string;
}

export function AdminZoomTab({ batches }: { batches: Batch[] }) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [zoomList, setZoomList] = useState<ZoomLink[]>([]);
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
      fetchZoomData();
    }
  }, [selectedBatchId]);

  const fetchZoomData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/batch/${selectedBatchId}/zoom-links`);
      const result = await res.json();
      if (res.ok && result.success) {
        setZoomList(result.data || []);
      } else {
        toast.error(result.error || 'Gagal memuat data zoom');
      }
    } catch (error) {
      console.error('Error fetching batch zoom:', error);
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = () => {
    setZoomList([...zoomList, { name: '', url: '', meeting_id: '', passcode: '', claim_host: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    const newList = [...zoomList];
    newList.splice(index, 1);
    setZoomList(newList);
  };

  const handleChange = (index: number, field: keyof ZoomLink, value: string) => {
    const newList = [...zoomList];
    newList[index] = { ...newList[index], [field]: value };
    setZoomList(newList);
  };

  const handleSave = async () => {
    if (!selectedBatchId) return;
    
    if (zoomList.some(z => !z.name.trim() || !z.url.trim())) {
      toast.error('Nama dan URL tidak boleh kosong');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/batch/${selectedBatchId}/zoom-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoom_links: zoomList })
      });
      const result = await res.json();
      
      if (res.ok && result.success) {
        toast.success(result.message || 'Berhasil menyimpan master zoom');
        fetchZoomData();
      } else {
        toast.error(result.error || 'Gagal menyimpan pengaturan zoom');
      }
    } catch (error) {
      console.error('Error saving batch zoom:', error);
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
          <div className="bg-purple-100 p-2.5 rounded-xl">
            <Video className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Master Data Zoom</h2>
            <p className="text-sm text-gray-500">Kelola daftar Room Zoom yang tersedia untuk Halaqah pada batch ini.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium text-gray-700"
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
            onClick={fetchZoomData}
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
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800">Daftar Link Zoom</h3>
          <button
            onClick={handleAddRow}
            disabled={!selectedBatchId}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Tambah Room
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-purple-700 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Nama Room (mis: Room 1)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        URL Zoom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Meeting ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Passcode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Claim Host
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {zoomList.map((zoom, index) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={zoom.name}
                            onChange={(e) => handleChange(index, 'name', e.target.value)}
                            placeholder="Contoh: Room 1"
                            className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-400"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={zoom.url}
                            onChange={(e) => handleChange(index, 'url', e.target.value)}
                            placeholder="https://zoom.us/j/..."
                            className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm text-gray-600 placeholder:text-gray-400"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={zoom.meeting_id || ''}
                            onChange={(e) => handleChange(index, 'meeting_id', e.target.value)}
                            placeholder="xxx xxx xxxx"
                            className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm text-gray-600 placeholder:text-gray-400"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={zoom.passcode || ''}
                            onChange={(e) => handleChange(index, 'passcode', e.target.value)}
                            placeholder="passcode"
                            className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm text-gray-600 placeholder:text-gray-400"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={zoom.claim_host || ''}
                            onChange={(e) => handleChange(index, 'claim_host', e.target.value)}
                            placeholder="claim host"
                            className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm text-gray-600 placeholder:text-gray-400"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleRemoveRow(index)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {zoomList.length === 0 && selectedBatchId && (
              <div className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <Video className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                Belum ada master link zoom.<br />Klik "Tambah Room" untuk mulai menambahkan.
              </div>
            )}

            {zoomList.length > 0 && (
              <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
