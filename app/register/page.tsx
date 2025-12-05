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
    tanggalLahir: '',
    tempatLahir: '',
    pekerjaan: '',
    namaWali: '',
    nomorWali: '',
    hubunganWali: '',
    alasanDaftar: '',
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

    if (!formData.telegram.trim()) {
      newErrors.telegram = 'Nomor Telegram harus diisi';
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
          telegram: formData.telegram,
          zona_waktu: formData.zonaWaktu,
          tanggal_lahir: formData.tanggalLahir || null,
          tempat_lahir: formData.tempatLahir || null,
          pekerjaan: formData.pekerjaan || null,
          nama_wali: formData.namaWali || null,
          nomor_wali: formData.nomorWali || null,
          hubungan_wali: formData.hubunganWali || null,
          alasan_daftar: formData.alasanDaftar || null,
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
          <h1 className="text-3xl font-bold text-green-900 mb-2">Pendaftaran Calon Thalibah</h1>
          <p className="text-gray-600">Bergabung dengan program Tahfidz Al-Qur'an MTI</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Data Diri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
                <Input
                  id="namaLengkap"
                  type="text"
                  value={formData.namaLengkap}
                  onChange={(e) => handleInputChange('namaLengkap', e.target.value)}
                  className="mt-1"
                  placeholder="Masukkan nama lengkap"
                />
                {errors.namaLengkap && (
                  <p className="text-red-500 text-sm mt-1">{errors.namaLengkap}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1"
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                <Input
                  id="tempatLahir"
                  type="text"
                  value={formData.tempatLahir}
                  onChange={(e) => handleInputChange('tempatLahir', e.target.value)}
                  className="mt-1"
                  placeholder="Kota kelahiran"
                />
              </div>

              <div>
                <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                <Input
                  id="tanggalLahir"
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={(e) => handleInputChange('tanggalLahir', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pekerjaan">Pekerjaan</Label>
                <Input
                  id="pekerjaan"
                  type="text"
                  value={formData.pekerjaan}
                  onChange={(e) => handleInputChange('pekerjaan', e.target.value)}
                  className="mt-1"
                  placeholder="Pekerjaan saat ini"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  className="mt-1"
                  placeholder="08xx-xxxx-xxxx"
                />
                {errors.whatsapp && (
                  <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
                )}
              </div>

              <div>
                <Label htmlFor="telegram">Telegram *</Label>
                <Input
                  id="telegram"
                  type="tel"
                  value={formData.telegram}
                  onChange={(e) => handleInputChange('telegram', e.target.value)}
                  className="mt-1"
                  placeholder="08xx-xxxx-xxxx"
                />
                {errors.telegram && (
                  <p className="text-red-500 text-sm mt-1">{errors.telegram}</p>
                )}
              </div>

              <div>
                <Label htmlFor="zonaWaktu">Zona Waktu *</Label>
                <Select value={formData.zonaWaktu} onValueChange={(value) => handleInputChange('zonaWaktu', value)}>
                  <SelectTrigger className="mt-1">
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
                  <p className="text-red-500 text-sm mt-1">{errors.zonaWaktu}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="alamat">Alamat Lengkap *</Label>
              <textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => handleInputChange('alamat', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Masukkan alamat lengkap"
              />
              {errors.alamat && (
                <p className="text-red-500 text-sm mt-1">{errors.alamat}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="provinsi">Provinsi *</Label>
                <Select value={formData.provinsi} onValueChange={(value) => handleInputChange('provinsi', value)}>
                  <SelectTrigger className="mt-1">
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
                  <p className="text-red-500 text-sm mt-1">{errors.provinsi}</p>
                )}
              </div>

              <div>
                <Label htmlFor="kota">Kota *</Label>
                <Input
                  id="kota"
                  type="text"
                  value={formData.kota}
                  onChange={(e) => handleInputChange('kota', e.target.value)}
                  className="mt-1"
                  placeholder="Masukkan kota"
                />
                {errors.kota && (
                  <p className="text-red-500 text-sm mt-1">{errors.kota}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Data Wali</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namaWali">Nama Wali</Label>
                <Input
                  id="namaWali"
                  type="text"
                  value={formData.namaWali}
                  onChange={(e) => handleInputChange('namaWali', e.target.value)}
                  className="mt-1"
                  placeholder="Nama orang tua/wali"
                />
              </div>

              <div>
                <Label htmlFor="nomorWali">Nomor Telepon Wali</Label>
                <Input
                  id="nomorWali"
                  type="tel"
                  value={formData.nomorWali}
                  onChange={(e) => handleInputChange('nomorWali', e.target.value)}
                  className="mt-1"
                  placeholder="08xx-xxxx-xxxx"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="hubunganWali">Hubungan dengan Wali</Label>
              <Select value={formData.hubunganWali} onValueChange={(value) => handleInputChange('hubunganWali', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih hubungan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ayah">Ayah</SelectItem>
                  <SelectItem value="Ibu">Ibu</SelectItem>
                  <SelectItem value="Suami">Suami</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Alasan Mendaftar</h2>
            <div>
              <Label htmlFor="alasanDaftar">Alasan ingin bergabung dengan program MTI</Label>
              <textarea
                id="alasanDaftar"
                value={formData.alasanDaftar}
                onChange={(e) => handleInputChange('alasanDaftar', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Jelaskan alasan Anda ingin mendaftar..."
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="setujuSyarat"
                checked={formData.setujuSyarat}
                onCheckedChange={(checked) => handleInputChange('setujuSyarat', checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="setujuSyarat" className="text-sm font-normal">
                  Saya menyetujui syarat dan ketentuan yang berlaku
                </Label>
                {errors.setujuSyarat && (
                  <p className="text-red-500 text-sm">{errors.setujuSyarat}</p>
                )}
              </div>
            </div>
          </Card>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 text-white py-3"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memproses...
              </div>
            ) : (
              'Daftar Sekarang'
            )}
          </Button>

          <div className="text-center">
            <p className="text-gray-600">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-green-900 hover:underline">
                Login di sini
              </Link>
            </p>
          </div>
        </form>
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