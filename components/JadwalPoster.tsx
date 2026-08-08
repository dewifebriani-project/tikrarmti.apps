import React, { forwardRef } from 'react';
import { formatTimeShort, HalaqahForReminder } from '@/lib/reminder-generator';
import { Globe, Link as LinkIcon, Phone } from 'lucide-react';

interface JadwalPosterProps {
  halaqahs: HalaqahForReminder[];
  dayName: string;
  dayNum: number;
}

const THEMES = {
  1: { bg: 'bg-gradient-to-br from-emerald-50 via-teal-100 to-emerald-200', titleText: 'text-emerald-800', headerBg: 'bg-emerald-600', headerText: 'text-white', rowEven: 'bg-emerald-50/70', rowOdd: 'bg-white/90', border: 'border-emerald-200', footerBg: 'bg-emerald-700', accent: 'text-emerald-400' },
  2: { bg: 'bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200', titleText: 'text-amber-900', headerBg: 'bg-amber-600', headerText: 'text-white', rowEven: 'bg-amber-50/70', rowOdd: 'bg-white/90', border: 'border-amber-200', footerBg: 'bg-amber-700', accent: 'text-amber-400' },
  3: { bg: 'bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200', titleText: 'text-blue-900', headerBg: 'bg-blue-600', headerText: 'text-white', rowEven: 'bg-blue-50/70', rowOdd: 'bg-white/90', border: 'border-blue-200', footerBg: 'bg-blue-700', accent: 'text-blue-400' },
  4: { bg: 'bg-gradient-to-br from-fuchsia-50 via-purple-100 to-fuchsia-200', titleText: 'text-fuchsia-900', headerBg: 'bg-fuchsia-600', headerText: 'text-white', rowEven: 'bg-fuchsia-50/70', rowOdd: 'bg-white/90', border: 'border-fuchsia-200', footerBg: 'bg-fuchsia-700', accent: 'text-fuchsia-400' },
  5: { bg: 'bg-gradient-to-br from-green-50 via-emerald-100 to-green-200', titleText: 'text-green-900', headerBg: 'bg-green-600', headerText: 'text-white', rowEven: 'bg-green-50/70', rowOdd: 'bg-white/90', border: 'border-green-200', footerBg: 'bg-green-700', accent: 'text-green-400' },
  6: { bg: 'bg-gradient-to-br from-rose-50 via-pink-100 to-rose-200', titleText: 'text-rose-900', headerBg: 'bg-rose-600', headerText: 'text-white', rowEven: 'bg-rose-50/70', rowOdd: 'bg-white/90', border: 'border-rose-200', footerBg: 'bg-rose-700', accent: 'text-rose-400' },
  7: { bg: 'bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200', titleText: 'text-orange-900', headerBg: 'bg-orange-600', headerText: 'text-white', rowEven: 'bg-orange-50/70', rowOdd: 'bg-white/90', border: 'border-orange-200', footerBg: 'bg-orange-700', accent: 'text-orange-400' },
};

const MandalaCorner = ({ className, opacity = "0.15" }: { className?: string, opacity?: string }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
    <path d="M0 0 L200 0 C200 110.457 110.457 200 0 200 L0 0 Z" fill="currentColor" />
    <path d="M0 0 L160 0 C160 88.3656 88.3656 160 0 160 L0 0 Z" fill="white" fillOpacity="0.2" />
    <path d="M0 0 L120 0 C120 66.2742 66.2742 120 0 120 L0 0 Z" fill="currentColor" fillOpacity="0.5" />
    <path d="M10 10 C40 -10, 90 20, 110 60 C80 90, 20 80, 10 10 Z" fill="white" fillOpacity="0.3" />
    <path d="M10 10 C-10 40, 20 90, 60 110 C90 80, 80 20, 10 10 Z" fill="white" fillOpacity="0.3" />
    <path d="M15 15 C50 40, 80 80, 95 130 C70 140, 30 90, 15 15 Z" fill="currentColor" fillOpacity="0.4" />
    <path d="M15 15 C40 50, 80 80, 130 95 C140 70, 90 30, 15 15 Z" fill="currentColor" fillOpacity="0.4" />
  </svg>
);

const FlowerDeco = ({ className, opacity = "0.1" }: { className?: string, opacity?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
    <path d="M50 5 C60 25, 80 40, 95 50 C80 60, 60 75, 50 95 C40 75, 20 60, 5 50 C20 40, 40 25, 50 5 Z" />
    <path d="M50 20 C55 35, 65 45, 80 50 C65 55, 55 65, 50 80 C45 65, 35 55, 20 50 C35 45, 45 35, 50 20 Z" fill="white" fillOpacity="0.5" />
    <circle cx="50" cy="50" r="8" fill="white" />
  </svg>
);

export const JadwalPoster = forwardRef<HTMLDivElement, JadwalPosterProps>(
  ({ halaqahs, dayName, dayNum }, ref) => {
    const theme = THEMES[dayNum as keyof typeof THEMES] || THEMES[1];

    return (
      <div 
        ref={ref}
        className={`w-[1080px] min-h-[1080px] h-fit flex flex-col font-sans ${theme.bg} relative overflow-hidden`}
        style={{
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 3.33331C10.8 3.33331 3.33334 10.8 3.33334 20C3.33334 29.2 10.8 36.6666 20 36.6666C29.2 36.6666 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33331 20 3.33331ZM20 33.3333C12.6667 33.3333 6.66668 27.3333 6.66668 20C6.66668 12.6666 12.6667 6.66664 20 6.66664C27.3333 6.66664 33.3333 12.6666 33.3333 20C33.3333 27.3333 27.3333 33.3333 20 33.3333Z' fill='%23000000' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}
        />

        {/* Decorative elements */}
        <MandalaCorner className={`absolute top-0 left-0 w-[400px] h-[400px] ${theme.accent}`} opacity="0.2" />
        <MandalaCorner className={`absolute bottom-0 right-0 w-[500px] h-[500px] ${theme.accent} transform rotate-180`} opacity="0.15" />
        <FlowerDeco className={`absolute top-[10%] right-[5%] w-[120px] h-[120px] ${theme.accent}`} opacity="0.15" />
        <FlowerDeco className={`absolute bottom-[20%] left-[5%] w-[180px] h-[180px] ${theme.accent} transform -rotate-45`} opacity="0.15" />
        
        {/* Soft blurs to blend things together */}
        <div className="absolute top-[30%] left-[-10%] w-[50%] h-[50%] bg-white/40 rounded-full blur-[100px]" />
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/40 rounded-full blur-[100px]" />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col px-16 py-20 z-10">
          
          {/* Header Section */}
          <div className="flex justify-between items-start mb-16 relative">
            <div className="flex-1 z-10 pt-4">
              <h1 className={`text-7xl font-black ${theme.titleText} mb-2 tracking-tight drop-shadow-sm`}>
                Jadwal Halaqah
              </h1>
              <div className="flex items-center gap-6">
                <h2 className={`text-[85px] font-black ${theme.titleText} drop-shadow-md`}>
                  Hari {dayName}
                </h2>
                <div className={`h-2 flex-1 rounded-full ${theme.headerBg} opacity-20 mt-4`} />
              </div>
            </div>
            
            {/* Logo */}
            <div className="relative z-10 w-48 h-48 bg-white/90 backdrop-blur-sm rounded-[2.5rem] shadow-2xl p-5 flex items-center justify-center transform rotate-3 border-4 border-white/50">
              <img 
                src="/logo.jpg"
                alt="MTI Logo"
                className="w-full h-full object-contain drop-shadow-md rounded-2xl"
                crossOrigin="anonymous"
              />
              {/* Subtle decorative dot for logo frame */}
              <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full ${theme.headerBg} shadow-lg border-4 border-white`} />
            </div>
          </div>

          {/* Table Content */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border-2 border-white/60 flex-1 flex flex-col relative">
            <table className="w-full text-left border-collapse relative z-10">
              <thead>
                <tr className={theme.headerBg}>
                  <th className={`py-7 px-8 text-2xl font-bold ${theme.headerText} w-24 text-center border-r border-white/20`}>NO</th>
                  <th className={`py-7 px-8 text-2xl font-bold ${theme.headerText} border-r border-white/20`}>HALAQAH</th>
                  <th className={`py-7 px-8 text-2xl font-bold ${theme.headerText} border-r border-white/20`}>NAMA USTADZAH</th>
                  <th className={`py-7 px-8 text-2xl font-bold ${theme.headerText} w-56 text-center`}>WAKTU (WIB)</th>
                </tr>
              </thead>
              <tbody>
                {halaqahs.map((halaqah, index) => {
                  const isEven = index % 2 === 0;
                  const rowClass = isEven ? theme.rowEven : theme.rowOdd;
                  
                  let halaqahLabel = halaqah.name;
                  if (halaqah.class_type === 'pra_tahfidz') {
                    halaqahLabel = 'Pra Tikrar Umum';
                  } else if (halaqah.class_type === 'tikrar_tahfidz') {
                    halaqahLabel = `Tikrar Juz ${halaqah.preferred_juz || '-'}`;
                  }

                  return (
                    <tr key={halaqah.id} className={`${rowClass} ${index !== halaqahs.length - 1 ? `border-b ${theme.border}` : ''} transition-colors`}>
                      <td className={`py-7 px-8 text-[1.4rem] font-bold ${theme.titleText} text-center border-r ${theme.border}`}>
                        <div className={`w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-white/50 shadow-sm border border-white/60`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className={`py-7 px-8 text-[1.4rem] font-bold text-gray-800 border-r ${theme.border}`}>
                        {halaqahLabel}
                      </td>
                      <td className={`py-7 px-8 text-[1.4rem] font-bold text-gray-800 border-r ${theme.border}`}>
                        {halaqah.muallimah?.full_name || '-'}
                      </td>
                      <td className={`py-7 px-8 text-[1.6rem] font-black ${theme.titleText} text-center`}>
                        {formatTimeShort(halaqah.start_time)}
                      </td>
                    </tr>
                  );
                })}
                {halaqahs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 px-8 text-3xl font-bold text-gray-400 text-center bg-white/50">
                      ~ Tidak ada kelas di hari ini ~
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>

        {/* Footer */}
        <div className={`${theme.footerBg} text-white px-16 py-10 flex items-center justify-between z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] relative`}>
          {/* subtle footer pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='%23ffffff'/%3E%3C/svg%3E")`,
            backgroundSize: '20px 20px'
          }} />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <LinkIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-[1.35rem] font-semibold tracking-wide">lynk.id/markaztikrar.id</span>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-[1.35rem] font-semibold tracking-wide">markaztikrar.id</span>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <span className="text-[1.35rem] font-semibold tracking-wide">0813-3000-0784</span>
          </div>
        </div>
        
      </div>
    );
  }
);

JadwalPoster.displayName = 'JadwalPoster';
