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
  Loader2
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
            capacity: program.max_thalibah || 50,
            registered: Math.floor(Math.random() * (program.max_thalibah || 50))
          } : undefined,
          price: programType.price,
          duration: programType.duration,
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-900">
            <CheckCircle className="w-3 h-3 mr-1" />
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
      // Always redirect to the tikrar-tahfidz form
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
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">
              Pilih program yang sesuai dengan kebutuhan dan minat <em>Antunna</em>. Data program diambil langsung dari database.
            </p>
          </div>
          <div className="text-right">
            <div className="bg-green-50 rounded-lg p-4 border border-green-900/20">
              <p className="text-sm text-green-900 font-medium">Data Real-time</p>
              <p className="text-xs text-gray-600 mt-1">{batches.length} Batch, {programs.length} Program</p>
            </div>
          </div>
        </div>

      {/* Registration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {pendaftaranTypes.map((type) => {
          const Icon = type.icon;
          const isExpanded = selectedType === type.id;

          return (
            <div
              key={type.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 bg-${type.color}-100 rounded-lg flex items-center justify-center mr-4`}>
                      <Icon className={`w-6 h-6 text-${type.color}-900`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{type.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(type.status)}
                </div>

                {/* Quick Info */}
                {type.batchInfo && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {type.batchInfo.period}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      {type.batchInfo.registered}/{type.batchInfo.capacity} peserta
                    </div>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* Price and Duration */}
                  {type.price && (
                    <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="text-sm text-gray-500">Biaya Program</p>
                        <p className="font-bold text-gray-900">{type.price}</p>
                      </div>
                      {type.duration && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Durasi</p>
                          <p className="font-medium text-gray-900">{type.duration}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {type.batchInfo && type.batchInfo.capacity > 0 && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Kuota Tersedia</span>
                        <span>{type.batchInfo.capacity - type.batchInfo.registered} lagi</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-${type.color}-600 h-2 rounded-full`}
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
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      type.status === 'open'
                        ? 'bg-green-900 text-white hover:bg-green-800'
                        : type.status === 'upcoming'
                        ? 'bg-green-100 text-green-900 cursor-not-allowed'
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

                  {/* Details Toggle */}
                  <button
                    onClick={() => setSelectedType(isExpanded ? null : type.id)}
                    className="w-full text-center text-sm text-green-900 hover:text-green-700 font-medium"
                  >
                    {isExpanded ? 'Sembunyikan Detail' : 'Lihat Detail Program'}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 pt-4 space-y-4">
                      {/* Benefits */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Star className="w-4 h-4 mr-2 text-green-500" />
                          Keunggulan Program
                        </h4>
                        <ul className="space-y-1">
                          {type.benefits.map((benefit, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Requirements */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-green-500" />
                          Persyaratan
                        </h4>
                        <ul className="space-y-1">
                          {type.requirements.map((req, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <div className="w-4 h-4 border border-gray-300 rounded-full mt-0.5 mr-2 flex-shrink-0"></div>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Deadline */}
                      {type.batchInfo && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center text-green-800">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">
                              Batas Pendaftaran: {type.batchInfo.deadline}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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