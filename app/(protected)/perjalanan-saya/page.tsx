'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMyRegistrations, useAllRegistrations } from '@/hooks/useRegistrations';
import { useActiveBatch } from '@/hooks/useBatches';
import { useDashboardStats, useLearningJourney, useUserProgress, useJurnalStatus } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, BookOpen, Award, Target, Calendar, TrendingUp, Edit, Clock, Phone, MapPin, Ban, Info, RotateCcw, FileText, HeartHandshake, Star, Sparkles, User, BadgeCheck, Zap, Eye, Play, FileCheck } from 'lucide-react';
import { SWRLoadingFallback, SWRErrorFallback } from '@/lib/swr/providers';
import { EditTikrarRegistrationModal } from '@/components/EditTikrarRegistrationModal';
import { ReviewSubmissionModal } from '@/components/ReviewSubmissionModal';
import { Pendaftaran } from '@/types/database';
import { ExamEligibility } from '@/types/exam';
import { TimelineMilestone, TimelineItem, TimelineItemWithStatus } from '@/components/TimelineMilestone';
import { useBatchTimeline } from '@/hooks/useBatchTimeline';
import { formatFullDateIndo, formatDateIndo, getDayNameIndo, toHijri } from '@/lib/utils/date-helpers';
import { getRoleRank, ROLE_RANKS, isStaff } from '@/lib/roles';
import { cn } from '@/lib/utils';

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
  final_juz?: string;
  oral_total_score?: number;
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

// Helper functions for formatting
const getJuzLabel = (juz: string | undefined | null) => {
  if (!juz) return '-';
  const cleanJuz = juz.toUpperCase();
  if (cleanJuz.endsWith('A') || cleanJuz.endsWith('B')) {
    return `Juz ${cleanJuz.slice(0, -1)} (Bagian ${cleanJuz.slice(-1)})`;
  }
  return `Juz ${cleanJuz}`;
};

const getDayNameFromNumber = (dayNum: number | string | undefined | null) => {
  if (dayNum === undefined || dayNum === null) return '-';
  const num = typeof dayNum === 'string' ? parseInt(dayNum) : dayNum;
  const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[num] || '-';
};

export default function PerjalananSaya() {
  const { user, isLoading: authLoading, isAuthenticated, isUnauthenticated } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [examEligibility, setExamEligibility] = useState<ExamEligibility | null>(null);
  const [hasSessionError, setHasSessionError] = useState(false);
  const [pairingData, setPairingData] = useState<PairingData | null>(null);
  const [isLoadingPairing, setIsLoadingPairing] = useState(false);
  
  // Review Modal States
  const [reviewType, setReviewType] = useState<'written' | 'oral' | 'akad' | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Identify if user is Admin/Staff for preview mode
  const isAdmin = useMemo(() => {
    const primaryRole = (user as any)?.primaryRole;
    return getRoleRank(primaryRole) >= ROLE_RANKS.admin;
  }, [user]);

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
        (registration?.oral_total_score != null && registration?.oral_total_score > 0) ||
        (registration?.oral_score != null && registration?.oral_score > 0)
      ),
      oralSubmissionUrl: registration?.oral_submission_url,
      oralSubmittedAt: registration?.oral_submitted_at,
      oralAssessmentStatus: registration?.oral_assessment_status || 'pending',
      oralScore: registration?.oral_total_score || (registration as any)?.oral_score,
      registrationId: registration?.id,
      chosenJuz: registration?.chosen_juz,
      examScore: registration?.exam_score || (registration as any)?.written_quiz_score,
      writtenQuizSubmittedAt: registration?.written_quiz_submitted_at || (registration as any)?.written_submitted_at,
      selectionStatus: registration?.selection_status || 'pending',
    };
  }, [user, registrations]);

  const isJuz30 = registrationStatus?.chosenJuz?.startsWith('30') || false;

  const isLoading = authLoading || registrationsLoading;

  // PHASE TRACKER LOGIC
  const phases = useMemo(() => {
    if (!user || isLoading) return [];

    const isProfileComplete = !!(user.full_name && user.whatsapp && (user as any).tanggal_lahir);
    const isSelectionDone = registrationStatus?.selectionStatus && registrationStatus.selectionStatus !== 'pending';
    const isEnrollmentDone = registrationStatus?.registration?.re_enrollment_completed === true;
    
    const today = new Date();
    const reviewWeekEnd = batch?.review_week_end_date ? new Date(batch.review_week_end_date) : null;
    const isLearningDone = isEnrollmentDone && reviewWeekEnd && today > reviewWeekEnd;

    const graduationEnd = batch?.graduation_end_date ? new Date(batch.graduation_end_date) : null;
    const isGraduationDone = isLearningDone && graduationEnd && today > graduationEnd;

    // Sub-phase detailed logic & data formatting
    const hasOral = !!(registrationStatus?.hasOralSubmission);
    const hasWritten = !!(registrationStatus?.writtenQuizSubmittedAt || registrationStatus?.examScore);
    const hasAkad = !!(registrationStatus?.registration?.daftar_ulang);
    const hasPartner = !!(pairingData);
    
    const partner = [pairingData?.user_1, pairingData?.user_2, pairingData?.user_3].find(p => p && p.id !== user?.id);

    return [
      { 
        id: 1, name: 'Persiapan', status: isProfileComplete ? 'completed' : 'current', 
        desc: batch?.registration_start_date ? `${formatDateIndo(batch.registration_start_date)} - ${formatDateIndo(batch.registration_end_date || '')}` : 'Lengkapi Profil', 
        icon: <User className="w-4 h-4" />,
        subPhases: [
          { name: 'Buat Akun', done: true, data: user?.email },
          { name: 'Lengkapi Profil', done: isProfileComplete, data: isProfileComplete ? `${user.full_name} (${user.whatsapp})` : 'Belum lengkap', reviewType: isProfileComplete ? 'profile' : null }
        ]
      },
      { 
        id: 2, name: 'Seleksi', status: isSelectionDone ? 'completed' : (isProfileComplete ? 'current' : 'future'), 
        desc: batch?.selection_start_date ? `${formatDateIndo(batch.selection_start_date)} - ${formatDateIndo(batch.selection_end_date || '')}` : 'Ujian & Hasil', 
        icon: <FileText className="w-4 h-4" />,
        subPhases: [
          { name: 'Ujian Tertulis', done: hasWritten, data: hasWritten ? `Nilai: ${registrationStatus.examScore ?? '-'}` : 'Belum dikerjakan', reviewType: hasWritten ? 'written' : null },
          { name: 'Ujian Lisan', done: hasOral, data: hasOral ? (registrationStatus.oralAssessmentStatus === 'pass' ? 'Lulus ✓' : 'Selesai') : 'Belum rekaman', reviewType: hasOral ? 'oral' : null },
          { name: 'Pengumuman', done: isSelectionDone, data: isSelectionDone ? `Placement: Juz ${registrationStatus.registration?.final_juz || registrationStatus.chosenJuz}` : (batch?.selection_result_date ? `Mulai ${formatDateIndo(batch.selection_result_date)}` : 'Menunggu hasil') }
        ]
      },
      { 
        id: 3, name: 'Daftar Ulang', status: isEnrollmentDone ? 'completed' : (isSelectionDone ? 'current' : 'future'), 
        desc: batch?.re_enrollment_date ? `Mulai ${formatDateIndo(batch.re_enrollment_date)}` : 'Akad & Pasangan', 
        icon: <CheckCircle className="w-4 h-4" />,
        subPhases: [
          { name: 'Review Akad', done: hasAkad, data: hasAkad ? 'Sudah disetujui' : 'Belum ada data', reviewType: hasAkad ? 'akad' : null },
          { name: 'Pilih Pasangan', done: hasPartner, data: partner ? `${partner.full_name}` : 'Belum ada pasangan', reviewType: hasPartner ? 'pairing' : null },
          { name: 'Verifikasi', done: isEnrollmentDone, data: isEnrollmentDone ? 'Selesai ✓' : 'Belum terverifikasi' }
        ]
      },
      { 
        id: 4, name: 'Masa Belajar', status: isLearningDone ? 'completed' : (isEnrollmentDone ? 'current' : 'future'), 
        desc: batch?.opening_class_date ? `Aktif s/d ${formatDateIndo(batch.review_week_end_date || '')}` : 'Pekan 1 - 12', 
        icon: <BookOpen className="w-4 h-4" />,
        subPhases: [
          { name: 'Opening Class', done: isEnrollmentDone && today > new Date(batch?.opening_class_date || ''), data: batch?.opening_class_date ? formatDateIndo(batch.opening_class_date) : '-' },
          { name: 'Jurnal Tikrar', done: percentage >= 80, data: isEnrollmentDone ? `Progres: ${percentage}%` : 'Belum mulai' },
          { name: 'Muraja’ah', done: isLearningDone, data: isLearningDone ? 'Selesai' : (today > (reviewWeekEnd || new Date()) ? 'Berlangsung' : 'Akan datang') }
        ]
      },
      { 
        id: 5, name: 'Kelulusan', status: isGraduationDone ? 'completed' : (isLearningDone ? 'current' : 'future'), 
        desc: batch?.graduation_start_date ? formatDateIndo(batch.graduation_start_date) : 'Wisuda & Sertifikat', 
        icon: <Award className="w-4 h-4" />,
        subPhases: [
          { name: 'Ujian Akhir', done: isGraduationDone, data: isGraduationDone ? 'Selesai ✓' : '-' },
          { name: 'Wisuda', done: isGraduationDone, data: batch?.graduation_start_date ? formatDateIndo(batch.graduation_start_date) : '-' },
          { name: 'Sertifikat', done: isGraduationDone, data: isGraduationDone ? 'Sudah terbit' : 'Menunggu wisuda' }
        ]
      },
    ];
  }, [user, isLoading, registrationStatus, batch, percentage, pairingData]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper to get icon based on type
  const getIconForType = (type: string) => {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  // Function to parse Indonesian date string
  const parseIndonesianDate = (dateStr: string): Date => {
    if (dateStr.includes('Pekan')) {
      return new Date('2026-01-12');
    }

    const months: { [key: string]: number } = {
      'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
      'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
    };

    const parts = dateStr.split(' ');
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);

    return new Date(year, month, day);
  };

  // Create timeline data from batch or fallback to hardcoded data
  const baseTimelineData: TimelineItem[] = useMemo(() => {
    if (batch && (batch.registration_start_date || batch.re_enrollment_date || batch.opening_class_date)) {
      const formatDateRange = (start: string | null | undefined, end: string | null | undefined): string => {
        if (!start || !end) return '';
        return `${formatDateIndo(start)} - ${formatDateIndo(end)}`;
      };

      const items: TimelineItem[] = [];

      if (batch.registration_start_date && batch.registration_end_date) {
        items.push({
          id: 1,
          date: formatDateRange(batch.registration_start_date, batch.registration_end_date),
          day: 'Senin - Ahad',
          hijriDate: batch.registration_start_date ? toHijri(batch.registration_start_date) : '6 - 19 Jumadil Akhir 1446',
          title: 'Mendaftar Program',
          description: 'Pendaftaran awal program tahfidz',
          icon: getIconForType('registration')
        });
      }

      if (batch.selection_start_date && batch.selection_end_date) {
        items.push({
          id: 2,
          date: formatDateRange(batch.selection_start_date, batch.selection_end_date),
          day: 'Senin - Ahad',
          hijriDate: batch.selection_start_date ? toHijri(batch.selection_start_date) : '20 Jumadil Akhir - 3 Rajab 1446',
          title: 'Seleksi',
          description: 'Pengumpulan persyaratan berupa ujian seleksi lisan dan tulisan.',
          icon: getIconForType('selection'),
          hasSelectionTasks: true
        });
      }

      if (batch.selection_result_date) {
        items.push({
          id: 3,
          date: formatDateIndo(batch.selection_result_date),
          day: getDayNameIndo(batch.selection_result_date),
          hijriDate: toHijri(batch.selection_result_date),
          title: 'Pengumuman Hasil Seleksi',
          description: 'Pengumuman hasil seleksi.',
          icon: getIconForType('result'),
          hasSelectionTasks: false
        });
      }

      if (batch.re_enrollment_date) {
        items.push({
          id: 4,
          date: formatDateIndo(batch.re_enrollment_date),
          day: getDayNameIndo(batch.re_enrollment_date),
          hijriDate: toHijri(batch.re_enrollment_date),
          title: 'Mendaftar Ulang',
          description: 'Konfirmasi keikutsertaan dan pengumpulan akad daftar ulang.',
          icon: getIconForType('enrollment')
        });
      }

      if (batch.opening_class_date) {
        items.push({
          id: 5,
          date: formatDateIndo(batch.opening_class_date),
          day: getDayNameIndo(batch.opening_class_date),
          hijriDate: toHijri(batch.opening_class_date),
          title: 'Kelas Perdana Gabungan',
          description: 'Awal resmi program tahfidz dengan orientasi dan penentuan target.',
          icon: getIconForType('opening')
        });
      }

      return items;
    }
    return [];
  }, [batch]);

  // Calculate timeline status dynamically based on current date and registration status
  const timelineData = useMemo((): TimelineItemWithStatus[] => {
    if (!isClient) {
      return baseTimelineData.map(item => ({ ...item, status: 'future' as const }));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return baseTimelineData.map((item, index) => {
      if (index === 0 && registrationStatus?.hasRegistered) return { ...item, status: 'completed' as const };
      
      const isSelected = registrationStatus?.selectionStatus === 'selected';
      const isNotSelected = registrationStatus?.selectionStatus === 'not_selected';
      const isWaitlist = registrationStatus?.selectionStatus === 'waitlist';

      if (item.id === 2 && (isSelected || isNotSelected || isWaitlist)) return { ...item, status: 'completed' as const };
      if (item.id === 3 && (isSelected || isNotSelected || isWaitlist)) return { ...item, status: 'completed' as const };

      const itemDate = parseIndonesianDate(item.date);
      itemDate.setHours(0, 0, 0, 0);

      const diffTime = itemDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...item,
        status: diffDays < 0 ? 'completed' : (diffDays === 0 ? 'current' : 'future')
      };
    });
  }, [isClient, registrationStatus, baseTimelineData]);

  const estimationFinish = useMemo(() => {
    if (batch && batch.graduation_end_date) {
      return { greg: formatDateIndo(batch.graduation_end_date), hijri: toHijri(batch.graduation_end_date) };
    }
    return { greg: '-', hijri: '-' };
  }, [batch]);

  useEffect(() => {
    if (registrationsError && (registrationsError as any).code === 'SESSION_EXPIRED') {
      setHasSessionError(true);
      const timer = setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [registrationsError]);

  const fetchPairingData = async (currentBatchId: string | null) => {
    if (!user || !currentBatchId) return;
    setIsLoadingPairing(true);
    try {
      const response = await fetch(`/api/user/pairing?batch_id=${currentBatchId}`, { cache: 'no-store' });
      const result = await response.json();
      if (result.success) setPairingData(result.data);
    } catch (error) {
      console.error('Error fetching pairing data:', error);
    } finally {
      setIsLoadingPairing(false);
    }
  };

  useEffect(() => {
    if (batchId && user) fetchPairingData(batchId);
  }, [batchId, user]);

  const handleEditSuccess = () => window.location.reload();

  const getStatusStyles = (status: 'completed' | 'current' | 'future') => {
    switch (status) {
      case 'completed': return { cardBg: 'bg-white', cardBorder: 'border-emerald-100', textColor: 'text-emerald-900', iconBg: 'bg-emerald-100/50', iconColor: 'text-emerald-600', dotColor: 'bg-emerald-500', lineColor: 'bg-emerald-500' };
      case 'current': return { cardBg: 'bg-gradient-to-br from-yellow-50 to-white', cardBorder: 'border-yellow-200 shadow-yellow-100', textColor: 'text-yellow-900', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', dotColor: 'bg-yellow-500', lineColor: 'bg-yellow-200' };
      default: return { cardBg: 'bg-gray-50/50', cardBorder: 'border-gray-100 opacity-60', textColor: 'text-gray-400', iconBg: 'bg-gray-100', iconColor: 'text-gray-400', dotColor: 'bg-gray-200', lineColor: 'bg-gray-100' };
    }
  };

  const getPairingTypeLabel = (pairingType: string) => {
    switch (pairingType) {
      case 'self_match': return { label: 'Self Match' };
      case 'family': return { label: 'Family' };
      case 'tarteel': return { label: 'Tarteel' };
      case 'system_match': return { label: 'System Match' };
      default: return { label: pairingType };
    }
  };

  const getTimeSlotLabel = (slotValue: string | undefined) => {
    if (!slotValue) return '-';
    const slotLabels: Record<string, string> = {
      '04-06': '04-06 WIB', '06-09': '06-09 WIB', '09-12': '09-12 WIB', '12-15': '12-15 WIB',
      '15-18': '15-18 WIB', '18-21': '18-21 WIB', '21-24': '21-24 WIB'
    };
    return slotLabels[slotValue] || `${slotValue} WIB`;
  };

  if (hasSessionError) return <div className="p-12 text-center">Sesi berakhir, mengalihkan...</div>;
  if (!isClient) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="space-y-10 sm:space-y-16 animate-fadeIn pb-20">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-8 sm:p-12 text-white shadow-2xl">
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight">Perjalanan Hafalan <span className="text-emerald-300 italic">Ukhti</span></h1>
          <p className="text-green-100/70 text-lg max-w-xl font-medium">"Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya."</p>
        </div>
      </div>

      {/* 5-Phase Premium Progress Tracker */}
      <div className="max-w-6xl mx-auto w-full px-4">
        <div className="relative bg-white/40 backdrop-blur-md border border-white shadow-xl rounded-[2rem] p-6 sm:p-10">
          <h2 className="text-center text-emerald-900 font-black text-lg mb-10 uppercase tracking-widest">Fase Perjalanan Ukhti</h2>
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {phases.map((phase, idx) => (
              <div key={phase.id} className="relative flex md:flex-col items-center gap-4 md:gap-3 w-full md:w-[18%]">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg", phase.status === 'completed' ? "bg-emerald-500 text-white" : phase.status === 'current' ? "bg-yellow-400 text-yellow-900" : "bg-white text-gray-300")}>
                  {phase.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : phase.icon}
                </div>
                <div className="flex flex-col md:items-center text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fase {phase.id}</p>
                  <h4 className="text-sm font-bold text-gray-900">{phase.name}</h4>
                  <div className="mt-2 space-y-1">
                    {phase.subPhases.map((sub, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", sub.done ? "bg-emerald-500" : "bg-gray-200")} />
                        <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 group">
                          <span className="text-[9px] font-bold text-gray-900">{sub.name}</span>
                          <span className="text-[9px] font-medium text-gray-400">—</span>
                          <span className="text-[9px] font-medium text-gray-500">{sub.data}</span>
                          {(sub as any).reviewType && (
                            <button 
                              onClick={() => { 
                                setReviewType((sub as any).reviewType); 
                                setIsReviewModalOpen(true); 
                              }} 
                              className="ml-1 text-emerald-600 hover:text-emerald-800 transition-colors"
                              title={`Review ${sub.name}`}
                            >
                              <Eye className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Modals */}
      {registrationStatus?.registration && (
        <EditTikrarRegistrationModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          registration={{
            id: registrationStatus.registration?.id || '',
            chosen_juz: registrationStatus.registration?.chosen_juz || '',
            main_time_slot: registrationStatus.registration?.main_time_slot || '',
            backup_time_slot: registrationStatus.registration?.backup_time_slot || '',
            full_name: registrationStatus.registration?.full_name || user?.full_name || '',
            wa_phone: registrationStatus.registration?.wa_phone || '',
            address: registrationStatus.registration?.address,
            motivation: registrationStatus.registration?.motivation,
          }}
        />
      )}

      {/* Global Review Modal */}
      <ReviewSubmissionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        type={reviewType}
        registrationStatus={registrationStatus}
        pairingData={pairingData}
        user={user}
      />
    </div>
  );
}