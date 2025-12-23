'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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

type MuallimahFormData = {
  tajweed_institution: string;
  quran_institution: string;
  teaching_communities: string;
  memorized_tajweed_matan: string;
  studied_matan_exegesis: string;
  memorization_level: string;
  memorized_juz: string[];
  examined_juz: string[];
  certified_juz: string[];
  preferred_juz: string;
  // Schedule 1: Day (single) and Time slot (single selection)
  schedule1_day: string;
  schedule1_time: string;
  // Schedule 2: Day (single) and Time slot (single selection)
  schedule2_day: string;
  schedule2_time: string;
  // Paid class options
  wants_paid_class: boolean;
  paid_class_name?: string;
  paid_class_schedule?: string;
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

// Hourly time options from 08:00 to 21:00
const timeSlotOptions = [
  { value: '08:00', label: '08:00' },
  { value: '09:00', label: '09:00' },
  { value: '10:00', label: '10:00' },
  { value: '11:00', label: '11:00' },
  { value: '12:00', label: '12:00' },
  { value: '13:00', label: '13:00' },
  { value: '14:00', label: '14:00' },
  { value: '15:00', label: '15:00' },
  { value: '16:00', label: '16:00' },
  { value: '17:00', label: '17:00' },
  { value: '18:00', label: '18:00' },
  { value: '19:00', label: '19:00' },
  { value: '20:00', label: '20:00' },
  { value: '21:00', label: '21:00' },
];

const memorizationLevels = [
  { value: '1-3', label: '1-3 Juz' },
  { value: '4-6', label: '4-6 Juz' },
  { value: '7-10', label: '7-10 Juz' },
  { value: '11-15', label: '11-15 Juz' },
  { value: '16-20', label: '16-20 Juz' },
  { value: '21-25', label: '21-25 Juz' },
  { value: '26-30', label: '26-30 Juz (Khatam)' },
];

const targetJuzOptions = ['1', '28', '29', '30'];

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
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [batchId, setBatchId] = useState<string>('');
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

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
    memorization_level: '',
    memorized_juz: [],
    examined_juz: [],
    certified_juz: [],
    preferred_juz: '',
    schedule1_day: '',
    schedule1_time: '',
    schedule2_day: '',
    schedule2_time: '',
    wants_paid_class: false,
    paid_class_name: '',
    paid_class_schedule: '',
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

  useEffect(() => {
    const batch = searchParams.get('batch');
    if (batch) {
      setBatchId(batch);
      fetchBatchInfo(batch);
    }
  }, [searchParams]);

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

      if (data && (data.status === 'pending' || data.status === 'review')) {
        // User has existing registration, populate form for editing
        setExistingRegistrationId(data.id);
        setIsEditMode(true);
        setMuallimahRegistration(data);

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
          studied_matan_exegesis: data.studied_maten_exegesis || '',
          memorization_level: data.memorization_level || '',
          memorized_juz: data.memorized_juz ? data.memorized_juz.split(', ') : [],
          examined_juz: data.examined_juz ? data.examined_juz.split(', ') : [],
          certified_juz: data.certified_juz ? data.certified_juz.split(', ') : [],
          preferred_juz: data.preferred_juz || '',
          schedule1_day: preferredSchedule?.day || '',
          schedule1_time: preferredSchedule?.time || '',
          schedule2_day: backupSchedule?.day || '',
          schedule2_time: backupSchedule?.time || '',
          wants_paid_class: !!paidClassInterest,
          paid_class_name: paidClassInterest?.name || '',
          paid_class_schedule: paidClassInterest?.schedule || '',
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
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tajweed_institution?.trim()) {
      newErrors.tajweed_institution = 'Lembaga belajar tajwid harus diisi';
    }
    if (!formData.quran_institution?.trim()) {
      newErrors.quran_institution = 'Lembaga hafal Quran harus diisi';
    }
    if (!formData.memorization_level) {
      newErrors.memorization_level = 'Jumlah hafalan harus dipilih';
    }
    if (!formData.preferred_juz) {
      newErrors.preferred_juz = 'Juz yang bersedia diampu harus dipilih';
    }
    if (!formData.schedule1_day) {
      newErrors.schedule1_day = 'Pilih hari untuk Jadwal 1';
    }
    if (!formData.schedule1_time) {
      newErrors.schedule1_time = 'Pilih jam untuk Jadwal 1';
    }
    if (!formData.schedule2_day) {
      newErrors.schedule2_day = 'Pilih hari untuk Jadwal 2';
    }
    if (!formData.schedule2_time) {
      newErrors.schedule2_time = 'Pilih jam untuk Jadwal 2';
    }
    // Validate paid class fields if user wants to open paid class
    if (formData.wants_paid_class) {
      if (!formData.paid_class_name?.trim()) {
        newErrors.paid_class_name = 'Nama kelas harus diisi';
      }
      if (!formData.paid_class_schedule?.trim()) {
        newErrors.paid_class_schedule = 'Jadwal kelas harus diisi';
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
  const formatSchedule = (day: string, time: string) => {
    const dayLabel = dayOptions.find(d => d.value === day)?.label || day;
    const timeLabel = timeSlotOptions.find(t => t.value === time)?.label || time;
    return { day: dayLabel, time: timeLabel };
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
      const schedule1Formatted = formatSchedule(formData.schedule1_day, formData.schedule1_time);
      const schedule2Formatted = formatSchedule(formData.schedule2_day, formData.schedule2_time);

      const submitData = {
        user_id: authUser.id,
        batch_id: batchId,
        // Data from users table (not in form)
        full_name: userData?.full_name || authUser.user_metadata?.full_name || '',
        birth_date: userData?.tanggal_lahir || null,
        birth_place: userData?.tempat_lahir || '',
        address: userData?.alamat || '',
        whatsapp: userData?.whatsapp || '',
        email: authUser.email || '',
        education: '', // Not in current schema
        occupation: userData?.pekerjaan || '',
        // New fields from form
        tajweed_institution: formData.tajweed_institution,
        quran_institution: formData.quran_institution,
        teaching_communities: formData.teaching_communities || null,
        memorized_tajweed_matan: formData.memorized_tajweed_matan || null,
        studied_matan_exegesis: formData.studied_matan_exegesis || null,
        memorization_level: formData.memorization_level,
        memorized_juz: formData.memorized_juz.length > 0 ? formData.memorized_juz.join(', ') : null,
        examined_juz: formData.examined_juz.length > 0 ? formData.examined_juz.join(', ') : null,
        certified_juz: formData.certified_juz.length > 0 ? formData.certified_juz.join(', ') : null,
        preferred_juz: formData.preferred_juz,
        teaching_experience: '', // Legacy field
        teaching_years: null,
        teaching_institutions: null,
        // Store schedule as JSON string
        preferred_schedule: JSON.stringify({
          day: formData.schedule1_day,
          time: formData.schedule1_time,
          formatted: schedule1Formatted
        }),
        backup_schedule: JSON.stringify({
          day: formData.schedule2_day,
          time: formData.schedule2_time,
          formatted: schedule2Formatted
        }),
        timezone: userData?.zona_waktu || 'WIB',
        paid_class_interest: formData.wants_paid_class ? JSON.stringify({
          name: formData.paid_class_name || null,
          schedule: formData.paid_class_schedule || null,
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

        if (updateError) throw updateError;

        toast.success('Data pendaftaran Muallimah berhasil diperbarui!');
      } else {
        // Create new registration
        const { error: submitError } = await supabase
          .from('muallimah_registrations')
          .insert({
            ...submitData,
            status: 'pending',
            submitted_at: new Date().toISOString(),
          });

        if (submitError) throw submitError;

        toast.success('Pendaftaran sebagai Muallimah berhasil dikirim!');
      }

      router.push('/pendaftaran/success?program=muallimah');

    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Gagal mengirim pendaftaran');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {authLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Memeriksa autentikasi...</p>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Mengalihkan ke halaman login...</p>
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

                <p className="font-medium text-gray-900">🎯 Target hafalan harian: 1 halaman perpekan (1/4 halaman per hari, 4 hari dalam sepekan)</p>
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
                    <span>Apapun keluhan dan keberatan pribadi yang dirasakan selama program berlangsung, mohon langsung komunikasikan kepada kak Mara (081313650842) untuk mendapatkan solusi.</span>
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
              {isEditMode && (
                <Alert className="bg-blue-50 border-blue-200 mb-4">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-xs sm:text-sm">
                    <strong>Edit Mode:</strong> Ukhti sedang mengedit data pendaftaran yang sudah ada. Perubahan akan disimpan setelah menekan tombol "Update Pendaftaran".
                  </AlertDescription>
                </Alert>
              )}
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                Formulir Pendaftaran
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {isEditMode ? 'Edit data pendaftaran Muallimah' : 'Lengkapi formulir berikut untuk mendaftar sebagai Muallimah'}
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
                      value={formData.tajweed_institution}
                      onChange={(e) => handleInputChange('tajweed_institution', e.target.value)}
                      placeholder="Contoh: Ma'had Tahfidz Al-Quran..."
                      className={`text-xs sm:text-sm py-2 sm:py-2.5 ${errors.tajweed_institution ? 'border-red-500' : ''}`}
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

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">Jumlah Hafalan Saat Ini *</Label>
                    <Select value={formData.memorization_level} onValueChange={(value) => handleInputChange('memorization_level', value)}>
                      <SelectTrigger className={`text-xs sm:text-sm py-2 sm:py-2.5 ${errors.memorization_level ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Pilih jumlah hafalan" />
                      </SelectTrigger>
                      <SelectContent>
                        {memorizationLevels.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.memorization_level && <p className="text-xs sm:text-sm text-red-500">{errors.memorization_level}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Juz yang Pernah Dihafal (Opsional)</Label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
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

                  <div className="space-y-2">
                    <Label>Juz yang Pernah Dijikankan (Opsional)</Label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
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

                  <div className="space-y-2">
                    <Label>Juz yang Pernah Mendapat Sertifikat (Opsional)</Label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
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

                  <div className="space-y-2">
                    <Label>Juz yang Bersedia Diampu *</Label>
                    <p className="text-xs text-gray-500 mb-2">Batch ini tersedia untuk Juz 1, 28, 29, 30</p>
                    <Select value={formData.preferred_juz} onValueChange={(value) => handleInputChange('preferred_juz', value)}>
                      <SelectTrigger className={errors.preferred_juz ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih juz yang ingin diampu" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetJuzOptions.map(juz => (
                          <SelectItem key={juz} value={juz}>
                            Juz {juz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.preferred_juz && <p className="text-sm text-red-500">{errors.preferred_juz}</p>}
                  </div>

                  {/* Schedule 1 */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Jadwal 1 yang Dipilih *</h4>

                    <div className="space-y-2">
                      <Label>Pilih Hari *</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {dayOptions.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2 bg-white p-2 rounded border">
                            <input
                              type="radio"
                              id={`schedule1_day_${day.value}`}
                              name="schedule1_day"
                              value={day.value}
                              checked={formData.schedule1_day === day.value}
                              onChange={() => handleInputChange('schedule1_day', day.value)}
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <Label htmlFor={`schedule1_day_${day.value}`} className="text-sm cursor-pointer">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.schedule1_day && <p className="text-sm text-red-500">{errors.schedule1_day}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Pilih Jam (pilih salah satu) *</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {timeSlotOptions.map((time) => (
                          <div key={time.value} className="flex items-center space-x-2 bg-white p-2 rounded border">
                            <input
                              type="radio"
                              id={`schedule1_time_${time.value}`}
                              name="schedule1_time"
                              value={time.value}
                              checked={formData.schedule1_time === time.value}
                              onChange={() => handleInputChange('schedule1_time', time.value)}
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <Label htmlFor={`schedule1_time_${time.value}`} className="text-sm cursor-pointer">
                              {time.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.schedule1_time && <p className="text-sm text-red-500">{errors.schedule1_time}</p>}
                    </div>
                  </div>

                  {/* Schedule 2 */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Jadwal 2 yang Dipilih *</h4>

                    <div className="space-y-2">
                      <Label>Pilih Hari *</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {dayOptions.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2 bg-white p-2 rounded border">
                            <input
                              type="radio"
                              id={`schedule2_day_${day.value}`}
                              name="schedule2_day"
                              value={day.value}
                              checked={formData.schedule2_day === day.value}
                              onChange={() => handleInputChange('schedule2_day', day.value)}
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <Label htmlFor={`schedule2_day_${day.value}`} className="text-sm cursor-pointer">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.schedule2_day && <p className="text-sm text-red-500">{errors.schedule2_day}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Pilih Jam (pilih salah satu) *</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {timeSlotOptions.map((time) => (
                          <div key={time.value} className="flex items-center space-x-2 bg-white p-2 rounded border">
                            <input
                              type="radio"
                              id={`schedule2_time_${time.value}`}
                              name="schedule2_time"
                              value={time.value}
                              checked={formData.schedule2_time === time.value}
                              onChange={() => handleInputChange('schedule2_time', time.value)}
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <Label htmlFor={`schedule2_time_${time.value}`} className="text-sm cursor-pointer">
                              {time.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.schedule2_time && <p className="text-sm text-red-500">{errors.schedule2_time}</p>}
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
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

                        <div className="space-y-2 pl-6">
                          <Label htmlFor="paid_class_schedule">Jadwal Kelas *</Label>
                          <Input
                            id="paid_class_schedule"
                            value={formData.paid_class_schedule}
                            onChange={(e) => handleInputChange('paid_class_schedule', e.target.value)}
                            placeholder="Contoh: Senin & Kamis, 19:00-21:00"
                            className={errors.paid_class_schedule ? 'border-red-500' : ''}
                          />
                          {errors.paid_class_schedule && <p className="text-sm text-red-500">{errors.paid_class_schedule}</p>}
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
                      <li>Komplain silakan ke Kak Mara (081313650842)</li>
                      <li>Masalah teknis zoom ke Kak Ucy (082229370282)</li>
                      <li>Izin udzur ke musyrifah minimal 1 jam sebelum kelas</li>
                      <li>Apabila ada udzur, MTI tidak menuntut mengganti jadwal</li>
                      <li>Muallimah dengan 2 kelas gratis boleh buka kelas berbayar</li>
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
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2.5 sm:py-3"
                >
                  {isLoading
                    ? (isEditMode ? 'Memperbarui...' : 'Mengirim...')
                    : (isEditMode ? 'Update Pendaftaran' : 'Kirim Pendaftaran')
                  }
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Program Benefits */}
          <Card className="mt-6 sm:mt-8">
            <CardHeader className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                Benefit Program Muallimah
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-700">Sertifikasi & Pendidikan</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Sertifikasi Mu'allimah Al-Quran</li>
                    <li>• Mastery metode pengajaran Quran</li>
                    <li>• Kurikulum berbasis research</li>
                    <li>• Beasiswa untuk peserta terbaik</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-700">Karir & Pengembangan</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Praktik mengajar terbimbing</li>
                    <li>• Peluang karir di berbagai lembaga</li>
                    <li>• Networking dengan praktisi</li>
                    <li>• Program pengabdian masyarakat</li>
                  </ul>
                </div>
              </div>
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
