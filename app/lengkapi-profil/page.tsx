'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

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

export default function LengkapiProfilPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp: '',
    telegram: '',
    provinsi: '',
    kota: '',
    alamat: '',
    zona_waktu: '',
    tanggal_lahir: '',
    tempat_lahir: '',
    jenis_kelamin: '',
    pekerjaan: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const getUserProfile = async () => {
      if (!authUser?.id) return;

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single() as any;

      if (userData) {
        setUserProfile(userData);
        setFormData({
          full_name: userData.full_name || '',
          whatsapp: userData.whatsapp || '',
          telegram: userData.telegram || '',
          provinsi: userData.provinsi || '',
          kota: userData.kota || '',
          alamat: userData.alamat || '',
          zona_waktu: userData.zona_waktu || '',
          tanggal_lahir: userData.tanggal_lahir || '',
          tempat_lahir: userData.tempat_lahir || '',
          jenis_kelamin: userData.jenis_kelamin || '',
          pekerjaan: userData.pekerjaan || '',
        });
      }
    };

    getUserProfile();
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!formData.full_name || !formData.whatsapp || !formData.telegram || !formData.kota || !formData.alamat || !formData.zona_waktu) {
      setError('Mohon lengkapi semua field yang wajib diisi (*)');
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          full_name: formData.full_name,
          whatsapp: formData.whatsapp,
          telegram: formData.telegram,
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
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-900">Edit Profil</CardTitle>
            <CardDescription>
              Perbarui informasi profil Anda. Field yang ditandai (*) wajib diisi.
            </CardDescription>
          </CardHeader>
          <CardContent>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="whatsapp">
                      WhatsApp <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="08xx-xxxx-xxxx"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="telegram">
                      Telegram <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="telegram"
                        type="tel"
                        placeholder="08xx-xxxx-xxxx"
                        value={formData.telegram}
                        onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
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
                    <Label htmlFor="provinsi">
                      Provinsi
                    </Label>
                    <Select value={formData.provinsi} onValueChange={(value) => setFormData({ ...formData, provinsi: value })}>
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
                  </div>

                  <div>
                    <Label htmlFor="kota">
                      Kota <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="kota"
                        type="text"
                        placeholder="Masukkan kota"
                        value={formData.kota}
                        onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="zona_waktu">
                      Zona Waktu <span className="text-red-500">*</span>
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
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
