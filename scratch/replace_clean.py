import re

with open('app/(protected)/daftar-ulang/page.tsx', 'r') as f:
    content = f.read()

def extract_block(text, start_pattern, end_pattern):
    start = text.find(start_pattern)
    end = text.find(end_pattern, start)
    if start == -1 or end == -1: return ""
    return text[start:end]

# 1. Update Step type
content = content.replace(
    "type Step = 'confirm' | 'halaqah' | 'partner' | 'review' | 'akad' | 'success'",
    "type Step = 'confirm' | 'halaqah' | 'pengabdian' | 'partner' | 'review' | 'akad' | 'success'"
)

# 2. Update formData state
content = content.replace(
    """    partner_wa_phone: string
    partner_notes: string
    akad_files: Array<{ url: string; name: string }>
  }>({""",
    """    partner_wa_phone: string
    partner_notes: string
    pengabdian_choice: string
    donasi_amount: string
    akad_files: Array<{ url: string; name: string }>
  }>({"""
)

content = content.replace(
    """    partner_notes: '',

    // Step 4: Akad""",
    """    partner_notes: '',

    // Step 3b: Pengabdian
    pengabdian_choice: '',
    donasi_amount: '',

    // Step 4: Akad"""
)

# 3. Update load existing submission
content = content.replace(
    """      partner_wa_phone: existingSubmission.partner_wa_phone || '',
      partner_notes: existingSubmission.partner_notes || '',
      // Preserve akad files for both draft and submitted""",
    """      partner_wa_phone: existingSubmission.partner_wa_phone || '',
      partner_notes: existingSubmission.partner_notes || '',
      pengabdian_choice: existingSubmission.pengabdian_choice || '',
      donasi_amount: existingSubmission.donasi_amount ? String(existingSubmission.donasi_amount) : '',
      // Preserve akad files for both draft and submitted"""
)

# 4. Update save draft data
content = content.replace(
    """          tashih_halaqah_id: formData.tashih_halaqah_id,
          partner_user_id: formData.partner_user_id,
          partner_name: formData.partner_name,
          partner_relationship: formData.partner_relationship,
          partner_wa_phone: formData.partner_wa_phone,
          partner_notes: formData.partner_notes,
          akad_files: formData.akad_files,
        }""",
    """          tashih_halaqah_id: formData.tashih_halaqah_id,
          partner_user_id: formData.partner_user_id,
          partner_name: formData.partner_name,
          partner_relationship: formData.partner_relationship,
          partner_wa_phone: formData.partner_wa_phone,
          partner_notes: formData.partner_notes,
          pengabdian_choice: formData.pengabdian_choice,
          donasi_amount: formData.donasi_amount,
          akad_files: formData.akad_files,
        }"""
)

# 5. Update handleNext logic
content = content.replace(
    """      // Wajib pilih kelas ujian
      if (!formData.ujian_halaqah_id) {
        toast.error('Pilih kelas ujian (wajib)')
        return
      }
      // Tashih opsional
      setCurrentStep('partner')
    } else if (currentStep === 'partner') {""",
    """      // Wajib pilih kelas paket
      if (!formData.ujian_halaqah_id) {
        toast.error('Pilih paket kelas halaqah (wajib)')
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

      setCurrentStep('partner')
    } else if (currentStep === 'partner') {"""
)

# 6. Update handleBack
content = content.replace(
    "const steps: Step[] = ['confirm', 'halaqah', 'partner', 'review', 'akad', 'success']",
    "const steps: Step[] = ['confirm', 'halaqah', 'pengabdian', 'partner', 'review', 'akad', 'success']"
)
content = content.replace(
    "const steps: Step[] = ['confirm', 'halaqah', 'partner', 'review', 'akad']",
    "const steps: Step[] = ['confirm', 'halaqah', 'pengabdian', 'partner', 'review', 'akad']"
)

# 7. Update step icons map
content = content.replace(
    """            {[
              { key: 'confirm', label: 'Konfirmasi Data' },
              { key: 'halaqah', label: 'Pilih Halaqah' },
              { key: 'partner', label: 'Pasangan' },
              { key: 'review', label: 'Review' },
              { key: 'akad', label: 'Upload Akad' },
            ].map((step, index) => {""",
    """            {[
              { key: 'confirm', label: 'Konfirmasi Data' },
              { key: 'halaqah', label: 'Pilih Halaqah' },
              { key: 'pengabdian', label: 'Pengabdian' },
              { key: 'partner', label: 'Pasangan' },
              { key: 'review', label: 'Review' },
              { key: 'akad', label: 'Upload Akad' },
            ].map((step, index) => {"""
)
content = content.replace(
    "{index < 4 && (",
    "{index < 5 && ("
)

# 8. Add PengabdianStep component call
content = content.replace(
    """            {currentStep === 'partner' && (""",
    """            {currentStep === 'pengabdian' && (
              <PengabdianStep
                formData={formData}
                onChange={setFormData}
                reregQuestions={reregQuestions}
              />
            )}

            {currentStep === 'partner' && ("""
)

# 9. Modify HalaqahSelectionStep logic
start_marker = "  // Helper to check if class type is available"
end_marker = "  // Class type badge colors"
old_block = extract_block(content, start_marker, end_marker)

new_block = """  // Helper to check if class type is available
  const hasUjian = (halaqah: HalaqahData) =>
    halaqah.class_types.some(ct => ct.class_type === 'ujian')
  const hasTashih = (halaqah: HalaqahData) =>
    halaqah.class_types.some(ct => ct.class_type === 'tashih')

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
  
  // Backwards compatibility for the original rendering code
  const isUjianSelected = isSelected;
  const isTashihSelected = isSelected;
  const isTashihUjianBoth = () => false;

"""
content = content.replace(old_block, new_block)

# Fix onClick for the card
content = content.replace(
    "                className={`",
    "                onClick={() => !halaqah.is_full && togglePackage(halaqah.id)}\n                className={`"
)

# Add radio indicator inside the card
start_header = "                {/* Header with name and class type badge */}"
new_header = """                {/* Radio indicator */}
                <div className={`absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white z-10
                  ${(ujianSelected || tashihSelected) ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                  {(ujianSelected || tashihSelected) && <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                </div>
                {/* Header with name and class type badge */}"""
content = content.replace(start_header, new_header)


# Remove Action Buttons
start_marker3 = "                {/* Action Buttons */}"
end_marker3 = "              </div>\n            )\n          })\n        )}\n      </div>\n    </div>\n  )\n}"

old_block3 = extract_block(content, start_marker3, end_marker3)
content = content.replace(old_block3, "")

# 10. Add Pengabdian component
pengabdian_code = """
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
  const cleanNumber = (val: string) => val.replace(/\\D/g, '')
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

function PartnerSelectionStep({"""

content = content.replace("function PartnerSelectionStep({", pengabdian_code)

review_block = """      {/* Partner Info */}"""
new_review_block = """      {/* Pengabdian & Donasi Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center">
          <Users className="w-4 h-4 mr-2 text-indigo-500" />
          Pengabdian & Kontribusi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Pilihan Pengabdian</p>
            <p className="font-medium">{formData.pengabdian_choice || '-'}</p>
          </div>
          {formData.pengabdian_choice === 'Donatur' && (
            <div>
              <p className="text-gray-500 mb-1">Komitmen Donasi</p>
              <p className="font-medium text-emerald-600">Rp {parseInt(formData.donasi_amount || '0').toLocaleString('id-ID')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Partner Info */}"""
content = content.replace(review_block, new_review_block)

with open('app/(protected)/daftar-ulang/page.tsx', 'w') as f:
    f.write(content)

