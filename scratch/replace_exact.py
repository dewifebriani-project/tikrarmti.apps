import os

with open('app/(protected)/daftar-ulang/page.tsx', 'r') as f:
    text = f.read()

# 1. Update Step type
text = text.replace(
    "type Step = 'confirm' | 'halaqah' | 'partner' | 'review' | 'akad' | 'success'",
    "type Step = 'confirm' | 'halaqah' | 'pengabdian' | 'partner' | 'review' | 'akad' | 'success'"
)

# 2. Update formData state
text = text.replace(
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

text = text.replace(
    """    partner_notes: '',

    // Step 4: Akad""",
    """    partner_notes: '',

    // Step 3b: Pengabdian
    pengabdian_choice: '',
    donasi_amount: '',

    // Step 4: Akad"""
)

# 3. Update load existing submission
text = text.replace(
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
text = text.replace(
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
text = text.replace(
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
text = text.replace(
    "const steps: Step[] = ['confirm', 'halaqah', 'partner', 'review', 'akad', 'success']",
    "const steps: Step[] = ['confirm', 'halaqah', 'pengabdian', 'partner', 'review', 'akad', 'success']"
)
text = text.replace(
    "const steps: Step[] = ['confirm', 'halaqah', 'partner', 'review', 'akad']",
    "const steps: Step[] = ['confirm', 'halaqah', 'pengabdian', 'partner', 'review', 'akad']"
)

# 7. Update step icons map
text = text.replace(
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
text = text.replace(
    "{index < 4 && (",
    "{index < 5 && ("
)

# 8. Add PengabdianStep component call
text = text.replace(
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
def replace_between(txt, start_str, end_str, replace_with, include_start=True, include_end=True):
    start_idx = txt.find(start_str)
    if start_idx == -1: return txt
    if not include_start:
        start_idx += len(start_str)
    
    end_idx = txt.find(end_str, start_idx if not include_start else start_idx + len(start_str))
    if end_idx == -1: return txt
    if include_end:
        end_idx += len(end_str)
    
    return txt[:start_idx] + replace_with + txt[end_idx:]


new_logic = """  // Helper to check if class type is available
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
  
  // Fake aliases for typescript
  const isUjianSelected = isSelected
  const isTashihSelected = isSelected
  const isTashihUjianBoth = (h: any) => false
"""
text = replace_between(text, "  // Helper to check if class type is available", "  // Class type badge colors\n", new_logic, True, False)


# Update the map loop start to make it clickable
old_map = """          sortedHalaqahData.map(halaqah => {
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
                {/* Header with name and class type badge */}"""

new_map = """          sortedHalaqahData.map(halaqah => {
            const ujianSelected = isUjianSelected(halaqah.id)
            const tashihSelected = isTashihSelected(halaqah.id)
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
                  {selected && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                </div>
                {/* Header with name and class type badge */}"""
text = text.replace(old_map, new_map)

# Remove the action buttons entirely
text = replace_between(text, "                {/* Action Buttons */}", "                </div>\n              </div>", "", True, False)


# Insert Pengabdian component
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

text = text.replace("function PartnerSelectionStep({", pengabdian_code)

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
text = text.replace("{/* Partner Info */}", new_review_block)

with open('app/(protected)/daftar-ulang/page.tsx', 'w') as f:
    f.write(text)

