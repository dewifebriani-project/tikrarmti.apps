'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, createSupabaseAdmin } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { PhoneInput } from '@/components/ui/phone-input';
import { validatePhoneNumberFormat } from '@/lib/utils/sanitize';

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
  { value: "WIB", label: "WIB (UTC+7) - Indonesia Barat" },
  { value: "WITA", label: "WITA (UTC+8) - Indonesia Tengah" },
  { value: "WIT", label: "WIT (UTC+9) - Indonesia Timur" },
  { value: "UTC+0", label: "GMT (UTC+0) - London, Lisbon" },
  { value: "UTC+1", label: "CET (UTC+1) - Paris, Berlin, Rome" },
  { value: "UTC+2", label: "EET (UTC+2) - Cairo, Athens" },
  { value: "UTC+3", label: "MSK (UTC+3) - Moscow, Riyadh" },
  { value: "UTC+4", label: "GST (UTC+4) - Dubai, Abu Dhabi" },
  { value: "UTC+5", label: "PKT (UTC+5) - Karachi" },
  { value: "UTC+5:30", label: "IST (UTC+5:30) - India, Sri Lanka" },
  { value: "UTC+6", label: "BST (UTC+6) - Bangladesh" },
  { value: "UTC+7", label: "ICT (UTC+7) - Thailand, Vietnam" },
  { value: "UTC+8", label: "CST (UTC+8) - China, Singapore, Malaysia" },
  { value: "UTC+9", label: "JST (UTC+9) - Japan, South Korea" },
  { value: "UTC+10", label: "AEST (UTC+10) - Sydney, Melbourne" },
  { value: "UTC+11", label: "AEDT (UTC+11) - Canberra" },
  { value: "UTC+12", label: "NZST (UTC+12) - New Zealand" },
  { value: "UTC-5", label: "EST (UTC-5) - New York, Toronto" },
  { value: "UTC-6", label: "CST (UTC-6) - Chicago, Houston" },
  { value: "UTC-7", label: "MST (UTC-7) - Denver, Phoenix" },
  { value: "UTC-8", label: "PST (UTC-8) - Los Angeles, San Francisco" },
  { value: "UTC-10", label: "HST (UTC-10) - Hawaii" }
];

export default function LengkapiProfilPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    whatsapp: '',
    telegram: '',
    negara: '',
    provinsi: '',
    kota: '',
    alamat: '',
    zona_waktu: '',
    tanggal_lahir: '',
    tempat_lahir: '',
    jenis_kelamin: '',
    pekerjaan: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    const getUserProfile = async () => {
      if (!authUser?.id) return;

      try {
        console.log('Fetching user profile for:', authUser.id);

        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setError('Gagal memuat data profil. Silakan coba lagi.');
          return;
        }

        if (userData) {
          console.log('User data fetched:', userData);
          setUserProfile(userData);
          setFormData({
            email: authUser.email || '',
            full_name: (userData as any).full_name || '',
            whatsapp: (userData as any).whatsapp || '',
            telegram: (userData as any).telegram || '',
            negara: (userData as any).negara || 'Indonesia',
            provinsi: (userData as any).provinsi || '',
            kota: (userData as any).kota || '',
            alamat: (userData as any).alamat || '',
            zona_waktu: (userData as any).zona_waktu || 'WIB',
            tanggal_lahir: (userData as any).tanggal_lahir || '',
            tempat_lahir: (userData as any).tempat_lahir || '',
            jenis_kelamin: (userData as any).jenis_kelamin || '',
            pekerjaan: (userData as any).pekerjaan || '',
            newPassword: '',
            confirmNewPassword: '',
          });
        } else {
          console.log('No user data found');
          setError('Data profil tidak ditemukan.');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Terjadi kesalahan saat memuat data profil.');
      } finally {
        setIsLoading(false);
      }
    };

    getUserProfile();
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!formData.full_name || !formData.whatsapp || !formData.telegram || !formData.kota || !formData.alamat || !formData.zona_waktu || !formData.negara) {
      setError('Mohon lengkapi semua field yang wajib diisi (*)');
      setIsLoading(false);
      return;
    }

    // Validasi password jika ingin mengganti
    if (showPasswordFields && formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setError('Password baru minimal 6 karakter');
        setIsLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        setError('Password baru dan konfirmasi password tidak cocok');
        setIsLoading(false);
        return;
      }
    }

    // Validasi format nomor telepon
    if (!validatePhoneNumberFormat(formData.whatsapp, formData.negara)) {
      setError('Format nomor WhatsApp tidak valid');
      setIsLoading(false);
      return;
    }

    if (!validatePhoneNumberFormat(formData.telegram, formData.negara)) {
      setError('Format nomor Telegram tidak valid');
      setIsLoading(false);
      return;
    }

    try {
      // Update user profile
      const supabaseAdmin = createSupabaseAdmin();
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          full_name: formData.full_name,
          whatsapp: formData.whatsapp,
          telegram: formData.telegram,
          negara: formData.negara,
          provinsi: formData.provinsi,
          kota: formData.kota,
          alamat: formData.alamat,
          zona_waktu: formData.zona_waktu,
          tanggal_lahir: formData.tanggal_lahir || null,
          tempat_lahir: formData.tempat_lahir || null,
          jenis_kelamin: formData.jenis_kelamin || null,
          pekerjaan: formData.pekerjaan || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser?.id);

      if (updateError) throw updateError;

      // Update password if provided
      if (showPasswordFields && formData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (passwordError) throw passwordError;
      }

      setSuccess('Profil berhasil diperbarui!');

      // Reload page after 1 second to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat memperbarui profil');
    } finally {
      setIsLoading(false);
    }
  };

  if (!authUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout title="Edit Profil">
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <Card>
          <CardHeader className="px-4 sm:px-8 pt-6 sm:pt-8">
            <CardTitle className="text-xl sm:text-2xl text-green-900">Edit Profil</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Perbarui informasi profil Ukhti. Field yang ditandai (*) wajib diisi.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
                <span className="ml-2 text-gray-600">Memuat data profil...</span>
              </div>
            )}

            {!isLoading && (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
              {/* Data Pribadi */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Data Pribadi</h3>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm sm:text-base">
                      Email/Username <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email/Username"
                        value={formData.email}
                        disabled
                        className="pl-10 bg-gray-50 text-base"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                  </div>

                  <div>
                    <Label htmlFor="full_name">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="full_name"
                        type="text"
                        placeholder="Nama lengkap"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="jenis_kelamin">
                      Jenis Kelamin
                    </Label>
                    <Select value={formData.jenis_kelamin} onValueChange={(value) => setFormData({ ...formData, jenis_kelamin: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tempat_lahir">
                      Tempat Lahir
                    </Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="tempat_lahir"
                        type="text"
                        placeholder="Kota kelahiran"
                        value={formData.tempat_lahir}
                        onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tanggal_lahir">
                      Tanggal Lahir
                    </Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="tanggal_lahir"
                        type="date"
                        value={formData.tanggal_lahir}
                        onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pekerjaan">
                      Pekerjaan
                    </Label>
                    <div className="relative mt-1">
                      <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="pekerjaan"
                        type="text"
                        placeholder="Pekerjaan saat ini"
                        value={formData.pekerjaan}
                        onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kontak */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informasi Kontak</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <PhoneInput
                      id="whatsapp"
                      label="WhatsApp"
                      value={formData.whatsapp}
                      onChange={(value) => setFormData({ ...formData, whatsapp: value })}
                      selectedCountry={formData.negara}
                      placeholder="812-3456-7890"
                      required
                    />
                  </div>

                  <div>
                    <PhoneInput
                      id="telegram"
                      label="Telegram"
                      value={formData.telegram}
                      onChange={(value) => setFormData({ ...formData, telegram: value })}
                      selectedCountry={formData.negara}
                      placeholder="812-3456-7890"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Alamat */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Alamat</h3>

                <div>
                  <Label htmlFor="alamat">
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="alamat"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Masukkan alamat lengkap"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="negara">
                      Negara <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.negara} onValueChange={(value) => setFormData({ ...formData, negara: value })}>
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
                  </div>

                  <div>
                    <Label htmlFor="provinsi">
                      Provinsi/State
                    </Label>
                    <Select value={formData.provinsi} onValueChange={(value) => setFormData({ ...formData, provinsi: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={formData.negara === 'Indonesia' ? 'Pilih provinsi' : 'Pilih state/province'} />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.negara === 'Indonesia' ? (
                          provinsiList.map((provinsi) => (
                            <SelectItem key={provinsi} value={provinsi}>
                              {provinsi}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="International">
                            International (Non-Indonesia)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="kota">
                      Kota/City <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="kota"
                        type="text"
                        placeholder={formData.negara === 'Indonesia' ? 'Masukkan kota' : 'Enter city'}
                        value={formData.kota}
                        onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="zona_waktu">
                      Zona Waktu/Timezone <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.zona_waktu} onValueChange={(value) => setFormData({ ...formData, zona_waktu: value })}>
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
                  </div>
                </div>
              </div>

              {/* Ubah Password */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Keamanan</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                  >
                    {showPasswordFields ? 'Batal' : 'Ubah Password'}
                  </Button>
                </div>

                {showPasswordFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="newPassword">
                        Password Baru <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Minimal 6 karakter"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          className="pr-10"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
                    </div>

                    <div>
                      <Label htmlFor="confirmNewPassword">
                        Konfirmasi Password Baru <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmNewPassword"
                          type="password"
                          placeholder="Ulangi password baru"
                          value={formData.confirmNewPassword}
                          onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                          className="pr-10"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-green-900 hover:bg-green-800 text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </div>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
