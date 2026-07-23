'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle, AlertCircle, Clock, Users, Calendar, Upload, Download, ChevronRight, ChevronLeft, Info, FileText, X, ImageIcon, Trash2 } from 'lucide-react'
import { submitDaftarUlang, saveDaftarUlangDraft, uploadAkad, approveDaftarUlangSubmission, getReregistrationQuestions } from './actions'
import { UserProfileCard } from '@/components/UserProfileCard'

type Step = 'confirm' | 'pengabdian' | 'review' | 'akad' | 'halaqah' | 'partner' | 'success'

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
  const [reregQuestions, setReregQuestions] = useState<any[]>([])

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
    pengabdian_choice: string
    donasi_amount: string
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
    ujian_halaqah_id: '',
    tashih_halaqah_id: '',
    partner_type: '',
    partner_user_id: '',
    partner_name: '',
    partner_relationship: '',
    partner_wa_phone: '',
    partner_notes: '',

    // Step 2: Pengabdian
    pengabdian_choice: '',
    donasi_amount: '',

    // Step 3: Akad
    akad_files: [],
  })

  const isPraTikrar = registrationData?.selection_status === 'waitlist'

  // Fetch registration data and halaqah on mount
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch questions
        const questionsResult = await getReregistrationQuestions()
        if (questionsResult.success && questionsResult.data) {
          setReregQuestions(questionsResult.data)
        }

        // Fetch registration data
        const regResponse = await fetch('/api/pendaftaran/my')
        if (!regResponse.ok) throw new Error('Failed to fetch registration')

        const regData = await regResponse.json()

        // Get registrations for thalibah
        const selectedRegistration = regData.data?.find(
          (r: any) => ['selected', 'waitlist'].includes(r.selection_status) && r.role === 'thalibah'
        )

        if (!selectedRegistration) {
          console.log('[Daftar Ulang] No selected thalibah registration found')
          toast.error('Tidak ditemukan data pendaftaran thalibah yang lolos seleksi. Daftar ulang hanya untuk thalibah yang lolos seleksi.')
          router.push('/perjalanan-saya')
          return
        }

        // Check if user has taken the written test (unless they are alumni)
        let isAlumnus = false;
        try {
          const alumniRes = await fetch('/api/alumni/testimonial/my');
          if (alumniRes.ok) {
            const alumniData = await alumniRes.json();
            isAlumnus = alumniData?.isAlumni === true;
          }
        } catch (e) {
          console.error('Error fetching alumni status:', e);
        }

        const hasWritten = !!(
          selectedRegistration.written_quiz_submitted_at || 
          selectedRegistration.written_submitted_at || 
          selectedRegistration.exam_score != null || 
          selectedRegistration.written_quiz_score != null
        );

        if (!hasWritten && !isAlumnus) {
          toast.error('Anda harus menyelesaikan Test Tertulis terlebih dahulu sebelum mengisi formulir Daftar Ulang.');
          // Redirect them to the test or user journey
          const batchParam = selectedRegistration.batch_id ? `?batchId=${selectedRegistration.batch_id}` : '';
          router.push(`/seleksi/pilihan-ganda${batchParam}`);
          return
        }

        // Check if user has passed the Kuis Pemahaman Akad (required before Daftar Ulang)
        let hasPassedAkadQuiz = false;
        try {
          const akadQuizRes = await fetch('/api/akad-quiz/attempts');
          if (akadQuizRes.ok) {
            const akadQuizData = await akadQuizRes.json();
            const latestAttempt = akadQuizData?.data?.[0];
            hasPassedAkadQuiz = !!latestAttempt?.passed;
          }
        } catch (e) {
          console.error('Error fetching akad quiz status:', e);
        }

        if (!hasPassedAkadQuiz) {
          toast.error('Anda harus lulus Kuis Pemahaman Akad (nilai 100) terlebih dahulu sebelum mengisi formulir Daftar Ulang.');
          router.push('/seleksi/kuis-akad');
          return
        }

        // Calculate isAdmin
        const userRole = (user as any)?.roles?.[0] || (user as any)?.role || (user as any)?.primaryRole || null;
        const isAdmin = userRole === 'admin' || userRole === 'super_admin';

        // Verify if selection result date has been reached
        if (selectedRegistration.batch?.selection_result_date && !isAdmin) {
          const now = new Date()
          const announcementDate = new Date(selectedRegistration.batch.selection_result_date)
          
          // Set to start of day for comparison
          announcementDate.setHours(0, 0, 0, 0)
          now.setHours(0, 0, 0, 0)
          
          if (now < announcementDate) {
            toast.error('Pengumuman seleksi belum dibuka. Daftar ulang akan tersedia setelah hasil seleksi diumumkan.')
            router.push('/perjalanan-saya')
            return
          }
        }

        setRegistrationData(selectedRegistration)

        const chosenJuz = (selectedRegistration.chosen_juz || '').toUpperCase()

        setFormData(prev => ({
          ...prev,
          confirmed_full_name: selectedRegistration.full_name || (user as any)?.user_metadata?.full_name || prev.confirmed_full_name,
          confirmed_chosen_juz: selectedRegistration.chosen_juz || prev.confirmed_chosen_juz,
          confirmed_main_time_slot: selectedRegistration.main_time_slot || prev.confirmed_main_time_slot,
          confirmed_backup_time_slot: selectedRegistration.backup_time_slot || prev.confirmed_backup_time_slot,
          confirmed_wa_phone: selectedRegistration.wa_phone || (user as any)?.user_metadata?.wa_phone || prev.confirmed_wa_phone,
          confirmed_address: selectedRegistration.address || prev.confirmed_address,
          exam_score: selectedRegistration.exam_score || null,
          final_juz: chosenJuz,
          juz_adjusted: false,
          juz_adjustment_reason: '',
        }))

        // Fetch halaqah data
        const halaqahResponse = await fetch('/api/daftar-ulang/halaqah')
        if (!halaqahResponse.ok) {
          const errorData = await halaqahResponse.json()
          if (halaqahResponse.status === 403) {
            // Daftar ulang belum dibuka
            toast.error(errorData.message || errorData.error || 'Daftar ulang belum dibuka')
            router.push('/perjalanan-saya')
            return
          }
          throw new Error(errorData.error || 'Failed to fetch halaqah data')
        }

        const halaqahDataResult = await halaqahResponse.json()
        setHalaqahData(halaqahDataResult.data?.halaqah || [])
        setExistingSubmission(halaqahDataResult.data?.existing_submission)

        // Debug: log existing submission data
        console.log('[Daftar Ulang] Existing submission:', halaqahDataResult.data?.existing_submission)

        // Check if user already submitted daftar ulang OR approved
        const submissionStatus = halaqahDataResult.data?.existing_submission?.status
        const existingSub = halaqahDataResult.data?.existing_submission

        if (submissionStatus === 'submitted' || submissionStatus === 'approved') {
          if (submissionStatus === 'approved') {
            if (!existingSub.ujian_halaqah_id) {
              // Approved but hasn't selected halaqah
              setCurrentStep('halaqah')
            } else if (!existingSub.partner_type) {
              // Approved, has halaqah, hasn't selected partner
              setCurrentStep('partner')
            } else {
              // Fully completed, redirect to perjalanan-saya
              toast.success('Alhamdulillah! Daftar ulang selesai.')
              router.push('/perjalanan-saya')
              return
            }
          } else {
            // Submitted but not approved
            setCurrentStep('success')
            toast.success('Anda sudah melakukan daftar ulang! Menunggu persetujuan admin.')
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

  // Load existing submission data into form
  // For draft status: reset halaqah selection but preserve akad files and partner data
  // This ensures user always picks from current quota availability
  // For submitted/approved status: load all data but don't change step (it's set in fetchData)
  useEffect(() => {
    if (!existingSubmission) return

    const isDraft = existingSubmission.status === 'draft'
    const isLocked = existingSubmission.status === 'submitted' || existingSubmission.status === 'approved'

    setFormData(prev => ({
      ...prev,
      // Load confirmed personal data from draft if available
      confirmed_full_name: existingSubmission.confirmed_full_name || prev.confirmed_full_name,
      confirmed_chosen_juz: existingSubmission.confirmed_chosen_juz || prev.confirmed_chosen_juz,
      confirmed_main_time_slot: existingSubmission.confirmed_main_time_slot || prev.confirmed_main_time_slot,
      confirmed_backup_time_slot: existingSubmission.confirmed_backup_time_slot || prev.confirmed_backup_time_slot,
      confirmed_wa_phone: existingSubmission.confirmed_wa_phone || prev.confirmed_wa_phone,
      confirmed_address: existingSubmission.confirmed_address || prev.confirmed_address,
      // For draft: reset halaqah selections so user always picks from current options
      // For locked (submitted/approved): load the actual selections
      ujian_halaqah_id: isDraft ? '' : (existingSubmission.ujian_halaqah_id || ''),
      tashih_halaqah_id: isDraft ? '' : (existingSubmission.tashih_halaqah_id || ''),
      // Preserve partner data for both draft and submitted
      partner_type: existingSubmission.partner_type || '',
      partner_user_id: existingSubmission.partner_user_id || '',
      partner_name: existingSubmission.partner_name || '',
      partner_relationship: existingSubmission.partner_relationship || '',
      partner_wa_phone: existingSubmission.partner_wa_phone || '',
      partner_notes: existingSubmission.partner_notes || '',
      pengabdian_choice: existingSubmission.pengabdian_choice || '',
      donasi_amount: existingSubmission.donasi_amount ? String(existingSubmission.donasi_amount) : '',
      // Preserve akad files for both draft and submitted
      akad_files: existingSubmission.akad_files || [],
    }))

    // Only change step for draft status
    // For submitted/approved status, step is already set in fetchData
    if (isDraft) {
      setCurrentStep('pengabdian')
    }
  }, [existingSubmission])

  // Save draft on form data changes (debounced)
  // IMPORTANT: DO NOT save draft for submitted/approved status - this would overwrite halaqah data!
  useEffect(() => {
    if (!registrationData?.id) return

    // Prevent auto-save for submitted/approved submissions
    // This is critical to avoid overwriting halaqah_id with null
    if (existingSubmission?.status === 'submitted' || existingSubmission?.status === 'approved') {
      console.log('[Daftar Ulang] Skipping draft save for locked status:', existingSubmission.status)
      return
    }

    const timer = setTimeout(async () => {
      // Only save if we have meaningful data
      // IMPORTANT: Draft saves partner data and akad files, but NOT halaqah selection
      const hasValidPartnerType = formData.partner_type !== ''
      const hasAkadFiles = formData.akad_files && formData.akad_files.length > 0

      if (hasValidPartnerType || hasAkadFiles) {
        // Build data to save, excluding empty partner_type
        // Note: Halaqah IDs are included here but will be set to null in saveDaftarUlangDraft
        const dataToSave: any = {
          confirmed_full_name: formData.confirmed_full_name,
          confirmed_chosen_juz: formData.confirmed_chosen_juz,
          confirmed_main_time_slot: formData.confirmed_main_time_slot,
          confirmed_backup_time_slot: formData.confirmed_backup_time_slot,
          confirmed_wa_phone: formData.confirmed_wa_phone,
          confirmed_address: formData.confirmed_address,
          pengabdian_choice: formData.pengabdian_choice,
          donasi_amount: formData.donasi_amount,
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
  }, [formData, registrationData?.id, existingSubmission?.status])

  const handleNext = () => {

    // Validate current step before proceeding
    if (currentStep === 'confirm') {
      if (!formData.confirmed_full_name) {
        toast.error('Nama lengkap harus diisi')
        return
      }
      setCurrentStep('pengabdian')
    } else if (currentStep === 'pengabdian') {
      if (!formData.pengabdian_choice) {
        toast.error('Pilih kesediaan pengabdian')
        return
      }
      
      if (formData.pengabdian_choice === 'Donatur') {
        if (!formData.donasi_amount) {
          toast.error('Pilih atau masukkan nominal komitmen donasi')
          return
        }
      }

      setCurrentStep('review')
    } else if (currentStep === 'review') {
      setCurrentStep('akad')
    } else if (currentStep === 'akad') {
      handleSubmit()
    } else if (currentStep === 'halaqah') {
      if (!formData.ujian_halaqah_id) {
        toast.error('Pilih halaqah terlebih dahulu')
        return
      }
      if (isPraTikrar) {
        handleSubmit()
      } else {
        setCurrentStep('partner')
      }
    } else if (currentStep === 'partner') {
      if (!formData.partner_type) {
        toast.error('Pilih tipe pasangan')
        return
      }
      handleSubmit()
    }
  }

  const handleBack = () => {
    const steps: Step[] = ['confirm', 'pengabdian', 'review', 'akad', 'halaqah', 'partner', 'success']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      if (currentStep === 'success' && isPraTikrar) {
        setCurrentStep('halaqah')
      } else {
        setCurrentStep(steps[currentIndex - 1])
      }
    }
  }

  const handleSubmit = async () => {
    if (!registrationData?.id) return

    if (!formData.akad_files || formData.akad_files.length === 0) {
      toast.error('Upload akad terlebih dahulu')
      return
    }

    setIsLoading(true)
    try {
      const submitData = {
        ...formData
      }

      // Debug log to verify halaqah IDs are being sent
      console.log('[handleSubmit] Submitting daftar ulang with data:', {
        ujian_halaqah_id: submitData.ujian_halaqah_id,
        tashih_halaqah_id: submitData.tashih_halaqah_id,
        partner_type: submitData.partner_type,
        akad_files_count: submitData.akad_files?.length
      })

      const result = await submitDaftarUlang(registrationData.id, submitData)

      if (result.success) {
        toast.success(result.message || 'Berhasil disimpan!')
        
        if (currentStep === 'akad') {
          setCurrentStep('halaqah')
        } else if (currentStep === 'partner') {
          router.push('/perjalanan-saya')
        } else {
          setCurrentStep('success')
        }
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

  // If user already submitted or approved, show read-only info page (not the form)
  const isSubmissionLocked = existingSubmission?.status === 'submitted' || existingSubmission?.status === 'approved'

  if (isSubmissionLocked) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Profile Card */}
          <UserProfileCard userId={user?.id} showAlert={false} showTitle={true} />

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Status Daftar Ulang</h1>
                <p className="text-gray-600">
                  {existingSubmission?.status === 'approved'
                    ? 'Alhamdulillah! Daftar ulang Anda telah disetujui.'
                    : 'Daftar ulang Anda telah berhasil dikirim.'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/perjalanan-saya')}
                className="flex items-center gap-2"
              >
                Ke Perjalanan Saya
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Info Card */}
          <Card className={`mb-6 ${existingSubmission?.status === 'approved' ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                {existingSubmission?.status === 'approved' ? (
                  <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-1" />
                ) : (
                  <Clock className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${existingSubmission?.status === 'approved' ? 'text-emerald-900' : 'text-blue-900'}`}>
                    {existingSubmission?.status === 'approved'
                      ? 'Pendaftaran Disetujui'
                      : 'Menunggu Konfirmasi'}
                  </h3>
                  <p className={`text-sm mb-4 ${existingSubmission?.status === 'approved' ? 'text-emerald-800' : 'text-blue-800'}`}>
                    {existingSubmission?.status === 'approved'
                      ? 'Anda telah resmi terdaftar dalam program Tikrar Tahfidz. Silakan cek jadwal halaqah dan mulai persiapan.'
                      : 'Daftar ulang Anda sedang diproses oleh admin. Anda akan menerima notifikasi setelah ada konfirmasi.'}
                  </p>

                  {/* Submission Details */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Detail Pengajuan:</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Juz:</span>
                        <span className="ml-2 font-medium">{existingSubmission?.confirmed_chosen_juz || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 font-medium ${existingSubmission?.status === 'approved' ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {existingSubmission?.status === 'approved' ? 'Disetujui' : 'Menunggu Konfirmasi'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Show the success step with full details */}
          <SuccessStep existingSubmission={existingSubmission} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Profile Card */}
        <UserProfileCard userId={user?.id} showAlert={false} showTitle={true} />

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
              { key: 'pengabdian', label: 'Pengabdian' },
              { key: 'review', label: 'Review' },
              { key: 'akad', label: 'Upload Akad' },
            ].map((step, index) => {
              const steps: Step[] = ['confirm', 'pengabdian', 'review', 'akad']
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
                  {index < 3 && (
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
                reregQuestions={reregQuestions}
              />
            )}

            {currentStep === 'pengabdian' && (
              <PengabdianStep
                formData={formData}
                onChange={setFormData}
                reregQuestions={reregQuestions}
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
                halaqahData={halaqahData}
                registrationData={registrationData}
                onUpload={handleAkadUpload}
                onRemove={handleRemoveAkadFile}
                isLoading={isLoading}
                existingSubmission={existingSubmission}
                reregQuestions={reregQuestions}
              />
            )}

            {currentStep === 'halaqah' && (
              <HalaqahSelectionStep
                halaqahData={halaqahData}
                formData={formData}
                onChange={setFormData}
                reregQuestions={reregQuestions}
              />
            )}

            {currentStep === 'partner' && (
              <PartnerSelectionStep
                formData={formData}
                onChange={setFormData}
                registrationId={registrationData?.id}
                reregQuestions={reregQuestions}
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
          <div className="fixed bottom-24 md:bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
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
  onChange,
  reregQuestions
}: {
  formData: any
  onChange: (data: any) => void
  reregQuestions: any[]
}) {
  const nameQuestion = reregQuestions.find(q => q.field_key === 'confirmed_full_name')
  const waQuestion = reregQuestions.find(q => q.field_key === 'confirmed_wa_phone')
  const addressQuestion = reregQuestions.find(q => q.field_key === 'confirmed_address')

  const isWaActive = waQuestion ? waQuestion.is_active : true
  const isAddressActive = addressQuestion ? addressQuestion.is_active : true

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Konfirmasi Data Diri</h2>
        <p className="text-gray-600 mb-6">Pastikan data di bawah ini sudah benar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {nameQuestion?.label || 'Nama Lengkap'}
          </label>
          <input
            type="text"
            value={formData.confirmed_full_name}
            onChange={e => onChange({ ...formData, confirmed_full_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          {nameQuestion?.description && (
            <p className="text-xs text-gray-500 mt-1">{nameQuestion.description}</p>
          )}
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

        {isWaActive && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {waQuestion?.label || 'WhatsApp'}
            </label>
            <input
              type="text"
              value={formData.confirmed_wa_phone}
              onChange={e => onChange({ ...formData, confirmed_wa_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {waQuestion?.description && (
              <p className="text-xs text-gray-500 mt-1">{waQuestion.description}</p>
            )}
          </div>
        )}

        {isAddressActive && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {addressQuestion?.label || 'Alamat'}
            </label>
            <textarea
              value={formData.confirmed_address}
              onChange={e => onChange({ ...formData, confirmed_address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {addressQuestion?.description && (
              <p className="text-xs text-gray-500 mt-1">{addressQuestion.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function HalaqahSelectionStep({
  halaqahData,
  formData,
  onChange,
  reregQuestions
}: {
  halaqahData: HalaqahData[]
  formData: any
  onChange: (data: any) => void
  reregQuestions: any[]
}) {
  const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']

  // Helper to check if class type is available
  const hasUjian = (halaqah: HalaqahData) =>
    halaqah.class_types.some(ct => ct.class_type === 'ujian')
  const hasTashih = (halaqah: HalaqahData) =>
    halaqah.class_types.some(ct => ct.class_type === 'tashih')
  const isTashihUjianBoth = (halaqah: HalaqahData) =>
    halaqah.class_type === 'tashih_ujian'

  const togglePackage = (halaqahId: string) => {
    const halaqah = halaqahData.find(h => h.id === halaqahId)
    if (!halaqah) return

    const newHalaqahId = formData.ujian_halaqah_id === halaqahId ? '' : halaqahId
    onChange({ 
      ...formData, 
      ujian_halaqah_id: newHalaqahId,
      tashih_halaqah_id: newHalaqahId 
    })
  }

  const isSelected = (halaqahId: string) => formData.ujian_halaqah_id === halaqahId
  const isUjianSelected = isSelected
  const isTashihSelected = isSelected
  const toggleUjian = togglePackage
  const toggleTashih = togglePackage


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

  // Only "Tashih + Ujian" combo halaqah are offered now — standalone Tashih-only
  // and Ujian-only packages have been discontinued and should not be shown.
  const sortedHalaqahData = halaqahData
    .filter(h => h.class_type === 'tashih_ujian')
    .sort((a, b) => {
      const priorityA = getSortPriority(a.class_type)
      const priorityB = getSortPriority(b.class_type)
      return priorityA - priorityB
    })

  const scheduleQuestion = reregQuestions.find(q => q.field_key === 'schedule_instructions')

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {scheduleQuestion?.label || "Pilih Jadwal Halaqah"}
        </h2>
        <p className="text-emerald-50">
          {scheduleQuestion?.description || "Pilih jadwal untuk kelas ujian dan/atau kelas tashih. Waktu yang ditampilkan dalam WIB."}
        </p>
      </div>

      {/* Halaqah List with Colorful Cards */}
      <div className="space-y-4">
        {sortedHalaqahData.length === 0 ? (
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
            const ujianSelected = isSelected(halaqah.id)
            const tashihSelected = isSelected(halaqah.id)
            const isBothRequired = isTashihUjianBoth(halaqah)
            const selected = isSelected(halaqah.id)

            return (
              <div
                key={halaqah.id}
                onClick={() => !halaqah.is_full && togglePackage(halaqah.id)}
                className={`
                  relative border-2 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md cursor-pointer
                  ${halaqah.is_full && !selected ? 'bg-gray-50 border-gray-300 opacity-75' : 'bg-white border-gray-200 hover:border-emerald-300'}
                  ${selected ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}
                `}
              >
                <div className={`absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white z-10
                  ${selected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                  {selected && <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                </div>
                {/* Header with name and class type badge */}                {/* Header with name and class type badge */}
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
                    {isBothRequired ? (
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
                      </>
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
        <div className="grid grid-cols-1 gap-3">
          <div className={`p-3 rounded-lg ${formData.ujian_halaqah_id ? 'bg-green-100 border border-green-300' : 'bg-gray-100'}`}>
            <span className="text-xs text-gray-600 uppercase tracking-wide">Kelas Halaqah (Tashih + Ujian)</span>
            <div className={`font-medium mt-1 ${formData.ujian_halaqah_id ? 'text-green-800' : 'text-gray-400'}`}>
              {formData.ujian_halaqah_id ? (
                halaqahData.find(h => h.id === formData.ujian_halaqah_id)?.name || '-'
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


function PengabdianStep({
  formData,
  onChange,
  reregQuestions
}: {
  formData: any
  onChange: (data: any) => void
  reregQuestions: any[]
}) {
  const pengabdianQuestion = reregQuestions.find(q => q.field_key === 'pengabdian_choice')
  const donasiQuestion = reregQuestions.find(q => q.field_key === 'donasi_amount')

  const pengabdianOptions = pengabdianQuestion?.options || ['Muallimah', 'Musyrifah', 'Admin', 'Donatur', 'Tidak untuk saat ini']
  const donasiOptions = donasiQuestion?.options || ['Rp 25.000', 'Rp 50.000', 'Rp 75.000', 'Rp 100.000', 'Lainnya']

  const isDonatur = formData.pengabdian_choice === 'Donatur'
  
  // Clean format helper
  const cleanNumber = (val: string) => val.replace(/\D/g, '')
  const formatRupiah = (val: string) => {
    if (!val) return ''
    return 'Rp ' + parseInt(val, 10).toLocaleString('id-ID')
  }

  // Handle custom donasi logic
  const handleDonasiSelection = (opt: string) => {
    if (opt === 'Lainnya') {
      onChange({ ...formData, donasi_amount: '' }) // Clear so user can type
    } else {
      onChange({ ...formData, donasi_amount: cleanNumber(opt) }) // Save raw number
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {pengabdianQuestion?.label || "Pengabdian & Kontribusi"}
        </h2>
        <p className="text-blue-50">
          {pengabdianQuestion?.description || "Program Tikrar Tahfidz membuka kesempatan bagi thalibah yang ingin berkhidmat."}
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Pilih Bentuk Pengabdian</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pengabdianOptions.map((opt: string) => (
            <label 
              key={opt} 
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.pengabdian_choice === opt ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              <input
                type="radio"
                name="pengabdian_choice"
                value={opt}
                checked={formData.pengabdian_choice === opt}
                onChange={(e) => {
                  onChange({ ...formData, pengabdian_choice: e.target.value, donasi_amount: '' })
                }}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-3 font-medium text-gray-900">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {isDonatur && (
        <div className="mt-8 pt-6 border-t border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {donasiQuestion?.label || "Komitmen Infaq / Donasi"}
            </label>
            <p className="text-sm text-gray-500 mb-4">
              {donasiQuestion?.description || "Silakan pilih nominal komitmen infaq per bulan/batch."}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {donasiOptions.filter((opt: string) => opt !== 'Lainnya').map((opt: string) => {
              const numVal = cleanNumber(opt)
              const isSelected = formData.donasi_amount === numVal
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleDonasiSelection(opt)}
                  className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${isSelected ? 'bg-emerald-100 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {opt}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => handleDonasiSelection('Lainnya')}
              className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${!donasiOptions.map(cleanNumber).includes(formData.donasi_amount) && formData.donasi_amount !== '' ? 'bg-emerald-100 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Lainnya
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">Rp</span>
              </div>
              <input
                type="text"
                placeholder="0"
                value={formatRupiah(formData.donasi_amount).replace('Rp ', '')}
                onChange={(e) => {
                  const raw = cleanNumber(e.target.value)
                  onChange({ ...formData, donasi_amount: raw })
                }}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PartnerSelectionStep({
  formData,
  onChange,
  registrationId,
  reregQuestions
}: {
  formData: any
  onChange: (data: any) => void
  registrationId?: string
  reregQuestions: any[]
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

  const partnerTypeQuestion = reregQuestions.find(q => q.field_key === 'partner_type')
  const selfMatchQuestion = reregQuestions.find(q => q.field_key === 'partner_self_match')
  const systemMatchQuestion = reregQuestions.find(q => q.field_key === 'partner_system_match')
  const familyQuestion = reregQuestions.find(q => q.field_key === 'partner_family')
  const tarteelQuestion = reregQuestions.find(q => q.field_key === 'partner_tarteel')

  const isSelfActive = selfMatchQuestion ? selfMatchQuestion.is_active : true
  const isSystemActive = systemMatchQuestion ? systemMatchQuestion.is_active : true
  const isFamilyActive = familyQuestion ? familyQuestion.is_active : true
  const examScore = formData.exam_score || 0
  const isTarteelEligible = examScore >= 90
  const isTarteelActive = tarteelQuestion ? tarteelQuestion.is_active : true

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {partnerTypeQuestion?.label || "Pilih Pasangan Belajar"}
        </h2>
        <p className="text-gray-600 mb-6">
          {partnerTypeQuestion?.description || "Pilih pasangan belajar untuk program Tikrar Tahfidz"}
        </p>
      </div>

      <div className="space-y-4">
        {/* Self Match */}
        {isSelfActive && (
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
                <h3 className="font-medium text-gray-900">
                  {selfMatchQuestion?.label || 'Pilih Sendiri'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selfMatchQuestion?.description || 'Pilih pasangan belajar sendiri. Pasangan harus saling memilih untuk membentuk kelompok. Bisa lintas juz.'}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto p-2">
                    {filteredPartners.map((partner) => {
                      const reg = partner.registrations?.[0]
                      
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

                      // Format wa phone
                      const cleanPhone = reg?.wa_phone?.replace(/\D/g, '') || ''
                      const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}` : '#'

                      return (
                        <div
                          key={partner.user_id}
                          onClick={(e) => handlePartnerSelect(partner, e)}
                          className={`
                            relative p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md flex flex-col justify-between
                            ${formData.partner_user_id === partner.user_id
                              ? 'bg-green-50 border-green-500 ring-1 ring-green-500'
                              : 'bg-white border-gray-200 hover:border-green-300'
                            }
                          `}
                        >
                          {/* Top row: Badges */}
                          <div className="absolute top-3 right-3 flex flex-col items-end space-y-1">
                            {formData.partner_user_id === partner.user_id && (
                              <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Dipilih</span>
                              </div>
                            )}
                            {partner.has_user_selected_them && (
                              <div className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                                Memilih Anda
                              </div>
                            )}
                          </div>

                          <div>
                            {/* Profile Header */}
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg">
                                {partner.users?.full_name?.charAt(0) || '?'}
                              </div>
                              <div className="pr-16"> {/* Padding right to avoid overlapping badges */}
                                <h4 className="font-semibold text-gray-900 leading-tight">
                                  {partner.users?.full_name}
                                </h4>
                                <p className="text-xs text-gray-500">{ageText} • {reg?.domicile || 'Lokasi tidak diketahui'}</p>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                              <div className="bg-gray-50 rounded p-2">
                                <span className="block text-gray-500 mb-1">Juz Pilihan</span>
                                <span className="font-medium text-gray-900">{reg?.chosen_juz || '-'}</span>
                              </div>
                              <div className="bg-gray-50 rounded p-2">
                                <span className="block text-gray-500 mb-1">Zona Waktu</span>
                                <span className="font-medium text-gray-900">{reg?.timezone || 'WIB'}</span>
                              </div>
                              <div className="bg-gray-50 rounded p-2 col-span-2">
                                <span className="block text-gray-500 mb-1">Ketersediaan Waktu</span>
                                <span className="font-medium text-gray-900">
                                  {reg?.main_time_slot ? formatTimeSlot(reg.main_time_slot) : '-'}
                                </span>
                                {reg?.backup_time_slot && (
                                  <span className="block text-gray-500 mt-1">
                                    Alt: {formatTimeSlot(reg.backup_time_slot)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
                            {cleanPhone ? (
                              <a 
                                href={waLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.393.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-5.824 4.74-10.563 10.567-10.563 2.82 0 5.474 1.098 7.466 3.09 1.989 1.991 3.086 4.646 3.085 7.469-.002 5.822-4.742 10.561-10.566 10.561z"/>
                                </svg>
                                Hubungi via WA
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400">No WA tidak tersedia</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
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
        )}

        {/* System Match */}
        {isSystemActive && (
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
                <h3 className="font-medium text-gray-900">
                  {systemMatchQuestion?.label || 'Dipasangkan oleh Sistem'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {systemMatchQuestion?.description || 'Sistem akan memasangkan Anda berdasarkan jadwal utama, zona waktu, dan juz.'}
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
        )}

        {/* Family */}
        {isFamilyActive && (
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
                <h3 className="font-medium text-gray-900">
                  {familyQuestion?.label || 'Keluarga (Mahram)'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {familyQuestion?.description || 'Setoran kepada keluarga (Ayah, Ibu, anak, atau saudara mahram).'}
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
        )}

        {/* Tarteel */}
        {isTarteelActive && (
          <div
            className={`border rounded-lg p-4 transition-all ${
              !isTarteelEligible 
                ? 'border-gray-100 bg-gray-50/50 cursor-not-allowed opacity-60' 
                : formData.partner_type === 'tarteel'
                ? 'border-green-500 bg-green-50 ring-2 ring-green-500 cursor-pointer'
                : 'border-gray-200 hover:border-gray-300 cursor-pointer'
            }`}
            onClick={() => {
              if (isTarteelEligible) {
                onChange({ ...formData, partner_type: 'tarteel' })
              } else {
                toast.error('Pilihan Tarteel hanya tersedia untuk thalibah dengan nilai seleksi lisan minimal 90.')
              }
            }}
          >
            <div className="flex items-start space-x-3">
              <Upload className="w-6 h-6 text-orange-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  {tarteelQuestion?.label || 'Aplikasi Tarteel'}
                  {!isTarteelEligible && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
                      Nilai &lt; 90
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {tarteelQuestion?.description || 'Setoran mandiri menggunakan aplikasi Tarteel dengan lampiran screenshot penggunaan.'}
                </p>
                {!isTarteelEligible && (
                  <p className="text-xs text-red-600 mt-2 font-semibold">
                    *Hanya untuk thalibah dengan nilai seleksi lisan minimal 90 (Nilai seleksi Anda: {examScore})
                  </p>
                )}
              </div>
              <input
                type="radio"
                checked={formData.partner_type === 'tarteel'}
                disabled={!isTarteelEligible}
                readOnly
                className="w-5 h-5 text-green-600"
              />
            </div>

            {isTarteelEligible && formData.partner_type === 'tarteel' && (
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
        )}
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
  halaqahData,
  registrationData,
  onUpload,
  onRemove,
  isLoading,
  existingSubmission,
  reregQuestions
}: {
  formData: any
  halaqahData: any[]
  registrationData: any
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (index: number) => void
  isLoading: boolean
  existingSubmission?: any
  reregQuestions: any[]
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

  const akadQuestion = reregQuestions.find(q => q.field_key === 'akad_upload')
  const commitmentInfo = reregQuestions.find(q => q.field_key === 'commitment_info')

  return (
    <div className="space-y-6">
      {commitmentInfo?.is_active && (
        <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-6 whitespace-pre-line">
          <h3 className="text-base font-bold text-emerald-900 mb-2 flex items-center gap-2">
            {commitmentInfo.label}
          </h3>
          <p className="text-sm text-emerald-800 leading-relaxed font-medium">
            {commitmentInfo.description}
          </p>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Salin & Upload Akad
        </h2>
        <p className="text-gray-600 mb-6">
          Silakan salin teks akad di bawah ini dengan tulisan tangan Anda, tandatangani, lalu foto dan upload.
        </p>
      </div>

      {/* Review Data Again - Minimal */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
         <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <h3 className="font-semibold text-gray-800">Ringkasan Data & Pilihan</h3>
         </div>
         <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block text-gray-500 mb-1">Pengabdian / Donasi</span>
              <span className="font-medium">{formData.pengabdian_type === 'donasi' ? `Donasi (Rp ${formData.donasi_amount || 0})` : (formData.pengabdian_type || '-')}</span>
            </div>
         </div>
      </div>

      {/* Teks Akad untuk Disalin */}
      {!isLoadingAkad && akadData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3 mb-4">
            <FileText className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">{akadData.title}</h3>
              <p className="text-sm text-amber-800 mb-4">
                Berikut adalah teks akad yang harus Anda tulis tangan (salin). Beberapa bagian sudah disesuaikan dengan data Anda.
              </p>
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto font-mono text-sm whitespace-pre-wrap text-gray-800">
            {akadData.fullText}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Instruksi:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Siapkan kertas kosong dan pulpen.</li>
                  <li>Salin (tulis ulang dengan tulisan tangan Anda sendiri) seluruh teks akad di atas pada kertas tersebut.</li>
                  <li>Tandatangani kertas akad yang sudah Anda tulis tangan.</li>
                  <li>Foto kertas akad tersebut dengan jelas.</li>
                  <li>Upload foto akad di bawah ini.</li>
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

      {/* Previously Uploaded Akad Files Info */}
      {existingSubmission?.status === 'draft' &&
       existingSubmission?.akad_files &&
       existingSubmission.akad_files.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Akad Sebelumnya Telah Tersimpan</p>
              <p className="text-blue-700">
                Anda sudah mengupload {existingSubmission.akad_files.length} file akad sebelumnya.
                File-file tersebut masih tersimpan dan Anda tidak perlu mengupload ulang kecuali ingin menggantinya.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {formData.akad_files?.map((file: any, index: number) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3 truncate">
              {file.type?.includes('image') ? (
                <ImageIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              ) : (
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <span className="text-sm text-gray-700 truncate">{file.name || 'File Akad'}</span>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <label
        htmlFor="akad-upload"
        className={`relative border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">Klik untuk upload file yang sudah ditandatangani</p>
        <p className="text-xs text-gray-500 mb-4">Format: JPG, PNG, atau PDF (Max 5MB)</p>
        
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={onUpload}
          disabled={isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="akad-upload"
          multiple
        />
        <div
          className={`px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Mengupload...' : 'Pilih File'}
        </div>
      </label>
    </div>
  )
}


function SuccessStep({ existingSubmission }: { existingSubmission?: any }) {
  const router = useRouter()
  const { user } = useAuth()

  // Debug: log existing submission received by SuccessStep
  console.log('[SuccessStep] Received existingSubmission:', existingSubmission)
  console.log('[SuccessStep] ujian_halaqah_obj:', existingSubmission?.ujian_halaqah_obj)
  console.log('[SuccessStep] tashih_halaqah_obj:', existingSubmission?.tashih_halaqah_obj)

  // Check submission status
  const submissionStatus = existingSubmission?.status
  const isApproved = submissionStatus === 'approved'
  const isSubmitted = submissionStatus === 'submitted'

  // Check if current user is admin
  const isAdmin = user?.roles?.includes('admin') || false
  const canApprove = isAdmin && isSubmitted

  // Handle approve action
  const handleApprove = async () => {
    if (!existingSubmission?.id) return

    const result = await approveDaftarUlangSubmission(existingSubmission.id)

    if (result.success) {
      toast.success(result.message || 'Pendaftaran berhasil disetujui')
      // Refresh the page to show updated status
      router.refresh()
    } else {
      toast.error(result.error || 'Gagal menyetujui pendaftaran')
    }
  }

  return (
    <div className="text-center py-8">
      <CheckCircle className={`w-16 h-16 mx-auto mb-4 ${isApproved ? 'text-emerald-600' : 'text-green-600'}`} />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {isApproved
          ? 'Alhamdulillah! Daftar Ulang Anda Disetujui'
          : isSubmitted
          ? 'Anda Sudah Daftar Ulang'
          : 'Alhamdulillah! Daftar Ulang Berhasil'}
      </h2>
      <p className="text-gray-600 mb-8">
        {isApproved
          ? 'Selamat! Daftar ulang Anda telah disetujui. Berikut adalah informasi kelas yang akan Anda ikuti:'
          : isSubmitted
          ? 'Data daftar ulang Anda sudah kami terima. Admin akan memverifikasi data Anda dalam 1-2 hari kerja.'
          : 'Data daftar ulang Anda berhasil dikirim. Admin akan memverifikasi data Anda dalam 1-2 hari kerja.'}
      </p>

      {/* Show class info and partner details for approved and submitted status */}
      {(isApproved || isSubmitted) && (
        <div className="max-w-2xl mx-auto mb-8 text-left">
          <div className={`${isApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-6`}>
            <h3 className={`font-semibold text-center ${isApproved ? 'text-emerald-900' : 'text-blue-900'}`}>Akad Daftar Ulang</h3>

            {/* Akad Files */}
            {existingSubmission?.akad_files && existingSubmission.akad_files.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-amber-100 mt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <h4 className="font-medium text-gray-900">Akad Daftar Ulang</h4>
                </div>
                <div className="ml-7 space-y-2">
                  {existingSubmission.akad_files.map((file: { url: string; name: string }, index: number) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{file.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Show approve button for admin when status is submitted */}
        {canApprove && (
          <div className="mb-4">
            <Button
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700 w-full"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Setujui Daftar Ulang
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Menyetujui akan mengubah status menjadi 'approved', memastikan user memiliki role 'thalibah', dan menambahkan thalibah ke halaqah.
            </p>
          </div>
        )}
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
