'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatTimeShort } from '@/lib/reminder-generator';
import { toast } from 'react-hot-toast';
import { Loader2, Video, CheckCircle2, Copy } from 'lucide-react';

const DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

interface SitInModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  activeBatch: any;
  currentHalaqah?: any;
}

interface ZoomInfo {
  url?: string;
  meeting_id?: string;
  passcode?: string;
  name?: string;
}

export function SitInModal({ isOpen, onClose, user, activeBatch, currentHalaqah }: SitInModalProps) {
  const [availableHalaqahs, setAvailableHalaqahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [registeredZoom, setRegisteredZoom] = useState<Record<string, ZoomInfo>>({});
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

      const [halaqahsResponse, quotaResponse] = await Promise.all([
        supabase
          .from('halaqah')
          .select(`
            id, name, day_of_week, start_time, max_students,
            muallimah:users!halaqah_muallimah_id_fkey(full_name),
            program:programs!inner(id, batch_id, class_type),
            students:halaqah_students(status),
            mentors:halaqah_mentors(role, user:users!halaqah_mentors_mentor_id_fkey(full_name))
          `)
          .eq('program.batch_id', activeBatch.id)
          .eq('program.class_type', classType)
          .eq('status', 'active'),
        fetch(`/api/shared/halaqah-quota?batch_id=${activeBatch.id}`)
      ]);
      
      if (halaqahsResponse.error) throw halaqahsResponse.error;
      
      const quotaData = quotaResponse.ok ? await quotaResponse.json() : null;
      const quotaMap = new Map();
      if (quotaData && quotaData.success && quotaData.data?.halaqah) {
        quotaData.data.halaqah.forEach((q: any) => quotaMap.set(q.id, q.total_current_students));
      }
      
      // Filter out current halaqah and compute active students
      const filtered = (halaqahsResponse.data || []).filter((h: any) => {
        if (h.id === currentHalaqah?.id) return false;
        
        h.activeCount = quotaMap.has(h.id) 
          ? quotaMap.get(h.id) 
          : (h.students?.filter((s: any) => s.status === 'active').length || 0);
          
        return true;
      });
      
      // Sort by day and time
      filtered.sort((a: any, b: any) => {
        if (a.day_of_week !== b.day_of_week) return (a.day_of_week || 0) - (b.day_of_week || 0);
        return (a.start_time || '').localeCompare(b.start_time || '');
      });
      
      setAvailableHalaqahs(filtered);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil daftar kelas lain');
    } finally {
      setLoading(false);
    }
  }

  const handleRegisterSitIn = async (halaqahId: string) => {
    setRegisteringId(halaqahId);
    try {
      const response = await fetch('/api/alumni/sit-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: activeBatch.id,
          halaqah_id: halaqahId,
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal mendaftar Sit-In');

      toast.success('Berhasil mendaftar Sit-In!');
      setRegisteredZoom(prev => ({
        ...prev,
        [halaqahId]: result.data.zoom
      }));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Gagal mendaftar Sit-In');
    } finally {
      setRegisteringId(null);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link disalin ke clipboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl w-full rounded-[1.5rem] p-0 overflow-hidden bg-white max-h-[85vh] flex flex-col">
        <div className="p-6 pb-4 bg-indigo-50/50 border-b border-indigo-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 tracking-tight">Kuota & Sit-In Kelas Lain</DialogTitle>
            <DialogDescription className="text-sm font-medium text-gray-600 mt-2">
              Daftar Sit-In jika Anda berhalangan hadir di kelas utama dan ingin menumpang kelas di jadwal lain minggu ini.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : availableHalaqahs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm italic">
              Tidak ada jadwal kelas lain yang tersedia saat ini.
            </div>
          ) : (
            <div className="space-y-4">
              {availableHalaqahs.map((halaqah) => {
                const activeCount = halaqah.activeCount || 0;
                const isFull = activeCount >= (halaqah.max_students || 999);
                const zoomInfo = registeredZoom[halaqah.id];
                const validMentors = halaqah.mentors?.filter((m: any) => (m.role === 'raisah' || m.role === 'musyrifah') && m.user?.full_name !== halaqah.muallimah?.full_name) || [];

                return (
                  <div 
                    key={halaqah.id} 
                    className={`border p-5 rounded-xl transition-all bg-white shadow-sm ${
                      isFull ? 'border-gray-200 opacity-60' : 'border-indigo-100'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                            {DAYS[halaqah.day_of_week || 1]} • {formatTimeShort(halaqah.start_time)}
                          </div>
                          {isFull && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Penuh</span>
                          )}
                        </div>
                        <div className="font-bold text-gray-900 text-lg">{halaqah.name}</div>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                          <span className="font-medium text-gray-700">Ustadzah: {halaqah.muallimah?.full_name || 'Menunggu'}</span>
                          <span className="text-gray-300">•</span>
                          <span>Kuota: {activeCount} / {halaqah.max_students}</span>
                        </div>
                        {validMentors.length > 0 && (
                          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
                            {validMentors.map((m: any) => `${m.role === 'raisah' ? 'Raisah' : 'Musyrifah'}: ${m.user?.full_name}`).join(', ')}
                          </div>
                        )}
                      </div>
                      
                      <div className="shrink-0 w-full md:w-auto flex flex-col gap-2">
                        {zoomInfo ? (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm min-w-[240px]">
                            <div className="flex items-center gap-2 font-bold text-emerald-800 mb-2">
                              <CheckCircle2 className="w-4 h-4" /> Berhasil Daftar Sit-In
                            </div>
                            {zoomInfo.url && (
                              <div className="flex items-center gap-2 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                  onClick={() => window.open(zoomInfo.url, '_blank')}
                                >
                                  <Video className="w-4 h-4 mr-2" />
                                  Buka Zoom
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="px-3"
                                  onClick={() => handleCopyLink(zoomInfo.url!)}
                                  title="Copy Link"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            {(zoomInfo.meeting_id || zoomInfo.passcode) && (
                              <div className="mt-2 text-xs text-emerald-700 bg-emerald-100/50 p-2 rounded">
                                {zoomInfo.meeting_id && <div>Meeting ID: <span className="font-bold">{zoomInfo.meeting_id}</span></div>}
                                {zoomInfo.passcode && <div>Passcode: <span className="font-bold">{zoomInfo.passcode}</span></div>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Button 
                            onClick={() => handleRegisterSitIn(halaqah.id)} 
                            disabled={isFull || registeringId === halaqah.id}
                            className={`w-full rounded-xl font-bold ${
                              isFull 
                                ? 'bg-gray-100 text-gray-400' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                            }`}
                          >
                            {registeringId === halaqah.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            Daftar Sit-In
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
