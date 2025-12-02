'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
  Info,
  Star,
  TrendingUp,
  User
} from 'lucide-react';

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
}

export default function PendaftaranPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const pendaftaranTypes: PendaftaranType[] = [
    {
      id: 'thalibah-tahfidz',
      title: 'Thalibah Tahfidz MTI Batch 2',
      description: 'Program hafalan Al-Quran gratis khusus akhawat dengan metode tikrar 40 kali',
      icon: FileText,
      color: 'green',
      benefits: [
        'Program GRATIS khusus akhawat',
        'Metode Tikrar 40 kali yang terbukti efektif',
        'Target hafalan 1/2 juz dalam 13 pekan',
        'Pembimbingan personal dengan pasangan setoran',
        'Program intensif namun fleksibel untuk ibu rumah tangga',
        'Komunitas penghafal Qur\'an yang supportif'
      ],
      requirements: [
        'Muslimah usia minimal 12 tahun',
        'Bisa membaca Al-Quran dengan lancar',
        'Memiliki aplikasi Telegram untuk komunikasi',
        'Menyimpan nomor kontak admin (081313650842)',
        'Sudah mencoba simulasi tikrar (baca Surah An-Naba ayat 1-11 sebanyak 40 kali)',
        'Memiliki izin dari suami/orang tua/wali',
        'Komitmen waktu minimal 2 jam per hari',
        'Siap mengikuti program 13 pekan (5 Januari - 18 April 2025)'
      ],
      status: 'open',
      batchInfo: {
        batch: 'Batch 2 Tahun 2025',
        period: '5 Januari - 18 April 2025',
        deadline: '31 Desember 2024',
        capacity: 100,
        registered: 45
      },
      price: 'GRATIS',
      duration: '13 pekan'
    },
    {
      id: 'kelas-umum',
      title: 'Kelas Umum MTI',
      description: 'Kelas pengajian umum terbuka untuk berbagai kalangan',
      icon: Users,
      color: 'blue',
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
      status: 'open',
      batchInfo: {
        batch: 'Batch 5 Tahun 2025',
        period: 'Februari - Mei 2025',
        deadline: '25 Januari 2025',
        capacity: 100,
        registered: 67
      },
      price: 'Rp 250.000/bulan',
      duration: '4 bulan'
    },
    {
      id: 'musyrifah',
      title: 'Musyrifah MTI',
      description: 'Program pembinaan dan pendampingan untuk menjadi musyrifah professional',
      icon: UserCheck,
      color: 'purple',
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
      status: 'upcoming',
      batchInfo: {
        batch: 'Batch 2 Tahun 2025',
        period: 'April - Juni 2025',
        deadline: '20 Maret 2025',
        capacity: 25,
        registered: 0
      },
      price: 'Rp 3.500.000/program',
      duration: '3 bulan'
    },
    {
      id: 'muallimah',
      title: 'Muallimah MTI',
      description: 'Program pendidikan guru Al-Quran profesional dengan metodologi unggulan',
      icon: ShieldCheck,
      color: 'red',
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
      status: 'closed',
      batchInfo: {
        batch: 'Batch 1 Tahun 2024',
        period: 'September - Desember 2024',
        deadline: '31 Agustus 2024',
        capacity: 30,
        registered: 30
      },
      price: 'Rp 5.000.000/program',
      duration: '6 bulan'
    },
    {
      id: 'kelas-khusus-mti',
      title: 'Kelas Khusus MTI',
      description: 'Program eksklusif dengan kurikulum intensif dan pembimbingan personal untuk calon penghafal profesional',
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
        'Siap mengikuti program boarding 15 bulan'
      ],
      status: 'open',
      batchInfo: {
        batch: 'Batch Elite 2025',
        period: 'Maret 2025 - Mei 2026',
        deadline: '28 Februari 2025',
        capacity: 15,
        registered: 8
      },
      price: 'Rp 7.500.000/bulan',
      duration: '15 bulan'
    },
    {
      id: 'pengurus-mti',
      title: 'Pengurus MTI',
      description: 'Program pembinaan calon pengurus dan manajemen Markaz Tikrar Indonesia dengan sistem kepemimpinan Islam',
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
      status: 'upcoming',
      batchInfo: {
        batch: 'Batch Leadership 2025',
        period: 'Juni 2025 - Desember 2025',
        deadline: '15 Mei 2025',
        capacity: 10,
        registered: 3
      },
      price: 'Rp 12.000.000/program',
      duration: '7 bulan'
    }
  ];

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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-900">
            <Clock className="w-3 h-3 mr-1" />
            Akan Dibuka
          </span>
        );
    }
  };

  const handleRegistrationClick = (typeId: string) => {
    const type = pendaftaranTypes.find(t => t.id === typeId);
    if (type?.status === 'open') {
      // Special routing for thalibah batch 2
      if (typeId === 'thalibah-tahfidz') {
        router.push('/pendaftaran/tikrar-tahfidz');
      } else {
        router.push(`/pendaftaran/${typeId}`);
      }
    }
  };

  if (!user) {
    return null; // User will be redirected by useEffect
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-900 mb-2 flex items-center">
              <FileText className="w-8 h-8 mr-3" />
              Pendaftaran Program MTI
            </h1>
            <p className="text-gray-600">
              Pilih program yang sesuai dengan kebutuhan dan minat <em>Antunna</em>. Setiap batch dibuka secara berkala.
            </p>
          </div>
          <div className="text-right">
            <div className="bg-green-50 rounded-lg p-4 border border-green-900/20">
              <p className="text-sm text-green-900 font-medium">Informasi Penting</p>
              <p className="text-xs text-gray-600 mt-1">Periode Batch 2025 sudah dibuka</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-green-900/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-900" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Pendaftar</p>
          <p className="text-2xl font-bold text-green-900">847</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-900/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-900" />
            </div>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Program Aktif</p>
          <p className="text-2xl font-bold text-blue-900">6</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-900/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-900" />
            </div>
            <Info className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Batch Sedang Berjalan</p>
          <p className="text-2xl font-bold text-purple-900">2</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-900/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-yellow-900" />
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Alumni Sukses</p>
          <p className="text-2xl font-bold text-yellow-900">1,234</p>
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
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-200">
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
                    onClick={() => handleRegistrationClick(type.id)}
                    disabled={type.status !== 'open'}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      type.status === 'open'
                        ? 'bg-green-900 text-white hover:bg-green-800'
                        : type.status === 'upcoming'
                        ? 'bg-yellow-100 text-yellow-900 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {type.status === 'open' && (
                      <>
                        Daftar Sekarang Gratis
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
                          <Star className="w-4 h-4 mr-2 text-yellow-500" />
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
                          <FileText className="w-4 h-4 mr-2 text-blue-500" />
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
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center text-yellow-800">
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

      {/* Additional Information */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-green-900/20 p-6">
        <h3 className="text-lg font-bold text-green-900 mb-4">Informasi Tambahan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-green-900" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Jadwal Reguler</h4>
            <p className="text-sm text-gray-600">
              Setiap pendaftaran dibuka per batch. Jangan lewatkan periode pendaftaran berikutnya.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Info className="w-6 h-6 text-blue-900" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Bantuan Pendaftaran</h4>
            <p className="text-sm text-gray-600">
              Tim kami siap membantu proses pendaftaran <em>Antunna</em> melalui WhatsApp atau email.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-purple-900" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Pendaftaran Aman</h4>
            <p className="text-sm text-gray-600">
              Proses pendaftaran terjamin keamanannya dan privasi data terlindungi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}