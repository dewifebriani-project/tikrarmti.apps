'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useActiveBatch } from '@/hooks/useBatches'
import { useMyRegistrations, useRegistrationMutations } from '@/hooks/useRegistrations'
import { useJuzOptions } from '@/hooks/useJuzOptions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Send, Info, CheckCircle, AlertCircle } from 'lucide-react'

interface FormData {
  // Section 1 - Komitmen & Pemahaman
  understands_commitment: boolean
  tried_simulation: boolean
  no_negotiation: boolean
  has_telegram: boolean
  saved_contact: boolean

  // Section 2 - Izin & Pilihan Program
  has_permission: 'yes' | 'janda' | ''
  permission_name: string
  permission_phone: string
  permission_phone_validation: string
  chosen_juz: string
  no_travel_plans: boolean
  motivation: string
  ready_for_team: string

  // Section 3 - Waktu Setoran
  main_time_slot: string
  backup_time_slot: string
  time_commitment: boolean

  // Section 4 - Pemahaman Program
  understands_program: boolean
  questions: string
}

const STORAGE_KEY = 'tikrar_registration_draft'

export default function ThalibahBatch2Page() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, isUnauthenticated } = useAuth()
  const { activeBatch, isLoading: batchLoading } = useActiveBatch()
  const { createRegistration, updateRegistration } = useRegistrationMutations()
  const { juzOptions, isLoading: juzLoading } = useJuzOptions()
  const { registrations, mutate: mutateRegistrations } = useMyRegistrations()
  const [isCreating, setIsCreating] = useState(false)

  const [isMounted, setIsMounted] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [currentSection, setCurrentSection] = useState(1)
  const [isEditMode, setIsEditMode] = useState(false)
  const [existingRegistrationId, setExistingRegistrationId] = useState<string | null>(null)

  // Check if user is already registered for Tikrah Tahfidz program
  const tikrarRegistration = useMemo(() => {
    return registrations.find(reg =>
      reg.batch_id === activeBatch?.id &&
      (reg.status === 'approved' || reg.status === 'pending')
    )
  }, [registrations, activeBatch])

  // Check if user can register (not registered or in edit mode)
  const canRegister = useMemo(() => {
    return !tikrarRegistration || isEditMode
  }, [tikrarRegistration, isEditMode])

  // Load existing registration data or draft from localStorage on mount
  useEffect(() => {
    if (tikrarRegistration && !isEditMode) {
      // User has existing registration, populate form for editing
      setExistingRegistrationId(tikrarRegistration.id)
      setIsEditMode(true)

      const registrationData = tikrarRegistration as any
      setFormData({
        understands_commitment: registrationData.understands_commitment || false,
        tried_simulation: registrationData.tried_simulation || false,
        no_negotiation: registrationData.no_negotiation || false,
        has_telegram: registrationData.has_telegram || false,
        saved_contact: registrationData.saved_contact || false,
        has_permission: registrationData.has_permission || '',
        permission_name: registrationData.permission_name || '',
        permission_phone: registrationData.permission_phone || '',
        permission_phone_validation: '',
        chosen_juz: registrationData.chosen_juz || '',
        no_travel_plans: registrationData.no_travel_plans || false,
        motivation: registrationData.motivation || '',
        ready_for_team: registrationData.ready_for_team || '',
        main_time_slot: registrationData.main_time_slot || '',
        backup_time_slot: registrationData.backup_time_slot || '',
        time_commitment: registrationData.time_commitment || false,
        understands_program: registrationData.understands_program || false,
        questions: registrationData.questions || ''
      })
    } else if (typeof window !== 'undefined' && !tikrarRegistration) {
      try {
        const savedDraft = localStorage.getItem(STORAGE_KEY)
        if (savedDraft) {
          const draft = JSON.parse(savedDraft)
          // Only restore if it's from the same user
          if (draft.user_id === user?.id) {
            // Convert old boolean format to new string format for has_permission
            const formData = draft.formData
            if (typeof formData.has_permission === 'boolean') {
              formData.has_permission = formData.has_permission ? 'yes' : ''
            }
            setFormData(formData)
            setCurrentSection(draft.currentSection || 1)
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error)
      }
    }
  }, [tikrarRegistration, user?.id, isEditMode])

  // Fetch user profile data from users table
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id && isAuthenticated) {
        try {
          const response = await fetch('/api/auth/me')
          if (response.ok) {
            const result = await response.json()
            // The result contains user data in result.data or result.user
            const userData = result.data || result.user || result
            setUserProfile(userData)
            console.log('User profile loaded:', userData)
          } else {
            console.error('Failed to fetch user profile:', response.status)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      }
    }
    fetchUserProfile()
  }, [user?.id, isAuthenticated])

  const [formData, setFormData] = useState<FormData>({
    understands_commitment: false,
    tried_simulation: false,
    no_negotiation: false,
    has_telegram: false,
    saved_contact: false,
    has_permission: '',
    permission_name: '',
    permission_phone: '',
    permission_phone_validation: '',
    chosen_juz: '',
    no_travel_plans: false,
    motivation: '',
    ready_for_team: '',
    main_time_slot: '',
    backup_time_slot: '',
    time_commitment: false,
    understands_program: false,
    questions: ''
  })

  // Auto-save to localStorage
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      try {
        const draft = {
          user_id: user?.id,
          formData,
          currentSection,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
      } catch (error) {
        console.error('Error saving draft:', error)
      }
    }
  }, [formData, currentSection, isMounted, user?.id])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'success_update' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string>('')
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null)

  const totalSections = 4
  const progressPercentage = (currentSection / totalSections) * 100

  // Handle component mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Auto-scroll to first error field when validation fails
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Small delay to ensure error messages are rendered
      const timer = setTimeout(() => {
        // Find first error message (text-red-500 class is used for errors)
        const errorMessages = document.querySelectorAll('.text-red-500')
        if (errorMessages.length > 0) {
          const firstError = errorMessages[0] as HTMLElement
          // Get the parent container that contains the field
          const fieldContainer = firstError.closest('.space-y-2, .space-y-3') as HTMLElement
          if (fieldContainer) {
            fieldContainer.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Try to focus the input/select inside the container
            const inputElement = fieldContainer.querySelector('input, select, textarea') as HTMLElement
            if (inputElement && typeof inputElement.focus === 'function') {
              inputElement.focus()
            }
          }
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [errors])

  // Cleanup redirect timer when component unmounts or status changes
  React.useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer)
      }
    }
  }, [redirectTimer])

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateSection = (section: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (section === 1) {
      if (!formData.understands_commitment) {
        newErrors.understands_commitment = 'Wajib menyetujui komitmen program'
      }
      if (!formData.tried_simulation) {
        newErrors.tried_simulation = 'Wajib mencoba simulasi terlebih dahulu'
      }
      if (!formData.no_negotiation) {
        newErrors.no_negotiation = 'Wajib menyetujui tidak menego jumlah tikrar'
      }
      if (!formData.has_telegram) {
        newErrors.has_telegram = 'Wajib memiliki aplikasi Telegram'
      }
      if (!formData.saved_contact) {
        newErrors.saved_contact = 'Wajib menyimpan nomor kontak admin'
      }
    }

    if (section === 2) {
      if (!formData.has_permission) {
        newErrors.has_permission = 'Wajib memiliki izin dari yang bertanggung jawab'
      }
      // For janda, permission fields are optional
      const isJanda = formData.has_permission === 'janda'
      if (!isJanda) {
        if (!formData.permission_name.trim()) {
          newErrors.permission_name = 'Nama pemberi izin harus diisi'
        }
        if (!formData.permission_phone.trim()) {
          newErrors.permission_phone = 'Nomor HP pemberi izin harus diisi'
        }
        if (formData.permission_phone !== formData.permission_phone_validation) {
          newErrors.permission_phone_validation = 'Validasi nomor HP tidak cocok'
        }
      }
      if (!formData.chosen_juz) {
        newErrors.chosen_juz = 'Pilih salah satu pilihan juz'
      }
      if (!formData.no_travel_plans) {
        newErrors.no_travel_plans = 'Wajib menyetujui tidak ada rencana safar'
      }
      if (!formData.motivation.trim()) {
        newErrors.motivation = 'Motivasi harus diisi'
      }
      if (!formData.ready_for_team) {
        newErrors.ready_for_team = 'Pilih salah satu opsi'
      }
    }

    if (section === 3) {
      if (!formData.main_time_slot) {
        newErrors.main_time_slot = 'Pilih waktu utama'
      }
      if (!formData.backup_time_slot) {
        newErrors.backup_time_slot = 'Pilih waktu cadangan'
      }
      if (!formData.time_commitment) {
        newErrors.time_commitment = 'Wajib menyetujui komitmen waktu'
      }
    }

    if (section === 4) {
      if (!formData.understands_program) {
        newErrors.understands_program = 'Wajib memahami program'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateSection(currentSection)) {
      if (currentSection < totalSections) {
        setCurrentSection(currentSection + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1)
    }
  }

  // Scroll to top of form when section changes
  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => {
        const formElement = document.querySelector('form') as HTMLElement
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentSection, isMounted])

  const handleSubmit = async () => {
    if (!validateSection(4)) return
    if (!user?.id || !activeBatch) {
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    try {
      // Helper function to convert date to ISO string with offset
      const toISOWithOffset = (dateInput: string | Date | undefined): string => {
        if (!dateInput) return new Date().toISOString()
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
        // Ensure we get a proper ISO string with offset
        return date.toISOString()
      }

      // Use userProfile data from users table, fallback to user metadata
      const birthDateValue = userProfile?.tanggal_lahir || (user as any)?.user_metadata?.tanggal_lahir
      const today = new Date()
      let calculatedAge = 15 // default minimum age
      if (birthDateValue) {
        const birthDate = new Date(birthDateValue)
        calculatedAge = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--
        }
      }

      // Get gender - convert from database format to schema format
      const genderValue = userProfile?.jenis_kelamin
      const genderMapped = genderValue === 'Perempuan' ? 'P' : genderValue === 'Laki-laki' ? 'L' : 'P'

      // Get phone number with proper format
      let phoneValue = userProfile?.whatsapp || ''
      // Ensure phone starts with Indonesian format
      if (phoneValue && !phoneValue.startsWith('+62') && !phoneValue.startsWith('62')) {
        phoneValue = phoneValue.startsWith('0') ? '62' + phoneValue.slice(1) : '62' + phoneValue
      }

      // Prepare data for Tikrar API - include all required fields from schema
      // Data from users table takes priority over auth metadata
      const submissionData = {
        user_id: user.id,
        batch_id: activeBatch.id,
        program_id: activeBatch.id,
        // Personal data (from users table) - required by schema
        full_name: userProfile?.full_name || user.full_name || '',
        email: user.email || '',
        phone: phoneValue,
        telegram_phone: userProfile?.telegram || '',
        address: userProfile?.alamat || '',
        birth_place: userProfile?.tempat_lahir || '',
        birth_date: toISOWithOffset(birthDateValue),
        age: calculatedAge,
        gender: genderMapped,
        education: userProfile?.pendidikan || '',
        work: userProfile?.pekerjaan || '',
        // Section 1
        understands_commitment: formData.understands_commitment,
        tried_simulation: formData.tried_simulation,
        no_negotiation: formData.no_negotiation,
        has_telegram: formData.has_telegram,
        saved_contact: formData.saved_contact,
        // Section 2
        has_permission: formData.has_permission,
        permission_name: formData.permission_name,
        permission_phone: formData.permission_phone,
        chosen_juz: formData.chosen_juz,
        no_travel_plans: formData.no_travel_plans,
        motivation: formData.motivation,
        ready_for_team: formData.ready_for_team,
        // Section 3
        main_time_slot: formData.main_time_slot,
        backup_time_slot: formData.backup_time_slot,
        time_commitment: formData.time_commitment,
        // Section 4
        understands_program: formData.understands_program,
        questions: formData.questions,
        provider: 'email'
      }

      // Debug: log submission data
      console.log('Submitting registration data:', {
        userProfile: userProfile,
        has_permission_type: typeof formData.has_permission,
        has_permission_value: formData.has_permission,
        submissionData: {
          ...submissionData,
          // Log specific fields that might be empty
          phone: submissionData.phone,
          address: submissionData.address,
          birth_date: submissionData.birth_date,
          age: submissionData.age,
          has_permission: submissionData.has_permission
        }
      })

      if (isEditMode && existingRegistrationId) {
        // Update existing registration
        const response = await fetch(`/api/pendaftaran/tikrar/${existingRegistrationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          // Handle ApiResponses format: {success: false, error: {message, details: {issues: [...]}}}
          let errorMsg = 'Failed to update registration'
          if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMsg = errorData.error
            } else if (errorData.error.message) {
              errorMsg = errorData.error.message
              // Add validation issues if available
              if (errorData.error.details?.issues) {
                const issues = errorData.error.details.issues
                const issueList = issues.map((i: any) => `${i.field}: ${i.message}`).join('\n')
                errorMsg += '\n\n' + issueList
              }
            } else {
              errorMsg = JSON.stringify(errorData.error)
            }
          }
          throw new Error(errorMsg)
        }

        const result = await response.json()
        console.log('Registration updated successfully:', result)
      } else {
        // Create new registration
        const response = await fetch('/api/pendaftaran/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          // Handle ApiResponses format: {success: false, error: {message, details: {issues: [...]}}}
          let errorMsg = 'Failed to submit registration'
          if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMsg = errorData.error
            } else if (errorData.error.message) {
              errorMsg = errorData.error.message
              // Add validation issues if available
              if (errorData.error.details?.issues) {
                const issues = errorData.error.details.issues
                const issueList = issues.map((i: any) => `${i.field}: ${i.message}`).join('\n')
                errorMsg += '\n\n' + issueList
              }
            } else {
              errorMsg = JSON.stringify(errorData.error)
            }
          }
          throw new Error(errorMsg)
        }

        const result = await response.json()
        console.log('Registration submitted successfully:', result)
      }

      // Clear draft after successful submission
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }

      // Refresh registrations cache
      mutateRegistrations()

      setSubmitStatus(isEditMode ? 'success_update' : 'success')

      // Redirect to dashboard after 3 seconds
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

      setRedirectTimer(timer)
    } catch (error: any) {
      console.error('Submit error:', error)
      // Extract error message for display
      let errorMessage = 'Terjadi kesalahan saat mengirim formulir'
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (typeof error === 'object' && error !== null) {
        // Try to stringify the error object
        try {
          errorMessage = JSON.stringify(error, null, 2)
        } catch {
          errorMessage = String(error)
        }
      }
      setSubmitError(errorMessage)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSection1 = () => (
    <div className="space-y-4 sm:space-y-6">
      <Alert className="bg-green-50 border-green-200">
        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
        <AlertDescription className="text-green-800 text-sm sm:text-base">
          <strong>Section 1 of 4</strong> - FORMULIR PENDAFTARAN TIKRAR MTI BATCH 2 (JUZ 1, 28, 29, 30)
        </AlertDescription>
      </Alert>

      <div className="bg-blue-50 p-3 sm:p-4 md:p-6 lg:p-8 rounded-lg">
        <h3 className="font-bold text-base sm:text-lg md:text-xl mb-4 sm:mb-6 text-green-900">Bismillah.. Hayyakillah Ahlan wasahlan kakak-kakak calon hafidzah..</h3>

        <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
          <p>📝 Formulir ini adalah formulir pendaftaran untuk kelas hafalan Al-Qur'an gratis khusus akhawat, menggunakan metode pengulangan (tikrar) sebanyak 40 kali.</p>
          <p>📆 Durasi program: InsyaAllah selama 13 Pekan dimulai dari tanggal 5 Januari untuk target hafalan 1/2 juz.</p>

          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 rounded-lg">
            <p className="font-semibold text-green-800 mb-2 sm:mb-3 text-sm sm:text-base">Struktur Program:</p>
            <div className="text-xs sm:text-sm text-green-700 space-y-1.5 sm:space-y-2">
              <p>📅 <strong>Pekan 1 (5-11 Januari):</strong> Tashih</p>
              <p>📖 <strong>Pekan 2-11 (12 Januari - 5 April):</strong> Ziyadah</p>
              <p>🕌 <strong>(Catatan: 15-29 Maret adalah Libur Lebaran)</strong></p>
              <p>📚 <strong>Pekan 12 (6-12 April):</strong> Muroja'ah</p>
              <p>✅ <strong>Pekan 13 (13-19 April):</strong> Ujian</p>
            </div>
          </div>

          <p>🎯 Target hafalan harian: 1 halaman perpekan (1/4 halaman per hari, 4 hari dalam sepekan)</p>

          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-800 mb-2 sm:mb-3 text-sm sm:text-base">Kewajiban Program:</p>
            <div className="text-xs sm:text-sm text-blue-700 space-y-1.5 sm:space-y-2">
              <p>✅ Tashih wajib sekali sepekan untuk kurikulum ziyadah pekan depan, jadwal menyesuaikan</p>
              <p>✅ Ujian wajib sekali sepekan untuk kurikulum selesai ziyadah pekanan, jadwal menyesuaikan</p>
              <p>✅ Setoran 40X boleh memilih mau bersama pasangan atau tidak (yang memilih tidak berpasangan hanya untuk yang bacaan sudah benar-benar mutqin)</p>
              <p>✅ Jadwal setoran pasangan boleh pilih opsi yang sudah ditentukan, akan kami carikan pasangan setoran semaksimal mungkin yang sama waktu dan zona waktu</p>
            </div>
          </div>

          <div className="mt-4 p-5 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="font-semibold text-yellow-800 mb-3 flex items-center text-base">
              <AlertCircle className="w-5 h-5 mr-2" />
              ⚠️ Peringatan Penting
            </p>
            <div className="text-yellow-700 text-sm space-y-3">
              <p>Bagi kakak-kakak yang sibuk, banyak kelas, ga bisa atur waktu dengan pasangan silahkan pilih program tanpa pasangan.</p>
              <p><strong>Jika Ukhti dinyatakan lolos seleksi administrasi dan tes bacaan, dan sudah daftar ulang, kami tidak meridhoi Ukhti keluar dari program tanpa udzur syar'i.</strong> Alasan seperti "sibuk", "ada kerjaan", atau "ikut kelas lain" tidak kami terima.</p>

              <p className="mt-2 font-semibold">✅ Alasan yang DITERIMA untuk mundur dari program:</p>
              <ul className="ml-4 space-y-1">
                <li>• Qadarullah, diri sendiri/orang tua/mertua/suami/anak sakit dan butuh perawatan intensif</li>
                <li>• Qadarullah, hamil muda dan mengalami ngidam atau mual berat yang menyulitkan untuk mengikuti program</li>
                <li>• Qadarullah, terjadi bencana alam yang menghambat kelanjutan program</li>
                <li>• Udzur lain yang darurat, mendesak, dan tidak terduga, yang dapat kami maklumi</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <p className="font-semibold text-purple-800 mb-3 text-base">👨‍👩‍👧 Izin Keluarga/Wali</p>
            <p className="text-sm text-purple-700">
              Untuk mengikuti program ini, wajib mendapatkan izin dari suami, orang tua, majikan, atau wali, karena waktu Ukhti akan lebih banyak digunakan untuk menghafal. Jika sewaktu-waktu mereka mencabut izinnya, merekalah yang harus menghubungi pihak MTI untuk menyampaikan permohonan pengunduran diri.
            </p>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-800 mb-3 text-base">⚙️ Tentang Program</p>
            <p className="text-sm text-gray-700">
              Seluruh aturan kami susun demi kebaikan dan kelancaran program ini, bukan untuk mempersulit siapapun. Kami ingin menciptakan lingkungan yang serius dan kondusif bagi para penghafal Qur'an.
            </p>
          </div>

          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <p className="font-semibold text-indigo-800 mb-3 text-base">⏳ Komitmen Waktu</p>
            <p className="text-sm text-indigo-700">
              Program ini membutuhkan komitmen waktu minimal 2 jam per hari membersamai Al Quran. Jika Ukhti memiliki jadwal yang padat, banyak tanggungan, atau merasa tidak bisa konsisten, kami sarankan untuk tidak mendaftar dulu. Tujuan kami adalah agar program ini berjalan dengan zero dropout dan zero blacklist.
            </p>
          </div>

          <div className="mt-4 p-4 bg-teal-50 rounded-lg">
            <p className="font-semibold text-teal-800 mb-3 text-base">💡 Tentang Metode</p>
            <p className="text-sm text-teal-700">
              Metode Tikrar MTI kami rancang berdasarkan pengalaman para ibu yang mengajar dan belajar Al-Qur'an di tengah rutinitas rumah tangga. Metode ini cocok untuk emak-emak yang menghafal di rumah sambil mencuci, masak, mengurus anak dan suami.
            </p>
          </div>

          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="font-semibold text-red-800 mb-3 text-base">🚫 Tidak cocok untuk:</p>
            <div className="text-sm text-red-700 space-y-2">
              <p>• Tholibah yang bekerja full-time dan hanya memiliki waktu malam untuk keluarga</p>
              <p>• Mu\'allimah yang sudah mutqin tapi tidak bisa menyelesaikan program karena kesibukan mengajar, belajar atau kesibukan pribadi</p>
            </div>
            <p className="text-sm text-red-600 mt-3">
              Namun, jika ingin mengadopsi metode ini untuk diterapkan di halaqah masing-masing, silakan. Metode ini bebas dipakai, dimodifikasi, dan disebarluaskan.
            </p>
          </div>

          <div className="mt-4 p-4 bg-orange-50 rounded-lg">
            <p className="font-semibold text-orange-800 mb-3 text-base">🧪 Simulasi Sebelum Daftar</p>
            <div className="text-sm text-orange-700 space-y-3">
              <p>Karena metode pengulangan 40 kali bisa terasa berat, lama, dan membosankan, kami mensyaratkan calon peserta untuk mencoba simulasi:</p>
              <p>📖 Bacalah Surah An-Naba' ayat 1–11 sebanyak 40 kali.</p>
              <p><strong>Jika merasa sanggup, silakan lanjut mengisi formulir. Jika tidak, sebaiknya undur diri dari sekarang.</strong></p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-rose-50 rounded-lg border border-rose-200">
            <p className="font-semibold text-rose-800 mb-3 text-base">🚩 Peringatan Serius</p>
            <div className="text-sm text-rose-700 space-y-3">
              <p>Kami tidak ridho jika Ukhti submit formulir pendaftaran ini hanya untuk iseng atau kepo saja, karena hanya merepotkan proses seleksi. Jika hanya ingin kepo saja silahkan langsung japri, kami dengan senang hati share metode Tikrar kepada Ukhti.</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
            <p className="font-semibold text-emerald-800 mb-3 text-base">🎯 Tujuan Program</p>
            <div className="text-sm text-emerald-700 space-y-3">
              <p>Kami tidak mengejar kuantitas peserta, tetapi lebih fokus pada tholibah yang ikhlas, istiqamah, dan bersungguh-sungguh untuk menghafal dan menebar manfaat. Bagi yang masih banyak agenda dan belum bisa konsisten, lebih baik menunggu angkatan berikutnya.</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-800 mb-3 text-base">⚠️ Program Blacklist</p>
            <div className="text-sm text-slate-700 space-y-3">
              <p>Program ini menerapkan sistem Blacklist permanen bagi peserta yang mundur di tengah jalan tanpa alasan yang dapat kami terima, demi menjaga hak pasangan setoran dan stabilitas Nasional Markaz Tikrar Indonesia.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-5 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
        <p className="text-center text-base text-green-800 font-medium mb-3">
          🤝 Komitmen & Etika
        </p>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• Program ini melibatkan banyak pihak dan pasangan setoran. Kami berusaha menyesuaikan jadwal dengan pilihan Ukhti sendiri.</p>
          <p>• Harap menjaga komitmen, tidak banyak mengeluh, dan tidak mementingkan diri sendiri</p>
          <p>• Jaga adab kepada seluruh tim Tikrar MTI dan pasangan setoran masing-masing</p>
          <p>• Keputusan kelulusan tes administrasi dan bacaan bersifat final dan tidak dapat diganggu gugat</p>
          <p>• Program ini baru dimulai dan gratis, kami akui masih banyak kekurangan/ketidaksempurnaan di sana-sini, kami berusaha melakukan semaksimal mungkin energi kami untuk program ini.</p>
          <p>• kami tidak melayani tuntutan professionalisme berlebih atau kesempurnaan seakan kami menjual jasa dengan harga tinggi.</p>
          <p>• MTI adalah rumah bagi kita, yang anggotanya adalah keluarga bagaikan ibu dengan anak, kakak dengan adik, yang saling melengkapi kelemahan dan kekurangan masing-masing untuk kebaikan denqan target berkumpul di Jannah Firdaus Al-'Ala. (No Baper, No Drama).</p>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-2 sm:space-y-3">
          <Label className="text-sm sm:text-base font-semibold text-gray-800">
            Apakah Ukhti  sudah faham dengan semua poin di atas dan bersedia menerima segala komitmen?
            <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start space-x-2 sm:space-x-4 p-3 sm:p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <input
                type="radio"
                name="understands_commitment"
                id="understands_commitment_yes"
                value="yes"
                checked={formData.understands_commitment}
                onChange={() => handleInputChange('understands_commitment', true)}
                className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="understands_commitment_yes" className="text-sm sm:text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah ana sudah dengar dan sudah paham dan insyaAllah ikhlas menerima segala komitmen dan berusaha menjalankannya semaksimal mungkin.
              </Label>
            </div>
          </div>
          {errors.understands_commitment && (
            <p className="text-red-500 text-xs sm:text-sm font-medium">{errors.understands_commitment}</p>
          )}
        </div>

        <div className="space-y-2 sm:space-y-3">
          <Label className="text-sm sm:text-base font-semibold text-gray-800">
            Apakah Ukhti sudah mencoba simulasi mengulang membaca Surat An-Naba' ayat 1-11 sebanyak 40X
            (Jika belum silahkan coba dulu, sebelum melanjutkan)
            <span className="text-red-500">*</span>
          </Label>
          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border-2 border-yellow-300">
            <p className="text-xs sm:text-sm text-yellow-800 font-semibold mb-1.5 sm:mb-2">⚠️ Peringatan Penting:</p>
            <p className="text-xs sm:text-sm text-yellow-700">
              Kami tidak melayani calon tolibah yang nego-nego jumlah tikrar, walaupun Ukhti hanya ingin murojaah/sudah pernah hafal. Jika tetap ingin menjadi keluarga MTI silahkan japri kak Mara untuk mendaftar jadi mu'allimah, akan ada kelas Tikrar mu'allimah yang bebas tanpa akad.
            </p>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start space-x-2 sm:space-x-4 p-3 sm:p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <input
                type="radio"
                name="tried_simulation"
                id="tried_simulation_yes"
                value="yes"
                checked={formData.tried_simulation}
                onChange={() => handleInputChange('tried_simulation', true)}
                className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="tried_simulation_yes" className="text-sm sm:text-base font-medium text-gray-700 cursor-pointer flex-1">
                Alhamdulillah saya sudah mencoba simulasi mengulang membaca Surat An-Naba' ayat 1-11 sebanyak 40X
              </Label>
            </div>
          </div>
          {errors.tried_simulation && (
            <p className="text-red-500 text-xs sm:text-sm font-medium">{errors.tried_simulation}</p>
          )}
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border-2 border-yellow-300">
            <p className="text-xs sm:text-sm text-yellow-800 font-semibold mb-1.5 sm:mb-2">⚠️ Peringatan Penting:</p>
            <p className="text-xs sm:text-sm text-yellow-700">
              Kami tidak melayani calon tolibah yang nego-nego jumlah tikrar, walaupun Ukhti hanya ingin muroja'ah/sudah pernah hafal. Jika tetap ingin menjadi keluarga MTI silahkan japri kak Mara untuk mendaftar jadi mu'allimah, akan ada kelas Tikrar mu'allimah yang bebas tanpa akad.
            </p>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start space-x-2 sm:space-x-4 p-3 sm:p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <input
                type="radio"
                name="no_negotiation"
                id="no_negotiation_yes"
                value="yes"
                checked={formData.no_negotiation}
                onChange={() => handleInputChange('no_negotiation', true)}
                className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="no_negotiation_yes" className="text-sm sm:text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah sudah dan saya berjanji ga akan nego-nego jumlah tikrar
              </Label>
            </div>
          </div>
          {errors.no_negotiation && (
            <p className="text-red-500 text-xs sm:text-sm font-medium">{errors.no_negotiation}</p>
          )}
        </div>

        <div className="space-y-2 sm:space-y-3">
          <Label className="text-sm sm:text-base font-semibold text-gray-800">
            Apakah Ukhti sudah faham jika program ini juga mewajibkan tholibah untuk mempunyai aplikasi telegram untuk proses seleksi?
          </Label>
          <p className="text-xs sm:text-sm text-gray-500 italic">
            Mohon maaf kami tidak akan mengecek VN seleksi yang dikirim lewat whatsapp karena keterbatasan memori hp admin.
          </p>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start space-x-2 sm:space-x-4 p-3 sm:p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <input
                type="radio"
                name="has_telegram"
                id="has_telegram_yes"
                value="yes"
                checked={formData.has_telegram}
                onChange={() => handleInputChange('has_telegram', true)}
                className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="has_telegram_yes" className="text-sm sm:text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah saya sudah download telegram di hp saya
              </Label>
            </div>
          </div>
          {errors.has_telegram && (
            <p className="text-red-500 text-xs sm:text-sm font-medium">{errors.has_telegram}</p>
          )}
        </div>

        <div className="space-y-2 sm:space-y-3">
          <Label className="text-sm sm:text-base font-semibold text-gray-800">
            Apakah Ukhti sudah simpan nomor Whatsapp Kak Mara 08567712914? Yang akan di-add ke grup hanya yang bisa langsung kak Mara add saja.. kami tidak akan mengirimkan invitation link bagi yang tidak bisa di-add karena tidak mau save nomor admin.
            <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start space-x-2 sm:space-x-4 p-3 sm:p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <input
                type="radio"
                name="saved_contact"
                id="saved_contact_yes"
                value="yes"
                checked={formData.saved_contact}
                onChange={() => handleInputChange('saved_contact', true)}
                className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="saved_contact_yes" className="text-sm sm:text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah saya sudah simpan nomor hp Kak Mara
              </Label>
            </div>
          </div>
          {errors.saved_contact && (
            <p className="text-red-500 text-xs sm:text-sm font-medium">{errors.saved_contact}</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderSection2 = () => (
    <div className="space-y-4 sm:space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm sm:text-base">
          <strong>Section 2 of 4</strong> - Izin & Pilihan Program
        </AlertDescription>
      </Alert>

      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">
            Apakah Ukhti sudah meminta izin kepada suami/ orang tua/majikan/wali yang bertanggung jawab atas diri Ukhti?
            <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-500 italic">
            (Jika belum silahkan minta izin, jika tidak diizinkan mohon bersabar, berdoa kepada Allah semoga Allah mudahkan pada angkatan selanjutnya)
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-4 p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <input
                type="radio"
                name="has_permission"
                id="has_permission_yes"
                value="yes"
                checked={formData.has_permission === 'yes'}
                onChange={() => handleInputChange('has_permission', 'yes' as const)}
                className="mt-1 w-5 h-5 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="has_permission_yes" className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah sudah (ini jawaban saya sejujur-jujurnya yang akan saya pertanggungjawabkan di akhirat nanti)
              </Label>
            </div>
            <div className="flex items-start space-x-4 p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <input
                type="radio"
                name="has_permission"
                id="has_permission_janda"
                value="janda"
                checked={formData.has_permission === 'janda'}
                onChange={() => handleInputChange('has_permission', 'janda' as const)}
                className="mt-1 w-5 h-5 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="has_permission_janda" className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Saya seorang janda yang mandiri, tidak terikat, tidak perlu persetujuan siapapun dan mengikuti program ini tidak akan mempengaruhi siapapun
              </Label>
            </div>
          </div>
          {errors.has_permission && (
            <p className="text-red-500 text-sm font-medium">{errors.has_permission}</p>
          )}
        </div>

        {/* Permission fields - only show if not janda */}
        {formData.has_permission !== 'janda' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permission_name" className="text-base font-semibold text-gray-800">
                  Nama suami/ orang tua/majikan/wali yang bertanggung jawab atas diri Ukhti dan yang sudah memberikan izin Ukhti untuk ikut program ini
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="permission_name"
                  value={formData.permission_name}
                  onChange={(e) => handleInputChange('permission_name', e.target.value)}
                  placeholder="Ketik nama sesuai KTP"
                  className="text-base py-3"
                />
                {errors.permission_name && (
                  <p className="text-red-500 text-sm font-medium">{errors.permission_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="permission_phone" className="text-base font-semibold text-gray-800">
                  No HP suami/ orang tua/majikan/wali yang bertanggung jawab atas diri Ukhti dan yang sudah memberikan izin Ukhti untuk ikut program ini
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="permission_phone"
                  value={formData.permission_phone}
                  onChange={(e) => handleInputChange('permission_phone', e.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                  className="text-base py-3"
                />
                {errors.permission_phone && (
                  <p className="text-red-500 text-sm font-medium">{errors.permission_phone}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="permission_phone_validation" className="text-base font-semibold text-gray-800">
                Validasi isi sekali lagi No HP suami/ orang tua/majikan/wali yang bertanggung jawab atas diri Ukhti dan yang sudah memberikan izin Ukhti untuk ikut program ini
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="permission_phone_validation"
                value={formData.permission_phone_validation}
                onChange={(e) => handleInputChange('permission_phone_validation', e.target.value)}
                placeholder="Ketik ulang nomor HP"
                className="text-base py-3"
              />
              {errors.permission_phone_validation && (
                <p className="text-red-500 text-sm font-medium">{errors.permission_phone_validation}</p>
              )}
            </div>
          </>
        )}

        {/* Info message for janda */}
        {formData.has_permission === 'janda' && (
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
            <p className="text-sm text-green-800">
              ✓ Sebagai janda yang mandiri, Ukhti tidak perlu mengisi data suami/wali. Data diri Ukhti akan digunakan sebagai kontak penanggung jawab.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">Pilihan juz yang akan dihafalkan<span className="text-red-500">*</span></Label>
          <Select value={formData.chosen_juz} onValueChange={(value) => handleInputChange('chosen_juz', value)} disabled={juzLoading}>
            <SelectTrigger className="text-base py-3">
              <SelectValue placeholder={juzLoading ? "Memuat pilihan juz..." : "Pilih juz"} />
            </SelectTrigger>
            <SelectContent>
              {juzOptions.map((juz) => (
                <SelectItem key={juz.id} value={juz.code}>
                  {juz.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.chosen_juz && (
            <p className="text-red-500 text-sm font-medium">{errors.chosen_juz}</p>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
          <p className="text-sm text-blue-800 font-semibold mb-2">Informasi Program:</p>
          <p className="text-sm text-blue-700">
            Program ini akan insyaAllah biidznillah akan dilaksanakan selama 13 pekan dimulai dari tanggal 5 Januari - 18 April 2025. Libur lebaran 2 pekan 16-28 Februari. Apabila Ukhti sudah merencanakan atau safar, mudik, umrah atau liburan di luar jadwal liburan MTI, kami sarankan menunda pendaftaran pada angkatan berikutnya. Kami tidak menerima alasan mudik/safar yang mendzholimi jadwal pasangan setoran Ukhti.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Apakah Ukhti sudah merencanakan atau safar, mudik, umrah atau liburan di luar jadwal liburan MTI?
            <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="radio"
                name="no_travel_plans"
                id="no_travel_plans_yes"
                value="yes"
                checked={formData.no_travel_plans}
                onChange={() => handleInputChange('no_travel_plans', true)}
                className="mt-1 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="no_travel_plans_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                InsyaAllah saya tidak ada rencana safar, kalaupun tiba-tiba safar saya akan bertanggungjawab memprioritaskan waktu untuk memenuhi kewajiban setoran kepada pasangan
              </Label>
            </div>
          </div>
          {errors.no_travel_plans && (
            <p className="text-red-500 text-xs">{errors.no_travel_plans}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivation" className="text-sm font-medium text-gray-700">
            Ketikkan secara singkat apa motivasi terbesar Ukhti untuk menghafal Al-Quran sehingga Ukhti rela mengikuti program ini dan ikhlas menjalankan semua aturan-peraturan dari MTI?
          </Label>
          <Textarea
            id="motivation"
            value={formData.motivation}
            onChange={(e) => handleInputChange('motivation', e.target.value)}
            rows={3}
            placeholder="Jelaskan motivasi Ukhti..."
            className="text-sm"
          />
          {errors.motivation && (
            <p className="text-red-500 text-xs">{errors.motivation}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Apakah Ukhti siap dan bersedia menjadi bagian tim MTI apabila kami anggap sudah layak menjadi khadimat Al-Quran sebagai mu'allimah atau musyrifah untuk turut membantu MTI dalam misi memberantas buta huruf Al-Quran di Indonesia?
            <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="radio"
                name="ready_for_team"
                id="ready"
                value="ready"
                checked={formData.ready_for_team === 'ready'}
                onChange={() => handleInputChange('ready_for_team', 'ready')}
                className="mt-1 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="ready" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                InsyaAllah siapppp (jawaban ini kami catat sebagai akad)
              </Label>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="radio"
                name="ready_for_team"
                id="infaq"
                value="infaq"
                checked={formData.ready_for_team === 'infaq'}
                onChange={() => handleInputChange('ready_for_team', 'infaq')}
                className="mt-1 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="infaq" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Afwan saya tidak bisa menjadi tim MTI dikarenakan kesibukan dan komitmen di lembaga lain, sebagai gantinya saya akan infaq sesuai dengan kemampuan saya (bersedia masuk group Donatur MTI)
              </Label>
            </div>
          </div>
          {errors.ready_for_team && (
            <p className="text-red-500 text-xs">{errors.ready_for_team}</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderSection3 = () => (
    <div className="space-y-6">
      <Alert className="bg-purple-50 border-purple-200">
        <Info className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Section 3 of 4</strong> - Waktu Setoran
        </AlertDescription>
      </Alert>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 mb-4">
          <strong>Informasi Penting:</strong> Data diri Ukhti (nama, email, alamat, dll) sudah diambil dari data registrasi. Silakan lengkapi jadwal setoran di bawah ini.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Pilih waktu utama untuk jadwal setoran dengan pasangan</Label>
          <Select value={formData.main_time_slot} onValueChange={(value) => handleInputChange('main_time_slot', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih waktu utama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="04-06">04.00 - 06.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="06-09">06.00 - 09.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="09-12">09.00 - 12.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="12-15">12.00 - 15.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="15-18">15.00 - 18.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="18-21">18.00 - 21.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="21-24">21.00 - 24.00 WIB/WITA/WIT</SelectItem>
            </SelectContent>
          </Select>
          {errors.main_time_slot && (
            <p className="text-red-500 text-xs">{errors.main_time_slot}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Pilih waktu cadangan untuk jadwal setoran dengan pasangan</Label>
          <Select value={formData.backup_time_slot} onValueChange={(value) => handleInputChange('backup_time_slot', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih waktu cadangan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="04-06">04.00 - 06.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="06-09">06.00 - 09.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="09-12">09.00 - 12.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="12-15">12.00 - 15.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="15-18">15.00 - 18.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="18-21">18.00 - 21.00 WIB/WITA/WIT</SelectItem>
              <SelectItem value="21-24">21.00 - 24.00 WIB/WITA/WIT</SelectItem>
            </SelectContent>
          </Select>
          {errors.backup_time_slot && (
            <p className="text-red-500 text-xs">{errors.backup_time_slot}</p>
          )}
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="time_commitment"
            checked={formData.time_commitment}
            onCheckedChange={(checked) => handleInputChange('time_commitment', checked as boolean)}
          />
          <div className="space-y-1">
            <Label htmlFor="time_commitment" className="text-sm font-medium text-gray-700">
              Akad waktu
            </Label>
            <p className="text-xs text-gray-500 italic">
              Saya sudah memilih jadwal waktu utama dan cadangan dengan mempertimbangkan jadwal harian dan kegiatan saya.
              Saya terima ini sebagai akad yang akan saya pertanggungjawabkan di hadapan Allah apabila saya mendzolimi waktu pasangan setoran saya dengan alasan-alasan yang tidak urgen.
            </p>
            {errors.time_commitment && (
              <p className="text-red-500 text-xs">{errors.time_commitment}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderSection4 = () => (
    <div className="space-y-6">
      <Alert className="bg-orange-50 border-orange-200">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Section 4 of 4</strong> - Program Tikrar MTI
        </AlertDescription>
      </Alert>

      <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
        <h3 className="font-bold text-lg mb-4 text-green-900">📚 Program Hafalan Al-Qur'an MTI (Metode Tikrar 40 Kali)</h3>

        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <p><strong>🗓 Durasi Program:</strong> Program ini insyaAllah biidznillah akan berlangsung selama 13 pekan, dimulai dari 5 Januari hingga 18 April.</p>
          </div>

          <div>
            <p><strong>🎯 Target dan Struktur Program:</strong></p>
            <ul className="ml-4 mt-2 space-y-1">
              <li>• Target hafalan: 1 halaman per pekan, dibagi menjadi 4 blok (¼ halaman per hari)</li>
              <li>• Setoran ziyadah (penambahan hafalan): hanya dilakukan 4 hari per pekan</li>
            </ul>
          </div>

          <div>
            <p><strong>📌 Kewajiban Mingguan:</strong></p>
            <ul className="ml-4 mt-2 space-y-1">
              <li>• Mendengarkan atau membaca tafsir 1 halaman hafalan</li>
              <li>• Menulis tangan 1 halaman yang dihafalkan pekan tersebut</li>
              <li>• Mengikuti 2 kelas pertemuan bersama mu'allimah:</li>
              <li>  - Kelas Tashih</li>
              <li>  - Kelas Ujian (Jadwal menyusul)</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-100 rounded-lg">
            <p className="font-semibold text-yellow-800 mb-2">📌 Kewajiban Harian Saat Ziyadah (Penambahan Hafalan)</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Mendengarkan murottal ¼ halaman minimal 3 kali</li>
              <li>• Membaca ¼ halaman sebanyak 40 kali</li>
              <li>• Merekam hafalan ¼ halaman sebanyak 3 kali berturut-turut, lalu dengarkan sambil melihat mushaf</li>
              <li>➤ Jika masih ada kesalahan, ulangi proses ini sampai bacaan benar-benar sempurna</li>
            </ul>
          </div>

          <div>
            <p><strong>👥 Setoran kepada Pasangan:</strong></p>
            <ul className="ml-4 mt-2 space-y-1">
              <li>• Menyetorkan hafalan ¼ halaman sebanyak 40 kali</li>
              <li>• Menyimak hafalan pasangan sebanyak 40 kali</li>
            </ul>
          </div>

          <div>
            <p><strong>🔄 Rabth (Penguatan Hafalan):</strong></p>
            <p className="ml-4">Jika sudah menambah hafalan, wajib menyetorkan 10 blok hafalan sebelumnya (10 hari terakhir) sebelum memulai setoran 40 kali untuk hafalan baru (ziyadah).</p>
          </div>

          <div>
            <p><strong>🔁 Ulangan Ziyadah Sebelumnya:</strong></p>
            <p className="ml-4">Menyetorkan hafalan ziyadah dari hari sebelumnya sebanyak 5 kali.</p>
          </div>

          <div>
            <p><strong>☎️ Ketentuan Teknis Setoran:</strong></p>
            <p className="ml-4">Jika tidak memungkinkan menyetor secara langsung (misalnya via telepon karena waktu terbatas), maka diperbolehkan dengan format:</p>
            <ul className="ml-8 mt-1 space-y-1">
              <li>• 20 kali setoran via WA Call, dan</li>
              <li>• 20 kali setoran via Voice Note (VN)</li>
              <li>➤ Total: 40 kali</li>
            </ul>
          </div>

          <div className="p-4 bg-green-100 rounded-lg">
            <p className="font-semibold text-green-800 mb-2">📖 Tentang Metode MTI (Tikrar 40 Kali)</p>
            <p className="text-sm text-green-700">
              Program ini menggunakan metode Tikrar 40 kali. Karena ini inti dari program, maka:
            </p>
            <ul className="text-sm text-green-700 mt-2 ml-4 space-y-1">
              <li>• Tidak diperbolehkan dikurangi atau ditawar-tawar</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-100 rounded-lg">
            <p className="font-semibold text-blue-800 mb-2">🧰 Perlengkapan Wajib:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Al-Qur'an Tikrar</strong> ➤ Jika belum memiliki, bisa dibeli di toko buku atau toko online (tautan tersedia di deskripsi grup pendaftaran)</li>
              <li>• <strong>Counter Manual (alat penghitung)</strong> ➤ Bisa dibeli di toko alat tulis atau toko online (tautan juga tersedia di deskripsi grup)</li>
              <li>• Bagi yang mengalami kendala finansial, silakan hubungi Kak Mara di WA: 0813-1365-0842</li>
            </ul>
          </div>

          <div className="p-4 bg-purple-100 rounded-lg">
            <p className="font-semibold text-purple-800 mb-2">📝 Laporan:</p>
            <p className="text-sm text-purple-700">
              Wajib melaporkan semua poin yang telah dikerjakan sesuai arahan musyrifah MTI.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="understands_program"
            checked={formData.understands_program}
            onCheckedChange={(checked) => handleInputChange('understands_program', checked as boolean)}
          />
          <div className="space-y-1">
            <Label htmlFor="understands_program" className="text-sm font-medium text-gray-700">
              Apakah Ukhti faham dengan poin-poin di atas?
            </Label>
            {errors.understands_program && (
              <p className="text-red-500 text-xs">{errors.understands_program}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="questions" className="text-sm font-medium text-gray-700">
            Silahkan ketik pertanyaan Ukhti apabila ada yang masih kurang faham
          </Label>
          <Textarea
            id="questions"
            value={formData.questions}
            onChange={(e) => handleInputChange('questions', e.target.value)}
            rows={4}
            placeholder="Ketik pertanyaan Ukhti di sini (kosongkan jika tidak ada)"
            className="text-sm"
          />
        </div>

        {submitStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Alhamdulillah!</strong> Formulir pendaftaran Ukhti telah berhasil dikirim. Tim kami akan menghubungi Ukhti melalui Telegram untuk proses seleksi selanjutnya.
              <br /><br />
              <strong>Jangan lupa:</strong> Persiapkan diri untuk tes bacaan Al-Qur'an dan simak informasi selanjutnya di Telegram.
              <br /><br />
              <div className="flex items-center space-x-2 mb-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm">Ukhti akan dialihkan ke dashboard otomatis...</span>
              </div>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Pergi ke Dashboard Sekarang
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === 'success_update' && (
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Alhamdulillah!</strong> Data pendaftaran Ukhti telah berhasil diperbarui.
              <br /><br />
              Perubahan data telah tersimpan. Tim kami akan menggunakan data terbaru untuk proses seleksi.
              <br /><br />
              <div className="flex items-center space-x-2 mb-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Ukhti akan dialihkan ke dashboard otomatis...</span>
              </div>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Pergi ke Dashboard Sekarang
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p className="font-semibold">Terjadi kesalahan saat mengirim formulir</p>
                <p>Silakan coba lagi atau hubungi admin melalui WhatsApp 08567712914.</p>
                {submitError && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm underline">Lihat Detail Error</summary>
                    <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                      {submitError}
                    </pre>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )


  // Don't render until component is mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-4 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-900 mb-2 sm:mb-3">
              Formulir Pendaftaran MTI Batch 2
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600">
              Program Hafalan Al-Qur'an Gratis Khusus Akhawat<br/>
              <span className="text-xs sm:text-sm md:text-base text-green-700 font-medium">Metode Tikrar 40 Kali - Juz 1, 28, 29, 30</span>
            </p>
          </div>

          <Card className="shadow-lg border-green-100">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 px-3 sm:px-6 py-3 sm:py-4">
              {isEditMode && (
                <Alert className="bg-blue-50 border-blue-200 mb-4">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    <strong>Edit Mode:</strong> Ukhti sedang mengedit data pendaftaran yang sudah ada. Perubahan akan disimpan setelah menekan tombol "Update Pendaftaran".
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                <CardTitle className="text-base sm:text-lg md:text-xl text-green-900">
                  Section {currentSection} of {totalSections}
                </CardTitle>
                <span className="text-sm sm:text-base text-gray-600">
                  {Math.round(progressPercentage)}% Complete
                </span>
              </div>
              <Progress value={progressPercentage} className="w-full h-2 sm:h-3 mt-2" />
            </CardHeader>

            <CardContent className="px-3 sm:px-6 pt-4 sm:pt-6">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4 sm:space-y-6">
                {currentSection === 1 && renderSection1()}
                {currentSection === 2 && renderSection2()}
                {currentSection === 3 && renderSection3()}
                {currentSection === 4 && renderSection4()}

                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentSection === 1 || isSubmitting}
                    className="flex items-center justify-center space-x-2 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm sm:text-base py-2 sm:py-2.5 px-3 sm:px-4 w-full sm:w-auto"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Previous</span>
                  </Button>

                  {currentSection < totalSections ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 text-sm sm:text-base py-2 sm:py-2.5 px-3 sm:px-4 w-full sm:w-auto"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || submitStatus === 'success' || submitStatus === 'success_update'}
                      className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 text-sm sm:text-base py-2 sm:py-2.5 px-3 sm:px-4 w-full sm:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                          <span>{isEditMode ? 'Updating...' : 'Submitting...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{isEditMode ? 'Update Pendaftaran' : 'Submit Application'}</span>
                          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

        {/* Important Notes */}
          <div className="mt-6 sm:mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 sm:p-6 md:p-8">
            <h3 className="font-bold text-base sm:text-lg md:text-xl mb-3 sm:mb-4 text-yellow-900 flex items-center">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              Catatan Penting
            </h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-yellow-800">
              <p>• Pastikan Ukhti sudah mencoba simulasi membaca Surat An-Naba' ayat 1-11 sebanyak 40 kali sebelum melanjutkan pendaftaran.</p>
              <p>• Simpan nomor WhatsApp Kak Mara (08567712914) agar dapat di-add ke grup setelah lolos seleksi.</p>
              <p>• Siapkan aplikasi Telegram untuk proses seleksi dan komunikasi selanjutnya.</p>
              <p>• Program ini membutuhkan komitmen waktu minimal 2 jam per hari.</p>
              <p>• Pastikan Ukhti memiliki izin dari suami/orang tua/wali yang bertanggung jawab atas diri Ukhti.</p>
            </div>
          </div>
        </div>
      </div>
  )
}
