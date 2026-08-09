'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Video, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTimeShort } from '@/lib/reminder-generator';

const DAYS = [
  'Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'
];

export function UserJadwalHarian({ user, activeBatch, daftarUlangData }: { user: any, activeBatch: any, daftarUlangData?: any }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSchedules() {
      if (!user?.id || !activeBatch?.id) {
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch user's active halaqahs
        const { data: userHalaqahs } = await supabase.from('halaqah_students')
          .select(`
            halaqah (
              id, name, day_of_week, start_time, end_time, zoom_link, location,
              zoom:batch_zoom_links!halaqah_zoom_link_id_fkey(name, url, meeting_id, passcode),
              muallimah:users!halaqah_muallimah_id_fkey(full_name),
              program:programs!inner(batch_id, class_type)
            )
          `)
          .eq('thalibah_id', user.id)
          .eq('status', 'active');

        let myHalaqahs = (userHalaqahs || [])
          .map((hs: any) => hs.halaqah)
          .filter((h: any) => h && h.program?.batch_id === activeBatch.id);

        if (daftarUlangData) {
          const ujianHalaqah = daftarUlangData.ujian_halaqah;
          const tashihHalaqah = daftarUlangData.tashih_halaqah;
          
          if (ujianHalaqah && !myHalaqahs.find((h: any) => h.id === ujianHalaqah.id)) {
            myHalaqahs.push({
               ...ujianHalaqah,
               program: { class_type: 'tahfidz', batch_id: activeBatch.id }
            });
          }
          if (tashihHalaqah && !myHalaqahs.find((h: any) => h.id === tashihHalaqah.id)) {
            myHalaqahs.push({
               ...tashihHalaqah,
               program: { class_type: 'tahfidz', batch_id: activeBatch.id }
            });
          }
        }

        // 2. Fetch Pra-Tikrar halaqahs for this batch
        const { data: praTikrarData } = await supabase.from('halaqah')
          .select(`
            id, name, day_of_week, start_time, end_time, zoom_link, location,
            zoom:batch_zoom_links!halaqah_zoom_link_id_fkey(name, url, meeting_id, passcode),
            muallimah:users!halaqah_muallimah_id_fkey(full_name),
            program:programs!inner(batch_id, class_type)
          `)
          .eq('program.batch_id', activeBatch.id)
          .eq('program.class_type', 'pra_tahfidz')
          .eq('status', 'active');
          
        const praTikrarHalaqahs = praTikrarData || [];

        // 3. Merge and remove duplicates (in case user is enrolled in Pra Tikrar halaqah specifically)
        const combined = [...myHalaqahs];
        for (const pt of praTikrarHalaqahs) {
          if (!combined.find(h => h.id === pt.id)) {
            combined.push(pt);
          }
        }
        
        // Sort by day (relative to today) and then time
        const todayDayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();
        
        combined.sort((a, b) => {
          const aDay = a.day_of_week || 1;
          const bDay = b.day_of_week || 1;
          
          // Calculate distance from today (0 = today, 1 = tomorrow, ..., 6 = yesterday)
          const aDist = (aDay - todayDayOfWeek + 7) % 7;
          const bDist = (bDay - todayDayOfWeek + 7) % 7;
          
          if (aDist !== bDist) return aDist - bDist;
          return (a.start_time || '').localeCompare(b.start_time || '');
        });

        setSchedules(combined);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSchedules();
  }, [user?.id, activeBatch?.id]);

  if (loading || schedules.length === 0) return null;

  const displayedSchedules = expanded ? schedules : schedules.slice(0, 1);

  return (
    <div className="mb-8 mt-2 max-w-6xl mx-auto w-full px-4 md:px-8">
      <div className="flex items-center gap-3 mb-4 pl-1">
        <div className="bg-emerald-100/80 p-2.5 rounded-xl border border-emerald-200/50">
          <Calendar className="w-5 h-5 text-emerald-700" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Jadwal Kelas</h3>
          <p className="text-xs text-gray-500 font-medium">Jadwal Tikrar dan Pra-Tikrar</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3.5">
        {displayedSchedules.map((schedule) => (
          <Card key={schedule.id} className="border-none shadow-md shadow-gray-200/40 overflow-hidden rounded-[1.25rem] transition-shadow">
            <div className={`h-1.5 w-full ${schedule.program?.class_type === 'pra_tahfidz' ? 'bg-fuchsia-500' : 'bg-emerald-500'}`}></div>
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-white">
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 text-center min-w-[70px] border ${
                  schedule.program?.class_type === 'pra_tahfidz' ? 'bg-fuchsia-50 border-fuchsia-100' : 'bg-emerald-50 border-emerald-100'
                }`}>
                  <div className={`text-[11px] font-bold uppercase mb-0.5 tracking-wider ${
                    schedule.program?.class_type === 'pra_tahfidz' ? 'text-fuchsia-600' : 'text-emerald-600'
                  }`}>
                    {schedule.day_of_week ? DAYS[schedule.day_of_week] : '-'}
                  </div>
                  <div className="text-sm font-black text-gray-900">
                    {formatTimeShort(schedule.start_time)}
                  </div>
                </div>
                
                <div className="pt-0.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                      schedule.program?.class_type === 'pra_tahfidz' 
                        ? 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200/50' 
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200/50'
                    }`}>
                      {schedule.program?.class_type === 'pra_tahfidz' ? 'PRA TIKRAR' : 'TIKRAR TAHFIDZ'}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-base leading-tight">{schedule.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5 font-medium">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{schedule.muallimah?.full_name || 'Menunggu Muallimah'}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-5 mt-2 sm:mt-0 flex flex-col gap-2 min-w-[140px]">
                {schedule.zoom?.url || schedule.zoom_link || schedule.location ? (
                  <Button 
                    size="sm" 
                    className={`w-full bg-gradient-to-r hover:shadow-lg transition-all text-white rounded-xl flex items-center justify-center gap-2 font-bold ${
                      schedule.program?.class_type === 'pra_tahfidz' 
                        ? 'from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 shadow-fuchsia-600/20' 
                        : 'from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-600/20'
                    }`}
                    onClick={() => {
                      const link = schedule.zoom?.url || schedule.zoom_link || schedule.location;
                      if (link.startsWith('http')) {
                        window.open(link, '_blank');
                      }
                    }}
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Kelas</span>
                  </Button>
                ) : (
                  <div className="text-xs text-gray-400 italic text-center px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-100">Link belum tersedia</div>
                )}
                
                {schedule.zoom?.meeting_id && (
                  <div className="text-[10px] text-gray-500 text-center font-medium bg-gray-50 py-1 px-2 rounded-lg border border-gray-100">
                    <span className="text-gray-400">ID:</span> {schedule.zoom.meeting_id}
                    {schedule.zoom.passcode && <><span className="text-gray-300 mx-1">|</span><span className="text-gray-400">Pass:</span> {schedule.zoom.passcode}</>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {schedules.length > 1 && (
          <Button 
            variant="ghost" 
            onClick={() => setExpanded(!expanded)}
            className="w-full text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold rounded-xl mt-1"
          >
            {expanded ? (
              <>Tampilkan Lebih Sedikit <ChevronUp className="ml-2 w-4 h-4" /></>
            ) : (
              <>Lihat Selengkapnya ({schedules.length - 1} jadwal lainnya) <ChevronDown className="ml-2 w-4 h-4" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
