'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import useSWR from 'swr';
import {
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  User,
  Clock,
  BookOpen,
  Info,
  Loader2,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Batch {
  id: string;
  name: string;
  re_enrollment_date?: string;
  opening_class_date?: string;
}

interface Registration {
  id: string;
  chosen_juz: string;
  main_time_slot: string;
  backup_time_slot: string;
  selection_status: string;
  re_enrollment_completed: boolean;
}

interface PartnerPreference {
  id: string;
  partner_type: 'thalibah' | 'family' | 'tarteel';
  partner_status?: string;
  preferred_partner_id?: string;
  family_member_name?: string;
  family_member_relationship?: string;
  tarteel_commitment?: boolean;
}

interface AkadCommitment {
  id: string;
  agreed: boolean;
  signed_at?: string;
  akad_content?: any;
}

interface DaftarUlangContentProps {
  userId: string;
  batchId: string;
  userRole?: string;
}

type Step = 'intro' | 'schedule' | 'partner' | 'akad' | 'review' | 'complete';

const AKAD_CONTENT = {
  title: 'AKAD KOMITMEN THALIBAH TIKRAR TAHFIDZ',
  sections: [
    {
      title: '1. KOMITMEN KETETAPAN WAKTU',
      items: [
        'Saya bersedia mengikuti kelas sesuai jadwal yang telah ditentukan',
        'Saya memahami bahwa ketepatan waktu adalah kunci kesuksesan dalam menghafal',
        'Saya bersedia datang 10 menit sebelum kelas dimulai',
        'Saya memahami bahwa keterlambatan akan berdampak pada pasangan setoran saya'
      ]
    },
    {
      title: '2. KOMITMEN KETUNDUKAN KEPADA MUALLIMAH',
      items: [
        'Saya bersedia menerima nasihat dan teguran dari muallimah dengan hati yang terbuka',
        'Saya memahami bahwa muallimah memberikan teguran demi kemajuan saya',
        'Saya bersedia mengikuti aturan yang ditetapkan oleh muallimah',
        'Saya memahami bahwa muallimah adalah orang yang lebih berilman'
      ]
    },
    {
      title: '3. KOMITMEN SETORAN HAFALAN',
      items: [
        'Saya bersedia menyetorkan hafalan sesuai target yang ditentukan',
        'Saya memahami bahwa murajaah (mengulang) adalah kunci penetapan hafalan',
        'Saya bersedia meluruskan bacaan sesuai dengan kaidah tajwid',
        'Saya memahami bahwa kualitas bacaan lebih penting dari kuantitas'
      ]
    },
    {
      title: '4. KOMITMEN PASANGAN SETORAN',
      items: [
        'Saya bersedia saling mengingatkan dengan pasangan setoran saya',
        'Saya memahami bahwa pasangan setoran adalah amanah yang harus dijaga',
        'Saya bersedia memberikan yang terbaik saat mendengarkan setoran pasangan',
        'Saya memahami bahwa saling menghargai waktu pasangan adalah bagian dari adab'
      ]
    },
    {
      title: '5. KOMITMEN KEIKHLASAN',
      items: [
        'Saya memahami bahwa menghafal Al-Quran adalah ibadah yang harus diniatkan karena Allah',
        'Saya bersedia menerima segala bentuk ujian dengan hati yang ikhlas',
        'Saya memahami bahwa kesuksesan bukan hanya tentang hafalan, tapi juga adab dan akhlak',
        'Saya bersedia terus belajar dan memperbaiki diri'
      ]
    }
  ]
};

export default function DaftarUlangContent({ userId, batchId, userRole }: DaftarUlangContentProps) {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check if user is admin - use useMemo to prevent re-renders
  const isAdmin = useMemo(() => {
    return userRole === 'admin' ||
      (Array.isArray(userRole) && userRole.includes('admin')) ||
      (Array.isArray((userRole as any)?.roles) && (userRole as any).roles.includes('admin'));
  }, [userRole]);

  // Fetch batch data
  const { data: batch, error: batchError } = useSWR(
    `/api/batches/${batchId}`,
    fetcher
  );

  // Fetch registration data
  const { data: registration, error: registrationError } = useSWR(
    `/api/pendaftaran/my?batch_id=${batchId}`,
    fetcher
  );

  // Fetch schedule data
  const { data: scheduleData, error: scheduleError, mutate: mutateSchedules } = useSWR(
    () => registration ? `/api/daftar-ulang/schedules?batch_id=${batchId}` : null,
    fetcher
  );

  // Fetch partner data
  const { data: partnerData, error: partnerError, mutate: mutatePartners } = useSWR(
    () => registration ? `/api/daftar-ulang/partners?batch_id=${batchId}` : null,
    fetcher
  );

  // Fetch akad data
  const { data: akadData, error: akadError, mutate: mutateAkad } = useSWR(
    () => registration ? `/api/daftar-ulang/akad?batch_id=${batchId}` : null,
    fetcher
  );

  // Fetch completion status
  const { data: statusData, mutate: mutateStatus } = useSWR(
    () => registration ? `/api/daftar-ulang/submit?batch_id=${batchId}` : null,
    fetcher
  );

  // Show loading while fetching initial data
  if (!batch || !registration) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-900 mx-auto mb-4" />
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Check if user is selected (skip check for admin during testing)
  if (!isAdmin && registration.selection_status !== 'selected') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-4">Belum Dipilih</h1>
          <p className="text-gray-600 mb-6">Halaman daftar ulang hanya untuk thalibah yang sudah dipilih.</p>
          <a
            href="/perjalanan-saya"
            className="inline-block px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors"
          >
            Kembali ke Perjalanan Saya
          </a>
        </div>
      </div>
    );
  }

  // Check if already completed
  if (registration.re_enrollment_completed) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-4">Daftar Ulang Sudah Selesai</h1>
          <p className="text-gray-600 mb-2">Alhamdulillah! Anda sudah menyelesaikan daftar ulang.</p>
          <a
            href="/perjalanan-saya"
            className="inline-block px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors mt-4"
          >
            Ke Perjalanan Saya
          </a>
        </div>
      </div>
    );
  }

  // Schedule selection state
  const [selectedTashihSchedule, setSelectedTashihSchedule] = useState<string>(() => '');
  const [selectedUjianSchedule, setSelectedUjianSchedule] = useState<string>(() => '');
  const [scheduleNotes, setScheduleNotes] = useState(() => '');

  // Partner selection state - initialize with lazy function to avoid recreating
  const [partnerType, setPartnerType] = useState<'thalibah' | 'family' | 'tarteel'>(() => {
    // Will be updated by useEffect after data loads
    return 'thalibah';
  });
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(() => '');
  const [familyMemberName, setFamilyMemberName] = useState(() => '');
  const [familyRelationship, setFamilyRelationship] = useState(() => '');
  const [tarteelCommitment, setTarteelCommitment] = useState(() => false);
  const [dailyProofMethod, setDailyProofMethod] = useState(() => '');

  // Akad state
  const [akadAgreed, setAkadAgreed] = useState(() => false);
  const [currentSection, setCurrentSection] = useState(() => 0);

  async function fetcher(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }

  // Direct extraction - useMemo was causing issues with SWR
  const availableSchedules = scheduleData?.data?.available_schedules;
  const existingSchedulePreference = scheduleData?.data?.existing_preference;
  const compatiblePartners = partnerData?.data?.compatible_partners || [];
  const existingPreference = partnerData?.data?.existing_preference;
  const pendingRequests = partnerData?.data?.pending_requests || [];
  const userRegistration = partnerData?.data?.user_registration;
  const akadCommitment = akadData?.data;

  // Use ref to track if we've already initialized state from data
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only run once when data first loads
    if (!initializedRef.current) {
      if (existingSchedulePreference) {
        setSelectedTashihSchedule(existingSchedulePreference.preferred_muallimah_tashih || '');
        setSelectedUjianSchedule(existingSchedulePreference.preferred_muallimah_ujian || '');
        setScheduleNotes(existingSchedulePreference.notes || '');
      }
      if (existingPreference) {
        setPartnerType(existingPreference.partner_type);
        if (existingPreference.preferred_partner_id) {
          setSelectedPartnerId(existingPreference.preferred_partner_id);
        }
        if (existingPreference.family_member_name) {
          setFamilyMemberName(existingPreference.family_member_name);
          setFamilyRelationship(existingPreference.family_member_relationship || '');
        }
        if (existingPreference.tarteel_commitment) {
          setTarteelCommitment(existingPreference.tarteel_commitment);
          setDailyProofMethod(existingPreference.daily_proof_method || '');
        }
      }
      if (akadCommitment?.agreed) {
        setAkadAgreed(true);
      }
      initializedRef.current = true;
    }
  }, [existingSchedulePreference, existingPreference, akadCommitment]);

  const handleScheduleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/daftar-ulang/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId,
          tashih_schedule_id: selectedTashihSchedule,
          ujian_schedule_id: selectedUjianSchedule,
          notes: scheduleNotes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save schedule preference');
      }

      toast.success('Preferensi jadwal berhasil disimpan!');
      mutateSchedules();
      setCurrentStep('partner');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan preferensi jadwal');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerSubmit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        batch_id: batchId,
        partner_type: partnerType
      };

      if (partnerType === 'thalibah') {
        payload.preferred_partner_id = selectedPartnerId;
      } else if (partnerType === 'family') {
        payload.family_member_name = familyMemberName;
        payload.family_member_relationship = familyRelationship;
      } else if (partnerType === 'tarteel') {
        payload.tarteel_commitment = tarteelCommitment;
        payload.daily_proof_method = dailyProofMethod;
      }

      const res = await fetch('/api/daftar-ulang/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save partner preference');
      }

      toast.success('Preferensi pasangan setoran berhasil disimpan!');

      if (data.data.mutual_partnership?.status === 'mutual') {
        toast.success('Alhamdulillah! Pasangan setoran sudah terjalin secara mutual!');
      }

      mutatePartners();
      setCurrentStep('akad');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan preferensi pasangan');
    } finally {
      setLoading(false);
    }
  };

  const handleAkadSubmit = async () => {
    if (!akadAgreed) {
      toast.error('Silakan setujui akad terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/daftar-ulang/akad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId,
          akad_content: AKAD_CONTENT,
          agreed: true
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save akad');
      }

      toast.success('Akad berhasil disetujui!');
      mutateAkad();
      setCurrentStep('review');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan akad');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDaftarUlang = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/daftar-ulang/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit daftar ulang');
      }

      toast.success(data.data.message || 'Daftar ulang berhasil!');
      setCurrentStep('complete');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyelesaikan daftar ulang');
    } finally {
      setSubmitting(false);
    }
  };

  // Stable navigation callbacks to prevent re-renders
  const goToSchedule = useCallback(() => setCurrentStep('schedule'), []);
  const goToPartner = useCallback(() => setCurrentStep('partner'), []);
  const goToIntro = useCallback(() => setCurrentStep('intro'), []);
  const goToAkad = useCallback(() => setCurrentStep('akad'), []);
  const goToReview = useCallback(() => setCurrentStep('review'), []);

  if (currentStep === 'intro') {
    return <IntroStep onNext={goToSchedule} batch={batch} />;
  }

  if (currentStep === 'schedule') {
    return (
      <ScheduleStep
        availableSchedules={availableSchedules}
        selectedTashihSchedule={selectedTashihSchedule}
        setSelectedTashihSchedule={setSelectedTashihSchedule}
        selectedUjianSchedule={selectedUjianSchedule}
        setSelectedUjianSchedule={setSelectedUjianSchedule}
        scheduleNotes={scheduleNotes}
        setScheduleNotes={setScheduleNotes}
        loading={loading}
        onBack={goToIntro}
        onNext={handleScheduleSubmit}
      />
    );
  }

  if (currentStep === 'partner') {
    return (
      <PartnerStep
        registration={registration}
        userRegistration={userRegistration}
        partnerType={partnerType}
        setPartnerType={setPartnerType}
        selectedPartnerId={selectedPartnerId}
        setSelectedPartnerId={setSelectedPartnerId}
        familyMemberName={familyMemberName}
        setFamilyMemberName={setFamilyMemberName}
        familyRelationship={familyRelationship}
        setFamilyRelationship={setFamilyRelationship}
        tarteelCommitment={tarteelCommitment}
        setTarteelCommitment={setTarteelCommitment}
        dailyProofMethod={dailyProofMethod}
        setDailyProofMethod={setDailyProofMethod}
        compatiblePartners={compatiblePartners}
        existingPreference={existingPreference}
        pendingRequests={pendingRequests}
        loading={loading}
        onBack={goToSchedule}
        onNext={handlePartnerSubmit}
      />
    );
  }

  if (currentStep === 'akad') {
    return (
      <AkadStep
        akadAgreed={akadAgreed}
        setAkadAgreed={setAkadAgreed}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        loading={loading}
        onBack={goToPartner}
        onNext={handleAkadSubmit}
      />
    );
  }

  if (currentStep === 'review') {
    return (
      <ReviewStep
        batch={batch}
        registration={registration}
        selectedTashihSchedule={selectedTashihSchedule}
        selectedUjianSchedule={selectedUjianSchedule}
        availableSchedules={availableSchedules}
        partnerType={partnerType}
        existingPreference={existingPreference}
        akadCommitment={akadCommitment}
        loading={submitting}
        onBack={goToAkad}
        onNext={handleSubmitDaftarUlang}
        statusData={statusData}
      />
    );
  }

  if (currentStep === 'complete') {
    return <CompleteStep batch={batch} />;
  }

  return null;
}

// Schedule Step
function ScheduleStep({
  availableSchedules,
  selectedTashihSchedule,
  setSelectedTashihSchedule,
  selectedUjianSchedule,
  setSelectedUjianSchedule,
  scheduleNotes,
  setScheduleNotes,
  loading,
  onBack,
  onNext
}: any) {
  const canSubmit = () => {
    return !!selectedTashihSchedule && !!selectedUjianSchedule;
  };

  if (!availableSchedules) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-900 mx-auto mb-4" />
          <p className="text-gray-600">Memuat jadwal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pilih Jadwal Tashih dan Ujian Pekanan</h2>
          <p className="text-gray-600">Pilih jadwal yang sesuai dengan waktu Anda untuk tashih hafalan dan ujian pekanan</p>
        </div>

        <div className="space-y-8">
          {/* Jadwal Tashih */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-green-900" />
              <h3 className="font-semibold text-gray-900">Jadwal Tashih Hafalan</h3>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Tashih</strong> adalah sesi untuk menyetorkan hafalan baru kepada muallimah. Pilih jadwal yang sesuai dengan waktu Anda.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {availableSchedules.tashih_schedules?.map((schedule: any) => (
                <label
                  key={schedule.id}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTashihSchedule === schedule.id
                      ? 'border-green-900 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{schedule.label}</p>
                    <p className="text-sm text-gray-600">{schedule.time}</p>
                  </div>
                  <input
                    type="radio"
                    name="tashih"
                    checked={selectedTashihSchedule === schedule.id}
                    onChange={() => setSelectedTashihSchedule(schedule.id)}
                    className="w-4 h-4 text-green-900"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Jadwal Ujian */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-green-900" />
              <h3 className="font-semibold text-gray-900">Jadwal Ujian Pekanan</h3>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-purple-800">
                <strong>Ujian Pekanan</strong> adalah ujian mingguan untuk mengetes hafalan yang telah Anda setorkan. Biasanya dilaksanakan pada akhir pekan.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {availableSchedules.ujian_schedules?.map((schedule: any) => (
                <label
                  key={schedule.id}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedUjianSchedule === schedule.id
                      ? 'border-green-900 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{schedule.label}</p>
                    <p className="text-sm text-gray-600">{schedule.time}</p>
                  </div>
                  <input
                    type="radio"
                    name="ujian"
                    checked={selectedUjianSchedule === schedule.id}
                    onChange={() => setSelectedUjianSchedule(schedule.id)}
                    className="w-4 h-4 text-green-900"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              value={scheduleNotes}
              onChange={(e) => setScheduleNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-900 focus:border-transparent"
              rows={3}
              placeholder="Jika ada catatan khusus terkait jadwal, tuliskan di sini..."
            />
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>
          <button
            onClick={onNext}
            disabled={loading || !canSubmit()}
            className="px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                Lanjut
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Intro Step
function IntroStep({ onNext, batch }: { onNext: () => void; batch: Batch }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang di Daftar Ulang</h1>
          <p className="text-gray-600">Batch: {batch.name}</p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Pilih Jadwal Tashih dan Ujian Pekanan</h3>
              <p className="text-sm text-gray-600">Pilih jadwal yang sesuai untuk tashih hafalan dan ujian pekanan</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Pilih Pasangan Setoran</h3>
              <p className="text-sm text-gray-600">Pilih pasangan setoran dari sesama thalibah, keluarga, atau gunakan aplikasi Tarteel</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Setujui Akad Komitmen</h3>
              <p className="text-sm text-gray-600">Baca dan setujui komitmen yang akan Anda pegang selama mengikuti program</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Selesaikan Daftar Ulang</h3>
              <p className="text-sm text-gray-600">Review dan selesaikan proses daftar ulang untuk menjadi thalibah resmi</p>
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full py-3 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors font-semibold"
        >
          Mulai Daftar Ulang
        </button>
      </div>
    </div>
  );
}

// Partner Step
function PartnerStep({
  registration,
  userRegistration,
  partnerType,
  setPartnerType,
  selectedPartnerId,
  setSelectedPartnerId,
  familyMemberName,
  setFamilyMemberName,
  familyRelationship,
  setFamilyRelationship,
  tarteelCommitment,
  setTarteelCommitment,
  dailyProofMethod,
  setDailyProofMethod,
  compatiblePartners,
  existingPreference,
  pendingRequests,
  loading,
  onBack,
  onNext
}: any) {
  const canSubmit = () => {
    if (partnerType === 'thalibah') return !!selectedPartnerId;
    if (partnerType === 'family') return !!familyMemberName;
    if (partnerType === 'tarteel') return tarteelCommitment;
    return false;
  };

  // Use userRegistration from partners API if available, otherwise fallback to registration
  const displayJuz = userRegistration?.chosen_juz || registration?.chosen_juz || '-';
  const displayTimeSlot = userRegistration?.main_time_slot || registration?.main_time_slot || '-';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pilih Pasangan Setoran</h2>
          <p className="text-gray-600">Pilih pasangan setoran untuk membantu proses murajaah dan setoran hafalan</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => { setPartnerType('thalibah'); }}
            className={`p-6 rounded-lg border-2 text-left transition-all ${
              partnerType === 'thalibah'
                ? 'border-green-900 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <Users className="w-8 h-8 text-green-900 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Sesama Thalibah</h3>
            <p className="text-sm text-gray-600">Pilih pasangan dari sesama thalibah dengan juz dan waktu yang cocok</p>
          </button>

          <button
            onClick={() => { setPartnerType('family'); }}
            className={`p-6 rounded-lg border-2 text-left transition-all ${
              partnerType === 'family'
                ? 'border-green-900 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <User className="w-8 h-8 text-green-900 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Keluarga</h3>
            <p className="text-sm text-gray-600">Setoran dengan anggota keluarga yang memenuhi syarat</p>
          </button>

          <button
            onClick={() => { setPartnerType('tarteel'); }}
            className={`p-6 rounded-lg border-2 text-left transition-all ${
              partnerType === 'tarteel'
                ? 'border-green-900 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <Clock className="w-8 h-8 text-green-900 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Aplikasi Tarteel</h3>
            <p className="text-sm text-gray-600">Gunakan aplikasi Tarteel dengan bukti harian</p>
          </button>
        </div>

        {partnerType === 'thalibah' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Info Pencocokan</h4>
              </div>
              <p className="text-sm text-blue-800">Juz Anda: <strong>{displayJuz}</strong> | Waktu: <strong>{displayTimeSlot}</strong></p>
              <p className="text-sm text-blue-800 mt-1">Pasangan dengan juz dan waktu yang sama akan diprioritaskan.</p>
            </div>

            {pendingRequests.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-3">Permintaan Pasangan Masuk</h4>
                <div className="space-y-2">
                  {pendingRequests.map((req: any) => (
                    <div key={req.id} className="bg-white p-3 rounded border border-yellow-200 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{req.users?.full_name}</p>
                        <p className="text-sm text-gray-600">Juz: {req.registrations?.chosen_juz}</p>
                      </div>
                      <button
                        onClick={() => setSelectedPartnerId(req.user_id)}
                        className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Terima
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Pasangan yang Tersedia</h4>
              {compatiblePartners.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Belum ada pasangan yang cocok.</p>
                  <p className="text-sm text-gray-500 mt-1">Silakan pilih opsi Keluarga atau Tarteel sebagai alternatif.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {compatiblePartners.map((partner: any) => (
                    <label
                      key={partner.partner_id}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPartnerId === partner.partner_id
                          ? 'border-green-900 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{partner.partner_name}</p>
                        <p className="text-sm text-gray-600">Juz: {partner.partner_juz} | Waktu: {partner.partner_time_slot}</p>
                        {partner.match_score < 100 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Match: {partner.match_score}%</span>
                        )}
                      </div>
                      <input
                        type="radio"
                        name="partner"
                        checked={selectedPartnerId === partner.partner_id}
                        onChange={() => setSelectedPartnerId(partner.partner_id)}
                        className="w-4 h-4 text-green-900"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {existingPreference?.partner_status === 'mutual' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-900">Pasangan Mutual!</p>
                </div>
                <p className="text-sm text-green-800 mt-1">Alhamdulillah! Pasangan setoran Anda sudah saling memilih.</p>
              </div>
            )}
          </div>
        )}

        {partnerType === 'family' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Anggota Keluarga</label>
              <input
                type="text"
                value={familyMemberName}
                onChange={(e) => setFamilyMemberName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-900 focus:border-transparent"
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hubungan Keluarga</label>
              <select
                value={familyRelationship}
                onChange={(e) => setFamilyRelationship(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-900 focus:border-transparent"
              >
                <option value="">Pilih hubungan</option>
                <option value="suami">Suami</option>
                <option value="ayah">Ayah</option>
                <option value="saudara_laki_laki">Saudara Laki-laki</option>
                <option value="anak_laki_laki">Anak Laki-laki</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Syarat:</strong> Anggota keluarga laki-laki yang sudah baligh, mampu membaca Al-Quran dengan benar sesuai kaidah tajwid, dan memiliki waktu yang konsisten.
              </p>
            </div>
          </div>
        )}

        {partnerType === 'tarteel' && (
          <div className="space-y-4">
            <label className={`flex items-start gap-4 p-6 rounded-lg border-2 cursor-pointer transition-all ${
              tarteelCommitment ? 'border-green-900 bg-green-50' : 'border-gray-200'
            }`}>
              <input
                type="checkbox"
                checked={tarteelCommitment}
                onChange={(e) => setTarteelCommitment(e.target.checked)}
                className="w-5 h-5 text-green-900 mt-1"
              />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Komitmen Menggunakan Aplikasi Tarteel</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Saya bersedia menggunakan aplikasi Tarteel untuk setoran harian dengan ketentuan:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Minimal 1 halaman per hari</li>
                  <li>Mengupload bukti rekaman/screenshot</li>
                  <li>Tepat waktu sesuai jadwal yang disepakati</li>
                </ul>
              </div>
            </label>

            {tarteelCommitment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metode Bukti Harian</label>
                <select
                  value={dailyProofMethod}
                  onChange={(e) => setDailyProofMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-900 focus:border-transparent"
                >
                  <option value="">Pilih metode</option>
                  <option value="recording">Rekaman Suara</option>
                  <option value="screenshot">Screenshot Tarteel</option>
                  <option value="video">Video Pembacaan</option>
                </select>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>
          <button
            onClick={onNext}
            disabled={loading || !canSubmit()}
            className="px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                Lanjut
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Akad Step
function AkadStep({
  akadAgreed,
  setAkadAgreed,
  currentSection,
  setCurrentSection,
  loading,
  onBack,
  onNext
}: any) {
  const [readSections, setReadSections] = useState<Set<number>>(new Set());

  const toggleSectionRead = (index: number) => {
    const newReadSections = new Set(readSections);
    if (newReadSections.has(index)) {
      newReadSections.delete(index);
    } else {
      newReadSections.add(index);
    }
    setReadSections(newReadSections);
  };

  const allRead = readSections.size === AKAD_CONTENT.sections.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akad Komitmen Thalibah</h2>
          <p className="text-gray-600">Baca dan pahami setiap bagian dari akad komitmen berikut</p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-center text-green-900 mb-6">{AKAD_CONTENT.title}</h3>
        </div>

        <div className="space-y-4 mb-8">
          {AKAD_CONTENT.sections.map((section, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setCurrentSection(currentSection === index ? -1 : index)}
                className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={readSections.has(index)}
                    onChange={() => toggleSectionRead(index)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 text-green-900 rounded"
                  />
                  <span className="font-semibold text-gray-900">{section.title}</span>
                </div>
                <span className="text-gray-400">
                  {currentSection === index ? '▼' : '▶'}
                </span>
              </button>
              {currentSection === index && (
                <div className="p-6 bg-white">
                  <ul className="space-y-3">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-green-600 mt-1">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">Penting!</p>
              <p className="text-sm text-yellow-800">
                Pastikan Anda membaca semua bagian akad sebelum melanjutkan. Centang setiap bagian setelah membaca.
              </p>
              {!allRead && (
                <p className="text-sm text-yellow-700 mt-2">
                  Belum dibaca: {AKAD_CONTENT.sections.length - readSections.size} bagian
                </p>
              )}
            </div>
          </div>
        </div>

        <label className={`flex items-start gap-4 p-6 rounded-lg border-2 mb-8 cursor-pointer transition-all ${
          akadAgreed ? 'border-green-900 bg-green-50' : 'border-gray-200'
        }`}>
          <input
            type="checkbox"
            checked={akadAgreed}
            onChange={(e) => setAkadAgreed(e.target.checked)}
            disabled={!allRead}
            className="w-5 h-5 text-green-900 mt-1 disabled:opacity-50"
          />
          <div>
            <p className="font-semibold text-gray-900">
              Saya telah membaca, memahami, dan menyetujui seluruh isi Akad Komitmen ini
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Dengan menyetujui akad ini, saya siap melaksanakan seluruh komitmen dengan penuh tanggung jawab dan keikhlasan.
            </p>
          </div>
        </label>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>
          <button
            onClick={onNext}
            disabled={loading || !akadAgreed}
            className="px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                Lanjut
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Review Step
function ReviewStep({
  batch,
  registration,
  selectedTashihSchedule,
  selectedUjianSchedule,
  availableSchedules,
  partnerType,
  existingPreference,
  akadCommitment,
  loading,
  onBack,
  onNext,
  statusData
}: any) {
  const requirements = statusData?.data?.requirements || {
    schedule_selected: !!selectedTashihSchedule && !!selectedUjianSchedule,
    akad_completed: !!akadCommitment?.agreed,
    partner_selected: !!existingPreference,
    halaqah_assigned: false,
    can_submit: !!selectedTashihSchedule && !!selectedUjianSchedule && !!akadCommitment?.agreed && !!existingPreference
  };

  // Get schedule labels
  const getTashihLabel = () => {
    if (!selectedTashihSchedule || !availableSchedules?.tashih_schedules) return '-';
    const schedule = availableSchedules.tashih_schedules.find((s: any) => s.id === selectedTashihSchedule);
    return schedule ? schedule.label : selectedTashihSchedule;
  };

  const getUjianLabel = () => {
    if (!selectedUjianSchedule || !availableSchedules?.ujian_schedules) return '-';
    const schedule = availableSchedules.ujian_schedules.find((s: any) => s.id === selectedUjianSchedule);
    return schedule ? schedule.label : selectedUjianSchedule;
  };

  const getPartnerTypeLabel = () => {
    if (partnerType === 'thalibah') return 'Sesama Thalibah';
    if (partnerType === 'family') return 'Keluarga';
    return 'Aplikasi Tarteel';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Daftar Ulang</h2>
          <p className="text-gray-600">Periksa kembali informasi Anda sebelum menyelesaikan daftar ulang</p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Informasi Pendaftaran</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-600">Batch</dt>
                <dd className="font-medium">{batch.name}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Juz</dt>
                <dd className="font-medium">{registration.chosen_juz}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Waktu Utama</dt>
                <dd className="font-medium">{registration.main_time_slot}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Waktu Cadangan</dt>
                <dd className="font-medium">{registration.backup_time_slot}</dd>
              </div>
            </dl>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Jadwal Tashih dan Ujian</h3>
            <div className="flex items-center gap-3 mb-3">
              {requirements.schedule_selected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">Jadwal Tashih: {getTashihLabel()}</p>
                <p className="font-medium">Jadwal Ujian: {getUjianLabel()}</p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Pasangan Setoran</h3>
            <div className="flex items-center gap-3">
              {requirements.partner_selected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">{getPartnerTypeLabel()}</p>
                {partnerType === 'thalibah' && existingPreference?.partner_status === 'mutual' && (
                  <span className="text-sm text-green-600">Pasangan Mutual ✓</span>
                )}
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Akad Komitmen</h3>
            <div className="flex items-center gap-3">
              {requirements.akad_completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">
                  {requirements.akad_completed ? 'Disetujui' : 'Belum disetujui'}
                </p>
                {akadCommitment?.signed_at && (
                  <p className="text-sm text-gray-600">
                    Ditandatangani: {new Date(akadCommitment.signed_at).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Status Penyelesaian</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {requirements.schedule_selected ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm">Jadwal tashih dan ujian dipilih</span>
              </div>
              <div className="flex items-center gap-2">
                {requirements.partner_selected ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm">Pasangan setoran dipilih</span>
              </div>
              <div className="flex items-center gap-2">
                {requirements.akad_completed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm">Akad komitmen disetujui</span>
              </div>
              <div className="flex items-center gap-2">
                {requirements.halaqah_assigned ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm">
                  {requirements.halaqah_assigned ? 'Halaqah assigned' : 'Menunggu penugasan halaqah oleh admin'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!requirements.can_submit && (
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Belum Lengkap</p>
                <p className="text-sm text-yellow-800">
                  {!requirements.schedule_selected && 'Silakan pilih jadwal tashih dan ujian. '}
                  {!requirements.partner_selected && 'Silakan pilih pasangan setoran. '}
                  {!requirements.akad_completed && 'Silakan setujui akad komitmen. '}
                  {!requirements.halaqah_assigned && 'Anda perlu ditugaskan ke halaqah oleh admin terlebih dahulu.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={onBack}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>
          <button
            onClick={onNext}
            disabled={loading || !requirements.can_submit}
            className="px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              'Selesaikan Daftar Ulang'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Complete Step
function CompleteStep({ batch }: { batch: Batch }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Alhamdulillah!</h1>
        <p className="text-gray-600 mb-2">Daftar ulang berhasil diselesaikan</p>
        <p className="text-sm text-gray-500 mb-8">Anda sekarang resmi menjadi thalibah di batch {batch.name}</p>

        <div className="space-y-4 text-left bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Langkah Selanjutnya:</h3>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="bg-green-900 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">1</span>
              <span>Tunggu informasi lebih lanjut mengenai jadwal kelas dan grup halaqah Anda</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-green-900 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">2</span>
              <span>Bergabunglah dengan grup Telegram halaqah setelah mendapat undangan</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-green-900 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">3</span>
              <span>Persiapkan diri untuk memulai perjalanan menghafal Al-Quran</span>
            </li>
          </ol>
        </div>

        <a
          href="/perjalanan-saya"
          className="inline-block px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors"
        >
          Ke Perjalanan Saya
        </a>
      </div>
    </div>
  );
}
