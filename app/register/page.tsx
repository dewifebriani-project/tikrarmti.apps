'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Heart, ArrowRight, CheckCircle } from "lucide-react";

const provinsiList = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi", "Sumatera Selatan",
  "Bengkulu", "Lampung", "Kepulauan Bangka Belitung", "Kepulauan Riau", "DKI Jakarta",
  "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Banten", "Bali",
  "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah",
  "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara",
  "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo",
  "Sulawesi Barat", "Maluku", "Maluku Utara", "Papua", "Papua Barat",
  "Papua Tengah", "Papua Selatan"
];

const zonaWaktuList = [
  { value: "WIB", label: "WIB (UTC+7)" },
  { value: "WITA", label: "WITA (UTC+8)" },
  { value: "WIT", label: "WIT (UTC+9)" }
];

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    namaLengkap: '',
    email: '',
    provinsi: '',
    kota: '',
    alamat: '',
    whatsapp: '',
    telegram: '',
    zonaWaktu: '',
    setujuSyarat: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fromGoogle, setFromGoogle] = useState(false);

  useEffect(() => {
    // Check if coming from Google OAuth
    const email = searchParams.get('email');
    const full_name = searchParams.get('full_name');
    const avatar_url = searchParams.get('avatar_url');

    if (email) {
      setFromGoogle(true);
      setFormData(prev => ({
        ...prev,
        email: email || prev.email,
        namaLengkap: full_name || prev.namaLengkap
      }));
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.namaLengkap.trim()) {
      newErrors.namaLengkap = 'Nama lengkap harus diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.provinsi) {
      newErrors.provinsi = 'Provinsi harus dipilih';
    }

    if (!formData.kota.trim()) {
      newErrors.kota = 'Kota harus diisi';
    }

    if (!formData.alamat.trim()) {
      newErrors.alamat = 'Alamat lengkap harus diisi';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'Nomor WhatsApp harus diisi';
    }

    if (!formData.zonaWaktu) {
      newErrors.zonaWaktu = 'Zona waktu harus dipilih';
    }

    if (!formData.setujuSyarat) {
      newErrors.setujuSyarat = 'Anda harus menyetujui syarat dan ketentuan';
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.namaLengkap,
          provinsi: formData.provinsi,
          kota: formData.kota,
          alamat: formData.alamat,
          whatsapp: formData.whatsapp,
          telegram: formData.telegram || null,
          zona_waktu: formData.zonaWaktu,
          role: 'calon_thalibah'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Always redirect to login page after successful registration
        window.location.href = '/login?message=registration_success';
      } else {
        setErrors({ general: data.message || 'Registrasi gagal' });
      }
    } catch (error) {
      setErrors({ general: 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-900/5 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-500/5 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-900 to-yellow-600 rounded-2xl flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">Markaz Tikrar Indonesia</h1>
          <p className="text-gray-600">Bergabung dengan MTI untuk belajar Al-Quran dengan metode Tikrar</p>
          {fromGoogle && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Selamat datang! Silakan lengkapi data berikut untuk menyelesaikan pendaftaran Anda.
              </p>
            </div>
          )}
        </div>

        {/* Register Form */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}

              {/* Nama Lengkap */}
              <div className="space-y-2">
                <Label htmlFor="namaLengkap" className="text-sm font-semibold text-gray-700">
                  Nama Lengkap
                </Label>
                <Input
                  id="namaLengkap"
                  type="text"
                  value={formData.namaLengkap}
                  onChange={(e) => handleInputChange('namaLengkap', e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  disabled={fromGoogle && formData.namaLengkap !== ''}
                  className={`${errors.namaLengkap ? 'border-red-500' : ''} ${fromGoogle && formData.namaLengkap !== '' ? 'bg-gray-50' : ''}`}
                />
                {errors.namaLengkap && (
                  <p className="text-red-500 text-sm">{errors.namaLengkap}</p>
                )}
                {fromGoogle && formData.namaLengkap !== '' && (
                  <p className="text-sm text-gray-500">Nama diambil dari akun Google Anda</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                  disabled={fromGoogle && formData.email !== ''}
                  className={`${errors.email ? 'border-red-500' : ''} ${fromGoogle && formData.email !== '' ? 'bg-gray-50' : ''}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
                {fromGoogle && formData.email !== '' && (
                  <p className="text-sm text-gray-500">Email diambil dari akun Google Anda</p>
                )}
              </div>

              {/* Provinsi */}
              <div className="space-y-2">
                <Label htmlFor="provinsi" className="text-sm font-semibold text-gray-700">
                  Provinsi
                </Label>
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
                {errors.provinsi && (
                  <p className="text-red-500 text-sm">{errors.provinsi}</p>
                )}
              </div>

              {/* Kota */}
              <div className="space-y-2">
                <Label htmlFor="kota" className="text-sm font-semibold text-gray-700">
                  Kota
                </Label>
                <Input
                  id="kota"
                  type="text"
                  value={formData.kota}
                  onChange={(e) => handleInputChange('kota', e.target.value)}
                  placeholder="Masukkan kota Anda"
                  className={errors.kota ? 'border-red-500' : ''}
                />
                {errors.kota && (
                  <p className="text-red-500 text-sm">{errors.kota}</p>
                )}
              </div>

              {/* Alamat Lengkap */}
              <div className="space-y-2">
                <Label htmlFor="alamat" className="text-sm font-semibold text-gray-700">
                  Alamat Lengkap
                </Label>
                <textarea
                  id="alamat"
                  value={formData.alamat}
                  onChange={(e) => handleInputChange('alamat', e.target.value)}
                  placeholder="Masukkan alamat lengkap Anda"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.alamat ? 'border-red-500' : 'border-input bg-background'}`}
                />
                {errors.alamat && (
                  <p className="text-red-500 text-sm">{errors.alamat}</p>
                )}
              </div>

              {/* Nomor WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700">
                  Nomor WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                  className={errors.whatsapp ? 'border-red-500' : ''}
                />
                {errors.whatsapp && (
                  <p className="text-red-500 text-sm">{errors.whatsapp}</p>
                )}
              </div>

              {/* Nomor Telegram */}
              <div className="space-y-2">
                <Label htmlFor="telegram" className="text-sm font-semibold text-gray-700">
                  Nomor Telegram <span className="text-gray-400 font-normal">(opsional)</span>
                </Label>
                <Input
                  id="telegram"
                  type="text"
                  value={formData.telegram}
                  onChange={(e) => handleInputChange('telegram', e.target.value)}
                  placeholder="@username atau nomor telegram"
                />
              </div>

              {/* Zona Waktu */}
              <div className="space-y-2">
                <Label htmlFor="zonaWaktu" className="text-sm font-semibold text-gray-700">
                  Zona Waktu
                </Label>
                <Select value={formData.zonaWaktu} onValueChange={(value) => handleInputChange('zonaWaktu', value)}>
                  <SelectTrigger className={errors.zonaWaktu ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih zona waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonaWaktuList.map((zona) => (
                      <SelectItem key={zona.value} value={zona.value}>
                        {zona.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.zonaWaktu && (
                  <p className="text-red-500 text-sm">{errors.zonaWaktu}</p>
                )}
              </div>

              {/* Syarat dan Ketentuan */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="setujuSyarat"
                    checked={formData.setujuSyarat}
                    onCheckedChange={(checked) => handleInputChange('setujuSyarat', checked as boolean)}
                  />
                  <Label htmlFor="setujuSyarat" className="text-sm text-gray-700 leading-relaxed">
                    Saya menyetujui syarat dan ketentuan yang berlaku
                  </Label>
                </div>
                {errors.setujuSyarat && (
                  <p className="text-red-500 text-sm">{errors.setujuSyarat}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl py-6 text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    Daftar Sekarang
                  </div>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Sudah menyelesaikan pendaftaran?{' '}
                <Link
                  href="/login"
                  className="text-green-900 hover:text-green-800 font-semibold hover:underline transition-colors"
                >
                  Masuk disini
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-yellow-600 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
              <Crown className="w-8 h-8 text-green-900 animate-pulse" />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}