'use client';

import { useState, useEffect } from 'react';
import { Halaqah, Program, Batch, HalaqahStatus, User } from '@/types/database';

interface HalaqahWithDetails extends Halaqah {
  program: Program & { batch: Batch };
  mentors: (any & { user: User })[];
  students: (any & { user: User })[];
}

export default function HalaqahPage() {
  const [halaqah, setHalaqah] = useState<HalaqahWithDetails[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<HalaqahStatus[]>(['active']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [showAssignMentor, setShowAssignMentor] = useState(false);
  const [selectedHalaqah, setSelectedHalaqah] = useState<string>('');
  const [formData, setFormData] = useState({
    program_id: '',
    name: '',
    description: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    location: '',
    max_students: '',
    status: 'active' as HalaqahStatus
  });
  const [mentorAssignData, setMentorAssignData] = useState({
    mentor_id: '',
    role: 'ustadzah' as 'ustadzah' | 'musyrifah',
    is_primary: false
  });

  const fetchHalaqah = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter.length > 0) {
        params.append('status', statusFilter.join(','));
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedProgram) {
        params.append('program_id', selectedProgram);
      }

      const response = await fetch(`/api/halaqah?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch halaqah');
      }

      setHalaqah(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/program?status=open,ongoing');
      const data = await response.json();

      if (response.ok) {
        setPrograms(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?role=musyrifah,muallimah');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchHalaqah();
    fetchPrograms();
    fetchUsers();
  }, [statusFilter, searchTerm, selectedProgram]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/halaqah', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          day_of_week: formData.day_of_week ? parseInt(formData.day_of_week) : null,
          max_students: formData.max_students ? parseInt(formData.max_students) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create halaqah');
      }

      setShowForm(false);
      setFormData({
        program_id: '',
        name: '',
        description: '',
        day_of_week: '',
        start_time: '',
        end_time: '',
        location: '',
        max_students: '',
        status: 'active'
      });
      fetchHalaqah();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create halaqah');
    }
  };

  const handleAssignMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/halaqah/${selectedHalaqah}/mentors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mentorAssignData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign mentor');
      }

      setShowAssignMentor(false);
      setMentorAssignData({
        mentor_id: '',
        role: 'ustadzah',
        is_primary: false
      });
      setSelectedHalaqah('');
      fetchHalaqah();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign mentor');
    }
  };

  const handleStatusToggle = (status: HalaqahStatus) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const getStatusColor = (status: HalaqahStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDayName = (day: number) => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
    return days[day - 1] || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Kelola Halaqah</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Batal' : 'Tambah Halaqah'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Buat Halaqah Baru</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program
              </label>
              <select
                value={formData.program_id}
                onChange={(e) => setFormData(prev => ({ ...prev, program_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Pilih Program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Halaqah
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hari
              </label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Hari</option>
                <option value="1">Senin</option>
                <option value="2">Selasa</option>
                <option value="3">Rabu</option>
                <option value="4">Kamis</option>
                <option value="5">Jumat</option>
                <option value="6">Sabtu</option>
                <option value="7">Ahad</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waktu Mulai
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waktu Selesai
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as HalaqahStatus }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Non-aktif</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maksimal Thalibah
              </label>
              <input
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData(prev => ({ ...prev, max_students: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Simpan Halaqah
              </button>
            </div>
          </form>
        </div>
      )}

      {showAssignMentor && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Assign Mentor ke Halaqah</h2>
          <form onSubmit={handleAssignMentor} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mentor
              </label>
              <select
                value={mentorAssignData.mentor_id}
                onChange={(e) => setMentorAssignData(prev => ({ ...prev, mentor_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Pilih Mentor</option>
                {users.filter(user => (user.roles?.includes('muallimah') || (user as any)?.role === 'muallimah') || (user.roles?.includes('musyrifah') || (user as any)?.role === 'musyrifah')).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.roles?.[0] || (user as any)?.role || 'User'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={mentorAssignData.role}
                onChange={(e) => setMentorAssignData(prev => ({ ...prev, role: e.target.value as 'ustadzah' | 'musyrifah' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ustadzah">Ustadzah</option>
                <option value="musyrifah">Musyrifah</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={mentorAssignData.is_primary}
                  onChange={(e) => setMentorAssignData(prev => ({ ...prev, is_primary: e.target.checked }))}
                  className="mr-2"
                />
                Mentor Utama
              </label>
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-2"
              >
                Assign Mentor
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAssignMentor(false);
                  setSelectedHalaqah('');
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari halaqah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['active', 'inactive', 'suspended'] as HalaqahStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusToggle(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter.includes(status)
                    ? getStatusColor(status)
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Halaqah Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {halaqah.map((h) => (
          <div key={h.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{h.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(h.status)}`}>
                  {h.status}
                </span>
              </div>

              <div className="mb-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                  {h.program.name}
                </span>
                {h.day_of_week && (
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {getDayName(h.day_of_week)}
                  </span>
                )}
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">{h.description}</p>

              <div className="space-y-2 text-sm mb-4">
                {h.start_time && h.end_time && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Waktu:</span>
                    <span className="font-medium">{h.start_time} - {h.end_time}</span>
                  </div>
                )}
                {h.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lokasi:</span>
                    <span className="font-medium">{h.location}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Thalibah:</span>
                  <span className="font-medium">{h.students?.length || 0} / {h.max_students || '∞'}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Mentors:</div>
                <div className="flex flex-wrap gap-1">
                  {h.mentors?.slice(0, 2).map((mentor) => (
                    <span key={mentor.id} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      {mentor.user.full_name}
                    </span>
                  ))}
                  {h.mentors?.length > 2 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      +{h.mentors.length - 2}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                  Lihat Detail
                </button>
                <button
                  onClick={() => {
                    setSelectedHalaqah(h.id);
                    setShowAssignMentor(true);
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  Assign Mentor
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {halaqah.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">Tidak ada halaqah ditemukan</div>
          <p className="text-gray-500 mt-2">Coba ubah filter atau tambah halaqah baru</p>
        </div>
      )}
    </div>
  );
}