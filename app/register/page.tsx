'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Crown, Heart, ArrowRight } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { validatePhoneNumberFormat } from "@/lib/utils/sanitize";
import { negaraList, provinsiList, zonaWaktuList } from "@/lib/data/registration-data";
import { countryCodes } from "@/lib/data/country-codes";

function RegisterPageContent() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    namaKunyah: '',
    namaLengkap: '',
    email: '',
    password: '',
    confirmPassword: '',
    negara: '',
    provinsi: '',
    kota: '',
    alamat: '',
    whatsapp: '',
    telegram: '',
    zonaWaktu: '',
    tanggalLahir: '',
    tempatLahir: '',
    jenisKelamin: '',
    pekerjaan: '',
    alasanDaftar: '',
    setujuSyarat: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [savedDataLoaded, setSavedDataLoaded] = useState(false);

  // Load saved form data from localStorage on mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('registerFormData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        setSavedDataLoaded(true);
      } catch (e) {
        console.error('Failed to load saved form data');
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  React.useEffect(() => {
    if (formData.namaLengkap || formData.email || formData.whatsapp) {
      localStorage.setItem('registerFormData', JSON.stringify(formData));
    }
  }, [formData]);

  const clearSavedData = () => {
    localStorage.removeItem('registerFormData');
    setFormData({
      namaKunyah: '',
      namaLengkap: '',
      email: '',
      password: '',
      confirmPassword: '',
      negara: '',
      provinsi: '',
      kota: '',
      alamat: '',
      whatsapp: '',
      telegram: '',
      zonaWaktu: '',
      tanggalLahir: '',
      tempatLahir: '',
      jenisKelamin: '',
      pekerjaan: '',
      alasanDaftar: '',
      setujuSyarat: false
    });
    setSavedDataLoaded(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.namaLengkap.trim()) {
      newErrors.namaLengkap = 'Nama lengkap harus diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email harus diisi';
    }

    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak cocok';
    }

    if (!formData.negara) {
      newErrors.negara = 'Negara harus dipilih';
    }

    if (formData.negara === 'Indonesia' && !formData.provinsi) {
      newErrors.provinsi = 'Provinsi harus dipilih';
    }

    if (!formData.kota.trim()) {
      newErrors.kota = 'Kota harus diisi';
    }

    if (!formData.alamat.trim()) {
      newErrors.alamat = 'Alamat harus diisi';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'WhatsApp harus diisi';
    } else if (!validatePhoneNumberFormat(formData.whatsapp, formData.negara)) {
      const countryCode = countryCodes.find(c => c.name === formData.negara)?.dialCode || '+XX';
      newErrors.whatsapp = `Format WhatsApp tidak valid. Format: ${formData.negara} ${countryCode} [nomor telepon]`;
    }

    if (!formData.telegram.trim()) {
      newErrors.telegram = 'Telegram harus diisi';
    } else if (!validatePhoneNumberFormat(formData.telegram, formData.negara)) {
      const countryCode = countryCodes.find(c => c.name === formData.negara)?.dialCode || '+XX';
      newErrors.telegram = `Format Telegram tidak valid. Format: ${formData.negara} ${countryCode} [nomor telepon]`;
    }

    if (!formData.zonaWaktu) {
      newErrors.zonaWaktu = 'Zona waktu harus dipilih';
    }

    if (!formData.tanggalLahir) {
      newErrors.tanggalLahir = 'Tanggal lahir harus diisi';
    }

    if (!formData.tempatLahir.trim()) {
      newErrors.tempatLahir = 'Tempat lahir harus diisi';
    }

    if (!formData.jenisKelamin) {
      newErrors.jenisKelamin = 'Jenis kelamin harus dipilih';
    }

    if (!formData.pekerjaan.trim()) {
      newErrors.pekerjaan = 'Pekerjaan harus diisi';
    }

    if (!formData.alasanDaftar.trim()) {
      newErrors.alasanDaftar = 'Alasan mendaftar harus diisi';
    } else if (formData.alasanDaftar.trim().length < 10) {
      newErrors.alasanDaftar = 'Alasan mendaftar minimal 10 karakter';
    }

    if (!formData.setujuSyarat) {
      newErrors.setujuSyarat = 'Ukhti harus menyetujui syarat dan ketentuan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Convert date to ISO datetime format for tanggal_lahir
      const tanggalLahirISO = formData.tanggalLahir
        ? new Date(formData.tanggalLahir + 'T00:00:00.000Z').toISOString()
        : null;

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nama_kunyah: formData.namaKunyah || null,
          email: formData.email,
          password: formData.password,
          full_name: formData.namaLengkap,
          negara: formData.negara,
          provinsi: formData.negara === 'Indonesia' ? formData.provinsi : null,
          kota: formData.kota,
          alamat: formData.alamat,
          whatsapp: formData.whatsapp,
          telegram: formData.telegram,
          zona_waktu: formData.zonaWaktu,
          tanggal_lahir: tanggalLahirISO,
          tempat_lahir: formData.tempatLahir,
          jenis_kelamin: formData.jenisKelamin,
          pekerjaan: formData.pekerjaan,
          alasan_daftar: formData.alasanDaftar,
          role: 'calon_thalibah'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear saved form data on success
        localStorage.removeItem('registerFormData');

        // Redirect immediately to login page
        window.location.href = '/login?message=registration_success';
      } else {
        // Extract error message from various possible formats
        const getErrorMessage = (response: any): string => {
          console.log('[DEBUG] getErrorMessage input:', response);
          console.log('[DEBUG] response type:', typeof response);
          console.log('[DEBUG] response.error:', response?.error);
          console.log('[DEBUG] response.error type:', typeof response?.error);

          if (typeof response === 'string') return response

          // Check for validation errors with issues array (highest priority for specific messages)
          if (response?.error?.details?.issues && Array.isArray(response.error.details.issues)) {
            const issues = response.error.details.issues;
            console.log('[DEBUG] Using validation issues:', issues);

            // Map field names to user-friendly labels
            const fieldLabels: Record<string, string> = {
              nama_kunyah: 'Nama Kunyah',
              email: 'Email',
              password: 'Password',
              full_name: 'Nama Lengkap',
              negara: 'Negara',
              provinsi: 'Provinsi',
              kota: 'Kota',
              alamat: 'Alamat',
              whatsapp: 'WhatsApp',
              telegram: 'Telegram',
              zona_waktu: 'Zona Waktu',
              tanggal_lahir: 'Tanggal Lahir',
              tempat_lahir: 'Tempat Lahir',
              jenis_kelamin: 'Jenis Kelamin',
              pekerjaan: 'Pekerjaan',
              alasan_daftar: 'Alasan Mendaftar',
              recaptcha: 'reCAPTCHA',
              general: 'Registrasi'
            };

            // Get all error messages
            const errorMessages = issues.map((issue: any) => {
              const fieldLabel = fieldLabels[issue.field] || issue.field;
              return `${fieldLabel}: ${issue.message}`;
            });

            // Return first error if only one, or join all errors
            return errorMessages.length === 1
              ? errorMessages[0]
              : errorMessages.join('\n');
          }

          if (response?.error?.message) {
            console.log('[DEBUG] Using response.error.message:', response.error.message);
            return response.error.message
          }
          if (response?.error?.code) {
            console.log('[DEBUG] Using response.error.code:', response.error.code);
            return `Error: ${response.error.code}`
          }
          if (response?.message) return response.message
          if (response?.error) {
            console.log('[DEBUG] Stringifying response.error');
            return JSON.stringify(response.error)
          }
          console.log('[DEBUG] Using default message');
          return 'Registrasi gagal'
        }

        const errorMessage = getErrorMessage(data);
        console.log('[DEBUG] Final error message:', errorMessage, 'Type:', typeof errorMessage);
        setErrors({ general: errorMessage });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Terjadi kesalahan. Silakan coba lagi.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/mti-logo.jpg"
              alt="Tikrar MTI Apps"
              width={64}
              height={64}
              className="object-contain w-12 h-12 sm:w-16 sm:h-16"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">Tikrar MTI Apps</h1>
          <p className="text-gray-600 text-sm sm:text-base">Bergabung dengan program Tahfidz Al-Qur'an MTI</p>
        </div>

        {/* Registration Form */}
        <Card className="p-6 sm:p-8">
          {/* Saved Data Notification */}
          {savedDataLoaded && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex justify-between items-center">
              <span className="text-sm">Data form sebelumnya telah dimuat secara otomatis</span>
              <button
                type="button"
                onClick={clearSavedData}
                className="text-xs underline hover:no-underline"
              >
                Hapus & Mulai Baru
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded whitespace-pre-line">
                {typeof errors.general === 'string' ? errors.general : JSON.stringify(errors.general)}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div>
                <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
                <Input
                  id="namaLengkap"
                  type="text"
                  value={formData.namaLengkap}
                  onChange={(e) => handleInputChange('namaLengkap', e.target.value)}
                  placeholder="Masukkan nama lengkap (tanpa gelar)"
                  className={errors.namaLengkap ? 'border-red-500' : ''}
                  required
                />
                {errors.namaLengkap && <p className="text-red-500 text-sm mt-1">{errors.namaLengkap}</p>}
              </div>

              {/* Nama Kunyah */}
              <div>
                <Label htmlFor="namaKunyah">Nama Kunyah</Label>
                <Input
                  id="namaKunyah"
                  type="text"
                  value={formData.namaKunyah}
                  onChange={(e) => handleInputChange('namaKunyah', e.target.value)}
                  placeholder="Contoh: Ummu Fulanah"
                />
                <p className="text-gray-500 text-xs mt-1">Nama panggilan Islam (opsional)</p>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                  required
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className={errors.password ? 'border-red-500' : ''}
                  required
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Ulangi password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                  required
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Negara */}
              <div>
                <Label htmlFor="negara">Negara *</Label>
                <Select value={formData.negara} onValueChange={(value) => handleInputChange('negara', value)}>
                  <SelectTrigger className={errors.negara ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih negara" />
                  </SelectTrigger>
                  <SelectContent>
                    {negaraList.map((negara) => (
                      <SelectItem key={negara} value={negara}>
                        {negara}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.negara && <p className="text-red-500 text-sm mt-1">{errors.negara}</p>}
              </div>

              {/* Provinsi (hanya untuk Indonesia) */}
              {formData.negara === 'Indonesia' && (
                <div>
                  <Label htmlFor="provinsi">Provinsi *</Label>
                  <Select value={formData.provinsi} onValueChange={(value) => handleInputChange('provinsi', value)}>
                    <SelectTrigger className={errors.provinsi ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinsiList.map((provinsi) => (
                        <SelectItem key={provinsi} value={provinsi}>
                          {provinsi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.provinsi && <p className="text-red-500 text-sm mt-1">{errors.provinsi}</p>}
                </div>
              )}

              {/* Kota */}
              <div>
                <Label htmlFor="kota">Kota *</Label>
                <Input
                  id="kota"
                  type="text"
                  value={formData.kota}
                  onChange={(e) => handleInputChange('kota', e.target.value)}
                  placeholder="Masukkan kota"
                  className={errors.kota ? 'border-red-500' : ''}
                  required
                />
                {errors.kota && <p className="text-red-500 text-sm mt-1">{errors.kota}</p>}
              </div>

              {/* WhatsApp */}
              <div>
                <PhoneInput
                  id="whatsapp"
                  label="WhatsApp"
                  value={formData.whatsapp}
                  onChange={(value) => handleInputChange('whatsapp', value)}
                  selectedCountry={formData.negara}
                  placeholder="812-3456-7890"
                  required
                  error={errors.whatsapp}
                />
              </div>

              {/* Telegram */}
              <div>
                <PhoneInput
                  id="telegram"
                  label="Telegram"
                  value={formData.telegram}
                  onChange={(value) => handleInputChange('telegram', value)}
                  selectedCountry={formData.negara}
                  placeholder="812-3456-7890"
                  required
                  error={errors.telegram}
                />
              </div>

              {/* Tanggal Lahir */}
              <div>
                <Label htmlFor="tanggalLahir">Tanggal Lahir *</Label>
                <Input
                  id="tanggalLahir"
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={(e) => handleInputChange('tanggalLahir', e.target.value)}
                  className={errors.tanggalLahir ? 'border-red-500' : ''}
                  required
                />
                {errors.tanggalLahir && <p className="text-red-500 text-sm mt-1">{errors.tanggalLahir}</p>}
              </div>

              {/* Tempat Lahir */}
              <div>
                <Label htmlFor="tempatLahir">Tempat Lahir *</Label>
                <Input
                  id="tempatLahir"
                  type="text"
                  value={formData.tempatLahir}
                  onChange={(e) => handleInputChange('tempatLahir', e.target.value)}
                  placeholder="Masukkan tempat lahir"
                  className={errors.tempatLahir ? 'border-red-500' : ''}
                  required
                />
                {errors.tempatLahir && <p className="text-red-500 text-sm mt-1">{errors.tempatLahir}</p>}
              </div>

              {/* Jenis Kelamin */}
              <div>
                <Label>Jenis Kelamin *</Label>
                <Select value={formData.jenisKelamin} onValueChange={(value) => handleInputChange('jenisKelamin', value)}>
                  <SelectTrigger className={errors.jenisKelamin ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                {errors.jenisKelamin && <p className="text-red-500 text-sm mt-1">{errors.jenisKelamin}</p>}
              </div>

              {/* Pekerjaan */}
              <div>
                <Label htmlFor="pekerjaan">Pekerjaan *</Label>
                <Input
                  id="pekerjaan"
                  type="text"
                  value={formData.pekerjaan}
                  onChange={(e) => handleInputChange('pekerjaan', e.target.value)}
                  placeholder="Masukkan pekerjaan"
                  className={errors.pekerjaan ? 'border-red-500' : ''}
                  required
                />
                {errors.pekerjaan && <p className="text-red-500 text-sm mt-1">{errors.pekerjaan}</p>}
              </div>

              {/* Zona Waktu */}
              <div>
                <Label htmlFor="zonaWaktu">Zona Waktu *</Label>
                <Select value={formData.zonaWaktu} onValueChange={(value) => handleInputChange('zonaWaktu', value)}>
                  <SelectTrigger className={errors.zonaWaktu ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih zona waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonaWaktuList
                      .filter(zona => zona.country === formData.negara || !formData.negara)
                      .map((zona) => (
                        <SelectItem key={zona.value} value={zona.value}>
                          {zona.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.zonaWaktu && <p className="text-red-500 text-sm mt-1">{errors.zonaWaktu}</p>}
              </div>
            </div>

            {/* Alamat */}
            <div>
              <Label htmlFor="alamat">Alamat Lengkap *</Label>
              <textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => handleInputChange('alamat', e.target.value)}
                placeholder="Masukkan alamat lengkap"
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.alamat ? 'border-red-500' : ''}`}
                rows={3}
                required
              />
              {errors.alamat && <p className="text-red-500 text-sm mt-1">{errors.alamat}</p>}
            </div>

            {/* Alasan Daftar */}
            <div>
              <Label htmlFor="alasanDaftar">Alasan Mendaftar *</Label>
              <textarea
                id="alasanDaftar"
                value={formData.alasanDaftar}
                onChange={(e) => handleInputChange('alasanDaftar', e.target.value)}
                placeholder="Ceritakan alasan ukhti ingin mendaftar"
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.alasanDaftar ? 'border-red-500' : ''}`}
                rows={3}
                required
              />
              {errors.alasanDaftar && <p className="text-red-500 text-sm mt-1">{errors.alasanDaftar}</p>}
            </div>

            {/* Syarat dan Ketentuan */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="setujuSyarat"
                checked={formData.setujuSyarat}
                onCheckedChange={(checked) => handleInputChange('setujuSyarat', checked)}
                className={errors.setujuSyarat ? 'border-red-500' : ''}
              />
              <Label htmlFor="setujuSyarat" className="text-sm leading-relaxed">
                Saya menyetujui <Link href="/syarat-ketentuan" className="text-green-600 hover:underline">syarat dan ketentuan</Link> yang berlaku
              </Label>
            </div>
            {errors.setujuSyarat && <p className="text-red-500 text-sm mt-1">{errors.setujuSyarat}</p>}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 touch-manipulation"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Memproses...
                </div>
              ) : (
                'Daftar Sekarang'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-green-600 hover:underline font-medium">
              Login di sini
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <RegisterPageContent />;
}