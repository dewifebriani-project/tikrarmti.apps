'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
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
import { Calendar, BookOpen, GraduationCap, Loader2, Info, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { submitMuallimahRegistration } from './actions';

type MuallimahFormData = {
  // Profile Data (Batch-independent)
  tajweed_institution: string;
  quran_institution: string;
  teaching_communities: string;
  memorized_tajweed_matan: string;
  studied_matan_exegesis: string;
  memorization_level: string;
  memorized_juz: string[];
  examined_juz: string[];
  certified_juz: string[];
  age?: number;
  
  // Akad Data (Batch-specific)
  preferred_juz: string[]; 
  class_type: string; 
  preferred_max_thalibah?: number;
  schedule1_day: string;
  schedule1_time_start: string;
  schedule1_time_end: string;
  schedule2_day: string;
  schedule2_time_start: string;
  schedule2_time_end: string;
  
  // Commitment
  understands_commitment: boolean;
  agreed_items: string[];
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

const allJuzOptions = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: `Juz ${i + 1}`
}));

const COMMITMENT_ITEMS = [
  { id: 'free_program', label: "Program ini gratis, MTI belum bisa menjanjikan ujrah apapun untuk partisipasi Mu'allimah." },
  { id: 'standard_package', label: "Memahami bahwa kelas Standard adalah satu paket lengkap yang mencakup Tashih dan Ujian sekaligus." },
  { id: 'revenue_share', label: "Menyetujui skema kerjasama 80% (didampingi musyrifah) atau 60% (jika memiliki 1 kelas gratis) untuk kelas berbayar." },
  { id: 'complaints_mara', label: "Keluhan dan keberatan pribadi dikomunikasikan langsung ke Kak Mara (081313650842)." },
  { id: 'technical_ucy', label: "Masalah teknis link zoom dikomunikasikan langsung ke Kak Ucy (082229370282)." },
  { id: 'permit_musyrifah', label: "Izin udzur disampaikan ke Musyrifah minimal 1 jam sebelum kelas dimulai." },
  { id: 'no_makeup_class', label: "Jika Mu'allimah udzur, MTI tidak menuntut ganti jadwal (Tholibah diarahkan ke kelas umum)." },
  { id: 'paid_class_incentive', label: "Mu'allimah dengan 2 kelas gratis boleh buka kelas berbayar (SPP 100% tanpa potongan MTI)." },
  { id: 'family_spirit', label: "Menerima kekurangan program dengan semangat kekeluargaan dan saling melengkapi." },
  { id: 'batch_period', label: "Akad berlaku selama satu periode (11 pekan kurikulum ziyadah + ujian)." },
  { id: 'freedom_to_continue', label: "Setelah kurikulum selesai, bebas untuk melanjutkan, cuti, atau mundur pada batch berikutnya." },
];

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
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [profileExists, setProfileExists] = useState(false);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);

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
    age: undefined,
    
    preferred_juz: [], 
    class_type: '',
    preferred_max_thalibah: 10,
    schedule1_day: '',
    schedule1_time_start: '',
    schedule1_time_end: '',
    schedule2_day: '',
    schedule2_time_start: '',
    schedule2_time_end: '',
    understands_commitment: false,
    agreed_items: [],
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // AUTO-SAVE: Load draft from localStorage on mount
  useEffect(() => {
    if (user?.id && !isFormSubmitted) {
      const savedDraft = localStorage.getItem(`muallimah_draft_${user.id}`);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Only load if current formData is mostly empty to avoid overwriting DB data
          setFormData(prev => {
            // Check if we already have meaningful data (e.g. from DB)
            const hasExistingData = prev.tajweed_institution || prev.preferred_juz.length > 0;
            if (!hasExistingData) {
              return { ...prev, ...parsed };
            }
            return prev;
          });
        } catch (e) {
          console.error('Error loading draft:', e);
        }
      }
    }
  }, [user?.id, isFormSubmitted]);

  // AUTO-SAVE: Save to localStorage whenever formData changes
  useEffect(() => {
    if (user?.id && !isFormSubmitted && formData) {
      const timeoutId = setTimeout(() => {
        // Don't save if it's just the initial empty state
        const hasData = Object.values(formData).some(val => 
          Array.isArray(val) ? val.length > 0 : !!val
        );
        if (hasData) {
          localStorage.setItem(`muallimah_draft_${user.id}`, JSON.stringify(formData));
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, user?.id, isFormSubmitted]);

  // Set batchId
  useEffect(() => {
    const batchFromUrl = searchParams.get('batchId') || searchParams.get('batch');
    if (batchFromUrl) {
      setBatchId(batchFromUrl);
      fetchBatchInfo(batchFromUrl);
    } else if (activeBatch?.id && !batchId) {
      setBatchId(activeBatch.id);
      setBatchInfo(activeBatch);
    }
  }, [searchParams, activeBatch]);

  // Load user data and existing registration/akad
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    if (user && batchId) {
      fetchProfileAndAkad();
    }
  }, [user, batchId]);

  const fetchProfileAndAkad = async () => {
    try {
      // 1. Fetch Profile (Batch-independent registration)
      const { data: profile, error: profileError } = await supabase
        .from('muallimah_registrations')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setProfileExists(true);
        setFormData(prev => ({
          ...prev,
          tajweed_institution: profile.tajweed_institution || '',
          quran_institution: profile.quran_institution || '',
          teaching_communities: profile.teaching_communities || '',
          memorized_tajweed_matan: profile.memorized_tajweed_matan || '',
          studied_matan_exegesis: profile.studied_matan_exegesis || '',
          memorization_level: profile.memorization_level || '',
          memorized_juz: profile.memorized_juz ? (Array.isArray(profile.memorized_juz) ? profile.memorized_juz : profile.memorized_juz.split(', ')) : [],
          examined_juz: profile.examined_juz ? (Array.isArray(profile.examined_juz) ? profile.examined_juz : profile.examined_juz.split(', ')) : [],
          certified_juz: profile.certified_juz ? (Array.isArray(profile.certified_juz) ? profile.certified_juz : profile.certified_juz.split(', ')) : [],
          age: profile.age,
        }));
      }

      // 2. Fetch Akad for this batch
      const { data: akad, error: akadError } = await supabase
        .from('muallimah_akads')
        .select('*')
        .eq('user_id', user?.id)
        .eq('batch_id', batchId)
        .maybeSingle();

      if (akad) {
        if (akad.status === 'approved' || akad.status === 'rejected') {
          setIsFormSubmitted(true);
        } else {
          setIsEditMode(true);
        }

        const preferredSchedule = typeof akad.preferred_schedule === 'string'
          ? JSON.parse(akad.preferred_schedule)
          : akad.preferred_schedule;
        const backupSchedule = typeof akad.backup_schedule === 'string'
          ? JSON.parse(akad.backup_schedule)
          : akad.backup_schedule;

        setFormData(prev => ({
          ...prev,
          preferred_juz: akad.preferred_juz ? (Array.isArray(akad.preferred_juz) ? akad.preferred_juz : akad.preferred_juz.split(', ')) : [],
          preferred_max_thalibah: akad.preferred_max_thalibah,
          class_type: akad.class_type || '',
          schedule1_day: preferredSchedule?.day || '',
          schedule1_time_start: preferredSchedule?.time_start || '',
          schedule1_time_end: preferredSchedule?.time_end || '',
          schedule2_day: backupSchedule?.day || '',
          schedule2_time_start: backupSchedule?.time_start || '',
          schedule2_time_end: backupSchedule?.time_end || '',
          understands_commitment: akad.understands_commitment || false,
        }));
      }
    } catch (error) {
      console.error('Error fetching profile/akad:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Failed to fetch user data');
      const result = await response.json();
      if (result.success && result.data) {
        setUserData(result.data);
        if (result.data?.tanggal_lahir && !formData.age) {
          const birthDate = new Date(result.data.tanggal_lahir);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          setFormData(prev => ({ ...prev, age }));
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchBatchInfo = async (id: string) => {
    try {
      const { data, error } = await supabase.from('batches').select('*').eq('id', id).single();
      if (error) throw error;
      setBatchInfo(data);
    } catch (error) {
      console.error('Error fetching batch info:', error);
    }
  };

  const handleInputChange = (field: keyof MuallimahFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAgreedItemsToggle = (itemId: string) => {
    setFormData(prev => {
      const current = prev.agreed_items || [];
      const updated = current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId];
      
      return { 
        ...prev, 
        agreed_items: updated,
        understands_commitment: updated.length === COMMITMENT_ITEMS.length
      };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tajweed_institution?.trim()) newErrors.tajweed_institution = 'Lembaga belajar tajwid harus diisi';
    if (!formData.quran_institution?.trim()) newErrors.quran_institution = 'Lembaga hafal Quran harus diisi';
    if (!formData.memorization_level) newErrors.memorization_level = 'Pilih jumlah hafalan';
    if (!formData.memorized_juz || formData.memorized_juz.length === 0) newErrors.memorized_juz = 'Pilih minimal satu juz yang sudah dihafal';
    if (!formData.preferred_juz || formData.preferred_juz.length === 0) newErrors.preferred_juz = 'Pilih minimal satu juz yang ingin diampu';
    if (!formData.schedule1_day) newErrors.schedule1_day = 'Pilih hari';
    if (!formData.schedule1_time_start) newErrors.schedule1_time_start = 'Pilih jam mulai';
    if (!formData.schedule1_time_end) newErrors.schedule1_time_end = 'Pilih jam selesai';
    if (!formData.class_type) newErrors.class_type = 'Pilih tipe kelas / skema kerjasama';
    if (!formData.understands_commitment || formData.agreed_items.length < COMMITMENT_ITEMS.length) {
      newErrors.understands_commitment = 'Harap setujui semua butir akad komitmen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) {
      toast.error('Batch ID tidak ditemukan. Silakan kembali ke halaman pendaftaran.');
      return;
    }
    
    if (isFormSubmitted) return;
    
    if (!validateForm()) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitMuallimahRegistration(formData, userData, user, batchId);
      if (result.success) {
        setIsFormSubmitted(true);
        toast.success(result.message);
        // Clear auto-save draft on success
        if (user?.id) {
          localStorage.removeItem(`muallimah_draft_${user.id}`);
        }
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Gagal mengirim pendaftaran');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || batchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <Link href="/pendaftaran" className="text-sm text-gray-500 hover:text-green-600 mb-4 inline-block">
          ← Kembali ke Program
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Pendaftaran Mu'allimah</h1>
        <p className="text-gray-600 mt-2">
          {batchInfo?.name || 'Memuat...'} • Profil Permanen & Akad Batch
        </p>
      </div>

      {isFormSubmitted && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 font-medium">
            Pendaftaran Ukhti sedang dalam proses review. Data tidak dapat diubah saat ini.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Profile */}
        <Card className={profileExists ? "opacity-95 bg-gray-50/50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <GraduationCap className="w-6 h-6 text-green-600" />
              1. Profil & Latar Belakang
            </CardTitle>
            <CardDescription>
              Informasi ini disimpan secara permanen untuk semua batch di masa mendatang.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Read-only User Data from Profile */}
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 mb-2">
              <h3 className="text-sm font-bold text-green-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4" />
                Data Profil Dasar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Nama Lengkap</Label>
                  <p className="text-sm font-medium">{userData?.full_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Nama Kunyah</Label>
                  <p className="text-sm font-medium">{userData?.nama_kunyah || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Email</Label>
                  <p className="text-sm font-medium">{user?.email || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">WhatsApp</Label>
                  <p className="text-sm font-medium">{userData?.whatsapp || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Telegram</Label>
                  <p className="text-sm font-medium">{userData?.telegram || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Pekerjaan</Label>
                  <p className="text-sm font-medium">{userData?.pekerjaan || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Tempat Lahir</Label>
                  <p className="text-sm font-medium">{userData?.tempat_lahir || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Zona Waktu</Label>
                  <p className="text-sm font-medium">{userData?.zona_waktu || 'WIB'}</p>
                </div>
                <div className="col-span-full space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Alamat Lengkap</Label>
                  <p className="text-sm font-medium">{userData?.alamat || '-'}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-green-100 flex items-center justify-between">
                <p className="text-[10px] text-green-600 italic">* Data di atas diambil dari profil akun Ukhti. Jika ingin mengubahnya, silakan hubungi admin.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Lembaga Belajar Tajwid</Label>
                <Input 
                  placeholder="e.g. MTI, LTQ, dsb" 
                  value={formData.tajweed_institution}
                  onChange={(e) => handleInputChange('tajweed_institution', e.target.value)}
                  disabled={isFormSubmitted}
                  className={errors.tajweed_institution ? "border-red-500" : ""}
                />
                {errors.tajweed_institution && <p className="text-xs text-red-500">{errors.tajweed_institution}</p>}
              </div>
              <div className="space-y-2">
                <Label>Lembaga Tahfidz</Label>
                <Input 
                  placeholder="e.g. Markaz Tikrar, dsb"
                  value={formData.quran_institution}
                  onChange={(e) => handleInputChange('quran_institution', e.target.value)}
                  disabled={isFormSubmitted}
                  className={errors.quran_institution ? "border-red-500" : ""}
                />
                {errors.quran_institution && <p className="text-xs text-red-500">{errors.quran_institution}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Matan Tajwid yang Dihafal</Label>
                <Input 
                  placeholder="e.g. Tuhfatul Athfal, Jazariyah"
                  value={formData.memorized_tajweed_matan}
                  onChange={(e) => handleInputChange('memorized_tajweed_matan', e.target.value)}
                  disabled={isFormSubmitted}
                />
              </div>
              <div className="space-y-2">
                <Label>Syarah Matan yang Dipelajari</Label>
                <Input 
                  placeholder="e.g. Aisar, dsb"
                  value={formData.studied_matan_exegesis}
                  onChange={(e) => handleInputChange('studied_matan_exegesis', e.target.value)}
                  disabled={isFormSubmitted}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Jumlah Hafalan Al-Quran saat ini</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[1, 5, 10, 15, 20, 30].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant={formData.memorization_level === String(num) ? "default" : "outline"}
                    className={`h-9 text-xs ${formData.memorization_level === String(num) ? "bg-green-600 hover:bg-green-700" : ""}`}
                    onClick={() => handleInputChange('memorization_level', String(num))}
                    disabled={isFormSubmitted}
                  >
                    {num === 30 ? "30 Juz (Kamil)" : `${num} Juz`}
                  </Button>
                ))}
              </div>
              {errors.memorization_level && <p className="text-xs text-red-500">{errors.memorization_level}</p>}
            </div>

            <div className="space-y-6">
              <Label className="text-base font-semibold">Kompetensi Hafalan (Juz)</Label>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Sudah Dihafal
                  </p>
                  <div className="grid grid-cols-5 gap-1 p-2 border rounded-xl bg-gray-50/30">
                    {allJuzOptions.map(juz => (
                      <div key={juz.value} className="flex items-center space-x-2 py-1 hover:bg-white/50 rounded-lg transition-colors px-2">
                        <Checkbox 
                          id={`mem-${juz.value}`} 
                          checked={formData.memorized_juz.includes(juz.value)}
                          onCheckedChange={(checked) => {
                            const newJuz = checked 
                              ? [...formData.memorized_juz, juz.value]
                              : formData.memorized_juz.filter(v => v !== juz.value);
                            handleInputChange('memorized_juz', newJuz);
                          }}
                          disabled={isFormSubmitted}
                        />
                        <Label htmlFor={`mem-${juz.value}`} className="text-[10px] font-medium cursor-pointer whitespace-nowrap">{juz.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    Sudah Diuji (Tashih/Imtihan)
                  </p>
                  <div className="grid grid-cols-5 gap-1 p-2 border rounded-xl bg-gray-50/30">
                    {allJuzOptions.map(juz => (
                      <div key={`exm-${juz.value}`} className="flex items-center space-x-2 py-1 hover:bg-white/50 rounded-lg transition-colors px-2">
                        <Checkbox 
                          id={`exm-${juz.value}`}
                          checked={formData.examined_juz.includes(juz.value)}
                          onCheckedChange={(checked) => {
                            const newJuz = checked 
                              ? [...formData.examined_juz, juz.value]
                              : formData.examined_juz.filter(v => v !== juz.value);
                            handleInputChange('examined_juz', newJuz);
                          }}
                          disabled={isFormSubmitted}
                        />
                        <Label htmlFor={`exm-${juz.value}`} className="text-[10px] font-medium cursor-pointer whitespace-nowrap">{juz.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Sudah Mendapat Sertifikat
                  </p>
                  <div className="grid grid-cols-5 gap-1 p-2 border rounded-xl bg-gray-50/30">
                    {allJuzOptions.map(juz => (
                      <div key={`cert-${juz.value}`} className="flex items-center space-x-2 py-1 hover:bg-white/50 rounded-lg transition-colors px-2">
                        <Checkbox 
                          id={`cert-${juz.value}`}
                          checked={formData.certified_juz.includes(juz.value)}
                          onCheckedChange={(checked) => {
                            const newJuz = checked 
                              ? [...formData.certified_juz, juz.value]
                              : formData.certified_juz.filter(v => v !== juz.value);
                            handleInputChange('certified_juz', newJuz);
                          }}
                          disabled={isFormSubmitted}
                        />
                        <Label htmlFor={`cert-${juz.value}`} className="text-[10px] font-medium cursor-pointer whitespace-nowrap">{juz.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Akad */}
        <Card className="shadow-md border-amber-200">
          <CardHeader className="bg-amber-50/50">
            <CardTitle className="flex items-center gap-2 text-xl text-amber-900">
              <Calendar className="w-6 h-6 text-amber-600" />
              2. Akad Mengajar (Batch {batchInfo?.name || '...'})
            </CardTitle>
            <CardDescription className="text-amber-800/70">
              Pilih jadwal and juz yang bersedia diampu untuk periode ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Tipe Kelas & Skema Kerjasama</Label>
                  <Select 
                    value={formData.class_type} 
                    onValueChange={(v) => handleInputChange('class_type', v)}
                    disabled={isFormSubmitted}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 bg-white">
                      <SelectValue placeholder="Pilih tipe kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tashih_ujian">Standard (Tashih & Ujian)</SelectItem>
                      <SelectItem value="berbayar_100">Berbayar (100% Muallimah)</SelectItem>
                      <SelectItem value="berbayar_80_20">Berbayar (Skema 80:20)</SelectItem>
                      <SelectItem value="berbayar_60_40">Berbayar (Skema 60:40)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.class_type && <p className="text-xs text-red-500 font-medium">{errors.class_type}</p>}
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Maksimal Tholibah per Kelas</Label>
                  <Select 
                    value={String(formData.preferred_max_thalibah || 10)} 
                    onValueChange={(v) => handleInputChange('preferred_max_thalibah', parseInt(v))}
                    disabled={isFormSubmitted}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 bg-white">
                      <SelectValue placeholder="Pilih maksimal tholibah" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={String(num)}>{num} Orang</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 italic">
                * Skema berbayar akan divalidasi lebih lanjut oleh tim manajemen berdasarkan kualifikasi dan ketersediaan program.
              </p>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Juz yang Bersedia Diampu (Pilih minimal satu)</Label>
              <div className="grid grid-cols-5 gap-1 p-2 border rounded-xl bg-white">
                {allJuzOptions.map(juz => (
                  <div key={juz.value} className="flex items-center space-x-2 py-1 hover:bg-gray-50 rounded-lg transition-colors px-2">
                    <Checkbox 
                      id={`pref-${juz.value}`}
                      checked={formData.preferred_juz.includes(juz.value)}
                      onCheckedChange={(checked) => {
                        const newJuz = checked 
                          ? [...formData.preferred_juz, juz.value]
                          : formData.preferred_juz.filter(v => v !== juz.value);
                        handleInputChange('preferred_juz', newJuz);
                      }}
                      disabled={isFormSubmitted}
                    />
                    <Label htmlFor={`pref-${juz.value}`} className="text-[10px] font-medium cursor-pointer whitespace-nowrap">{juz.label}</Label>
                  </div>
                ))}
              </div>
              {errors.preferred_juz && <p className="text-xs text-red-500 font-medium">{errors.preferred_juz}</p>}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <Label className="text-base font-bold text-amber-900">Jadwal Mengajar (WIB)</Label>
              </div>

              <div className="space-y-6">
                {/* Schedule 1 */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-amber-600/70 uppercase tracking-widest px-1">Pilihan Utama</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-amber-50/30 border border-amber-100/50">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500">Hari</Label>
                      <Select 
                        value={formData.schedule1_day} 
                        onValueChange={(v) => handleInputChange('schedule1_day', v)}
                        disabled={isFormSubmitted}
                      >
                        <SelectTrigger className={`bg-white rounded-xl border-gray-200 ${errors.schedule1_day ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Pilih hari" />
                        </SelectTrigger>
                        <SelectContent>
                          {dayOptions.map(d => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500">Jam Mulai</Label>
                      <Input 
                        type="time" 
                        value={formData.schedule1_time_start}
                        onChange={(e) => handleInputChange('schedule1_time_start', e.target.value)}
                        disabled={isFormSubmitted}
                        className={`bg-white rounded-xl border-gray-200 ${errors.schedule1_time_start ? "border-red-500" : ""}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500">Jam Selesai</Label>
                      <Input 
                        type="time" 
                        value={formData.schedule1_time_end}
                        onChange={(e) => handleInputChange('schedule1_time_end', e.target.value)}
                        disabled={isFormSubmitted}
                        className={`bg-white rounded-xl border-gray-200 ${errors.schedule1_time_end ? "border-red-500" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule 2 (Optional) */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Pilihan Cadangan (Opsional)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400">Hari</Label>
                      <Select 
                        value={formData.schedule2_day} 
                        onValueChange={(v) => handleInputChange('schedule2_day', v)}
                        disabled={isFormSubmitted}
                      >
                        <SelectTrigger className="bg-white rounded-xl border-gray-200">
                          <SelectValue placeholder="Pilih hari" />
                        </SelectTrigger>
                        <SelectContent>
                          {dayOptions.map(d => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400">Jam Mulai</Label>
                      <Input 
                        type="time" 
                        value={formData.schedule2_time_start}
                        onChange={(e) => handleInputChange('schedule2_time_start', e.target.value)}
                        disabled={isFormSubmitted}
                        className="bg-white rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400">Jam Selesai</Label>
                      <Input 
                        type="time" 
                        value={formData.schedule2_time_end}
                        onChange={(e) => handleInputChange('schedule2_time_end', e.target.value)}
                        disabled={isFormSubmitted}
                        className="bg-white rounded-xl border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {(errors.schedule1_day || errors.schedule1_time_start || errors.schedule1_time_end) && (
                <p className="text-xs text-red-500 font-medium">Harap lengkapi semua field jadwal pilihan utama.</p>
              )}
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-green-50/50 rounded-2xl border border-green-100/50">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  Akad Komitmen & Etika Mu'allimah
                </h3>
                
                <div className="space-y-4">
                  <p className="text-sm text-green-800 font-medium italic mb-4 bg-green-100/30 p-3 rounded-xl border border-green-100/50">
                    Silakan baca dan centang setiap poin di bawah ini sebagai bentuk pemahaman dan kesepakatan Ukhti terhadap akad MTI:
                  </p>
                  
                  {COMMITMENT_ITEMS.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 p-3 rounded-xl hover:bg-white/50 transition-colors group border border-transparent hover:border-green-100">
                      <Label 
                        htmlFor={`akad-${item.id}`}
                        className="text-sm sm:text-base text-green-800 leading-relaxed cursor-pointer font-medium group-hover:text-green-900 flex-1"
                      >
                        {item.label}
                      </Label>
                      <Checkbox 
                        id={`akad-${item.id}`}
                        checked={formData.agreed_items?.includes(item.id)}
                        onCheckedChange={() => handleAgreedItemsToggle(item.id)}
                        disabled={isFormSubmitted}
                        className="mt-1 h-5 w-5 border-green-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 shrink-0"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-green-100 flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${formData.understands_commitment ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`}></div>
                   <p className="text-sm font-bold text-green-900">
                     {formData.understands_commitment 
                       ? 'Bismillah, saya menyetujui seluruh akad di atas.' 
                       : `Harap centang ${COMMITMENT_ITEMS.length - (formData.agreed_items?.length || 0)} butir akad lagi.`}
                   </p>
                </div>
                
                {errors.understands_commitment && (
                  <p className="mt-4 text-sm text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                    {errors.understands_commitment}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!isFormSubmitted && (
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
            <Button type="button" variant="ghost" onClick={() => router.push('/pendaftaran')} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white px-10 h-12 text-lg font-bold">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {isEditMode ? 'Simpan Perubahan' : 'Kirim Pendaftaran & Akad'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

export default function MuallimahRegistrationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>}>
      <MuallimahRegistrationContent />
    </Suspense>
  );
}
