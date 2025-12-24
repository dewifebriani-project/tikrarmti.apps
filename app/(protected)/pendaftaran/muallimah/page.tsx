'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useActiveBatch } from '@/hooks/useBatches';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calendar, BookOpen, GraduationCap, Heart, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Simple debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

type MuallimahFormData = {
  tajweed_institution: string;
  quran_institution: string;
  teaching_communities: string;
  memorized_tajweed_matan: string;
  studied_matan_exegesis: string;
  memorized_juz: string[];
  examined_juz: string[];
  certified_juz: string[];
  preferred_juz: string[]; // Changed to array for checkbox selection from juz_options
  class_type: 'tashih_ujian' | 'tashih_only' | 'ujian_only';
  preferred_max_thalibah?: number;
  // Schedule 1: Day (single) and Time range (start-end)
  schedule1_day: string;
  schedule1_time_start: string;
  schedule1_time_end: string;
  // Schedule 2: Day (single) and Time range (start-end) - Optional
  schedule2_day: string;
  schedule2_time_start: string;
  schedule2_time_end: string;
  // Paid class options
  wants_paid_class: boolean;
  paid_class_name?: string;
  paid_class_schedule1_day?: string;
  paid_class_schedule1_time_start?: string;
  paid_class_schedule1_time_end?: string;
  paid_class_schedule2_day?: string;
  paid_class_schedule2_time_start?: string;
  paid_class_schedule2_time_end?: string;
  paid_class_max_students?: number;
  paid_class_spp_percentage?: string; // '100', '80', or '60'
  paid_class_interest: string;
  understands_commitment: boolean;
  age?: number;
};

const dayOptions = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
  { value: 'ahad', label: 'Ahad' },
];

const classTypeOptions = [
  { value: 'tashih_ujian', label: 'Kelas Tashih + Ujian' },
  { value: 'tashih_only', label: 'Kelas Tashih Saja' },
  { value: 'ujian_only', label: 'Kelas Ujian Saja' },
];

// SPP percentage options
const sppPercentageOptions = [
  { value: '100', label: '100% (Tanpa Musyrifah)' },
  { value: '80', label: '80% (Didampingi Musyrifah)' },
  { value: '60', label: '60% (Jika memiliki 1 kelas gratis di MTI)' },
];

// All juz options for checkboxes (1-30)
const allJuzOptions = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: `Juz ${i + 1}`
}));

function MuallimahRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { activeBatch, isLoading: batchLoading } = useActiveBatch();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [batchId, setBatchId] = useState<string>('');
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // Refs for auto-focus to first empty field
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>({});

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingRegistrationId, setExistingRegistrationId] = useState<string | null>(null);
  const [muallimahRegistration, setMuallimahRegistration] = useState<any>(null);

  const [formData, setFormData] = useState<MuallimahFormData>({
    tajweed_institution: '',
    quran_institution: '',
    teaching_communities: '',
    memorized_tajweed_matan: '',
    studied_matan_exegesis: '',
    memorized_juz: [],
    examined_juz: [],
    certified_juz: [],
    preferred_juz: [], // Changed to empty array for checkboxes
    class_type: 'tashih_ujian',
    preferred_max_thalibah: undefined,
    schedule1_day: '',
    schedule1_time_start: '',
    schedule1_time_end: '',
    schedule2_day: '',
    schedule2_time_start: '',
    schedule2_time_end: '',
    wants_paid_class: false,
    paid_class_name: '',
    paid_class_schedule1_day: '',
    paid_class_schedule1_time_start: '',
    paid_class_schedule1_time_end: '',
    paid_class_schedule2_day: '',
    paid_class_schedule2_time_start: '',
    paid_class_schedule2_time_end: '',
    paid_class_max_students: undefined,
    paid_class_spp_percentage: '',
    paid_class_interest: '',
    understands_commitment: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Set batchId from URL parameter or activeBatch
  useEffect(() => {
    const batchFromUrl = searchParams.get('batch');
    if (batchFromUrl) {
      setBatchId(batchFromUrl);
      fetchBatchInfo(batchFromUrl);
    } else if (activeBatch?.id && !batchId) {
      // If no batch in URL, use the active batch from database
      setBatchId(activeBatch.id);
      setBatchInfo(activeBatch);
    }
  }, [searchParams, activeBatch]);

  // Load user data from users table
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Check for existing muallimah registration
  useEffect(() => {
    if (user && batchId) {
      fetchMuallimahRegistration();
    }
  }, [user, batchId]);

  // Auto-focus to first empty field after data is loaded
  useEffect(() => {
    // Only auto-focus if not in edit mode and form is not submitted
    if (!isEditMode && !isFormSubmitted && userData && batchId) {
      // Order of fields to check and auto-focus
      const fieldOrder = [
        'tajweed_institution',
        'quran_institution',
        'schedule1_day',
        'schedule1_time_start',
        'schedule1_time_end',
      ];

      // Find first empty field and focus it
      for (const field of fieldOrder) {
        const value = formData[field as keyof MuallimahFormData];
        if (!value || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0)) {
          setTimeout(() => {
            const ref = fieldRefs.current[field];
            if (ref) {
              ref.focus();
              ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500); // Delay to ensure DOM is ready
          break;
        }
      }
    }
  }, [userData, batchId, isEditMode, isFormSubmitted]);

  const fetchMuallimahRegistration = async () => {
    try {
      const { data, error } = await supabase
        .from('muallimah_registrations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('batch_id', batchId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // User has existing registration
        setExistingRegistrationId(data.id);
        setMuallimahRegistration(data);

        if (data.status === 'approved' || data.status === 'rejected') {
          // Form is submitted and processed, read-only mode
          setIsFormSubmitted(true);
        } else {
          // For pending/review status, allow editing
          setIsEditMode(true);
        }

        // Parse JSON fields
        const preferredSchedule = typeof data.preferred_schedule === 'string'
          ? JSON.parse(data.preferred_schedule)
          : data.preferred_schedule;
        const backupSchedule = typeof data.backup_schedule === 'string'
          ? JSON.parse(data.backup_schedule)
          : data.backup_schedule;
        const paidClassInterest = data.paid_class_interest && typeof data.paid_class_interest === 'string'
          ? JSON.parse(data.paid_class_interest)
          : data.paid_class_interest;

        setFormData({
          tajweed_institution: data.tajweed_institution || '',
          quran_institution: data.quran_institution || '',
          teaching_communities: data.teaching_communities || '',
          memorized_tajweed_matan: data.memorized_tajweed_matan || '',
          studied_matan_exegesis: data.studied_matan_exegesis || '',
          memorized_juz: data.memorized_juz ? data.memorized_juz.split(', ') : [],
          examined_juz: data.examined_juz ? data.examined_juz.split(', ') : [],
          certified_juz: data.certified_juz ? data.certified_juz.split(', ') : [],
          preferred_juz: data.preferred_juz ? (Array.isArray(data.preferred_juz) ? data.preferred_juz : data.preferred_juz.split(', ')) : [],
          class_type: data.class_type || 'tashih_ujian',
          preferred_max_thalibah: data.preferred_max_thalibah,
          schedule1_day: preferredSchedule?.day || '',
          schedule1_time_start: preferredSchedule?.time_start || '',
          schedule1_time_end: preferredSchedule?.time_end || '',
          schedule2_day: backupSchedule?.day || '',
          schedule2_time_start: backupSchedule?.time_start || '',
          schedule2_time_end: backupSchedule?.time_end || '',
          wants_paid_class: !!paidClassInterest,
          paid_class_name: paidClassInterest?.name || '',
          paid_class_schedule1_day: paidClassInterest?.schedule1_day || '',
          paid_class_schedule1_time_start: paidClassInterest?.schedule1_time_start || '',
          paid_class_schedule1_time_end: paidClassInterest?.schedule1_time_end || '',
          paid_class_schedule2_day: paidClassInterest?.schedule2_day || '',
          paid_class_schedule2_time_start: paidClassInterest?.schedule2_time_start || '',
          paid_class_schedule2_time_end: paidClassInterest?.schedule2_time_end || '',
          paid_class_max_students: paidClassInterest?.max_students,
          paid_class_spp_percentage: paidClassInterest?.spp_percentage || '',
          paid_class_interest: paidClassInterest?.additional_info || '',
          understands_commitment: data.understands_commitment || false,
          age: data.age,
        });
      }
    } catch (error) {
      console.error('Error fetching muallimah registration:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserData(data);

      // Calculate age from tanggal_lahir
      if (data?.tanggal_lahir) {
        const birthDate = new Date(data.tanggal_lahir);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setFormData(prev => ({ ...prev, age }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchBatchInfo = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setBatchInfo(data);
    } catch (error) {
      console.error('Error fetching batch info:', error);
      toast.error('Gagal memuat informasi batch');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Auto-save draft after field change (debounced)
    autoSaveDraft();
  };

  // Auto-save draft functionality
  const autoSaveDraft = useCallback(
    debounce(async () => {
      if (!user || !batchId || isFormSubmitted) return;

      try {
        setAutoSaving(true);
        const draftData = {
          user_id: user.id,
          batch_id: batchId,
          // Save only form fields, not user data
          tajweed_institution: formData.tajweed_institution || null,
          quran_institution: formData.quran_institution || null,
          memorized_tajweed_matan: formData.memorized_tajweed_matan || null,
          studied_matan_exegesis: formData.studied_matan_exegesis || null,
          memorized_juz: formData.memorized_juz.length > 0 ? formData.memorized_juz.join(', ') : null,
          examined_juz: formData.examined_juz.length > 0 ? formData.examined_juz.join(', ') : null,
          certified_juz: formData.certified_juz.length > 0 ? formData.certified_juz.join(', ') : null,
          preferred_juz: formData.preferred_juz.length > 0 ? formData.preferred_juz.join(', ') : null,
          class_type: formData.class_type,
          preferred_max_thalibah: formData.preferred_max_thalibah || null,
          teaching_communities: formData.teaching_communities || null,
          paid_class_interest: formData.wants_paid_class ? JSON.stringify({
            name: formData.paid_class_name || null,
            schedule1_day: formData.paid_class_schedule1_day || null,
            schedule1_time_start: formData.paid_class_schedule1_time_start || null,
            schedule1_time_end: formData.paid_class_schedule1_time_end || null,
            schedule2_day: formData.paid_class_schedule2_day || null,
            schedule2_time_start: formData.paid_class_schedule2_time_start || null,
            schedule2_time_end: formData.paid_class_schedule2_time_end || null,
            max_students: formData.paid_class_max_students || null,
            spp_percentage: formData.paid_class_spp_percentage || null,
            additional_info: formData.paid_class_interest || null,
          }) : null,
        };

        // Check if draft exists
        const { data: existingDraft } = await supabase
          .from('muallimah_registrations')
          .select('id')
          .eq('user_id', user.id)
          .eq('batch_id', batchId)
          .eq('status', 'draft')
          .maybeSingle();

        if (existingDraft) {
          // Update existing draft
          await supabase
            .from('muallimah_registrations')
            .update(draftData)
            .eq('id', existingDraft.id);
        } else if (!existingRegistrationId) {
          // Create new draft only if no pending/review registration exists
          await supabase
            .from('muallimah_registrations')
            .insert({
              ...draftData,
              status: 'draft',
              submitted_at: new Date().toISOString(),
            });
        }

        setLastSavedAt(new Date());
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        setAutoSaving(false);
      }
    }, 1000), // 1 second debounce
    [formData, user, batchId, existingRegistrationId, isFormSubmitted]
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tajweed_institution?.trim()) {
      newErrors.tajweed_institution = 'Lembaga belajar tajwid harus diisi';
    }
    if (!formData.quran_institution?.trim()) {
      newErrors.quran_institution = 'Lembaga hafal Quran harus diisi';
    }
    if (!formData.preferred_juz || formData.preferred_juz.length === 0) {
      newErrors.preferred_juz = 'Juz yang bersedia diampu harus dipilih minimal satu';
    }
    if (!formData.schedule1_day) {
      newErrors.schedule1_day = 'Pilih hari untuk Jadwal 1';
    }
    if (!formData.schedule1_time_start) {
      newErrors.schedule1_time_start = 'Pilih jam mulai untuk Jadwal 1';
    }
    if (!formData.schedule1_time_end) {
      newErrors.schedule1_time_end = 'Pilih jam selesai untuk Jadwal 1';
    }
    // Note: Schedule 2 is optional, so no validation required
    // Validate paid class fields if user wants to open paid class
    if (formData.wants_paid_class) {
      if (!formData.paid_class_name?.trim()) {
        newErrors.paid_class_name = 'Nama kelas harus diisi';
      }
      if (!formData.paid_class_schedule1_day) {
        newErrors.paid_class_schedule1_day = 'Pilih hari untuk Jadwal 1';
      }
      if (!formData.paid_class_schedule1_time_start) {
        newErrors.paid_class_schedule1_time_start = 'Pilih jam mulai untuk Jadwal 1';
      }
      if (!formData.paid_class_schedule1_time_end) {
        newErrors.paid_class_schedule1_time_end = 'Pilih jam selesai untuk Jadwal 1';
      }
      if (!formData.paid_class_max_students || formData.paid_class_max_students < 1) {
        newErrors.paid_class_max_students = 'Jumlah maksimal peserta harus diisi';
      }
      if (!formData.paid_class_spp_percentage) {
        newErrors.paid_class_spp_percentage = 'Persentase SPP harus dipilih';
      }
    }
    if (!formData.understands_commitment) {
      newErrors.understands_commitment = 'Ukhti harus memahami komitmen program';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper to format schedule for storage
  const formatSchedule = (day: string, timeStart: string, timeEnd: string) => {
    const dayLabel = dayOptions.find(d => d.value === day)?.label || day;
    return { day: dayLabel, time_start: timeStart, time_end: timeEnd };
  };

  // Helper to format paid class schedule
  const formatPaidClassSchedule = (day: string, timeStart: string, timeEnd: string) => {
    const dayLabel = dayOptions.find(d => d.value === day)?.label || day;
    return {
      day: dayLabel,
      time_start: timeStart,
      time_end: timeEnd
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchId) {
      toast.error('Batch ID tidak ditemukan');
      return;
    }

    if (!validateForm()) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !authUser) {
        toast.error('Ukhti harus login terlebih dahulu');
        router.push('/login');
        return;
      }

      // Submit muallimah registration data
      const schedule1Formatted = formatSchedule(formData.schedule1_day, formData.schedule1_time_start, formData.schedule1_time_end);
      let schedule2Formatted = null;
      if (formData.schedule2_day && formData.schedule2_time_start && formData.schedule2_time_end) {
        schedule2Formatted = formatSchedule(formData.schedule2_day, formData.schedule2_time_start, formData.schedule2_time_end);
      }

      const submitData = {
        user_id: authUser.id,
        batch_id: batchId,
        // Data from users table (not in form)
        full_name: userData?.full_name || authUser.user_metadata?.full_name || authUser.email || '',
        birth_date: userData?.tanggal_lahir || new Date().toISOString(),
        birth_place: userData?.tempat_lahir || '-',
        address: userData?.alamat || '-',
        whatsapp: userData?.whatsapp || authUser.phone || '-',
        email: authUser.email || '',
        education: '-', // Not in current schema, provide default value
        occupation: userData?.pekerjaan || '-',
        memorization_level: '-', // Required by DB, provide default value
        // New fields from form
        tajweed_institution: formData.tajweed_institution,
        quran_institution: formData.quran_institution,
        teaching_communities: formData.teaching_communities || null,
        memorized_tajweed_matan: formData.memorized_tajweed_matan || null,
        studied_matan_exegesis: formData.studied_matan_exegesis || null,
        memorized_juz: formData.memorized_juz.length > 0 ? formData.memorized_juz.join(', ') : null,
        examined_juz: formData.examined_juz.length > 0 ? formData.examined_juz.join(', ') : null,
        certified_juz: formData.certified_juz.length > 0 ? formData.certified_juz.join(', ') : null,
        preferred_juz: formData.preferred_juz.length > 0 ? formData.preferred_juz.join(', ') : '',
        class_type: formData.class_type,
        preferred_max_thalibah: formData.preferred_max_thalibah || null,
        teaching_experience: '-', // Legacy field, required by DB
        teaching_years: null,
        teaching_institutions: null,
        // Store schedule as JSON string
        preferred_schedule: JSON.stringify(schedule1Formatted),
        backup_schedule: schedule2Formatted ? JSON.stringify(schedule2Formatted) : JSON.stringify({ day: '', time_start: '', time_end: '' }), // Provide default for required field
        timezone: 'WIB',
        paid_class_interest: formData.wants_paid_class ? JSON.stringify({
          name: formData.paid_class_name || null,
          schedule1: formData.paid_class_schedule1_day
            ? formatPaidClassSchedule(formData.paid_class_schedule1_day, formData.paid_class_schedule1_time_start || '', formData.paid_class_schedule1_time_end || '')
            : null,
          schedule2: formData.paid_class_schedule2_day
            ? formatPaidClassSchedule(formData.paid_class_schedule2_day, formData.paid_class_schedule2_time_start || '', formData.paid_class_schedule2_time_end || '')
            : null,
          max_students: formData.paid_class_max_students || null,
          spp_percentage: formData.paid_class_spp_percentage || null,
          additional_info: formData.paid_class_interest || null,
        }) : null,
        understands_commitment: formData.understands_commitment,
        age: formData.age,
        motivation: null,
        special_skills: null,
        health_condition: null,
      };

      if (isEditMode && existingRegistrationId) {
        // Update existing registration
        const { error: updateError } = await supabase
          .from('muallimah_registrations')
          .update(submitData)
          .eq('id', existingRegistrationId)
          .eq('user_id', authUser.id);

        if (updateError) {
          console.error('=== UPDATE ERROR DETAILS ===');
          console.error('Error message:', updateError.message);
          console.error('Error details:', updateError.details);
          console.error('Error hint:', updateError.hint);
          console.error('Error code:', updateError.code);
          console.error('Full error object:', JSON.stringify(updateError, null, 2));
          console.error('Submit data being sent:', JSON.stringify(submitData, null, 2));
          console.error('==========================');
          toast.error(`Gagal memperbarui data pendaftaran: ${updateError.message || 'Unknown error'}`);
          throw updateError;
        }

        toast.success('Alhamdulillah! Data pendaftaran Muallimah berhasil diperbarui!');
      } else {
        // Create new registration
        const { error: submitError } = await supabase
          .from('muallimah_registrations')
          .insert({
            ...submitData,
            status: 'pending',
            submitted_at: new Date().toISOString(),
          });

        if (submitError) {
          console.error('=== SUBMIT ERROR DETAILS ===');
          console.error('Error message:', submitError.message);
          console.error('Error details:', submitError.details);
          console.error('Error hint:', submitError.hint);
          console.error('Error code:', submitError.code);
          console.error('Full error object:', JSON.stringify(submitError, null, 2));
          console.error('Submit data being sent:', JSON.stringify(submitData, null, 2));
          console.error('==========================');
          toast.error(`Gagal mengirim pendaftaran: ${submitError.message || 'Unknown error'}`);
          throw submitError;
        }

        toast.success('Alhamdulillah! Pendaftaran sebagai Muallimah berhasil dikirim!');
      }

      router.push('/pendaftaran/success?program=muallimah');

    } catch (error: any) {
      console.error('Submit error:', error);
      // Toast already shown above, no need to show again
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {authLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Memeriksa autentikasi...</p>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Mengalihkan ke halaman login...</p>
          </div>
        </div>
      ) : batchLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Memuat informasi batch...</p>
          </div>
        </div>
      ) : !batchId ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <Alert className="mb-4">
              <AlertDescription className="text-red-800">
                <p className="font-semibold">Tidak ada batch aktif</p>
                <p className="text-sm mt-2">Mohon maaf, saat ini tidak ada batch pendaftaran yang dibuka. Silakan hubungi admin untuk informasi lebih lanjut.</p>
              </AlertDescription>
            </Alert>
            <Link href="/pendaftaran">
              <Button variant="outline">Kembali ke Program</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <Link href="/pendaftaran" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-xs sm:text-sm">
              ← Kembali ke Program
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Formulir Pendaftaran Mu'allimah
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-xs sm:text-sm">
              Batch 2 (Juz 1, 28, 29, 30) • Durasi 13 Pekan (5 Januari - 5 April 2026)
            </p>
          </div>

          {/* Commitment Notice */}
          <Card className="mb-4 sm:mb-6 border-green-200 bg-green-50">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="text-xs sm:text-sm text-gray-800 space-y-2 sm:space-y-3 prose prose-sm max-w-none">
                <p className="font-bold text-green-900 text-lg">Bismillah..</p>
                <p className="font-semibold text-green-800">Hayyakillah</p>
                <p className="font-semibold text-green-800">Ahlan wasahlan Mu'allimaty kesayangan..</p>

                <p className="font-medium text-gray-900">📝 Formulir ini adalah formulir pendaftaran Mu'allimah MTI Batch 2</p>

                <p className="font-medium text-gray-900">📆 Durasi program: InsyaAllah selama 13 Pekan dimulai dari tanggal 5 Januari - 5 April 2026 untuk target hafalan 1/2 juz.</p>
                <ul className="list-none pl-0 space-y-1 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">•</span>
                    <span>Pekan 1 (5-11 Januari): Tashih</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">•</span>
                    <span>Pekan 2-11 (12 Januari - 5 April): Ziyadah</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">•</span>
                    <span>(Catatan: 15-29 Maret adalah Libur Lebaran)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">•</span>
                    <span>Pekan 12 (6-12 April): Muroja'ah</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">•</span>
                    <span>Pekan 13 (13-19 April): Ujian</span>
                  </li>
                </ul>

                <p className="font-medium text-gray-900">🎯 Target hafalan harian thalibah: 1 halaman perpekan (1/4 halaman per hari, 4 hari dalam sepekan)</p>
                <ul className="list-none pl-0 space-y-1 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Tashih wajib sekali sepekan untuk kurikulum ziyadah pekan depan, jadwal menyesuaikan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Ujian wajib sekali sepekan untuk kurikulum selesai ziyadah pekanan, jadwal menyesuaikan</span>
                  </li>
                </ul>

                <p className="font-bold text-green-900 mt-4">🤝 Komitmen & Etika</p>
                <ul className="list-none pl-0 space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Program ini adalah program gratis untuk ummat, MTI belum bisa menjanjikan ujrah apapun untuk partisipasi mu'allimaty dalam program ini.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Apapun keluhan dan keberatan pribadi yang dirasakan selama program berlangsung, mohon langsung komunikasikan kepada kak Mara (0813-1365-0842) untuk mendapatkan solusi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Untuk masalah teknis link zoom silahkan langsung komunikasikan kepada kak Ucy (082229370282).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Untuk masalah perizinan udzur silahkan ke musyrifah masing-masing. (diharapkan info udzur disampaikan minimal 1 jam sebelum kelas, untuk meminimalisir kekecewaan tholibah)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Karena ini program gratis, apabila mu'allimaty ada udzur, MTI tidak menuntut untuk mengganti jadwal kelas, Tholibah akan kami arahkan untuk masuk kelas-kelas umum di MTI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Untuk Mu'allimaty yang telah mempunyai 2 kelas gratis di MTI, boleh membuka kelas berbayar sesuai dengan keahlian masing-masing di MTI dengan SPP kelas 100% tanpa musyrifah, 80% didampingi musyrifah, 60% jika memiliki 1 kelas gratis di MTI.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Program ini baru angkatan kedua dan gratis, kami akui masih banyak kekurangan/ketidaksempurnaan di sana-sini, kami berusaha melakukan semaksimal mungkin energi kami untuk program ini, tapi kami tidak melayani tuntutan professionalisme berlebih atau kesempurnaan. MTI adalah rumah bagi kita, yang anggotanya adalah keluarga bagaikan ibu dengan anak, kakak dengan adik, yang saling menyayangi, mengingatkan, melengkapi kelemahan dan kekurangan masing-masing untuk kebaikan dengan target semoga Allah kumpulkan kita di Jannah Firdaus Al'Ala.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Formulir ini sebagai akad yang akan diperbaharui setiap batch atau angkatan sehingga mu'allimah hanya terikat dengan komitmen di MTI hanya dalam 11 pekan kurikulum per periode.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Apabila kurikulum telah selesai, mu'allimah bebas untuk melanjutkan jika masih berkenan dan nyaman dengan MTI, cuti apabila ada udzur atau mundur apabila sudah tidak berkenan.</span>
                  </li>
                </ul>
                <p className="font-semibold text-green-800 mt-4">Semoga Allah memudahkan langkah kita ikut andil dalam penjagaan Al-Quran dan semoga Allah Ta'ala terima sebagai amal jariyah yang mengalir hingga hari kiamat, Aamiin. 🌿</p>
              </div>
            </CardContent>
          </Card>

          {/* User Info Display (from register) */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4">
              <CardTitle className="text-base sm:text-lg">Data Diri (Dari Akun Muallimatiy)</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Data berikut diambil dari akun yang sudah terdaftar</CardDescription>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm space-y-1.5 sm:space-y-2 px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-1 sm:gap-y-2">
                <div><span className="text-gray-500">Nama:</span> {userData?.full_name || user?.full_name || '-'}</div>
                <div><span className="text-gray-500">Kunyah:</span> {userData?.nama_kunyah || '-'}</div>
                <div><span className="text-gray-500">Email:</span> {user?.email || '-'}</div>
                <div><span className="text-gray-500">WhatsApp:</span> {userData?.whatsapp || '-'}</div>
                <div><span className="text-gray-500">Telegram:</span> {userData?.telegram || '-'}</div>
                <div><span className="text-gray-500">Negara:</span> {userData?.negara || '-'}</div>
                <div><span className="text-gray-500">Provinsi:</span> {userData?.provinsi || '-'}</div>
                <div><span className="text-gray-500">Kota:</span> {userData?.kota || '-'}</div>
                <div className="col-span-1 sm:col-span-2"><span className="text-gray-500">Alamat:</span> {userData?.alamat || '-'}</div>
                <div><span className="text-gray-500">Tanggal Lahir:</span> {userData?.tanggal_lahir ? new Date(userData.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>
                <div><span className="text-gray-500">Tempat Lahir:</span> {userData?.tempat_lahir || '-'}</div>
                <div><span className="text-gray-500">Jenis Kelamin:</span> {userData?.jenis_kelamin || '-'}</div>
                <div><span className="text-gray-500">Pekerjaan:</span> {userData?.pekerjaan || '-'}</div>
                <div><span className="text-gray-500">Zona Waktu:</span> {userData?.zona_waktu || '-'}</div>
                <div><span className="text-gray-500">Usia:</span> {formData.age || '-'} tahun</div>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3">
                Untuk mengubah data di atas, silakan edit profil di menu Pengaturan
              </p>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3">
              {isFormSubmitted && (
                <Alert className="bg-yellow-50 border-yellow-200 mb-4">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-xs sm:text-sm">
                    <strong>Pendaftaran Terkirim:</strong> Pendaftaran ukhti sudah dikirim dan sedang diproses. Status pendaftaran: <strong>{muallimahRegistration?.status}</strong>.
                  </AlertDescription>
                </Alert>
              )}
              {isEditMode && !isFormSubmitted && (
                <Alert className="bg-blue-50 border-blue-200 mb-4">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-xs sm:text-sm">
                    <strong>Edit Mode:</strong> Ukhti sedang mengedit data pendaftaran yang sudah ada. Perubahan akan disimpan setelah menekan tombol "Update Pendaftaran".
                  </AlertDescription>
                </Alert>
              )}
              {/* Auto-save status */}
              {!isFormSubmitted && (
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>
                    {autoSaving ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Menyimpan...
                      </span>
                    ) : lastSavedAt ? (
                      <span>Tersimpan {lastSavedAt.toLocaleTimeString('id-ID')}</span>
                    ) : (
                      <span>Auto-save aktif</span>
                    )}
                  </span>
                </div>
              )}
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Formulir Pendaftaran
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {isFormSubmitted
                  ? 'Pendaftaran terkirim - Formulir hanya bisa dilihat'
                  : isEditMode
                  ? 'Edit data pendaftaran Muallimah'
                  : 'Lengkapi formulir berikut untuk mendaftar sebagai Muallimah'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

                {/* Section 1: Pendidikan & Pengalaman */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Pendidikan & Pengalaman
                  </h3>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="tajweed_institution" className="text-xs sm:text-sm">Nama Lembaga Belajar Tajwid *</Label>
                    <Input
                      id="tajweed_institution"
                      ref={(el) => { fieldRefs.current.tajweed_institution = el; }}
                      value={formData.tajweed_institution}
                      onChange={(e) => handleInputChange('tajweed_institution', e.target.value)}
                      placeholder="Contoh: Ma'had Tahfidz Al-Quran..."
                      disabled={isFormSubmitted}
                      className={`text-xs sm:text-sm py-2 sm:py-2.5 ${errors.tajweed_institution ? 'border-red-500' : ''} ${isFormSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {errors.tajweed_institution && <p className="text-xs sm:text-sm text-red-500">{errors.tajweed_institution}</p>}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="quran_institution" className="text-xs sm:text-sm">Nama Lembaga Menghafal Al-Quran *</Label>
                    <Input
                      id="quran_institution"
                      value={formData.quran_institution}
                      onChange={(e) => handleInputChange('quran_institution', e.target.value)}
                      placeholder="Contoh: Pesantren Tahfidz..."
                      className={`text-xs sm:text-sm py-2 sm:py-2.5 ${errors.quran_institution ? 'border-red-500' : ''}`}
                    />
                    {errors.quran_institution && <p className="text-xs sm:text-sm text-red-500">{errors.quran_institution}</p>}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="teaching_communities" className="text-xs sm:text-sm">Komunitas Tempat Mengajar (Opsional)</Label>
                    <Input
                      id="teaching_communities"
                      value={formData.teaching_communities}
                      onChange={(e) => handleInputChange('teaching_communities', e.target.value)}
                      placeholder="Sebutkan jika ada kelas di komunitas lain"
                      className="text-xs sm:text-sm py-2 sm:py-2.5"
                    />
                    <p className="text-[10px] sm:text-xs text-gray-500">Jika ukhti mengajar di beberapa komunitas, pisahkan dengan koma</p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="memorized_tajweed_matan" className="text-xs sm:text-sm">Matan Tajwid yang Pernah Dihafal (Opsional)</Label>
                    <Input
                      id="memorized_tajweed_matan"
                      value={formData.memorized_tajweed_matan}
                      onChange={(e) => handleInputChange('memorized_tajweed_matan', e.target.value)}
                      placeholder="Contoh: Matan Al-Jurumiyyah"
                      className="text-xs sm:text-sm py-2 sm:py-2.5"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="studied_matan_exegesis" className="text-xs sm:text-sm">Syarah Matan yang Pernah Dipelajari (Opsional)</Label>
                    <Textarea
                      id="studied_matan_exegesis"
                      value={formData.studied_matan_exegesis}
                      onChange={(e) => handleInputChange('studied_matan_exegesis', e.target.value)}
                      placeholder="Sebutkan syarah matan yang pernah dipelajari"
                      rows={2}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <Separator />

                {/* Section 2: Hafalan */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Hafalan Al-Quran
                  </h3>

                  <div className="space-y-2 overflow-x-auto pb-2">
                    <Label className="text-xs sm:text-sm whitespace-nowrap">Juz yang Pernah Dihafal (Opsional)</Label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 min-w-max">
                      {allJuzOptions.map((juz) => (
                        <label
                          key={juz.value}
                          htmlFor={`memorized_juz_${juz.value}`}
                          className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 cursor-pointer transition-all ${
                            formData.memorized_juz.includes(juz.value)
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                          }`}
                        >
                          <span className="text-sm font-medium">{juz.value}</span>
                          <input
                            type="checkbox"
                            id={`memorized_juz_${juz.value}`}
                            className="hidden"
                            checked={formData.memorized_juz.includes(juz.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInputChange('memorized_juz', [...formData.memorized_juz, juz.value]);
                              } else {
                                handleInputChange('memorized_juz', formData.memorized_juz.filter((j) => j !== juz.value));
                              }
                            }}
                          />
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Pilih juz yang pernah dihafal</p>
                  </div>

                  <div className="space-y-2 overflow-x-auto pb-2">
                    <Label className="text-xs sm:text-sm whitespace-nowrap">Juz yang Pernah Diujikankan (Opsional)</Label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 min-w-max">
                      {allJuzOptions.map((juz) => (
                        <label
                          key={juz.value}
                          htmlFor={`examined_juz_${juz.value}`}
                          className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 cursor-pointer transition-all ${
                            formData.examined_juz.includes(juz.value)
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                          }`}
                        >
                          <span className="text-sm font-medium">{juz.value}</span>
                          <input
                            type="checkbox"
                            id={`examined_juz_${juz.value}`}
                            className="hidden"
                            checked={formData.examined_juz.includes(juz.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInputChange('examined_juz', [...formData.examined_juz, juz.value]);
                              } else {
                                handleInputChange('examined_juz', formData.examined_juz.filter((j) => j !== juz.value));
                              }
                            }}
                          />
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Pilih juz yang pernah diujikan</p>
                  </div>

                  <div className="space-y-2 overflow-x-auto pb-2">
                    <Label className="text-xs sm:text-sm whitespace-nowrap">Juz yang Pernah Mendapat Sertifikat (Opsional)</Label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 min-w-max">
                      {allJuzOptions.map((juz) => (
                        <label
                          key={juz.value}
                          htmlFor={`certified_juz_${juz.value}`}
                          className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 cursor-pointer transition-all ${
                            formData.certified_juz.includes(juz.value)
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                          }`}
                        >
                          <span className="text-sm font-medium">{juz.value}</span>
                          <input
                            type="checkbox"
                            id={`certified_juz_${juz.value}`}
                            className="hidden"
                            checked={formData.certified_juz.includes(juz.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInputChange('certified_juz', [...formData.certified_juz, juz.value]);
                              } else {
                                handleInputChange('certified_juz', formData.certified_juz.filter((j) => j !== juz.value));
                              }
                            }}
                          />
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Pilih juz yang pernah mendapat sertifikat</p>
                  </div>
                </div>

                <Separator />

                {/* Section 3: Pilihan Juz & Jadwal */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Pilihan Juz & Jadwal
                  </h3>

                  <div className="space-y-2 overflow-x-auto pb-2">
                    <Label>Juz yang Bersedia Diampu *</Label>
                    <p className="text-xs text-gray-500 mb-2">Pilih juz yang ukhti bersedia diampu (Batch 2: Juz 1, 28, 29, 30)</p>
                    <div className="flex flex-wrap gap-3">
                      {['1', '28', '29', '30'].map((juzNum) => (
                        <label
                          key={juzNum}
                          htmlFor={`preferred_juz_${juzNum}`}
                          className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 cursor-pointer transition-all ${
                            formData.preferred_juz.includes(juzNum)
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                          }`}
                        >
                          <span className="text-lg sm:text-xl font-bold">Juz {juzNum}</span>
                          <input
                            type="checkbox"
                            id={`preferred_juz_${juzNum}`}
                            className="hidden"
                            checked={formData.preferred_juz.includes(juzNum)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInputChange('preferred_juz', [...formData.preferred_juz, juzNum]);
                              } else {
                                handleInputChange('preferred_juz', formData.preferred_juz.filter((j) => j !== juzNum));
                              }
                            }}
                          />
                        </label>
                      ))}
                    </div>
                    {errors.preferred_juz && <p className="text-sm text-red-500">{errors.preferred_juz}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Jenis Kelas yang Ingin Dibuka *</Label>
                    <p className="text-xs text-gray-500 mb-2">Pilih jenis kelas yang ukhti ingin ampu dalam satu jadwal</p>
                    <div className="space-y-2">
                      {classTypeOptions.map((type) => (
                        <div key={type.value} className="flex items-center space-x-2 bg-white p-3 rounded border">
                          <input
                            type="radio"
                            id={`class_type_${type.value}`}
                            name="class_type"
                            value={type.value}
                            checked={formData.class_type === type.value}
                            onChange={() => handleInputChange('class_type', type.value)}
                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                          />
                          <Label htmlFor={`class_type_${type.value}`} className="text-sm cursor-pointer flex-1">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferred_max_thalibah">Jumlah Maksimal Thalibah per Kelas (Opsional)</Label>
                    <Input
                      id="preferred_max_thalibah"
                      type="number"
                      min={1}
                      value={formData.preferred_max_thalibah || ''}
                      onChange={(e) => handleInputChange('preferred_max_thalibah', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Contoh: 10"
                      className="text-xs sm:text-sm py-2 sm:py-2.5"
                    />
                    <p className="text-xs text-gray-500">Kosongkan jika tidak ada batasan</p>
                  </div>

                  {/* Schedule 1 */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Jadwal 1 yang Dipilih *</h4>

                    <div className="space-y-2">
                      <Label>Pilih Hari *</Label>
                      <div className="flex flex-wrap gap-2">
                        {dayOptions.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2 bg-white p-2 rounded border flex-shrink-0">
                            <input
                              type="radio"
                              id={`schedule1_day_${day.value}`}
                              name="schedule1_day"
                              value={day.value}
                              checked={formData.schedule1_day === day.value}
                              onChange={() => handleInputChange('schedule1_day', day.value)}
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <Label htmlFor={`schedule1_day_${day.value}`} className="text-sm cursor-pointer whitespace-nowrap">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.schedule1_day && <p className="text-sm text-red-500">{errors.schedule1_day}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="schedule1_time_start">Jam Mulai (WIB) *</Label>
                        <Input
                          id="schedule1_time_start"
                          type="time"
                          value={formData.schedule1_time_start}
                          onChange={(e) => handleInputChange('schedule1_time_start', e.target.value)}
                          className={errors.schedule1_time_start ? 'border-red-500' : ''}
                        />
                        {errors.schedule1_time_start && <p className="text-sm text-red-500">{errors.schedule1_time_start}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedule1_time_end">Jam Selesai (WIB) *</Label>
                        <Input
                          id="schedule1_time_end"
                          type="time"
                          value={formData.schedule1_time_end}
                          onChange={(e) => handleInputChange('schedule1_time_end', e.target.value)}
                          className={errors.schedule1_time_end ? 'border-red-500' : ''}
                        />
                        {errors.schedule1_time_end && <p className="text-sm text-red-500">{errors.schedule1_time_end}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Schedule 2 - Optional */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Jadwal 2 (Opsional)</h4>
                    <p className="text-xs text-gray-500">Isi jadwal cadangan jika ukhti memiliki preferensi waktu lain</p>

                    <div className="space-y-2">
                      <Label>Pilih Hari</Label>
                      <div className="flex flex-wrap gap-2">
                        {dayOptions.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2 bg-white p-2 rounded border flex-shrink-0">
                            <input
                              type="radio"
                              id={`schedule2_day_${day.value}`}
                              name="schedule2_day"
                              value={day.value}
                              checked={formData.schedule2_day === day.value}
                              onChange={() => handleInputChange('schedule2_day', day.value)}
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <Label htmlFor={`schedule2_day_${day.value}`} className="text-sm cursor-pointer whitespace-nowrap">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="schedule2_time_start">Jam Mulai (WIB)</Label>
                        <Input
                          id="schedule2_time_start"
                          type="time"
                          value={formData.schedule2_time_start}
                          onChange={(e) => handleInputChange('schedule2_time_start', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedule2_time_end">Jam Selesai (WIB)</Label>
                        <Input
                          id="schedule2_time_end"
                          type="time"
                          value={formData.schedule2_time_end}
                          onChange={(e) => handleInputChange('schedule2_time_end', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kelas Berbayar */}
                  <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-gray-900">Kelas Berbayar (Opsional)</h4>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="wants_paid_class"
                          checked={formData.wants_paid_class}
                          onCheckedChange={(checked) => handleInputChange('wants_paid_class', checked)}
                        />
                        <Label htmlFor="wants_paid_class" className="cursor-pointer">
                          Saya ingin membuka kelas berbayar di MTI
                        </Label>
                      </div>
                      <p className="text-xs text-gray-600 pl-6">
                        Muallimah yang telah mempunyai 2 kelas gratis di MTI boleh membuka kelas berbayar
                      </p>
                    </div>

                    {formData.wants_paid_class && (
                      <>
                        <div className="space-y-2 pl-6">
                          <Label htmlFor="paid_class_name">Nama Kelas *</Label>
                          <Input
                            id="paid_class_name"
                            value={formData.paid_class_name}
                            onChange={(e) => handleInputChange('paid_class_name', e.target.value)}
                            placeholder="Contoh: Tahfidz Juz 30, Tajwid Dasar, dll"
                            className={errors.paid_class_name ? 'border-red-500' : ''}
                          />
                          {errors.paid_class_name && <p className="text-sm text-red-500">{errors.paid_class_name}</p>}
                        </div>

                        {/* Jadwal 1 Kelas Berbayar */}
                        <div className="space-y-3 pl-6">
                          <Label>Jadwal 1 Kelas Berbayar *</Label>
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500">Pilih Hari:</p>
                            <div className="flex flex-wrap gap-2">
                              {dayOptions.map((day) => (
                                <div key={`paid1_${day.value}`} className="flex items-center space-x-2 bg-white p-2 rounded border flex-shrink-0">
                                  <input
                                    type="radio"
                                    id={`paid_schedule1_day_${day.value}`}
                                    name="paid_class_schedule1_day"
                                    value={day.value}
                                    checked={formData.paid_class_schedule1_day === day.value}
                                    onChange={() => handleInputChange('paid_class_schedule1_day', day.value)}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                  />
                                  <Label htmlFor={`paid_schedule1_day_${day.value}`} className="text-sm cursor-pointer whitespace-nowrap">
                                    {day.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            {errors.paid_class_schedule1_day && <p className="text-sm text-red-500">{errors.paid_class_schedule1_day}</p>}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="paid_class_schedule1_time_start" className="text-xs">Jam Mulai (WIB) *</Label>
                              <Input
                                id="paid_class_schedule1_time_start"
                                type="time"
                                value={formData.paid_class_schedule1_time_start}
                                onChange={(e) => handleInputChange('paid_class_schedule1_time_start', e.target.value)}
                                className={errors.paid_class_schedule1_time_start ? 'border-red-500' : ''}
                              />
                              {errors.paid_class_schedule1_time_start && <p className="text-xs text-red-500">{errors.paid_class_schedule1_time_start}</p>}
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="paid_class_schedule1_time_end" className="text-xs">Jam Selesai (WIB) *</Label>
                              <Input
                                id="paid_class_schedule1_time_end"
                                type="time"
                                value={formData.paid_class_schedule1_time_end}
                                onChange={(e) => handleInputChange('paid_class_schedule1_time_end', e.target.value)}
                                className={errors.paid_class_schedule1_time_end ? 'border-red-500' : ''}
                              />
                              {errors.paid_class_schedule1_time_end && <p className="text-xs text-red-500">{errors.paid_class_schedule1_time_end}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Jadwal 2 Kelas Berbayar - Optional */}
                        <div className="space-y-3 pl-6">
                          <Label>Jadwal 2 Kelas Berbayar (Opsional)</Label>
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500">Pilih Hari:</p>
                            <div className="flex flex-wrap gap-2">
                              {dayOptions.map((day) => (
                                <div key={`paid2_${day.value}`} className="flex items-center space-x-2 bg-white p-2 rounded border flex-shrink-0">
                                  <input
                                    type="radio"
                                    id={`paid_schedule2_day_${day.value}`}
                                    name="paid_class_schedule2_day"
                                    value={day.value}
                                    checked={formData.paid_class_schedule2_day === day.value}
                                    onChange={() => handleInputChange('paid_class_schedule2_day', day.value)}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                  />
                                  <Label htmlFor={`paid_schedule2_day_${day.value}`} className="text-sm cursor-pointer whitespace-nowrap">
                                    {day.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="paid_class_schedule2_time_start" className="text-xs">Jam Mulai (WIB)</Label>
                              <Input
                                id="paid_class_schedule2_time_start"
                                type="time"
                                value={formData.paid_class_schedule2_time_start}
                                onChange={(e) => handleInputChange('paid_class_schedule2_time_start', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="paid_class_schedule2_time_end" className="text-xs">Jam Selesai (WIB)</Label>
                              <Input
                                id="paid_class_schedule2_time_end"
                                type="time"
                                value={formData.paid_class_schedule2_time_end}
                                onChange={(e) => handleInputChange('paid_class_schedule2_time_end', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pl-6">
                          <Label htmlFor="paid_class_max_students">Jumlah Maksimal Peserta *</Label>
                          <Input
                            id="paid_class_max_students"
                            type="number"
                            min={1}
                            value={formData.paid_class_max_students || ''}
                            onChange={(e) => handleInputChange('paid_class_max_students', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Contoh: 10"
                            className={errors.paid_class_max_students ? 'border-red-500' : ''}
                          />
                          {errors.paid_class_max_students && <p className="text-sm text-red-500">{errors.paid_class_max_students}</p>}
                        </div>

                        <div className="space-y-2 pl-6">
                          <Label>Persentase SPP untuk Muallimah *</Label>
                          <Select value={formData.paid_class_spp_percentage} onValueChange={(value) => handleInputChange('paid_class_spp_percentage', value)}>
                            <SelectTrigger id="paid_class_spp_percentage" className={errors.paid_class_spp_percentage ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Pilih persentase SPP" />
                            </SelectTrigger>
                            <SelectContent>
                              {sppPercentageOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.paid_class_spp_percentage && <p className="text-sm text-red-500">{errors.paid_class_spp_percentage}</p>}
                          <p className="text-xs text-gray-600 mt-1">
                            100% = Tanpa Musyrifah, 80% = Didampingi Musyrifah, 60% = Jika memiliki 1 kelas gratis di MTI
                          </p>
                        </div>

                        <div className="space-y-2 pl-6">
                          <Label htmlFor="paid_class_interest">Informasi Tambahan (Opsional)</Label>
                          <Textarea
                            id="paid_class_interest"
                            value={formData.paid_class_interest}
                            onChange={(e) => handleInputChange('paid_class_interest', e.target.value)}
                            placeholder="Informasi tambahan tentang kelas yang ingin dibuka..."
                            rows={2}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Commitment */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Komitmen Program</h3>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-gray-700 space-y-1.5 sm:space-y-2">
                    <p className="font-semibold text-yellow-900">Saya memahami bahwa:</p>
                    <ul className="space-y-1 pl-4 list-disc">
                      <li>Program ini gratis, MTI tidak bisa menjanjikan ujrah apapun</li>
                      <li>Formulir ini sebagai akad yang berlaku selama 11 pekan kurikulum</li>
                      <li>Komplain silakan ke Kak Mara (0813-1365-0842)</li>
                      <li>Masalah teknis zoom ke Kak Ucy (082229370282)</li>
                      <li>Izin udzur ke musyrifah minimal 1 jam sebelum kelas</li>
                      <li>Apabila ada udzur, MTI tidak menuntut mengganti jadwal</li>
                      <li>Muallimah dengan 2 kelas gratis boleh buka kelas berbayar</li>
                      <li><strong>Pembagian SPP untuk kelas berbayar:</strong>
                        <ul className="pl-4 mt-1 space-y-1 list-disc text-gray-600">
                          <li><strong>100%</strong> - Tanpa Musyrifah (muallimah mengelola kelas secara mandiri)</li>
                          <li><strong>80%</strong> - Didampingi Musyrifah (ada musyrifah yang membantu mengelola kelas)</li>
                          <li><strong>60%</strong> - Jika memiliki 1 kelas gratis di MTI (insentif khusus)</li>
                        </ul>
                      </li>
                      <li>Setelah kurikulum selesai, muallimah bebas melanjutkan/cuti/mundur</li>
                    </ul>
                  </div>

                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Checkbox
                      id="understands_commitment"
                      checked={formData.understands_commitment}
                      onCheckedChange={(checked) => handleInputChange('understands_commitment', checked)}
                      className={`mt-0.5 sm:mt-1 ${errors.understands_commitment ? 'border-red-500' : ''}`}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="understands_commitment" className="font-medium text-xs sm:text-sm">
                        Alhamdulillah saya sudah faham dan setuju dengan komitmen di atas
                      </Label>
                      {errors.understands_commitment && <p className="text-xs sm:text-sm text-red-500">{errors.understands_commitment}</p>}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                {!isFormSubmitted && (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-700 hover:bg-green-800 text-white text-sm sm:text-base py-2.5 sm:py-3"
                  >
                    {isLoading
                      ? (isEditMode ? 'Memperbarui...' : 'Mengirim...')
                      : (isEditMode ? 'Update Pendaftaran' : 'Kirim Pendaftaran')
                    }
                  </Button>
                )}
                {isFormSubmitted && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Pendaftaran sudah dikirim. Status: <strong>{muallimahRegistration?.status}</strong></p>
                    <Link href="/pendaftaran">
                      <Button variant="outline" className="text-sm">
                        Kembali ke Program
                      </Button>
                    </Link>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default function MuallimahRegistrationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <MuallimahRegistrationContent />
    </Suspense>
  );
}
