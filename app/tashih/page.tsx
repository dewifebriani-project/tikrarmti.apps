'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, MapPin, BookOpen, AlertCircle, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'

interface TashihData {
  blok: string
  lokasi: string
  lokasiDetail: string
  namaPemeriksa: string
  masalahTajwid: string[]
  catatanTambahan: string
  waktuTashih: string
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
  const [tashihData, setTashihData] = useState<TashihData>({
    blok: '',
    lokasi: '',
    lokasiDetail: '',
    namaPemeriksa: '',
    masalahTajwid: [],
    catatanTambahan: '',
    waktuTashih: new Date().toISOString().slice(0, 16)
  })

  const [isCompleted, setIsCompleted] = useState(false)
  const [isValid, setIsValid] = useState(false)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Save to localStorage
      const tashihRecords = JSON.parse(localStorage.getItem('mti-tashih-records') || '[]')
      const newRecord = {
        id: Date.now().toString(),
        ...tashihData,
        createdAt: new Date().toISOString()
      }
      tashihRecords.push(newRecord)
      localStorage.setItem('mti-tashih-records', JSON.stringify(tashihRecords))

      // Mark as completed for today
      const today = new Date().toDateString()
      localStorage.setItem('mti-tashih-completed', today)

      setIsCompleted(true)
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
    setIsCompleted(false)
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

  React.useEffect(() => {
    validateForm()
  }, [tashihData])

  // Check if already completed today
  React.useEffect(() => {
    const today = new Date().toDateString()
    const completedToday = localStorage.getItem('mti-tashih-completed')
    if (completedToday === today) {
      setIsCompleted(true)
    }
  }, [])

  if (isCompleted) {
    return (
      <AuthenticatedLayout title="Tashih Bacaan">
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
                <span className="font-medium">{tashihData.blok}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lokasi:</span>
                <span className="font-medium">{tashihData.lokasi === 'mti' ? 'MTI' : 'Luar MTI'}</span>
              </div>
              {tashihData.lokasi === 'luar' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Detail Lokasi:</span>
                    <span className="font-medium">{tashihData.lokasiDetail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pemeriksa:</span>
                    <span className="font-medium">{tashihData.namaPemeriksa}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Waktu:</span>
                <span className="font-medium">
                  {new Date(tashihData.waktuTashih).toLocaleString('id-ID')}
                </span>
              </div>
              {tashihData.masalahTajwid.length > 0 && (
                <div>
                  <span className="text-gray-600">Masalah Tajwid:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tashihData.masalahTajwid.map(masalahId => {
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
              {tashihData.catatanTambahan && (
                <div>
                  <span className="text-gray-600">Catatan:</span>
                  <p className="mt-1 text-gray-700">{tashihData.catatanTambahan}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Tashih Lagi
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
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout title="Tashih Bacaan">
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
        isCompleted ? "border-green-300 bg-green-50" : "border-orange-300 bg-orange-50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isCompleted ? "bg-green-500" : "bg-orange-500"
            )}>
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-white" />
              ) : (
                <Clock className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">
                {isCompleted ? 'Tashih Hari Ini Selesai' : 'Tashih Hari Ini Belum Selesai'}
              </h3>
              <p className="text-sm text-gray-600">
                {isCompleted
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
            <Button variant="outline" className="w-full">
              Kembali ke Dashboard
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!isValid}
            className="flex-1 bg-green-army hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simpan Tashih
          </Button>
        </div>
      </form>
    </div>
    </AuthenticatedLayout>
  )
}