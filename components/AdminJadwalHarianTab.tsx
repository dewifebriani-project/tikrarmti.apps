'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isStaff } from '@/lib/roles';
import { 
  Calendar, Clock, Users, BookOpen, Video, Copy, ChevronDown, CheckCircle2, Tag, FileText, Download, Image as ImageIcon
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { 
  generateHalaqahReminder, 
  generateDailyReminder, 
  generateTagThalibah, 
  generateLaporanKelas,
  getDayName,
  formatTimeShort,
  HalaqahForReminder
} from '@/lib/reminder-generator';
import { toPng } from 'html-to-image';
import { JadwalPoster } from './JadwalPoster';

const DAYS = [
  { id: 1, name: 'Senin' },
  { id: 2, name: 'Selasa' },
  { id: 3, name: 'Rabu' },
  { id: 4, name: 'Kamis' },
  { id: 5, name: 'Jumat' },
  { id: 6, name: 'Sabtu' },
  { id: 7, name: 'Ahad' }
];

export default function AdminJadwalHarianTab() {
  const { user } = useAuth();
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay() === 0 ? 7 : new Date().getDay());
  const [halaqahs, setHalaqahs] = useState<HalaqahForReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBatchName, setActiveBatchName] = useState<string>('');
  
  const supabase = createClient();
  const userRoles = (user as any)?.primaryRole ? [(user as any).primaryRole] : (user?.roles || []);
  const isUserStaff = isStaff(userRoles);

  useEffect(() => {
    if (user) {
      fetchSchedule();
    }
  }, [activeDay, user]);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      // 1. Get active batch
      const { data: batch } = await supabase
        .from('batches')
        .select('id, name')
        .eq('status', 'open')
        .single();

      if (!batch) {
        setIsLoading(false);
        return;
      }
      
      setActiveBatchName(batch.name);

      // 2. Get halaqahs for this batch and day
      const { data: halaqahData, error } = await supabase
        .from('halaqah')
        .select(`
          id,
          name,
          day_of_week,
          start_time,
          end_time,
          preferred_juz,
          zoom_link,
          muallimah_id,
          zoom:batch_zoom_links!halaqah_zoom_link_id_fkey(name, url, meeting_id, passcode, claim_host),
          muallimah:users!halaqah_muallimah_id_fkey(full_name),
          program:programs!inner(class_type, batch_id, batch:batches(name)),
          students:halaqah_students(status, thalibah_id, thalibah:users!halaqah_students_thalibah_id_fkey(full_name))
        `)
        .eq('program.batch_id', batch.id)
        .eq('day_of_week', activeDay)
        .eq('status', 'active')
        .order('start_time', { ascending: true });

      if (error) throw error;

      let filteredData = halaqahData || [];
      if (!isUserStaff) {
        filteredData = filteredData.filter((h: any) => 
          h.muallimah_id === user?.id || 
          (h.students || []).some((s: any) => s.thalibah_id === user?.id && s.status === 'active')
        );
      }

      // Map to HalaqahForReminder format
      const formattedData: HalaqahForReminder[] = filteredData.map((h: any) => ({
        ...h,
        class_type: h.program?.class_type,
        zoom_name: h.zoom?.name || '',
        zoom_link: h.zoom?.url || h.zoom_link || '',
        zoom_meeting_id: h.zoom?.meeting_id || '',
        zoom_passcode: h.zoom?.passcode || '',
        zoom_claim_host: h.zoom?.claim_host || '',
        muallimah: {
          full_name: h.muallimah?.full_name
        },
        program: {
          class_type: h.program?.class_type,
          batch: {
            name: h.program?.batch?.name
          }
        },
        // Only active students
        students: (h.students || [])
          .filter((s: any) => s.status === 'active')
          .map((s: any) => ({
            full_name: s.thalibah?.full_name,
            preferred_juz: h.preferred_juz // Fallback to halaqah juz if student-specific juz isn't joined
          }))
      }));

      setHalaqahs(formattedData);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      toast.error('Gagal memuat jadwal harian');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch (err) {
      toast.error('Gagal menyalin teks. Silakan coba lagi.');
    }
  };

  const handleCopyRekapan = () => {
    const text = generateDailyReminder(activeBatchName, halaqahs, getNextDateForDay(activeDay));
    copyToClipboard(text, 'Rekapan Harian berhasil disalin!');
  };

  // Helper to get the actual Date object for the selected day of the week
  const getNextDateForDay = (dayOfWeek: number): Date => {
    const date = new Date();
    const currentDay = date.getDay() === 0 ? 7 : date.getDay();
    const distance = (dayOfWeek + 7 - currentDay) % 7;
    date.setDate(date.getDate() + distance);
    return date;
  };

  const posterRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPoster = async () => {
    if (!posterRef.current || halaqahs.length === 0) return;
    
    setIsGenerating(true);
    const dayName = DAYS.find(d => d.id === activeDay)?.name || '';
    
    try {
      toast.loading('Menyiapkan gambar poster...', { id: 'poster-gen' });
      
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Higher quality
        style: {
          transform: 'none', // Prevent layout shifts during capture
        },
      });
      
      const link = document.createElement('a');
      link.download = `Jadwal-Halaqah-${dayName}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Poster berhasil di-download!', { id: 'poster-gen' });
    } catch (err) {
      console.error('Error generating poster:', err);
      toast.error('Gagal men-generate poster. Silakan coba lagi.', { id: 'poster-gen' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Day Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              className={`flex-1 min-w-[80px] py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeDay === day.id
                  ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {day.name}
            </button>
          ))}
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Jadwal Kelas: {DAYS.find(d => d.id === activeDay)?.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isUserStaff 
              ? `Menampilkan kelas aktif untuk batch ${activeBatchName || '...'}`
              : `Menampilkan jadwal kelas Anda untuk batch ${activeBatchName || '...'}`
            }
          </p>
        </div>
        
        {isUserStaff && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadPoster}
              disabled={isLoading || halaqahs.length === 0 || isGenerating}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-emerald-500/20 w-full sm:w-auto"
            >
              {isGenerating ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              Download Poster
            </button>
            <button
              onClick={handleCopyRekapan}
              disabled={isLoading || halaqahs.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-amber-500/20 w-full sm:w-auto"
            >
              <Copy className="h-4 w-4" />
              Copy Rekapan Harian
            </button>
          </div>
        )}
      </div>

      {/* Hidden Poster Template for html-to-image */}
      <div className="absolute left-[-9999px] top-0 overflow-hidden opacity-0 pointer-events-none">
        <JadwalPoster 
          ref={posterRef} 
          halaqahs={halaqahs} 
          dayName={DAYS.find(d => d.id === activeDay)?.name || ''} 
          dayNum={activeDay}
        />
      </div>

      {/* Schedule Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 h-64 animate-pulse border border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : halaqahs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Tidak Ada Jadwal</h3>
          <p className="text-gray-500 mt-1">Belum ada kelas halaqah aktif di hari ini.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6 whitespace-nowrap">WAKTU</th>
                  <th className="py-4 px-6">KELAS</th>
                  <th className="py-4 px-6">MU'ALLIMAH</th>
                  <th className="py-4 px-6 text-center">SANTRI AKTIF</th>
                  {isUserStaff && <th className="py-4 px-6 text-center">AKSI</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {halaqahs.map((halaqah) => {
                  const dateForTemplate = getNextDateForDay(activeDay);
                  return (
                    <tr key={halaqah.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-gray-900 font-medium">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {formatTimeShort(halaqah.start_time)} - {formatTimeShort(halaqah.end_time)} WIB
                          </div>
                          {halaqah.zoom_name && (
                            <div className="flex flex-col gap-0.5 mt-1">
                              <a 
                                href={halaqah.zoom_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline w-fit"
                                title="Klik untuk bergabung ke Zoom"
                              >
                                <Video className="h-3.5 w-3.5" />
                                {halaqah.zoom_name}
                              </a>
                              {halaqah.zoom_meeting_id && (
                                <div className="text-[11px] text-gray-500 pl-5 leading-tight">
                                  ID: <span className="font-medium text-gray-700">{halaqah.zoom_meeting_id}</span>
                                  {halaqah.zoom_passcode && (
                                    <> | Pass: <span className="font-medium text-gray-700">{halaqah.zoom_passcode}</span></>
                                  )}
                                </div>
                              )}
                              {halaqah.zoom_claim_host && isUserStaff && (
                                <div className="text-[11px] text-gray-500 font-medium pl-5">
                                  Claim Host: <span className="font-bold text-gray-700">{halaqah.zoom_claim_host}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900 mb-1 leading-tight">{halaqah.name}</div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            halaqah.class_type === 'pra_tahfidz' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {halaqah.class_type === 'pra_tahfidz' ? 'PRA TIKRAR' : 'TIKRAR TAHFIDZ'}
                          </span>
                          {halaqah.preferred_juz && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                              Juz {halaqah.preferred_juz}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{halaqah.muallimah?.full_name || '-'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {halaqah.students?.length || 0}
                          </span>
                        </div>
                      </td>
                      {isUserStaff && (
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            <button
                              onClick={() => copyToClipboard(generateHalaqahReminder(halaqah, dateForTemplate), 'Reminder Kelas berhasil disalin!')}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100 w-full"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Reminder
                            </button>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => copyToClipboard(generateTagThalibah(halaqah, dateForTemplate), 'Tag Thalibah berhasil disalin!')}
                                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                              >
                                <Tag className="h-3 w-3" />
                                Tag
                              </button>
                              <button
                                onClick={() => copyToClipboard(generateLaporanKelas(halaqah, dateForTemplate), 'Berita Acara berhasil disalin!')}
                                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                              >
                                <FileText className="h-3 w-3" />
                                Berita Acara
                              </button>
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
