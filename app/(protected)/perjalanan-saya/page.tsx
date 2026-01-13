'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMyRegistrations } from '@/hooks/useRegistrations';
import { useDashboardStats, useLearningJourney, useUserProgress } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, BookOpen, Award, Target, Calendar, TrendingUp, Edit, Clock, Phone, MapPin, Ban, Info, RotateCcw, FileText } from 'lucide-react';
import { SWRLoadingFallback, SWRErrorFallback } from '@/lib/swr/providers';
import { EditTikrarRegistrationModal } from '@/components/EditTikrarRegistrationModal';
import { Pendaftaran } from '@/types/database';
import { ExamEligibility } from '@/types/exam';
import { useBatchTimeline } from '@/hooks/useBatchTimeline';
import { formatFullDateIndo, formatDateIndo, getDayNameIndo, toHijri } from '@/lib/utils/date-helpers';

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
  oral_score?: number;
  oral_assessment_status?: string;
  exam_score?: number;
  written_quiz_submitted_at?: string;
  selection_status?: 'pending' | 'selected' | 'not_selected' | 'waitlist';
  daftar_ulang?: {
    id: string;
    akad_files?: Array<{ url: string; name: string }>;
    submitted_at?: string;
    status?: string;
    ujian_halaqah?: {
      id: string;
      name: string;
      day_of_week: string;
      start_time: string;
      end_time: string;
    } | null;
    tashih_halaqah?: {
      id: string;
      name: string;
      day_of_week: string;
      start_time: string;
      end_time: string;
    } | null;
    [key: string]: any;
  } | null;
}

export default function PerjalananSaya() {
  const { user, isLoading: authLoading, isAuthenticated, isUnauthenticated } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [examEligibility, setExamEligibility] = useState<ExamEligibility | null>(null);
  const [hasSessionError, setHasSessionError] = useState(false);

  // SWR hooks for data fetching
  const { registrations, isLoading: registrationsLoading, error: registrationsError } = useMyRegistrations();
  const { progress } = useUserProgress();
  const { journey } = useLearningJourney();

  // Get batch_id from registration - safely handle undefined registrations
  const batchId = useMemo(() => {
    if (registrations && registrations.length > 0) {
      return registrations[0]?.batch_id || null;
    }
    return null;
  }, [registrations]);

  // Fetch batch timeline data - safely handle undefined registrations
  const { batch, timeline: batchTimeline, isLoading: batchLoading } = useBatchTimeline(batchId, {
    registrationStatus: registrations && registrations[0]?.status === 'completed' ? 'approved' : registrations?.[0]?.status as any,
    selectionStatus: registrations?.[0]?.selection_status
  });

  // Debug log for admin button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[PerjalananSai] Admin button debug:', {
        userRoles: user?.roles,
        userRoleLegacy: (user as any)?.role,
        batchId,
        isAdmin: user?.roles?.includes('admin'),
        isAdminLegacy: (user as any)?.role === 'admin',
        isAdminWithFallback: user?.roles?.includes('admin') || (user as any)?.role === 'admin',
        showButton: ((user?.roles?.includes('admin') || (user as any)?.role === 'admin')) && batchId
      });
    }
  }, [user, batchId]);

  // Debug log for batch data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[PerjalananSaya Page] Batch data:', {
        batchId,
        batchLoading,
        hasBatch: !!batch,
        batchDates: batch ? {
          registration_start: batch.registration_start_date,
          registration_end: batch.registration_end_date,
          selection_start: batch.selection_start_date,
          selection_end: batch.selection_end_date,
          selection_result: batch.selection_result_date,
          re_enrollment: batch.re_enrollment_date,
          opening_class: batch.opening_class_date,
        } : null,
        willUseDynamic: !!(batch && (batch.registration_start_date || batch.re_enrollment_date || batch.opening_class_date))
      });
    }
  }, [batch, batchId, batchLoading]);

  // Fetch exam eligibility
  // FIXED: Don't fetch directly in useEffect, use SWR hook instead (follows arsitektur.md)
  // For now, disable this to prevent error
  /*
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
  */

  // Calculate registration status from SWR data - safely handle undefined registrations
  const registrationStatus = useMemo(() => {
    if (!user || !registrations || registrations.length === 0) {
      return { hasRegistered: false };
    }

    // hasRegistered = true for anyone with registration (except withdrawn)
    // This allows rejected users to still see their journey timeline
    const hasAnyRegistration = registrations.some(reg => reg.status !== 'withdrawn');
    const hasActiveRegistration = registrations.some(reg => ['approved', 'pending'].includes(reg.status));
    const approvedRegistration = registrations.find(reg => reg.status === 'approved');
    const registration = (approvedRegistration || registrations[0]) as TikrarRegistration;

    // Debug log untuk daftar_ulang
    console.log('[PerjalananSaya] Registration debug:', {
      totalRegistrations: registrations.length,
      allRegistrations: registrations.map(r => ({ id: r.id, status: r.status })),
      registrationId: registration?.id,
      registrationStatus: registration?.status,
      hasAnyRegistration,
      hasActiveRegistration,
      approved: !!approvedRegistration,
      rejected: registrations.some(reg => reg.status === 'rejected'),
      hasDaftarUlang: !!registration?.daftar_ulang,
      daftarUlang: registration?.daftar_ulang,
      reEnrollmentCompleted: registration?.re_enrollment_completed
    });

    return {
      hasRegistered: hasAnyRegistration, // Show timeline for all registered users (including rejected)
      registration,
      hasActiveRegistration,
      pendingApproval: registrations.some(reg => reg.status === 'pending'),
      approved: !!approvedRegistration,
      rejected: registrations.some(reg => reg.status === 'rejected'),
      // Consider having oral assessment as having submitted (even without url if admin input score manually)
      hasOralSubmission: !!(
        registration?.oral_submission_url ||
        (registration?.oral_assessment_status && registration?.oral_assessment_status !== 'pending') ||
        (registration?.oral_score != null && registration?.oral_score > 0)
      ),
      oralSubmissionUrl: registration?.oral_submission_url,
      oralSubmittedAt: registration?.oral_submitted_at,
      oralAssessmentStatus: registration?.oral_assessment_status || 'pending',
      registrationId: registration?.id,
      chosenJuz: registration?.chosen_juz,
      examScore: registration?.exam_score,
      writtenQuizSubmittedAt: registration?.written_quiz_submitted_at,
      selectionStatus: registration?.selection_status || 'pending',
    };
  }, [user, registrations]);

  const isLoading = authLoading || registrationsLoading;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper to get icon based on type - define BEFORE useMemo to avoid circular dependency
  const getIconForType = (type: string) => {
    // Return default icon for now
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
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

  // Create timeline data from batch or fallback to hardcoded data
  const baseTimelineData: TimelineItem[] = useMemo(() => {
    // If we have batch data with any timeline dates, use it to create timeline
    if (batch && (batch.registration_start_date || batch.re_enrollment_date || batch.opening_class_date)) {
      // Helper to format date range
      const formatDateRange = (start: string | null | undefined, end: string | null | undefined): string => {
        if (!start || !end) return '';
        return `${formatDateIndo(start)} - ${formatDateIndo(end)}`;
      };

      const items: TimelineItem[] = [];

      // 1. Registration
      if (batch.registration_start_date && batch.registration_end_date) {
        items.push({
          id: 1,
          date: formatDateRange(batch.registration_start_date, batch.registration_end_date),
          day: 'Senin - Ahad',
          hijriDate: batch.registration_start_date ? toHijri(batch.registration_start_date) : '6 - 19 Jumadil Akhir 1446',
          title: 'Mendaftar Program',
          description: 'Pendaftaran awal program tahfidz',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        });
      }

      // 2. Selection
      if (batch.selection_start_date && batch.selection_end_date) {
        items.push({
          id: 2,
          date: formatDateRange(batch.selection_start_date, batch.selection_end_date),
          day: 'Senin - Ahad',
          hijriDate: batch.selection_start_date ? toHijri(batch.selection_start_date) : '20 Jumadil Akhir - 3 Rajab 1446',
          title: 'Seleksi',
          description: 'Pengumpulan persyaratan berupa ujian seleksi lisan dan tulisan.',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
          hasSelectionTasks: true
        });
      }

      // 3. Selection Result
      if (batch.selection_result_date) {
        items.push({
          id: 3,
          date: formatDateIndo(batch.selection_result_date),
          day: getDayNameIndo(batch.selection_result_date),
          hijriDate: toHijri(batch.selection_result_date),
          title: 'Pengumuman Hasil Seleksi',
          description: 'Pengumuman hasil seleksi.',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          hasSelectionTasks: false
        });
      }

      // 4. Re-enrollment
      if (batch.re_enrollment_date) {
        items.push({
          id: 4,
          date: formatDateIndo(batch.re_enrollment_date),
          day: getDayNameIndo(batch.re_enrollment_date),
          hijriDate: toHijri(batch.re_enrollment_date),
          title: 'Mendaftar Ulang',
          description: 'Konfirmasi keikutsertaan dan pengumpulan akad daftar ulang.',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        });
      }

      // 5. Opening Class
      if (batch.opening_class_date) {
        items.push({
          id: 5,
          date: formatDateIndo(batch.opening_class_date),
          day: getDayNameIndo(batch.opening_class_date),
          hijriDate: toHijri(batch.opening_class_date),
          title: 'Kelas Perdana Gabungan',
          description: 'Awal resmi program tahfidz dengan orientasi dan penentuan target.',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        });
      }

      // 6. First Week (Tashih)
      if (batch.first_week_start_date && batch.first_week_end_date) {
        items.push({
          id: 6,
          date: `Pekan 1 (${formatDateRange(batch.first_week_start_date, batch.first_week_end_date)})`,
          day: getDayNameIndo(batch.first_week_start_date),
          hijriDate: toHijri(batch.first_week_start_date),
          title: 'Pekan 1 - Tashih',
          description: 'Minggu pertama pembelajaran - Tashih',
          icon: getIconForType('learning')
        });
      }

      // 7. Main Learning (Weeks 2-11)
      if (batch.first_week_end_date && batch.review_week_start_date) {
        const week2Start = new Date(batch.first_week_end_date);
        week2Start.setDate(week2Start.getDate() + 1);
        const week11End = new Date(batch.review_week_start_date);
        week11End.setDate(week11End.getDate() - 1);
        items.push({
          id: 7,
          date: `Pekan 2-11 (${formatDateIndo(week2Start.toISOString().split('T')[0])} - ${formatDateIndo(week11End.toISOString().split('T')[0])})`,
          day: getDayNameIndo(batch.first_week_end_date),
          hijriDate: toHijri(batch.first_week_end_date),
          title: 'Pekan 2-11 - Pembelajaran',
          description: '10 minggu pembelajaran inti - Hafalan & Muraja\'ah',
          icon: getIconForType('learning')
        });
      }

      // 8. Review Week
      if (batch.review_week_start_date && batch.review_week_end_date) {
        items.push({
          id: 8,
          date: `Pekan 12 (${formatDateRange(batch.review_week_start_date, batch.review_week_end_date)})`,
          day: getDayNameIndo(batch.review_week_start_date),
          hijriDate: toHijri(batch.review_week_start_date),
          title: 'Pekan 12 - Muraja\'ah',
          description: 'Minggu pengulangan dan persiapan ujian',
          icon: getIconForType('learning')
        });
      }

      // 9. Final Exam
      if (batch.final_exam_start_date && batch.final_exam_end_date) {
        items.push({
          id: 9,
          date: `Pekan 13 (${formatDateRange(batch.final_exam_start_date, batch.final_exam_end_date)})`,
          day: getDayNameIndo(batch.final_exam_start_date),
          hijriDate: toHijri(batch.final_exam_start_date),
          title: 'Pekan 13 - Ujian Akhir',
          description: 'Ujian akhir tahfidz',
          icon: getIconForType('assessment')
        });
      }

      // 10. Graduation
      if (batch.graduation_start_date && batch.graduation_end_date) {
        items.push({
          id: 10,
          date: `Pekan 14 (${formatDateRange(batch.graduation_start_date, batch.graduation_end_date)})`,
          day: getDayNameIndo(batch.graduation_start_date),
          hijriDate: toHijri(batch.graduation_start_date),
          title: 'Pekan 14 - Wisuda',
          description: 'Wisuda dan pemberian sertifikat',
          icon: getIconForType('completion')
        });
      }

      return items;
    }

    // No batch data - return empty array
    return [];
  }, [batch, getIconForType]);

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

      // Special handling for selection result (id: 3)
      // If user is already selected or not selected, mark selection phases as completed
      const isSelected = registrationStatus?.selectionStatus === 'selected';
      const isNotSelected = registrationStatus?.selectionStatus === 'not_selected';
      const isWaitlist = registrationStatus?.selectionStatus === 'waitlist';

      if (item.id === 2 && (isSelected || isNotSelected || isWaitlist)) {
        // Oral test - completed if selection status is determined
        return {
          ...item,
          status: 'completed' as const
        };
      }

      if (item.id === 3) {
        // Selection result
        if (isSelected || isNotSelected || isWaitlist) {
          // If selection status is determined, this is completed
          return {
            ...item,
            status: 'completed' as const
          };
        }
        // Otherwise, check the date
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
  }, [isClient, registrationStatus, baseTimelineData, parseIndonesianDate]);

  // Check if edit button should be shown (before re_enrollment_completed is true)
  const canEditRegistration = useMemo(() => {
    // Edit allowed if re_enrollment_completed is not true (false, null, or undefined)
    return registrationStatus?.registration?.re_enrollment_completed !== true;
  }, [registrationStatus]);

  const completedCount = timelineData.filter(item => item.status === 'completed').length;
  const totalCount = timelineData.length;

  // Handle session expired error - must be before conditional returns
  useEffect(() => {
    if (registrationsError && (registrationsError as any).code === 'SESSION_EXPIRED') {
      setHasSessionError(true);
      // Redirect to login after a short delay
      const timer = setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [registrationsError]);

  // Helper functions for display - must be before conditional returns
  const getJuzLabel = (juzValue: string) => {
    const juzLabels: Record<string, string> = {
      '30A': 'Juz 30A (halaman 1-10)',
      '30B': 'Juz 30B (halaman 11-24)',
      '28A': 'Juz 28A (halaman 1-10)',
      '28B': 'Juz 28B (halaman 11-20)',
      '1A': 'Juz 1A (halaman 1-10)',
      '1B': 'Juz 1B (halaman 11-20)',
      '28': 'Juz 28',
      '29': 'Juz 29',
      '29A': 'Juz 29A (halaman 1-10)',
      '29B': 'Juz 29B (halaman 11-20)',
      '1': 'Juz 1',
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

  // Don't render if session expired
  if (hasSessionError) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Sesi Berakhir</h3>
            <p className="text-yellow-700 mb-4">Mohon login kembali untuk melanjutkan.</p>
            <p className="text-sm text-yellow-600">Mengalihkan ke halaman login...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                          // API handles auth server-side via cookies (no client-side auth check)
                          // Follows arsitektur.md: No client-side auth checks
                          const response = await fetch('/api/debug/registration', {
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
                    className="border-green-300 text-green-700 hover:bg-green-100 min-h-[44px] sm:min-h-0"
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

        {/* Daftar Ulang Status Card */}
        {registrationStatus?.registration?.daftar_ulang && (
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl text-orange-900">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-orange-900" />
                  <span>Status Daftar Ulang</span>
                </CardTitle>
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                  registrationStatus.registration.re_enrollment_completed === true
                    ? 'bg-green-100 text-green-800'
                    : registrationStatus.registration.daftar_ulang?.status === 'submitted'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    registrationStatus.registration.re_enrollment_completed === true
                      ? 'bg-green-600'
                      : registrationStatus.registration.daftar_ulang?.status === 'submitted'
                      ? 'bg-yellow-600 animate-pulse'
                      : 'bg-gray-600'
                  }`}></span>
                  {registrationStatus.registration.re_enrollment_completed === true
                    ? 'Selesai'
                    : registrationStatus.registration.daftar_ulang?.status === 'submitted'
                    ? 'Dikirim'
                    : 'Belum Dikirim'}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 sm:space-y-4">
                {/* Submitted Date */}
                {registrationStatus.registration.daftar_ulang.submitted_at && (
                  <div className="bg-white rounded-lg p-3 border border-orange-200">
                    <div className="flex items-start space-x-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Tanggal Dikirim</p>
                        <p className="font-medium text-sm sm:text-base text-orange-800">
                          {new Date(registrationStatus.registration.daftar_ulang.submitted_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Akad Files */}
                {registrationStatus.registration.daftar_ulang.akad_files &&
                 registrationStatus.registration.daftar_ulang.akad_files.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-orange-200">
                    <div className="flex items-start space-x-2 mb-2">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">File Akad</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 ml-6">
                      {registrationStatus.registration.daftar_ulang.akad_files.map((file: { url: string; name: string }, idx: number) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="truncate">{file.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Halaqah Schedules */}
                {(registrationStatus.registration.daftar_ulang.ujian_halaqah ||
                  registrationStatus.registration.daftar_ulang.tashih_halaqah) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Ujian Halaqah */}
                    {registrationStatus.registration.daftar_ulang.ujian_halaqah && (
                      <div className="bg-white rounded-lg p-3 border border-orange-200">
                        <div className="flex items-start space-x-2">
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-grow">
                            <p className="text-xs sm:text-sm text-gray-600">Ujian Halaqah</p>
                            <p className="font-medium text-sm sm:text-base text-blue-800">
                              {registrationStatus.registration.daftar_ulang.ujian_halaqah.name}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              {registrationStatus.registration.daftar_ulang.ujian_halaqah.day_of_week},{' '}
                              {registrationStatus.registration.daftar_ulang.ujian_halaqah.start_time} - {' '}
                              {registrationStatus.registration.daftar_ulang.ujian_halaqah.end_time}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tashih Halaqah */}
                    {registrationStatus.registration.daftar_ulang.tashih_halaqah && (
                      <div className="bg-white rounded-lg p-3 border border-orange-200">
                        <div className="flex items-start space-x-2">
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-grow">
                            <p className="text-xs sm:text-sm text-gray-600">Tashih Halaqah</p>
                            <p className="font-medium text-sm sm:text-base text-purple-800">
                              {registrationStatus.registration.daftar_ulang.tashih_halaqah.name}
                            </p>
                            <p className="text-xs text-purple-600 mt-1">
                              {registrationStatus.registration.daftar_ulang.tashih_halaqah.day_of_week},{' '}
                              {registrationStatus.registration.daftar_ulang.tashih_halaqah.start_time} - {' '}
                              {registrationStatus.registration.daftar_ulang.tashih_halaqah.end_time}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Message */}
                {registrationStatus.registration.re_enrollment_completed !== true &&
                 registrationStatus.registration.daftar_ulang.status !== 'submitted' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-yellow-800">
                        Daftar ulang belum dikirim. Silakan lengkapi formulir daftar ulang di menu.
                      </p>
                    </div>
                  </div>
                )}

                {/* Completion Badge */}
                {registrationStatus.registration.re_enrollment_completed === true && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm sm:text-base font-medium text-green-800">
                          Daftar ulang telah disetujui
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Anda dapat melanjutkan ke tahapan berikutnya
                        </p>
                      </div>
                    </div>
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

                  // Check if this is the Daftar Ulang card and should be clickable
                  const isDaftarUlangCard = item.title === 'Mendaftar Ulang' &&
                                          registrationStatus?.selectionStatus === 'selected' &&
                                          !registrationStatus.registration?.re_enrollment_completed;

                  const cardContent = (
                    <Card className={`${styles.cardBg} ${styles.cardBorder} transition-all duration-300 hover:shadow-md ${isDaftarUlangCard ? 'cursor-pointer hover:ring-2 hover:ring-orange-400' : ''}`}>
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
                                    userRoles: user?.roles,
                                    userRoleLegacy: (user as any)?.role
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
                                  ) : registrationStatus?.writtenQuizSubmittedAt ? (
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
                                              Dikirim: {registrationStatus?.writtenQuizSubmittedAt ? new Date(registrationStatus.writtenQuizSubmittedAt).toLocaleDateString('id-ID') : '-'}
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
                            ) : item.id === 4 ? (
                              // Daftar Ulang - Show status and akad files
                              (() => {
                                const daftarUlang = registrationStatus.registration?.daftar_ulang;
                                const isCompleted = registrationStatus.registration?.re_enrollment_completed === true;
                                const hasSubmittedDaftarUlang = daftarUlang?.status === 'submitted';

                                // Show daftar ulang info if completed OR if submitted (even if not yet marked completed)
                                if ((isCompleted || hasSubmittedDaftarUlang) && daftarUlang) {
                                  return (
                                    <div className="space-y-2">
                                      <div className="flex items-start space-x-2">
                                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-green-600" />
                                        <p className={`text-xs sm:text-sm text-green-700 font-bold leading-relaxed`}>
                                          Daftar ulang selesai ✓
                                        </p>
                                      </div>

                                      {/* Show akad files */}
                                      {daftarUlang.akad_files && daftarUlang.akad_files.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          <p className={`text-xs ${styles.textColor} font-medium`}>File Akad:</p>
                                          {daftarUlang.akad_files.map((file: { url: string; name: string }, idx: number) => (
                                            <a
                                              key={idx}
                                              href={file.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                              <FileText className="w-3 h-3" />
                                              {file.name}
                                            </a>
                                          ))}
                                        </div>
                                      )}

                                      {/* Show halaqah information */}
                                      {(daftarUlang.ujian_halaqah || daftarUlang.tashih_halaqah) && (
                                        <div className="mt-2 space-y-2">
                                          <p className={`text-xs ${styles.textColor} font-medium`}>Jadwal Halaqah:</p>

                                          {/* Ujian Halaqah */}
                                          {daftarUlang.ujian_halaqah && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                              <p className="text-xs font-semibold text-blue-800 mb-1">Ujian Halaqah</p>
                                              <p className="text-xs text-blue-700">{daftarUlang.ujian_halaqah.name}</p>
                                              <p className="text-xs text-blue-600">
                                                {daftarUlang.ujian_halaqah.day_of_week}, {daftarUlang.ujian_halaqah.start_time} - {daftarUlang.ujian_halaqah.end_time}
                                              </p>
                                            </div>
                                          )}

                                          {/* Tashih Halaqah */}
                                          {daftarUlang.tashih_halaqah && (
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                                              <p className="text-xs font-semibold text-purple-800 mb-1">Tashih Halaqah</p>
                                              <p className="text-xs text-purple-700">{daftarUlang.tashih_halaqah.name}</p>
                                              <p className="text-xs text-purple-600">
                                                {daftarUlang.tashih_halaqah.day_of_week}, {daftarUlang.tashih_halaqah.start_time} - {daftarUlang.tashih_halaqah.end_time}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {daftarUlang.submitted_at && (
                                        <p className={`text-xs ${styles.textColor} mt-1`}>
                                          Dikirim pada {new Date(daftarUlang.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                      )}
                                    </div>
                                  );
                                } else if (registrationStatus?.registration?.re_enrollment_completed === true) {
                                  // Completed but no daftar ulang data (shouldn't happen but handle gracefully)
                                  return (
                                    <div className="space-y-2">
                                      <div className="flex items-start space-x-2">
                                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-green-600" />
                                        <p className={`text-xs sm:text-sm text-green-700 font-bold leading-relaxed`}>
                                          Daftar ulang selesai ✓
                                        </p>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  // Not completed yet
                                  return (
                                    <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                      {item.description}
                                    </p>
                                  );
                                }
                              })()
                            ) : item.id === 3 ? (
                              // Hasil Seleksi - NEW LOGIC: Everyone passes to either Tikrar Tahfidz MTI or Pra-Tikrar
                              (() => {
                                const oralStatus = registrationStatus?.oralAssessmentStatus;
                                const chosenJuz = registrationStatus?.chosenJuz?.toUpperCase() || '';
                                const examScore = registrationStatus?.examScore;
                                const isJuz30 = chosenJuz.startsWith('30');

                                // Calculate adjusted juz based on written quiz score
                                let finalJuz = chosenJuz;
                                let juzAdjusted = false;
                                let juzAdjustmentReason = '';

                                if (oralStatus === 'pass' && examScore !== null && examScore !== undefined && examScore < 70) {
                                  if (chosenJuz === '28A' || chosenJuz === '28B' || chosenJuz === '28') {
                                    finalJuz = '29A';
                                    juzAdjusted = true;
                                    juzAdjustmentReason = `Nilai pilihan ganda ${examScore} < 70, juz disesuaikan dari ${chosenJuz} ke ${finalJuz}`;
                                  } else if (chosenJuz === '1A' || chosenJuz === '1B' || chosenJuz === '29A' || chosenJuz === '29B' || chosenJuz === '29' || chosenJuz === '1') {
                                    finalJuz = '30A';
                                    juzAdjusted = true;
                                    juzAdjustmentReason = `Nilai pilihan ganda ${examScore} < 70, juz disesuaikan dari ${chosenJuz} ke ${finalJuz}`;
                                  }
                                }

                                // CASE 1: Lulus Oral Test -> Tikrar Tahfidz MTI (regardless of written test score)
                                if (oralStatus === 'pass') {
                                  return (
                                    <div className="space-y-3">
                                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 sm:p-4">
                                        <div className="flex items-start space-x-3">
                                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <h4 className="text-base sm:text-lg font-bold text-green-900 mb-2">
                                              Selamat! Ukhti Lulus ke Tikrar Tahfidz MTI
                                            </h4>
                                            <p className="text-xs sm:text-sm text-green-800 leading-relaxed">
                                              Alhamdulillah, Ukhti telah lulus seleksi penerimaan program Tikrar Tahfidz MTI.
                                              Teruslah bermuhasabah dan perbaiki diri demi menjadi hafidzah yang lebih baik.
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 gap-2">
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                          <p className="text-xs text-gray-600">Rekam Suara</p>
                                          <p className="text-sm font-bold text-green-700">Lulus ✓</p>
                                        </div>
                                        {!isJuz30 && (
                                          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                            <p className="text-xs text-gray-600">Pilihan Ganda</p>
                                            {examScore !== null && examScore !== undefined ? (
                                              <>
                                                <p className="text-sm font-bold text-green-700">
                                                  {examScore} - {examScore < 70 ? 'Perlu Penyesuaian Juz' : 'Penempatan Halaqah'}
                                                </p>
                                                {juzAdjusted && (
                                                  <p className="text-xs text-blue-700 mt-1">
                                                    {juzAdjustmentReason}
                                                  </p>
                                                )}
                                              </>
                                            ) : (
                                              <p className="text-sm text-yellow-700 italic">
                                                Belum dikerjakan
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Show final juz placement - always show */}
                                      <div className={`bg-green-50 border ${juzAdjusted ? 'border-green-200' : 'border-emerald-200'} rounded-lg p-2`}>
                                        <p className="text-xs text-gray-600">Juz Penempatan Final</p>
                                        <p className="text-sm font-bold text-green-700">{getJuzLabel(finalJuz)}</p>
                                        {juzAdjusted && (
                                          <p className="text-xs text-green-600">Diperbarui berdasarkan nilai pilihan ganda</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                // CASE 2: Gagal Oral Test -> Pra-Tikrar (Kelas Persiapan)
                                else if (oralStatus === 'fail') {
                                  return (
                                    <div className="space-y-3">
                                      <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3 sm:p-4">
                                        <div className="flex items-start space-x-3">
                                          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <h4 className="text-base sm:text-lg font-bold text-orange-900 mb-2">
                                              Ukhti Masuk Kelas Pra-Tikrar
                                            </h4>
                                            <p className="text-xs sm:text-sm text-orange-800 leading-relaxed">
                                              Alhamdulillah, Ukhti diterima di kelas Pra-Tikrar (Kelas Khusus Persiapan Tikrar Tahfidz MTI).
                                              Kelas ini dirancang khusus untuk mempersiapkan Ukhti agar lebih siap mengikuti program Tikrar Tahfidz.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                        <p className="text-xs text-gray-600">Rekam Suara</p>
                                        <p className="text-sm font-bold text-orange-700">Perlu Peningkatan</p>
                                      </div>
                                    </div>
                                  );
                                }
                                // CASE 3: Menunggu Hasil Oral Test
                                else if (oralStatus === 'pending' || oralStatus === 'not_submitted') {
                                  return (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                                      <div className="flex items-start space-x-3">
                                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <h4 className="text-sm font-semibold text-yellow-800 mb-1">Menunggu Hasil Seleksi</h4>
                                          <p className="text-xs text-yellow-700">
                                            Hasil seleksi akan diumumkan pada tanggal yang telah ditentukan.
                                            Semua peserta akan lulus ke Tikrar Tahfidz MTI atau Pra-Tikrar.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                // Default fallback
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

                  // Wrap with Link if it's a Daftar Ulang card
                  if (isDaftarUlangCard) {
                    return (
                      <Link key={item.id} href={`/daftar-ulang?batch_id=${batchId}`} className="block no-underline">
                        {cardContent}
                      </Link>
                    );
                  }

                  return cardContent;
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

                    // Check if this is the Daftar Ulang card and should be clickable
                    const isDaftarUlangCard = item.title === 'Mendaftar Ulang' &&
                                            registrationStatus?.selectionStatus === 'selected' &&
                                            !registrationStatus.registration?.re_enrollment_completed;

                    const cardContent = (
                      <div key={item.id} className={`relative flex items-center ${isLeftSide ? 'justify-start' : 'justify-end'}`}>
                        {/* Card */}
                        <div className={`w-5/12 ${isLeftSide ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                          <Card className={`${styles.cardBg} ${styles.cardBorder} transition-all duration-300 hover:shadow-md ${isDaftarUlangCard ? 'cursor-pointer hover:ring-2 hover:ring-orange-400' : ''}`}>
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
                                    ) : registrationStatus?.writtenQuizSubmittedAt ? (
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
                                              Dikirim: {registrationStatus?.writtenQuizSubmittedAt ? new Date(registrationStatus.writtenQuizSubmittedAt).toLocaleDateString('id-ID') : '-'}
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
                              ) : item.id === 4 ? (
                              // Daftar Ulang - Show status and akad files
                              (() => {
                                const daftarUlang = registrationStatus.registration?.daftar_ulang;
                                const isCompleted = registrationStatus.registration?.re_enrollment_completed === true;
                                const hasSubmittedDaftarUlang = daftarUlang?.status === 'submitted';

                                // Show daftar ulang info if completed OR if submitted (even if not yet marked completed)
                                if ((isCompleted || hasSubmittedDaftarUlang) && daftarUlang) {
                                  return (
                                    <div className="space-y-2">
                                      <div className="flex items-start space-x-2">
                                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-green-600" />
                                        <p className={`text-xs sm:text-sm text-green-700 font-bold leading-relaxed`}>
                                          Daftar ulang selesai ✓
                                        </p>
                                      </div>

                                      {/* Show akad files */}
                                      {daftarUlang.akad_files && daftarUlang.akad_files.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          <p className={`text-xs ${styles.textColor} font-medium`}>File Akad:</p>
                                          {daftarUlang.akad_files.map((file: { url: string; name: string }, idx: number) => (
                                            <a
                                              key={idx}
                                              href={file.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                              <FileText className="w-3 h-3" />
                                              {file.name}
                                            </a>
                                          ))}
                                        </div>
                                      )}

                                      {/* Show halaqah information */}
                                      {(daftarUlang.ujian_halaqah || daftarUlang.tashih_halaqah) && (
                                        <div className="mt-2 space-y-2">
                                          <p className={`text-xs ${styles.textColor} font-medium`}>Jadwal Halaqah:</p>

                                          {/* Ujian Halaqah */}
                                          {daftarUlang.ujian_halaqah && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                              <p className="text-xs font-semibold text-blue-800 mb-1">Ujian Halaqah</p>
                                              <p className="text-xs text-blue-700">{daftarUlang.ujian_halaqah.name}</p>
                                              <p className="text-xs text-blue-600">
                                                {daftarUlang.ujian_halaqah.day_of_week}, {daftarUlang.ujian_halaqah.start_time} - {daftarUlang.ujian_halaqah.end_time}
                                              </p>
                                            </div>
                                          )}

                                          {/* Tashih Halaqah */}
                                          {daftarUlang.tashih_halaqah && (
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                                              <p className="text-xs font-semibold text-purple-800 mb-1">Tashih Halaqah</p>
                                              <p className="text-xs text-purple-700">{daftarUlang.tashih_halaqah.name}</p>
                                              <p className="text-xs text-purple-600">
                                                {daftarUlang.tashih_halaqah.day_of_week}, {daftarUlang.tashih_halaqah.start_time} - {daftarUlang.tashih_halaqah.end_time}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {daftarUlang.submitted_at && (
                                        <p className={`text-xs ${styles.textColor} mt-1`}>
                                          Dikirim pada {new Date(daftarUlang.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                      )}
                                    </div>
                                  );
                                } else if (registrationStatus?.registration?.re_enrollment_completed === true) {
                                  // Completed but no daftar ulang data (shouldn't happen but handle gracefully)
                                  return (
                                    <div className="space-y-2">
                                      <div className="flex items-start space-x-2">
                                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-green-600" />
                                        <p className={`text-xs sm:text-sm text-green-700 font-bold leading-relaxed`}>
                                          Daftar ulang selesai ✓
                                        </p>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  // Not completed yet
                                  return (
                                    <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                      {item.description}
                                    </p>
                                  );
                                }
                              })()
                            ) : item.id === 3 ? (
                                // Hasil Seleksi - Desktop view - NEW LOGIC: Everyone passes to either Tikrar Tahfidz MTI or Pra-Tikrar
                                (() => {
                                  const oralStatus = registrationStatus?.oralAssessmentStatus;
                                  const chosenJuz = registrationStatus?.chosenJuz?.toUpperCase() || '';
                                  const examScore = registrationStatus?.examScore;
                                  const isJuz30 = chosenJuz.startsWith('30');

                                  // Calculate adjusted juz based on written quiz score
                                  let finalJuz = chosenJuz;
                                  let juzAdjusted = false;
                                  let juzAdjustmentReason = '';

                                  if (oralStatus === 'pass' && examScore !== null && examScore !== undefined && examScore < 70) {
                                    if (chosenJuz === '28A' || chosenJuz === '28B' || chosenJuz === '28') {
                                      finalJuz = '29A';
                                      juzAdjusted = true;
                                      juzAdjustmentReason = `Nilai pilihan ganda ${examScore} < 70, juz disesuaikan dari ${chosenJuz} ke ${finalJuz}`;
                                    } else if (chosenJuz === '1A' || chosenJuz === '1B' || chosenJuz === '29A' || chosenJuz === '29B' || chosenJuz === '29' || chosenJuz === '1') {
                                      finalJuz = '30A';
                                      juzAdjusted = true;
                                      juzAdjustmentReason = `Nilai pilihan ganda ${examScore} < 70, juz disesuaikan dari ${chosenJuz} ke ${finalJuz}`;
                                    }
                                  }

                                  // CASE 1: Lulus Oral Test -> Tikrar Tahfidz MTI (regardless of written test score)
                                  if (oralStatus === 'pass') {
                                    return (
                                      <div className="space-y-3">
                                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                                          <div className="flex items-start space-x-3">
                                            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                              <h4 className="text-lg font-bold text-green-900 mb-2">
                                                Selamat! Ukhti Lulus ke Tikrar Tahfidz MTI
                                              </h4>
                                              <p className="text-sm text-green-800 leading-relaxed">
                                                Alhamdulillah, Ukhti telah lulus seleksi penerimaan program Tikrar Tahfidz MTI.
                                                Teruslah bermuhasabah dan perbaiki diri demi menjadi hafidzah yang lebih baik.
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <p className="text-sm text-gray-600">Rekam Suara</p>
                                            <p className="text-base font-bold text-green-700">Lulus ✓</p>
                                          </div>
                                          {!isJuz30 && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                              <p className="text-sm text-gray-600">Pilihan Ganda</p>
                                              {examScore !== null && examScore !== undefined ? (
                                                <>
                                                  <p className="text-base font-bold text-green-700">
                                                    {examScore} - {examScore < 70 ? 'Perlu Penyesuaian Juz' : 'Penempatan Halaqah'}
                                                  </p>
                                                  {juzAdjusted && (
                                                    <p className="text-sm text-blue-700 mt-1">
                                                      {juzAdjustmentReason}
                                                    </p>
                                                  )}
                                                </>
                                              ) : (
                                                <p className="text-base text-yellow-700 italic">
                                                  Belum dikerjakan
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Show final juz placement - always show */}
                                        <div className={`bg-green-50 border ${juzAdjusted ? 'border-green-200' : 'border-emerald-200'} rounded-lg p-3`}>
                                          <p className="text-sm text-gray-600">Juz Penempatan Final</p>
                                          <p className="text-base font-bold text-green-700">{getJuzLabel(finalJuz)}</p>
                                          {juzAdjusted && (
                                            <p className="text-sm text-green-600">Diperbarui berdasarkan nilai pilihan ganda</p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }
                                  // CASE 2: Gagal Oral Test -> Pra-Tikrar (Kelas Persiapan)
                                  else if (oralStatus === 'fail') {
                                    return (
                                      <div className="space-y-3">
                                        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                                          <div className="flex items-start space-x-3">
                                            <Target className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                              <h4 className="text-lg font-bold text-orange-900 mb-2">
                                                Ukhti Masuk Kelas Pra-Tikrar
                                              </h4>
                                              <p className="text-sm text-orange-800 leading-relaxed">
                                                Alhamdulillah, Ukhti diterima di kelas Pra-Tikrar (Kelas Khusus Persiapan Tikrar Tahfidz MTI).
                                                Kelas ini dirancang khusus untuk mempersiapkan Ukhti agar lebih siap mengikuti program Tikrar Tahfidz.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                          <p className="text-sm text-gray-600">Rekam Suara</p>
                                          <p className="text-base font-bold text-orange-700">Perlu Peningkatan</p>
                                        </div>
                                      </div>
                                    );
                                  }
                                  // CASE 3: Menunggu Hasil Oral Test
                                  else if (oralStatus === 'pending' || oralStatus === 'not_submitted') {
                                    return (
                                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start space-x-3">
                                          <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <h4 className="text-sm font-semibold text-yellow-800 mb-1">Menunggu Hasil Seleksi</h4>
                                            <p className="text-sm text-yellow-700">
                                              Hasil seleksi akan diumumkan pada tanggal yang telah ditentukan.
                                              Semua peserta akan lulus ke Tikrar Tahfidz MTI atau Pra-Tikrar.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  // Default fallback
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

                    // Wrap with Link if it's a Daftar Ulang card
                    if (isDaftarUlangCard) {
                      return (
                        <Link key={item.id} href={`/daftar-ulang?batch_id=${batchId}`} className="block no-underline">
                          {cardContent}
                        </Link>
                      );
                    }

                    return cardContent;
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
                    {/* Daftar Ulang button - only for selected thalibah who haven't completed re-enrollment */}
                    {registrationStatus.selectionStatus === 'selected' && !registrationStatus.registration?.re_enrollment_completed && (
                      <Link href={`/daftar-ulang?batch_id=${batchId}`}>
                        <Button
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                        >
                          <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                          <span className="hidden xs:inline">Daftar Ulang</span>
                          <span className="xs:hidden">Daftar Ulang</span>
                        </Button>
                      </Link>
                    )}
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