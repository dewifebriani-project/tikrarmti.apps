'use client';

import { useState, useMemo, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

interface TimelineItem {
  id: number;
  date: string;
  day: string;
  hijriDate: string;
  title: string;
  description: string;
  icon: React.ReactElement;
}

interface TimelineItemWithStatus extends TimelineItem {
  status: 'completed' | 'current' | 'future';
}

export default function PerjalananSaya() {
  const [isClient, setIsClient] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);

    // Fetch registration status
    const fetchRegistrationStatus = async () => {
      try {
        const response = await fetch('/api/auth/check-registration');
        if (response.ok) {
          const data = await response.json();
          setRegistrationStatus(data);
        }
      } catch (error) {
        console.error('Error fetching registration status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegistrationStatus();
  }, []);

  // Function to parse Indonesian date string
  const parseIndonesianDate = (dateStr: string): Date => {
    // Handle special case for "Pekan" - return a date in the future
    if (dateStr.includes('Pekan')) {
      // For "Pekan 1 2026", return date around that time
      if (dateStr.includes('1')) {
        return new Date('2026-01-12');
      } else if (dateStr.includes('2') || dateStr.includes('11')) {
        return new Date('2026-03-23');
      } else if (dateStr.includes('12')) {
        return new Date('2026-03-30');
      } else if (dateStr.includes('13')) {
        return new Date('2026-04-06');
      } else if (dateStr.includes('14')) {
        return new Date('2026-04-13');
      }
      return new Date('2026-01-12');
    }

    const months: { [key: string]: number } = {
      'Januari': 0,
      'Februari': 1,
      'Maret': 2,
      'April': 3,
      'Mei': 4,
      'Juni': 5,
      'Juli': 6,
      'Agustus': 7,
      'September': 8,
      'Oktober': 9,
      'November': 10,
      'Desember': 11
    };

    const parts = dateStr.split(' ');
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);

    return new Date(year, month, day);
  };

  const baseTimelineData: TimelineItem[] = [
    {
      id: 1,
      date: '6 Desember 2025',
      day: 'Jumat',
      hijriDate: '2 Jumadil Akhir 1446',
      title: 'Mendaftar Program',
      description: registrationStatus?.hasRegistered
        ? `Pendaftaran selesai pada ${new Date(registrationStatus.registration.submission_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Status: ${registrationStatus.registration.status === 'pending' ? 'Menunggu konfirmasi' : registrationStatus.registration.status === 'approved' ? 'Disetujui' : registrationStatus.registration.status === 'rejected' ? 'Ditolak' : 'Ditarik'}`
        : 'Pendaftaran awal program tahfidz',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 2,
      date: '6 Desember 2025',
      day: 'Jumat',
      hijriDate: '2 Jumadil Akhir 1446',
      title: 'Seleksi',
      description: 'Pengumpulan persyaratan berupa ujian seleksi lisan dan tulisan.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      id: 3,
      date: '14 Januari 2026',
      day: 'Selasa',
      hijriDate: '14 Rajab 1446',
      title: 'Lulus Seleksi',
      description: 'Pengumuman hasil seleksi.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 4,
      date: '15 Januari 2026',
      day: 'Rabu',
      hijriDate: '15 Rajab 1446',
      title: 'Mendaftar Ulang',
      description: 'Konfirmasi keikutsertaan dan pengumpulan akad daftar ulang.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 5,
      date: '17 Januari 2026',
      day: 'Sabtu',
      hijriDate: '17 Rajab 1446',
      title: 'Memulai Program',
      description: 'Awal resmi program tahfidz dengan orientasi dan penentuan target.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 6,
      date: 'Pekan 1 2026',
      day: '-',
      hijriDate: '-',
      title: 'Proses pembelajaran (tashih)',
      description: 'Sedang berada dalam tahapan intensifikasi hafalan dan rutinitas harian.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 7,
      date: 'Pekan 2 - 11 2026',
      day: '-',
      hijriDate: '-',
      title: 'Proses pembelajaran',
      description: 'Sedang berada dalam tahapan intensifikasi hafalan dan rutinitas harian.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 8,
      date: 'Pekan 12 2026',
      day: '-',
      hijriDate: '-',
      title: 'Pekan muraja\'ah',
      description: 'Muraja\'ah hafalan juz target.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    },
    {
      id: 9,
      date: 'Pekan 13 2026',
      day: '-',
      hijriDate: '-',
      title: 'Ujian Akhir',
      description: 'Ujian komprehensif hafalan juz target.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 10,
      date: 'Pekan ke 14 2026',
      day: '-',
      hijriDate: '-',
      title: 'Wisuda & Kelulusan',
      description: 'Penyerahan sertifikat kelulusan (syahadah) program tahfidz.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    }
  ];

  // Calculate timeline status dynamically based on current date and registration status
  const timelineData = useMemo((): TimelineItemWithStatus[] => {
    // If not client-side yet, return all items as 'future' to prevent hydration mismatch
    if (!isClient) {
      return baseTimelineData.map(item => ({
        ...item,
        status: 'future' as const
      }));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    return baseTimelineData.map((item, index) => {
      // If first item and user has registered, mark as completed
      if (index === 0 && registrationStatus?.hasRegistered) {
        return {
          ...item,
          status: 'completed' as const
        };
      }

      const itemDate = parseIndonesianDate(item.date);
      itemDate.setHours(0, 0, 0, 0);

      let status: 'completed' | 'current' | 'future';

      // Calculate difference in days
      const diffTime = itemDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        status = 'completed';
      } else if (diffDays === 0) {
        // Current status only for today
        status = 'current';
      } else {
        status = 'future';
      }

      return {
        ...item,
        status
      };
    });
  }, [isClient, registrationStatus]);

  const getStatusStyles = (status: 'completed' | 'current' | 'future') => {
    switch (status) {
      case 'completed':
        return {
          iconBg: 'bg-teal-100',
          iconColor: 'text-teal-600',
          cardBorder: 'border-l-4 border-l-teal-500',
          cardBg: 'bg-white',
          textColor: 'text-gray-800'
        };
      case 'current':
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          cardBorder: 'border-l-4 border-l-yellow-500',
          cardBg: 'bg-yellow-50',
          textColor: 'text-gray-800'
        };
      case 'future':
        return {
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-400',
          cardBorder: 'border-l-4 border-l-gray-300',
          cardBg: 'bg-gray-50',
          textColor: 'text-gray-500'
        };
    }
  };

  const completedCount = timelineData.filter(item => item.status === 'completed').length;
  const totalCount = timelineData.length;

  return (
    <AuthenticatedLayout title="Perjalanan Saya">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Linimasa Perjalanan Hafalan <em>Ukhti</em>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Setiap langkah adalah bagian dari ikhtiar. Teruslah semangat hingga akhir!
          </p>
        </div>

        {/* Registration Status Alert */}
        {!isLoading && !registrationStatus?.hasRegistered && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-yellow-800">
                <span className="font-medium">Belum Mendaftar:</span> Ukhti belum terdaftar di program Tikrar Tahfidz.
                <Link href="/pendaftaran/tikrar-tahfidz" className="text-yellow-700 underline hover:text-yellow-900 ml-1">
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Memuat status pendaftaran...</p>
          </div>
        )}

        {/* Timeline Container */}
        <div className="relative">
          {/* Mobile View - Single Column Timeline */}
          <div className="block lg:hidden">
            {/* Mobile Vertical Line */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-6">
              {timelineData.map((item) => {
                const styles = getStatusStyles(item.status);
                return (
                  <div key={item.id} className="relative flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`relative flex-shrink-0 w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center ${item.status === 'current' ? 'ring-4 ring-yellow-200' : 'ring-4 ring-white'} shadow-sm`}>
                      <div className={styles.iconColor}>
                        {item.icon}
                      </div>
                      {item.status === 'current' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                      )}
                    </div>

                    {/* Card */}
                    <div className={`flex-grow min-w-0 ${styles.cardBg} ${styles.cardBorder} rounded-lg shadow-sm p-4 sm:p-6 transition-all duration-300 hover:shadow-md`}>
                      {/* Date */}
                      {item.day !== '-' && (
                        <div className={`text-sm ${styles.textColor} mb-2 font-medium`}>
                          {item.day} • {item.date}
                          {item.hijriDate !== '-' && <span className="block text-xs mt-1">{item.hijriDate}</span>}
                        </div>
                      )}
                      {item.day === '-' && (
                        <div className={`text-sm ${styles.textColor} mb-2 font-medium`}>
                          {item.date}
                        </div>
                      )}

                      {/* Title */}
                      <h3 className={`text-lg font-bold mb-2 ${item.status === 'current' ? 'text-yellow-600' : styles.textColor}`}>
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className={`text-sm ${styles.textColor} leading-relaxed`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop View - Two Column Timeline */}
          <div className="hidden lg:block">
            {/* Desktop Vertical Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-200"></div>

            <div className="space-y-8">
              {timelineData.map((item, index) => {
                const styles = getStatusStyles(item.status);
                const isLeftSide = index % 2 === 0;

                return (
                  <div key={item.id} className={`relative flex items-center ${isLeftSide ? 'justify-start' : 'justify-end'}`}>
                    {/* Card */}
                    <div className={`w-5/12 ${isLeftSide ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                      <div className={`${styles.cardBg} ${styles.cardBorder} rounded-lg shadow-sm p-6 transition-all duration-300 hover:shadow-md`}>
                        {/* Date */}
                        {item.day !== '-' && (
                          <div className={`text-sm ${styles.textColor} mb-2 font-medium`}>
                            {item.day} • {item.date}
                            {item.hijriDate !== '-' && <span className="block text-xs mt-1">{item.hijriDate}</span>}
                          </div>
                        )}
                        {item.day === '-' && (
                          <div className={`text-sm ${styles.textColor} mb-2 font-medium`}>
                            {item.date}
                          </div>
                        )}

                        {/* Title */}
                        <h3 className={`text-lg font-bold mb-2 ${item.status === 'current' ? 'text-yellow-600' : styles.textColor}`}>
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p className={`text-sm ${styles.textColor} leading-relaxed`}>
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Center Icon */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                      <div className={`w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${item.status === 'current' ? 'ring-4 ring-yellow-200' : ''}`}>
                        <div className={styles.iconColor}>
                          {item.icon}
                        </div>
                        {item.status === 'current' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-12 sm:mt-16">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Progres Perjalanan</h3>
                <p className="text-sm text-gray-600">
                  {completedCount} dari {totalCount} tahapan selesai
                </p>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center space-x-2">
                {timelineData.map((item, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      item.status === 'completed'
                        ? 'bg-teal-500'
                        : item.status === 'current'
                        ? 'w-3 h-3 bg-yellow-500 animate-pulse'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Current Status */}
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-600">
                Saat ini: <span className="font-medium text-gray-900">
                  {timelineData.find(item => item.status === 'current')?.title || 'Menunggu tahap berikutnya'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}