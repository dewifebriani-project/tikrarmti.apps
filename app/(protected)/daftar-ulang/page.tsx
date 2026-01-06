'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle, AlertCircle, Clock, Users, Calendar, Upload, ChevronRight, ChevronLeft, Info } from 'lucide-react'
import { submitDaftarUlang, saveDaftarUlangDraft, uploadAkad } from './actions'

type Step = 'confirm' | 'halaqah' | 'partner' | 'review' | 'akad' | 'success'

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
  class_types: Array<{
    id: string
    class_type: string
    current_students: number
    max_students: number
    is_active: boolean
  }>
  mentors: Array<{
    mentor_id: string
    role: string
    is_primary: boolean
    users: {
      full_name: string
    } | null
  }>
}

export default function DaftarUlangPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const params = useParams()
  const batchId = params.batch_id as string

  const [currentStep, setCurrentStep] = useState<Step>('confirm')
  const [isLoading, setIsLoading] = useState(false)
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [halaqahData, setHalaqahData] = useState<HalaqahData[]>([])
  const [existingSubmission, setExistingSubmission] = useState<any>(null)
  const [draftSaved, setDraftSaved] = useState(false)

  // Form data
  const [formData, setFormData] = useState<{
    confirmed_full_name: string
    confirmed_chosen_juz: string
    confirmed_main_time_slot: string
    confirmed_backup_time_slot: string
    confirmed_wa_phone: string
    confirmed_address: string
    ujian_halaqah_id: string
    tashih_halaqah_id: string
    is_tashih_umum: boolean
    partner_type: 'self_match' | 'system_match' | 'family' | 'tarteel' | ''
    partner_user_id: string
    partner_name: string
    partner_relationship: string
    partner_notes: string
    akad_url: string
    akad_file_name: string
  }>({
    // Step 1: Confirmed data
    confirmed_full_name: '',
    confirmed_chosen_juz: '',
    confirmed_main_time_slot: '',
    confirmed_backup_time_slot: '',
    confirmed_wa_phone: '',
    confirmed_address: '',

    // Step 2: Halaqah
    ujian_halaqah_id: '',
    tashih_halaqah_id: '',
    is_tashih_umum: false,

    // Step 3: Partner
    partner_type: '',
    partner_user_id: '',
    partner_name: '',
    partner_relationship: '',
    partner_notes: '',

    // Step 4: Akad
    akad_url: '',
    akad_file_name: '',
  })

  // Fetch registration data and halaqah on mount
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch registration data
        const regResponse = await fetch('/api/pendaftaran/my')
        if (!regResponse.ok) throw new Error('Failed to fetch registration')

        const regData = await regResponse.json()
        const selectedRegistration = regData.data?.find(
          (r: any) => r.selection_status === 'selected'
        )

        if (!selectedRegistration) {
          toast.error('Anda belum lolos seleksi')
          router.push('/perjalanan-saya')
          return
        }

        setRegistrationData(selectedRegistration)
        setFormData(prev => ({
          ...prev,
          confirmed_full_name: selectedRegistration.full_name || prev.confirmed_full_name,
          confirmed_chosen_juz: selectedRegistration.chosen_juz || prev.confirmed_chosen_juz,
          confirmed_main_time_slot: selectedRegistration.main_time_slot || prev.confirmed_main_time_slot,
          confirmed_backup_time_slot: selectedRegistration.backup_time_slot || prev.confirmed_backup_time_slot,
          confirmed_wa_phone: selectedRegistration.wa_phone || prev.confirmed_wa_phone,
          confirmed_address: selectedRegistration.address || prev.confirmed_address,
        }))

        // Fetch halaqah data
        const halaqahResponse = await fetch('/api/daftar-ulang/halaqah')
        if (halaqahResponse.ok) {
          const halaqahDataResult = await halaqahResponse.json()
          setHalaqahData(halaqahDataResult.data?.halaqah || [])
          setExistingSubmission(halaqahDataResult.data?.existing_submission)
        }
      } catch (error) {
        console.error('Fetch error:', error)
        toast.error('Gagal memuat data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, user?.id, router])

  // Save draft on form data changes (debounced)
  useEffect(() => {
    if (!registrationData?.id) return

    const timer = setTimeout(async () => {
      // Only save if we have meaningful data
      const hasValidPartnerType = formData.partner_type !== ''
      const hasHalaqahData = formData.ujian_halaqah_id || formData.tashih_halaqah_id

      if (hasValidPartnerType && hasHalaqahData) {
        // Build data to save, excluding empty partner_type
        const dataToSave: any = {
          confirmed_full_name: formData.confirmed_full_name,
          confirmed_chosen_juz: formData.confirmed_chosen_juz,
          confirmed_main_time_slot: formData.confirmed_main_time_slot,
          confirmed_backup_time_slot: formData.confirmed_backup_time_slot,
          confirmed_wa_phone: formData.confirmed_wa_phone,
          confirmed_address: formData.confirmed_address,
          ujian_halaqah_id: formData.ujian_halaqah_id,
          tashih_halaqah_id: formData.tashih_halaqah_id,
          is_tashih_umum: formData.is_tashih_umum,
          partner_user_id: formData.partner_user_id,
          partner_name: formData.partner_name,
          partner_relationship: formData.partner_relationship,
          partner_notes: formData.partner_notes,
          akad_url: formData.akad_url,
          akad_file_name: formData.akad_file_name,
        }

        // Only add partner_type if it's not empty
        if (formData.partner_type !== '') {
          dataToSave.partner_type = formData.partner_type
        }

        const result = await saveDaftarUlangDraft(registrationData.id, dataToSave)
        if (result.success) {
          setDraftSaved(true)
          setTimeout(() => setDraftSaved(false), 2000)
        }
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [formData, registrationData?.id])

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 'confirm') {
      if (!formData.confirmed_full_name) {
        toast.error('Nama lengkap harus diisi')
        return
      }
      setCurrentStep('halaqah')
    } else if (currentStep === 'halaqah') {
      // Wajib pilih kelas ujian
      if (!formData.ujian_halaqah_id) {
        toast.error('Pilih kelas ujian (wajib)')
        return
      }
      // Tashih opsional - bisa pilih halaqah atau tashih umum atau tidak pilih sama sekali
      setCurrentStep('partner')
    } else if (currentStep === 'partner') {
      if (!formData.partner_type) {
        toast.error('Pilih jenis pasangan belajar')
        return
      }
      if (formData.partner_type === 'self_match' && !formData.partner_user_id) {
        toast.error('Pilih pasangan belajar')
        return
      }
      if ((formData.partner_type === 'family' || formData.partner_type === 'tarteel') && !formData.partner_name) {
        toast.error('Isi nama pasangan belajar')
        return
      }
      if (formData.partner_type === 'family' && !formData.partner_relationship) {
        toast.error('Pilih hubungan dengan pasangan belajar')
        return
      }
      setCurrentStep('review')
    } else if (currentStep === 'review') {
      setCurrentStep('akad')
    } else if (currentStep === 'akad') {
      handleSubmit()
    }
  }

  const handleBack = () => {
    const steps: Step[] = ['confirm', 'halaqah', 'partner', 'review', 'akad', 'success']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleSubmit = async () => {
    if (!registrationData?.id) return

    // Validate partner_type is set
    if (!formData.partner_type || formData.partner_type === '' as any) {
      toast.error('Pilih jenis pasangan belajar')
      return
    }

    if (!formData.akad_url) {
      toast.error('Upload akad terlebih dahulu')
      return
    }

    setIsLoading(true)
    try {
      // Cast formData to DaftarUlangFormData (partner_type is validated above)
      const submitData = {
        ...formData,
        partner_type: formData.partner_type as 'self_match' | 'system_match' | 'family' | 'tarteel'
      }
      const result = await submitDaftarUlang(registrationData.id, submitData)

      if (result.success) {
        toast.success(result.message || 'Daftar ulang berhasil dikirim!')
        setCurrentStep('success')
      } else {
        toast.error(result.error || 'Gagal mengirim daftar ulang')
      }
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(error?.message || 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAkadUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const formDataToUpload = new FormData()
      formDataToUpload.append('file', file)

      const result = await uploadAkad(formDataToUpload)

      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          akad_url: result.data.url,
          akad_file_name: result.data.name,
        }))
        toast.success('Akad berhasil diupload')
      } else {
        toast.error(result.error || 'Gagal upload akad')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error?.message || 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isLoading && !registrationData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Ulang Tikrar Tahfidz</h1>
          <p className="text-gray-600">Lengkapi data daftar ulang untuk memulai perjalanan hafalan</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { key: 'confirm', label: 'Konfirmasi Data' },
              { key: 'halaqah', label: 'Pilih Halaqah' },
              { key: 'partner', label: 'Pasangan' },
              { key: 'review', label: 'Review' },
              { key: 'akad', label: 'Upload Akad' },
            ].map((step, index) => {
              const steps: Step[] = ['confirm', 'halaqah', 'partner', 'review', 'akad']
              const currentIndex = steps.indexOf(currentStep)
              const stepIndex = steps.indexOf(step.key as Step)
              const isCompleted = stepIndex < currentIndex
              const isCurrent = step.key === currentStep

              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                      ${isCompleted ? 'bg-green-600 text-white' : ''}
                      ${isCurrent ? 'bg-green-100 text-green-600 ring-4 ring-green-50' : ''}
                      ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-500' : ''}
                    `}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                    </div>
                    <span className={`text-xs mt-2 ${isCurrent ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < 4 && (
                    <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {currentStep === 'confirm' && (
              <ConfirmDataStep
                formData={formData}
                onChange={setFormData}
              />
            )}

            {currentStep === 'halaqah' && (
              <HalaqahSelectionStep
                halaqahData={halaqahData}
                formData={formData}
                onChange={setFormData}
              />
            )}

            {currentStep === 'partner' && (
              <PartnerSelectionStep
                formData={formData}
                onChange={setFormData}
                registrationId={registrationData?.id}
              />
            )}

            {currentStep === 'review' && (
              <ReviewStep
                formData={formData}
                halaqahData={halaqahData}
                registrationData={registrationData}
              />
            )}

            {currentStep === 'akad' && (
              <AkadUploadStep
                formData={formData}
                onUpload={handleAkadUpload}
                isLoading={isLoading}
              />
            )}

            {currentStep === 'success' && (
              <SuccessStep />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {currentStep !== 'success' && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 'confirm' || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>

            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {currentStep === 'akad' ? 'Kirim Daftar Ulang' : 'Lanjut'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Draft saved indicator */}
        {draftSaved && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Draft tersimpan</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Step Components

function ConfirmDataStep({
  formData,
  onChange
}: {
  formData: any
  onChange: (data: any) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Konfirmasi Data Diri</h2>
        <p className="text-gray-600 mb-6">Pastikan data di bawah ini sudah benar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <input
            type="text"
            value={formData.confirmed_full_name}
            onChange={e => onChange({ ...formData, confirmed_full_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Juz yang Dipilih</label>
          <input
            type="text"
            value={formData.confirmed_chosen_juz}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Utama</label>
          <input
            type="text"
            value={formData.confirmed_main_time_slot}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Cadangan</label>
          <input
            type="text"
            value={formData.confirmed_backup_time_slot}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input
            type="text"
            value={formData.confirmed_wa_phone}
            onChange={e => onChange({ ...formData, confirmed_wa_phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <textarea
            value={formData.confirmed_address}
            onChange={e => onChange({ ...formData, confirmed_address: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>
    </div>
  )
}

function HalaqahSelectionStep({
  halaqahData,
  formData,
  onChange
}: {
  halaqahData: HalaqahData[]
  formData: any
  onChange: (data: any) => void
}) {
  const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']

  const toggleUjian = (halaqahId: string) => {
    // Toggle: if already selected, deselect; otherwise select
    const newUjianId = formData.ujian_halaqah_id === halaqahId ? '' : halaqahId
    onChange({ ...formData, ujian_halaqah_id: newUjianId })
  }

  const toggleTashih = (halaqahId: string) => {
    // If enabling tashih umum, clear specific halaqah
    if (formData.is_tashih_umum) {
      onChange({ ...formData, is_tashih_umum: false, tashih_halaqah_id: halaqahId })
    } else {
      // Toggle: if already selected, deselect; otherwise select
      const newTashihId = formData.tashih_halaqah_id === halaqahId ? '' : halaqahId
      onChange({ ...formData, tashih_halaqah_id: newTashihId })
    }
  }

  const isUjianSelected = (halaqahId: string) => formData.ujian_halaqah_id === halaqahId
  const isTashihSelected = (halaqahId: string) => formData.tashih_halaqah_id === halaqahId

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pilih Jadwal Halaqah</h2>
        <p className="text-gray-600 mb-6">
          Pilih jadwal untuk kelas ujian dan/atau kelas tashih. Waktu yang ditampilkan dalam WIB.
        </p>
      </div>

      {/* Halaqah List with Checkboxes */}
      <div className="space-y-3">
        {halaqahData.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <Info className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-yellow-900 mb-2">Belum Ada Jadwal Halaqah</h3>
            <p className="text-sm text-yellow-700 mb-4">
              Jadwal halaqah belum tersedia. Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
            <p className="text-xs text-yellow-600">
              Admin akan membuat jadwal halaqah setelah periode pendaftaran ulang ditutup.
            </p>
          </div>
        ) : (
          halaqahData.map(halaqah => {
            const ujianSelected = isUjianSelected(halaqah.id)
            const tashihSelected = isTashihSelected(halaqah.id)

            return (
              <div
                key={halaqah.id}
                className={`
                  border rounded-lg p-4 transition-all
                  ${halaqah.is_full ? 'bg-gray-50 border-gray-200' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{halaqah.name}</h4>
                      {halaqah.is_full && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Penuh</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {halaqah.day_of_week && DAY_NAMES[halaqah.day_of_week]} • {halaqah.start_time} - {halaqah.end_time} WIB
                    </p>
                    {halaqah.location && (
                      <p className="text-sm text-gray-500 mt-1">{halaqah.location}</p>
                    )}
                    {halaqah.description && (
                      <p className="text-sm text-gray-600 mt-2">{halaqah.description}</p>
                    )}
                  </div>

                  {/* Checkboxes */}
                  <div className="flex items-center space-x-4 ml-4">
                    {/* Ujian Checkbox */}
                    <label className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                      ${halaqah.is_full ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                      ${ujianSelected ? 'bg-green-50 border border-green-200' : ''}
                    `}>
                      <input
                        type="checkbox"
                        checked={ujianSelected}
                        disabled={halaqah.is_full}
                        onChange={() => !halaqah.is_full && toggleUjian(halaqah.id)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium">Ujian</span>
                    </label>

                    {/* Tashih Checkbox */}
                    <label className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                      ${halaqah.is_full ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                      ${tashihSelected ? 'bg-blue-50 border border-blue-200' : ''}
                    `}>
                      <input
                        type="checkbox"
                        checked={tashihSelected}
                        disabled={halaqah.is_full}
                        onChange={() => !halaqah.is_full && toggleTashih(halaqah.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Tashih</span>
                    </label>
                  </div>
                </div>

                {/* Mentors info */}
                {halaqah.mentors && halaqah.mentors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Muallimah: </span>
                      {halaqah.mentors
                        .filter((m: any) => m.role === 'muallimah')
                        .map((m: any) => m.users?.full_name)
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Tashih Umum Option */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_tashih_umum}
            onChange={(e) => onChange({
              ...formData,
              is_tashih_umum: e.target.checked,
              tashih_halaqah_id: e.target.checked ? '' : formData.tashih_halaqah_id
            })}
            className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
          />
          <div>
            <h4 className="font-medium text-blue-900">Kelas Tashih Umum</h4>
            <p className="text-sm text-blue-700 mt-1">
              Pilih ini jika Anda ingin bergabung di kelas tashih umum bersama thalibah lain yang tidak memiliki pasangan/tetap.
            </p>
          </div>
        </label>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Pilihan Anda:</h4>
        <div className="text-sm space-y-1">
          <div>
            <span className="text-gray-600">Kelas Ujian: </span>
            {formData.ujian_halaqah_id ? (
              <span className="font-medium text-green-700">
                {halaqahData.find(h => h.id === formData.ujian_halaqah_id)?.name || '-'}
              </span>
            ) : (
              <span className="text-gray-400">Belum dipilih</span>
            )}
          </div>
          <div>
            <span className="text-gray-600">Kelas Tashih: </span>
            {formData.is_tashih_umum ? (
              <span className="font-medium text-blue-700">Tashih Umum</span>
            ) : formData.tashih_halaqah_id ? (
              <span className="font-medium text-blue-700">
                {halaqahData.find(h => h.id === formData.tashih_halaqah_id)?.name || '-'}
              </span>
            ) : (
              <span className="text-gray-400">Belum dipilih</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PartnerSelectionStep({
  formData,
  onChange,
  registrationId
}: {
  formData: any
  onChange: (data: any) => void
  registrationId?: string
}) {
  const [partners, setPartners] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (formData.partner_type === 'self_match' && registrationId) {
      fetchPartners()
    }
  }, [formData.partner_type, registrationId])

  const fetchPartners = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/daftar-ulang/partners')
      if (response.ok) {
        const data = await response.json()
        setPartners(data.data?.partners_selected_by_others || [])
      }
    } catch (error) {
      console.error('Fetch partners error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pilih Pasangan Belajar</h2>
        <p className="text-gray-600 mb-6">
          Pilih pasangan belajar untuk program Tikrar Tahfidz
        </p>
      </div>

      <div className="space-y-4">
        {/* Self Match */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            formData.partner_type === 'self_match'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onChange({ ...formData, partner_type: 'self_match' })}
        >
          <div className="flex items-start space-x-3">
            <Users className="w-6 h-6 text-green-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Pilih Sendiri</h3>
              <p className="text-sm text-gray-600 mt-1">
                Pilih pasangan belajar sendiri. Pasangan harus saling memilih untuk membentuk kelompok.
              </p>
            </div>
            <input
              type="radio"
              checked={formData.partner_type === 'self_match'}
              readOnly
              className="w-5 h-5 text-green-600"
            />
          </div>

          {formData.partner_type === 'self_match' && (
            <div className="mt-4 space-y-2">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Memuat daftar pasangan...</p>
                </div>
              ) : partners.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    Belum ada yang memilih Anda sebagai pasangan. Anda bisa memilih pasangan nanti.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {partners.map((partner) => (
                    <div
                      key={partner.id}
                      className={`
                        border rounded-lg p-3 cursor-pointer transition-all
                        ${formData.partner_user_id === partner.user_id
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange({ ...formData, partner_user_id: partner.user_id })
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{partner.users.full_name}</p>
                          <p className="text-xs text-gray-600">{partner.registrations?.chosen_juz}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {partner.is_mutual_match && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                              Saling Memilih
                            </span>
                          )}
                          {partner.schedule_compatible && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                              Jadwal Cocok
                            </span>
                          )}
                          {partner.juz_compatible && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                              Juz Sama
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* System Match */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            formData.partner_type === 'system_match'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onChange({ ...formData, partner_type: 'system_match' })}
        >
          <div className="flex items-start space-x-3">
            <Clock className="w-6 h-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Dipasangkan oleh Sistem</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sistem akan memasangkan Anda berdasarkan jadwal utama dan cadangan. Diutamakan sesama juz.
              </p>
            </div>
            <input
              type="radio"
              checked={formData.partner_type === 'system_match'}
              readOnly
              className="w-5 h-5 text-green-600"
            />
          </div>
        </div>

        {/* Family */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            formData.partner_type === 'family'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onChange({ ...formData, partner_type: 'family' })}
        >
          <div className="flex items-start space-x-3">
            <Users className="w-6 h-6 text-purple-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Keluarga (Mahram)</h3>
              <p className="text-sm text-gray-600 mt-1">
                Setoran kepada keluarga (Ayah, Ibu, anak, atau saudara mahram).
              </p>
            </div>
            <input
              type="radio"
              checked={formData.partner_type === 'family'}
              readOnly
              className="w-5 h-5 text-green-600"
            />
          </div>

          {formData.partner_type === 'family' && (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Nama lengkap"
                value={formData.partner_name}
                onChange={e => onChange({ ...formData, partner_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <select
                value={formData.partner_relationship}
                onChange={e => onChange({ ...formData, partner_relationship: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Pilih hubungan</option>
                <option value="ayah">Ayah</option>
                <option value="ibu">Ibu</option>
                <option value="suami">Suami</option>
                <option value="anak">Anak</option>
                <option value="saudara">Saudara (Mahram)</option>
                <option value="lainnya">Lainnya</option>
              </select>
              <textarea
                placeholder="Catatan tambahan (opsional)"
                value={formData.partner_notes}
                onChange={e => onChange({ ...formData, partner_notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}
        </div>

        {/* Tarteel */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            formData.partner_type === 'tarteel'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onChange({ ...formData, partner_type: 'tarteel' })}
        >
          <div className="flex items-start space-x-3">
            <Upload className="w-6 h-6 text-orange-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Aplikasi Tarteel</h3>
              <p className="text-sm text-gray-600 mt-1">
                Setoran mandiri menggunakan aplikasi Tarteel dengan lampiran screenshot penggunaan.
              </p>
            </div>
            <input
              type="radio"
              checked={formData.partner_type === 'tarteel'}
              readOnly
              className="w-5 h-5 text-green-600"
            />
          </div>

          {formData.partner_type === 'tarteel' && (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Nama lengkap (untuk sertifikat)"
                value={formData.partner_name}
                onChange={e => onChange({ ...formData, partner_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <textarea
                placeholder="Catatan tambahan (opsional)"
                value={formData.partner_notes}
                onChange={e => onChange({ ...formData, partner_notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewStep({
  formData,
  halaqahData,
  registrationData
}: {
  formData: any
  halaqahData: HalaqahData[]
  registrationData: any
}) {
  const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']

  const getHalaqahName = (halaqahId: string) => {
    const halaqah = halaqahData.find(h => h.id === halaqahId)
    return halaqah?.name || '-'
  }

  const getHalaqahSchedule = (halaqahId: string) => {
    const halaqah = halaqahData.find(h => h.id === halaqahId)
    if (!halaqah) return '-'
    return `${DAY_NAMES[halaqah.day_of_week || 0]} ${halaqah.start_time} - ${halaqah.end_time}`
  }

  const PARTNER_TYPE_LABELS = {
    self_match: 'Pilih Sendiri',
    system_match: 'Dipasangkan oleh Sistem',
    family: 'Keluarga (Mahram)',
    tarteel: 'Aplikasi Tarteel'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Data Daftar Ulang</h2>
        <p className="text-gray-600 mb-6">Periksa kembali data sebelum mengirim</p>
      </div>

      <div className="space-y-4">
        {/* Personal Data */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Data Diri</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Nama</span>
              <p className="font-medium">{formData.confirmed_full_name}</p>
            </div>
            <div>
              <span className="text-gray-600">Juz</span>
              <p className="font-medium">{formData.confirmed_chosen_juz}</p>
            </div>
            <div>
              <span className="text-gray-600">Waktu Utama</span>
              <p className="font-medium">{formData.confirmed_main_time_slot}</p>
            </div>
            <div>
              <span className="text-gray-600">Waktu Cadangan</span>
              <p className="font-medium">{formData.confirmed_backup_time_slot}</p>
            </div>
          </div>
        </div>

        {/* Halaqah */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Jadwal Halaqah</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Kelas Ujian</span>
              <p className="font-medium">{getHalaqahName(formData.ujian_halaqah_id)}</p>
              <p className="text-gray-600">{getHalaqahSchedule(formData.ujian_halaqah_id)}</p>
            </div>
            {formData.is_tashih_umum ? (
              <div>
                <span className="text-gray-600">Kelas Tashih</span>
                <p className="font-medium">Tashih Umum</p>
              </div>
            ) : (
              <div>
                <span className="text-gray-600">Kelas Tashih</span>
                <p className="font-medium">{getHalaqahName(formData.tashih_halaqah_id)}</p>
                <p className="text-gray-600">{getHalaqahSchedule(formData.tashih_halaqah_id)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Partner */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Pasangan Belajar</h3>
          <div className="text-sm">
            <p className="font-medium">{formData.partner_type ? PARTNER_TYPE_LABELS[formData.partner_type as keyof typeof PARTNER_TYPE_LABELS] : '-'}</p>
            {formData.partner_type === 'family' && (
              <div className="mt-2 space-y-1">
                <p><span className="text-gray-600">Nama:</span> {formData.partner_name}</p>
                <p><span className="text-gray-600">Hubungan:</span> {formData.partner_relationship}</p>
              </div>
            )}
            {formData.partner_type === 'tarteel' && (
              <div className="mt-2">
                <p><span className="text-gray-600">Nama:</span> {formData.partner_name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800">
              Pastikan semua data sudah benar. Setelah dikirim, Anda tidak dapat mengubah data daftar ulang.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AkadUploadStep({
  formData,
  onUpload,
  isLoading
}: {
  formData: any
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  isLoading: boolean
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Akad</h2>
        <p className="text-gray-600 mb-6">
          Upload akad daftar ulang yang sudah ditandatangani. Format PDF atau gambar (JPG, PNG), maksimal 5MB.
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        {formData.akad_url ? (
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <p className="font-medium text-gray-900">Akad berhasil diupload</p>
              <p className="text-sm text-gray-600 mt-1">{formData.akad_file_name}</p>
            </div>
            <label className="inline-block">
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={onUpload}
                disabled={isLoading}
                className="hidden"
              />
              <span className="text-sm text-green-600 hover:text-green-700 cursor-pointer">
                Ganti file
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="font-medium text-gray-900">Upload Akad</p>
              <p className="text-sm text-gray-600 mt-2">Drag & drop atau klik untuk memilih file</p>
            </div>
            <label className="inline-block">
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={onUpload}
                disabled={isLoading}
                className="hidden"
              />
              <span className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer inline-block">
                {isLoading ? 'Mengupload...' : 'Pilih File'}
              </span>
            </label>
            <p className="text-xs text-gray-500">PDF, JPG, PNG - Maksimal 5MB</p>
          </div>
        )}
      </div>

      {formData.akad_url && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm text-green-800">
                Akad sudah siap. Klik "Kirim Daftar Ulang" untuk menyelesaikan proses.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SuccessStep() {
  const router = useRouter()

  return (
    <div className="text-center py-8">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Alhamdulillah! Daftar Ulang Berhasil</h2>
      <p className="text-gray-600 mb-8">
        Data daftar ulang Anda berhasil dikirim. Admin akan memverifikasi data Anda dalam 1-2 hari kerja.
      </p>

      <div className="space-y-3">
        <Button
          onClick={() => router.push('/perjalanan-saya')}
          className="bg-green-600 hover:bg-green-700"
        >
          Ke Perjalanan Saya
        </Button>
        <div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
