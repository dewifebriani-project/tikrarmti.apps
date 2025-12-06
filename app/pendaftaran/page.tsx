'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Users,
  UserCheck,
  ShieldCheck,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Star,
  Loader2,
  Crown
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useBatchProgram } from '@/hooks/useBatchProgram';
import { BatchStatus, ProgramStatus } from '@/types/database';

interface PendaftaranType {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  benefits: string[];
  requirements: string[];
  status: 'open' | 'closed' | 'upcoming';
  batchInfo?: {
    batch: string;
    period: string;
    deadline: string;
    capacity: number;
    registered: number;
  };
  price?: string;
  duration?: string;
  programId?: string;
  batchId?: string;
}

export default function PendaftaranPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [pendaftaranTypes, setPendaftaranTypes] = useState<PendaftaranType[]>([]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<PendaftaranType | null>(null);

  const { batches, programs, loading, error } = useBatchProgram();

  useEffect(() => {
    // Transform data from API to match expected format
    if (batches.length > 0 || programs.length > 0) {
      const transformedData: PendaftaranType[] = [];
      const activeBatchIds = new Set<string>();

      // Add programs from database first (this is the primary source)
      programs.forEach((program) => {
        // Skip if this is a Thalibah Tahfidz program that matches an active batch
        if (program.name.toLowerCase().includes('tahfidz') &&
            program.name.toLowerCase().includes('tikrar')) {
          // Mark this batch as having a program
          if (program.batch_id) {
            activeBatchIds.add(program.batch_id);
          }
        }

        const programType = getProgramTypeByName(program.name);

        // Get price and duration from batch if available
        const batchPrice = program.batch?.is_free
          ? 'GRATIS'
          : program.batch?.price
            ? `Rp ${program.batch.price.toLocaleString('id-ID')}/bulan`
            : programType.price;

        const batchDuration = program.batch?.duration_weeks
          ? `${Math.ceil(program.batch.duration_weeks / 4)} bulan`
          : programType.duration;

        transformedData.push({
          id: `program-${program.id}`,
          title: program.name,
          description: program.description || `Program ${program.name} MTI`,
          icon: programType.icon,
          color: programType.color,
          benefits: programType.benefits,
          requirements: programType.requirements,
          status: mapProgramStatus(program.status),
          batchInfo: program.batch ? {
            batch: program.batch.name,
            period: `${formatDate(program.batch.start_date)} - ${formatDate(program.batch.end_date)}`,
            deadline: formatDate(program.batch.registration_end_date),
            capacity: program.batch.total_quota || program.max_thalibah || 50,
            registered: program.batch.registered_count || 0
          } : undefined,
          price: batchPrice,
          duration: batchDuration,
          programId: program.id,
          batchId: program.batch_id
        });
      });

      // NOTE: Removed placeholder generation for batches without programs
      // Only programs from the database should be displayed

      setPendaftaranTypes(transformedData);
    }
  }, [batches, programs]);

  const getProgramTypeByName = (name: string) => {
    if (name.toLowerCase().includes('musyrifah')) {
      return {
        icon: UserCheck,
        color: 'blue',
        benefits: [
          'Training manajerial dan kepemimpinan',
          'Metode pembinaan santri modern',
          'Sertifikasi musyrifah profesional',
          'Peluang karir di berbagai lembaga',
          'Networking dengan praktisi pendidikan'
        ],
        requirements: [
          'Muslimah usia 20-40 tahun',
          'Minimal pendidikan SMA/Sederajat',
          'Pengalaman di bidang pendidikan minimal 1 tahun',
          'Memiliki leadership skill',
          'Lulus tes psikologi dan wawancara'
        ],
        price: 'Rp 3.500.000/program',
        duration: '3 bulan'
      };
    } else if (name.toLowerCase().includes('muallimah')) {
      return {
        icon: ShieldCheck,
        color: 'purple',
        benefits: [
          'Sertifikasi guru Al-Quran internasional',
          'Mastery berbagai metode pengajaran Al-Quran',
          'Kurikulum berbasis research dan best practice',
          'Praktik mengajar terbimbing',
          'Beasiswa lanjutan S1/S2 untuk peserta terbaik'
        ],
        requirements: [
          'Muslimah usia 18-35 tahun',
          'Minimal hafal 3 juz Al-Quran',
          'Minimal pendidikan SMA/Sederajat',
          'Passion mengajar dan mendidik',
          'Lulus tes akademik dan mengajar'
        ],
        price: 'Rp 5.000.000/program',
        duration: '6 bulan'
      };
    } else if (name.toLowerCase().includes('kelas khusus') || name.toLowerCase().includes('elite')) {
      return {
        icon: Star,
        color: 'yellow',
        benefits: [
          'Kurikulum khusus dengan metode tikrar itqan terbaru',
          'Pembimbingan one-on-one dengan hafidzah berprestasi',
          'Fasilitas premium dan kelas berkapasitas terbatas',
          'Program pengembangan leadership dan public speaking',
          'Sertifikat internasional dan beasiswa lanjutan',
          'Program pengabdian masyarakat terintegrasi'
        ],
        requirements: [
          'Muslimah usia 16-28 tahun',
          'Minimal hafal 5 juz Al-Quran',
          'Nilai akademik minimal 80 (rata-rata)',
          'Surat rekomendasi dari ustadz/ah',
          'Lulus tes psikotes dan wawancara ketua',
          'Siap mengikuti program boarding'
        ],
        price: 'Rp 7.500.000/bulan',
        duration: '15 bulan'
      };
    } else if (name.toLowerCase().includes('pengurus')) {
      return {
        icon: ShieldCheck,
        color: 'indigo',
        benefits: [
          'Training kepemimpinan islami modern',
          'Sertifikasi manajemen lembaga tahfidz',
          'Magang langsung di tingkat manajemen MTI',
          'Networking dengan pimpinan lembaga tahfidz se-Indonesia',
          'Peluang karir sebagai manager dan direktur MTI',
          'Program study tour ke lembaga tahfidz internasional'
        ],
        requirements: [
          'Muslimah usia 22-45 tahun',
          'Minimal S1 atau sederajat (IPK minimal 3.00)',
          'Pengalaman organisasi minimal 2 tahun',
          'Kemampuan leadership dan problem solving',
          'Bisa berbahasa Inggris (pasif/aktif)',
          'Lulus assessment center dan interview board'
        ],
        price: 'Rp 12.000.000/program',
        duration: '7 bulan'
      };
    } else {
      // Default for Kelas Umum
      return {
        icon: Users,
        color: 'green',
        benefits: [
          'Belajar tajwid dan tahsin praktis',
          'Kelas fleksibel (online/offline)',
          'Materi disesuaikan level kemampuan',
          'Sertifikat kelulusan',
          'Komunitas pengajian yang mendukung'
        ],
        requirements: [
          'Minimal usia 12 tahun',
          'Bisa membaca Al-Quran',
          'Memiliki perangkat untuk online (jika kelas online)',
          'Komitmen mengikuti kelas'
        ],
        price: 'Rp 250.000/bulan',
        duration: '4 bulan'
      };
    }
  };

  const mapProgramStatus = (status: ProgramStatus): 'open' | 'closed' | 'upcoming' => {
    switch (status) {
      case 'open':
        return 'open';
      case 'ongoing':
        return 'open';
      case 'completed':
      case 'cancelled':
        return 'closed';
      case 'draft':
      default:
        return 'upcoming';
    }
  };

  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: 'open' | 'closed' | 'upcoming') => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-green-500/50 animate-pulse">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Pendaftaran Dibuka
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-900">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendaftaran Ditutup
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-900">
            <Clock className="w-3 h-3 mr-1" />
            Akan Dibuka
          </span>
        );
    }
  };

  const handleRegistrationClick = (type: PendaftaranType) => {
    if (type.status === 'open') {
      // Show terms modal before allowing registration
      setPendingRegistration(type);
      setShowTermsModal(true);
    }
  };

  const handleProceedToRegistration = () => {
    if (agreedToTerms && pendingRegistration) {
      setShowTermsModal(false);
      // Redirect to the tikrar-tahfidz form
      router.push('/pendaftaran/tikrar-tahfidz');
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout title="Pendaftaran Program">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-900" />
            <p className="text-gray-600">Memuat data program...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout title="Pendaftaran Program">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Pendaftaran Program">
      <div className="space-y-8">
      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Syarat dan Ketentuan</h2>
              <p className="text-sm sm:text-base text-green-100">Markaz Tikrar Indonesia (MTI)</p>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Penting:</strong> Silakan baca dengan seksama syarat dan ketentuan di bawah ini sebelum melanjutkan pendaftaran.
                </p>
              </div>

              {/* Quick Summary */}
              <div className="space-y-3 text-sm text-gray-700">
                <h3 className="font-bold text-base text-green-900">Ringkasan Syarat dan Ketentuan:</h3>

                <div className="space-y-2">
                  <h4 className="font-semibold text-green-800">✅ Komitmen Anda:</h4>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>Mengikuti program hingga selesai (13-16 pekan)</li>
                    <li>Menyediakan waktu minimal 2 jam/hari untuk menghafal</li>
                    <li>Melaksanakan tikrar 40x tanpa pengurangan</li>
                    <li>Konsisten dalam setoran harian kepada pasangan</li>
                    <li>Mendapat izin dari suami/wali yang bertanggung jawab</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-red-800">⚠️ Larangan:</h4>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-red-700">
                    <li>Keluar dari program tanpa udzur syar'i</li>
                    <li>Mendzolimi waktu pasangan tikrar</li>
                    <li>Nego-nego jumlah tikrar atau aturan program</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-orange-800">🚫 Sanksi Blacklist:</h4>
                  <p className="text-orange-700 pl-2">
                    Thalibah yang keluar tanpa udzur syar'i akan masuk <strong>blacklist permanen</strong> dan tidak dapat mendaftar kembali di MTI.
                  </p>
                </div>

                <div className="bg-green-50 p-3 rounded-lg mt-4">
                  <p className="text-xs text-green-800">
                    <strong>Catatan:</strong> Pendaftaran ini merupakan akad (perjanjian) yang akan dipertanggungjawabkan di hadapan Allah Ta'ala.
                  </p>
                </div>
              </div>

              {/* Full Terms Link */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  Untuk membaca syarat dan ketentuan lengkap:
                </p>
                <a
                  href="/syarat-ketentuan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold underline text-sm"
                >
                  Buka Syarat dan Ketentuan Lengkap (Tab Baru) →
                </a>
              </div>

              {/* Agreement Checkbox */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    <strong>Bismillah,</strong> saya menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku di Markaz Tikrar Indonesia. Saya berkomitmen untuk menjalankan seluruh kewajiban dengan penuh tanggung jawab lillahi ta'ala.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4 border-t">
              <button
                onClick={() => {
                  setShowTermsModal(false);
                  setAgreedToTerms(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleProceedToRegistration}
                disabled={!agreedToTerms}
                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                  agreedToTerms
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {agreedToTerms ? 'Lanjutkan Pendaftaran' : 'Centang Persetujuan Dulu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {pendaftaranTypes.map((type) => {
          const Icon = type.icon;
          const isExpanded = selectedType === type.id;

          return (
            <div
              key={type.id}
              className="bg-white rounded-xl shadow-lg border-2 border-amber-200 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-4 sm:p-6 border-b border-amber-200 relative overflow-hidden">
                {/* Decorative crown sparkles */}
                <div className="absolute top-2 right-2 opacity-20">
                  <Crown className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400" />
                </div>

                <div className="flex items-start gap-3 sm:gap-4 relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg shadow-amber-500/50">
                      <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-white animate-pulse" />
                    </div>
                    {/* Sparkle effect */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 leading-tight">{type.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{type.description}</p>
                  </div>
                </div>

                {/* Quick Info */}
                {type.batchInfo && (
                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                        <Calendar className="w-4 h-4 mr-2 text-amber-600 flex-shrink-0" />
                        <span className="truncate">{type.batchInfo.period}</span>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(type.status)}
                      </div>
                    </div>
                    <div className="flex items-center text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                      <Users className="w-4 h-4 mr-2 text-amber-600 flex-shrink-0" />
                      <span>{type.batchInfo.registered}/{type.batchInfo.capacity} peserta</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Price and Duration */}
                  {type.price && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 sm:p-4 border border-amber-200">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Biaya Program</p>
                        <p className="font-bold text-base sm:text-lg text-gray-900">{type.price}</p>
                      </div>
                      {type.duration && (
                        <div className="flex-1 sm:text-right">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">Durasi</p>
                          <p className="font-medium text-base sm:text-lg text-gray-900">{type.duration}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {type.batchInfo && type.batchInfo.capacity > 0 && (
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                        <span>Kuota Tersedia</span>
                        <span className="font-semibold text-amber-600">{type.batchInfo.capacity - type.batchInfo.registered} lagi</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all duration-500 shadow-md"
                          style={{
                            width: `${(type.batchInfo.registered / type.batchInfo.capacity) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => handleRegistrationClick(type)}
                    disabled={type.status !== 'open'}
                    className={`w-full flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg ${
                      type.status === 'open'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transform hover:-translate-y-0.5'
                        : type.status === 'upcoming'
                        ? 'bg-amber-100 text-amber-900 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {type.status === 'open' && (
                      <>
                        Daftar Sekarang
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                    {type.status === 'upcoming' && 'Pendaftaran Akan Dibuka'}
                    {type.status === 'closed' && 'Pendaftaran Ditutup'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {pendaftaranTypes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Program Tersedia</h3>
          <p className="text-gray-600">Program pembelajaran akan segera dibuka. Silakan cembali lagi nanti.</p>
        </div>
      )}
      </div>
    </AuthenticatedLayout>
  );
}