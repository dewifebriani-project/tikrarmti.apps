'use client';

import { useState, useMemo } from 'react';
import { X, Calendar, Clock, AlertTriangle, Info, Video, CheckCircle2 } from 'lucide-react';
import { formatClassType } from '@/lib/format-utils';

interface Halaqah {
  id: string;
  name: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  status: string;
  muallimah?: { full_name?: string };
  program?: { class_type?: string };
  class_type?: string;
}

interface ScheduleOverlapAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  halaqahs: Halaqah[];
}

interface Event {
  time: number;
  type: 'start' | 'end';
  halaqah: Halaqah;
}

interface DayAnalysis {
  day: number;
  dayName: string;
  maxOverlap: number;
  peakHalaqahs: Halaqah[];
  peakTimeStart: number;
  peakTimeEnd: number;
  totalHalaqahs: number;
}

const DAYS = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function ScheduleOverlapAnalysis({ isOpen, onClose, halaqahs }: ScheduleOverlapAnalysisProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const analysis = useMemo(() => {
    // 1. Filter active halaqahs with valid schedules
    const activeScheduled = halaqahs.filter(
      h => h.status === 'active' && h.day_of_week && h.start_time && h.end_time
    );

    const unscheduledCount = halaqahs.filter(
      h => h.status === 'active' && (!h.day_of_week || !h.start_time || !h.end_time)
    ).length;

    // 2. Group by day
    const byDay: Record<number, Halaqah[]> = {};
    activeScheduled.forEach(h => {
      const d = h.day_of_week!;
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(h);
    });

    // 3. Analyze each day using Line Sweep
    const results: DayAnalysis[] = [];
    let maxOverall = 0;

    for (let d = 1; d <= 7; d++) {
      const dayHalaqahs = byDay[d] || [];
      if (dayHalaqahs.length === 0) {
        results.push({
          day: d,
          dayName: DAYS[d],
          maxOverlap: 0,
          peakHalaqahs: [],
          peakTimeStart: 0,
          peakTimeEnd: 0,
          totalHalaqahs: 0
        });
        continue;
      }

      const events: Event[] = [];
      dayHalaqahs.forEach(h => {
        events.push({ time: timeToMinutes(h.start_time!), type: 'start', halaqah: h });
        events.push({ time: timeToMinutes(h.end_time!), type: 'end', halaqah: h });
      });

      // Sort: ascending by time. If equal time, 'end' comes before 'start' to avoid false overlaps.
      events.sort((a, b) => {
        if (a.time !== b.time) return a.time - b.time;
        if (a.type === 'end' && b.type === 'start') return -1;
        if (a.type === 'start' && b.type === 'end') return 1;
        return 0;
      });

      let currentActive: Halaqah[] = [];
      let maxOverlap = 0;
      let peakHalaqahs: Halaqah[] = [];
      let peakTimeStart = 0;

      for (const ev of events) {
        if (ev.type === 'start') {
          currentActive.push(ev.halaqah);
          if (currentActive.length > maxOverlap) {
            maxOverlap = currentActive.length;
            peakHalaqahs = [...currentActive];
            peakTimeStart = ev.time;
          }
        } else {
          currentActive = currentActive.filter(h => h.id !== ev.halaqah.id);
        }
      }

      // Find the end time of the peak (the time of the next 'end' event after peakTimeStart where overlap reduces)
      // Actually, a simpler approximation is just using the earliest end time among the peak halaqahs
      let peakTimeEnd = peakTimeStart;
      if (peakHalaqahs.length > 0) {
        peakTimeEnd = Math.min(...peakHalaqahs.map(h => timeToMinutes(h.end_time!)));
      }

      if (maxOverlap > maxOverall) maxOverall = maxOverlap;

      results.push({
        day: d,
        dayName: DAYS[d],
        maxOverlap,
        peakHalaqahs,
        peakTimeStart,
        peakTimeEnd,
        totalHalaqahs: dayHalaqahs.length
      });
    }

    return {
      results,
      maxOverall,
      unscheduledCount
    };
  }, [halaqahs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600" />
              Analisis Kebutuhan Zoom
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Berdasarkan irisan jadwal halaqah aktif
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Summary Banner */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6 flex items-start gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm text-indigo-600">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-indigo-900 font-bold text-lg mb-1">
                Total Link Zoom Dibutuhkan: {analysis.maxOverall} Link
              </h3>
              <p className="text-indigo-700 text-sm leading-relaxed">
                Ini adalah jumlah kelas terbanyak yang berjalan secara bersamaan dalam pekan ini.
                Menyediakan <strong>{analysis.maxOverall}</strong> link Zoom akan memastikan tidak ada bentrok ruangan.
              </p>
            </div>
          </div>

          {analysis.unscheduledCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Perhatian:</strong> Terdapat <strong>{analysis.unscheduledCount}</strong> halaqah aktif yang belum memiliki jadwal (Hari/Jam) spesifik sehingga tidak ikut dihitung dalam analisis ini.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
            {analysis.results.map((day) => (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedDay === day.day
                    ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-gray-900 mb-1">{day.dayName}</div>
                <div className="text-2xl font-black text-indigo-600 mb-1">{day.maxOverlap} <span className="text-xs font-medium text-gray-500">link</span></div>
                <div className="text-xs text-gray-500">{day.totalHalaqahs} kelas aktif</div>
              </button>
            ))}
          </div>

          {selectedDay !== null && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Detail Hari {DAYS[selectedDay]}
              </h4>
              
              {analysis.results[selectedDay - 1].maxOverlap > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Waktu Puncak (Peak Time): 
                      <strong className="text-gray-900 ml-1">
                        {formatMinutesToTime(analysis.results[selectedDay - 1].peakTimeStart)} - {formatMinutesToTime(analysis.results[selectedDay - 1].peakTimeEnd)}
                      </strong>
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-gray-700 mb-3">Daftar Kelas yang Bentrok di Waktu Puncak:</h5>
                  <div className="space-y-3">
                    {analysis.results[selectedDay - 1].peakHalaqahs.map((h) => (
                      <div key={h.id} className="flex flex-col sm:flex-row sm:items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors gap-3 justify-start">
                        <div className="px-3 py-1 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 whitespace-nowrap shadow-sm shrink-0">
                          {h.start_time} - {h.end_time}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-900">{h.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {h.muallimah?.full_name || 'Tanpa Muallimah'} • {formatClassType(h.class_type || h.program?.class_type)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Tidak ada jadwal kelas aktif di hari ini.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
