'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle, AlertCircle, Clock, Users, Calendar, Upload, ChevronRight, ChevronLeft, Info, FileText, X } from 'lucide-react'
import { submitDaftarUlang, saveDaftarUlangDraft, uploadAkad } from './actions'

type Step = 'confirm' | 'halaqah' | 'partner' | 'review' | 'akad' | 'success'

// Helper function to format time slot value
const formatTimeSlot = (timeSlot: string): string => {
  const timeSlotMap: Record<string, string> = {
    '04-06': '04.00 - 06.00 WIB/WITA/WIT',
    '06-09': '06.00 - 09.00 WIB/WITA/WIT',
    '09-12': '09.00 - 12.00 WIB/WITA/WIT',
    '12-15': '12.00 - 15.00 WIB/WITA/WIT',
    '15-18': '15.00 - 18.00 WIB/WITA/WIT',
    '18-21': '18.00 - 21.00 WIB/WITA/WIT',
    '21-24': '21.00 - 24.00 WIB/WITA/WIT'
  }
  return timeSlotMap[timeSlot] || timeSlot
}

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
  class_type: string // 'tashih_ujian', 'tashih_only', 'ujian_only'
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
    exam_score: number | null
    final_juz: string
    juz_adjusted: boolean
    juz_adjustment_reason: string
    ujian_halaqah_id: string
    tashih_halaqah_id: string
    partner_type: 'self_match' | 'system_match' | 'family' | 'tarteel' | ''
    partner_user_id: string
    partner_name: string
    partner_relationship: string
    partner_wa_phone: string
    partner_notes: string
    akad_files: Array<{ url: string; name: string }>
  }>({
    // Step 1: Confirmed data
    confirmed_full_name: '',
    confirmed_chosen_juz: '',
    confirmed_main_time_slot: '',
    confirmed_backup_time_slot: '',
    confirmed_wa_phone: '',
    confirmed_address: '',
    exam_score: null,
    final_juz: '',
    juz_adjusted: false,
    juz_adjustment_reason: '',

    // Step 2: Halaqah
    ujian_halaqah_id: '',
    tashih_halaqah_id: '',

    // Step 3: Partner
    partner_type: '',
    partner_user_id: '',
    partner_name: '',
    partner_relationship: '',
    partner_wa_phone: '',
    partner_notes: '',

    // Step 4: Akad
    akad_files: [],
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

        // Calculate final juz based on exam score
        const examScore = selectedRegistration.exam_score || null
        const chosenJuz = (selectedRegistration.chosen_juz || '').toUpperCase()
        let finalJuz = chosenJuz
        let juzAdjusted = false
        let juzAdjustmentReason = ''

        if (examScore !== null && examScore < 70) {
          if (chosenJuz === '28A' || chosenJuz === '28B' || chosenJuz === '28') {
            finalJuz = '29A'
            juzAdjusted = true
            juzAdjustmentReason = `Nilai pilihan ganda ${examScore} < 70, juz disesuaikan dari ${chosenJuz} ke ${finalJuz}`
          } else if (chosenJuz === '1A' || chosenJuz === '1B' || chosenJuz === '29A' || chosenJuz === '29B' || chosenJuz === '29' || chosenJuz === '1') {
            finalJuz = '30A'
            juzAdjusted = true
            juzAdjustmentReason = `Nilai pilihan ganda ${examScore} < 70, juz disesuaikan dari ${chosenJuz} ke ${finalJuz}`
          }
        }

        setFormData(prev => ({
          ...prev,
          confirmed_full_name: selectedRegistration.full_name || prev.confirmed_full_name,
          confirmed_chosen_juz: selectedRegistration.chosen_juz || prev.confirmed_chosen_juz,
          confirmed_main_time_slot: selectedRegistration.main_time_slot || prev.confirmed_main_time_slot,
          confirmed_backup_time_slot: selectedRegistration.backup_time_slot || prev.confirmed_backup_time_slot,
          confirmed_wa_phone: selectedRegistration.wa_phone || prev.confirmed_wa_phone,
          confirmed_address: selectedRegistration.address || prev.confirmed_address,
          exam_score: examScore,
          final_juz: finalJuz,
          juz_adjusted: juzAdjusted,
          juz_adjustment_reason: juzAdjustmentReason,
        }))

        // Fetch halaqah data
        const halaqahResponse = await fetch('/api/daftar-ulang/halaqah')
        if (halaqahResponse.ok) {
          const halaqahDataResult = await halaqahResponse.json()
          setHalaqahData(halaqahDataResult.data?.halaqah || [])
          setExistingSubmission(halaqahDataResult.data?.existing_submission)

          // Check if user already submitted daftar ulang
          if (halaqahDataResult.data?.existing_submission?.status === 'submitted') {
            setCurrentStep('success')
            toast.success('Anda sudah melakukan daftar ulang!')
          }
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
          partner_user_id: formData.partner_user_id,
          partner_name: formData.partner_name,
          partner_relationship: formData.partner_relationship,
          partner_wa_phone: formData.partner_wa_phone,
          partner_notes: formData.partner_notes,
          akad_files: formData.akad_files,
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
      // Tashih opsional
      setCurrentStep('partner')
    } else if (currentStep === 'partner') {
      if (!formData.partner_type) {
        toast.error('Pilih jenis pasangan belajar')
        return
      }

      // Validasi berdasarkan jenis pasangan
      if (formData.partner_type === 'self_match') {
        // Untuk pilih sendiri, user WAJIB memilih pasangan
        if (!formData.partner_user_id) {
          toast.error('Silakan pilih nama pasangan belajar dari dropdown')
          return
        }
      } else if (formData.partner_type === 'family') {
        // Untuk keluarga, WAJIB isi nama dan hubungan
        if (!formData.partner_name) {
          toast.error('Isi nama pasangan belajar (keluarga)')
          return
        }
        if (!formData.partner_relationship) {
          toast.error('Pilih hubungan dengan pasangan belajar')
          return
        }
      } else if (formData.partner_type === 'tarteel') {
        // Untuk tarteel, WAJIB isi nama
        if (!formData.partner_name) {
          toast.error('Isi nama pasangan belajar')
          return
        }
      }
      // system_match tidak perlu validasi apapun (langsung lanjut)

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

    if (!formData.akad_files || formData.akad_files.length === 0) {
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
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formDataToUpload = new FormData()
        formDataToUpload.append('file', file)

        const result = await uploadAkad(formDataToUpload)

        if (result.success && result.data) {
          return {
            url: result.data.url,
            name: result.data.name
          }
        }
        throw new Error(result.error || 'Gagal upload file')
      })

      const uploadedFiles = await Promise.all(uploadPromises)

      setFormData(prev => ({
        ...prev,
        akad_files: [...prev.akad_files, ...uploadedFiles],
      }))

      toast.success(`${uploadedFiles.length} file berhasil diupload`)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error?.message || 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleRemoveAkadFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      akad_files: prev.akad_files.filter((_, i) => i !== index),
    }))
    toast.success('File berhasil dihapus')
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
                onRemove={handleRemoveAkadFile}
                isLoading={isLoading}
              />
            )}

            {currentStep === 'success' && (
              <SuccessStep existingSubmission={existingSubmission} />
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

// Helper function for juz label
const getJuzLabel = (juzValue: string) => {
  const juzLabels: Record<string, string> = {
    '30A': 'Juz 30A (halaman 1-10)',
    '30B': 'Juz 30B (halaman 11-24)',
    '28A': 'Juz 28A (halaman 1-10)',
    '28B': 'Juz 28B (halaman 11-20)',
    '1A': 'Juz 1A (halaman 1-10)',
    '1B': 'Juz 1B (halaman 11-20)',
    '28': 'Juz 28',
    '29': 'Juz 29',
    '29A': 'Juz 29A (halaman 1-10)',
    '29B': 'Juz 29B (halaman 11-20)',
    '1': 'Juz 1',
  }
  return juzLabels[juzValue] || `Juz ${juzValue}`
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Juz yang Dipilih (Saat Pendaftaran)</label>
          <input
            type="text"
            value={getJuzLabel(formData.confirmed_chosen_juz)}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        {formData.juz_adjusted ? (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Juz Penempatan Final</label>
            <div className="space-y-2">
              <input
                type="text"
                value={getJuzLabel(formData.final_juz)}
                readOnly
                className="w-full px-3 py-2 border border-green-300 rounded-lg bg-green-50 text-green-800 font-semibold"
              />
              <p className="text-xs text-blue-700 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                {formData.juz_adjustment_reason}
              </p>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">
                Juz penempatan: <span className="font-semibold">{getJuzLabel(formData.confirmed_chosen_juz)}</span>
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Utama</label>
          <input
            type="text"
            value={formatTimeSlot(formData.confirmed_main_time_slot)}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Cadangan</label>
          <input
            type="text"
            value={formatTimeSlot(formData.confirmed_backup_time_slot)}
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

  // Helper to check if class type is available
  const hasUjian = (halaqah: HalaqahData) =>
    halaqah.class_types.some(ct => ct.class_type === 'ujian')
  const hasTashih = (halaqah: HalaqahData) =>
    halaqah.class_types.some(ct => ct.class_type === 'tashih')
  const isTashihUjianBoth = (halaqah: HalaqahData) =>
    halaqah.class_type === 'tashih_ujian'

  const toggleUjian = (halaqahId: string) => {
    const halaqah = halaqahData.find(h => h.id === halaqahId)
    if (!halaqah || !hasUjian(halaqah)) return

    // Check if there's already a tashih_ujian halaqah selected (both ujian and tashih in one)
    // If so, cannot select any other halaqah
    const ujianSelectedHalaqah = halaqahData.find(h => h.id === formData.ujian_halaqah_id)
    const tashihSelectedHalaqah = halaqahData.find(h => h.id === formData.tashih_halaqah_id)

    // If either ujian or tashih is already a tashih_ujian halaqah and we're clicking a different halaqah
    if ((ujianSelectedHalaqah && isTashihUjianBoth(ujianSelectedHalaqah) && ujianSelectedHalaqah.id !== halaqahId) ||
        (tashihSelectedHalaqah && isTashihUjianBoth(tashihSelectedHalaqah) && tashihSelectedHalaqah.id !== halaqahId)) {
      toast.error('Anda sudah memilih kelas Tashih+Ujian. Tidak bisa memilih halaqah lain.')
      return
    }

    // If tashih_ujian, must select both
    if (isTashihUjianBoth(halaqah)) {
      // Check if there's already a separate ujian or tashih selected
      if ((formData.ujian_halaqah_id && formData.ujian_halaqah_id !== halaqahId) ||
          (formData.tashih_halaqah_id && formData.tashih_halaqah_id !== halaqahId)) {
        toast.error('Tidak bisa memilih kelas Tashih+Ujian jika sudah memilih kelas lain')
        return
      }
      const newUjianId = formData.ujian_halaqah_id === halaqahId ? '' : halaqahId
      onChange({
        ...formData,
        ujian_halaqah_id: newUjianId,
        tashih_halaqah_id: newUjianId,
      })
    } else {
      const newUjianId = formData.ujian_halaqah_id === halaqahId ? '' : halaqahId
      onChange({ ...formData, ujian_halaqah_id: newUjianId })
    }
  }

  const toggleTashih = (halaqahId: string) => {
    const halaqah = halaqahData.find(h => h.id === halaqahId)
    if (!halaqah || !hasTashih(halaqah)) return

    // Check if there's already a tashih_ujian halaqah selected (both ujian and tashih in one)
    // If so, cannot select any other halaqah
    const ujianSelectedHalaqah = halaqahData.find(h => h.id === formData.ujian_halaqah_id)
    const tashihSelectedHalaqah = halaqahData.find(h => h.id === formData.tashih_halaqah_id)

    // If either ujian or tashih is already a tashih_ujian halaqah and we're clicking a different halaqah
    if ((ujianSelectedHalaqah && isTashihUjianBoth(ujianSelectedHalaqah) && ujianSelectedHalaqah.id !== halaqahId) ||
        (tashihSelectedHalaqah && isTashihUjianBoth(tashihSelectedHalaqah) && tashihSelectedHalaqah.id !== halaqahId)) {
      toast.error('Anda sudah memilih kelas Tashih+Ujian. Tidak bisa memilih halaqah lain.')
      return
    }

    // If tashih_ujian, must select both
    if (isTashihUjianBoth(halaqah)) {
      // Check if there's already a separate ujian or tashih selected
      if ((formData.ujian_halaqah_id && formData.ujian_halaqah_id !== halaqahId) ||
          (formData.tashih_halaqah_id && formData.tashih_halaqah_id !== halaqahId)) {
        toast.error('Tidak bisa memilih kelas Tashih+Ujian jika sudah memilih kelas lain')
        return
      }
      const newTashihId = formData.tashih_halaqah_id === halaqahId ? '' : halaqahId
      onChange({
        ...formData,
        ujian_halaqah_id: newTashihId,
        tashih_halaqah_id: newTashihId,
      })
    } else {
      const newTashihId = formData.tashih_halaqah_id === halaqahId ? '' : halaqahId
      onChange({ ...formData, tashih_halaqah_id: newTashihId })
    }
  }

  const isUjianSelected = (halaqahId: string) => formData.ujian_halaqah_id === halaqahId
  const isTashihSelected = (halaqahId: string) => formData.tashih_halaqah_id === halaqahId

  // Class type badge colors
  const getClassTypeColor = (classType: string) => {
    switch (classType) {
      case 'tashih_ujian': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'tashih_only': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'ujian_only': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getClassTypeLabel = (classType: string) => {
    switch (classType) {
      case 'tashih_ujian': return 'Tashih + Ujian'
      case 'tashih_only': return 'Tashih'
      case 'ujian_only': return 'Ujian'
      default: return classType
    }
  }

  // Sort halaqah: tashih_ujian first, then ujian_only, then tashih_only
  const getSortPriority = (classType: string) => {
    switch (classType) {
      case 'tashih_ujian': return 1
      case 'ujian_only': return 2
      case 'tashih_only': return 3
      default: return 4
    }
  }

  const sortedHalaqahData = [...halaqahData].sort((a, b) => {
    const priorityA = getSortPriority(a.class_type)
    const priorityB = getSortPriority(b.class_type)
    return priorityA - priorityB
  })

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Pilih Jadwal Halaqah</h2>
        <p className="text-emerald-50">
          Pilih jadwal untuk kelas ujian dan/atau kelas tashih. Waktu yang ditampilkan dalam WIB.
        </p>
      </div>

      {/* Halaqah List with Colorful Cards */}
      <div className="space-y-4">
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
          sortedHalaqahData.map(halaqah => {
            const ujianSelected = isUjianSelected(halaqah.id)
            const tashihSelected = isTashihSelected(halaqah.id)
            const isBothRequired = isTashihUjianBoth(halaqah)

            return (
              <div
                key={halaqah.id}
                className={`
                  border-2 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md
                  ${halaqah.is_full ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200 hover:border-emerald-300'}
                  ${(ujianSelected || tashihSelected) ? 'ring-2 ring-emerald-400 border-emerald-400' : ''}
                `}
              >
                {/* Header with name and class type badge */}
                <div className={`
                  px-4 py-3 flex items-center justify-between
                  ${ujianSelected || tashihSelected ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-gray-50 to-gray-100'}
                `}>
                  <div className="flex items-center space-x-3">
                    <h4 className={`font-semibold ${ujianSelected || tashihSelected ? 'text-white' : 'text-gray-900'}`}>
                      {halaqah.name}
                    </h4>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getClassTypeColor(halaqah.class_type)}`}>
                      {getClassTypeLabel(halaqah.class_type)}
                    </span>
                    {halaqah.is_full && (
                      <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">Penuh</span>
                    )}
                  </div>
                  {isBothRequired && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                      Wajib Keduanya
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {/* Schedule / Jadwal - use muallimah_schedule if available, fallback to halaqah schedule */}
                    {(halaqah.muallimah_schedule || (halaqah.day_of_week !== null && halaqah.start_time && halaqah.end_time)) && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-gray-700">
                          <span className="font-medium">Jadwal: </span>
                          {(() => {
                            // Try to use muallimah_schedule first
                            if (halaqah.muallimah_schedule) {
                              try {
                                const schedule = JSON.parse(halaqah.muallimah_schedule)
                                return `${schedule.day} • ${schedule.time_start} - ${schedule.time_end} WIB`
                              } catch {
                                return halaqah.muallimah_schedule
                              }
                            }
                            // Fallback to halaqah schedule
                            if (halaqah.day_of_week !== null && halaqah.start_time && halaqah.end_time) {
                              const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']
                              return `${DAY_NAMES[halaqah.day_of_week]} • ${halaqah.start_time} - ${halaqah.end_time} WIB`
                            }
                            return '-'
                          })()}
                        </span>
                      </div>
                    )}

                    {/* Juz */}
                    {halaqah.muallimah_preferred_juz && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <span className="text-gray-700">
                          <span className="font-medium">Juz: </span>
                          {halaqah.muallimah_preferred_juz}
                        </span>
                      </div>
                    )}

                    {/* Location */}
                    {halaqah.location && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{halaqah.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Muallimah */}
                  {halaqah.mentors && halaqah.mentors.length > 0 && (
                    <div className="mb-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">Muallimah:</span>{' '}
                          {halaqah.mentors
                            .filter((m: any) => m.role === 'muallimah')
                            .map((m: any) => `Ustadzah ${m.users?.full_name}`)
                            .filter(Boolean)
                            .join(', ') || '-'}
                        </span>
                      </div>

                      {/* Quota Progress Bar */}
                      <div className="ml-8">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Kuota</span>
                          <span className={halaqah.available_slots <= 3 ? 'text-orange-600 font-medium' : ''}>
                            {halaqah.available_slots} dari {halaqah.total_max_students} tersedia
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              halaqah.is_full
                                ? 'bg-red-500'
                                : halaqah.available_slots <= 3
                                ? 'bg-orange-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${((halaqah.total_max_students - halaqah.available_slots) / halaqah.total_max_students) * 100}%` }}
                          ></div>
                        </div>
                        {halaqah.is_full && (
                          <p className="text-xs text-red-600 mt-1">Kelas penuh</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selection Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {/* Combined Button for Tashih+Ujian */}
                    {isBothRequired(halaqah) ? (
                      <button
                        onClick={() => !halaqah.is_full && toggleUjian(halaqah.id)}
                        disabled={halaqah.is_full || (() => {
                          const ujianSelectedHalaqah = halaqahData.find(h => h.id === formData.ujian_halaqah_id)
                          const tashihSelectedHalaqah = halaqahData.find(h => h.id === formData.tashih_halaqah_id)
                          const hasTashihUjianSelected = (ujianSelectedHalaqah && isTashihUjianBoth(ujianSelectedHalaqah) && ujianSelectedHalaqah.id !== halaqah.id) ||
                                                        (tashihSelectedHalaqah && isTashihUjianBoth(tashihSelectedHalaqah) && tashihSelectedHalaqah.id !== halaqah.id)
                          return hasTashihUjianSelected
                        })()}
                        className={`
                          w-full px-6 py-3 rounded-lg font-medium text-sm transition-all
                          ${halaqah.is_full ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' :
                            (() => {
                              const ujianSelectedHalaqah = halaqahData.find(h => h.id === formData.ujian_halaqah_id)
                              const tashihSelectedHalaqah = halaqahData.find(h => h.id === formData.tashih_halaqah_id)
                              const hasTashihUjianSelected = (ujianSelectedHalaqah && isTashihUjianBoth(ujianSelectedHalaqah) && ujianSelectedHalaqah.id !== halaqah.id) ||
                                                            (tashihSelectedHalaqah && isTashihUjianBoth(tashihSelectedHalaqah) && tashihSelectedHalaqah.id !== halaqah.id)
                              const isSelected = ujianSelected && tashihSelected
                              return hasTashihUjianSelected ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' :
                                isSelected ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md' :
                                'bg-white border-2 border-purple-200 text-purple-700 hover:border-purple-400 hover:bg-purple-50'
                            })()}
                        `}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {ujianSelected && tashihSelected && (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span>Pilih Tashih + Ujian</span>
                        </div>
                      </button>
                    ) : (
                      <>
                        {/* Separate Ujian Button */}
                        {hasUjian(halaqah) && (
                          <button
                            onClick={() => !halaqah.is_full && toggleUjian(halaqah.id)}
                            disabled={halaqah.is_full || (() => {
                              const ujianSelectedHalaqah = halaqahData.find(h => h.id === formData.ujian_halaqah_id)
                              const tashihSelectedHalaqah = halaqahData.find(h => h.id === formData.tashih_halaqah_id)
                              const hasTashihUjianSelected = (ujianSelectedHalaqah && isTashihUjianBoth(ujianSelectedHalaqah) && ujianSelectedHalaqah.id !== halaqah.id) ||
                                                            (tashihSelectedHalaqah && isTashihUjianBoth(tashihSelectedHalaqah) && tashihSelectedHalaqah.id !== halaqah.id)
                              return hasTashihUjianSelected
                            })()}
                            className={`
                              flex-1 min-w-[140px] px-4 py-3 rounded-lg font-medium text-sm transition-all
                              ${halaqah.is_full ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' :
                                (() => {
                                  const ujianSelectedHalaqah = halaqahData.find(h => h.id === formData.ujian_halaqah_id)
                                  const tashihSelectedHalaqah = halaqahData.find(h => h.id === formData.tashih_halaqah_id)
                                  const hasTashihUjianSelected = (ujianSelectedHalaqah && isTashihUjianBoth(ujianSelectedHalaqah) && ujianSelectedHalaqah.id !== halaqah.id) ||
                                                                (tashihSelectedHalaqah && isTashihUjianBoth(tashihSelectedHalaqah) && tashihSelectedHalaqah.id !== halaqah.id)
                                  return hasTashihUjianSelected ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' :
                                    ujianSelected ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' :
                                    'bg-white border-2 border-green-200 text-green-700 hover:border-green-400 hover:bg-green-50'
                                })()}
                            `}
                          >
                            <div className="flex items-center justify-center space-x-2">
                              {ujianSelected && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span>Ujian</span>
                            </div>
                          </button>
                        )}

                        {/* Separate Tashih Button */}
                        {hasTashih(halaqah) && (
                          <button
                            onClick={() => !halaqah.is_full && toggleTashih(halaqah.id)}
                            disabled={halaqah.is_full || (() => {
                              const ujianSelectedHalaqah = halaqahData.find(h => h.id === formData.ujian_halaqah_id)
                              const tashihSelectedHalaqah = halaqahData.find(h => h.id === formData.tashih_halaqah_id)
                              const hasTashihUjianSelected = (ujianSelectedHalaqah && isTashihUjianBoth(ujianSelectedHalaqah) && ujianSelectedHalaqah.id !== halaqah.id) ||
                                                            (tashihSelectedHalaqah && isTashihUjianBoth(tashihSelectedHalaqah) && tashihSelectedHalaqah.id !== halaqah.id)
                              return hasTashihUjianSelected
                            })()}
                            className={`
                              flex-1 min-w-[140px] px-4 py-3 rounded-lg font-medium text-sm transition-all
                          ${halaqah.is_full ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' :
                            (() => {
                              const ujianSelectedHalaqah = halaqahData.find(h => h.id === formData.ujian_halaqah_id)
                              const tashihSelectedHalaqah = halaqahData.find(h => h.id === formData.tashih_halaqah_id)
                              const hasTashihUjianSelected = (ujianSelectedHalaqah && isTashihUjianBoth(ujianSelectedHalaqah) && ujianSelectedHalaqah.id !== halaqah.id) ||
                                                            (tashihSelectedHalaqah && isTashihUjianBoth(tashihSelectedHalaqah) && tashihSelectedHalaqah.id !== halaqah.id)
                              return hasTashihUjianSelected ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' :
                                tashihSelected ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' :
                                'bg-white border-2 border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                            })()}
                        `}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {tashihSelected && (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span>Tashih</span>
                        </div>
                      </button>
                    )}
                  </div>

                  {isBothRequired && (
                    <p className="text-xs text-purple-600 mt-2 text-center">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Kelas ini mencakup ujian dan tashih, keduanya wajib dipilih bersamaan
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl p-5">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Pilihan Anda:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg ${formData.ujian_halaqah_id ? 'bg-green-100 border border-green-300' : 'bg-gray-100'}`}>
            <span className="text-xs text-gray-600 uppercase tracking-wide">Kelas Ujian</span>
            <div className={`font-medium mt-1 ${formData.ujian_halaqah_id ? 'text-green-800' : 'text-gray-400'}`}>
              {formData.ujian_halaqah_id ? (
                halaqahData.find(h => h.id === formData.ujian_halaqah_id)?.name || '-'
              ) : (
                'Belum dipilih'
              )}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${formData.tashih_halaqah_id ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100'}`}>
            <span className="text-xs text-gray-600 uppercase tracking-wide">Kelas Tashih</span>
            <div className={`font-medium mt-1 ${formData.tashih_halaqah_id ? 'text-blue-800' : 'text-gray-400'}`}>
              {formData.tashih_halaqah_id ? (
                halaqahData.find(h => h.id === formData.tashih_halaqah_id)?.name || '-'
              ) : (
                'Belum dipilih'
              )}
            </div>
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
  const [searchQuery, setSearchQuery] = useState('')

  // Use ref to always get latest formData
  const formDataRef = useRef(formData)
  formDataRef.current = formData

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
        // Use all_available_partners to show ALL selected thalibah
        setPartners(data.data?.all_available_partners || [])
      }
    } catch (error) {
      console.error('Fetch partners error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter partners based on search query
  const filteredPartners = partners.filter((partner) => {
    const fullName = partner.users?.full_name || ''
    return fullName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handlePartnerSelect = (partner: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event from bubbling to parent

    const updatedData = {
      ...formDataRef.current,
      partner_type: 'self_match',
      partner_user_id: partner.user_id
    }

    onChange(updatedData)
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
                Pilih pasangan belajar sendiri. Pasangan harus saling memilih untuk membentuk kelompok. Bisa lintas juz.
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
            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm text-gray-600 mb-3">Cari nama pasangan belajar:</p>

              {/* Search Input */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Ketik nama thalibah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Memuat daftar thalibah...</p>
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {searchQuery ? 'Tidak ada thalibah dengan nama tersebut' : 'Tidak ada thalibah lain yang tersedia'}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                  {filteredPartners.map((partner) => (
                    <div
                      key={partner.user_id}
                      onClick={(e) => handlePartnerSelect(partner, e)}
                      className={`
                        p-3 border-b border-gray-200 last:border-b-0 cursor-pointer transition-colors
                        ${formData.partner_user_id === partner.user_id
                          ? 'bg-green-50 hover:bg-green-100'
                          : 'bg-white hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{partner.users?.full_name}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Juz: {partner.registrations?.[0]?.chosen_juz || '-'} • {partner.users?.zona_waktu || '-'}
                          </p>
                        </div>
                        {formData.partner_user_id === partner.user_id && (
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.partner_user_id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange({
                      ...formDataRef.current,
                      partner_user_id: ''
                    })
                    setSearchQuery('')
                  }}
                  className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
                >
                  Ganti pilihan
                </button>
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
                Sistem akan memasangkan Anda berdasarkan jadwal utama, zona waktu, dan juz.
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
              <input
                type="text"
                placeholder="Nomor WhatsApp keluarga"
                value={formData.partner_wa_phone}
                onChange={e => onChange({ ...formData, partner_wa_phone: e.target.value })}
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
                placeholder="Username atau nama di aplikasi Tarteel"
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

    // Try to parse muallimah_schedule first, fallback to day_of_week/start_time/end_time
    if (halaqah.muallimah_schedule) {
      try {
        const schedule = JSON.parse(halaqah.muallimah_schedule)
        return `${schedule.day} • ${schedule.time_start} - ${schedule.time_end} WIB`
      } catch {
        // If parsing fails, use fallback
      }
    }

    const day = DAY_NAMES[halaqah.day_of_week || 0]
    const time = halaqah.start_time && halaqah.end_time
      ? `${halaqah.start_time} - ${halaqah.end_time} WIB`
      : ''
    return time ? `${day} • ${time}` : day
  }

  const getHalaqahDetails = (halaqahId: string) => {
    const halaqah = halaqahData.find(h => h.id === halaqahId)
    if (!halaqah) return null

    return {
      name: halaqah.name,
      schedule: getHalaqahSchedule(halaqahId),
      juz: halaqah.muallimah_preferred_juz || '-',
      location: halaqah.location || '-',
      muallimah: halaqah.mentors
        ?.filter((m: any) => m.role === 'muallimah')
        .map((m: any) => `Ustadzah ${m.users?.full_name}`)
        .join(', ') || '-'
    }
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
              <span className="text-gray-600">Juz Pilihan</span>
              <p className="font-medium">{formData.confirmed_chosen_juz}</p>
            </div>
            <div>
              <span className="text-gray-600">Juz Penempatan Final</span>
              <p className="font-medium">
                {formData.final_juz}
                {formData.juz_adjusted && (
                  <span className="ml-2 text-xs text-amber-600 font-semibold">
                    (Disesuaikan)
                  </span>
                )}
              </p>
              {formData.juz_adjusted && (
                <p className="text-xs text-gray-500 mt-1">{formData.juz_adjustment_reason}</p>
              )}
            </div>
            <div>
              <span className="text-gray-600">Waktu Utama</span>
              <p className="font-medium">{formatTimeSlot(formData.confirmed_main_time_slot)}</p>
            </div>
            <div>
              <span className="text-gray-600">Waktu Cadangan</span>
              <p className="font-medium">{formatTimeSlot(formData.confirmed_backup_time_slot)}</p>
            </div>
          </div>
        </div>

        {/* Halaqah */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Jadwal Halaqah</h3>
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-gray-600">Kelas Ujian</span>
              <p className="font-medium">{getHalaqahName(formData.ujian_halaqah_id)}</p>
              {(() => {
                const details = getHalaqahDetails(formData.ujian_halaqah_id)
                if (!details) return null
                return (
                  <div className="mt-1 text-gray-600 space-y-1">
                    <p>{details.schedule}</p>
                    <p>Juz: {details.juz}</p>
                    <p>Lokasi: {details.location}</p>
                    <p>Muallimah: {details.muallimah}</p>
                  </div>
                )
              })()}
            </div>
            <div>
              <span className="text-gray-600">Kelas Tashih</span>
              <p className="font-medium">{getHalaqahName(formData.tashih_halaqah_id)}</p>
              {(() => {
                const details = getHalaqahDetails(formData.tashih_halaqah_id)
                if (!details) return null
                return (
                  <div className="mt-1 text-gray-600 space-y-1">
                    <p>{details.schedule}</p>
                    <p>Juz: {details.juz}</p>
                    <p>Lokasi: {details.location}</p>
                    <p>Muallimah: {details.muallimah}</p>
                  </div>
                )
              })()}
            </div>
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
  onRemove,
  isLoading
}: {
  formData: any
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (index: number) => void
  isLoading: boolean
}) {
  const [akadData, setAkadData] = useState<{ title: string; content: string[]; fullText: string } | null>(null)
  const [isLoadingAkad, setIsLoadingAkad] = useState(true)
  const [akadError, setAkadError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAkadIntisari() {
      try {
        setIsLoadingAkad(true)
        setAkadError(null)

        const response = await fetch('/api/daftar-ulang/akad-intisari')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Gagal mengambil data akad')
        }

        setAkadData(data.data)
      } catch (error) {
        console.error('[AkadUploadStep] Error fetching akad:', error)
        setAkadError(error instanceof Error ? error.message : 'Terjadi kesalahan')
      } finally {
        setIsLoadingAkad(false)
      }
    }

    fetchAkadIntisari()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Akad</h2>
        <p className="text-gray-600 mb-6">
          Silakan tulis tangan intisari akad di bawah ini, tandatangani, lalu upload hasil scan/fotonya.
        </p>
      </div>

      {/* Akad Intisari Display */}
      {!isLoadingAkad && akadData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3 mb-4">
            <FileText className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">{akadData.title}</h3>
              <p className="text-sm text-amber-800 mb-4">
                Tulis teks di bawah ini dengan tangan pada kertas, lalu tandatangani dan upload.
              </p>
            </div>
          </div>

          {/* Akad Text Box */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-4">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
              {akadData.fullText}
            </pre>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Instruksi:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Tulis seluruh teks akad di atas dengan tangan pada kertas</li>
                  <li>Tandatangani di bagian bawah (tulis nama lengkap dan tanggal)</li>
                  <li>Scan atau foto hasil tulisan tangan Anda</li>
                  <li>Upload file hasil scan/foto di bawah ini</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state for akad data */}
      {isLoadingAkad && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <p className="text-gray-600">Memuat intisari akad...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {akadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-semibold">Gagal memuat intisari akad</p>
              <p className="mt-1">{akadError}</p>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        {formData.akad_files && formData.akad_files.length > 0 ? (
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <p className="font-medium text-gray-900">
                {formData.akad_files.length} File Akad berhasil diupload
              </p>
            </div>

            {/* List of uploaded files */}
            <div className="space-y-2">
              {formData.akad_files.map((file: { url: string; name: string }, index: number) => (
                <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-gray-900 truncate">{file.name}</p>
                  </div>
                  <button
                    onClick={() => onRemove(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Hapus file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <label className="inline-block">
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={onUpload}
                disabled={isLoading}
                multiple
                className="hidden"
              />
              <span className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer inline-block">
                {isLoading ? 'Mengupload...' : 'Tambah File'}
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="font-medium text-gray-900">Upload Akad</p>
              <p className="text-sm text-gray-600 mt-2">Upload satu atau beberapa file akad (PDF, JPG, PNG)</p>
            </div>
            <label className="inline-block">
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={onUpload}
                disabled={isLoading}
                multiple
                className="hidden"
              />
              <span className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer inline-block">
                {isLoading ? 'Mengupload...' : 'Pilih File'}
              </span>
            </label>
            <p className="text-xs text-gray-500">PDF, JPG, PNG - Maksimal 5MB per file</p>
          </div>
        )}
      </div>

      {formData.akad_files && formData.akad_files.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm text-green-800">
                Akad sudah siap ({formData.akad_files.length} file). Klik "Kirim Daftar Ulang" untuk menyelesaikan proses.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SuccessStep({ existingSubmission }: { existingSubmission?: any }) {
  const router = useRouter()

  // Check if this is a previously submitted registration
  const isPreviouslySubmitted = existingSubmission?.status === 'submitted'

  return (
    <div className="text-center py-8">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {isPreviouslySubmitted ? 'Anda Sudah Daftar Ulang' : 'Alhamdulillah! Daftar Ulang Berhasil'}
      </h2>
      <p className="text-gray-600 mb-8">
        {isPreviouslySubmitted
          ? 'Data daftar ulang Anda sudah kami terima. Admin akan memverifikasi data Anda dalam 1-2 hari kerja.'
          : 'Data daftar ulang Anda berhasil dikirim. Admin akan memverifikasi data Anda dalam 1-2 hari kerja.'}
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
