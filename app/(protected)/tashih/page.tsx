'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, MapPin, BookOpen, AlertCircle, Calendar, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface TashihData {
  blok: string
  lokasi: string
  lokasiDetail: string
  namaPemeriksa: string
  masalahTajwid: string[]
  catatanTambahan: string
  waktuTashih: string
}

interface TashihRecord {
  id: string
  blok: string
  lokasi: string
  lokasi_detail: string | null
  nama_pemeriksa: string | null
  masalah_tajwid: string[] | null
  catatan_tambahan: string | null
  waktu_tashih: string
  created_at: string
}

const blokOptions = [
  { id: 'H2a', name: 'H2a', description: 'Blok H2a' },
  { id: 'H2b', name: 'H2b', description: 'Blok H2b' },
  { id: 'H2c', name: 'H2c', description: 'Blok H2c' },
  { id: 'H2d', name: 'H2d', description: 'Blok H2d' }
]

const lokasiOptions = [
  { id: 'mti', name: 'MTI', description: 'Markaz Tikrar Indonesia' },
  { id: 'luar', name: 'Luar MTI', description: 'Di luar Markaz Tikrar Indonesia' }
]

const masalahTajwidOptions = [
  { id: 'mad', name: 'Mad', description: 'Masalah panjang pendek' },
  { id: 'qolqolah', name: 'Qolqolah', description: 'Masalah qolqolah' },
  { id: 'ghunnah', name: 'Ghunnah', description: 'Masalah ghunnah' },
  { id: 'ikhfa', name: 'Ikhfa', description: 'Masalah ikhfa' },
  { id: 'idghom', name: 'Idghom', description: 'Masalah idghom' },
  { id: 'izhar', name: 'Izhar', description: 'Masalah izhar' },
  { id: 'waqaf', name: 'Waqaf', description: 'Masalah waqaf dan ibtida' },
  { id: 'makhroj', name: 'Makhroj', description: 'Masalah makhroj huruf' },
  { id: 'sifat', name: 'Sifat', description: 'Masalah sifat huruf' },
  { id: 'lainnya', name: 'Lainnya', description: 'Masalah tajwid lainnya' }
]

export default function Tashih() {
  const router = useRouter()
  const [tashihData, setTashihData] = useState<TashihData>({
    blok: '',
    lokasi: '',
    lokasiDetail: '',
    namaPemeriksa: '',
    masalahTajwid: [],
    catatanTambahan: '',
    waktuTashih: new Date().toISOString().slice(0, 16)
  })

  const [todayRecord, setTodayRecord] = useState<TashihRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValid, setIsValid] = useState(false)

  // Load today's tashih record on mount
  useEffect(() => {
    loadTodayRecord()
  }, [])

  const loadTodayRecord = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get today's record
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('tashih_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('waktu_tashih', today)
        .order('waktu_tashih', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error loading tashih record:', error)
        toast.error('Gagal memuat data tashih')
        return
      }

      if (data && data.length > 0) {
        setTodayRecord(data[0])
        // Pre-fill form with today's record for editing
        setTashihData({
          blok: data[0].blok,
          lokasi: data[0].lokasi,
          lokasiDetail: data[0].lokasi_detail || '',
          namaPemeriksa: data[0].nama_pemeriksa || '',
          masalahTajwid: data[0].masalah_tajwid || [],
          catatanTambahan: data[0].catatan_tambahan || '',
          waktuTashih: new Date(data[0].waktu_tashih).toISOString().slice(0, 16)
        })
      }
    } catch (error) {
      console.error('Error loading tashih record:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const valid = !!(
      tashihData.blok &&
      tashihData.lokasi &&
      (tashihData.lokasi === 'luar' ? tashihData.namaPemeriksa && tashihData.lokasiDetail : true) &&
      tashihData.waktuTashih
    )
    setIsValid(valid)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Silakan login terlebih dahulu')
        return
      }

      const recordData = {
        user_id: user.id,
        blok: tashihData.blok,
        lokasi: tashihData.lokasi,
        lokasi_detail: tashihData.lokasi === 'luar' ? tashihData.lokasiDetail : null,
        nama_pemeriksa: tashihData.lokasi === 'luar' ? tashihData.namaPemeriksa : null,
        masalah_tajwid: tashihData.masalahTajwid,
        catatan_tambahan: tashihData.catatanTambahan || null,
        waktu_tashih: new Date(tashihData.waktuTashih).toISOString()
      }

      let error

      if (todayRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('tashih_records')
          .update(recordData)
          .eq('id', todayRecord.id)
          .select()
          .single()

        error = updateError
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('tashih_records')
          .insert(recordData)
          .select()
          .single()

        error = insertError
      }

      if (error) {
        console.error('Error saving tashih record:', error)
        toast.error('Gagal menyimpan data tashih: ' + error.message)
        return
      }

      toast.success('Tashih berhasil disimpan!')
      await loadTodayRecord() // Reload to get the updated record
    } catch (error) {
      console.error('Error saving tashih:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTashihData({
      blok: '',
      lokasi: '',
      lokasiDetail: '',
      namaPemeriksa: '',
      masalahTajwid: [],
      catatanTambahan: '',
      waktuTashih: new Date().toISOString().slice(0, 16)
    })
    setTodayRecord(null)
    setIsValid(false)
  }

  const toggleMasalahTajwid = (masalahId: string) => {
    setTashihData(prev => ({
      ...prev,
      masalahTajwid: prev.masalahTajwid.includes(masalahId)
        ? prev.masalahTajwid.filter(id => id !== masalahId)
        : [...prev.masalahTajwid, masalahId]
    }))
  }

  useEffect(() => {
    validateForm()
  }, [tashihData])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-army" />
      </div>
    )
  }

  if (todayRecord) {
    return (
      <div className="space-y-6 animate-fadeInUp">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-army mb-2">Tashih Selesai!</h1>
          <p className="text-gray-600 mb-6">
            Tashih bacaan Ukhti telah berhasil dicatat untuk hari ini
          </p>
          <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-800 mb-3">Detail Tashih:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Blok:</span>
                <span className="font-medium">{todayRecord.blok}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lokasi:</span>
                <span className="font-medium">{todayRecord.lokasi === 'mti' ? 'MTI' : 'Luar MTI'}</span>
              </div>
              {todayRecord.lokasi === 'luar' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Detail Lokasi:</span>
                    <span className="font-medium">{todayRecord.lokasi_detail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pemeriksa:</span>
                    <span className="font-medium">{todayRecord.nama_pemeriksa}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Waktu:</span>
                <span className="font-medium">
                  {new Date(todayRecord.waktu_tashih).toLocaleString('id-ID')}
                </span>
              </div>
              {todayRecord.masalah_tajwid && todayRecord.masalah_tajwid.length > 0 && (
                <div>
                  <span className="text-gray-600">Masalah Tajwid:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {todayRecord.masalah_tajwid.map(masalahId => {
                      const masalah = masalahTajwidOptions.find(m => m.id === masalahId)
                      return (
                        <span key={masalahId} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                          {masalah?.name}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
              {todayRecord.catatan_tambahan && (
                <div>
                  <span className="text-gray-600">Catatan:</span>
                  <p className="mt-1 text-gray-700">{todayRecord.catatan_tambahan}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Perbarui Tashih
            </Button>
            <Link href="/jurnal-harian" className="flex-1">
              <Button className="w-full bg-green-army hover:bg-green-700">
                Lanjut ke Jurnal Harian
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-army">Tashih Bacaan</h1>
          <p className="text-gray-600 mt-1">Validasi bacaan Al-Quran Ukhti</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <AlertCircle className="h-4 w-4" />
            <span>Prasyarat wajib sebelum jurnal harian</span>
          </div>
        </div>
      </div>

      {/* Progress Status */}
      <Card className={cn(
        "border-2",
        todayRecord ? "border-green-300 bg-green-50" : "border-orange-300 bg-orange-50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              todayRecord ? "bg-green-500" : "bg-orange-500"
            )}>
              {todayRecord ? (
                <CheckCircle className="h-5 w-5 text-white" />
              ) : (
                <Clock className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">
                {todayRecord ? 'Tashih Hari Ini Selesai' : 'Tashih Hari Ini Belum Selesai'}
              </h3>
              <p className="text-sm text-gray-600">
                {todayRecord
                  ? 'Ukhti dapat melanjutkan ke jurnal harian'
                  : 'Lakukan tashih terlebih dahulu sebelum mengisi jurnal harian'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Blok Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-army" />
              <span>Pilih Blok yang Ditashih</span>
            </CardTitle>
            <CardDescription>
              Pilih blok hafalan yang telah Ukhti tashih hari ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {blokOptions.map((blok) => (
                <div
                  key={blok.id}
                  onClick={() => setTashihData(prev => ({ ...prev, blok: blok.id }))}
                  className={cn(
                    "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:border-green-300 hover:bg-green-50",
                    tashihData.blok === blok.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  )}
                >
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{blok.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{blok.description}</p>
                    {tashihData.blok === blok.id && (
                      <div className="mt-2 text-green-600">
                        <CheckCircle className="h-5 w-5 mx-auto" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gold" />
              <span>Lokasi Tashih</span>
            </CardTitle>
            <CardDescription>
              Pilih lokasi Ukhti melakukan tashih bacaan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lokasiOptions.map((lokasi) => (
                <div
                  key={lokasi.id}
                  onClick={() => setTashihData(prev => ({ ...prev, lokasi: lokasi.id }))}
                  className={cn(
                    "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:border-gold hover:bg-yellow-50",
                    tashihData.lokasi === lokasi.id
                      ? "border-gold bg-yellow-50"
                      : "border-gray-200"
                  )}
                >
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{lokasi.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{lokasi.description}</p>
                    {tashihData.lokasi === lokasi.id && (
                      <div className="mt-2 text-yellow-600">
                        <CheckCircle className="h-5 w-5 mx-auto" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {tashihData.lokasi === 'luar' && (
              <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-800">Detail Lokasi Luar MTI</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lembaga/Tempat
                  </label>
                  <input
                    type="text"
                    value={tashihData.lokasiDetail}
                    onChange={(e) => setTashihData(prev => ({ ...prev, lokasiDetail: e.target.value }))}
                    placeholder="Contoh: Masjid Al-Hikmah, Rumah Ustadz Ahmad"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-army"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Pemeriksa
                  </label>
                  <input
                    type="text"
                    value={tashihData.namaPemeriksa}
                    onChange={(e) => setTashihData(prev => ({ ...prev, namaPemeriksa: e.target.value }))}
                    placeholder="Nama ustadz/ah yang memeriksa bacaan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-army"
                    required
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span>Waktu Tashih</span>
            </CardTitle>
            <CardDescription>
              Kapan Ukhti melakukan tashih bacaan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="datetime-local"
              value={tashihData.waktuTashih}
              onChange={(e) => setTashihData(prev => ({ ...prev, waktuTashih: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-army"
              required
            />
          </CardContent>
        </Card>

        {/* Tajwid Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Masalah Tajwid yang Ditemukan</CardTitle>
            <CardDescription>
              Pilih masalah tajwid yang perlu diperbaiki (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {masalahTajwidOptions.map((masalah) => (
                <div
                  key={masalah.id}
                  onClick={() => toggleMasalahTajwid(masalah.id)}
                  className={cn(
                    "p-3 border-2 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:border-orange-300 hover:bg-orange-50",
                    tashihData.masalahTajwid.includes(masalah.id)
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200"
                  )}
                >
                  <div className="text-center">
                    <h4 className="font-medium">{masalah.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{masalah.description}</p>
                    {tashihData.masalahTajwid.includes(masalah.id) && (
                      <div className="mt-2 text-orange-600">
                        <CheckCircle className="h-4 w-4 mx-auto" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Catatan Tambahan</CardTitle>
            <CardDescription>
              Catatan khusus tentang tashih hari ini (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={tashihData.catatanTambahan}
              onChange={(e) => setTashihData(prev => ({ ...prev, catatanTambahan: e.target.value }))}
              placeholder="Tambahkan catatan penting tentang tashih bacaan hari ini..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-army"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full" type="button">
              Kembali ke Dashboard
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex-1 bg-green-army hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : 'Simpan Tashih'}
          </Button>
        </div>
      </form>
    </div>
  )
}
