'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMyRegistrations, useAllRegistrations } from '@/hooks/useRegistrations';
import { useActiveBatch } from '@/hooks/useBatches';
import { useDashboardStats, useLearningJourney, useUserProgress, useJurnalStatus } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, BookOpen, Award, Target, Calendar, TrendingUp, Edit, Clock, Phone, MapPin, Ban, Info, RotateCcw, FileText, HeartHandshake, Star, Sparkles, User, BadgeCheck, Zap } from 'lucide-react';
import { SWRLoadingFallback, SWRErrorFallback } from '@/lib/swr/providers';
import { EditTikrarRegistrationModal } from '@/components/EditTikrarRegistrationModal';
import { Pendaftaran } from '@/types/database';
import { ExamEligibility } from '@/types/exam';
import { useBatchTimeline } from '@/hooks/useBatchTimeline';
import { formatFullDateIndo, formatDateIndo, getDayNameIndo, toHijri } from '@/lib/utils/date-helpers';
import { getRoleRank, ROLE_RANKS, isStaff } from '@/lib/roles';
import { cn } from '@/lib/utils';

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
  // daftar_ulang is now inherited from Pendaftaran interface
}

// Pairing data interface
interface PairingData {
  submission_id?: string;
  current_user: {
    id: string;
    full_name: string;
    email: string;
    zona_waktu: string;
    whatsapp: string | null;
    tanggal_lahir: string | null;
    chosen_juz: string;
    main_time_slot: string;
    backup_time_slot: string;
  };
  pairing: {
    id: string;
    pairing_type: string;
    paired_at: string;
    is_group_of_3: boolean;
    user_role: 'user_1' | 'user_2' | 'user_3' | null;
  };
  user_1: {
    id: string;
    full_name: string;
    email: string;
    zona_waktu: string;
    whatsapp: string | null;
    tanggal_lahir: string | null;
    chosen_juz: string;
    main_time_slot: string;
    backup_time_slot: string;
  };
  user_2: {
    id: string;
    full_name: string;
    email: string;
    zona_waktu: string;
    whatsapp: string | null;
    tanggal_lahir: string | null;
    chosen_juz: string;
    main_time_slot: string;
    backup_time_slot: string;
  };
  user_3: {
    id: string;
    full_name: string;
    email: string;
    zona_waktu: string;
    whatsapp: string | null;
    tanggal_lahir: string | null;
    chosen_juz: string;
    main_time_slot: string;
    backup_time_slot: string;
  } | null;
  partner_details?: {
    partner_name: string | null;
    partner_relationship: string | null;
    partner_notes: string | null;
    partner_wa_phone: string | null;
  } | null;
}

export default function PerjalananSaya() {
  const { user, isLoading: authLoading, isAuthenticated, isUnauthenticated } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'jadwal' | 'achievement'>('jadwal');
  
  // Identify if user is Admin/Staff for preview mode
  const isAdmin = useMemo(() => {
    const primaryRole = (user as any)?.primaryRole;
    return getRoleRank(primaryRole) >= ROLE_RANKS.admin;
  }, [user]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [examEligibility, setExamEligibility] = useState<ExamEligibility | null>(null);
  const [hasSessionError, setHasSessionError] = useState(false);
  const [pairingData, setPairingData] = useState<PairingData | null>(null);
  const [isLoadingPairing, setIsLoadingPairing] = useState(false);
  const [isEditPartnerModalOpen, setIsEditPartnerModalOpen] = useState(false);
  const [editPartnerData, setEditPartnerData] = useState({
    partner_name: '',
    partner_relationship: '',
    partner_notes: '',
    partner_wa_phone: ''
  });
  const [isUpdatingPartner, setIsUpdatingPartner] = useState(false);

  // SWR hooks for data fetching - useAllRegistrations to show ALL registrations (no batch filter)
  const { registrations, isLoading: registrationsLoading, error: registrationsError } = useAllRegistrations();
  const { activeBatch, isLoading: activeBatchLoading } = useActiveBatch();
  const { progress } = useUserProgress();
  const { journey } = useLearningJourney();
  
  const userRole = (user as any)?.primaryRole || 'thalibah';
  const canSeeAdminStats = isStaff(userRole);
  const { stats, isLoading: statsLoading } = useDashboardStats(canSeeAdminStats);
  const { jurnalStatus, isLoading: jurnalLoading } = useJurnalStatus();

  // Unified Statistics Logic (Same as Dashboard)
  const statsOverview = useMemo(() => {
    const totalHariTarget = canSeeAdminStats ? (stats?.totalHariTarget || 0) : (jurnalStatus?.summary.total_blocks || 0);
    const hariAktual = canSeeAdminStats ? (stats?.hariAktual || 0) : (jurnalStatus?.summary.completed_blocks || 0);
    const percentage = totalHariTarget > 0 ? Math.round((hariAktual / totalHariTarget) * 100) : 0;
    
    return {
      totalHariTarget,
      hariAktual,
      percentage
    };
  }, [canSeeAdminStats, stats, jurnalStatus]);

  const percentage = statsOverview.percentage;
  const completedCount = statsOverview.hariAktual;
  const totalCount = statsOverview.totalHariTarget;

  // Get batch_id from registration - fallback to active batch for Admins
  const batchId = useMemo(() => {
    // Priority 1: Registration from DB
    if (registrations && registrations.length > 0 && registrations[0].batch_id) {
      return registrations[0].batch_id;
    }
    // Priority 2: Fallback to Active Batch (for both students and admins)
    if (activeBatch) {
      return activeBatch.id;
    }
    return null;
  }, [registrations, activeBatch]);

  // Fetch batch timeline data - safely handle undefined registrations
  const { batch, timeline: batchTimeline, isLoading: batchLoading } = useBatchTimeline(batchId, {
    registrationStatus: registrations && registrations[0]?.status === 'completed' ? 'approved' : registrations?.[0]?.status as any,
    selectionStatus: registrations?.[0]?.selection_status
  });

  // Debug log for admin button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[PerjalananSai] Admin button debug:', {
        isAdmin: user?.roles?.includes('admin'),
        showButton: user?.roles?.includes('admin') && batchId
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

  // Calculate dynamic finish estimation
  const estimationFinish = useMemo(() => {
    if (batch && batch.graduation_end_date) {
      const greg = formatDateIndo(batch.graduation_end_date);
      const hijri = toHijri(batch.graduation_end_date);
      return { greg, hijri };
    }
    
    // Fallback if no graduation date but have timeline
    if (timelineData.length > 0) {
      const lastItem = timelineData[timelineData.length - 1];
      // Try to extract date from the last item's date string if batch.graduation_end_date is missing
      return { greg: lastItem.date, hijri: lastItem.hijriDate };
    }

    return { greg: '-', hijri: '-' };
  }, [batch, timelineData]);

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

  const getTimeSlotLabel = (slotValue: string | undefined) => {
    if (!slotValue) return '-';
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

  const getDayNameFromNumber = (dayNum: number | string | undefined) => {
    const days = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
    if (dayNum === undefined) return '';
    const num = typeof dayNum === 'string' ? parseInt(dayNum) : dayNum;
    return days[num] || `${dayNum}`;
  };

  const calculateAge = (birthDate: string | null | undefined) => {
    if (!birthDate) return '-';

    let birth: Date;
    // Try parsing ISO format (YYYY-MM-DD)
    if (birthDate.includes('-')) {
      const parts = birthDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
        const day = parseInt(parts[2]);
        birth = new Date(year, month, day);
      } else {
        birth = new Date(birthDate);
      }
    } else if (birthDate.includes('/')) {
      // Try parsing slash format (DD/MM/YYYY or YYYY/MM/DD)
      const parts = birthDate.split('/');
      if (parts.length === 3) {
        // Assume DD/MM/YYYY format (common in Indonesia)
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        birth = new Date(year, month, day);
      } else {
        birth = new Date(birthDate);
      }
    } else {
      birth = new Date(birthDate);
    }

    if (isNaN(birth.getTime())) {
      return '-';
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const hasTimeSlotOverlap = (slot1: string | undefined, slot2: string | undefined): boolean => {
    if (!slot1 || !slot2) return false;

    const parseSlot = (slot: string) => {
      const [start, end] = slot.split('-').map(Number);
      return { start, end };
    };

    const s1 = parseSlot(slot1);
    const s2 = parseSlot(slot2);

    return s1.start < s2.end && s2.start < s1.end;
  };

  const renderCompatibilityAnalysis = (currentUser: any, partner: any, partnerLabel: string) => {
    const juzMatch = currentUser.chosen_juz === partner.chosen_juz;
    const zonaMatch = currentUser.zona_waktu === partner.zona_waktu;
    const mainTimeMatch = hasTimeSlotOverlap(currentUser.main_time_slot, partner.main_time_slot);
    const backupTimeMatch = hasTimeSlotOverlap(currentUser.backup_time_slot, partner.backup_time_slot) ||
                            hasTimeSlotOverlap(currentUser.backup_time_slot, partner.main_time_slot) ||
                            hasTimeSlotOverlap(currentUser.main_time_slot, partner.backup_time_slot);

    return (
      <div key={partnerLabel} className="space-y-1.5">
        <p className="text-xs font-medium text-gray-700 mb-1.5">Kecocokan dengan {partnerLabel}:</p>
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${juzMatch ? 'bg-green-500' : 'bg-amber-500'}`}></span>
          <span className={juzMatch ? 'text-green-700' : 'text-amber-700'}>
            Juz: {juzMatch ? 'Sama ✓' : 'Beda'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${zonaMatch ? 'bg-green-500' : 'bg-amber-500'}`}></span>
          <span className={zonaMatch ? 'text-green-700' : 'text-amber-700'}>
            Zona: {zonaMatch ? 'Sama ✓' : 'Beda'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${mainTimeMatch ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className={mainTimeMatch ? 'text-green-700' : 'text-red-700'}>
            W. Utama: {mainTimeMatch ? 'Cocok ✓' : 'Tidak cocok'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${backupTimeMatch ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className={backupTimeMatch ? 'text-green-700' : 'text-red-700'}>
            W. Cadangan: {backupTimeMatch ? 'Cocok ✓' : 'Tidak cocok'}
          </span>
        </div>
      </div>
    );
  };

  const getMatchingAdvice = (currentUser: any, partners: any[]) => {
    let hasPerfectMatches = false;
    let hasSomeMatches = false;
    let hasNoMatches = true;

    for (const partner of partners) {
      if (!partner) continue;

      const juzMatch = currentUser.chosen_juz === partner.chosen_juz;
      const zonaMatch = currentUser.zona_waktu === partner.zona_waktu;
      const mainTimeMatch = hasTimeSlotOverlap(currentUser.main_time_slot, partner.main_time_slot);

      if (juzMatch && zonaMatch && mainTimeMatch) {
        hasPerfectMatches = true;
        hasNoMatches = false;
      } else if (juzMatch || zonaMatch || mainTimeMatch) {
        hasSomeMatches = true;
        hasNoMatches = false;
      }
    }

    if (hasPerfectMatches) {
      return {
        icon: '✨',
        title: 'Alhamdulillah, Kecocokan Baik!',
        message: 'Ukhti mendapatkan pasangan dengan kecocokan yang baik. Semoga ikhtiar ini membawa keberkahan dalam menghafal dan mengamalkan Al-Qur\'an bersama.',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800'
      };
    } else if (hasSomeMatches) {
      return {
        icon: '💪',
        title: 'Sabar dan Ikhlas',
        message: 'Wahai Ukhti yang mulia, sistem berpasangan ini ditentukan dengan logika berlapis untuk kebaikan bersama. Terimalah pasangan sebagai ujian kesabaran dan kesempatan untuk berbagi ilmu. Jangan ragu untuk berkomunikasi dengan pasangan mencari waktu yang sesuai.',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800'
      };
    } else {
      return {
        icon: '🤲',
        title: 'Ujian Kesabaran',
        message: 'Wahai Ukhti yang mulia, semua takdir Allah adalah yang terbaik. Sistem berpasangan ini ditentukan dengan logika berlapis. Perbedaan ini adalah kesempatan untuk belajar toleransi, berkomunikasi, dan mencari solusi bersama. Mari berikhtiar mencari waktu yang bisa disepakati bersama pasangan.',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800'
      };
    }
  };

  const getPairingTypeLabel = (pairingType: string) => {
    switch (pairingType) {
      case 'self_match':
        return { label: 'Self Match', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'family':
        return { label: 'Family', bgColor: 'bg-pink-100', textColor: 'text-pink-800' };
      case 'tarteel':
        return { label: 'Tarteel', bgColor: 'bg-teal-100', textColor: 'text-teal-800' };
      case 'system_match':
        return { label: 'System Match', bgColor: 'bg-purple-100', textColor: 'text-purple-800' };
      default:
        return { label: pairingType, bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }
  };

  const handleEditPartner = async () => {
    if (!pairingData || !pairingData.submission_id) return;

    const isFamily = pairingData.pairing.pairing_type === 'family';
    const isTarteel = pairingData.pairing.pairing_type === 'tarteel';

    if (!isFamily && !isTarteel) {
      alert('Hanya pasangan Family dan Tarteel yang bisa diedit.');
      return;
    }

    // Get current values
    const currentName = pairingData.partner_details?.partner_name || '';
    const currentRelationship = pairingData.partner_details?.partner_relationship || '';
    const currentNotes = pairingData.partner_details?.partner_notes || '';
    const currentPhone = pairingData.partner_details?.partner_wa_phone || '';

    // Prompt for new values
    const fieldLabel = isFamily ? 'keluarga' : 'Tarteel';
    const newName = prompt(`Masukkan nama ${fieldLabel}:`, currentName);
    if (newName === null) return; // User cancelled

    const newRelationship = isFamily ? prompt('Masukkan hubungan:', currentRelationship) : currentRelationship;
    if (isFamily && newRelationship === null) return;

    const newNotes = prompt('Masukkan catatan:', currentNotes);
    if (newNotes === null) return;

    const newPhone = prompt('Masukkan nomor WhatsApp:', currentPhone);
    if (newPhone === null) return;

    // Update via API
    setIsUpdatingPartner(true);
    try {
      const response = await fetch('/api/user/pairing/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: pairingData.submission_id,
          partner_name: newName,
          partner_relationship: newRelationship,
          partner_notes: newNotes,
          partner_wa_phone: newPhone,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Data pasangan berhasil diperbarui!');
        // Refresh pairing data
        fetchPairingData(batchId);
      } else {
        alert(result.error || 'Gagal memperbarui data pasangan.');
      }
    } catch (error) {
      console.error('Error updating partner:', error);
      alert('Terjadi kesalahan saat memperbarui data pasangan.');
    } finally {
      setIsUpdatingPartner(false);
    }
  };

  const fetchPairingData = async (currentBatchId: string | null) => {
    if (!user || !currentBatchId) return;

    setIsLoadingPairing(true);
    try {
      const response = await fetch(`/api/user/pairing?batch_id=${currentBatchId}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pairing data');
      }

      const result = await response.json();
      if (result.success) {
        setPairingData(result.data);
      }
    } catch (error) {
      console.error('Error fetching pairing data:', error);
      setPairingData(null);
    } finally {
      setIsLoadingPairing(false);
    }
  };

  // Fetch pairing data when batchId changes
  useEffect(() => {
    if (batchId && user) {
      fetchPairingData(batchId);
    }
  }, [batchId, user]);

  const handleEditSuccess = () => {
    // Trigger SWR revalidation to refresh data
    window.location.reload();
  };

  const getStatusStyles = (status: 'completed' | 'current' | 'future') => {
    switch (status) {
      case 'completed':
        return {
          cardBg: 'bg-white',
          cardBorder: 'border-emerald-100',
          textColor: 'text-emerald-900',
          iconBg: 'bg-emerald-100/50',
          iconColor: 'text-emerald-600',
          dotColor: 'bg-emerald-500',
          lineColor: 'bg-emerald-500'
        };
      case 'current':
        return {
          cardBg: 'bg-gradient-to-br from-yellow-50 to-white',
          cardBorder: 'border-yellow-200 shadow-yellow-100',
          textColor: 'text-yellow-900',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          dotColor: 'bg-yellow-500',
          lineColor: 'bg-yellow-200'
        };
      default:
        return {
          cardBg: 'bg-gray-50/50',
          cardBorder: 'border-gray-100 opacity-60',
          textColor: 'text-gray-400',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-400',
          dotColor: 'bg-gray-200',
          lineColor: 'bg-gray-100'
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
    <div className="space-y-6 sm:space-y-10 animate-fadeIn pb-20">
        {/* Premium Header Section */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-6 sm:p-10 text-white shadow-2xl">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span>My Learning Journey</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                  Perjalanan Hafalan <span className="text-emerald-300 italic">Ukhti</span>
                </h1>
                <p className="text-green-100/70 text-sm sm:text-lg max-w-xl font-medium leading-relaxed">
                  "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." <span className="text-xs sm:text-sm opacity-60 block mt-1">(HR. Bukhari)</span>
                </p>
              </div>

                {/* Stats Card in Header */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center min-w-[140px] sm:min-w-[180px]">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        className="stroke-white/10 fill-none"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        className="stroke-emerald-400 fill-none transition-all duration-1000 ease-out"
                        strokeWidth="8"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * percentage) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-[9px] text-green-200 uppercase tracking-widest font-black">Target</p>
                      <p className="text-xl sm:text-2xl font-black leading-none">{completedCount}/{totalCount}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold">{percentage}%</div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-300">Target Tercapai</p>
                  </div>
                </div>
            </div>

            {/* Admin Preview Mode Banner (Inside Premium Header context) */}
            {isAdmin && !registrationStatus?.hasRegistered && batch && (
              <div className="p-4 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-2xl flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Mode Pratinjau Admin</h3>
                  <p className="text-[10px] sm:text-xs text-blue-100/80 leading-relaxed">
                    Melihat tampilan untuk <strong>{batch.name}</strong>. Anda melihat ini karena status Anda sebagai Admin.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Tab Navigation */}
        <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-md rounded-2xl border border-gray-200/50 w-full max-w-2xl mx-auto shadow-inner">
          {[
            { id: 'status', label: 'Status Pendaftaran', icon: CheckCircle, color: 'emerald' },
            { id: 'jadwal', label: 'Jadwal Belajar', icon: Calendar, color: 'blue' },
            { id: 'achievement', label: 'Pencapaian Saya', icon: Award, color: 'purple' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-white shadow-lg text-emerald-700 font-bold scale-[1.02]' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-gray-400'}`} />
                <span className="text-xs sm:text-sm whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Unified Content Container */}
        <div className="relative min-h-[400px]">
          {/* Tab 1: Status Pendaftaran */}
          {activeTab === 'status' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!isLoading && user && !registrationStatus?.hasRegistered && !isAdmin && (
                  <Card className="border-yellow-200 bg-yellow-50 shadow-sm border-l-4 border-l-yellow-400">
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
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

              {/* Tab 1: Status Pendaftaran Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Card Status Pendaftaran */}
                {registrationStatus?.hasRegistered && (
                  <Card className="rounded-3xl border-none shadow-xl overflow-hidden glass-premium group hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/20 uppercase tracking-wider",
                          registrationStatus.registration?.status === 'approved' ? 'bg-white/20 text-white' : 'bg-yellow-400/20 text-yellow-100'
                        )}>
                          {registrationStatus.registration?.status === 'pending' ? 'Menunggu' :
                           registrationStatus.registration?.status === 'approved' ? 'Aktif' :
                           registrationStatus.registration?.status === 'rejected' ? 'Ditolak' : 'Ditarik'}
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold leading-tight">Status Pendaftaran</CardTitle>
                      <CardDescription className="text-emerald-50/80 text-xs mt-1">Konfirmasi pendaftaran Ukhti</CardDescription>
                      <Sparkles className="absolute bottom-4 right-4 w-12 h-12 text-white/10" />
                    </CardHeader>
                    <CardContent className="p-6 space-y-5 bg-white">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-xl">
                            <User className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nama Lengkap</p>
                            <p className="text-sm font-semibold text-gray-800">{registrationStatus.registration?.full_name || user?.full_name || 'Ukhti'}</p>
                          </div>
                        </div>
                        {registrationStatus.registration?.batch_name && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-50 rounded-xl">
                              <Zap className="h-4 w-4 text-orange-500" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Angkatan/Batch</p>
                              <p className="text-sm font-semibold text-gray-800">{registrationStatus.registration?.batch_name}</p>
                            </div>
                          </div>
                        )}
                        <div className="pt-2 grid grid-cols-2 gap-4">
                          {registrationStatus.registration?.chosen_juz && (
                            <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                              <p className="text-[9px] uppercase font-bold text-emerald-600 tracking-widest mb-1">Pilihan Juz</p>
                              <p className="text-xs font-bold text-emerald-900">{getJuzLabel(registrationStatus.registration.chosen_juz)}</p>
                            </div>
                          )}
                          {registrationStatus.registration?.main_time_slot && (
                            <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                              <p className="text-[9px] uppercase font-bold text-blue-600 tracking-widest mb-1">Sesi Utama</p>
                              <p className="text-xs font-bold text-blue-900">{getTimeSlotLabel(registrationStatus.registration.main_time_slot)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          registrationStatus.registration?.status === 'approved' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500 animate-pulse'
                        )} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                          Verified by Tikrar
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold text-xs" onClick={() => setIsEditModalOpen(true)}>
                        Edit Profil
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {/* 2. Card Kelas & Program */}
                {registrationStatus.registration?.daftar_ulang && (
                  <Card className="rounded-3xl border-none shadow-xl overflow-hidden glass-premium group hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                          <Award className="h-6 w-6" />
                        </div>
                        <div className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/20 uppercase tracking-wider">
                          Daftar Ulang
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold leading-tight">Kelas & Program</CardTitle>
                      <CardDescription className="text-blue-50/80 text-xs mt-1">Status penempatan grup belajar</CardDescription>
                      <Sparkles className="absolute bottom-4 right-4 w-12 h-12 text-white/5" />
                    </CardHeader>
                    <CardContent className="p-6 space-y-6 bg-white">
                      <div className="space-y-4">
                        {registrationStatus.registration.daftar_ulang.ujian_halaqah && (
                          <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100 group/item hover:bg-blue-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
                                  <BadgeCheck className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Kelas Ujian</p>
                                  <p className="text-sm font-bold text-blue-900">{registrationStatus.registration.daftar_ulang.ujian_halaqah.name}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-white border border-blue-100 text-blue-600 rounded-lg">
                                      <Calendar className="w-3 h-3" />
                                      {getDayNameFromNumber(registrationStatus.registration.daftar_ulang.ujian_halaqah.day_of_week)}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-white border border-blue-100 text-blue-600 rounded-lg">
                                      <Clock className="w-3 h-3" />
                                      {registrationStatus.registration.daftar_ulang.ujian_halaqah.start_time} WIB
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {registrationStatus.registration.daftar_ulang.tashih_halaqah && (
                          <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100 group/item hover:bg-purple-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-purple-600">
                                  <Award className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-0.5">Kelas Tashih</p>
                                  <p className="text-sm font-bold text-purple-900">{registrationStatus.registration.daftar_ulang.tashih_halaqah.name}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-white border border-purple-100 text-purple-600 rounded-lg">
                                      <Calendar className="w-3 h-3" />
                                      {getDayNameFromNumber(registrationStatus.registration.daftar_ulang.tashih_halaqah.day_of_week)}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-white border border-purple-100 text-purple-600 rounded-lg">
                                      <Clock className="w-3 h-3" />
                                      {registrationStatus.registration.daftar_ulang.tashih_halaqah.start_time} WIB
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 3. Card Pasangan Belajar */}
                {!isLoadingPairing && pairingData && (
                  <Card className="rounded-3xl border-none shadow-xl overflow-hidden glass-premium group hover:shadow-2xl transition-all duration-500 lg:col-span-1">
                    <CardHeader className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                          <HeartHandshake className="h-6 w-6" />
                        </div>
                        {(() => {
                           const info = getPairingTypeLabel(pairingData.pairing.pairing_type);
                           return (
                             <div className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/20 uppercase tracking-wider">
                               {info.label}
                             </div>
                           );
                        })()}
                      </div>
                      <CardTitle className="text-xl font-bold leading-tight">Pasangan Belajar</CardTitle>
                      <CardDescription className="text-rose-50/80 text-xs mt-1">Partner setoran & muraja'ah</CardDescription>
                      <Sparkles className="absolute bottom-4 right-4 w-12 h-12 text-white/5" />
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 bg-white">
                      {[pairingData.user_1, pairingData.user_2, pairingData.user_3].filter(p => p && p.id !== user?.id).map((partner, idx) => (
                        <div key={idx} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-rose-50/30 transition-all duration-300">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                              {partner?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-gray-900">{partner?.full_name}</p>
                               <div className="flex gap-2 mt-0.5">
                                 <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-md uppercase">Juz {partner?.chosen_juz}</span>
                                 <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md uppercase">{partner?.zona_waktu}</span>
                               </div>
                            </div>
                          </div>
                          <div className="space-y-1.5 mb-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>Sesi: <span className="font-bold text-gray-700">{getTimeSlotLabel(partner?.main_time_slot)}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>WhatsApp: <span className="font-bold text-rose-600">{partner?.whatsapp || '-'}</span></span>
                            </div>
                          </div>
                          {partner?.whatsapp && (
                            <Button asChild variant="outline" size="sm" className="w-full rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 h-9 font-bold text-[10px] uppercase">
                              <a href={`https://wa.me/${partner.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                                Chat WhatsApp
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
               </div>
            </div>
          )}


            {/* Tab 2: Jadwal Belajar */}
            {activeTab === 'jadwal' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {user && !isLoading && (
                  <div className="space-y-4 sm:space-y-6">
            {/* Mobile & Tablet View - Single Column Milestone Journey */}
            <div className="block lg:hidden">
              <div className="relative pl-10 pt-4 space-y-12">
                {/* Vertical Path - Gradient based on progress */}
                <div className="absolute left-4 top-4 bottom-4 w-1.5 bg-gray-100 rounded-full">
                  <div 
                    className="absolute top-0 left-0 w-full bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                    style={{ height: `${percentage}%` }}
                  ></div>
                </div>

                {timelineData.map((item, index) => {
                  const styles = getStatusStyles(item.status);
                  const isLast = index === timelineData.length - 1;

                  // Selection Task Logic (Simplified for clarity)
                  const isDaftarUlangCard = item.title === 'Mendaftar Ulang' &&
                                           (registrationStatus?.selectionStatus === 'selected' || registrationStatus?.registration?.status === 'approved') &&
                                           !registrationStatus.registration?.re_enrollment_completed;

                  return (
                    <div key={item.id} className="relative group">
                      {/* Anchor/Dot on the path */}
                      <div className={`absolute -left-8 top-5 w-4 h-4 rounded-full ring-4 ring-white shadow-sm z-20 transition-all duration-500 ${
                        styles.dotColor
                      } ${item.status === 'current' ? 'scale-150 animate-pulse' : ''}`}>
                         {item.status === 'completed' && <CheckCircle className="w-4 h-4 text-white -ml-0.5 -mt-0.5 scale-75" />}
                      </div>

                      <Card className={`${styles.cardBg} ${styles.cardBorder} relative z-10 transition-all duration-500 hover:shadow-2xl rounded-3xl overflow-hidden glass-premium group-hover:-translate-y-1 ${
                        item.status === 'current' ? 'ring-2 ring-yellow-400' : ''
                      }`}>
                        {/* Status Label (Top Right) */}
                        {item.status === 'current' && (
                          <div className="absolute top-0 right-0 px-4 py-1.5 bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase rounded-bl-2xl tracking-tighter">
                            Aktivitas Sekarang
                          </div>
                        )}

                        <CardContent className="p-6">
                          {/* Date & Icon */}
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${styles.iconBg} ${styles.iconColor}`}>
                              {item.icon}
                            </div>
                            <div className="text-right">
                               <p className={`text-[10px] font-black uppercase tracking-widest ${styles.textColor} opacity-60 mb-1`}>
                                 {item.day !== '-' ? item.day : 'Pekan'}
                               </p>
                               <p className={`text-xs font-bold ${styles.textColor}`}>
                                 {item.date}
                               </p>
                               {item.hijriDate !== '-' && (
                                 <p className="text-[10px] text-gray-400 mt-0.5">{item.hijriDate}</p>
                               )}
                            </div>
                          </div>

                          {/* Title & Desc */}
                          <div className="space-y-4">
                            <h3 className={`text-xl font-black ${styles.textColor} tracking-tight leading-tight`}>
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

                                // Show daftar ulang info based on status
                                // draft: belum selesai, submitted/approved: selesai
                                const isSubmittedOrApproved = daftarUlang?.status === 'submitted' || daftarUlang?.status === 'approved';
                                const isDraft = daftarUlang?.status === 'draft';

                                if (daftarUlang && isSubmittedOrApproved) {
                                  // Show completed status for submitted or approved
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

                                      {/* Show program/class info */}
                                      {registrationStatus.registration?.program && (
                                        <div className="mt-2">
                                          <p className={`text-xs ${styles.textColor} font-medium`}>Kelas:</p>
                                          <p className="text-xs text-green-700 font-semibold">{registrationStatus.registration.program.name}</p>
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
                                                {getDayNameFromNumber(daftarUlang.ujian_halaqah.day_of_week)}, {daftarUlang.ujian_halaqah.start_time} - {daftarUlang.ujian_halaqah.end_time}
                                              </p>
                                            </div>
                                          )}

                                          {/* Tashih Halaqah */}
                                          {daftarUlang.tashih_halaqah && (
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                                              <p className="text-xs font-semibold text-purple-800 mb-1">Tashih Halaqah</p>
                                              <p className="text-xs text-purple-700">{daftarUlang.tashih_halaqah.name}</p>
                                              <p className="text-xs text-purple-600">
                                                {getDayNameFromNumber(daftarUlang.tashih_halaqah.day_of_week)}, {daftarUlang.tashih_halaqah.start_time} - {daftarUlang.tashih_halaqah.end_time}
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
                                } else if (daftarUlang && isDraft) {
                                  // Draft status - show as incomplete
                                  return (
                                    <div className="space-y-2">
                                      <div className="flex items-start space-x-2">
                                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-orange-600" />
                                        <p className={`text-xs sm:text-sm text-orange-700 font-semibold leading-relaxed`}>
                                          Draft - Belum dikirim
                                        </p>
                                      </div>
                                      <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                        Silakan lengkapi dan kirim formulir daftar ulang.
                                      </p>
                                    </div>
                                  );
                                } else {
                                  // No daftar ulang yet - show status indicating belum mendaftar ulang
                                  const isEligible = registrationStatus?.selectionStatus === 'selected' || registrationStatus?.registration?.status === 'approved';

                                  return (
                                    <div className="space-y-2">
                                      {isEligible ? (
                                        <>
                                          <div className="flex items-start space-x-2">
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-orange-600" />
                                            <p className={`text-xs sm:text-sm text-orange-700 font-semibold leading-relaxed`}>
                                              Belum mendaftar ulang
                                            </p>
                                          </div>
                                          <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                            Silakan isi formulir daftar ulang untuk mengkonfirmasi keikutsertaan.
                                          </p>
                                        </>
                                      ) : (
                                        <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
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

            {/* Desktop View - Premium Milestone Path */}
            <div className="hidden lg:block relative py-20 px-10">
              {/* Central Path - Flowing Gradient */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-2 h-full bg-gray-50 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 w-full bg-gradient-to-b from-emerald-600 via-emerald-400 to-emerald-200 rounded-full transition-all duration-1000"
                  style={{ height: `${percentage}%` }}
                ></div>
              </div>

              <div className="space-y-32">
                {timelineData.map((item, index) => {
                  const styles = getStatusStyles(item.status);
                  const isLeftSide = index % 2 === 0;

                  const isDaftarUlangCard = item.title === 'Mendaftar Ulang' &&
                                           (registrationStatus?.selectionStatus === 'selected' || registrationStatus?.registration?.status === 'approved') &&
                                           !registrationStatus.registration?.re_enrollment_completed;

                  return (
                    <div key={item.id} className={`relative flex items-center ${isLeftSide ? 'justify-start' : 'justify-end'}`}>
                      {/* Milestone Dot on Central Path */}
                      <div className={`absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-4 border-white shadow-xl z-30 transition-all duration-700 flex items-center justify-center ${
                        styles.dotColor
                      } ${item.status === 'current' ? 'scale-125 ring-8 ring-yellow-400/20' : ''}`}>
                         {item.status === 'completed' ? (
                           <CheckCircle className="w-5 h-5 text-white" />
                         ) : item.status === 'current' ? (
                           <Sparkles className="w-5 h-5 text-white animate-spin-slow" />
                         ) : null}
                      </div>

                      {/* Card - Symmetrical Design */}
                      <div className={`w-[45%] ${isLeftSide ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
                        <Card className={`${styles.cardBg} ${styles.cardBorder} relative z-10 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-2 rounded-[32px] overflow-hidden glass-premium group ${
                          item.status === 'current' ? 'ring-2 ring-yellow-400' : ''
                        }`}>
                          {/* Inner Glow/Gradient */}
                          {item.status === 'current' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none" />
                          )}

                          <CardContent className="p-8">
                            <div className={`flex items-start gap-4 mb-6 ${isLeftSide ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className={`p-4 rounded-2xl ${styles.iconBg} ${styles.iconColor} shadow-inner`}>
                                {item.icon}
                              </div>
                              <div className="flex-grow">
                                <p className={`text-xs font-black uppercase tracking-[0.2em] ${styles.textColor} opacity-60 mb-2`}>
                                  {item.day !== '-' ? item.day : 'Pekan'} • {item.date}
                                </p>
                                <h3 className={`text-2xl font-black ${styles.textColor} tracking-tight leading-none`}>
                                  {item.title}
                                </h3>
                              </div>
                            </div>

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

                                // Show daftar ulang info based on status
                                // draft: belum selesai, submitted/approved: selesai
                                const isSubmittedOrApproved = daftarUlang?.status === 'submitted' || daftarUlang?.status === 'approved';
                                const isDraft = daftarUlang?.status === 'draft';

                                if (daftarUlang && isSubmittedOrApproved) {
                                  // Show completed status for submitted or approved
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

                                      {/* Show program/class info */}
                                      {registrationStatus.registration?.program && (
                                        <div className="mt-2">
                                          <p className={`text-xs ${styles.textColor} font-medium`}>Kelas:</p>
                                          <p className="text-xs text-green-700 font-semibold">{registrationStatus.registration.program.name}</p>
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
                                                {getDayNameFromNumber(daftarUlang.ujian_halaqah.day_of_week)}, {daftarUlang.ujian_halaqah.start_time} - {daftarUlang.ujian_halaqah.end_time}
                                              </p>
                                            </div>
                                          )}

                                          {/* Tashih Halaqah */}
                                          {daftarUlang.tashih_halaqah && (
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                                              <p className="text-xs font-semibold text-purple-800 mb-1">Tashih Halaqah</p>
                                              <p className="text-xs text-purple-700">{daftarUlang.tashih_halaqah.name}</p>
                                              <p className="text-xs text-purple-600">
                                                {getDayNameFromNumber(daftarUlang.tashih_halaqah.day_of_week)}, {daftarUlang.tashih_halaqah.start_time} - {daftarUlang.tashih_halaqah.end_time}
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
                                } else if (daftarUlang && isDraft) {
                                  // Draft status - show as incomplete
                                  return (
                                    <div className="space-y-2">
                                      <div className="flex items-start space-x-2">
                                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-orange-600" />
                                        <p className={`text-xs sm:text-sm text-orange-700 font-semibold leading-relaxed`}>
                                          Draft - Belum dikirim
                                        </p>
                                      </div>
                                      <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                        Silakan lengkapi dan kirim formulir daftar ulang.
                                      </p>
                                    </div>
                                  );
                                } else {
                                  // No daftar ulang yet - show status indicating belum mendaftar ulang
                                  const isEligible = registrationStatus?.selectionStatus === 'selected' || registrationStatus?.registration?.status === 'approved';

                                  return (
                                    <div className="space-y-2">
                                      {isEligible ? (
                                        <>
                                          <div className="flex items-start space-x-2">
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-orange-600" />
                                            <p className={`text-xs sm:text-sm text-orange-700 font-semibold leading-relaxed`}>
                                              Belum mendaftar ulang
                                            </p>
                                          </div>
                                          <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                            Silakan isi formulir daftar ulang untuk mengkonfirmasi keikutsertaan.
                                          </p>
                                        </>
                                      ) : (
                                        <p className={`text-xs sm:text-sm ${styles.textColor} leading-relaxed`}>
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
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
          </div>
        )}

      {/* Tab 3: Pencapaian Saya */}
      {activeTab === 'achievement' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Progress Overview Summary */}
                {user && !isLoading && (
          <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-4 sm:pb-6 relative border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-emerald-100 rounded-2xl">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">Statistik Perjalanan</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Ringkasan kemajuan hafalan Ukhti</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600">{completedCount}<span className="text-xs sm:text-sm text-gray-400 font-medium">/{totalCount}</span></span>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tighter">Tahapan Selesai</p>
                </div>
              </div>
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
                    className="bg-gradient-to-r from-teal-500 to-teal-600 h-1.5 sm:h-2 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Status Badge */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-2xl">
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                  <p className="text-xs sm:text-sm text-yellow-800 font-bold">
                    TAHAP SAAT INI: <span className="uppercase tracking-wide">{timelineData.find(item => item.status === 'current')?.title || 'Menunggu tahap berikutnya'}</span>
                  </p>
                </div>
                
                {estimationFinish.greg !== '-' && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-2xl">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <p className="text-xs sm:text-sm text-green-800 font-bold">
                      ESTIMASI SELESAI: <span className="uppercase tracking-wide">{estimationFinish.greg} / {estimationFinish.hijri}</span>
                    </p>
                  </div>
                )}
              </div>


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
                  <div className="text-4xl font-bold">{percentage}%</div>
                  <p className="text-green-100 text-sm">Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
                )}
              </div>
            )}

          {/* Edit Registration Modal */}
        {registrationStatus?.registration && (
          <EditTikrarRegistrationModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            registration={{
              id: registrationStatus.registration?.id || registrationStatus.registrationId || '',
              chosen_juz: registrationStatus.registration?.chosen_juz || '',
              main_time_slot: registrationStatus.registration?.main_time_slot || '',
              backup_time_slot: registrationStatus.registration?.backup_time_slot || '',
              full_name: registrationStatus.registration?.full_name || user?.full_name,
              wa_phone: registrationStatus.registration?.wa_phone,
              address: registrationStatus.registration?.address,
              motivation: registrationStatus.registration?.motivation,
            }}
          />
        )}
      </div>
    </div>
  );
}