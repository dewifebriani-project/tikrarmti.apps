'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Clock, Users, ChevronRight, ChevronLeft, Info, Calendar, Upload } from 'lucide-react'
import { submitPilihPasangan } from './actions'

interface HalaqahData {
  id: string
  name: string
  description: string | null
  day_of_week: number | null
  start_time: string | null
  end_time: string | null
  location: string | null
  total_current_students: number
  total_max_students: number
  available_slots: number
  is_full: boolean
  class_type: string
  class_types: Array<{
    class_type: string
    label: string
  }>
  muallimah_preferred_juz: string | null
  muallimah_schedule: string | null
  mentors: Array<{
    mentor_id: string
    role: string
    is_primary: boolean
    users: {
      full_name: string
    } | null
  }>
}

type Step = 'halaqah' | 'partner'

export default function PilihPasanganPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const batchId = searchParams.get('batchId')

  const [currentStep, setCurrentStep] = useState<Step>('halaqah')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [halaqahData, setHalaqahData] = useState<HalaqahData[]>([])
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [existingSubmission, setExistingSubmission] = useState<any>(null)
  
  const [partners, setPartners] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    ujian_halaqah_id: '',
    tashih_halaqah_id: '',
    partner_type: '' as 'self_match' | 'system_match' | 'family' | 'tarteel' | '',
    partner_user_id: '',
    partner_name: '',
    partner_relationship: '',
    partner_wa_phone: '',
    partner_notes: '',
  })

  const loadInitialData = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/daftar-ulang/data${batchId ? `?batchId=${batchId}` : ''}`)
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Gagal memuat data dari server');
      }

      if (response.ok && data.success) {
        setRegistrationData(data.data.registration)
        setHalaqahData(data.data.halaqah || [])
        setExistingSubmission(data.data.existingSubmission)

        if (data.data.existingSubmission) {
          setFormData(prev => ({
            ...prev,
            ujian_halaqah_id: data.data.existingSubmission.ujian_halaqah_id || '',
            tashih_halaqah_id: data.data.existingSubmission.tashih_halaqah_id || '',
            partner_type: data.data.existingSubmission.partner_type || '',
            partner_user_id: data.data.existingSubmission.partner_user_id || '',
            partner_name: data.data.existingSubmission.partner_name || '',
            partner_relationship: data.data.existingSubmission.partner_relationship || '',
            partner_wa_phone: data.data.existingSubmission.partner_wa_phone || '',
            partner_notes: data.data.existingSubmission.partner_notes || '',
          }))
        }
      } else {
        const errorMessage = typeof data.error === 'object' ? data.error.message : data.error;
        toast.error(errorMessage || 'Gagal memuat data pendaftaran')
        router.push('/perjalanan-saya')
      }
    } catch (error: any) {
      console.error('Load initial data error:', error)
      toast.error(error.message || 'Terjadi kesalahan saat memuat data')
      router.push('/perjalanan-saya')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, batchId])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadInitialData()
    }
  }, [isAuthenticated, user?.id, loadInitialData])

  useEffect(() => {
    if (formData.partner_type === 'self_match' && registrationData?.id) {
      fetchPartners()
    }
  }, [formData.partner_type, registrationData?.id, batchId])

  const fetchPartners = async () => {
    try {
      const response = await fetch(`/api/daftar-ulang/partners${batchId ? `?batchId=${batchId}` : ''}`)
      if (response.ok) {
        const data = await response.json()
        setPartners(data.data?.all_available_partners || [])
      }
    } catch (error) {
      console.error('Fetch partners error:', error)
    }
  }

  const handleSubmit = async () => {
    if (!registrationData?.id) return

    setIsSubmitting(true)
    try {
      const result = await submitPilihPasangan(registrationData.id, formData as any)
      
      if (result.success) {
        toast.success(result.message)
        router.push('/perjalanan-saya')
      } else {
        toast.error(result.error)
      }
    } catch (error: any) {
      toast.error(error?.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !registrationData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  const isLocked = () => {
    if (!registrationData?.batch?.opening_class_date) return false;
    const openingDate = new Date(registrationData.batch.opening_class_date);
    openingDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today >= openingDate;
  };

  if (isLocked() && existingSubmission?.ujian_halaqah_id) {
    const chosenHalaqah = halaqahData.find(h => h.id === existingSubmission.ujian_halaqah_id)
    
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-blue-100" />
            <h2 className="text-2xl font-bold mb-2">Pilihan Anda Telah Terkunci</h2>
            <p className="text-blue-100 opacity-90">
              Masa belajar telah dimulai. Anda tidak dapat mengubah pilihan halaqah dan pasangan lagi.
            </p>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="space-y-6">
              <div className="bg-gray-50 border rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">Detail Pilihan Anda</h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500 block mb-1">Halaqah</span>
                    <div className="font-medium text-gray-900">{chosenHalaqah?.name || '-'}</div>
                    {(chosenHalaqah?.muallimah_schedule || (chosenHalaqah?.day_of_week !== null && chosenHalaqah?.start_time && chosenHalaqah?.end_time)) && (
                      <div className="text-sm text-gray-600 mt-1 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-amber-600" />
                        {(() => {
                          if (chosenHalaqah.muallimah_schedule) {
                            try {
                              const schedule = JSON.parse(chosenHalaqah.muallimah_schedule)
                              return `${schedule.day} • ${schedule.time_start} - ${schedule.time_end} WIB`
                            } catch {
                              return chosenHalaqah.muallimah_schedule
                            }
                          }
                          if (chosenHalaqah.day_of_week !== null && chosenHalaqah.start_time && chosenHalaqah.end_time) {
                            const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']
                            return `${DAY_NAMES[chosenHalaqah.day_of_week]} • ${chosenHalaqah.start_time} - ${chosenHalaqah.end_time} WIB`
                          }
                          return '-'
                        })()}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-500 block mb-1">Pasangan Belajar</span>
                    <div className="font-medium text-gray-900">
                      {existingSubmission.partner_type === 'system_match' && 'Dipasangkan oleh Sistem'}
                      {existingSubmission.partner_type === 'self_match' && (existingSubmission.partner_name || 'Memilih Sendiri')}
                      {existingSubmission.partner_type === 'family' && `${existingSubmission.partner_name} (${existingSubmission.partner_relationship})`}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button onClick={() => router.push('/perjalanan-saya')} className="bg-emerald-600 hover:bg-emerald-700">
                  Kembali ke Perjalanan Saya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLocked() && !existingSubmission?.ujian_halaqah_id) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Masa Pemilihan Telah Berakhir</h2>
        <p className="text-gray-600 mb-8">Masa belajar telah dimulai. Anda terlambat memilih halaqah dan pasangan. Silakan hubungi admin.</p>
        <Button onClick={() => router.push('/perjalanan-saya')} className="bg-emerald-600 hover:bg-emerald-700">
          Kembali ke Perjalanan Saya
        </Button>
      </div>
    )
  }

  // UI Helpers
  const getClassTypeColor = (classType: string) => {
    switch (classType) {
      case 'tashih_ujian': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }
  const getClassTypeLabel = (classType: string) => {
    switch (classType) {
      case 'tashih_ujian': return 'Tashih + Ujian'
      default: return classType
    }
  }

  const sortedHalaqahData = halaqahData.filter(h => h.class_type === 'tashih_ujian')
  
  const filteredPartners = partners.filter((partner) => {
    const fullName = partner.users?.full_name || ''
    return fullName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card className="shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Pilih Halaqah & Pasangan</h1>
              <p className="text-emerald-50 text-lg opacity-90">
                Tahap 3: Memilih jadwal dan pasangan belajar
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-black/20 rounded-lg p-2 backdrop-blur-sm">
              <div className={`px-4 py-2 rounded-md flex items-center ${currentStep === 'halaqah' ? 'bg-white text-emerald-700 font-semibold shadow-sm' : 'text-emerald-100'}`}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2 border border-current">1</span>
                Halaqah
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-200" />
              <div className={`px-4 py-2 rounded-md flex items-center ${currentStep === 'partner' ? 'bg-white text-emerald-700 font-semibold shadow-sm' : 'text-emerald-100'}`}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2 border border-current">2</span>
                Pasangan
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6 md:p-8">
          {currentStep === 'halaqah' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-6 text-white mb-6">
                <h2 className="text-2xl font-bold mb-2">Pilih Jadwal Halaqah</h2>
                <p className="text-emerald-50">Pilih jadwal untuk kelas ujian dan tashih. Waktu yang ditampilkan dalam WIB.</p>
              </div>

              <div className="space-y-4">
                {sortedHalaqahData.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <Info className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-yellow-900 mb-2">Belum Ada Jadwal Halaqah</h3>
                    <p className="text-sm text-yellow-700">Jadwal halaqah belum tersedia. Silakan hubungi admin.</p>
                  </div>
                ) : (
                  sortedHalaqahData.map(halaqah => {
                    const selected = formData.ujian_halaqah_id === halaqah.id
                    return (
                      <div
                        key={halaqah.id}
                        onClick={() => !halaqah.is_full && setFormData(p => ({ ...p, ujian_halaqah_id: halaqah.id, tashih_halaqah_id: halaqah.id }))}
                        className={`relative border-2 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md cursor-pointer
                          ${halaqah.is_full && !selected ? 'bg-gray-50 border-gray-300 opacity-75' : 'bg-white border-gray-200 hover:border-emerald-300'}
                          ${selected ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}
                        `}
                      >
                        <div className={`absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white z-10 ${selected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                          {selected && <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                        </div>
                        <div className={`px-4 py-3 flex items-center justify-between ${selected ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-gray-50 to-gray-100'}`}>
                          <div className="flex items-center space-x-3">
                            <h4 className={`font-semibold ${selected ? 'text-white' : 'text-gray-900'}`}>{halaqah.name}</h4>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getClassTypeColor(halaqah.class_type)}`}>
                              {getClassTypeLabel(halaqah.class_type)}
                            </span>
                            {halaqah.is_full && <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">Penuh</span>}
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            {(halaqah.muallimah_schedule || (halaqah.day_of_week !== null && halaqah.start_time && halaqah.end_time)) && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="w-4 h-4 text-amber-600" />
                                <span className="text-gray-700">
                                  {(() => {
                                    if (halaqah.muallimah_schedule) {
                                      try {
                                        const schedule = JSON.parse(halaqah.muallimah_schedule)
                                        return `${schedule.day} • ${schedule.time_start} - ${schedule.time_end} WIB`
                                      } catch {
                                        return halaqah.muallimah_schedule
                                      }
                                    }
                                    if (halaqah.day_of_week !== null && halaqah.start_time && halaqah.end_time) {
                                      const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']
                                      return `${DAY_NAMES[halaqah.day_of_week]} • ${halaqah.start_time} - ${halaqah.end_time} WIB`
                                    }
                                    return '-'
                                  })()}
                                </span>
                              </div>
                            )}

                            {halaqah.muallimah_preferred_juz && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Info className="w-4 h-4 text-green-600" />
                                <span className="text-gray-700">Juz: {halaqah.muallimah_preferred_juz}</span>
                              </div>
                            )}

                            {halaqah.total_max_students !== undefined && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-700">
                                  Sisa Kuota: <span className="font-medium">{halaqah.available_slots}</span> dari <span className="font-medium">{halaqah.total_max_students}</span>
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {halaqah.mentors && halaqah.mentors.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Muallimah:</span>{' '}
                              {halaqah.mentors.filter((m: any) => m.role === 'muallimah' || m.role === 'ustadzah').map((m: any) => `Ustadzah ${m.users?.full_name}`).join(', ') || '-'}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={() => setCurrentStep('partner')}
                  disabled={!formData.ujian_halaqah_id}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Selanjutnya <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'partner' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white mb-6">
                <h2 className="text-2xl font-bold mb-2">Pilih Pasangan Belajar</h2>
                <p className="text-purple-50">Silakan pilih skema pasangan belajar.</p>
              </div>

                {/* System Match */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    formData.partner_type === 'system_match'
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(p => ({ ...p, partner_type: 'system_match', partner_user_id: '', partner_name: '', partner_relationship: '', partner_wa_phone: '', partner_notes: '' }))}
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg mt-0.5">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Dipasangkan oleh Sistem</h3>
                      <p className="text-sm text-gray-500 mt-1">Anda akan dipasangkan secara otomatis dengan peserta lain berdasarkan jadwal utama, zona waktu, dan juz.</p>
                    </div>
                    <input
                      type="radio"
                      checked={formData.partner_type === 'system_match'}
                      readOnly
                      className="w-5 h-5 text-purple-600 mt-2"
                    />
                  </div>
                </div>

                {/* Self Match */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    formData.partner_type === 'self_match'
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(p => ({ ...p, partner_type: 'self_match', partner_user_id: '', partner_name: '', partner_relationship: '', partner_wa_phone: '', partner_notes: '' }))}
                >
                  <div className="flex items-start space-x-3">
                    <Users className="w-6 h-6 text-purple-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Memilih Sendiri</h3>
                      <p className="text-sm text-gray-500 mt-1">Cari dan pilih pasangan dari daftar peserta yang tersedia dan cocok dengan Anda.</p>
                    </div>
                    <input
                      type="radio"
                      checked={formData.partner_type === 'self_match'}
                      readOnly
                      className="w-5 h-5 text-purple-600 mt-2"
                    />
                  </div>
                </div>

                {/* Family */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    formData.partner_type === 'family'
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(p => ({ ...p, partner_type: 'family', partner_user_id: '', partner_name: '', partner_relationship: '', partner_wa_phone: '', partner_notes: '' }))}
                >
                  <div className="flex items-start space-x-3">
                    <Users className="w-6 h-6 text-purple-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Keluarga (Mahram)</h3>
                      <p className="text-sm text-gray-500 mt-1">Setoran kepada keluarga (Ayah, Ibu, anak, atau saudara mahram).</p>
                    </div>
                    <input
                      type="radio"
                      checked={formData.partner_type === 'family'}
                      readOnly
                      className="w-5 h-5 text-purple-600 mt-2"
                    />
                  </div>

                  {formData.partner_type === 'family' && (
                    <div className="mt-4 space-y-3 pl-9">
                      <input
                        type="text"
                        placeholder="Nama lengkap keluarga"
                        value={formData.partner_name}
                        onChange={e => setFormData(p => ({ ...p, partner_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                      <select
                        value={formData.partner_relationship}
                        onChange={e => setFormData(p => ({ ...p, partner_relationship: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Pilih hubungan</option>
                        <option value="ayah">Ayah</option>
                        <option value="ibu">Ibu</option>
                        <option value="suami">Suami</option>
                        <option value="anak">Anak</option>
                        <option value="saudara">Saudara (Mahram)</option>
                        <option value="lainnya">Lainnya</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Nomor WhatsApp keluarga (opsional)"
                        value={formData.partner_wa_phone}
                        onChange={e => setFormData(p => ({ ...p, partner_wa_phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                      <textarea
                        placeholder="Catatan tambahan (opsional)"
                        value={formData.partner_notes}
                        onChange={e => setFormData(p => ({ ...p, partner_notes: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>

                {/* Tarteel */}
                <div
                  className={`border rounded-lg p-4 transition-all ${
                    !((registrationData?.oral_total_score ?? (registrationData as any)?.oral_score ?? 0) >= 90)
                      ? 'border-gray-100 bg-gray-50/50 cursor-not-allowed opacity-60' 
                      : formData.partner_type === 'tarteel'
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500 cursor-pointer'
                      : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                  onClick={() => {
                    const oralScore = registrationData?.oral_total_score ?? (registrationData as any)?.oral_score ?? 0;
                    if (oralScore >= 90) {
                      setFormData(p => ({ ...p, partner_type: 'tarteel', partner_user_id: '', partner_name: '', partner_relationship: '', partner_wa_phone: '', partner_notes: '' }))
                    } else {
                      toast.error('Pilihan Tarteel hanya tersedia untuk thalibah dengan nilai seleksi lisan minimal 90.')
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <Upload className="w-6 h-6 text-orange-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        Aplikasi Tarteel
                        {!((registrationData?.oral_total_score ?? (registrationData as any)?.oral_score ?? 0) >= 90) && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
                            Nilai &lt; 90
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Setoran mandiri menggunakan aplikasi Tarteel dengan lampiran screenshot penggunaan.</p>
                      {!((registrationData?.oral_total_score ?? (registrationData as any)?.oral_score ?? 0) >= 90) && (
                        <p className="text-xs text-red-600 mt-2 font-semibold">
                          *Hanya untuk thalibah dengan nilai seleksi lisan minimal 90 (Nilai seleksi Anda: {registrationData?.oral_total_score ?? (registrationData as any)?.oral_score ?? 0})
                        </p>
                      )}
                    </div>
                    <input
                      type="radio"
                      checked={formData.partner_type === 'tarteel'}
                      disabled={!((registrationData?.oral_total_score ?? (registrationData as any)?.oral_score ?? 0) >= 90)}
                      readOnly
                      className="w-5 h-5 text-purple-600 mt-2"
                    />
                  </div>

                  {((registrationData?.oral_total_score ?? (registrationData as any)?.oral_score ?? 0) >= 90) && formData.partner_type === 'tarteel' && (
                    <div className="mt-4 space-y-3 pl-9">
                      <input
                        type="text"
                        placeholder="Username atau nama di aplikasi Tarteel"
                        value={formData.partner_name}
                        onChange={e => setFormData(p => ({ ...p, partner_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                      <textarea
                        placeholder="Catatan tambahan (opsional)"
                        value={formData.partner_notes}
                        onChange={e => setFormData(p => ({ ...p, partner_notes: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>

              {formData.partner_type === 'self_match' && (
                <div className="bg-purple-50 rounded-lg p-5 border border-purple-100">
                  <h3 className="font-medium text-purple-900 mb-4">Cari Pasangan</h3>
                  <input
                    type="text"
                    placeholder="Ketik nama untuk mencari..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 mb-4"
                  />
                  <div className="max-h-[500px] overflow-y-auto mt-4 pr-2">
                    {filteredPartners.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 bg-white rounded-lg border">
                        {searchQuery ? 'Tidak ada peserta dengan nama tersebut.' : 'Tidak ada peserta yang tersedia.'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPartners.map((p) => {
                          const reg = p.registrations?.[0]
                          
                          // Calculate age
                          let ageText = '-'
                          if (reg?.birth_date) {
                            const today = new Date()
                            const birthDate = new Date(reg.birth_date)
                            let age = today.getFullYear() - birthDate.getFullYear()
                            const m = today.getMonth() - birthDate.getMonth()
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                              age--
                            }
                            ageText = `${age} thn`
                          }

                          const formatTimeSlot = (slot: string) => {
                            const slots: Record<string, string> = {
                              'pagi_1': 'Pagi (05:00-07:00)', 'pagi_2': 'Pagi (07:00-09:00)', 'pagi_3': 'Pagi (09:00-11:30)',
                              'siang_1': 'Siang (12:30-14:30)', 'sore_1': 'Sore (15:30-17:30)',
                              'malam_1': 'Malam (18:30-20:30)', 'malam_2': 'Malam (20:30-22:30)'
                            }
                            return slots[slot] || slot
                          }

                          return (
                            <div
                              key={p.user_id}
                              onClick={() => setFormData(f => ({ ...f, partner_user_id: p.user_id, partner_name: p.users?.full_name }))}
                              className={`relative p-4 border rounded-xl cursor-pointer transition-all flex flex-col justify-between hover:shadow-md
                                ${formData.partner_user_id === p.user_id ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'bg-white border-gray-200 hover:border-purple-300'}
                              `}
                            >
                              <div className="absolute top-3 right-3 flex flex-col items-end space-y-1">
                                {formData.partner_user_id === p.user_id && (
                                  <div className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center space-x-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Dipilih</span>
                                  </div>
                                )}
                                {p.has_user_selected_them && (
                                  <div className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                                    Memilih Anda
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-lg">
                                    {p.users?.full_name?.charAt(0) || '?'}
                                  </div>
                                  <div className="pr-16">
                                    <h4 className="font-semibold text-gray-900 leading-tight">
                                      {p.users?.full_name}
                                    </h4>
                                    <p className="text-xs text-gray-500">{ageText} • {reg?.domicile || 'Lokasi tidak diketahui'}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                  <div className={`rounded p-2 border ${p.juz_compatible ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'}`}>
                                    <span className="block text-gray-500 mb-1">Juz Pilihan</span>
                                    <span className={`font-medium ${p.juz_compatible ? 'text-green-700' : 'text-gray-900'}`}>{reg?.chosen_juz || '-'}</span>
                                    {p.juz_compatible && <span className="text-[10px] text-green-600 block mt-0.5">Sama dengan Anda</span>}
                                  </div>
                                  <div className="bg-gray-50 rounded p-2 border border-transparent">
                                    <span className="block text-gray-500 mb-1">Zona Waktu</span>
                                    <span className="font-medium text-gray-900">{reg?.timezone || 'WIB'}</span>
                                  </div>
                                  <div className={`rounded p-2 col-span-2 border ${p.schedule_compatible ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'}`}>
                                    <span className="block text-gray-500 mb-1">Ketersediaan Waktu</span>
                                    <span className={`font-medium ${p.schedule_compatible ? 'text-green-700' : 'text-gray-900'}`}>
                                      {reg?.main_time_slot ? formatTimeSlot(reg.main_time_slot) : '-'}
                                    </span>
                                    {reg?.backup_time_slot && (
                                      <span className="block text-gray-500 mt-1">
                                        Alt: {formatTimeSlot(reg.backup_time_slot)}
                                      </span>
                                    )}
                                    {p.schedule_compatible && <span className="text-[10px] text-green-600 block mt-0.5">Jadwal cocok dengan Anda</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formData.partner_type === 'family' && (
                <div className="bg-purple-50 rounded-lg p-5 border border-purple-100 space-y-4">
                  <h3 className="font-medium text-purple-900">Data Keluarga</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Keluarga</label>
                    <input type="text" value={formData.partner_name} onChange={e => setFormData(f => ({ ...f, partner_name: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hubungan</label>
                    <select value={formData.partner_relationship} onChange={e => setFormData(f => ({ ...f, partner_relationship: e.target.value }))} className="w-full px-4 py-2 border rounded-lg">
                      <option value="">Pilih Hubungan</option>
                      <option value="Ibu">Ibu</option>
                      <option value="Anak">Anak</option>
                      <option value="Saudari">Saudari</option>
                      <option value="Nenek">Nenek</option>
                      <option value="Bibi">Bibi</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">WhatsApp</label>
                    <input type="text" value={formData.partner_wa_phone} onChange={e => setFormData(f => ({ ...f, partner_wa_phone: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>
              )}

              {formData.partner_type === 'tarteel' && (
                <div className="bg-purple-50 rounded-lg p-5 border border-purple-100 space-y-4">
                  <h3 className="font-medium text-purple-900">Data Akun Tarteel</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Username / Nama di Aplikasi Tarteel</label>
                    <input type="text" value={formData.partner_name} onChange={e => setFormData(f => ({ ...f, partner_name: e.target.value }))} className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500" placeholder="Masukkan nama profil Tarteel Anda" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Catatan Tambahan (Opsional)</label>
                    <textarea value={formData.partner_notes} onChange={e => setFormData(f => ({ ...f, partner_notes: e.target.value }))} className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500" rows={2} placeholder="Tambahkan catatan jika ada" />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={() => setCurrentStep('halaqah')}>
                  <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.partner_type || isSubmitting || (formData.partner_type === 'self_match' && !formData.partner_user_id) || (formData.partner_type === 'family' && (!formData.partner_name || !formData.partner_relationship)) || (formData.partner_type === 'tarteel' && !formData.partner_name)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? 'Memproses...' : 'Simpan & Selesai'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CheckCircle(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
