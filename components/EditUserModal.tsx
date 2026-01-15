'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Key } from 'lucide-react'
import toast from 'react-hot-toast'

// Data arrays inline (to avoid import issues)
const negaraList = [
  "Indonesia", "Malaysia", "Singapura", "Brunei Darussalam", "Thailand", "Filipina",
  "Vietnam", "Myanmar", "Kamboja", "Laos", "Timor Leste", "United Kingdom", "Australia",
  "New Zealand", "United States", "Canada", "Germany", "Netherlands", "Saudi Arabia",
  "UAE", "Qatar", "Egypt", "Turkey", "Japan", "South Korea", "China", "India",
  "Pakistan", "Bangladesh", "Sri Lanka"
]

const provinsiList = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi", "Sumatera Selatan",
  "Bengkulu", "Lampung", "Kepulauan Bangka Belitung", "Kepulauan Riau", "DKI Jakarta",
  "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Banten", "Bali",
  "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah",
  "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara",
  "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo",
  "Sulawesi Barat", "Maluku", "Maluku Utara", "Papua", "Papua Barat",
  "Papua Tengah", "Papua Selatan"
]

const zonaWaktuList = [
  { value: "WIB", label: "WIB (UTC+7) - Indonesia Barat", country: "Indonesia" },
  { value: "WITA", label: "WITA (UTC+8) - Indonesia Tengah", country: "Indonesia" },
  { value: "WIT", label: "WIT (UTC+9) - Indonesia Timur", country: "Indonesia" },
  { value: "GMT+8_MY", label: "GMT+8 - Malaysia", country: "Malaysia" },
  { value: "GMT+8_SG", label: "GMT+8 - Singapura", country: "Singapura" },
  { value: "GMT+8_BN", label: "GMT+8 - Brunei", country: "Brunei Darussalam" },
  { value: "GMT+7_TH", label: "GMT+7 - Thailand", country: "Thailand" },
  { value: "GMT+7_VN", label: "GMT+7 - Vietnam", country: "Vietnam" },
  { value: "GMT+7_KH", label: "GMT+7 - Kamboja", country: "Kamboja" },
  { value: "GMT+7_LA", label: "GMT+7 - Laos", country: "Laos" },
  { value: "GMT+8_PH", label: "GMT+8 - Filipina", country: "Filipina" },
  { value: "GMT+6:30", label: "GMT+6:30 - Myanmar", country: "Myanmar" },
  { value: "GMT+9_TL", label: "GMT+9 - Timor Leste", country: "Timor Leste" },
  { value: "GMT+5:30_IN", label: "GMT+5:30 - India", country: "India" },
  { value: "GMT+5", label: "GMT+5 - Pakistan", country: "Pakistan" },
  { value: "GMT+6", label: "GMT+6 - Bangladesh", country: "Bangladesh" },
  { value: "GMT+5:30_LK", label: "GMT+5:30 - Sri Lanka", country: "Sri Lanka" },
  { value: "GMT+9_JP", label: "GMT+9 - Jepang", country: "Japan" },
  { value: "GMT+9_KR", label: "GMT+9 - Korea", country: "South Korea" },
  { value: "GMT+8_CN", label: "GMT+8 - China", country: "China" },
  { value: "GMT+3_SA", label: "GMT+3 - Arab Saudi", country: "Saudi Arabia" },
  { value: "GMT+4", label: "GMT+4 - UAE", country: "UAE" },
  { value: "GMT+3_QA", label: "GMT+3 - Qatar", country: "Qatar" },
  { value: "GMT+2", label: "GMT+2 - Mesir", country: "Egypt" },
  { value: "GMT+3_TR", label: "GMT+3 - Turki", country: "Turkey" },
  { value: "GMT+0", label: "GMT+0 - Inggris", country: "United Kingdom" },
  { value: "GMT+1_DE", label: "GMT+1 - Jerman", country: "Germany" },
  { value: "GMT+1_NL", label: "GMT+1 - Belanda", country: "Netherlands" },
  { value: "GMT-5_US_E", label: "GMT-5 - US (Eastern)", country: "United States" },
  { value: "GMT-6_US_C", label: "GMT-6 - US (Central)", country: "United States" },
  { value: "GMT-7_US_M", label: "GMT-7 - US (Mountain)", country: "United States" },
  { value: "GMT-8_US_P", label: "GMT-8 - US (Pacific)", country: "United States" },
  { value: "GMT-5_CA_E", label: "GMT-5 - Kanada (Eastern)", country: "Canada" },
  { value: "GMT-6_CA_C", label: "GMT-6 - Kanada (Central)", country: "Canada" },
  { value: "GMT-7_CA_M", label: "GMT-7 - Kanada (Mountain)", country: "Canada" },
  { value: "GMT-8_CA_P", label: "GMT-8 - Kanada (Pacific)", country: "Canada" },
  { value: "GMT+10", label: "GMT+10 - Australia (Eastern)", country: "Australia" },
  { value: "GMT+9:30", label: "GMT+9:30 - Australia (Central)", country: "Australia" },
  { value: "GMT+8_AU", label: "GMT+8 - Australia (Western)", country: "Australia" },
  { value: "GMT+12", label: "GMT+12 - Selandia Baru", country: "New Zealand" }
]

interface User {
  id?: string
  email?: string | null
  full_name?: string | null
  nama_kunyah?: string | null
  role?: string | null
  roles?: string[] | null
  phone?: string | null
  whatsapp?: string | null
  telegram?: string | null
  provinsi?: string | null
  kota?: string | null
  alamat?: string | null
  negara?: string | null
  zona_waktu?: string | null
  tanggal_lahir?: string | null
  tempat_lahir?: string | null
  jenis_kelamin?: string | null
  pekerjaan?: string | null
  alasan_daftar?: string | null
  is_active?: boolean
}

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, any>) => Promise<void>
  user: User | null
}

// Available roles
const AVAILABLE_ROLES = [
  { id: 'admin', label: 'Admin' },
  { id: 'muallimah', label: 'Muallimah' },
  { id: 'musyrifah', label: 'Musyrifah' },
  { id: 'thalibah', label: 'Thalibah' },
  { id: 'calon_thalibah', label: 'Calon Thalibah' },
  { id: 'pengurus', label: 'Pengurus' },
]

export function EditUserModal({ isOpen, onClose, onSubmit, user }: EditUserModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        nama_kunyah: user.nama_kunyah || '',
        email: user.email || '',
        role: user.role || 'calon_thalibah',
        roles: user.roles || [],
        whatsapp: user.whatsapp || '',
        telegram: user.telegram || '',
        provinsi: user.provinsi || '',
        kota: user.kota || '',
        alamat: user.alamat || '',
        negara: user.negara || 'Indonesia',
        zona_waktu: user.zona_waktu || '',
        tanggal_lahir: user.tanggal_lahir ? user.tanggal_lahir.split('T')[0] : '',
        tempat_lahir: user.tempat_lahir || '',
        jenis_kelamin: user.jenis_kelamin || 'Perempuan',
        pekerjaan: user.pekerjaan || '',
        alasan_daftar: user.alasan_daftar || '',
        is_active: user.is_active !== undefined ? user.is_active : true,
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate at least one role is selected
    const selectedRoles = formData.roles || []
    if (selectedRoles.length === 0) {
      toast.error('Pilih minimal satu role')
      return
    }

    // Set primary role to first selected role if not in selected roles
    if (!selectedRoles.includes(formData.role)) {
      formData.role = selectedRoles[0]
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.id) return

    setIsResettingPassword(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message || 'Password berhasil direset ke default: MTI123!')
      } else {
        toast.error(result.error || 'Gagal reset password')
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal reset password')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const toggleRole = (roleId: string) => {
    setFormData(prev => {
      const currentRoles = prev.roles || []
      if (currentRoles.includes(roleId)) {
        // Don't allow removing the last role
        if (currentRoles.length === 1) {
          toast.error('Minimal harus ada satu role')
          return prev
        }
        // If removing primary role, update primary role
        if (prev.role === roleId && currentRoles.length > 1) {
          const newRoles = currentRoles.filter((r: string) => r !== roleId)
          return { ...prev, roles: newRoles, role: newRoles[0] }
        }
        return { ...prev, roles: currentRoles.filter((r: string) => r !== roleId) }
      } else {
        return { ...prev, roles: [...currentRoles, roleId] }
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.id ? 'Edit User' : 'Add New User'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {user?.email || 'New user'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user?.id && (
              <button
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 disabled:opacity-50"
                title="Reset password to MTI123!"
              >
                {isResettingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                Reset Password
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Kunyah
                  </label>
                  <input
                    type="text"
                    value={formData.nama_kunyah || ''}
                    onChange={(e) => setFormData({ ...formData, nama_kunyah: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="Contoh: Ummu Fulanah"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

              </div>
            </div>

            {/* Roles */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Roles (Multi-role)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {AVAILABLE_ROLES.map((role) => (
                  <label
                    key={role.id}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${(formData.roles || []).includes(role.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={(formData.roles || []).includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium">{role.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Primary Role: <span className="font-semibold">{formData.role || '-'}</span>
                {(formData.roles || []).length > 1 && ` (+${(formData.roles || []).length - 1} more)`}
              </p>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Lokasi</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Negara *
                  </label>
                  <select
                    value={formData.negara || 'Indonesia'}
                    onChange={(e) => setFormData({ ...formData, negara: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    {negaraList.map((negara) => (
                      <option key={negara} value={negara}>{negara}</option>
                    ))}
                  </select>
                </div>

                {formData.negara === 'Indonesia' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provinsi
                    </label>
                    <select
                      value={formData.provinsi || ''}
                      onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Pilih provinsi</option>
                      {provinsiList.map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kota *
                  </label>
                  <input
                    type="text"
                    value={formData.kota || ''}
                    onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat Lengkap *
                </label>
                <textarea
                  value={formData.alamat || ''}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Kontak</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="+62 812-3456-7890"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram *
                  </label>
                  <input
                    type="tel"
                    value={formData.telegram || ''}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="+62 812-3456-7890"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona Waktu *
                  </label>
                  <select
                    value={formData.zona_waktu || ''}
                    onChange={(e) => setFormData({ ...formData, zona_waktu: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Pilih zona waktu</option>
                    {zonaWaktuList
                      .filter(zona => zona.country === formData.negara || !formData.negara)
                      .map((zona) => (
                        <option key={zona.value} value={zona.value}>{zona.label}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Informasi Pribadi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Lahir *
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_lahir || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempat Lahir *
                  </label>
                  <input
                    type="text"
                    value={formData.tempat_lahir || ''}
                    onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.jenis_kelamin || 'Perempuan'}
                    onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="Perempuan">Perempuan</option>
                    <option value="Laki-laki">Laki-laki</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pekerjaan *
                  </label>
                  <input
                    type="text"
                    value={formData.pekerjaan || ''}
                    onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alasan Mendaftar *
                  </label>
                  <textarea
                    value={formData.alasan_daftar || ''}
                    onChange={(e) => setFormData({ ...formData, alasan_daftar: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active !== false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">User Aktif</span>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
