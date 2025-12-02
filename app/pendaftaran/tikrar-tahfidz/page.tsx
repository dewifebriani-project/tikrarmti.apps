'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { submitPendaftaran, type PendaftaranData } from '@/lib/pendaftaran'
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
import { ChevronLeft, ChevronRight, Send, Info, CheckCircle, AlertCircle } from 'lucide-react'

interface FormData {
  // Section 1 - Komitmen & Pemahaman
  understands_commitment: boolean
  tried_simulation: boolean
  no_negotiation: boolean
  has_telegram: boolean
  saved_contact: boolean

  // Section 2 - Izin & Pilihan Program
  has_permission: boolean
  permission_name: string
  permission_phone: string
  permission_phone_validation: string
  chosen_juz: string
  no_travel_plans: boolean
  motivation: string
  ready_for_team: string

  // Section 3 - Data Diri
  full_name: string
  email: string
  address: string
  wa_phone: string
  wa_phone_validation: string
  same_wa_telegram: string
  telegram_phone: string
  telegram_phone_validation: string
  birth_date: string
  age: string
  domicile: string
  timezone: string
  main_time_slot: string
  backup_time_slot: string
  time_commitment: boolean

  // Section 4 - Pemahaman Program
  understands_program: boolean
  questions: string
}

export default function ThalibahBatch2Page() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [currentSection, setCurrentSection] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    understands_commitment: false,
    tried_simulation: false,
    no_negotiation: false,
    has_telegram: false,
    saved_contact: false,
    has_permission: false,
    permission_name: '',
    permission_phone: '',
    permission_phone_validation: '',
    chosen_juz: '',
    no_travel_plans: false,
    motivation: '',
    ready_for_team: '',
    full_name: '',
    email: '',
    address: '',
    wa_phone: '',
    wa_phone_validation: '',
    same_wa_telegram: 'same',
    telegram_phone: '',
    telegram_phone_validation: '',
    birth_date: '',
    age: '',
    domicile: '',
    timezone: '',
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

  const totalSections = 4
  const progressPercentage = (currentSection / totalSections) * 100

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Cleanup redirect timer when component unmounts or status changes
  React.useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer)
      }
    }
  }, [redirectTimer])

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    const newFormData = { ...formData, [field]: value }

    // Auto-calculate age when birth date changes
    if (field === 'birth_date' && typeof value === 'string' && value) {
      const birthYear = new Date(value).getFullYear()
      const currentYear = new Date().getFullYear()
      const calculatedAge = currentYear - birthYear
      newFormData.age = calculatedAge.toString()
    }

    setFormData(newFormData)
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
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Nama harus diisi sesuai KTP'
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email harus diisi'
      }
      if (!formData.address.trim()) {
        newErrors.address = 'Alamat harus diisi'
      }
      if (!formData.wa_phone.trim()) {
        newErrors.wa_phone = 'Nomor WA harus diisi'
      }
      if (formData.wa_phone !== formData.wa_phone_validation) {
        newErrors.wa_phone_validation = 'Validasi nomor WA tidak cocok'
      }
      if (!formData.birth_date) {
        newErrors.birth_date = 'Tanggal lahir harus diisi'
      }
      if (!formData.age.trim()) {
        newErrors.age = 'Usia harus diisi'
      }
      if (!formData.domicile.trim()) {
        newErrors.domicile = 'Domisili harus diisi'
      }
      if (!formData.timezone) {
        newErrors.timezone = 'Pilih zona waktu'
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
      // Prepare data for Firebase
      const submissionData: PendaftaranData = {
        userId: user?.uid || '',
        email: user?.email || '',

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
        full_name: formData.full_name,
        address: formData.address,
        wa_phone: formData.wa_phone,
        telegram_phone: formData.same_wa_telegram === 'different' ? formData.telegram_phone : formData.wa_phone,
        age: formData.age,
        domicile: formData.domicile,
        timezone: formData.timezone,
        main_time_slot: formData.main_time_slot,
        backup_time_slot: formData.backup_time_slot,
        time_commitment: formData.time_commitment,

        // Section 4
        understands_program: formData.understands_program,
        questions: formData.questions,

        // Metadata
        batch_name: 'Tikrar MTI Batch 2',
        submission_date: new Date().toISOString(), // Will be updated by serverTimestamp
        status: 'pending',
        selection_status: 'pending'
      }

      // Submit to Firebase
      await submitPendaftaran(submissionData)

      console.log('Form submitted successfully with data:', submissionData)
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
        <Info className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Section 1 of 4</strong> - FORMULIR PENDAFTARAN TIKRAR MTI BATCH 2 (JUZ 1, 28, 29, 30)
        </AlertDescription>
      </Alert>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="font-bold text-lg mb-4 text-green-900">Bismillah.. Hayyakillah Ahlan wasahlan kakak-kakak calon hafidzah..</h3>

        <div className="space-y-3 text-sm text-gray-700">
          <p>📝 Formulir ini adalah formulir pendaftaran untuk kelas hafalan Al-Qur'an gratis khusus akhawat, menggunakan metode pengulangan (tikrar) sebanyak 40 kali.</p>
          <p>📆 Durasi program: InsyaAllah selama 13 Pekan dimulai dari tanggal 5 Januari untuk target hafalan 1/2 juz.</p>

          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="font-semibold text-green-800 mb-2">Struktur Program:</p>
            <div className="text-xs text-green-700 space-y-1">
              <p>📅 <strong>Pekan 1 (5-11 Januari):</strong> Tashih</p>
              <p>📖 <strong>Pekan 2-11 (12 Januari - 5 April):</strong> Ziyadah</p>
              <p>🕌 <strong>(Catatan: 15-29 Maret adalah Libur Lebaran)</strong></p>
              <p>📚 <strong>Pekan 12 (6-12 April):</strong> Muroja'ah</p>
              <p>✅ <strong>Pekan 13 (13-19 April):</strong> Ujian</p>
            </div>
          </div>

          <p>🎯 Target hafalan harian: 1 halaman perpekan (1/4 halaman per hari, 4 hari dalam sepekan)</p>

          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-800 mb-2">Kewajiban Program:</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>✅ Tashih wajib sekali sepekan untuk kurikulum ziyadah pekan depan, jadwal menyesuaikan</p>
              <p>✅ Ujian wajib sekali sepekan untuk kurikulum selesai ziyadah pekanan, jadwal menyesuaikan</p>
              <p>✅ Setoran 40X boleh memilih mau bersama pasangan atau tidak (yang memilih tidak berpasangan hanya untuk yang bacaan sudah benar-benar mutqin)</p>
              <p>✅ Jadwal setoran pasangan boleh pilih opsi yang sudah ditentukan, akan kami carikan pasangan setoran semaksimal mungkin yang sama waktu dan zona waktu</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="font-semibold text-yellow-800 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              ⚠️ Peringatan Penting
            </p>
            <div className="text-yellow-700 text-xs space-y-2">
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

          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
            <p className="font-semibold text-purple-800 mb-2">👨‍👩‍👧 Izin Keluarga/Wali</p>
            <p className="text-xs text-purple-700">
              Untuk mengikuti program ini, wajib mendapatkan izin dari suami, orang tua, majikan, atau wali, karena waktu antunna akan lebih banyak digunakan untuk menghafal. Jika sewaktu-waktu mereka mencabut izinnya, merekalah yang harus menghubungi pihak MTI untuk menyampaikan permohonan pengunduran diri.
            </p>
          </div>

          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-800 mb-2">⚙️ Tentang Program</p>
            <p className="text-xs text-gray-700">
              Seluruh aturan kami susun demi kebaikan dan kelancaran program ini, bukan untuk mempersulit siapapun. Kami ingin menciptakan lingkungan yang serius dan kondusif bagi para penghafal Qur'an.
            </p>
          </div>

          <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
            <p className="font-semibold text-indigo-800 mb-2">⏳ Komitmen Waktu</p>
            <p className="text-xs text-indigo-700">
              Program ini membutuhkan komitmen waktu minimal 2 jam per hari membersamai Al Quran. Jika antunna memiliki jadwal yang padat, banyak tanggungan, atau merasa tidak bisa konsisten, kami sarankan untuk tidak mendaftar dulu. Tujuan kami adalah agar program ini berjalan dengan zero dropout dan zero blacklist.
            </p>
          </div>

          <div className="mt-3 p-3 bg-teal-50 rounded-lg">
            <p className="font-semibold text-teal-800 mb-2">💡 Tentang Metode</p>
            <p className="text-xs text-teal-700">
              Metode Tikrar MTI kami rancang berdasarkan pengalaman para ibu yang mengajar dan belajar Al-Qur'an di tengah rutinitas rumah tangga. Metode ini cocok untuk emak-emak yang menghafal di rumah sambil mencuci, masak, mengurus anak dan suami.
            </p>
          </div>

          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="font-semibold text-red-800 mb-2">🚫 Tidak cocok untuk:</p>
            <div className="text-xs text-red-700 space-y-1">
              <p>• Tholibah yang bekerja full-time dan hanya memiliki waktu malam untuk keluarga</p>
              <p>• Mu'allimah yang sudah mutqin tapi tidak bisa menyelesaikan program karena kesibukan mengajar, belajar atau kesibukan pribadi</p>
            </div>
            <p className="text-xs text-red-600 mt-2">
              Namun, jika ingin mengadopsi metode ini untuk diterapkan di halaqah masing-masing, silakan. Metode ini bebas dipakai, dimodifikasi, dan disebarluaskan.
            </p>
          </div>

          <div className="mt-3 p-3 bg-orange-50 rounded-lg">
            <p className="font-semibold text-orange-800 mb-2">🧪 Simulasi Sebelum Daftar</p>
            <div className="text-xs text-orange-700 space-y-2">
              <p>Karena metode pengulangan 40 kali bisa terasa berat, lama, dan membosankan, kami mensyaratkan calon peserta untuk mencoba simulasi:</p>
              <p>📖 Bacalah Surah An-Naba' ayat 1–11 sebanyak 40 kali.</p>
              <p><strong>Jika merasa sanggup, silakan lanjut mengisi formulir. Jika tidak, sebaiknya undur diri dari sekarang.</strong></p>
            </div>
          </div>

          <div className="mt-3 p-3 bg-rose-50 rounded-lg border border-rose-200">
            <p className="font-semibold text-rose-800 mb-2">🚩 Peringatan Serius</p>
            <div className="text-xs text-rose-700 space-y-2">
              <p>Kami tidak ridho jika antunna submit formulir pendaftaran ini hanya untuk iseng atau kepo saja, karena hanya merepotkan proses seleksi. Jika hanya ingin kepo saja silahkan langsung japri, kami dengan senang hati share metode Tikrar kepada antunna.</p>
            </div>
          </div>

          <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
            <p className="font-semibold text-emerald-800 mb-2">🎯 Tujuan Program</p>
            <div className="text-xs text-emerald-700 space-y-2">
              <p>Kami tidak mengejar kuantitas peserta, tetapi lebih fokus pada tholibah yang ikhlas, istiqamah, dan bersungguh-sungguh untuk menghafal dan menebar manfaat. Bagi yang masih banyak agenda dan belum bisa konsisten, lebih baik menunggu angkatan berikutnya.</p>
            </div>
          </div>

          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-800 mb-2">⚠️ Program Blacklist</p>
            <div className="text-xs text-slate-700 space-y-2">
              <p>Program ini menerapkan sistem Blacklist permanen bagi peserta yang mundur di tengah jalan tanpa alasan yang dapat kami terima, demi menjaga hak pasangan setoran dan stabilitas Nasional Markaz Tikrar Indonesia.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
        <p className="text-center text-sm text-green-800 font-medium mb-2">
          🤝 Komitmen & Etika
        </p>
        <div className="text-xs text-gray-700 space-y-1">
          <p>• Program ini melibatkan banyak pihak dan pasangan setoran. Kami berusaha menyesuaikan jadwal dengan pilihan antunna sendiri.</p>
          <p>• Harap menjaga komitmen, tidak banyak mengeluh, dan tidak mementingkan diri sendiri</p>
          <p>• Jaga adab kepada seluruh tim Tikrar MTI dan pasangan setoran masing-masing</p>
          <p>• Keputusan kelulusan tes administrasi dan bacaan bersifat final dan tidak dapat diganggu gugat</p>
          <p>• Program ini baru dimulai dan gratis, kami akui masih banyak kekurangan/ketidaksempurnaan di sana-sini, kami berusaha melakukan semaksimal mungkin energi kami untuk program ini.</p>
          <p>• kami tidak melayani tuntutan professionalisme berlebih atau kesempurnaan seakan kami menjual jasa dengan harga tinggi.</p>
          <p>• MTI adalah rumah bagi kita, yang anggotanya adalah keluarga bagaikan ibu dengan anak, kakak dengan adik, yang saling melengkapi kelemahan dan kekurangan masing-masing untuk kebaikan denqan target berkumpul di Jannah Firdaus Al-'Ala. (No Baper, No Drama).</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Apakah antunna  sudah faham dengan semua poin di atas dan bersedia menerima segala komitmen?
            <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={formData.understands_commitment ? "yes" : ""}
            onValueChange={(value) => handleInputChange('understands_commitment', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="yes" id="understands_commitment_yes" className="mt-1" />
              <Label htmlFor="understands_commitment_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah ana sudah dengar dan sudah paham dan insyaAllah ikhlas menerima segala komitmen dan berusaha menjalankannya semaksimal mungkin.
              </Label>
            </div>
          </RadioGroup>
          {errors.understands_commitment && (
            <p className="text-red-500 text-xs">{errors.understands_commitment}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Apakah antunna sudah mencoba simulasi mengulang membaca Surat An-Naba' ayat 1-11 sebanyak 40X
            (Jika belum silahkan coba dulu, sebelum melanjutkan)
            <span className="text-red-500">*</span>
          </Label>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800 font-semibold mb-1">⚠️ Peringatan Penting:</p>
            <p className="text-xs text-yellow-700">
              Kami tidak melayani calon tolibah yang nego-nego jumlah tikrar, walaupun antunna hanya ingin murojaah/sudah pernah hafal. Jika tetap ingin menjadi keluarga MTI silahkan japri kak Mara untuk mendaftar jadi mu'allimah, akan ada kelas Tikrar mu'allimah yang bebas tanpa akad.
            </p>
          </div>
          <RadioGroup
            value={formData.tried_simulation ? "yes" : ""}
            onValueChange={(value) => handleInputChange('tried_simulation', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="yes" id="tried_simulation_yes" className="mt-1" />
              <Label htmlFor="tried_simulation_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah sudah dan saya berjanji ga akan nego-nego jumlah tikrar
              </Label>
            </div>
          </RadioGroup>
          {errors.tried_simulation && (
            <p className="text-red-500 text-xs">{errors.tried_simulation}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800 font-semibold mb-1">⚠️ Peringatan Penting:</p>
            <p className="text-xs text-yellow-700">
              Kami tidak melayani calon tolibah yang nego-nego jumlah tikrar, walaupun antunna hanya ingin muroja'ah/sudah pernah hafal. Jika tetap ingin menjadi keluarga MTI silahkan japri kak Mara untuk mendaftar jadi mu'allimah, akan ada kelas Tikrar mu'allimah yang bebas tanpa akad.
            </p>
          </div>
          <RadioGroup
            value={formData.no_negotiation ? "yes" : ""}
            onValueChange={(value) => handleInputChange('no_negotiation', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="yes" id="no_negotiation_yes" className="mt-1" />
              <Label htmlFor="no_negotiation_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah sudah dan saya berjanji ga akan nego-nego jumlah tikrar
              </Label>
            </div>
          </RadioGroup>
          {errors.no_negotiation && (
            <p className="text-red-500 text-xs">{errors.no_negotiation}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Apakah antunna sudah faham jika program ini juga mewajibkan tholibah untuk mempunyai aplikasi telegram untuk proses seleksi?
          </Label>
          <p className="text-xs text-gray-500 italic">
            Mohon maaf kami tidak akan mengecek VN seleksi yang dikirim lewat whatsapp karena keterbatasan memori hp admin.
          </p>
          <RadioGroup
            value={formData.has_telegram ? "yes" : ""}
            onValueChange={(value) => handleInputChange('has_telegram', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="yes" id="has_telegram_yes" className="mt-1" />
              <Label htmlFor="has_telegram_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah saya sudah download telegram di hp saya
              </Label>
            </div>
          </RadioGroup>
          {errors.has_telegram && (
            <p className="text-red-500 text-xs">{errors.has_telegram}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Apakah antunna sudah simpan nomor Whatsapp Kak Mara 081313650842? Yang akan di-add ke grup hanya yang bisa langsung kak Mara add saja.. kami tidak akan mengirimkan invitation link bagi yang tidak bisa di-add karena tidak mau save nomor admin.
            <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={formData.saved_contact ? "yes" : ""}
            onValueChange={(value) => handleInputChange('saved_contact', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="yes" id="saved_contact_yes" className="mt-1" />
              <Label htmlFor="saved_contact_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah saya sudah simpan nomor hp Kak Mara
              </Label>
            </div>
          </RadioGroup>
          {errors.saved_contact && (
            <p className="text-red-500 text-xs">{errors.saved_contact}</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderSection2 = () => (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Section 2 of 4</strong> - Izin & Pilihan Program
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Apakah antunna sudah meminta izin kepada suami/ orang tua/majikan/wali yang bertanggung jawab atas diri antunna?
            <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-gray-500 italic">
            (Jika belum silahkan minta izin, jika tidak diizinkan mohon bersabar, berdoa kepada Allah semoga Allah mudahkan pada angkatan selanjutnya)
          </p>
          <RadioGroup
            value={formData.has_permission ? "yes" : ""}
            onValueChange={(value) => handleInputChange('has_permission', value === "yes")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="yes" id="has_permission_yes" className="mt-1" />
              <Label htmlFor="has_permission_yes" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Alhamdulillah sudah (ini jawaban saya sejujur-jujurnya yang akan saya pertanggungjawabkan di akhirat nanti)
              </Label>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="janda" id="has_permission_janda" className="mt-1" />
              <Label htmlFor="has_permission_janda" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Bismillah.. Saya seorang janda yang mandiri, tidak terikat, tidak perlu persetujuan siapapun dan mengikuti program ini tidak akan mempengaruhi siapapun.
              </Label>
            </div>
          </RadioGroup>
          {errors.has_permission && (
            <p className="text-red-500 text-xs">{errors.has_permission}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="permission_name" className="text-sm font-medium text-gray-700">
              Nama suami/ orang tua/majikan/wali yang bertanggung jawab atas diri antunna dan yang sudah memberikan izin antunna untuk ikut program ini (Apabila antunna Janda, silahkan isi dengan nama sendiri)
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="permission_name"
              value={formData.permission_name}
              onChange={(e) => handleInputChange('permission_name', e.target.value)}
              placeholder="Ketik nama sesuai KTP"
              className="text-sm"
            />
            {errors.permission_name && (
              <p className="text-red-500 text-xs">{errors.permission_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission_phone" className="text-sm font-medium text-gray-700">
              No HP suami/ orang tua/majikan/wali yang bertanggung jawab atas diri antunna dan yang sudah memberikan izin antunna untuk ikut program ini (Apabila antunna Janda, silahkan isi dengan No HP sendiri)
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="permission_phone"
              value={formData.permission_phone}
              onChange={(e) => handleInputChange('permission_phone', e.target.value)}
              placeholder="08xx-xxxx-xxxx"
              className="text-sm"
            />
            {errors.permission_phone && (
              <p className="text-red-500 text-xs">{errors.permission_phone}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="permission_phone_validation" className="text-sm font-medium text-gray-700">
            Validasi isi sekali lagi No HP suami/ orang tua/majikan/wali yang bertanggung jawab atas diri antunna dan yang sudah memberikan izin antunna untuk ikut program ini (Apabila antunna Janda, silahkan isi dengan No HP sendiri)
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="permission_phone_validation"
            value={formData.permission_phone_validation}
            onChange={(e) => handleInputChange('permission_phone_validation', e.target.value)}
            placeholder="Ketik ulang nomor HP"
            className="text-sm"
          />
          {errors.permission_phone_validation && (
            <p className="text-red-500 text-xs">{errors.permission_phone_validation}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Pilihan juz yang akan dihafalkan<span className="text-red-500">*</span></Label>
          <Select value={formData.chosen_juz} onValueChange={(value) => handleInputChange('chosen_juz', value)}>
            <SelectTrigger>
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
            <p className="text-red-500 text-xs">{errors.chosen_juz}</p>
          )}
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 font-semibold mb-1">Informasi Program:</p>
          <p className="text-xs text-blue-700">
            Program ini akan insyaAllah biidznillah akan dilaksanakan selama 13 pekan dimulai dari tanggal 5 Januari - 18 April 2025. Libur lebaran 2 pekan 16-28 Februari. Apabila antunna sudah merencanakan atau safar, mudik, umrah atau liburan di luar jadwal liburan MTI, kami sarankan menunda pendaftaran pada angkatan berikutnya. Kami tidak menerima alasan mudik/safar yang mendzholimi jadwal pasangan setoran antunna.
          </p>
        </div>

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
          <strong>Section 3 of 4</strong> - Data Diri
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">Nama (Sesuai KTP)</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Nama lengkap sesuai KTP"
              className="text-sm"
            />
            {errors.full_name && (
              <p className="text-red-500 text-xs">{errors.full_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@example.com"
              className="text-sm"
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium text-gray-700">Alamat</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={2}
            placeholder="Alamat lengkap"
            className="text-sm"
          />
          {errors.address && (
            <p className="text-red-500 text-xs">{errors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wa_phone" className="text-sm font-medium text-gray-700">Nomor WA pribadi aktif</Label>
            <Input
              id="wa_phone"
              value={formData.wa_phone}
              onChange={(e) => handleInputChange('wa_phone', e.target.value)}
              placeholder="08xx-xxxx-xxxx"
              className="text-sm"
            />
            {errors.wa_phone && (
              <p className="text-red-500 text-xs">{errors.wa_phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa_phone_validation" className="text-sm font-medium text-gray-700">Validasi Nomor WA</Label>
            <Input
              id="wa_phone_validation"
              value={formData.wa_phone_validation}
              onChange={(e) => handleInputChange('wa_phone_validation', e.target.value)}
              placeholder="Ketik ulang nomor WA"
              className="text-sm"
            />
            {errors.wa_phone_validation && (
              <p className="text-red-500 text-xs">{errors.wa_phone_validation}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Apakah Nomor Whatsapp sama dengan Nomor Telegram?</Label>
          <RadioGroup value={formData.same_wa_telegram} onValueChange={(value) => handleInputChange('same_wa_telegram', value)} className="space-y-3">
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="same" id="same" className="mt-1" />
              <Label htmlFor="same" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">Sama</Label>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="different" id="different" className="mt-1" />
              <Label htmlFor="different" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">Beda</Label>
            </div>
          </RadioGroup>

          {formData.same_wa_telegram === 'different' && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telegram_phone" className="text-sm font-medium text-gray-700">Nomor Telegram</Label>
                <Input
                  id="telegram_phone"
                  value={formData.telegram_phone}
                  onChange={(e) => handleInputChange('telegram_phone', e.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram_phone_validation" className="text-sm font-medium text-gray-700">Validasi Nomor Telegram</Label>
                <Input
                  id="telegram_phone_validation"
                  value={formData.telegram_phone_validation}
                  onChange={(e) => handleInputChange('telegram_phone_validation', e.target.value)}
                  placeholder="Ketik ulang nomor Telegram"
                  className="text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birth_date" className="text-sm font-medium text-gray-700">Tanggal Lahir</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date || ''}
              onChange={(e) => handleInputChange('birth_date', e.target.value)}
              className="text-sm"
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.birth_date && (
              <p className="text-red-500 text-xs">{errors.birth_date}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium text-gray-700">Usia (Terhitung otomatis)</Label>
            <Input
              id="age"
              value={formData.age || (formData.birth_date ? new Date().getFullYear() - new Date(formData.birth_date).getFullYear() : '')}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="Angka saja"
              className="text-sm"
              readOnly
            />
            {errors.age && (
              <p className="text-red-500 text-xs">{errors.age}</p>
            )}
          </div>
        </div>

          <div className="space-y-2">
            <Label htmlFor="domicile" className="text-sm font-medium text-gray-700">Domisili</Label>
            <Input
              id="domicile"
              value={formData.domicile}
              onChange={(e) => handleInputChange('domicile', e.target.value)}
              placeholder="Kota"
              className="text-sm"
            />
            {errors.domicile && (
              <p className="text-red-500 text-xs">{errors.domicile}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Zona Waktu</Label>
            <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih zona waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WIB">WIB</SelectItem>
                <SelectItem value="WITA">WITA</SelectItem>
                <SelectItem value="WIT">WIT</SelectItem>
              </SelectContent>
            </Select>
            {errors.timezone && (
              <p className="text-red-500 text-xs">{errors.timezone}</p>
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
              <li>• <strong>Al-Qur&apos;an Tikrar</strong> ➤ Jika belum memiliki, bisa dibeli di toko buku atau toko online (tautan tersedia di deskripsi grup pendaftaran)</li>
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

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            Formulir Pendaftaran MTI Batch 2
          </h1>
          <p className="text-gray-600">
            Program Hafalan Al-Qur'an Gratis Khusus Akhawat<br/>
            <span className="text-sm text-green-700 font-medium">Metode Tikrar 40 Kali - Juz 1, 28, 29, 30</span>
          </p>
        </div>

        <Card className="shadow-lg border-green-100">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-green-900">
                Section {currentSection} of {totalSections}
              </CardTitle>
              <span className="text-sm text-gray-600">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full h-2" />
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
                  className="flex items-center space-x-2 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>

                {currentSection < totalSections ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || submitStatus === 'success'}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Application</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4 text-yellow-900 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Catatan Penting
          </h3>
          <div className="space-y-3 text-sm text-yellow-800">
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