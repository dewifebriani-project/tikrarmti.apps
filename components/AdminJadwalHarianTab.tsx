'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Calendar, Clock, Users, BookOpen, Video, Copy, ChevronDown, CheckCircle2
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
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay() === 0 ? 7 : new Date().getDay());
  const [halaqahs, setHalaqahs] = useState<HalaqahForReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBatchName, setActiveBatchName] = useState<string>('');
  
  const supabase = createClient();

  useEffect(() => {
    fetchSchedule();
  }, [activeDay]);

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
          zoom:batch_zoom_links!halaqah_zoom_link_id_fkey(name, url),
          muallimah:users!halaqah_muallimah_id_fkey(full_name),
          program:programs!inner(class_type, batch_id, batch:batches(name)),
          students:halaqah_students(status, thalibah:users!halaqah_students_thalibah_id_fkey(full_name))
        `)
        .eq('program.batch_id', batch.id)
        .eq('day_of_week', activeDay)
        .eq('status', 'active')
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Map to HalaqahForReminder format
      const formattedData: HalaqahForReminder[] = (halaqahData || []).map((h: any) => ({
        ...h,
        zoom_name: h.zoom?.name || '',
        zoom_link: h.zoom?.url || h.zoom_link || '',
        zoom_meeting_id: '',
        zoom_passcode: '',
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
            Menampilkan kelas aktif untuk batch {activeBatchName || '...'}
          </p>
        </div>
        
        <button
          onClick={handleCopyRekapan}
          disabled={isLoading || halaqahs.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-amber-500/20"
        >
          <Copy className="h-4 w-4" />
          Copy Rekapan Harian
        </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {halaqahs.map((halaqah, idx) => {
            const dateForTemplate = getNextDateForDay(activeDay);
            
            return (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/40 transition-all group">
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        {halaqah.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                          {halaqah.class_type?.replace(/_/g, ' ').toUpperCase() || 'TIKRAR'}
                        </span>
                        {halaqah.preferred_juz && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                            Juz {halaqah.preferred_juz}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Class Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-gray-50 text-gray-500">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatTimeShort(halaqah.start_time)} - {formatTimeShort(halaqah.end_time)} WIB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-gray-50 text-gray-500">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mu'allimah</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {halaqah.muallimah?.full_name || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-gray-50 text-gray-500">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Thalibah</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {halaqah.students?.length || 0} Santri Aktif
                        </p>
                      </div>
                    </div>

                    {halaqah.zoom_link && (
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-500">
                          <Video className="h-4 w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Zoom Room</p>
                          <p className="text-sm font-semibold text-blue-600 truncate">
                            {halaqah.zoom_name || 'Link Tersedia'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => copyToClipboard(generateHalaqahReminder(halaqah, dateForTemplate), 'Reminder Kelas berhasil disalin!')}
                      className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Reminder
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => copyToClipboard(generateTagThalibah(halaqah, dateForTemplate), 'Tag Thalibah berhasil disalin!')}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Tag
                      </button>
                      <button
                        onClick={() => copyToClipboard(generateLaporanKelas(halaqah, dateForTemplate), 'Laporan Kelas berhasil disalin!')}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Laporan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
