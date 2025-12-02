'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerWithEmail, createRegistrationDocument } from '@/lib/auth';

const provinsiList = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan',
  'Bengkulu', 'Lampung', 'Kepulauan Bangka Belitung', 'Kepulauan Riau',
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
  'Banten', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur',
  'Kalimantan Utara', 'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat',
  'Papua Tengah', 'Papua Selatan', 'Maluku Utara', 'Maluku Barat', 'NTT', 'NTB'
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    provinsi: '',
    kota: '',
    alamat: '',
    whatsapp: '',
    telegram: '',
    telegramSame: 'tidak',
    zonaWaktu: 'WIB (UTC+7)',
    zonaWaktuAlternatif: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama lengkap wajib diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.password) {
      newErrors.password = 'Kata sandi wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok';
    }

    if (!formData.provinsi) {
      newErrors.provinsi = 'Provinsi wajib dipilih';
    }

    if (!formData.kota.trim()) {
      newErrors.kota = 'Kota wajib diisi';
    }

    if (!formData.alamat.trim()) {
      newErrors.alamat = 'Alamat lengkap wajib diisi';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'Nomor WhatsApp wajib diisi';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Anda harus menyetujui syarat dan ketentuan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: any) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as any).checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Rate limiting: prevent multiple submissions within 5 seconds
    const now = Date.now();
    if (now - lastSubmitTime < 5000) {
      setErrors({ general: 'Mohon tunggu 5 detik sebelum mencoba lagi.' });
      return;
    }
    setLastSubmitTime(now);

    setIsSubmitting(true);
    setErrors({});

    try {
      // Siapkan data personal info
      const personalInfo = {
        namaLengkap: formData.nama,
        namaPanggilan: formData.nama,
        tanggalLahir: '',
        alamat: formData.alamat,
        phoneNumber: formData.whatsapp,
        nomorWhatsApp: formData.whatsapp,
        tempatLahir: formData.kota,
        pekerjaan: 'Belum ada',
        namaWali: 'Belum ada',
        nomorWali: 'Belum ada',
        hubunganWali: 'Belum ada',
        alasanDaftar: 'Mengikuti program MTI',
      };

      // Buat user dengan data lengkap di Supabase Auth
      const user = await registerWithEmail(
        formData.email,
        formData.password,
        formData.nama
      );

      // Create registration document with additional user data
      if (user?.id) {
        await createRegistrationDocument(user.id, personalInfo);
      }

      // Redirect ke halaman sukses atau dashboard
      if (user) {
        // Redirect ke login page dengan pesan sukses
        router.push('/login?message=registration-success');
      }
    } catch (err: any) {
      setSubmitStatus('error');
      let errorMessage = 'Registrasi gagal. Silakan coba lagi.';

      // Handle specific Supabase errors
      if (err.message?.includes('429') || err.message?.includes('Too Many Requests')) {
        errorMessage = 'Terlalu banyak percobaan. Mohon tunggu beberapa menit sebelum mencoba lagi.';
      } else if (err.message?.includes('User already registered')) {
        errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.';
      } else if (err.message?.includes('Password should be')) {
        errorMessage = 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
      } else if (err.message?.includes('Invalid email')) {
        errorMessage = 'Format email tidak valid.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
      // Add a delay before allowing another attempt
      setTimeout(() => {
        setLastSubmitTime(0);
      }, 30000); // Reset after 30 seconds
    }
  };

  return (
    <main className="bg-[#F9F9F9] min-h-screen flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8">
          {/* Logo dan Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center">
              <img
                src="/mti-logo.jpg"
                alt="Markaz Tikrar Indonesia"
                className="w-20 h-20 object-contain mx-auto mb-4"
              />
            </div>
            <h1 className="text-3xl font-bold text-green-900 mb-2">
              Markaz Tikrar Indonesia
            </h1>
            <p className="text-gray-600 mb-6">
              Bergabung dengan MTI untuk belajar Al-Quran dengan metode Tikrar
            </p>
          </div>

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <p className="text-sm font-medium">
                {errors.general || 'Registrasi gagal. Silakan coba lagi.'}
              </p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="nama"
                name="nama"
                value={formData.nama}
                onChange={handleInputChange}
                placeholder="Masukkan nama lengkap"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.nama ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.nama && (
                <p className="mt-1 text-sm text-red-600">{errors.nama}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="nama@email.com"
                autoComplete="email"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Kata Sandi
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Kata Sandi
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Masukkan ulang kata sandi"
                autoComplete="new-password"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Provinsi */}
            <div>
              <label htmlFor="provinsi" className="block text-sm font-medium text-gray-700 mb-2">
                Provinsi
              </label>
              <select
                id="provinsi"
                name="provinsi"
                value={formData.provinsi}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.provinsi ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Pilih provinsi</option>
                {provinsiList.map((provinsi, index) => (
                  <option key={`provinsi-${index}`} value={provinsi}>
                    {provinsi}
                  </option>
                ))}
              </select>
              {errors.provinsi && (
                <p className="mt-1 text-sm text-red-600">{errors.provinsi}</p>
              )}
            </div>

            {/* Kota */}
            <div>
              <label htmlFor="kota" className="block text-sm font-medium text-gray-700 mb-2">
                Kota
              </label>
              <input
                type="text"
                id="kota"
                name="kota"
                value={formData.kota}
                onChange={handleInputChange}
                placeholder="Masukkan kota"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.kota ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.kota && (
                <p className="mt-1 text-sm text-red-600">{errors.kota}</p>
              )}
            </div>

            {/* Alamat */}
            <div>
              <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Lengkap
              </label>
              <textarea
                id="alamat"
                name="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                placeholder="Masukkan alamat lengkap"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.alamat ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.alamat && (
                <p className="mt-1 text-sm text-red-600">{errors.alamat}</p>
              )}
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor WhatsApp
              </label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                placeholder="08xxxxxxxxxx"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.whatsapp ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.whatsapp && (
                <p className="mt-1 text-sm text-red-600">{errors.whatsapp}</p>
              )}
            </div>

            {/* Telegram */}
            <div>
              <label htmlFor="telegram" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telegram (Opsional)
              </label>
              <input
                type="tel"
                id="telegram"
                name="telegram"
                value={formData.telegram}
                onChange={handleInputChange}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300"
                disabled={isSubmitting}
              />
            </div>

            {/* Zona Waktu */}
            <div>
              <label htmlFor="zonaWaktu" className="block text-sm font-medium text-gray-700 mb-2">
                Zona Waktu
              </label>
              <select
                id="zonaWaktu"
                name="zonaWaktu"
                value={formData.zonaWaktu}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300"
                disabled={isSubmitting}
              >
                <option value="WIB (UTC+7)">WIB (UTC+7)</option>
                <option value="WITA (UTC+8)">WITA (UTC+8)</option>
                <option value="WIT (UTC+9)">WIT (UTC+9)</option>
                <option value="WITA (UTC+8)">WITA (UTC+8)</option>
              </select>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleInputChange}
                className="w-4 h-4 text-green-600 focus:ring-green-500 focus:border-green-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label htmlFor="agreeTerms" className="ml-2 text-sm text-gray-700">
                Saya menyetujui{' '}
                <Link href="/syarat-ketentuan" className="text-green-600 hover:text-green-700 underline">
                  syarat dan ketentuan
                </Link>
                {' '}
                yang berlaku
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="mt-1 text-sm text-red-600">{errors.agreeTerms}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Mendaftar...
                </div>
              ) : (
                'Daftar Sekarang'
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Sudah menyelesaikan pendaftaran?{' '}
            <Link href="/login" className="font-medium text-green-600 hover:text-green-700">
              Masuk disini
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}