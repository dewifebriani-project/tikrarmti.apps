import re

with open('app/(protected)/daftar-ulang/page.tsx', 'r') as f:
    content = f.read()

# Let's replace the whole AkadUploadStep component
# First, let's find the start and end of the component.
start_idx = content.find("function AkadUploadStep({")
end_idx = content.find("function SuccessStep({")

new_akad_component = """function AkadUploadStep({
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
  const [isGenerating, setIsGenerating] = useState(false)

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

  const getHalaqahName = (halaqahId: string) => {
    const halaqah = halaqahData.find(h => h.id === halaqahId)
    return halaqah?.name || '-'
  }

  const handleDownloadPDF = async () => {
    if (!akadData) return
    setIsGenerating(true)
    
    try {
      const PARTNER_TYPE_LABELS: Record<string, string> = {
        self_match: 'Pilih Sendiri',
        system_match: 'Dipasangkan oleh Sistem',
        family: 'Keluarga (Mahram)',
        tarteel: 'Aplikasi Tarteel'
      }

      let partnerName = '-'
      if (formData.partner_type === 'family' || formData.partner_type === 'tarteel') {
        partnerName = formData.partner_name || '-'
      } else if (formData.partner_type === 'self_match' && formData.partner_user_id) {
        // We could theoretically fetch the partner's name, but for now we'll put 'Dipilih dari Marketplace' or leave it if not available
        partnerName = 'Dipilih dari Marketplace'
      }

      const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      
      let pengabdian = formData.pengabdian_type || formData.infaq_type || '-'
      if (formData.pengabdian_type === 'donasi') {
         pengabdian = `Donasi (Rp ${formData.donasi_amount || 0})`
      }

      await generateAkadPDF({
        fullName: formData.confirmed_full_name || registrationData?.full_name || '',
        waPhone: registrationData?.wa_phone || '',
        domicile: registrationData?.domicile || '',
        chosenJuz: formData.final_juz || formData.confirmed_chosen_juz || '',
        halaqahUjian: getHalaqahName(formData.ujian_halaqah_id),
        halaqahTashih: getHalaqahName(formData.tashih_halaqah_id),
        partnerType: PARTNER_TYPE_LABELS[formData.partner_type] || '-',
        partnerName: partnerName,
        pengabdian: pengabdian,
        akadText: akadData.fullText,
        dateStr
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal membuat PDF. Silakan coba lagi.')
    } finally {
      setIsGenerating(false)
    }
  }

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
          {akadQuestion?.label || "Download & Upload Akad"}
        </h2>
        <p className="text-gray-600 mb-6">
          {akadQuestion?.description || "Silakan download PDF akad, pelajari kembali datanya, lalu tandatangani dan upload kembali."}
        </p>
      </div>

      {/* Review Data Again - Minimal */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
         <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <h3 className="font-semibold text-gray-800">Ringkasan Data & Pilihan</h3>
         </div>
         <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block text-gray-500 mb-1">Kelas Ujian</span>
              <span className="font-medium">{getHalaqahName(formData.ujian_halaqah_id)}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Kelas Tashih</span>
              <span className="font-medium">{getHalaqahName(formData.tashih_halaqah_id)}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Pasangan Belajar</span>
              <span className="font-medium">{formData.partner_type ? formData.partner_type.replace('_', ' ') : '-'}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Pengabdian / Donasi</span>
              <span className="font-medium">{formData.pengabdian_type === 'donasi' ? `Donasi (Rp ${formData.donasi_amount || 0})` : (formData.pengabdian_type || '-')}</span>
            </div>
         </div>
      </div>

      {/* Download Akad Action */}
      {!isLoadingAkad && akadData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3 mb-4">
            <FileText className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">{akadData.title}</h3>
              <p className="text-sm text-amber-800 mb-4">
                Akad kesepakatan telah disiapkan beserta data diri dan halaqah Ukhti. Silakan download PDF di bawah ini.
              </p>
            </div>
          </div>

          <div className="flex justify-center my-6">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>{isGenerating ? 'Membuat PDF...' : 'Download PDF Akad'}</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Instruksi:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Download file PDF Akad di atas.</li>
                  <li>Tandatangani dokumen tersebut (bisa diprint & ditandatangani basah, lalu difoto/scan ATAU ditandatangani secara digital).</li>
                  <li>Upload kembali file yang sudah ditandatangani di bawah ini.</li>
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

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">Klik untuk upload file yang sudah ditandatangani</p>
        <p className="text-xs text-gray-500 mb-4">Format: JPG, PNG, atau PDF (Max 5MB)</p>
        
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={onUpload}
          disabled={isLoading}
          className="hidden"
          id="akad-upload"
          multiple
        />
        <label
          htmlFor="akad-upload"
          className={`px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Mengupload...' : 'Pilih File'}
        </label>
      </div>
    </div>
  )
}
"""

new_content = content[:start_idx] + new_akad_component + "\n\n" + content[end_idx:]

with open('app/(protected)/daftar-ulang/page.tsx', 'w') as f:
    f.write(new_content)
