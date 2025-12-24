'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useActiveBatch } from '@/hooks/useBatches'
import { useJuzOptions } from '@/hooks/useJuzOptions'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Send, Info, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface FormData {
  // Section 0 - Data Diri (Read-only from users table)
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

const timeSlotOptions = [
  { value: 'senin_pagi', label: 'Senin Pagi (07:00 - 09:00 WIB)' },
  { value: 'senin_siang', label: 'Senin Siang (13:00 - 15:00 WIB)' },
  { value: 'senin_sore', label: 'Senin Sore (16:00 - 18:00 WIB)' },
  { value: 'selasa_pagi', label: 'Selasa Pagi (07:00 - 09:00 WIB)' },
  { value: 'selasa_siang', label: 'Selasa Siang (13:00 - 15:00 WIB)' },
  { value: 'selasa_sore', label: 'Selasa Sore (16:00 - 18:00 WIB)' },
  { value: 'rabu_pagi', label: 'Rabu Pagi (07:00 - 09:00 WIB)' },
  { value: 'rabu_siang', label: 'Rabu Siang (13:00 - 15:00 WIB)' },
  { value: 'rabu_sore', label: 'Rabu Sore (16:00 - 18:00 WIB)' },
  { value: 'kamis_pagi', label: 'Kamis Pagi (07:00 - 09:00 WIB)' },
  { value: 'kamis_siang', label: 'Kamis Siang (13:00 - 15:00 WIB)' },
  { value: 'kamis_sore', label: 'Kamis Sore (16:00 - 18:00 WIB)' },
  { value: 'jumat_pagi', label: 'Jumat Pagi (07:00 - 09:00 WIB)' },
  { value: 'jumat_siang', label: 'Jumat Siang (13:00 - 15:00 WIB)' },
  { value: 'jumat_sore', label: 'Jumat Sore (16:00 - 18:00 WIB)' },
  { value: 'sabtu_pagi', label: 'Sabtu Pagi (07:00 - 09:00 WIB)' },
  { value: 'sabtu_siang', label: 'Sabtu Siang (13:00 - 15:00 WIB)' },
  { value: 'sabtu_sore', label: 'Sabtu Sore (16:00 - 18:00 WIB)' },
  { value: 'ahad_pagi', label: 'Ahad Pagi (07:00 - 09:00 WIB)' },
  { value: 'ahad_siang', label: 'Ahad Siang (13:00 - 15:00 WIB)' },
  { value: 'ahad_sore', label: 'Ahad Sore (16:00 - 18:00 WIB)' },
]

function TikrarRegistrationContent() {
  const router = useRouter()
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth()
  const { activeBatch, isLoading: batchLoading } = useActiveBatch()
  const { juzOptions, isLoading: juzLoading } = useJuzOptions()

  const [currentSection, setCurrentSection] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [existingRegistrationId, setExistingRegistrationId] = useState<string | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isFormSubmitted, setIsFormSubmitted] = useState(false)

  // Check if user profile is complete
  const isProfileComplete = userData?.full_name && userData?.tanggal_lahir && userData?.tempat_lahir &&
    userData?.pekerjaan && userData?.alasan_daftar && userData?.jenis_kelamin && userData?.negara

  const [formData, setFormData] = useState<FormData>({
    understands_commitment: false,
    tried_simulation: false,
    no_negotiation: false,
    has_telegram: false,
    saved_contact: false,
    has_permission: '',
    permission_name: '',
    permission_phone: '',
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

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch user data function (extracted for reuse)
  const fetchUserData = useCallback(async () => {
    if (authUser?.id && isAuthenticated) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (data && !error) {
        setUserData(data)
      } else {
        console.error('Error fetching user data:', error)
      }
    }
  }, [authUser?.id, isAuthenticated])

  // Fetch user data on mount and when auth changes
  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  // Refetch user data when page regains visibility (user returns from lengkapi-profile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && authUser?.id && isAuthenticated) {
        fetchUserData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchUserData, authUser?.id, isAuthenticated])

  // Fetch existing registration
  useEffect(() => {
    const fetchRegistration = async () => {
      if (authUser?.id && activeBatch?.id) {
        const result: any = await supabase
          .from('pendaftaran_tikrar_tahfidz')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('batch_id', activeBatch.id)
          .maybeSingle()

        const { data, error } = result

        if (data && !error) {
          setExistingRegistrationId(data.id)
          setIsEditMode(true)
          setIsFormSubmitted(data.status !== 'draft')

          // Load form data from existing registration
          setFormData({
            understands_commitment: data.understands_commitment || false,
            tried_simulation: data.tried_simulation || false,
            no_negotiation: data.no_negotiation || false,
            has_telegram: data.has_telegram || false,
            saved_contact: data.saved_contact || false,
            has_permission: data.has_permission || '',
            permission_name: data.permission_name || '',
            permission_phone: data.permission_phone || '',
            chosen_juz: data.chosen_juz || '',
            no_travel_plans: data.no_travel_plans || false,
            motivation: data.motivation || '',
            ready_for_team: data.ready_for_team || '',
            main_time_slot: data.main_time_slot || '',
            backup_time_slot: data.backup_time_slot || '',
            time_commitment: data.time_commitment || false,
            understands_program: data.understands_program || false,
            questions: data.questions || ''
          })
        }
      }
    }
    fetchRegistration()
  }, [authUser?.id, activeBatch?.id])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Auto-save with debounce
  const autoSaveDraft = useCallback(
    debounce(async () => {
      if (!authUser || !activeBatch?.id || isFormSubmitted) return

      try {
        setAutoSaving(true)

        const draftData = {
          user_id: authUser.id,
          batch_id: activeBatch.id,
          program_id: activeBatch.id,
          understands_commitment: formData.understands_commitment || false,
          tried_simulation: formData.tried_simulation || false,
          no_negotiation: formData.no_negotiation || false,
          has_telegram: formData.has_telegram || false,
          saved_contact: formData.saved_contact || false,
          has_permission: formData.has_permission || '',
          permission_name: formData.permission_name || '',
          permission_phone: formData.permission_phone || '',
          chosen_juz: formData.chosen_juz || '',
          no_travel_plans: formData.no_travel_plans || false,
          motivation: formData.motivation || '',
          ready_for_team: formData.ready_for_team || 'not_ready',
          main_time_slot: formData.main_time_slot || '',
          backup_time_slot: formData.backup_time_slot || '',
          time_commitment: formData.time_commitment || false,
          understands_program: formData.understands_program || false,
          questions: formData.questions || '',
          status: 'draft'
        }

        const { data: existingRecord } = await (supabase
          .from('pendaftaran_tikrar_tahfidz')
          .select('id, status')
          .eq('user_id', authUser.id)
          .eq('batch_id', activeBatch.id)
          .maybeSingle() as any)

        if (existingRecord) {
          if (existingRecord.status === 'draft') {
            // @ts-ignore
            await (supabase
              .from('pendaftaran_tikrar_tahfidz')
              // @ts-ignore
              .update(draftData)
              .eq('id', existingRecord.id))
            setLastSavedAt(new Date())
          }
        } else {
          // @ts-ignore
          await (supabase
            .from('pendaftaran_tikrar_tahfidz')
            // @ts-ignore
            .insert({
              ...draftData,
              submitted_at: new Date().toISOString()
            }))
          setLastSavedAt(new Date())
        }
      } catch (error) {
        console.error('Auto-save error:', error)
      } finally {
        setAutoSaving(false)
      }
    }, 1000),
    [formData, authUser, activeBatch?.id, isFormSubmitted]
  )

  useEffect(() => {
    autoSaveDraft()
  }, [formData, autoSaveDraft])

  const validateCurrentSection = () => {
    const newErrors: Record<string, string> = {}

    if (currentSection === 1) {
      if (!formData.understands_commitment) newErrors.understands_commitment = 'Required'
      if (!formData.tried_simulation) newErrors.tried_simulation = 'Required'
      if (!formData.no_negotiation) newErrors.no_negotiation = 'Required'
      if (!formData.has_telegram) newErrors.has_telegram = 'Required'
      if (!formData.saved_contact) newErrors.saved_contact = 'Required'
    }

    if (currentSection === 2) {
      if (!formData.has_permission) newErrors.has_permission = 'Required'
      if (formData.has_permission === 'yes' && !formData.permission_name) {
        newErrors.permission_name = 'Required'
      }
      if (formData.has_permission === 'yes' && !formData.permission_phone) {
        newErrors.permission_phone = 'Required'
      }
      if (!formData.chosen_juz) newErrors.chosen_juz = 'Required'
      if (!formData.no_travel_plans) newErrors.no_travel_plans = 'Required'
      if (!formData.motivation) newErrors.motivation = 'Required'
      if (!formData.ready_for_team) newErrors.ready_for_team = 'Required'
    }

    if (currentSection === 3) {
      if (!formData.main_time_slot) newErrors.main_time_slot = 'Required'
      if (!formData.backup_time_slot) newErrors.backup_time_slot = 'Required'
      if (!formData.time_commitment) newErrors.time_commitment = 'Required'
    }

    if (currentSection === 4) {
      if (!formData.understands_program) newErrors.understands_program = 'Required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateCurrentSection()) {
      if (currentSection < 4) {
        setCurrentSection(currentSection + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentSection()) return
    if (!authUser?.id || !activeBatch?.id) {
      toast.error('Data tidak lengkap')
      return
    }

    setIsLoading(true)
    try {
      // Calculate age from birth_date
      const birthDate = userData?.tanggal_lahir ? new Date(userData.tanggal_lahir) : new Date()
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      // Get batch name
      // @ts-ignore
      const { data: batchData } = await (supabase
        .from('batches')
        .select('name')
        .eq('id', activeBatch.id)
        // @ts-ignore
        .single())

      const submitData = {
        user_id: authUser.id,
        batch_id: activeBatch.id,
        program_id: activeBatch.id,
        // @ts-ignore
        batch_name: batchData?.name || activeBatch?.name || 'Unknown',
        // Data from users table
        full_name: userData?.full_name || '',
        email: authUser.email || '',
        wa_phone: userData?.whatsapp || '',
        telegram_phone: userData?.telegram || '',
        address: userData?.alamat || '',
        birth_date: userData?.tanggal_lahir || '',
        age: age,
        domicile: userData?.kota || '',
        timezone: userData?.zona_waktu || 'WIB',
        // Form data
        understands_commitment: formData.understands_commitment,
        tried_simulation: formData.tried_simulation,
        no_negotiation: formData.no_negotiation,
        has_telegram: formData.has_telegram,
        saved_contact: formData.saved_contact,
        has_permission: formData.has_permission,
        permission_name: formData.has_permission === 'janda' ? '' : formData.permission_name,
        permission_phone: formData.has_permission === 'janda' ? '' : formData.permission_phone,
        chosen_juz: formData.chosen_juz,
        no_travel_plans: formData.no_travel_plans,
        motivation: formData.motivation,
        ready_for_team: formData.ready_for_team,
        main_time_slot: formData.main_time_slot,
        backup_time_slot: formData.backup_time_slot,
        time_commitment: formData.time_commitment,
        understands_program: formData.understands_program,
        questions: formData.questions,
        status: 'pending',
        submitted_at: new Date().toISOString()
      }

      if (isEditMode && existingRegistrationId) {
        // @ts-ignore
        const { error: updateError } = await (supabase
          .from('pendaftaran_tikrar_tahfidz')
          // @ts-ignore
          .update(submitData)
          .eq('id', existingRegistrationId)
          .eq('user_id', authUser.id))

        if (updateError) {
          console.error('=== UPDATE ERROR DETAILS ===')
          console.error('Error message:', updateError.message)
          console.error('Error details:', updateError.details)
          console.error('Error hint:', updateError.hint)
          console.error('Error code:', updateError.code)
          console.error('Full error object:', JSON.stringify(updateError, null, 2))
          console.error('Submit data being sent:', JSON.stringify(submitData, null, 2))
          console.error('==========================')
          toast.error(`Gagal memperbarui: ${updateError.message || 'Unknown error'}`)
          throw updateError
        }

        toast.success('Alhamdulillah! Data pendaftaran berhasil diperbarui!')
      } else {
        // @ts-ignore
        const { error: submitError } = await (supabase
          .from('pendaftaran_tikrar_tahfidz')
          // @ts-ignore
          .insert({
            ...submitData,
            selection_status: 'pending',
            submission_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))

        if (submitError) {
          console.error('=== SUBMIT ERROR DETAILS ===')
          console.error('Error message:', submitError.message)
          console.error('Error details:', submitError.details)
          console.error('Error hint:', submitError.hint)
          console.error('Error code:', submitError.code)
          console.error('Full error object:', JSON.stringify(submitError, null, 2))
          console.error('Submit data being sent:', JSON.stringify(submitData, null, 2))
          console.error('==========================')
          toast.error(`Gagal mengirim: ${submitError.message || 'Unknown error'}`)
          throw submitError
        }

        toast.success('Alhamdulillah! Pendaftaran Tikrar Tahfidz berhasil dikirim!')
      }

      router.push('/dashboard')
    } catch (error: any) {
      console.error('Submit error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Loading states
  if (authLoading || batchLoading || juzLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    )
  }

  if (!activeBatch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Batch pendaftaran tidak tersedia saat ini. Silakan cek kembali nanti.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const totalSections = 5 // 0 (data diri) + 4 sections
  const progressPercentage = ((currentSection + 1) / totalSections) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Formulir Pendaftaran Tikrar MTI
          </h1>
          <p className="text-gray-600">Batch: {activeBatch.name}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Section {currentSection + 1} of {totalSections}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Submitted Alert */}
        {isFormSubmitted && (
          <Alert className="bg-yellow-50 border-yellow-200 mb-4">
            <AlertDescription className="text-yellow-800">
              <strong>Pendaftaran Terkirim:</strong> Pendaftaran sudah dikirim dan sedang diproses.
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-save status */}
        {!isFormSubmitted && currentSection > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <span>
              {autoSaving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Menyimpan...
                </span>
              ) : lastSavedAt ? (
                <span>Tersimpan {lastSavedAt.toLocaleTimeString('id-ID')}</span>
              ) : (
                <span>Auto-save aktif</span>
              )}
            </span>
          </div>
        )}

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            {/* Section 0: Data Diri (Confirmation Only) */}
            {currentSection === 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Section 1 of {totalSections} - Konfirmasi Data Diri
                </h2>

                {!isProfileComplete ? (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <p className="font-semibold mb-2">Profil Anda belum lengkap!</p>
                      <p className="mb-3">Silakan lengkapi data diri Anda terlebih dahulu sebelum mendaftar.</p>
                      <Button
                        onClick={() => router.push('/lengkapi-profile')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Lengkapi Profil Sekarang
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Nama Lengkap</Label>
                        <p className="font-semibold">{userData?.full_name || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Email</Label>
                        <p className="font-semibold">{authUser?.email || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">No. WhatsApp</Label>
                        <p className="font-semibold">{userData?.whatsapp || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Telegram</Label>
                        <p className="font-semibold">{userData?.telegram || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Tanggal Lahir</Label>
                        <p className="font-semibold">
                          {userData?.tanggal_lahir ? new Date(userData.tanggal_lahir).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          }) : '-'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Tempat Lahir</Label>
                        <p className="font-semibold">{userData?.tempat_lahir || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Pekerjaan</Label>
                        <p className="font-semibold">{userData?.pekerjaan || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Jenis Kelamin</Label>
                        <p className="font-semibold">{userData?.jenis_kelamin || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-gray-600">Alamat</Label>
                        <p className="font-semibold">{userData?.alamat || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Kota/Kabupaten</Label>
                        <p className="font-semibold">{userData?.kota || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Provinsi</Label>
                        <p className="font-semibold">{userData?.provinsi || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Negara</Label>
                        <p className="font-semibold">{userData?.negara || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Zona Waktu</Label>
                        <p className="font-semibold">{userData?.zona_waktu || 'WIB'}</p>
                      </div>
                    </div>

                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Data diri Anda lengkap. Silakan lanjut ke form pendaftaran.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}

            {/* Section 1: Komitmen & Pemahaman */}
            {currentSection === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Section 2 of {totalSections} - Komitmen & Pemahaman
                </h2>

                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Penting:</strong> Pastikan ukhti sudah membaca dan memahami informasi program sebelum melanjutkan.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Komitmen & Persiapan</Label>

                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="understands_commitment"
                        checked={formData.understands_commitment}
                        onCheckedChange={(checked) => handleInputChange('understands_commitment', checked)}
                      />
                      <label htmlFor="understands_commitment" className="text-sm cursor-pointer">
                        Saya memahami dan bersedia melaksanakan komitmen program Tikrar MTI
                      </label>
                    </div>
                    {errors.understands_commitment && (
                      <p className="text-red-500 text-sm">{errors.understands_commitment}</p>
                    )}

                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="tried_simulation"
                        checked={formData.tried_simulation}
                        onCheckedChange={(checked) => handleInputChange('tried_simulation', checked)}
                      />
                      <label htmlFor="tried_simulation" className="text-sm cursor-pointer">
                        Saya sudah mencoba simulasi setoran harian
                      </label>
                    </div>
                    {errors.tried_simulation && (
                      <p className="text-red-500 text-sm">{errors.tried_simulation}</p>
                    )}

                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="no_negotiation"
                        checked={formData.no_negotiation}
                        onCheckedChange={(checked) => handleInputChange('no_negotiation', checked)}
                      />
                      <label htmlFor="no_negotiation" className="text-sm cursor-pointer">
                        Saya bersedia dengan jadwal yang diberikan tanpa negosiasi
                      </label>
                    </div>
                    {errors.no_negotiation && (
                      <p className="text-red-500 text-sm">{errors.no_negotiation}</p>
                    )}

                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="has_telegram"
                        checked={formData.has_telegram}
                        onCheckedChange={(checked) => handleInputChange('has_telegram', checked)}
                      />
                      <label htmlFor="has_telegram" className="text-sm cursor-pointer">
                        Saya memiliki aplikasi Telegram di HP
                      </label>
                    </div>
                    {errors.has_telegram && (
                      <p className="text-red-500 text-sm">{errors.has_telegram}</p>
                    )}

                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="saved_contact"
                        checked={formData.saved_contact}
                        onCheckedChange={(checked) => handleInputChange('saved_contact', checked)}
                      />
                      <label htmlFor="saved_contact" className="text-sm cursor-pointer">
                        Saya sudah menyimpan nomor kontak admin MTI
                      </label>
                    </div>
                    {errors.saved_contact && (
                      <p className="text-red-500 text-sm">{errors.saved_contact}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Izin & Pilihan Program */}
            {currentSection === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Section 3 of {totalSections} - Izin & Pilihan Program
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Apakah ukhti memiliki izin dari suami/wali?</Label>
                    <Select
                      value={formData.has_permission}
                      onValueChange={(value) => handleInputChange('has_permission', value)}
                    >
                      <SelectTrigger className={errors.has_permission ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih salah satu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Ya, ada izin</SelectItem>
                        <SelectItem value="janda">Saya janda</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.has_permission && (
                      <p className="text-red-500 text-sm mt-1">{errors.has_permission}</p>
                    )}
                  </div>

                  {formData.has_permission === 'yes' && (
                    <>
                      <div>
                        <Label htmlFor="permission_name">Nama Suami/Wali</Label>
                        <Input
                          id="permission_name"
                          value={formData.permission_name}
                          onChange={(e) => handleInputChange('permission_name', e.target.value)}
                          className={errors.permission_name ? 'border-red-500' : ''}
                        />
                        {errors.permission_name && (
                          <p className="text-red-500 text-sm mt-1">{errors.permission_name}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="permission_phone">No. HP Suami/Wali</Label>
                        <Input
                          id="permission_phone"
                          value={formData.permission_phone}
                          onChange={(e) => handleInputChange('permission_phone', e.target.value)}
                          placeholder="Contoh: 628123456789"
                          className={errors.permission_phone ? 'border-red-500' : ''}
                        />
                        {errors.permission_phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.permission_phone}</p>
                        )}
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="text-base font-semibold">Pilihan Juz</Label>
                    <Select
                      value={formData.chosen_juz}
                      onValueChange={(value) => handleInputChange('chosen_juz', value)}
                    >
                      <SelectTrigger className={errors.chosen_juz ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih juz yang ingin dihafal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Juz 1</SelectItem>
                        <SelectItem value="28">Juz 28</SelectItem>
                        <SelectItem value="29">Juz 29</SelectItem>
                        <SelectItem value="30">Juz 30</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.chosen_juz && (
                      <p className="text-red-500 text-sm mt-1">{errors.chosen_juz}</p>
                    )}
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="no_travel_plans"
                      checked={formData.no_travel_plans}
                      onCheckedChange={(checked) => handleInputChange('no_travel_plans', checked)}
                    />
                    <label htmlFor="no_travel_plans" className="text-sm cursor-pointer">
                      Saya tidak memiliki rencana bepergian jauh selama 3 bulan ke depan
                    </label>
                  </div>
                  {errors.no_travel_plans && (
                    <p className="text-red-500 text-sm">{errors.no_travel_plans}</p>
                  )}

                  <div>
                    <Label htmlFor="motivation">Motivasi Mengikuti Program</Label>
                    <Textarea
                      id="motivation"
                      value={formData.motivation}
                      onChange={(e) => handleInputChange('motivation', e.target.value)}
                      rows={3}
                      placeholder="Ceritakan motivasi ukhti mengikuti program ini..."
                      className={errors.motivation ? 'border-red-500' : ''}
                    />
                    {errors.motivation && (
                      <p className="text-red-500 text-sm mt-1">{errors.motivation}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Kesiapan Bergabung di Tim</Label>
                    <Select
                      value={formData.ready_for_team}
                      onValueChange={(value) => handleInputChange('ready_for_team', value)}
                    >
                      <SelectTrigger className={errors.ready_for_team ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih kesiapan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ready">Siap bergabung di tim manapun</SelectItem>
                        <SelectItem value="considering">Masih mempertimbangkan</SelectItem>
                        <SelectItem value="not_ready">Belum siap bergabung di tim</SelectItem>
                        <SelectItem value="infaq">Infaq saja (tanpa bergabung di tim)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.ready_for_team && (
                      <p className="text-red-500 text-sm mt-1">{errors.ready_for_team}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Waktu Setoran */}
            {currentSection === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Section 4 of {totalSections} - Waktu Setoran
                </h2>

                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Waktu setoran dalam WIB (UTC+7). Pilih waktu yang ukhti sanggup untuk commit setiap hari.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label className="text-base font-semibold">Pilihan Waktu Utama</Label>
                    <Select
                      value={formData.main_time_slot}
                      onValueChange={(value) => handleInputChange('main_time_slot', value)}
                    >
                      <SelectTrigger className={errors.main_time_slot ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih waktu utama" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlotOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.main_time_slot && (
                      <p className="text-red-500 text-sm mt-1">{errors.main_time_slot}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Pilihan Waktu Cadangan</Label>
                    <Select
                      value={formData.backup_time_slot}
                      onValueChange={(value) => handleInputChange('backup_time_slot', value)}
                    >
                      <SelectTrigger className={errors.backup_time_slot ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih waktu cadangan" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlotOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.backup_time_slot && (
                      <p className="text-red-500 text-sm mt-1">{errors.backup_time_slot}</p>
                    )}
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="time_commitment"
                      checked={formData.time_commitment}
                      onCheckedChange={(checked) => handleInputChange('time_commitment', checked)}
                    />
                    <label htmlFor="time_commitment" className="text-sm cursor-pointer">
                      Saya berkomitmen untuk melakukan setoran setiap hari pada waktu yang telah dipilih
                    </label>
                  </div>
                  {errors.time_commitment && (
                    <p className="text-red-500 text-sm">{errors.time_commitment}</p>
                  )}
                </div>
              </div>
            )}

            {/* Section 4: Pemahaman Program */}
            {currentSection === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Section 5 of {totalSections} - Pemahaman Program
                </h2>

                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Pastikan ukhti memahami mekanisme dan aturan program Tikrar MTI sebelum melanjutkan.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="understands_program"
                      checked={formData.understands_program}
                      onCheckedChange={(checked) => handleInputChange('understands_program', checked)}
                    />
                    <label htmlFor="understands_program" className="text-sm cursor-pointer">
                      Saya telah membaca dan memahami informasi program Tikrar MTI dengan baik
                    </label>
                  </div>
                  {errors.understands_program && (
                    <p className="text-red-500 text-sm">{errors.understands_program}</p>
                  )}

                  <div>
                    <Label htmlFor="questions">Pertanyaan (Opsional)</Label>
                    <Textarea
                      id="questions"
                      value={formData.questions}
                      onChange={(e) => handleInputChange('questions', e.target.value)}
                      rows={4}
                      placeholder="Jika ada pertanyaan seputar program, silakan tulis di sini..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 0 || isLoading}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentSection < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={currentSection === 0 && !isProfileComplete}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || isFormSubmitted}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Pendaftaran
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TikrarRegistrationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <TikrarRegistrationContent />
    </Suspense>
  )
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}
