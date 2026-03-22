'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PhoneInput } from '@/components/ui/phone-input'
import { validatePhoneNumberFormat } from '@/lib/utils/sanitize'
import { negaraList, provinsiList, zonaWaktuList } from '@/lib/data/registration-data'
import { AlertCircle, CheckCircle, Loader2, User, Mail, MapPin, Calendar, Phone, Clock, Briefcase, Edit3, X } from 'lucide-react'

type ProfileMode = 'view' | 'edit'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()

  const [mode, setMode] = useState<ProfileMode>('view')
  const [formData, setFormData] = useState({
    namaKunyah: '',
    namaLengkap: '',
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
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile')
    }
  }, [authLoading, isAuthenticated, router])

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id || !isAuthenticated) return

      try {
        const response = await fetch(`/api/user/profile?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()

          // Pre-fill form with existing data
          setFormData(prev => ({
            ...prev,
            namaKunyah: data.nama_kunyah || '',
            namaLengkap: data.full_name || '',
            negara: data.negara || '',
            provinsi: data.provinsi || '',
            kota: data.kota || '',
            alamat: data.alamat || '',
            whatsapp: data.whatsapp || '',
            telegram: data.telegram || '',
            zonaWaktu: data.zona_waktu || '',
            tanggalLahir: data.tanggal_lahir ? new Date(data.tanggal_lahir).toISOString().split('T')[0] : '',
            tempatLahir: data.tempat_lahir || '',
            jenisKelamin: data.jenis_kelamin || '',
            pekerjaan: data.pekerjaan || '',
            alasanDaftar: data.alasan_daftar || '',
          }))
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
        setErrorMessage('Gagal memuat data profil')
        setSubmitStatus('error')
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadUserProfile()
  }, [user?.id, isAuthenticated])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.namaLengkap.trim()) newErrors.namaLengkap = 'Nama lengkap harus diisi'
    if (!formData.negara) newErrors.negara = 'Negara harus dipilih'
    if (!formData.kota.trim()) newErrors.kota = 'Kota harus diisi'
    if (!formData.alamat.trim()) newErrors.alamat = 'Alamat harus diisi'
    if (!formData.zonaWaktu) newErrors.zonaWaktu = 'Zona waktu harus dipilih'
    if (!formData.tanggalLahir) newErrors.tanggalLahir = 'Tanggal lahir harus diisi'
    if (!formData.tempatLahir.trim()) newErrors.tempatLahir = 'Tempat lahir harus diisi'
    if (!formData.jenisKelamin) newErrors.jenisKelamin = 'Jenis kelamin harus dipilih'
    if (!formData.pekerjaan.trim()) newErrors.pekerjaan = 'Pekerjaan harus diisi'
    if (!formData.alasanDaftar.trim()) newErrors.alasanDaftar = 'Alasan mendaftar harus diisi'

    // Validate phone number
    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'Nomor WhatsApp harus diisi'
    } else {
      const isValid = validatePhoneNumberFormat(formData.whatsapp, formData.negara)
      if (!isValid) {
        newErrors.whatsapp = 'Format nomor WhatsApp tidak valid'
      }
    }

    // Validate telegram if provided
    if (formData.telegram && formData.telegram.trim()) {
      const isValid = validatePhoneNumberFormat(formData.telegram, formData.negara)
      if (!isValid) {
        newErrors.telegram = 'Format nomor Telegram tidak valid'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setErrorMessage('Mohon lengkapi semua field yang wajib diisi')
      setSubmitStatus('error')
      return
    }

    setIsLoading(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const requestData = {
        nama_kunyah: formData.namaKunyah || undefined,
        full_name: formData.namaLengkap,
        negara: formData.negara,
        provinsi: formData.provinsi || undefined,
        kota: formData.kota,
        alamat: formData.alamat,
        whatsapp: formData.whatsapp,
        telegram: formData.telegram || undefined,
        zona_waktu: formData.zonaWaktu,
        tanggal_lahir: new Date(formData.tanggalLahir).toISOString(),
        tempat_lahir: formData.tempatLahir,
        jenis_kelamin: formData.jenisKelamin,
        pekerjaan: formData.pekerjaan,
        alasan_daftar: formData.alasanDaftar,
      }

      const response = await fetch('/api/user/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle validation errors
        if (result.error?.details?.issues) {
          const validationErrors: Record<string, string> = {}
          result.error.details.issues.forEach((issue: any) => {
            validationErrors[issue.field] = issue.message
          })
          setErrors(validationErrors)
          setErrorMessage('Terdapat kesalahan pada form. Silakan periksa kembali.')
        } else {
          setErrorMessage(result.error?.message || result.error || 'Gagal memperbarui profil')
        }
        setSubmitStatus('error')
        return
      }

      setSubmitStatus('success')

      // Reset mode to view after success
      setTimeout(() => {
        setMode('view')
        // Reload page to show updated data
        window.location.reload()
      }, 1500)

    } catch (error) {
      console.error('Error submitting profile:', error)
      setErrorMessage('Terjadi kesalahan. Silakan coba lagi.')
      setSubmitStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setMode('view')
    setErrors({})
    setErrorMessage('')
  }

  // Calculate age
  const calculateAge = (dateString: string) => {
    if (!dateString) return '-'
    const birthDate = new Date(dateString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Profil <em>Ukhti</em>
            </h1>
            <p className="text-gray-600 text-sm">
              {mode === 'view' ? 'Lihat dan kelola data profil' : 'Edit data profil'}
            </p>
          </div>
          {mode === 'view' && (
            <Button
              onClick={() => setMode('edit')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profil
            </Button>
          )}
        </div>

        {submitStatus === 'success' && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Profil berhasil diperbarui!
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === 'error' && errorMessage && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {mode === 'view' ? (
          // VIEW MODE
          <div className="space-y-6">
            {/* Profile Header Card */}
            <Card className="p-6 bg-gradient-to-r from-green-900 to-green-800 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{formData.namaLengkap || '-'}</h2>
                  {formData.namaKunyah && (
                    <p className="text-green-100 text-sm">{formData.namaKunyah}</p>
                  )}
                  <p className="text-green-100 text-sm flex items-center mt-1">
                    <Mail className="h-3 w-3 mr-1" />
                    {user?.email || '-'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Profile Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pribadi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Tanggal Lahir"
                  value={formData.tanggalLahir ? new Date(formData.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                />
                <InfoItem
                  icon={<MapPin className="h-4 w-4" />}
                  label="Tempat Lahir"
                  value={formData.tempatLahir || '-'}
                />
                <InfoItem
                  icon={<User className="h-4 w-4" />}
                  label="Jenis Kelamin"
                  value={formData.jenisKelamin || '-'}
                />
                <InfoItem
                  icon={<Briefcase className="h-4 w-4" />}
                  label="Pekerjaan"
                  value={formData.pekerjaan || '-'}
                />
                <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Usia"
                  value={`${calculateAge(formData.tanggalLahir)} tahun`}
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  icon={<Phone className="h-4 w-4" />}
                  label="WhatsApp"
                  value={formData.whatsapp || '-'}
                />
                <InfoItem
                  icon={<Phone className="h-4 w-4" />}
                  label="Telegram"
                  value={formData.telegram || '-'}
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lokasi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  icon={<MapPin className="h-4 w-4" />}
                  label="Negara"
                  value={formData.negara || '-'}
                />
                {formData.negara === 'Indonesia' && (
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="Provinsi"
                    value={formData.provinsi || '-'}
                  />
                )}
                <InfoItem
                  icon={<MapPin className="h-4 w-4" />}
                  label="Kota"
                  value={formData.kota || '-'}
                />
                <div className="md:col-span-2">
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="Alamat Lengkap"
                    value={formData.alamat || '-'}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lainnya</h3>
              <div className="grid grid-cols-1 gap-4">
                <InfoItem
                  icon={<Clock className="h-4 w-4" />}
                  label="Zona Waktu"
                  value={formData.zonaWaktu || '-'}
                />
                <InfoItem
                  icon={<User className="h-4 w-4" />}
                  label="Alasan Mendaftar"
                  value={formData.alasanDaftar || '-'}
                />
              </div>
            </Card>
          </div>
        ) : (
          // EDIT MODE
          <Card className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nama Kunyah (Optional) */}
              <div>
                <Label htmlFor="namaKunyah">
                  Nama Kunyah <span className="text-gray-400 text-sm">(Opsional)</span>
                </Label>
                <Input
                  id="namaKunyah"
                  value={formData.namaKunyah}
                  onChange={(e) => handleInputChange('namaKunyah', e.target.value)}
                  placeholder="Contoh: Ummu Aisyah"
                />
              </div>

              {/* Nama Lengkap */}
              <div>
                <Label htmlFor="namaLengkap">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={(e) => handleInputChange('namaLengkap', e.target.value)}
                  placeholder="Nama lengkap sesuai KTP"
                  className={errors.namaLengkap ? 'border-red-500' : ''}
                />
                {errors.namaLengkap && (
                  <p className="text-red-500 text-sm mt-1">{errors.namaLengkap}</p>
                )}
              </div>

              {/* Tanggal & Tempat Lahir */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tanggalLahir">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tanggalLahir"
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => handleInputChange('tanggalLahir', e.target.value)}
                    className={errors.tanggalLahir ? 'border-red-500' : ''}
                  />
                  {errors.tanggalLahir && (
                    <p className="text-red-500 text-sm mt-1">{errors.tanggalLahir}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tempatLahir">
                    Tempat Lahir <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tempatLahir"
                    value={formData.tempatLahir}
                    onChange={(e) => handleInputChange('tempatLahir', e.target.value)}
                    placeholder="Kota tempat lahir"
                    className={errors.tempatLahir ? 'border-red-500' : ''}
                  />
                  {errors.tempatLahir && (
                    <p className="text-red-500 text-sm mt-1">{errors.tempatLahir}</p>
                  )}
                </div>
              </div>

              {/* Jenis Kelamin & Pekerjaan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jenisKelamin">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.jenisKelamin}
                    onValueChange={(value) => handleInputChange('jenisKelamin', value)}
                  >
                    <SelectTrigger className={errors.jenisKelamin ? 'border-red-500' : ''}>
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
                  <Label htmlFor="pekerjaan">
                    Pekerjaan <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pekerjaan"
                    value={formData.pekerjaan}
                    onChange={(e) => handleInputChange('pekerjaan', e.target.value)}
                    placeholder="Contoh: Guru, IRT, Mahasiswa"
                    className={errors.pekerjaan ? 'border-red-500' : ''}
                  />
                  {errors.pekerjaan && (
                    <p className="text-red-500 text-sm mt-1">{errors.pekerjaan}</p>
                  )}
                </div>
              </div>

              {/* Negara */}
              <div>
                <Label htmlFor="negara">
                  Negara <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.negara}
                  onValueChange={(value) => handleInputChange('negara', value)}
                >
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
                {errors.negara && (
                  <p className="text-red-500 text-sm mt-1">{errors.negara}</p>
                )}
              </div>

              {/* Provinsi (for Indonesia only) */}
              {formData.negara === 'Indonesia' && (
                <div>
                  <Label htmlFor="provinsi">Provinsi</Label>
                  <Select
                    value={formData.provinsi}
                    onValueChange={(value) => handleInputChange('provinsi', value)}
                  >
                    <SelectTrigger>
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
              )}

              {/* Kota & Alamat */}
              <div>
                <Label htmlFor="kota">
                  Kota <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="kota"
                  value={formData.kota}
                  onChange={(e) => handleInputChange('kota', e.target.value)}
                  placeholder="Kota tempat tinggal"
                  className={errors.kota ? 'border-red-500' : ''}
                />
                {errors.kota && (
                  <p className="text-red-500 text-sm mt-1">{errors.kota}</p>
                )}
              </div>

              <div>
                <Label htmlFor="alamat">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="alamat"
                  value={formData.alamat}
                  onChange={(e) => handleInputChange('alamat', e.target.value)}
                  placeholder="Alamat lengkap"
                  className={errors.alamat ? 'border-red-500' : ''}
                />
                {errors.alamat && (
                  <p className="text-red-500 text-sm mt-1">{errors.alamat}</p>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <Label htmlFor="whatsapp">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </Label>
                <div className={errors.whatsapp ? 'border border-red-500 rounded-md' : ''}>
                  <PhoneInput
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(value) => handleInputChange('whatsapp', value)}
                    placeholder="Contoh: 081234567890"
                    error={errors.whatsapp}
                  />
                </div>
                {errors.whatsapp && (
                  <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
                )}
              </div>

              {/* Telegram */}
              <div>
                <Label htmlFor="telegram">
                  Nomor Telegram <span className="text-gray-400 text-sm">(Opsional)</span>
                </Label>
                <div className={errors.telegram ? 'border border-red-500 rounded-md' : ''}>
                  <PhoneInput
                    id="telegram"
                    value={formData.telegram}
                    onChange={(value) => handleInputChange('telegram', value)}
                    placeholder="Contoh: 081234567890"
                    error={errors.telegram}
                  />
                </div>
                {errors.telegram && (
                  <p className="text-red-500 text-sm mt-1">{errors.telegram}</p>
                )}
              </div>

              {/* Zona Waktu */}
              <div>
                <Label htmlFor="zonaWaktu">
                  Zona Waktu <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.zonaWaktu}
                  onValueChange={(value) => handleInputChange('zonaWaktu', value)}
                >
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
                  <p className="text-red-500 text-sm mt-1">{errors.zonaWaktu}</p>
                )}
              </div>

              {/* Alasan Daftar */}
              <div>
                <Label htmlFor="alasanDaftar">
                  Alasan Mendaftar <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="alasanDaftar"
                  value={formData.alasanDaftar}
                  onChange={(e) => handleInputChange('alasanDaftar', e.target.value)}
                  placeholder="Ceritakan alasan Ukhti mendaftar"
                  className={errors.alasanDaftar ? 'border-red-500' : ''}
                />
                {errors.alasanDaftar && (
                  <p className="text-red-500 text-sm mt-1">{errors.alasanDaftar}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isLoading || submitStatus === 'success'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : submitStatus === 'success' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Berhasil!
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}

// Helper component for info items
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 text-green-900 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-900 break-words">{value}</p>
      </div>
    </div>
  )
}
