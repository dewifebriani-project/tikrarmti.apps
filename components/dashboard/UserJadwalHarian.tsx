'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Video, BookOpen, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { formatTimeShort } from '@/lib/reminder-generator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAYS = [
  'Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'
];

export function UserJadwalHarian({ user, activeBatch, daftarUlangData }: { user: any, activeBatch: any, daftarUlangData?: any }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPraTikrar, setExpandedPraTikrar] = useState(false);
  const [expandedTikrar, setExpandedTikrar] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSchedules() {
      if (!user?.id || !activeBatch?.id) {
        setLoading(false);
        return;
      }
      try {
        // Fetch ALL active halaqahs for this batch
        const { data: allHalaqahsData } = await supabase.from('halaqah')
          .select(`
            id, name, day_of_week, start_time, end_time, zoom_link, location, max_students,
            zoom:batch_zoom_links!halaqah_zoom_link_id_fkey(name, url, meeting_id, passcode),
            muallimah:users!halaqah_muallimah_id_fkey(full_name),
            program:programs!inner(batch_id, class_type),
            students:halaqah_students(status)
          `)
          .eq('program.batch_id', activeBatch.id)
          .eq('status', 'active');
          
        const combined = allHalaqahsData || [];
        
        // Sort by day (relative to today) and then time
        const todayDayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();
        
        combined.sort((a: any, b: any) => {
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

  const ownSchedules = schedules.filter((s: any) => s.program?.class_type === 'tahfidz' || s.program?.class_type === 'tikrar_tahfidz');
  const praTikrarSchedules = schedules.filter((s: any) => s.program?.class_type === 'pra_tahfidz');
  
  const displayedPraTikrar = expandedPraTikrar ? praTikrarSchedules : praTikrarSchedules.slice(0, 3);
  const displayedTikrar = expandedTikrar ? ownSchedules : ownSchedules.slice(0, 3);

  const renderScheduleCard = (schedule: any) => (
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{schedule.muallimah?.full_name || 'Menunggu Muallimah'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {schedule.students?.filter((st: any) => st.status === 'active').length || 0} / {schedule.max_students || '-'} Thalibah
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {schedule.zoom_link || schedule.zoom?.url ? (
          <Button 
            className={`rounded-xl font-bold w-full sm:w-auto shadow-sm hover:shadow-md transition-all ${
              schedule.program?.class_type === 'pra_tahfidz' 
                ? 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            onClick={() => window.open(schedule.zoom?.url || schedule.zoom_link, '_blank')}
          >
            <Video className="w-4 h-4 mr-2" />
            Join Kelas
          </Button>
        ) : (
          <div className="text-xs text-gray-400 italic text-center px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-100">Link belum tersedia</div>
        )}
      </CardContent>
      {schedule.zoom && (schedule.zoom.meeting_id || schedule.zoom.passcode) && (
        <div className="bg-gray-50 px-4 py-2.5 text-[11px] text-gray-500 font-medium flex items-center justify-center gap-3 border-t border-gray-100">
          {schedule.zoom.meeting_id && <span>ID: <span className="font-bold text-gray-700">{schedule.zoom.meeting_id}</span></span>}
          {schedule.zoom.meeting_id && schedule.zoom.passcode && <span className="text-gray-300">|</span>}
          {schedule.zoom.passcode && <span>Pass: <span className="font-bold text-gray-700">{schedule.zoom.passcode}</span></span>}
        </div>
      )}
    </Card>
  );

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
      
      <Tabs defaultValue={ownSchedules.length > 0 ? "tikrar" : "pra-tikrar"} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4 bg-gray-100/80 p-1 rounded-xl h-auto">
          <TabsTrigger 
            value="tikrar" 
            className="rounded-lg py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-sm font-bold transition-all"
          >
            Kelas Tikrar ({ownSchedules.length})
          </TabsTrigger>
          <TabsTrigger 
            value="pra-tikrar" 
            className="rounded-lg py-2.5 data-[state=active]:bg-fuchsia-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-sm font-bold transition-all"
          >
            Pra-Tikrar ({praTikrarSchedules.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tikrar" className="mt-0 outline-none">
          {ownSchedules.length > 0 ? (
            <div className="grid grid-cols-1 gap-3.5">
              {displayedTikrar.map(renderScheduleCard)}
              
              {ownSchedules.length > displayedTikrar.length && !expandedTikrar && (
                <Button 
                  variant="ghost" 
                  onClick={() => setExpandedTikrar(true)}
                  className="w-full text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold rounded-xl mt-1"
                >
                  Lihat Selengkapnya ({ownSchedules.length - displayedTikrar.length} jadwal lainnya) <ChevronDown className="ml-2 w-4 h-4" />
                </Button>
              )}
              {expandedTikrar && ownSchedules.length > 3 && (
                <Button 
                  variant="ghost" 
                  onClick={() => setExpandedTikrar(false)}
                  className="w-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 font-medium rounded-xl mt-1"
                >
                  Tutup jadwal <ChevronUp className="ml-2 w-4 h-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-2xl">
              Belum ada jadwal kelas Tikrar.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pra-tikrar" className="mt-0 outline-none">
          <div className="grid grid-cols-1 gap-3.5">
            {displayedPraTikrar.map(renderScheduleCard)}
            
            {praTikrarSchedules.length > displayedPraTikrar.length && !expandedPraTikrar && (
              <Button 
                variant="ghost" 
                onClick={() => setExpandedPraTikrar(true)}
                className="w-full text-fuchsia-700 hover:bg-fuchsia-50 hover:text-fuchsia-800 font-bold rounded-xl mt-1"
              >
                Lihat Selengkapnya ({praTikrarSchedules.length - displayedPraTikrar.length} jadwal lainnya) <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
            )}
            {expandedPraTikrar && praTikrarSchedules.length > 3 && (
              <Button 
                variant="ghost" 
                onClick={() => setExpandedPraTikrar(false)}
                className="w-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 font-medium rounded-xl mt-1"
              >
                Tutup jadwal <ChevronUp className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
