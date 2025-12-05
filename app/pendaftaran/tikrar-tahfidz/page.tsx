'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { type PendaftaranData } from '@/lib/pendaftaran'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Send, Info, CheckCircle, AlertCircle, Calendar, Users, Award, Clock } from 'lucide-react'

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

  // Section 3 - Data Tambahan (khusus tikrar)
  domicile: string
  main_time_slot: string
  backup_time_slot: string
  time_commitment: boolean

  // Section 4 - Pemahaman Program
  understands_program: boolean
  questions: string
}

function TikrarTahfidzPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [currentSection, setCurrentSection] = useState(1)
  const [userProfile, setUserProfile] = useState<any>(null)
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
    domicile: '',
    main_time_slot: '',
    backup_time_slot: '',
    time_commitment: false,
    understands_program: false,
    questions: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null)
  const [batchInfo, setBatchInfo] = useState<{
    batch_id: string,
    program_id: string,
    batch_name: string,
    start_date: string,
    end_date: string,
    duration_weeks: number,
    price: number,
    is_free: boolean,
    scholarship_quota: number,
    total_quota: number,
    registered_count: number
  } | null>(null)

  const totalSections = 4
  const progressPercentage = useMemo(() => (currentSection / totalSections) * 100, [currentSection])

  // Fetch batch and program info
  useEffect(() => {
    const fetchBatchInfo = async () => {
      try {
        const response = await fetch('/api/batch/default')
        if (response.ok) {
          const data = await response.json()
          setBatchInfo({
            batch_id: data.batch_id,
            program_id: data.program_id,
            batch_name: data.batch_name,
            start_date: data.start_date,
            end_date: data.end_date,
            duration_weeks: data.duration_weeks,
            price: data.price,
            is_free: data.is_free,
            scholarship_quota: data.scholarship_quota,
            total_quota: data.total_quota,
            registered_count: data.registered_count
          })
        } else {
          console.error('API error:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error fetching batch info:', error)
      }
    }
    fetchBatchInfo()
  }, [])

  // Fetch user profile data
  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        try {
          const response = await fetch(`/api/user/profile?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            setUserProfile(data)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      }
      fetchUserProfile()
    }
  }, [user])

  // Cleanup redirect timer when component unmounts or status changes
  React.useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer)
      }
    }
  }, [redirectTimer])

  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value }
      return newFormData
    })

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

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
        newErrors.has_permission = 'Wajib memilih salah satu opsi izin'
      }
      if (!formData.permission_name.trim()) {
        newErrors.permission_name = 'Nama pemberi izin harus diisi'
      }
      if (!formData.permission_phone.trim()) {
        newErrors.permission_phone = 'Nomor HP pemberi izin harus diisi'
      }
      if (formData.permission_phone !== formData.permission_phone_validation) {
        newErrors.permission_phone_validation = 'Validasi nomor HP tidak cocok'
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
      // Validasi hanya field yang khusus untuk tikrar
      if (!formData.domicile.trim()) {
        newErrors.domicile = 'Domisili harus diisi'
      }
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

  const handleSubmit = async () => {
    if (!validateSection(4)) return
    if (!user?.email) {
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    try {
      // Check if we have batch info
      if (!batchInfo) {
        setSubmitStatus('error')
        return
      }

      // Prepare data for database
      const submissionData: PendaftaranData = {
        user_id: user?.id || '',
        batch_id: batchInfo.batch_id,
        program_id: batchInfo.program_id,

        // Section 1 - Komitmen & Pemahaman
        understands_commitment: formData.understands_commitment,
        tried_simulation: formData.tried_simulation,
        no_negotiation: formData.no_negotiation,
        has_telegram: formData.has_telegram,
        saved_contact: formData.saved_contact,

        // Section 2 - Permission & Program Choice
        has_permission: formData.has_permission === 'yes' || formData.has_permission === 'janda',
        permission_name: formData.permission_name,
        permission_phone: formData.permission_phone,
        chosen_juz: formData.chosen_juz,
        no_travel_plans: formData.no_travel_plans,
        motivation: formData.motivation,
        ready_for_team: formData.ready_for_team,

        // Section 3 - Data Pribadi (diambil dari users table)
        full_name: userProfile?.full_name || '',
        address: userProfile?.address || '',
        wa_phone: userProfile?.wa_phone || '',
        telegram_phone: userProfile?.telegram_phone || '',
        age: userProfile?.age ? parseInt(userProfile.age) || 0 : 0,
        domicile: formData.domicile, // Hanya untuk tikrar
        timezone: userProfile?.timezone || 'WIB',
        main_time_slot: formData.main_time_slot, // Hanya untuk tikrar
        backup_time_slot: formData.backup_time_slot, // Hanya untuk tikrar
        time_commitment: formData.time_commitment, // Hanya untuk tikrar

        // Section 4 - Program Understanding
        understands_program: formData.understands_program,
        questions: formData.questions,

        // Status
        status: 'pending',
        selection_status: 'pending',
        submission_date: new Date().toISOString()
      }

      // Submit to API
      const response = await fetch('/api/pendaftaran/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit registration')
      }

      console.log('Form submitted successfully with data:', submissionData)
      console.log('Server response:', result)
      setSubmitStatus('success')

      // Redirect to dashboard after 3 seconds so user can see success message
      const redirectTimer = setTimeout(() => {
        console.log('Redirecting to dashboard...')
        router.push('/dashboard')
      }, 3000)

      // Store timer reference for cleanup (optional)
      setRedirectTimer(redirectTimer)
    } catch (error) {
      console.error('Submit error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSection1 = () => (
    <div className="space-y-6">
      <Alert className="bg-green-50 border-green-200">
        <Info className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-green-800 text-base">
          <strong>Section 1 of 4</strong> - FORMULIR PENDAFTARAN TIKRAR MTI BATCH 2 (JUZ 1, 28, 29, 30)
        </AlertDescription>
      </Alert>

      <div className="bg-blue-50 p-8 rounded-lg">
        <h3 className="font-bold text-xl mb-6 text-green-900">Bismillah.. Hayyakillah Ahlan wasahlan kakak-kakak calon hafidzah..</h3>

        <div className="space-y-4 text-base text-gray-700">
          <p>📝 Formulir ini adalah formulir pendaftaran untuk kelas hafalan Al-Qur'an {batchInfo?.is_free ? 'gratis' : 'berbayar'} khusus akhawat, menggunakan metode pengulangan (tikrar) sebanyak 40 kali.</p>
          <p>📆 Durasi program: InsyaAllah selama {Math.ceil((batchInfo?.duration_weeks || 16) / 4)} Bulan ({batchInfo?.duration_weeks || 16} Pekan) dimulai dari tanggal {batchInfo ? new Date(batchInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '5 Januari 2026'} untuk target hafalan 1/2 juz.</p>
          {batchInfo && (
            <p>💰 Biaya program: {batchInfo.is_free ? 'GRATIS' : `Rp ${batchInfo.price.toLocaleString('id-ID')}/bulan`}</p>
          )}

          {batchInfo && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="font-semibold text-green-800 mb-3 text-base">Struktur Program {batchInfo.batch_name}:</p>
              <div className="text-sm text-green-700 space-y-2">
                <p>📅 <strong>Pekan 1:</strong> Tashih dan Orientasi</p>
                <p>📖 <strong>Pekan 2-{batchInfo.duration_weeks - 2}:</strong> Ziyadah (Pertambahan Hafalan)</p>
                <p>📚 <strong>Pekan {batchInfo.duration_weeks - 1}:</strong> Muroja'ah</p>
                <p>✅ <strong>Pekan {batchInfo.duration_weeks}:</strong> Ujian Akhir</p>
                <p>🕌 <strong>Tanggal Mulai:</strong> {new Date(batchInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>🎯 <strong>Tanggal Selesai:</strong> {new Date(batchInfo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          )}

          <p>🎯 Target hafalan harian: 1 halaman perpekan (1/4 halaman per hari, 4 hari dalam sepekan)</p>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-800 mb-3 text-base">Kewajiban Program:</p>
            <div className="text-sm text-blue-700 space-y-2">
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
              <p><strong>Jika antunna dinyatakan lolos seleksi administrasi dan tes bacaan, dan sudah daftar ulang, kami tidak meridhoi antunna keluar dari program tanpa udzur syar'i.</strong> Alasan seperti "sibuk", "ada kerjaan", atau "ikut kelas lain" tidak kami terima.</p>

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
              Untuk mengikuti program ini, wajib mendapatkan izin dari suami, orang tua, majikan, atau wali, karena waktu antunna akan lebih banyak digunakan untuk menghafal. Jika sewaktu-waktu mereka mencabut izinnya, merekalah yang harus menghubungi pihak MTI untuk menyampaikan permohonan pengunduran diri.
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
              Program ini membutuhkan komitmen waktu minimal 2 jam per hari membersamai Al Quran. Jika antunna memiliki jadwal yang padat, banyak tanggungan, atau merasa tidak bisa konsisten, kami sarankan untuk tidak mendaftar dulu. Tujuan kami adalah agar program ini berjalan dengan zero dropout dan zero blacklist.
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
              <p>• Mu'allimah yang sudah mutqin tapi tidak bisa menyelesaikan program karena kesibukan mengajar, belajar atau kesibukan pribadi</p>
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
              <p>Kami tidak ridho jika antunna submit formulir pendaftaran ini hanya untuk iseng atau kepo saja, karena hanya merepotkan proses seleksi. Jika hanya ingin kepo saja silahkan langsung japri, kami dengan senang hati share metode Tikrar kepada antunna.</p>
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
          <p>• Program ini melibatkan banyak pihak dan pasangan setoran. Kami berusaha menyesuaikan jadwal dengan pilihan antunna sendiri.</p>
          <p>• Harap menjaga komitmen, tidak banyak mengeluh, dan tidak mementingkan diri sendiri</p>
          <p>• Jaga adab kepada seluruh tim Tikrar MTI dan pasangan setoran masing-masing</p>
          <p>• Keputusan kelulusan tes administrasi dan bacaan bersifat final dan tidak dapat diganggu gugat</p>
          <p>• Program ini baru dimulai dan gratis, kami akui masih banyak kekurangan/ketidaksempurnaan di sana-sini, kami berusaha melakukan semaksimal mungkin energi kami untuk program ini.</p>
          <p>• kami tidak melayani tuntutan professionalisme berlebih atau kesempurnaan seakan kami menjual jasa dengan harga tinggi.</p>
          <p>• MTI adalah rumah bagi kita, yang anggotanya adalah keluarga bagaikan ibu dengan anak, kakak dengan adik, yang saling melengkapi kelemahan dan kekurangan masing-masing untuk kebaikan denqan target berkumpul di Jannah Firdaus Al-'Ala. (No Baper, No Drama).</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">
            Apakah antunna  sudah faham dengan semua poin di atas dan bersedia menerima segala komitmen?
            <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={formData.understands_commitment ? "yes" : ""}
            onValueChange={(value) => handleInputChange('understands_commitment', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-4 p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <RadioGroupItem value="yes" id="understands_commitment_yes" className="mt-1 w-5 h-5" />
              <Label htmlFor="understands_commitment_yes" className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah ana sudah dengar dan sudah paham dan insyaAllah ikhlas menerima segala komitmen dan berusaha menjalankannya semaksimal mungkin.
              </Label>
            </div>
          </RadioGroup>
          {errors.understands_commitment && (
            <p className="text-red-500 text-sm font-medium">{errors.understands_commitment}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">
            Apakah antunna sudah mencoba simulasi mengulang membaca Surat An-Naba' ayat 1-11 sebanyak 40X
            (Jika belum silahkan coba dulu, sebelum melanjutkan)
            <span className="text-red-500">*</span>
          </Label>
          <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
            <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Peringatan Penting:</p>
            <p className="text-sm text-yellow-700">
              Kami tidak melayani calon tolibah yang nego-nego jumlah tikrar, walaupun antunna hanya ingin murojaah/sudah pernah hafal. Jika tetap ingin menjadi keluarga MTI silahkan japri kak Mara untuk mendaftar jadi mu'allimah, akan ada kelas Tikrar mu'allimah yang bebas tanpa akad.
            </p>
          </div>
          <RadioGroup
            value={formData.tried_simulation ? "yes" : ""}
            onValueChange={(value) => handleInputChange('tried_simulation', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-4 p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <RadioGroupItem value="yes" id="tried_simulation_yes" className="mt-1 w-5 h-5" />
              <Label htmlFor="tried_simulation_yes" className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah sudah dan saya berjanji ga akan nego-nego jumlah tikrar
              </Label>
            </div>
          </RadioGroup>
          {errors.tried_simulation && (
            <p className="text-red-500 text-sm font-medium">{errors.tried_simulation}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
            <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Peringatan Penting:</p>
            <p className="text-sm text-yellow-700">
              Kami tidak melayani calon tolibah yang nego-nego jumlah tikrar, walaupun antunna hanya ingin muroja'ah/sudah pernah hafal. Jika tetap ingin menjadi keluarga MTI silahkan japri kak Mara untuk mendaftar jadi mu'allimah, akan ada kelas Tikrar mu'allimah yang bebas tanpa akad.
            </p>
          </div>
          <RadioGroup
            value={formData.no_negotiation ? "yes" : ""}
            onValueChange={(value) => handleInputChange('no_negotiation', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-4 p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <RadioGroupItem value="yes" id="no_negotiation_yes" className="mt-1 w-5 h-5" />
              <Label htmlFor="no_negotiation_yes" className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah sudah dan saya berjanji ga akan nego-nego jumlah tikrar
              </Label>
            </div>
          </RadioGroup>
          {errors.no_negotiation && (
            <p className="text-red-500 text-sm font-medium">{errors.no_negotiation}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">
            Apakah antunna sudah faham jika program ini juga mewajibkan tholibah untuk mempunyai aplikasi telegram untuk proses seleksi?
          </Label>
          <p className="text-sm text-gray-500 italic">
            Mohon maaf kami tidak akan mengecek VN seleksi yang dikirim lewat whatsapp karena keterbatasan memori hp admin.
          </p>
          <RadioGroup
            value={formData.has_telegram ? "yes" : ""}
            onValueChange={(value) => handleInputChange('has_telegram', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-4 p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <RadioGroupItem value="yes" id="has_telegram_yes" className="mt-1 w-5 h-5" />
              <Label htmlFor="has_telegram_yes" className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah saya sudah download telegram di hp saya
              </Label>
            </div>
          </RadioGroup>
          {errors.has_telegram && (
            <p className="text-red-500 text-sm font-medium">{errors.has_telegram}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">
            Apakah antunna sudah simpan nomor Whatsapp Kak Mara 081313650842? Yang akan di-add ke grup hanya yang bisa langsung kak Mara add saja.. kami tidak akan mengirimkan invitation link bagi yang tidak bisa di-add karena tidak mau save nomor admin.
            <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={formData.saved_contact ? "yes" : ""}
            onValueChange={(value) => handleInputChange('saved_contact', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-4 p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <RadioGroupItem value="yes" id="saved_contact_yes" className="mt-1 w-5 h-5" />
              <Label htmlFor="saved_contact_yes" className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah saya sudah simpan nomor hp Kak Mara
              </Label>
            </div>
          </RadioGroup>
          {errors.saved_contact && (
            <p className="text-red-500 text-sm font-medium">{errors.saved_contact}</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderSection2 = () => (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800 text-base">
          <strong>Section 2 of 4</strong> - Izin & Pilihan Program
        </AlertDescription>
      </Alert>

      <div className="space-y-8">
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">
            Apakah antunna sudah meminta izin kepada suami/ orang tua/majikan/wali yang bertanggung jawab atas diri antunna?
            <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-500 italic">
            (Jika belum silahkan minta izin, jika tidak diizinkan mohon bersabar, berdoa kepada Allah semoga Allah mudahkan pada angkatan selanjutnya)
          </p>
          <RadioGroup
            value={formData.has_permission}
            onValueChange={(value) => handleInputChange('has_permission', value as 'yes' | 'janda' | '')}
            className="space-y-3"
          >
            <div className="flex items-start space-x-4 p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <RadioGroupItem value="yes" id="has_permission_yes" className="mt-1 w-5 h-5" />
              <Label htmlFor="has_permission_yes" className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah sudah (ini jawaban saya sejujur-jujurnya yang akan saya pertanggungjawabkan di akhirat nanti)
              </Label>
            </div>
            <div className="flex items-start space-x-4 p-4 border-2 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-300">
              <RadioGroupItem value="janda" id="has_permission_janda" className="mt-1 w-5 h-5" />
              <Label htmlFor="has_permission_janda" className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Saya seorang janda yang mandiri, tidak terikat, tidak perlu persetujuan siapapun dan mengikuti program ini tidak akan mempengaruhi siapapun.
              </Label>
            </div>
          </RadioGroup>
          {errors.has_permission && (
            <p className="text-red-500 text-sm font-medium">{errors.has_permission}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="permission_name" className="text-base font-semibold text-gray-800">
              {formData.has_permission === 'janda'
                ? "Nama lengkap antunna (sebagai penanggung jawab diri sendiri)"
                : "Nama suami/ orang tua/majikan/wali yang bertanggung jawab atas diri antunna dan yang sudah memberikan izin antunna untuk ikut program ini"
              }
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="permission_name"
              value={formData.permission_name}
              onChange={(e) => handleInputChange('permission_name', e.target.value)}
              placeholder={formData.has_permission === 'janda' ? "Ketik nama lengkap antunna" : "Ketik nama pemberi izin sesuai KTP"}
              className="text-base py-3"
            />
            {errors.permission_name && (
              <p className="text-red-500 text-sm font-medium">{errors.permission_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission_phone" className="text-base font-semibold text-gray-800">
              {formData.has_permission === 'janda'
                ? "No HP antunna yang bisa dihubungi"
                : "No HP suami/ orang tua/majikan/wali yang bertanggung jawab atas diri antunna dan yang sudah memberikan izin antunna untuk ikut program ini"
              }
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="permission_phone"
              value={formData.permission_phone}
              onChange={(e) => handleInputChange('permission_phone', e.target.value)}
              placeholder={formData.has_permission === 'janda' ? "08xx-xxxx-xxxx (No HP aktif antunna)" : "08xx-xxxx-xxxx (No HP pemberi izin)"}
              className="text-base py-3"
            />
            {errors.permission_phone && (
              <p className="text-red-500 text-sm font-medium">{errors.permission_phone}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="permission_phone_validation" className="text-base font-semibold text-gray-800">
            {formData.has_permission === 'janda'
              ? "Validasi No HP antunna (ketik ulang untuk memastikan nomor benar)"
              : "Validasi No HP suami/ orang tua/majikan/wali yang bertanggung jawab (ketik ulang untuk memastikan nomor benar)"
            }
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

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">Pilihan juz yang akan dihafalkan<span className="text-red-500">*</span></Label>
          <Select value={formData.chosen_juz} onValueChange={(value) => handleInputChange('chosen_juz', value)}>
            <SelectTrigger className="text-base py-3">
              <SelectValue placeholder="Pilih juz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30a">Juz 30A (An-Naba' - Al-A'la)</SelectItem>
              <SelectItem value="30b">Juz 30B (Al-A'la - An-Nas)</SelectItem>
              <SelectItem value="29a">Juz 29A (Al-Mulk - Nuh)</SelectItem>
              <SelectItem value="29b">Juz 29B (Al-Jinn - Al-Mursalat)</SelectItem>
              <SelectItem value="28a">Juz 28A (Al-Mujadilah - Ash-Shaf)</SelectItem>
              <SelectItem value="28b">Juz 28B (Ash-Shaf - At-Tahrim)</SelectItem>
              <SelectItem value="1">Juz 1 (Al-Fatihah - Al-Baqarah)</SelectItem>
            </SelectContent>
          </Select>
          {errors.chosen_juz && (
            <p className="text-red-500 text-sm font-medium">{errors.chosen_juz}</p>
          )}
        </div>

        {batchInfo && (
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
            <p className="text-sm text-blue-800 font-semibold mb-2">Informasi Program {batchInfo.batch_name}:</p>
            <p className="text-sm text-blue-700">
              Program ini akan insyaAllah biidznillah akan dilaksanakan selama {batchInfo.duration_weeks} pekan dimulai dari tanggal {new Date(batchInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - {new Date(batchInfo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
              <strong> Program ini {batchInfo.is_free ? 'GRATIS' : `Rp ${batchInfo.price.toLocaleString('id-ID')}/bulan`}</strong>.
              <br /><br />
              Apabila antunna sudah merencanakan atau safar, mudik, umrah atau liburan di luar jadwal liburan MTI, kami sarankan menunda pendaftaran pada angkatan berikutnya. Kami tidak menerima alasan safar yang mendzholimi jadwal pasangan setoran antunna.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Apakah antunna sudah merencanakan atau safar, mudik, umrah atau liburan di luar jadwal liburan MTI?
            <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={formData.no_travel_plans ? "yes" : ""}
            onValueChange={(value) => handleInputChange('no_travel_plans', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="yes" id="no_travel_plans_yes" className="mt-1" />
              <Label htmlFor="no_travel_plans_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                InsyaAllah saya tidak ada rencana safar, kalaupun tiba-tiba safar saya akan bertanggungjawab memprioritaskan waktu untuk memenuhi kewajiban setoran kepada pasangan
              </Label>
            </div>
          </RadioGroup>
          {errors.no_travel_plans && (
            <p className="text-red-500 text-xs">{errors.no_travel_plans}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivation" className="text-sm font-medium text-gray-700">
            Ketikkan secara singkat apa motivasi terbesar antunna untuk menghafal Al-Quran sehingga antunna rela mengikuti program ini dan ikhlas menjalankan semua aturan-peraturan dari MTI?
          </Label>
          <Textarea
            id="motivation"
            value={formData.motivation}
            onChange={(e) => handleInputChange('motivation', e.target.value)}
            rows={3}
            placeholder="Jelaskan motivasi Anda..."
            className="text-sm"
          />
          {errors.motivation && (
            <p className="text-red-500 text-xs">{errors.motivation}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Apakah antunna siap dan bersedia menjadi bagian tim MTI apabila kami anggap sudah layak menjadi khadimat Al-Quran sebagai mu'allimah atau musyrifah untuk turut membantu MTI dalam misi memberantas buta huruf Al-Quran di Indonesia?
            <span className="text-red-500">*</span>
          </Label>
          <RadioGroup value={formData.ready_for_team} onValueChange={(value) => handleInputChange('ready_for_team', value)} className="space-y-3">
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="ready" id="ready" className="mt-1" />
              <Label htmlFor="ready" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                InsyaAllah siapppp (jawaban ini kami catat sebagai akad)
              </Label>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="infaq" id="infaq" className="mt-1" />
              <Label htmlFor="infaq" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Afwan saya tidak bisa menjadi tim MTI dikarenakan kesibukan dan komitmen di lembaga lain, sebagai gantinya saya akan infaq sesuai dengan kemampuan saya
              </Label>
            </div>
          </RadioGroup>
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
          <strong>Section 3 of 4</strong> - Konfirmasi Data & Waktu
        </AlertDescription>
      </Alert>

      {/* Data diri sudah diambil dari tabel users - tampilkan sebagai informasi saja */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Data Diri (Diambil dari profil Anda)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Nama:</span>
            <p className="text-gray-900">{userProfile?.full_name || '-'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Email:</span>
            <p className="text-gray-900">{user?.email || '-'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">No. WhatsApp:</span>
            <p className="text-gray-900">{userProfile?.wa_phone || '-'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">No. Telegram:</span>
            <p className="text-gray-900">{userProfile?.telegram_phone || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <span className="font-medium text-gray-600">Alamat:</span>
            <p className="text-gray-900">{userProfile?.address || '-'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Usia:</span>
            <p className="text-gray-900">{userProfile?.age ? `${userProfile.age} tahun` : '-'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Zona Waktu:</span>
            <p className="text-gray-900">{userProfile?.timezone || '-'}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 italic">
          Jika data di atas tidak lengkap atau salah, silakan perbarui di halaman lengkapi profil.
        </p>
      </div>

      {/* Field yang khusus untuk tikrar */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="domicile" className="text-sm font-medium text-gray-700">Domisili (Kota)</Label>
            <Input
              id="domicile"
              value={formData.domicile}
              onChange={(e) => handleInputChange('domicile', e.target.value)}
              placeholder="Kota domisili"
              className="text-sm"
            />
            {errors.domicile && (
              <p className="text-red-500 text-xs">{errors.domicile}</p>
            )}
          </div>
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
          {batchInfo && (
            <div>
              <p><strong>🗓 Durasi Program:</strong> Program ini insyaAllah biidznillah akan berlangsung selama {batchInfo.duration_weeks} pekan, dimulai dari {new Date(batchInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} hingga {new Date(batchInfo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
              <strong> Program ini {batchInfo.is_free ? 'GRATIS' : `Rp ${batchInfo.price.toLocaleString('id-ID')}/bulan`}</strong>
              </p>
            </div>
          )}

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
              Apakah antunna faham dengan poin-poin di atas?
            </Label>
            {errors.understands_program && (
              <p className="text-red-500 text-xs">{errors.understands_program}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="questions" className="text-sm font-medium text-gray-700">
            Silahkan ketik pertanyaan antunna apabila ada yang masih kurang faham
          </Label>
          <Textarea
            id="questions"
            value={formData.questions}
            onChange={(e) => handleInputChange('questions', e.target.value)}
            rows={4}
            placeholder="Ketik pertanyaan Anda di sini (kosongkan jika tidak ada)"
            className="text-sm"
          />
        </div>

        {submitStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Alhamdulillah!</strong> Formulir pendaftaran Anda telah berhasil dikirim. Tim kami akan menghubungi Anda melalui Telegram untuk proses seleksi selanjutnya.
              <br /><br />
              <strong>Jangan lupa:</strong> Persiapkan diri untuk tes bacaan Al-Qur'an dan simak informasi selanjutnya di Telegram.
              <br /><br />
              <div className="flex items-center space-x-2 mb-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm">Anda akan dialihkan ke dashboard otomatis...</span>
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

        {submitStatus === 'error' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Terjadi kesalahan saat mengirim formulir. Silakan coba lagi atau hubungi admin melalui WhatsApp 081313650842.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )

  // Bypass authentication check temporarily for debugging
  // if (loading || !user) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
  //       <div className="max-w-4xl mx-auto px-4">
  //         <div className="text-center mb-8">
  //           <h1 className="text-4xl font-bold text-green-900 mb-3">
  //             Formulir Pendaftaran MTI Batch 2
  //           </h1>
  //           <p className="text-lg text-gray-600">
  //             Program Hafalan Al-Qur'an Gratis Khusus Akhawat
  //           </p>
  //         </div>

  //         {/* Skeleton Loading */}
  //         <div className="animate-pulse">
  //           <div className="bg-white rounded-lg shadow-lg p-8">
  //             <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
  //             <div className="h-2 bg-gray-200 rounded w-full mb-8"></div>

  //             {/* Form Sections Skeleton */}
  //             <div className="space-y-6">
  //               <div className="space-y-4">
  //                 <div className="h-6 bg-gray-200 rounded w-2/3"></div>
  //                 <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
  //                 <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
  //                 <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  //               </div>

  //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                 <div className="h-12 bg-gray-200 rounded"></div>
  //                 <div className="h-12 bg-gray-200 rounded"></div>
  //               </div>

  //               <div className="flex justify-between pt-6 border-t">
  //                 <div className="h-10 bg-gray-200 rounded w-24"></div>
  //                 <div className="h-10 bg-gray-200 rounded w-24"></div>
  //               </div>
  //             </div>
  //           </div>
  //         </div>

  //         <div className="text-center mt-8">
  //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900 mx-auto mb-4"></div>
  //           <p className="text-gray-600">Memuat formulir pendaftaran...</p>
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

  // Show form directly for debugging
  console.log('Rendering form - user:', user, 'loading:', loading)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-900 mb-3">
            Formulir Pendaftaran MTI Batch 2
          </h1>
          <p className="text-lg text-gray-600">
            Program Hafalan Al-Qur'an Gratis Khusus Akhawat<br/>
            <span className="text-base text-green-700 font-medium">Metode Tikrar 40 Kali - Juz 1, 28, 29, 30</span>
          </p>

          {/* Link ke Perjalanan Program */}
          <div className="mt-4">
            <a
              href="/pendaftaran/perjalanan-program"
              className="inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors duration-200"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Lihat Perjalanan Program
            </a>
          </div>
        </div>

        {/* Batch Information Card */}
        {batchInfo && (
          <Card className="mb-6 border-2 border-green-200 shadow-md">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-green-900 mb-4">Informasi {batchInfo.batch_name}</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {/* Total Pendaftar */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Total Pendaftar</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {batchInfo.registered_count}/{batchInfo.total_quota} Peserta
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {((batchInfo.registered_count / batchInfo.total_quota) * 100).toFixed(0)}% Terisi
                  </p>
                </div>

                {/* Biaya */}
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Award className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600">Biaya Program</p>
                  {batchInfo.is_free ? (
                    <>
                      <p className="text-2xl font-bold text-green-900">GRATIS</p>
                      <p className="text-xs text-green-700 mt-1">Program Beasiswa</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-green-900">
                        Rp {batchInfo.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-green-700 mt-1">Per Bulan</p>
                    </>
                  )}
                </div>

                {/* Durasi */}
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm text-gray-600">Durasi</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {Math.ceil(batchInfo.duration_weeks / 4)} Bulan
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    {batchInfo.duration_weeks} Pekan
                  </p>
                </div>

                {/* Kuota Tersedia */}
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-sm text-gray-600">Kuota Tersedia</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {batchInfo.scholarship_quota} lagi
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Dari {batchInfo.total_quota} Kuota
                  </p>
                </div>
              </div>

              {/* Tanggal Program di bawah */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Mulai</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(batchInfo.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Selesai</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(batchInfo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Pendaftar Terisi</span>
                  <span>{(batchInfo.registered_count / batchInfo.total_quota * 100).toFixed(0)}%</span>
                </div>
                <Progress
                  value={batchInfo.registered_count / batchInfo.total_quota * 100}
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {batchInfo.registered_count} dari {batchInfo.total_quota} kuota terisi ({batchInfo.scholarship_quota} tersedia)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg border-green-100">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-green-900">
                Section {currentSection} of {totalSections}
              </CardTitle>
              <span className="text-base text-gray-600">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full h-3" />
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {currentSection === 1 && renderSection1()}
              {currentSection === 2 && renderSection2()}
              {currentSection === 3 && renderSection3()}
              {currentSection === 4 && renderSection4()}

              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentSection === 1 || isSubmitting}
                  className="flex items-center space-x-2 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-base py-2 px-4"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Previous</span>
                </Button>

                {currentSection < totalSections ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 text-base py-2 px-4"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || submitStatus === 'success'}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 text-base py-2 px-4"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Application</span>
                        <Send className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8">
          <h3 className="font-bold text-xl mb-4 text-yellow-900 flex items-center">
            <AlertCircle className="w-6 h-6 mr-2" />
            Catatan Penting
          </h3>
          <div className="space-y-3 text-base text-yellow-800">
            <p>• Pastikan Antunna sudah mencoba simulasi membaca Surat An-Naba' ayat 1-11 sebanyak 40 kali sebelum melanjutkan pendaftaran.</p>
            <p>• Simpan nomor WhatsApp Kak Mara (081313650842) agar dapat di-add ke grup setelah lolos seleksi.</p>
            <p>• Siapkan aplikasi Telegram untuk proses seleksi dan komunikasi selanjutnya.</p>
            <p>• Program ini membutuhkan komitmen waktu minimal 2 jam per hari.</p>
            <p>• Pastikan Antunna memiliki izin dari suami/orang tua/wali yang bertanggung jawab atas diri Anda.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TikrarTahfidzPage