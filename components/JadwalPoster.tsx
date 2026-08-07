import React, { forwardRef } from 'react';
import { formatTimeShort, HalaqahForReminder } from '@/lib/reminder-generator';
import Image from 'next/image';
import { Globe, Link as LinkIcon, Phone } from 'lucide-react';

interface JadwalPosterProps {
  halaqahs: HalaqahForReminder[];
  dayName: string;
  dayNum: number;
}

const THEMES = {
  1: { // Senin
    bg: 'bg-gradient-to-br from-emerald-50 via-teal-100 to-emerald-200',
    titleText: 'text-emerald-800',
    headerBg: 'bg-emerald-600',
    headerText: 'text-white',
    rowEven: 'bg-emerald-50/70',
    rowOdd: 'bg-white/80',
    border: 'border-emerald-200',
    footerBg: 'bg-emerald-700'
  },
  2: { // Selasa
    bg: 'bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200',
    titleText: 'text-amber-900',
    headerBg: 'bg-amber-600',
    headerText: 'text-white',
    rowEven: 'bg-amber-50/70',
    rowOdd: 'bg-white/80',
    border: 'border-amber-200',
    footerBg: 'bg-amber-700'
  },
  3: { // Rabu
    bg: 'bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200',
    titleText: 'text-blue-900',
    headerBg: 'bg-blue-600',
    headerText: 'text-white',
    rowEven: 'bg-blue-50/70',
    rowOdd: 'bg-white/80',
    border: 'border-blue-200',
    footerBg: 'bg-blue-700'
  },
  4: { // Kamis
    bg: 'bg-gradient-to-br from-fuchsia-50 via-purple-100 to-fuchsia-200',
    titleText: 'text-fuchsia-900',
    headerBg: 'bg-fuchsia-600',
    headerText: 'text-white',
    rowEven: 'bg-fuchsia-50/70',
    rowOdd: 'bg-white/80',
    border: 'border-fuchsia-200',
    footerBg: 'bg-fuchsia-700'
  },
  5: { // Jumat
    bg: 'bg-gradient-to-br from-green-50 via-emerald-100 to-green-200',
    titleText: 'text-green-900',
    headerBg: 'bg-green-600',
    headerText: 'text-white',
    rowEven: 'bg-green-50/70',
    rowOdd: 'bg-white/80',
    border: 'border-green-200',
    footerBg: 'bg-green-700'
  },
  6: { // Sabtu
    bg: 'bg-gradient-to-br from-rose-50 via-pink-100 to-rose-200',
    titleText: 'text-rose-900',
    headerBg: 'bg-rose-600',
    headerText: 'text-white',
    rowEven: 'bg-rose-50/70',
    rowOdd: 'bg-white/80',
    border: 'border-rose-200',
    footerBg: 'bg-rose-700'
  },
  7: { // Ahad
    bg: 'bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200',
    titleText: 'text-orange-900',
    headerBg: 'bg-orange-600',
    headerText: 'text-white',
    rowEven: 'bg-orange-50/70',
    rowOdd: 'bg-white/80',
    border: 'border-orange-200',
    footerBg: 'bg-orange-700'
  },
};

export const JadwalPoster = forwardRef<HTMLDivElement, JadwalPosterProps>(
  ({ halaqahs, dayName, dayNum }, ref) => {
    const theme = THEMES[dayNum as keyof typeof THEMES] || THEMES[1];

    return (
      <div 
        ref={ref}
        className={`w-[1080px] min-h-[1080px] h-fit flex flex-col font-sans ${theme.bg} relative overflow-hidden`}
        style={{
          // Use standard system fonts for guaranteed rendering in html-to-image
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-white/20 rounded-full blur-3xl" />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col px-16 py-20 z-10">
          
          {/* Header Section */}
          <div className="flex justify-between items-start mb-16">
            <div className="flex-1">
              <h1 className={`text-7xl font-black ${theme.titleText} mb-4 tracking-tight drop-shadow-sm`}>
                Jadwal Halaqah
              </h1>
              <h2 className={`text-6xl font-bold ${theme.titleText} opacity-80`}>
                Hari {dayName}
              </h2>
            </div>
            
            {/* Logo */}
            <div className="w-40 h-40 bg-white rounded-3xl shadow-xl p-4 flex items-center justify-center transform rotate-2">
              <Image 
                src="https://github.com/dewifebriani-project/File-Public/blob/main/Markaz%20Tikrar%20Indonesia.jpg?raw=true"
                alt="MTI Logo"
                width={140}
                height={140}
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/50 flex-1 flex flex-col">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={theme.headerBg}>
                  <th className={`py-6 px-8 text-2xl font-bold ${theme.headerText} w-24 text-center border-r border-white/20`}>NO</th>
                  <th className={`py-6 px-8 text-2xl font-bold ${theme.headerText} border-r border-white/20`}>HALAQAH</th>
                  <th className={`py-6 px-8 text-2xl font-bold ${theme.headerText} border-r border-white/20`}>NAMA USTADZAH</th>
                  <th className={`py-6 px-8 text-2xl font-bold ${theme.headerText} w-48 text-center`}>WAKTU (WIB)</th>
                </tr>
              </thead>
              <tbody>
                {halaqahs.map((halaqah, index) => {
                  const isEven = index % 2 === 0;
                  const rowClass = isEven ? theme.rowEven : theme.rowOdd;
                  
                  // Label for halaqah
                  let halaqahLabel = halaqah.name;
                  if (halaqah.class_type === 'pra_tahfidz') {
                    halaqahLabel = 'Pra Tikrar Umum';
                  } else if (halaqah.class_type === 'tikrar_tahfidz') {
                    halaqahLabel = `Tikrar Juz ${halaqah.preferred_juz || '-'}`;
                  }

                  return (
                    <tr key={halaqah.id} className={`${rowClass} ${index !== halaqahs.length - 1 ? `border-b ${theme.border}` : ''}`}>
                      <td className={`py-6 px-8 text-2xl font-bold text-gray-800 text-center border-r ${theme.border}`}>
                        {index + 1}
                      </td>
                      <td className={`py-6 px-8 text-2xl font-semibold text-gray-800 border-r ${theme.border}`}>
                        {halaqahLabel}
                      </td>
                      <td className={`py-6 px-8 text-2xl font-semibold text-gray-800 border-r ${theme.border}`}>
                        {halaqah.muallimah?.full_name || '-'}
                      </td>
                      <td className={`py-6 px-8 text-2xl font-bold text-gray-800 text-center`}>
                        {formatTimeShort(halaqah.start_time)}
                      </td>
                    </tr>
                  );
                })}
                {halaqahs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 px-8 text-2xl font-medium text-gray-500 text-center">
                      Tidak ada kelas di hari ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>

        {/* Footer */}
        <div className={`${theme.footerBg} text-white px-12 py-8 flex items-center justify-between z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-medium">lynk.id/markaztikrar.id</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-medium">markaztikrar.id</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-medium">0813-3000-0784</span>
          </div>
        </div>
        
      </div>
    );
  }
);

JadwalPoster.displayName = 'JadwalPoster';
