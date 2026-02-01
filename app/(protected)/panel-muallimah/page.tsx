'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMuallimahRegistration, useMuallimahHalaqah } from '@/lib/hooks/useMuallimahData';
import { createHalaqah, deleteHalaqah, updateHalaqah } from './actions';
import toast, { Toaster } from 'react-hot-toast';
import {
  User,
  BookOpen,
  Users,
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

type TabType = 'registration' | 'halaqah';

interface MuallimahRegistration {
  id: string;
  user_id: string;
  batch_id: string;
  full_name: string;
  birth_date: string;
  birth_place: string;
  address: string;
  whatsapp: string;
  email: string;
  education: string;
  occupation: string;
  memorization_level: string;
  memorized_juz?: string;
  preferred_juz: string;
  teaching_experience: string;
  teaching_years?: string;
  teaching_institutions?: string;
  preferred_schedule: string;
  backup_schedule: string;
  timezone: string;
  motivation?: string;
  special_skills?: string;
  health_condition?: string;
  status: 'pending' | 'review' | 'approved' | 'rejected' | 'waitlist';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  tajweed_institution?: string;
  quran_institution?: string;
  teaching_communities?: string;
  memorized_tajweed_matan?: string;
  studied_matan_exegesis?: string;
  examined_juz?: string;
  certified_juz?: string;
  paid_class_interest?: string;
  understands_commitment: boolean;
  age?: number;
  class_type?: 'tashih_ujian' | 'tashih_only' | 'ujian_only';
  preferred_max_thalibah?: number;
  batch?: {
    id: string;
    name: string;
    status: string;
  };
}

interface HalaqahStudent {
  id: string;
  thalibah_id: string;
  status: string;
  assigned_at: string;
  thalibah: {
    id: string;
    full_name?: string;
    nama_kunyah?: string;
    whatsapp?: string;
    email?: string;
  };
  progress: {
    jurnal_blocks_completed: number;
    tashih_blocks_completed: number;
    total_blocks: number;
    jurnal_percentage: number;
    tashih_percentage: number;
  };
}

interface Halaqah {
  id: string;
  program_id?: string;
  name: string;
  description?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_students: number;
  status: string;
  zoom_link?: string;
  muallimah_id: string;
  preferred_juz?: string;
  waitlist_max: number;
  students: HalaqahStudent[];
  program?: {
    id: string;
    name: string;
    class_type?: string;
  };
}

interface CreateHalaqahFormData {
  name: string;
  description?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_students?: number;
  zoom_link?: string;
  preferred_juz?: string;
  waitlist_max?: number;
}

const DAY_NAMES = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export default function PanelMuallimahPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('muallimahActiveTab');
      return (savedTab as TabType) || 'registration';
    }
    return 'registration';
  });

  const isMuallimah: boolean = !authLoading && user?.roles?.includes('muallimah') === true;

  // Data hooks
  const { registration, isLoading: registrationLoading, mutate: mutateRegistration } = useMuallimahRegistration(!authLoading && isMuallimah);
  const { halaqahList, isLoading: halaqahLoading, mutate: mutateHalaqah } = useMuallimahHalaqah(!authLoading && isMuallimah);

  // Modal states
  const [showCreateHalaqahModal, setShowCreateHalaqahModal] = useState(false);
  const [showEditHalaqahModal, setShowEditHalaqahModal] = useState(false);
  const [selectedHalaqah, setSelectedHalaqah] = useState<Halaqah | null>(null);
  const [halaqahFormData, setHalaqahFormData] = useState<CreateHalaqahFormData>({
    name: '',
    description: '',
    day_of_week: undefined,
    start_time: '',
    end_time: '',
    location: '',
    max_students: 20,
    zoom_link: '',
    preferred_juz: '',
    waitlist_max: 5,
  });

  // Save activeTab to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('muallimahActiveTab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    console.log('=== Muallimah Page Auth Check ===');
    console.log('Auth loading:', authLoading);
    console.log('User:', user);
    console.log('User roles:', user?.roles);
    console.log('Is Muallimah:', isMuallimah);

    if (!authLoading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
      } else if (!user.roles?.includes('muallimah')) {
        console.log('User is not muallimah, roles:', user.roles);
        router.push('/dashboard');
      } else {
        console.log('Muallimah access granted');
        setLoading(false);
      }
    }
  }, [user, authLoading, router, isMuallimah]);

  const handleCreateHalaqah = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await createHalaqah(halaqahFormData);

      if (result.success) {
        toast.success('Halaqah berhasil dibuat');
        setShowCreateHalaqahModal(false);
        setHalaqahFormData({
          name: '',
          description: '',
          day_of_week: undefined,
          start_time: '',
          end_time: '',
          location: '',
          max_students: 20,
          zoom_link: '',
          preferred_juz: '',
          waitlist_max: 5,
        });
        mutateHalaqah();
      } else {
        toast.error(result.error || 'Gagal membuat halaqah');
      }
    } catch (error) {
      console.error('Error creating halaqah:', error);
      toast.error('Terjadi kesalahan saat membuat halaqah');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditHalaqah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHalaqah) return;

    setSubmitting(true);

    try {
      const result = await updateHalaqah(selectedHalaqah.id, halaqahFormData);

      if (result.success) {
        toast.success('Halaqah berhasil diperbarui');
        setShowEditHalaqahModal(false);
        setSelectedHalaqah(null);
        setHalaqahFormData({
          name: '',
          description: '',
          day_of_week: undefined,
          start_time: '',
          end_time: '',
          location: '',
          max_students: 20,
          zoom_link: '',
          preferred_juz: '',
          waitlist_max: 5,
        });
        mutateHalaqah();
      } else {
        toast.error(result.error || 'Gagal memperbarui halaqah');
      }
    } catch (error) {
      console.error('Error updating halaqah:', error);
      toast.error('Terjadi kesalahan saat memperbarui halaqah');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHalaqah = async (halaqahId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus halaqah ini?')) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await deleteHalaqah(halaqahId);

      if (result.success) {
        toast.success('Halaqah berhasil dihapus');
        mutateHalaqah();
      } else {
        toast.error(result.error || 'Gagal menghapus halaqah');
      }
    } catch (error) {
      console.error('Error deleting halaqah:', error);
      toast.error('Terjadi kesalahan saat menghapus halaqah');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (halaqah: Halaqah) => {
    setSelectedHalaqah(halaqah);
    setHalaqahFormData({
      name: halaqah.name,
      description: halaqah.description || '',
      day_of_week: halaqah.day_of_week,
      start_time: halaqah.start_time || '',
      end_time: halaqah.end_time || '',
      location: halaqah.location || '',
      max_students: halaqah.max_students,
      zoom_link: halaqah.zoom_link || '',
      preferred_juz: halaqah.preferred_juz || '',
      waitlist_max: halaqah.waitlist_max,
    });
    setShowEditHalaqahModal(true);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel Muallimah</h1>
              <p className="mt-1 text-sm text-gray-500">
                Selamat datang, {user?.full_name || user?.nama_kunyah || user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('registration')}
              className={`${
                activeTab === 'registration'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <User className="w-4 h-4" />
              Pendaftaran Saya
            </button>
            <button
              onClick={() => setActiveTab('halaqah')}
              className={`${
                activeTab === 'halaqah'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <BookOpen className="w-4 h-4" />
              Halaqah Saya
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'registration' && (
          <RegistrationTab registration={registration} isLoading={registrationLoading} />
        )}

        {activeTab === 'halaqah' && (
          <HalaqahTab
            halaqahList={halaqahList}
            isLoading={halaqahLoading}
            onCreateHalaqah={() => setShowCreateHalaqahModal(true)}
            onEditHalaqah={openEditModal}
            onDeleteHalaqah={handleDeleteHalaqah}
            submitting={submitting}
          />
        )}
      </div>

      {/* Create Halaqah Modal */}
      {showCreateHalaqahModal && (
        <HalaqahModal
          title="Buat Halaqah Baru"
          formData={halaqahFormData}
          onChange={setHalaqahFormData}
          onSubmit={handleCreateHalaqah}
          onCancel={() => {
            setShowCreateHalaqahModal(false);
            setHalaqahFormData({
              name: '',
              description: '',
              day_of_week: undefined,
              start_time: '',
              end_time: '',
              location: '',
              max_students: 20,
              zoom_link: '',
              preferred_juz: '',
              waitlist_max: 5,
            });
          }}
          submitting={submitting}
        />
      )}

      {/* Edit Halaqah Modal */}
      {showEditHalaqahModal && selectedHalaqah && (
        <HalaqahModal
          title="Edit Halaqah"
          formData={halaqahFormData}
          onChange={setHalaqahFormData}
          onSubmit={handleEditHalaqah}
          onCancel={() => {
            setShowEditHalaqahModal(false);
            setSelectedHalaqah(null);
            setHalaqahFormData({
              name: '',
              description: '',
              day_of_week: undefined,
              start_time: '',
              end_time: '',
              location: '',
              max_students: 20,
              zoom_link: '',
              preferred_juz: '',
              waitlist_max: 5,
            });
          }}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// Registration Tab Component
function RegistrationTab({ registration, isLoading }: { registration: MuallimahRegistration | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Pendaftaran</h3>
        <p className="text-gray-500">Anda belum mendaftar sebagai muallimah.</p>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    waitlist: 'bg-gray-100 text-gray-800',
  };

  const statusLabels = {
    pending: 'Menunggu',
    review: 'Dalam Review',
    approved: 'Diterima',
    rejected: 'Ditolak',
    waitlist: 'Daftar Tunggu',
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Status Pendaftaran</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[registration.status]}`}>
            {statusLabels[registration.status]}
          </span>
        </div>

        {registration.batch && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">Batch</p>
            <p className="text-lg font-semibold text-gray-900">{registration.batch.name}</p>
          </div>
        )}

        {registration.review_notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Catatan Reviewer:</p>
            <p className="text-gray-900">{registration.review_notes}</p>
          </div>
        )}
      </div>

      {/* Registration Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">Detail Pendaftaran</h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <DetailItem label="Nama Lengkap" value={registration.full_name} />
            <DetailItem label="Email" value={registration.email} />
            <DetailItem label="WhatsApp" value={registration.whatsapp} />
            <DetailItem label="Pendidikan" value={registration.education} />
            <DetailItem label="Pekerjaan" value={registration.occupation} />
            <DetailItem label="Tingkat Hafalan" value={registration.memorization_level} />
            {registration.memorized_juz && (
              <DetailItem label="Juz Yang Dihafal" value={registration.memorized_juz} />
            )}
            <DetailItem label="Juz Pilihan" value={registration.preferred_juz} />
            <DetailItem label="Pengalaman Mengajar" value={registration.teaching_experience} />
            {registration.teaching_years && (
              <DetailItem label="Lama Mengajar (tahun)" value={registration.teaching_years} />
            )}
            {registration.teaching_institutions && (
              <DetailItem label="Institusi Mengajar" value={registration.teaching_institutions} />
            )}
            <DetailItem label="Jadwal Utama" value={registration.preferred_schedule} />
            <DetailItem label="Jadwal Cadangan" value={registration.backup_schedule} />
            <DetailItem label="Zona Waktu" value={registration.timezone} />
            {registration.motivation && (
              <DetailItem label="Motivasi" value={registration.motivation} className="sm:col-span-2" />
            )}
            {registration.special_skills && (
              <DetailItem label="Keahlian Khusus" value={registration.special_skills} />
            )}
            {registration.health_condition && (
              <DetailItem label="Kondisi Kesehatan" value={registration.health_condition} />
            )}
            {registration.class_type && (
              <DetailItem label="Tipe Kelas" value={registration.class_type.replace(/_/g, ' ')} />
            )}
            {registration.preferred_max_thalibah && (
              <DetailItem label="Maksimal Thalibah" value={registration.preferred_max_thalibah.toString()} />
            )}
            <DetailItem
              label="Tanggal Daftar"
              value={new Date(registration.submitted_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
          </dl>
        </div>
      </div>
    </div>
  );
}

// Halaqah Tab Component
function HalaqahTab({
  halaqahList,
  isLoading,
  onCreateHalaqah,
  onEditHalaqah,
  onDeleteHalaqah,
  submitting,
}: {
  halaqahList: Halaqah[];
  isLoading: boolean;
  onCreateHalaqah: () => void;
  onEditHalaqah: (halaqah: Halaqah) => void;
  onDeleteHalaqah: (halaqahId: string) => void;
  submitting: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Halaqah Saya</h2>
          <p className="text-sm text-gray-500 mt-1">{halaqahList.length} halaqah</p>
        </div>
        <button
          onClick={onCreateHalaqah}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Buat Halaqah
        </button>
      </div>

      {/* Halaqah List */}
      {halaqahList.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Halaqah</h3>
          <p className="text-gray-500 mb-6">Anda belum membuat halaqah. Buat halaqah pertama Anda sekarang.</p>
          <button
            onClick={onCreateHalaqah}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Halaqah
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {halaqahList.map((halaqah) => (
            <HalaqahCard
              key={halaqah.id}
              halaqah={halaqah}
              onEdit={() => onEditHalaqah(halaqah)}
              onDelete={() => onDeleteHalaqah(halaqah.id)}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Halaqah Card Component
function HalaqahCard({
  halaqah,
  onEdit,
  onDelete,
  submitting,
}: {
  halaqah: Halaqah;
  onEdit: () => void;
  onDelete: () => void;
  submitting: boolean;
}) {
  const [showStudents, setShowStudents] = useState(false);

  const activeStudents = halaqah.students.filter((s) => s.status === 'active');

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Halaqah Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">{halaqah.name}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              halaqah.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {halaqah.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>
          {halaqah.description && (
            <p className="text-sm text-gray-500 mt-1">{halaqah.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            disabled={submitting}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            disabled={submitting}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Halaqah Info */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {halaqah.day_of_week && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{DAY_NAMES[halaqah.day_of_week - 1]}</span>
            </div>
          )}
          {halaqah.start_time && halaqah.end_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{halaqah.start_time} - {halaqah.end_time}</span>
            </div>
          )}
          {halaqah.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{halaqah.location}</span>
            </div>
          )}
          {halaqah.zoom_link && (
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-gray-400" />
              <a
                href={halaqah.zoom_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Link Zoom
              </a>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
          <span>{activeStudents.length} / {halaqah.max_students} thalibah aktif</span>
          {halaqah.preferred_juz && (
            <span>• Juz: {halaqah.preferred_juz}</span>
          )}
        </div>
      </div>

      {/* Students Toggle */}
      <div className="px-6 py-3 border-t border-gray-200">
        <button
          onClick={() => setShowStudents(!showStudents)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <Users className="w-4 h-4" />
          {showStudents ? 'Sembunyikan' : 'Lihat'} Daftar Thalibah
        </button>
      </div>

      {/* Students List */}
      {showStudents && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {halaqah.students.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Belum ada thalibah dalam halaqah ini.</p>
          ) : (
            <div className="space-y-3">
              {halaqah.students.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Student Card Component
function StudentCard({ student }: { student: HalaqahStudent }) {
  const displayName = student.thalibah.nama_kunyah || student.thalibah.full_name || student.thalibah.email || 'Tanpa nama';

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{displayName}</h4>
          {student.thalibah.whatsapp && (
            <p className="text-sm text-gray-500">{student.thalibah.whatsapp}</p>
          )}
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {student.status === 'active' ? 'Aktif' : student.status}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">Jurnal</span>
            <span className="text-gray-900 font-medium">{student.progress.jurnal_blocks_completed} / {student.progress.total_blocks} blok</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${student.progress.jurnal_percentage}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">Tashih</span>
            <span className="text-gray-900 font-medium">{student.progress.tashih_blocks_completed} / {student.progress.total_blocks} blok</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${student.progress.tashih_percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Detail Item Component
function DetailItem({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string | number | undefined;
  className?: string;
}) {
  if (!value) return null;

  return (
    <div className={className}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

// Halaqah Modal Component
function HalaqahModal({
  title,
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting,
}: {
  title: string;
  formData: CreateHalaqahFormData;
  onChange: (data: CreateHalaqahFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={onSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nama Halaqah *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => onChange({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Deskripsi
                  </label>
                  <textarea
                    id="description"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => onChange({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700">
                      Hari
                    </label>
                    <select
                      id="day_of_week"
                      value={formData.day_of_week || ''}
                      onChange={(e) => onChange({ ...formData, day_of_week: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    >
                      <option value="">Pilih hari</option>
                      {DAY_NAMES.map((day, idx) => (
                        <option key={day} value={idx + 1}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="preferred_juz" className="block text-sm font-medium text-gray-700">
                      Juz Pilihan
                    </label>
                    <select
                      id="preferred_juz"
                      value={formData.preferred_juz || ''}
                      onChange={(e) => onChange({ ...formData, preferred_juz: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    >
                      <option value="">Pilih juz</option>
                      <option value="28A">28A</option>
                      <option value="28B">28B</option>
                      <option value="29A">29A</option>
                      <option value="29B">29B</option>
                      <option value="30A">30A</option>
                      <option value="30B">30B</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      value={formData.start_time}
                      onChange={(e) => onChange({ ...formData, start_time: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                      Jam Selesai
                    </label>
                    <input
                      type="time"
                      id="end_time"
                      value={formData.end_time}
                      onChange={(e) => onChange({ ...formData, end_time: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => onChange({ ...formData, location: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>

                <div>
                  <label htmlFor="zoom_link" className="block text-sm font-medium text-gray-700">
                    Link Zoom
                  </label>
                  <input
                    type="url"
                    id="zoom_link"
                    value={formData.zoom_link}
                    onChange={(e) => onChange({ ...formData, zoom_link: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="max_students" className="block text-sm font-medium text-gray-700">
                      Maksimal Thalibah
                    </label>
                    <input
                      type="number"
                      id="max_students"
                      min="1"
                      value={formData.max_students}
                      onChange={(e) => onChange({ ...formData, max_students: parseInt(e.target.value) || 20 })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="waitlist_max" className="block text-sm font-medium text-gray-700">
                      Maksimal Waitlist
                    </label>
                    <input
                      type="number"
                      id="waitlist_max"
                      min="0"
                      value={formData.waitlist_max}
                      onChange={(e) => onChange({ ...formData, waitlist_max: parseInt(e.target.value) || 5 })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
