'use client';

import React, { useState, Suspense } from 'react';
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
import { Crown, Heart, ArrowRight, CheckCircle } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { validatePhoneNumberFormat } from "@/lib/utils/sanitize";

const negaraList = [
  "Indonesia",
  "Malaysia",
  "Singapura",
  "Brunei Darussalam",
  "Thailand",
  "Filipina",
  "Vietnam",
  "Myanmar",
  "Kamboja",
  "Laos",
  "Timor Leste",
  "United Kingdom",
  "Australia",
  "New Zealand",
  "United States",
  "Canada",
  "Germany",
  "Netherlands",
  "Saudi Arabia",
  "UAE",
  "Qatar",
  "Egypt",
  "Turkey",
  "Japan",
  "South Korea",
  "China",
  "India",
  "Pakistan",
  "Bangladesh",
  "Sri Lanka"
];

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
  // Indonesia
  { value: "WIB", label: "WIB (UTC+7) - Indonesia Barat", country: "Indonesia" },
  { value: "WITA", label: "WITA (UTC+8) - Indonesia Tengah", country: "Indonesia" },
  { value: "WIT", label: "WIT (UTC+9) - Indonesia Timur", country: "Indonesia" },
  // Asia Tenggara
  { value: "ICT", label: "ICT (UTC+7) - Thailand, Vietnam, Cambodia", country: "Thailand" },
  { value: "MYT", label: "MYT (UTC+8) - Malaysia, Singapore", country: "Malaysia" },
  { value: "PHT", label: "PHT (UTC+8) - Philippines", country: "Philippines" },
  // Asia Selatan
  { value: "PKT", label: "PKT (UTC+5) - Pakistan", country: "Pakistan" },
  { value: "IST", label: "IST (UTC+5:30) - India, Sri Lanka", country: "India" },
  { value: "BST", label: "BST (UTC+6) - Bangladesh", country: "Bangladesh" },
  // Asia Timur
  { value: "CST", label: "CST (UTC+8) - China", country: "China" },
  { value: "JST", label: "JST (UTC+9) - Japan, Korea", country: "Japan" },
  // Eropa & Timur Tengah
  { value: "GMT", label: "GMT (UTC+0) - London, Lisbon", country: "United Kingdom" },
  { value: "CET", label: "CET (UTC+1) - Paris, Berlin, Rome", country: "Germany" },
  { value: "EET", label: "EET (UTC+2) - Cairo, Athens", country: "Egypt" },
  { value: "MSK", label: "MSK (UTC+3) - Moscow, Riyadh", country: "Saudi Arabia" },
  { value: "GST", label: "GST (UTC+4) - Dubai, Abu Dhabi", country: "UAE" },
  { value: "TRT", label: "TRT (UTC+3) - Istanbul", country: "Turkey" },
  // Oseania
  { value: "AWST", label: "AWST (UTC+8) - Australia Barat", country: "Australia" },
  { value: "ACST", label: "ACST (UTC+9:30) - Australia Tengah", country: "Australia" },
  { value: "AEST", label: "AEST (UTC+10) - Australia Timur", country: "Australia" },
  { value: "AEDT", label: "AEDT (UTC+11) - Canberra", country: "Australia" },
  { value: "NZST", label: "NZST (UTC+12) - New Zealand", country: "New Zealand" },
  // Amerika
  { value: "EST", label: "EST (UTC-5) - New York, Toronto", country: "United States" },
  { value: "CST", label: "CST (UTC-6) - Chicago, Houston", country: "United States" },
  { value: "MST", label: "MST (UTC-7) - Denver, Phoenix", country: "United States" },
  { value: "PST", label: "PST (UTC-8) - Los Angeles, San Francisco", country: "United States" },
  { value: "HST", label: "HST (UTC-10) - Hawaii", country: "United States" },
  { value: "AST", label: "AST (UTC-4) - Halifax", country: "Canada" }
];

function RegisterPageContent() {
  const router = useRouter();
  const [formData, setFormData] = useState({
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

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    if (!formData.negara) {
      newErrors.negara = 'Negara harus dipilih';
    }

    // Validasi provinsi hanya untuk Indonesia
    if (formData.negara === 'Indonesia' && !formData.provinsi) {
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

    // Validasi format nomor telepon
    if (!validatePhoneNumberFormat(formData.whatsapp, formData.negara)) {
      newErrors.whatsapp = 'Format nomor WhatsApp tidak valid untuk negara yang dipilih';
    }

    if (!validatePhoneNumberFormat(formData.telegram, formData.negara)) {
      newErrors.telegram = 'Format nomor Telegram tidak valid untuk negara yang dipilih';
    }

    if (!formData.zonaWaktu) {
      newErrors.zonaWaktu = 'Zona waktu harus dipilih';
    }

    if (!formData.tanggalLahir) {
      newErrors.tanggalLahir = 'Tanggal lahir harus diisi';
    } else {
      // Validasi minimal umur remaja (12 tahun)
      const birthDate = new Date(formData.tanggalLahir);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

      if (actualAge < 12) {
        newErrors.tanggalLahir = 'Minimal usia 12 tahun (kategori remaja)';
      }
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          tanggal_lahir: formData.tanggalLahir,
          tempat_lahir: formData.tempatLahir,
          jenis_kelamin: formData.jenisKelamin,
          pekerjaan: formData.pekerjaan,
          alasan_daftar: formData.alasanDaftar,
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
        <div className="absolute top-10 left-5 sm:top-20 sm:left-10 w-24 h-24 sm:w-32 sm:h-32 bg-green-900/5 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-10 right-5 sm:bottom-20 sm:right-20 w-32 h-32 sm:w-40 sm:h-40 bg-yellow-500/5 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-2xl lg:max-w-3xl xl:max-w-4xl">
        {/* Header */}
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-4 sm:p-6">
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
                <Label htmlFor="email">Email/Username *</Label>
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
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="mt-1 text-base"
                  placeholder="Minimal 6 karakter"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="mt-1 text-base"
                  placeholder="Ulangi password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tempatLahir">Tempat Lahir *</Label>
                <Input
                  id="tempatLahir"
                  type="text"
                  value={formData.tempatLahir}
                  onChange={(e) => handleInputChange('tempatLahir', e.target.value)}
                  className="mt-1"
                  placeholder="Kota kelahiran"
                />
                {errors.tempatLahir && (
                  <p className="text-red-500 text-sm mt-1">{errors.tempatLahir}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tanggalLahir">Tanggal Lahir * <span className="text-xs text-gray-500">(Min. 12 tahun)</span></Label>
                <Input
                  id="tanggalLahir"
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={(e) => handleInputChange('tanggalLahir', e.target.value)}
                  className="mt-1"
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 12)).toISOString().split('T')[0]}
                />
                {errors.tanggalLahir && (
                  <p className="text-red-500 text-sm mt-1">{errors.tanggalLahir}</p>
                )}
              </div>

              <div>
                <Label htmlFor="jenisKelamin">Jenis Kelamin *</Label>
                <Select value={formData.jenisKelamin} onValueChange={(value) => handleInputChange('jenisKelamin', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  </SelectContent>
                </Select>
                {errors.jenisKelamin && (
                  <p className="text-red-500 text-sm mt-1">{errors.jenisKelamin}</p>
                )}
              </div>

              <div>
                <Label htmlFor="pekerjaan">Pekerjaan *</Label>
                <Input
                  id="pekerjaan"
                  type="text"
                  value={formData.pekerjaan}
                  onChange={(e) => handleInputChange('pekerjaan', e.target.value)}
                  className="mt-1"
                  placeholder="Pekerjaan saat ini"
                />
                {errors.pekerjaan && (
                  <p className="text-red-500 text-sm mt-1">{errors.pekerjaan}</p>
                )}
              </div>

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

              </div>

            <div className="mt-4">
              <Label htmlFor="alamat">Alamat Lengkap *</Label>
              <textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => handleInputChange('alamat', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-base resize-none"
                rows={3}
                placeholder="Masukkan alamat lengkap"
              />
              {errors.alamat && (
                <p className="text-red-500 text-sm mt-1">{errors.alamat}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="negara">Negara *</Label>
                <Select value={formData.negara} onValueChange={(value) => {
                  handleInputChange('negara', value);
                  // Reset provinsi jika bukan Indonesia
                  if (value !== 'Indonesia') {
                    handleInputChange('provinsi', '');
                  }
                  // Reset zona waktu agar user memilih ulang sesuai negara
                  handleInputChange('zonaWaktu', '');
                }}>
                  <SelectTrigger className="mt-1">
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
                {errors.negara && (
                  <p className="text-red-500 text-sm mt-1">{errors.negara}</p>
                )}
              </div>

              {formData.negara === 'Indonesia' && (
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
              )}

              <div className={formData.negara === 'Indonesia' ? 'md:col-span-2' : ''}>
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

            <div className="mt-4">
              <Label htmlFor="zonaWaktu">Zona Waktu *</Label>
              <Select value={formData.zonaWaktu} onValueChange={(value) => handleInputChange('zonaWaktu', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih zona waktu" />
                </SelectTrigger>
                <SelectContent>
                  {/* Filter zona waktu berdasarkan negara yang dipilih */}
                  {formData.negara === 'Indonesia' && (
                    <>
                      <SelectItem value="WIB">WIB (UTC+7) - Indonesia Barat</SelectItem>
                      <SelectItem value="WITA">WITA (UTC+8) - Indonesia Tengah</SelectItem>
                      <SelectItem value="WIT">WIT (UTC+9) - Indonesia Timur</SelectItem>
                    </>
                  )}
                  {formData.negara === 'Malaysia' && (
                    <SelectItem value="MYT">MYT (UTC+8) - Malaysia, Singapore</SelectItem>
                  )}
                  {formData.negara === 'Singapura' && (
                    <SelectItem value="MYT">MYT (UTC+8) - Singapore, Malaysia</SelectItem>
                  )}
                  {formData.negara === 'United Kingdom' && (
                    <SelectItem value="GMT">GMT (UTC+0) - London</SelectItem>
                  )}
                  {formData.negara === 'Australia' && (
                    <>
                      <SelectItem value="AWST">AWST (UTC+8) - Australia Barat</SelectItem>
                      <SelectItem value="ACST">ACST (UTC+9:30) - Australia Tengah</SelectItem>
                      <SelectItem value="AEST">AEST (UTC+10) - Australia Timur</SelectItem>
                      <SelectItem value="AEDT">AEDT (UTC+11) - Canberra</SelectItem>
                    </>
                  )}
                  {formData.negara === 'New Zealand' && (
                    <SelectItem value="NZST">NZST (UTC+12) - New Zealand</SelectItem>
                  )}
                  {formData.negara === 'United States' && (
                    <>
                      <SelectItem value="EST">EST (UTC-5) - New York, Toronto</SelectItem>
                      <SelectItem value="CST">CST (UTC-6) - Chicago, Houston</SelectItem>
                      <SelectItem value="MST">MST (UTC-7) - Denver, Phoenix</SelectItem>
                      <SelectItem value="PST">PST (UTC-8) - Los Angeles, San Francisco</SelectItem>
                      <SelectItem value="HST">HST (UTC-10) - Hawaii</SelectItem>
                    </>
                  )}
                  {formData.negara === 'Canada' && (
                    <SelectItem value="AST">AST (UTC-4) - Halifax</SelectItem>
                  )}
                  {formData.negara === 'Germany' || formData.negara === 'Netherlands' ? (
                    <SelectItem value="CET">CET (UTC+1) - Paris, Berlin, Rome</SelectItem>
                  ) : null}
                  {formData.negara === 'Egypt' && (
                    <SelectItem value="EET">EET (UTC+2) - Cairo, Athens</SelectItem>
                  )}
                  {formData.negara === 'Saudi Arabia' && (
                    <SelectItem value="MSK">MSK (UTC+3) - Moscow, Riyadh</SelectItem>
                  )}
                  {formData.negara === 'UAE' && (
                    <SelectItem value="GST">GST (UTC+4) - Dubai, Abu Dhabi</SelectItem>
                  )}
                  {formData.negara === 'Turkey' && (
                    <SelectItem value="TRT">TRT (UTC+3) - Istanbul</SelectItem>
                  )}
                  {formData.negara === 'Japan' || formData.negara === 'South Korea' ? (
                    <SelectItem value="JST">JST (UTC+9) - Japan, Korea</SelectItem>
                  ) : null}
                  {formData.negara === 'China' && (
                    <SelectItem value="CST">CST (UTC+8) - China</SelectItem>
                  )}
                  {formData.negara === 'India' || formData.negara === 'Sri Lanka' ? (
                    <SelectItem value="IST">IST (UTC+5:30) - India, Sri Lanka</SelectItem>
                  ) : null}
                  {formData.negara === 'Pakistan' && (
                    <SelectItem value="PKT">PKT (UTC+5) - Pakistan</SelectItem>
                  )}
                  {formData.negara === 'Bangladesh' && (
                    <SelectItem value="BST">BST (UTC+6) - Bangladesh</SelectItem>
                  )}
                  {['Thailand', 'Vietnam', 'Myanmar', 'Kamboja', 'Laos'].includes(formData.negara) && (
                    <SelectItem value="ICT">ICT (UTC+7) - Thailand, Vietnam, Cambodia</SelectItem>
                  )}
                  {formData.negara === 'Filipina' && (
                    <SelectItem value="PHT">PHT (UTC+8) - Philippines</SelectItem>
                  )}
                  {['Brunei Darussalam', 'Timor Leste', 'Qatar'].includes(formData.negara) && (
                    <>
                      {zonaWaktuList.map((zona) => (
                        <SelectItem key={zona.value} value={zona.value}>
                          {zona.label}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              {errors.zonaWaktu && (
                <p className="text-red-500 text-sm mt-1">{errors.zonaWaktu}</p>
              )}
              {formData.negara && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.negara === 'Indonesia' && 'Pilih WIB, WITA, atau WIT sesuai lokasi Ukhti'}
                  {formData.negara === 'Malaysia' && 'Malaysia menggunakan MYT (UTC+8)'}
                  {formData.negara === 'Singapura' && 'Singapore menggunakan MYT (UTC+8)'}
                  {formData.negara === 'United Kingdom' && 'London menggunakan GMT (UTC+0)'}
                  {formData.negara === 'Australia' && 'Pilih zona waktu sesuai wilayah di Australia'}
                  {formData.negara === 'New Zealand' && 'New Zealand menggunakan NZST (UTC+12)'}
                  {formData.negara === 'United States' && 'Pilih zona waktu sesuai wilayah di AS'}
                  {formData.negara === 'Canada' && 'Kanada menggunakan berbagai zona waktu'}
                  {(formData.negara === 'Germany' || formData.negara === 'Netherlands') && 'Eropa menggunakan CET (UTC+1)'}
                  {formData.negara === 'Saudi Arabia' && 'Saudi Arabia menggunakan waktu Arabia (UTC+3)'}
                  {formData.negara === 'UAE' && 'UAE menggunakan waktu Gulf (UTC+4)'}
                  {(formData.negara === 'Japan' || formData.negara === 'South Korea') && 'Asia Timur menggunakan JST (UTC+9)'}
                  {formData.negara === 'China' && 'China menggunakan CST (UTC+8)'}
                  {(formData.negara === 'India' || formData.negara === 'Sri Lanka') && 'Asia Selatan menggunakan IST (UTC+5:30)'}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Alasan Mendaftar</h2>
            <div>
              <Label htmlFor="alasanDaftar">Alasan ingin bergabung dengan program MTI *</Label>
              <textarea
                id="alasanDaftar"
                value={formData.alasanDaftar}
                onChange={(e) => handleInputChange('alasanDaftar', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Jelaskan alasan Ukhti ingin mendaftar..."
              />
              {errors.alasanDaftar && (
                <p className="text-red-500 text-sm mt-1">{errors.alasanDaftar}</p>
              )}
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
                  Saya menyetujui{' '}
                  <a
                    href="/syarat-ketentuan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/syarat-ketentuan', '_blank');
                    }}
                  >
                    syarat dan ketentuan yang berlaku
                  </a>
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
            <Image
              src="/mti-logo.jpg"
              alt="Tikrar MTI Apps"
              width={64}
              height={64}
              className="object-contain animate-pulse"
              priority
            />
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