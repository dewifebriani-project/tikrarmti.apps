'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMyRegistrations } from '@/hooks/useRegistrations';
import { useDashboardStats, useLearningJourney, useUserProgress } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, BookOpen, Award, Target, Calendar, TrendingUp, Edit, Clock, Phone, MapPin, Ban, Info } from 'lucide-react';
import { SWRLoadingFallback, SWRErrorFallback } from '@/lib/swr/providers';
import { EditTikrarRegistrationModal } from '@/components/EditTikrarRegistrationModal';
import { Pendaftaran } from '@/types/database';
import { ExamEligibility } from '@/types/exam';

interface TimelineItem {
  id: number;
  date: string;
  day: string;
  hijriDate: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  hasSelectionTasks?: boolean;
}

interface TimelineItemWithStatus extends TimelineItem {
  status: 'completed' | 'current' | 'future';
}

// Extended type for tikrar registration with all fields from pendaftaran_tikrar_tahfidz table
interface TikrarRegistration extends Pendaftaran {
  chosen_juz?: string;
  main_time_slot?: string;
  backup_time_slot?: string;
  full_name?: string;
  wa_phone?: string;
  address?: string;
  motivation?: string;
  oral_submission_url?: string;
  oral_submitted_at?: string;
  oral_assessment_status?: string;
  exam_status?: string;
  exam_score?: number;
  exam_submitted_at?: string;
  selection_status?: 'pending' | 'passed' | 'failed';
}

export default function PerjalananSaya() {
  const { user, isLoading: authLoading, isAuthenticated, isUnauthenticated } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [examEligibility, setExamEligibility] = useState<ExamEligibility | null>(null);

  // SWR hooks for data fetching
  const { registrations, isLoading: registrationsLoading } = useMyRegistrations();
  const { progress } = useUserProgress();
  const { journey } = useLearningJourney();

  // Fetch exam eligibility
  useEffect(() => {
    const fetchExamEligibility = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await fetch('/api/exam/eligibility');
        if (res.ok) {
          const data = await res.json();
          setExamEligibility(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch exam eligibility:', error);
      }
    };
    fetchExamEligibility();
  }, [isAuthenticated]);

  // Calculate registration status from SWR data
  const registrationStatus = useMemo(() => {
    if (!user || !registrations.length) {
      return { hasRegistered: false };
    }

    const hasActiveRegistration = registrations.some(reg => ['approved', 'pending'].includes(reg.status));
    const approvedRegistration = registrations.find(reg => reg.status === 'approved');
    const registration = (approvedRegistration || registrations[0]) as TikrarRegistration;

    return {
      hasRegistered: hasActiveRegistration,
      registration,
      hasActiveRegistration,
      pendingApproval: registrations.some(reg => reg.status === 'pending'),
      approved: !!approvedRegistration,
      hasOralSubmission: !!registration?.oral_submission_url,
      oralSubmissionUrl: registration?.oral_submission_url,
      oralSubmittedAt: registration?.oral_submitted_at,
      oralAssessmentStatus: registration?.oral_assessment_status || 'pending',
      registrationId: registration?.id,
      chosenJuz: registration?.chosen_juz,
      examStatus: registration?.exam_status,
      examScore: registration?.exam_score,
      examSubmittedAt: registration?.exam_submitted_at,
      selectionStatus: registration?.selection_status || 'pending',
    };
  }, [user, registrations]);

  const isLoading = authLoading || registrationsLoading;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper functions for display
  const getJuzLabel = (juzValue: string) => {
    const juzLabels: Record<string, string> = {
      '30A': 'Juz 30A (halaman 1-20)',
      '30B': 'Juz 30B (halaman 21-40)',
      '28A': 'Juz 28A (halaman 1-10)',
      '28B': 'Juz 28B (halaman 11-20)',
      '28': 'Juz 28',
      '29': 'Juz 29',
      '29A': 'Juz 29A (halaman 1-10)',
      '29B': 'Juz 29B (halaman 11-20)',
    };
    return juzLabels[juzValue] || `Juz ${juzValue}`;
  };

  // Check if user chose Juz 30 (no exam required)
  const isJuz30 = registrationStatus?.chosenJuz?.startsWith('30') || false;

  const getTimeSlotLabel = (slotValue: string) => {
    // Nilai di database disimpan sebagai "06-09", "18-21", dll
    const slotLabels: Record<string, string> = {
      '04-06': '04-06 WIB',
      '06-09': '06-09 WIB',
      '09-12': '09-12 WIB',
      '12-15': '12-15 WIB',
      '15-18': '15-18 WIB',
      '18-21': '18-21 WIB',
      '21-24': '21-24 WIB',
      // Legacy values untuk compatibility
      'pagi': '06-09 WIB',
      'siang': '12-15 WIB',
      'sore': '15-18 WIB',
      'malam': '18-21 WIB',
    };

    return slotLabels[slotValue] || `${slotValue} WIB`;
  };

  const handleEditSuccess = () => {
    // Trigger SWR revalidation to refresh data
    window.location.reload();
  };

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
      date: '1 - 14 Desember 2025',
      day: 'Senin - Ahad',
      hijriDate: '6 - 19 Jumadil Akhir 1446',
      title: 'Mendaftar Program',
      description: 'Pendaftaran awal program tahfidz',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 2,
      date: '15 - 28 Desember 2025',
      day: 'Senin - Ahad',
      hijriDate: '20 Jumadil Akhir - 3 Rajab 1446',
      title: 'Seleksi',
      description: 'Pengumpulan persyaratan berupa ujian seleksi lisan dan tulisan.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      hasSelectionTasks: true
    },
    {
      id: 3,
      date: '30 Desember 2025',
      day: 'Selasa',
      hijriDate: '5 Rajab 1446',
      title: 'Pengumuman Hasil Seleksi',
      description: 'Pengumuman hasil seleksi.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      hasSelectionTasks: false
    },
    {
      id: 4,
      date: '31 Desember 2025',
      day: 'Rabu',
      hijriDate: '6 Rajab 1446',
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
      date: '5 Januari 2026',
      day: 'Sabtu',
      hijriDate: '7 Rajab 1446',
      title: 'Kelas Perdana Gabungan',
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
      date: 'Pekan 1 (05-11 Jan 2026)',
      day: 'Senin - Ahad',
      hijriDate: '7 - 13 Rajab 1446',
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
      date: 'Pekan 2 - 11 (12 Jan - 22 Mar 2026)',
      day: 'Senin - Ahad',
      hijriDate: '14 Rajab - 25 Ramadhan 1446',
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
      date: 'Pekan 12 (23 - 29 Mar 2026)',
      day: 'Senin - Ahad',
      hijriDate: '26 Ramadhan - 3 Syawal 1446',
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
      date: 'Pekan 13 (30 Mar - 5 Apr 2026)',
      day: 'Senin - Ahad',
      hijriDate: '4 - 10 Syawal 1446',
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
      date: 'Pekan 14 (6 - 12 Apr 2026)',
      day: 'Senin - Ahad',
      hijriDate: '11 - 17 Syawal 1446',
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

  // Check if edit button should be shown (before re_enrollment_completed is true)
  const canEditRegistration = useMemo(() => {
    // Edit allowed if re_enrollment_completed is not true (false, null, or undefined)
    return registrationStatus?.registration?.re_enrollment_completed !== true;
  }, [registrationStatus]);

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
          cardBg: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300 shadow-lg',
          textColor: 'text-gray-900'
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

  // Prevent hydration mismatch by not rendering until mounted
  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
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
                      onClick={async () => {
                        console.log('Opening debug API...');
                        try {
                          const supabase = (await import('@/lib/supabase-singleton')).supabase;
                          const { data: { session } } = await supabase.auth.getSession();

                          const headers: Record<string, string> = {};
                          if (session?.access_token) {
                            headers['Authorization'] = `Bearer ${session.access_token}`;
                          }

                          const response = await fetch('/api/debug/registration', {
                            headers,
                            credentials: 'include'
                          });

                          const data = await response.json();
                          console.log('Debug data:', data);
                          alert(`Debug info logged to console. User ID: ${data.userInfo?.id}, Email: ${data.userInfo?.email}, Registrations by user_id: ${data.registrationsByUserId?.count}, by email: ${data.registrationsByEmail?.count}`);
                        } catch (err) {
                          console.error('Debug error:', err);
                          alert('Error getting debug info. Check console.');
                        }
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl text-green-900">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-900" />
                  <span>Status Pendaftaran</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 sm:space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Nama Lengkap</p>
                    <p className="font-medium text-sm sm:text-base">{registrationStatus.registration?.full_name || user?.full_name || 'User'}</p>
                  </div>
                  {registrationStatus.registration?.batch_name && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Batch</p>
                      <p className="font-medium text-sm sm:text-base">{registrationStatus.registration?.batch_name}</p>
                    </div>
                  )}
                </div>

                {/* Registration Details */}
                {registrationStatus.registration && (
                  <>
                    {/* Juz Selection */}
                    {registrationStatus.registration.chosen_juz && (
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-start space-x-2">
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600">Juz yang Dipilih</p>
                            <p className="font-medium text-sm sm:text-base text-green-800">
                              {getJuzLabel(registrationStatus.registration.chosen_juz)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Time Slots */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {registrationStatus.registration.main_time_slot && (
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-start space-x-2">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">Jadwal Utama</p>
                              <p className="font-medium text-sm sm:text-base text-green-800">
                                {getTimeSlotLabel(registrationStatus.registration.main_time_slot)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {registrationStatus.registration.backup_time_slot && (
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-start space-x-2">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">Jadwal Cadangan</p>
                              <p className="font-medium text-sm sm:text-base text-green-800">
                                {getTimeSlotLabel(registrationStatus.registration.backup_time_slot)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    {(registrationStatus.registration.wa_phone || registrationStatus.registration.address) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {registrationStatus.registration.wa_phone && (
                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex items-start space-x-2">
                              <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">WhatsApp</p>
                                <p className="font-medium text-sm sm:text-base text-green-800">
                                  {registrationStatus.registration.wa_phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {registrationStatus.registration.address && (
                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex items-start space-x-2">
                              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">Alamat</p>
                                <p className="font-medium text-sm sm:text-base text-green-800">
                                  {registrationStatus.registration.address}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Status Badge / Edit Button */}
                {registrationStatus.registration?.re_enrollment_completed !== true ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="text-xs sm:text-sm">Edit Pendaftaran</span>
                  </Button>
                ) : (
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                    registrationStatus.registration?.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : registrationStatus.registration?.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : registrationStatus.registration?.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      registrationStatus.registration?.status === 'approved'
                        ? 'bg-green-600'
                        : registrationStatus.registration?.status === 'pending'
                        ? 'bg-yellow-600 animate-pulse'
                        : registrationStatus.registration?.status === 'rejected'
                        ? 'bg-red-600'
                        : 'bg-gray-600'
                    }`}></span>
                    {registrationStatus.registration?.status === 'pending' ? 'Menunggu Persetujuan' :
                     registrationStatus.registration?.status === 'approved' ? 'Disetujui' :
                     registrationStatus.registration?.status === 'rejected' ? 'Ditolak' : 'Ditarik'}
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
                            {item.id === 1 && registrationStatus?.hasRegistered ? (
                              <div className="space-y-1.5">
                                <div className="flex items-start space-x-2">
                                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                                  <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                    Pendaftaran pada {(() => {
                                      const regDate = registrationStatus.registration?.registration_date || registrationStatus.registration?.submitted_at || registrationStatus.registration?.created_at;
                                      return regDate ? new Date(regDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal tidak tersedia';
                                    })()}.
                                  </p>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <CheckCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 ${registrationStatus.registration?.status === 'approved' ? 'text-green-600' : 'text-gray-500'}`} />
                                  <p className={`text-xs sm:text-sm leading-relaxed ${
                                    registrationStatus.registration?.status === 'approved' ? 'text-green-700 font-bold' :
                                    registrationStatus.registration?.status === 'pending' ? 'text-yellow-700 font-semibold' :
                                    registrationStatus.registration?.status === 'rejected' ? 'text-red-700 font-semibold' :
                                    styles.textColor
                                  }`}>
                                    Status: {registrationStatus.registration?.status === 'pending' ? 'Menunggu konfirmasi' : registrationStatus.registration?.status === 'approved' ? 'Disetujui ✓' : registrationStatus.registration?.status === 'rejected' ? 'Ditolak' : 'Ditarik'}
                                  </p>
                                </div>
                              </div>
                            ) : item.hasSelectionTasks && registrationStatus?.registration?.status === 'approved' ? (
                              <div className="space-y-3">
                                <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                  {item.description}
                                </p>

                                {/* Debug log for selection tasks */}
                                {(() => {
                                  console.log('🔍 Selection Tasks Debug:', {
                                    hasSelectionTasks: item.hasSelectionTasks,
                                    registrationStatus: registrationStatus?.registration?.status,
                                    userId: user?.id,
                                    userRole: user?.role
                                  });
                                  return null;
                                })()}

                                {/* Information message for students */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                                  <div className="flex items-start space-x-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <h4 className="text-sm font-semibold text-green-800 mb-1">Fitur Seleksi Sudah Dibuka!</h4>
                                      <p className="text-xs text-green-700">
                                        Silakan klik card di bawah untuk mengerjakan ujian seleksi. Pastikan <em>Ukhti</em> sudah menyiapkan diri dengan baik.
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                  {/* Card Rekam Suara - Always clickable */}
                                  {registrationStatus?.hasOralSubmission ? (
                                    <Link href="/seleksi/rekam-suara">
                                      <Card className={`border-2 border-green-300 bg-green-50 hover:bg-green-100 cursor-pointer transition-all duration-200 hover:shadow-md`}>
                                        <CardContent className="p-3 sm:p-4">
                                          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center`}>
                                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                            </div>
                                            <div className="flex-grow">
                                              <h4 className="text-sm sm:text-base font-semibold text-green-900">Rekam Suara</h4>
                                              <p className="text-xs text-green-700">Sudah terkirim - Klik untuk lihat</p>
                                            </div>
                                          </div>
                                          <p className="text-xs text-green-800 mb-2">
                                            Dikirim: {registrationStatus?.oralSubmittedAt ? new Date(registrationStatus.oralSubmittedAt).toLocaleDateString('id-ID') : '-'}
                                          </p>
                                          <p className="text-xs text-gray-600 italic">
                                            Status: {registrationStatus?.oralAssessmentStatus === 'pending' ? 'Menunggu penilaian' :
                                                     registrationStatus?.oralAssessmentStatus === 'pass' ? 'Lulus' :
                                                     registrationStatus?.oralAssessmentStatus === 'fail' ? 'Tidak lulus' : 'Belum dinilai'}
                                          </p>
                                        </CardContent>
                                      </Card>
                                    </Link>
                                  ) : (
                                    <Link href="/seleksi/rekam-suara">
                                      <Card className={`border-2 border-red-300 bg-white hover:bg-red-50 cursor-pointer transition-all duration-200 hover:shadow-md`}>
                                        <CardContent className="p-3 sm:p-4">
                                          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center`}>
                                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                              </svg>
                                            </div>
                                            <div className="flex-grow">
                                              <h4 className="text-sm sm:text-base font-semibold text-red-900">Rekam Suara</h4>
                                              <p className="text-xs text-red-700">Ujian lisan - Klik untuk mulai</p>
                                            </div>
                                          </div>
                                          <p className="text-xs text-red-800 font-medium">
                                            Klik untuk merekam bacaan Al-Fath ayat 29
                                          </p>
                                        </CardContent>
                                      </Card>
                                    </Link>
                                  )}

                                  {/* Card Pilihan Ganda - Available for all users during selection period */}
                                  {isJuz30 ? (
                                    // Juz 30 - No exam required
                                    <Card className={`border-2 border-gray-300 bg-gray-50`}>
                                      <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                                          <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center`}>
                                            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                          </div>
                                          <div className="flex-grow">
                                            <h4 className="text-sm sm:text-base font-semibold text-gray-900">Pilihan Ganda</h4>
                                            <p className="text-xs text-gray-700">Tidak wajib ujian</p>
                                          </div>
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium">
                                          Untuk Juz 30, hanya diperlukan rekaman suara
                                        </p>
                                      </CardContent>
                                    </Card>
                                  ) : registrationStatus?.examStatus === 'submitted' ? (
                                    <>
                                      <Link href="/seleksi/pilihan-ganda/review">
                                        <Card className={`border-2 border-green-300 bg-green-50 hover:bg-green-100 cursor-pointer transition-all duration-200 hover:shadow-md`}>
                                          <CardContent className="p-3 sm:p-4">
                                            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                                              <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center`}>
                                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                              </div>
                                              <div className="flex-grow">
                                                <h4 className="text-sm sm:text-base font-semibold text-green-900">Pilihan Ganda</h4>
                                                <p className="text-xs text-green-700">Sudah dikerjakan - Klik untuk lihat hasil</p>
                                              </div>
                                            </div>
                                            <p className="text-xs text-green-800 mb-2">
                                              Nilai: {registrationStatus?.examScore ?? '-'}/100
                                            </p>
                                            <p className="text-xs text-gray-600 italic">
                                              Dikirim: {registrationStatus?.examSubmittedAt ? new Date(registrationStatus.examSubmittedAt).toLocaleDateString('id-ID') : '-'}
                                            </p>
                                          </CardContent>
                                        </Card>
                                      </Link>
                                    </>
                                  ) : examEligibility?.attemptsRemaining === 0 ? (
                                    // Max attempts reached - disabled card
                                    <Card className={`border-2 border-red-300 bg-red-50 cursor-not-allowed opacity-70`}>
                                      <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                                          <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center`}>
                                            <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                          </div>
                                          <div className="flex-grow">
                                            <h4 className="text-sm sm:text-base font-semibold text-red-900">Pilihan Ganda</h4>
                                            <p className="text-xs text-red-700">Kesempatan ujian habis</p>
                                          </div>
                                        </div>
                                        <p className="text-xs text-red-800 font-medium">
                                          Telah digunakan {examEligibility.attemptsUsed}/{examEligibility.maxAttempts}x percobaan
                                        </p>
                                      </CardContent>
                                    </Card>
                                  ) : (
                                    <Link href="/seleksi/pilihan-ganda">
                                      <Card className={`border-2 border-purple-300 bg-purple-50 hover:bg-purple-100 cursor-pointer transition-all duration-200 hover:shadow-md`}>
                                        <CardContent className="p-3 sm:p-4">
                                          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-purple-200 rounded-full flex items-center justify-center`}>
                                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                              </svg>
                                            </div>
                                            <div className="flex-grow">
                                              <h4 className="text-sm sm:text-base font-semibold text-purple-900">Pilihan Ganda</h4>
                                              <p className="text-xs text-purple-700">Ujian tulisan - Klik untuk mulai</p>
                                            </div>
                                          </div>
                                          <p className="text-xs text-purple-800 font-medium">
                                            Ujian pilihan ganda tentang Al-Qur'an
                                          </p>
                                        </CardContent>
                                      </Card>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            ) : item.hasSelectionTasks && (!registrationStatus?.hasRegistered || registrationStatus?.registration?.status !== 'approved') ? (
                              <div className="space-y-2">
                                <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                  {item.description}
                                </p>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3">
                                  <p className="text-xs text-yellow-800">
                                    <span className="font-semibold">Status:</span> Menunggu konfirmasi admin untuk membuka tahapan seleksi
                                  </p>
                                </div>
                              </div>
                            ) : item.id === 3 ? (
                              // Lulus Seleksi - Tampilkan pesan berdasarkan status kelulusan
                              (() => {
                                const hasPassedOral = registrationStatus?.oralAssessmentStatus === 'pass';
                                // Cek apakah user mengambil juz 30 (tidak wajib ujian pilihan ganda)
                                const isJuz30 = registrationStatus?.chosenJuz?.startsWith('30');
                                // Untuk juz 30, hanya butuh lulus rekam suara. Untuk juz lain, butuh lulus keduanya dengan nilai >= 70
                                const hasPassedExam = !isJuz30 && registrationStatus?.examStatus === 'completed' && (registrationStatus?.examScore ?? 0) >= 70;
                                const hasPassedSelection = hasPassedOral && (isJuz30 || hasPassedExam);

                                if (hasPassedSelection) {
                                  return (
                                    <div className="space-y-3">
                                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 sm:p-4">
                                        <div className="flex items-start space-x-3">
                                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <h4 className="text-base sm:text-lg font-bold text-green-900 mb-2">Selamat! Ukhti Lulus Seleksi</h4>
                                            <p className="text-xs sm:text-sm text-green-800 leading-relaxed">
                                              Alhamdulillah, Ukhti telah lulus seleksi penerimaan program Tikrar Tahfidz.
                                              Teruslah bermuhasabah dan perbaiki diri demi menjadi hafidzah yang lebih baik.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className={`grid ${isJuz30 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                          <p className="text-xs text-gray-600">Rekam Suara</p>
                                          <p className="text-sm font-bold text-green-700">Lulus ✓</p>
                                        </div>
                                        {!isJuz30 && (
                                          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                            <p className="text-xs text-gray-600">Pilihan Ganda</p>
                                            <p className="text-sm font-bold text-green-700">{registrationStatus?.examScore ?? 0} - Lulus ✓</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                } else if (registrationStatus?.oralAssessmentStatus === 'fail' || (!isJuz30 && registrationStatus?.examStatus === 'completed' && (registrationStatus?.examScore ?? 0) < 70)) {
                                  return (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                                      <div className="flex items-start space-x-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <h4 className="text-sm font-semibold text-red-800 mb-1">Belum Lulus Seleksi</h4>
                                          <p className="text-xs text-red-700">
                                            Mohon maaf, Ukhti belum lulus seleksi. Jangan menyerah, teruslah berikhtiar dan berdoa.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                } else if (registrationStatus?.oralAssessmentStatus === 'pending' || (!isJuz30 && registrationStatus?.examStatus !== 'completed')) {
                                  return (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                                      <div className="flex items-start space-x-3">
                                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <h4 className="text-sm font-semibold text-yellow-800 mb-1">Menunggu Hasil Seleksi</h4>
                                          <p className="text-xs text-yellow-700">
                                            Hasil seleksi akan diumumkan pada tanggal yang telah ditentukan.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                    {item.description}
                                  </p>
                                );
                              })()
                            ) : (
                              <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                {item.description}
                              </p>
                            )}
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
                              {item.id === 1 && registrationStatus?.hasRegistered ? (
                                <div className="space-y-2">
                                  <div className="flex items-start space-x-2">
                                    <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                                    <p className={`text-sm ${styles.textColor} leading-relaxed`}>
                                      Pendaftaran pada {(() => {
                                        const regDate = registrationStatus.registration?.registration_date || registrationStatus.registration?.submitted_at || registrationStatus.registration?.created_at;
                                        return regDate ? new Date(regDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal tidak tersedia';
                                      })()}.
                                    </p>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${registrationStatus.registration?.status === 'approved' ? 'text-green-600' : 'text-gray-500'}`} />
                                    <p className={`text-sm leading-relaxed ${
                                      registrationStatus.registration?.status === 'approved' ? 'text-green-700 font-bold' :
                                      registrationStatus.registration?.status === 'pending' ? 'text-yellow-700 font-semibold' :
                                      registrationStatus.registration?.status === 'rejected' ? 'text-red-700 font-semibold' :
                                      styles.textColor
                                    }`}>
                                      Status: {registrationStatus.registration?.status === 'pending' ? 'Menunggu konfirmasi' : registrationStatus.registration?.status === 'approved' ? 'Disetujui ✓' : registrationStatus.registration?.status === 'rejected' ? 'Ditolak' : 'Ditarik'}
                                    </p>
                                  </div>
                                </div>
                              ) : item.hasSelectionTasks && registrationStatus?.registration?.status === 'approved' ? (
                                <div className="space-y-3">
                                  <p className={`text-sm ${styles.textColor} leading-relaxed`}>
                                    {item.description}
                                  </p>

                                  {/* Information message for students */}
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-start space-x-3">
                                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <h4 className="text-sm font-semibold text-green-800 mb-1">Fitur Seleksi Sudah Dibuka!</h4>
                                        <p className="text-xs text-green-700">
                                          Silakan klik card di bawah untuk mengerjakan ujian seleksi. Pastikan <em>Ukhti</em> sudah menyiapkan diri dengan baik.
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    {/* Card Rekam Suara - Always clickable */}
                                    {registrationStatus?.hasOralSubmission ? (
                                      <Link href="/seleksi/rekam-suara">
                                        <Card className={`border-2 border-green-300 bg-green-50 hover:bg-green-100 cursor-pointer transition-all duration-200 hover:shadow-md`}>
                                          <CardContent className="p-4">
                                            <div className="flex items-center space-x-3 mb-2">
                                              <div className={`w-10 h-10 bg-green-100 rounded-full flex items-center justify-center`}>
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                              </div>
                                              <div className="flex-grow">
                                                <h4 className="text-base font-semibold text-green-900">Rekam Suara</h4>
                                                <p className="text-sm text-green-700">Sudah terkirim - Klik untuk lihat</p>
                                              </div>
                                            </div>
                                            <p className="text-sm text-green-800 mb-2">
                                              Dikirim: {registrationStatus?.oralSubmittedAt ? new Date(registrationStatus.oralSubmittedAt).toLocaleDateString('id-ID') : '-'}
                                            </p>
                                            <p className="text-xs text-gray-600 italic">
                                              Status: {registrationStatus?.oralAssessmentStatus === 'pending' ? 'Menunggu penilaian' :
                                                       registrationStatus?.oralAssessmentStatus === 'pass' ? 'Lulus' :
                                                       registrationStatus?.oralAssessmentStatus === 'fail' ? 'Tidak lulus' : 'Belum dinilai'}
                                            </p>
                                          </CardContent>
                                        </Card>
                                      </Link>
                                    ) : (
                                      <Link href="/seleksi/rekam-suara">
                                        <Card className={`border-2 border-red-300 bg-white hover:bg-red-50 cursor-pointer transition-all duration-200 hover:shadow-md`}>
                                          <CardContent className="p-4">
                                            <div className="flex items-center space-x-3 mb-2">
                                              <div className={`w-10 h-10 bg-red-100 rounded-full flex items-center justify-center`}>
                                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                </svg>
                                              </div>
                                              <div className="flex-grow">
                                                <h4 className="text-base font-semibold text-red-900">Rekam Suara</h4>
                                                <p className="text-sm text-red-700">Ujian lisan - Klik untuk mulai</p>
                                              </div>
                                            </div>
                                            <p className="text-sm text-red-800 font-medium">
                                              Klik untuk merekam bacaan Al-Fath ayat 29
                                            </p>
                                          </CardContent>
                                        </Card>
                                      </Link>
                                    )}

                                    {/* Card Pilihan Ganda - Available for all users during selection period */}
                                    {isJuz30 ? (
                                      // Juz 30 - No exam required
                                      <Card className={`border-2 border-gray-300 bg-gray-50`}>
                                        <CardContent className="p-4">
                                          <div className="flex items-center space-x-3 mb-2">
                                            <div className={`w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center`}>
                                              <Info className="w-5 h-5 text-gray-600" />
                                            </div>
                                            <div className="flex-grow">
                                              <h4 className="text-base font-semibold text-gray-900">Pilihan Ganda</h4>
                                              <p className="text-sm text-gray-700">Tidak wajib ujian</p>
                                            </div>
                                          </div>
                                          <p className="text-sm text-gray-600 font-medium">
                                            Untuk Juz 30, hanya diperlukan rekaman suara
                                          </p>
                                        </CardContent>
                                      </Card>
                                    ) : registrationStatus?.examStatus === 'submitted' ? (
                                      <Link href="/seleksi/pilihan-ganda">
                                        <Card className={`border-2 border-green-300 bg-green-50 hover:bg-green-100 cursor-pointer transition-all duration-200 hover:shadow-md`}>
                                          <CardContent className="p-4">
                                            <div className="flex items-center space-x-3 mb-2">
                                              <div className={`w-10 h-10 bg-green-100 rounded-full flex items-center justify-center`}>
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                              </div>
                                              <div className="flex-grow">
                                                <h4 className="text-base font-semibold text-green-900">Pilihan Ganda</h4>
                                                <p className="text-sm text-green-700">Sudah dikerjakan - Klik untuk lihat</p>
                                              </div>
                                            </div>
                                            <p className="text-sm text-green-800 mb-2">
                                              Nilai: {registrationStatus?.examScore ?? '-'}/100
                                            </p>
                                            <p className="text-sm text-gray-600 italic">
                                              Dikirim: {registrationStatus?.examSubmittedAt ? new Date(registrationStatus.examSubmittedAt).toLocaleDateString('id-ID') : '-'}
                                            </p>
                                          </CardContent>
                                        </Card>
                                      </Link>
                                    ) : examEligibility?.attemptsRemaining === 0 ? (
                                      // Max attempts reached - disabled card
                                      <Card className={`border-2 border-red-300 bg-red-50 cursor-not-allowed opacity-70`}>
                                        <CardContent className="p-4">
                                          <div className="flex items-center space-x-3 mb-2">
                                            <div className={`w-10 h-10 bg-red-100 rounded-full flex items-center justify-center`}>
                                              <Ban className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div className="flex-grow">
                                              <h4 className="text-base font-semibold text-red-900">Pilihan Ganda</h4>
                                              <p className="text-sm text-red-700">Kesempatan ujian habis</p>
                                            </div>
                                          </div>
                                          <p className="text-sm text-red-800 font-medium">
                                            Telah digunakan {examEligibility.attemptsUsed}/{examEligibility.maxAttempts}x percobaan
                                          </p>
                                        </CardContent>
                                      </Card>
                                    ) : (
                                      <Link href="/seleksi/pilihan-ganda">
                                        <Card className={`border-2 border-purple-300 bg-purple-50 hover:bg-purple-100 cursor-pointer transition-all duration-200 hover:shadow-md`}>
                                          <CardContent className="p-4">
                                            <div className="flex items-center space-x-3 mb-2">
                                              <div className={`w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center`}>
                                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                </svg>
                                              </div>
                                              <div className="flex-grow">
                                                <h4 className="text-base font-semibold text-purple-900">Pilihan Ganda</h4>
                                                <p className="text-sm text-purple-700">Ujian tulisan - Klik untuk mulai</p>
                                              </div>
                                            </div>
                                            <p className="text-sm text-purple-800 font-medium">
                                              Ujian pilihan ganda tentang Al-Qur'an
                                            </p>
                                          </CardContent>
                                        </Card>
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              ) : item.hasSelectionTasks && (!registrationStatus?.hasRegistered || registrationStatus?.registration?.status !== 'approved') ? (
                                <div className="space-y-2">
                                  <p className={`text-sm ${styles.textColor} leading-relaxed`}>
                                    {item.description}
                                  </p>
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800">
                                      <span className="font-semibold">Status:</span> Menunggu konfirmasi admin untuk membuka tahapan seleksi
                                    </p>
                                  </div>
                                </div>
                              ) : item.id === 3 ? (
                                // Lulus Seleksi - Desktop view
                                (() => {
                                  const hasPassedOral = registrationStatus?.oralAssessmentStatus === 'pass';
                                  // Cek apakah user mengambil juz 30 (tidak wajib ujian pilihan ganda)
                                  const isJuz30 = registrationStatus?.chosenJuz?.startsWith('30');
                                  // Untuk juz 30, hanya butuh lulus rekam suara. Untuk juz lain, butuh lulus keduanya dengan nilai >= 70
                                  const hasPassedExam = !isJuz30 && registrationStatus?.examStatus === 'completed' && (registrationStatus?.examScore ?? 0) >= 70;
                                  const hasPassedSelection = hasPassedOral && (isJuz30 || hasPassedExam);

                                  if (hasPassedSelection) {
                                    return (
                                      <div className="space-y-3">
                                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                                          <div className="flex items-start space-x-3">
                                            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                              <h4 className="text-lg font-bold text-green-900 mb-2">Selamat! Ukhti Lulus Seleksi</h4>
                                              <p className="text-sm text-green-800 leading-relaxed">
                                                Alhamdulillah, Ukhti telah lulus seleksi penerimaan program Tikrar Tahfidz.
                                                Teruslah bermuhasabah dan perbaiki diri demi menjadi hafidzah yang lebih baik.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className={`grid ${isJuz30 ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <p className="text-sm text-gray-600">Rekam Suara</p>
                                            <p className="text-base font-bold text-green-700">Lulus ✓</p>
                                          </div>
                                          {!isJuz30 && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                              <p className="text-sm text-gray-600">Pilihan Ganda</p>
                                              <p className="text-base font-bold text-green-700">{registrationStatus?.examScore ?? 0} - Lulus ✓</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  } else if (registrationStatus?.oralAssessmentStatus === 'fail' || (!isJuz30 && registrationStatus?.examStatus === 'completed' && (registrationStatus?.examScore ?? 0) < 70)) {
                                    return (
                                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-start space-x-3">
                                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <h4 className="text-sm font-semibold text-red-800 mb-1">Belum Lulus Seleksi</h4>
                                            <p className="text-sm text-red-700">
                                              Mohon maaf, Ukhti belum lulus seleksi. Jangan menyerah, teruslah berikhtiar dan berdoa.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  } else if (registrationStatus?.oralAssessmentStatus === 'pending' || (!isJuz30 && registrationStatus?.examStatus !== 'completed')) {
                                    return (
                                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start space-x-3">
                                          <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <h4 className="text-sm font-semibold text-yellow-800 mb-1">Menunggu Hasil Seleksi</h4>
                                            <p className="text-sm text-yellow-700">
                                              Hasil seleksi akan diumumkan pada tanggal yang telah ditentukan.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <p className={`text-sm ${styles.textColor} leading-relaxed`}>
                                      {item.description}
                                    </p>
                                  );
                                })()
                              ) : (
                                <p className={`text-sm ${styles.textColor} leading-relaxed`}>
                                  {item.description}
                                </p>
                              )}
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

        {/* Edit Registration Modal */}
        {registrationStatus?.registration && (
          <EditTikrarRegistrationModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            registration={{
              id: registrationStatus.registration.id || registrationStatus.registrationId || '',
              chosen_juz: registrationStatus.registration.chosen_juz || '',
              main_time_slot: registrationStatus.registration.main_time_slot || '',
              backup_time_slot: registrationStatus.registration.backup_time_slot || '',
              full_name: registrationStatus.registration.full_name || user?.full_name,
              wa_phone: registrationStatus.registration.wa_phone,
              address: registrationStatus.registration.address,
              motivation: registrationStatus.registration.motivation,
            }}
          />
        )}
      </div>
    );
}