'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Clock, Users, ChevronRight, ChevronLeft, Info, Calendar } from 'lucide-react'
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
      if (!response.ok) throw new Error('Gagal memuat data')
      const data = await response.json()

      if (data.success) {
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
        toast.error(data.error || 'Gagal memuat data pendaftaran')
      }
    } catch (error) {
      console.error('Load initial data error:', error)
      toast.error('Terjadi kesalahan saat memuat data')
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
  }, [formData.partner_type, registrationData?.id])

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/daftar-ulang/partners')
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

  if (existingSubmission && existingSubmission.status === 'approved') {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto mb-4 text-blue-500" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pilihan Anda Sudah Disetujui</h2>
        <p className="text-gray-600 mb-8">Data pendaftaran dan halaqah Anda telah diverifikasi oleh admin. Anda tidak dapat mengubahnya lagi.</p>
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
                          </div>
                          
                          {halaqah.mentors && halaqah.mentors.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Muallimah:</span>{' '}
                              {halaqah.mentors.filter(m => m.role === 'muallimah').map(m => `Ustadzah ${m.users?.full_name}`).join(', ') || '-'}
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

              <div className="space-y-4">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer bg-white border-gray-200 hover:bg-gray-50">
                  <input type="radio" name="partner" value="system_match" checked={formData.partner_type === 'system_match'} onChange={() => setFormData(p => ({ ...p, partner_type: 'system_match' }))} className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900 block">Dipasangkan oleh Sistem (Tarteel)</span>
                    <span className="text-sm text-gray-500">Anda akan dipasangkan secara otomatis dengan peserta lain.</span>
                  </div>
                </label>

                <label className="flex items-center p-4 border rounded-lg cursor-pointer bg-white border-gray-200 hover:bg-gray-50">
                  <input type="radio" name="partner" value="self_match" checked={formData.partner_type === 'self_match'} onChange={() => setFormData(p => ({ ...p, partner_type: 'self_match' }))} className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900 block">Memilih Sendiri (Tarteel)</span>
                    <span className="text-sm text-gray-500">Cari dan pilih pasangan dari daftar peserta.</span>
                  </div>
                </label>

                <label className="flex items-center p-4 border rounded-lg cursor-pointer bg-white border-gray-200 hover:bg-gray-50">
                  <input type="radio" name="partner" value="family" checked={formData.partner_type === 'family'} onChange={() => setFormData(p => ({ ...p, partner_type: 'family' }))} className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900 block">Talaqqi Keluarga</span>
                    <span className="text-sm text-gray-500">Berpasangan dengan keluarga (Ibu, Anak, Saudara, dll).</span>
                  </div>
                </label>
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
                  <div className="max-h-60 overflow-y-auto bg-white rounded border">
                    {filteredPartners.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">Tidak ada peserta ditemukan</div>
                    ) : (
                      <div className="divide-y">
                        {filteredPartners.map((p) => (
                          <div
                            key={p.user_id}
                            onClick={() => setFormData(f => ({ ...f, partner_user_id: p.user_id, partner_name: p.users?.full_name }))}
                            className={`p-3 cursor-pointer hover:bg-purple-50 flex items-center justify-between
                              ${formData.partner_user_id === p.user_id ? 'bg-purple-100 text-purple-900 font-medium' : 'text-gray-700'}
                            `}
                          >
                            <span>{p.users?.full_name}</span>
                            {formData.partner_user_id === p.user_id && <CheckCircle className="w-4 h-4 text-purple-600" />}
                          </div>
                        ))}
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

              <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={() => setCurrentStep('halaqah')}>
                  <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.partner_type || isSubmitting || (formData.partner_type === 'self_match' && !formData.partner_user_id) || (formData.partner_type === 'family' && (!formData.partner_name || !formData.partner_relationship))}
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
