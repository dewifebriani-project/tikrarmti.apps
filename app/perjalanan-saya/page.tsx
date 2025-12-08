'use client';

import { useState, useMemo, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, Calendar, BookOpen, Award, Target } from 'lucide-react';

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
  const { user, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only fetch registration status after user is available
    if (user) {
      const fetchRegistrationStatus = async () => {
        try {
          console.log('Fetching registration status for user:', user.id, user.email);
          const response = await fetch('/api/auth/check-registration');

          if (!response.ok) {
            console.error('Failed to fetch registration status:', response.status, response.statusText);
            setRegistrationStatus({ hasRegistered: false });
            setIsLoading(false);
            return;
          }

          const data = await response.json();
          console.log('Registration status response:', data);
          setRegistrationStatus(data);
        } catch (error) {
          console.error('Error fetching registration status:', error);
          setRegistrationStatus({ hasRegistered: false });
        } finally {
          setIsLoading(false);
        }
      };

      fetchRegistrationStatus();
    } else if (!authLoading) {
      // User is not logged in and auth is finished loading
      console.log('User not logged in, setting loading to false');
      setIsLoading(false);
    }
  }, [user, authLoading]);

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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Linimasa Perjalanan Hafalan <em>Ukhti</em>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Setiap langkah adalah bagian dari ikhtiar. Teruslah semangat hingga akhir!
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-600">Memuat data...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Status Alert */}
        {!isLoading && user && !registrationStatus?.hasRegistered && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-grow">
                  <h3 className="font-medium text-yellow-800">Belum Mendaftar</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    Ukhti belum terdaftar di program Tikrar Tahfidz.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link href="/pendaftaran/tikrar-tahfidz" className="inline-block">
                      <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                        Daftar Sekarang
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log('Opening debug API...');
                        fetch('/api/debug/registration')
                          .then(res => res.json())
                          .then(data => {
                            console.log('Debug data:', data);
                            alert(`Debug info logged to console. User ID: ${data.userInfo?.id}, Email: ${data.userInfo?.email}, Registrations by user_id: ${data.registrationsByUserId?.count}, by email: ${data.registrationsByEmail?.count}`);
                          })
                          .catch(err => {
                            console.error('Debug error:', err);
                            alert('Error getting debug info. Check console.');
                          });
                      }}
                    >
                      Debug Info
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Info Card */}
        {registrationStatus?.hasRegistered && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center space-x-2 text-green-900 text-lg sm:text-xl">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Status Pendaftaran</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Nama Lengkap</p>
                  <p className="font-medium text-sm sm:text-base">{registrationStatus.registration.full_name}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    registrationStatus.registration.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : registrationStatus.registration.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : registrationStatus.registration.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {registrationStatus.registration.status === 'pending' ? 'Menunggu Konfirmasi' :
                     registrationStatus.registration.status === 'approved' ? 'Disetujui' :
                     registrationStatus.registration.status === 'rejected' ? 'Ditolak' : 'Ditarik'}
                  </span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Tanggal Pendaftaran</p>
                  <p className="font-medium text-sm sm:text-base">
                    {new Date(registrationStatus.registration.submission_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {registrationStatus.registration.batch_name && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Batch</p>
                    <p className="font-medium text-sm sm:text-base">{registrationStatus.registration.batch_name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline Container */}
        {user && !isLoading && (
          <div className="space-y-4 sm:space-y-6">
            {/* Mobile & Tablet View - Single Column Timeline */}
            <div className="block lg:hidden">
              <div className="space-y-4 sm:space-y-6">
                {timelineData.map((item) => {
                  const styles = getStatusStyles(item.status);
                  return (
                    <Card key={item.id} className={`${styles.cardBg} ${styles.cardBorder} transition-all duration-300 hover:shadow-md`}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start space-x-3 sm:space-x-4">
                          {/* Icon */}
                          <div className={`relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 ${styles.iconBg} rounded-full flex items-center justify-center ${item.status === 'current' ? 'ring-4 ring-yellow-200' : 'ring-4 ring-white'} shadow-sm`}>
                            <div className={`w-4 h-4 sm:w-5 sm:h-5 ${styles.iconColor}`}>
                              {item.icon}
                            </div>
                            {item.status === 'current' && (
                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-grow min-w-0">
                            {/* Date */}
                            {item.day !== '-' && (
                              <div className={`text-xs sm:text-sm ${styles.textColor} mb-1.5 sm:mb-2 font-medium`}>
                                {item.day} • {item.date}
                                {item.hijriDate !== '-' && <span className="block text-xs mt-0.5 sm:mt-1">{item.hijriDate}</span>}
                              </div>
                            )}
                            {item.day === '-' && (
                              <div className={`text-xs sm:text-sm ${styles.textColor} mb-1.5 sm:mb-2 font-medium`}>
                                {item.date}
                              </div>
                            )}

                            {/* Title */}
                            <h3 className={`text-base sm:text-lg font-bold mb-1.5 sm:mb-2 ${item.status === 'current' ? 'text-yellow-600' : styles.textColor}`}>
                              {item.title}
                            </h3>

                            {/* Description */}
                            <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Desktop View - Two Column Timeline */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-200"></div>

                <div className="space-y-8">
                  {timelineData.map((item, index) => {
                    const styles = getStatusStyles(item.status);
                    const isLeftSide = index % 2 === 0;

                    return (
                      <div key={item.id} className={`relative flex items-center ${isLeftSide ? 'justify-start' : 'justify-end'}`}>
                        {/* Card */}
                        <div className={`w-5/12 ${isLeftSide ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                          <Card className={`${styles.cardBg} ${styles.cardBorder} transition-all duration-300 hover:shadow-md`}>
                            <CardContent className="p-6">
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
                            </CardContent>
                          </Card>
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
          </div>
        )}

        {/* Progress Overview */}
        {user && !isLoading && (
          <Card className="mt-6 sm:mt-8">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                <span>Progres Perjalanan</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Tracking perjalanan hafalan Ukhti
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Progres Perjalanan</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {completedCount} dari {totalCount} tahapan selesai
                  </p>
                </div>

                {/* Progress Dots - Responsive */}
                <div className="flex items-center space-x-1 sm:space-x-2 max-w-xs sm:max-w-none overflow-x-auto pb-1 sm:pb-0">
                  {timelineData.map((item, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                        item.status === 'completed'
                          ? 'bg-teal-500'
                          : item.status === 'current'
                          ? 'w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 animate-pulse'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 sm:mt-4">
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-teal-600 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Status */}
              <div className="mt-3 sm:mt-4 flex items-center space-x-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Saat ini: <span className="font-medium text-gray-900 text-xs sm:text-sm">
                    {timelineData.find(item => item.status === 'current')?.title || 'Menunggu tahap berikutnya'}
                  </span>
                </p>
              </div>

              {/* Quick Actions */}
              {registrationStatus?.hasRegistered && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Aksi Cepat</h4>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/jurnal-harian">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
                        <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden xs:inline">Jurnal Harian</span>
                        <span className="xs:hidden">Jurnal</span>
                      </Button>
                    </Link>
                    <Link href="/tashih">
                      <Button size="sm" variant="outline" className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        Tashih
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Motivation Card */}
        {user && !isLoading && (
          <Card className="mt-8 bg-gradient-to-r from-green-600 to-green-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <Award className="h-8 w-8" />
                    <div>
                      <h3 className="text-xl font-bold">Tetap Konsisten!</h3>
                      <p className="text-green-100">
                        Ukhti telah menyelesaikan {completedCount} tahapan dari {totalCount} tahapan.
                        Pertahankan konsistensi Ukhti!
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="text-4xl font-bold">{Math.round((completedCount / totalCount) * 100)}%</div>
                  <p className="text-green-100 text-sm">Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}