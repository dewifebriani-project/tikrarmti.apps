'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, BookOpen, MessageSquare, Sparkles, Star, User, Phone, Mic, Headphones, ArrowRight, X, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadJurnalScreenshot } from '../actions'
import { toast } from 'sonner'
import { Loader2 as Spinner } from 'lucide-react'

interface JurnalEntryFormProps {
  blockCode: string
  initialData: any
  isSubmitting: boolean
  onSubmit: (data: any) => void
  onCancel: () => void
}

const activityOptions = [
  { id: 'rabth_completed', name: 'Rabth', sub: 'Menyambung (+10 Blok Terakhir)', desc: '1x per Hari', icon: BookOpen },
  { id: 'murajaah_completed', name: 'Murajaah', sub: 'Ulang Blok Kemarin', desc: '5x per Hari', icon: Headphones },
  { id: 'simak_murattal_completed', name: 'Simak Murattal', sub: 'Mendengar Qori', desc: '5x per Hari', icon: Headphones },
  { id: 'tikrar_bi_an_nadzar_completed', name: 'Tikrar Bi An Nadzar', sub: 'Baca Melihat Mushaf', desc: '40x per Halaman', icon: Sparkles },
  { id: 'tasmi_record_completed', name: 'Tasmi Record', sub: 'Rekam Tanpa Mushaf', desc: '3x Rekaman Lancar', icon: Mic },
  { id: 'simak_record_completed', name: 'Simak Record', sub: 'Dengar Rekaman Sendiri', desc: '1x per Halaman', icon: Headphones },
  { id: 'tikrar_bi_al_ghaib_completed', name: 'Tikrar Bi Al Ghaib', sub: 'Baca Tanpa Mushaf', desc: '40x per Halaman', icon: Star },
  { id: 'tafsir_completed', name: 'Tafsir', sub: 'Memahami Makna Ayat', desc: '1x per Halaman', icon: BookOpen },
  { id: 'menulis_completed', name: 'Menulis', sub: 'Tulis Ulang Tanpa Mushaf', desc: '1x per Halaman', icon: BookOpen }
]

const partnerOptions = [
  { id: 'pasangan_40', name: 'Pasangan (40x)' },
  { id: 'pasangan_40_wa', name: 'Pasangan via WA (40x)' },
  { id: 'tarteel_40', name: 'Tarteel (40x)' },
  { id: 'keluarga_40_suami', name: 'Keluarga: Suami (40x)' },
  { id: 'keluarga_40_ayah', name: 'Keluarga: Ayah (40x)' },
  { id: 'keluarga_40_ibu', name: 'Keluarga: Ibu (40x)' },
  { id: 'keluarga_40_kakak', name: 'Keluarga: Kakak (40x)' },
  { id: 'keluarga_40_adik', name: 'Keluarga: Adik (40x)' },
  { id: 'pasangan_20', name: 'Pasangan (20x)' },
  { id: 'pasangan_20_wa', name: 'Pasangan via WA (20x)' },
  { id: 'voice_note_20', name: 'Voice Note (20x)' }
]

export function JurnalEntryForm({
  blockCode,
  initialData,
  isSubmitting,
  onSubmit,
  onCancel
}: JurnalEntryFormProps) {
  // Always start with a fresh form - "Conscious Click" logic
  const [formData, setFormData] = useState({
    ...initialData,
    blok: blockCode,
    rabth_completed: false,
    murajaah_completed: false,
    simak_murattal_completed: false,
    tikrar_bi_an_nadzar_completed: false,
    tasmi_record_completed: false,
    simak_record_completed: false,
    tikrar_bi_al_ghaib_completed: false,
    tikrar_bi_al_ghaib_type: null,
    tikrar_bi_al_ghaib_20x_multi: [],
    tarteel_screenshot_url: null,
    tafsir_completed: false,
    menulis_completed: false,
    catatan_tambahan: ''
  })

  const [showGhaibMenu, setShowGhaibMenu] = useState(false)
  const [ghaibCategory, setGhaibCategory] = useState<'partner' | 'tarteel' | 'keluarga' | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const toggleActivity = (id: string) => {
    if (id === 'tikrar_bi_al_ghaib_completed') {
      const isClosing = showGhaibMenu;
      setShowGhaibMenu(!showGhaibMenu)
      if (isClosing) setGhaibCategory(null) // Reset on close
      return
    }
    setFormData((prev: any) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleGhaibSelection = (optionId: string) => {
    setFormData((prev: any) => {
      // Logic for "20x VC + 20x VN"
      if (optionId === '20x_multimodal') {
         const isSelected = prev.tikrar_bi_al_ghaib_20x_multi.length === 2
         return {
           ...prev,
           tikrar_bi_al_ghaib_completed: !isSelected,
           tikrar_bi_al_ghaib_type: isSelected ? null : 'pasangan_20',
           tikrar_bi_al_ghaib_20x_multi: isSelected ? [] : ['pasangan_20', 'voice_note_20']
         }
      } 
      
      // Standard 40x selection
      const isSelected = prev.tikrar_bi_al_ghaib_type === optionId
      return {
        ...prev,
        tikrar_bi_al_ghaib_completed: !isSelected,
        tikrar_bi_al_ghaib_type: isSelected ? null : optionId,
        tikrar_bi_al_ghaib_20x_multi: []
      }
    })
  }

  const handleTarteelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      
      const result = await uploadJurnalScreenshot(uploadData)
      if (result.success && result.data) {
        setFormData((prev: any) => ({
          ...prev,
          tarteel_screenshot_url: result.data.url
        }))
        toast.success('Screenshot berhasil diunggah')
      } else {
        toast.error(result.error || 'Gagal mengunggah screenshot')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengunggah')
    } finally {
      setIsUploading(false)
    }
  }

  const completedCount = activityOptions.filter(opt => (formData as any)[opt.id]).length

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation for Tarteel
    if (formData.tikrar_bi_al_ghaib_type === 'tarteel_40' && !formData.tarteel_screenshot_url) {
      toast.error('Ukhti wajib mengunggah screenshot aplikasi Tarteel sebagai bukti.')
      return
    }

    onSubmit(formData)
  }

  const selectedDateLabel = new Date(formData.tanggal_setor).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <div className="space-y-4 animate-fadeInUp pb-12">
      {/* Informative Header - Date & Block */}
      <Card className="glass-premium border-none shadow-md overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-green-900 to-green-800 p-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-200" />
             </div>
             <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-100 flex items-center gap-1.5">
                  <input 
                    type="date"
                    value={formData.tanggal_setor}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, tanggal_setor: e.target.value }))}
                    className="bg-transparent border-none p-0 text-green-50 text-[11px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer [color-scheme:dark] h-4"
                  />
                </p>
                <p className="text-[8px] text-green-200/60 font-medium uppercase tracking-tight">Klik tanggal untuk ubah</p>
             </div>
          </div>
          <div className="px-3 py-1 bg-amber-500/20 backdrop-blur-sm rounded-xl border border-amber-500/30">
            <span className="text-[11px] font-black uppercase text-amber-100 tracking-tighter">{formData.blok}</span>
          </div>
        </div>
      </Card>

      <form onSubmit={handlePreSubmit} className="space-y-4">
        {/* Activity Section */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-green-800/80 pl-1">
            Tahapan Kurikulum ({completedCount}/{activityOptions.length})
          </label>
          
          <div className="space-y-2">
            {activityOptions.map(opt => {
              const isSelected = (formData as any)[opt.id]
              const isGhaib = opt.id === 'tikrar_bi_al_ghaib_completed'
              
              return (
                <div key={opt.id} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleActivity(opt.id)}
                    className={cn(
                      "w-full p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between relative overflow-hidden group",
                      isSelected
                        ? "bg-white border-green-500 shadow-emerald-600/5 ring-1 ring-green-500 ring-offset-0"
                        : "bg-white border-green-50 text-gray-700 hover:border-green-200 shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                        isSelected ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-green-50 group-hover:text-green-600"
                      )}>
                        <opt.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className={cn("text-xs font-black uppercase tracking-tight", isSelected ? "text-green-900" : "text-gray-900")}>
                          {opt.name}
                        </div>
                        <div className="text-[9px] font-bold text-gray-500 tracking-tighter leading-none mt-0.5">
                          {opt.sub}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pr-1">
                       <span className={cn(
                         "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm",
                         isSelected ? "bg-amber-500 border-amber-400 text-white" : "bg-gray-50 border-gray-100 text-gray-400"
                       )}>
                         {opt.desc}
                       </span>
                       <div className={cn(
                         "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                         isSelected ? "border-green-600 bg-green-600 text-white" : "border-gray-100 bg-white"
                       )}>
                         {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                       </div>
                    </div>
                  </button>

                  {/* Complex Options for Tikrar Bi Al Ghaib - REVISED CATEGORIES */}
                  {isGhaib && showGhaibMenu && (
                    <Card className="p-4 bg-green-50/50 border-green-100 border-2 rounded-2xl animate-fadeInDown space-y-4">
                       <div className="flex flex-col items-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-green-800 mb-3">Pilih Metode Setoran (Wajib 40x)</p>
                          <div className="flex flex-row gap-1 w-full bg-green-900/5 p-1 rounded-2xl border border-green-900/10">
                             {[
                               { id: 'partner', label: 'Partner', icon: User },
                               { id: 'tarteel', label: 'Tarteel', icon: Sparkles },
                               { id: 'keluarga', label: 'Keluarga', icon: Headphones }
                             ].map(cat => (
                               <button
                                 key={cat.id}
                                 type="button"
                                 onClick={() => {
                                   if (cat.id === 'tarteel') {
                                     handleGhaibSelection('tarteel_40')
                                     setShowGhaibMenu(false)
                                     setGhaibCategory(null)
                                   } else {
                                     setGhaibCategory(cat.id as any)
                                   }
                                 }}
                                 className={cn(
                                   "flex-1 py-1.5 px-0.5 rounded-xl border transition-all flex flex-col items-center gap-0.5",
                                   ghaibCategory === cat.id || (cat.id === 'tarteel' && !ghaibCategory && formData.tikrar_bi_al_ghaib_type === 'tarteel_40')
                                     ? "bg-green-600 text-white border-green-500 shadow-sm" 
                                     : "bg-transparent text-green-900/60 border-transparent hover:bg-green-600/5"
                                 )}
                               >
                                 <cat.icon className={cn("w-3 h-3", (ghaibCategory === cat.id || (cat.id === 'tarteel' && !ghaibCategory && formData.tikrar_bi_al_ghaib_type === 'tarteel_40')) ? "text-white" : "text-green-800/40")} />
                                 <span className="text-[7px] font-black uppercase tracking-tight">{cat.label}</span>
                               </button>
                             ))}
                          </div>
                       </div>

                       {ghaibCategory && (
                         <div className="animate-fadeInScale border-t border-green-100 pt-3">
                           <p className="text-[9px] font-black uppercase tracking-widest text-green-800 mb-2 text-center">Pilih Opsi {ghaibCategory}</p>
                           <div className="flex flex-row gap-2">
                              {ghaibCategory === 'partner' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleGhaibSelection('pasangan_40_wa')}
                                    className={cn("flex-1 p-2.5 rounded-xl border text-[8px] font-black uppercase tracking-tighter transition-all", 
                                      formData.tikrar_bi_al_ghaib_type === 'pasangan_40_wa' ? "bg-green-600 text-white" : "bg-white text-green-900 border-green-100")}
                                  >
                                    40x Voice Call
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleGhaibSelection('20x_multimodal')}
                                    className={cn("flex-1 p-2.5 rounded-xl border text-[8px] font-black uppercase tracking-tighter transition-all", 
                                      formData.tikrar_bi_al_ghaib_20x_multi.length === 2 ? "bg-green-600 text-white" : "bg-white text-green-900 border-green-100")}
                                  >
                                    20x VC + 20x VN
                                  </button>
                                </>
                              )}
                              {ghaibCategory === 'tarteel' && (
                                <div className="w-full space-y-3">
                                  <div className="bg-white p-4 rounded-2xl border border-dashed border-green-300 flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                                      <Upload className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[10px] font-black text-green-900 uppercase">Upload Bukti Tarteel</p>
                                      <p className="text-[8px] text-gray-500 font-medium mt-1">Upload hasil pengerjaan di aplikasi Tarteel</p>
                                    </div>
                                    
                                    {formData.tarteel_screenshot_url ? (
                                      <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full border border-green-200">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                        <span className="text-[9px] font-black text-green-800 uppercase">Sudah diunggah</span>
                                        <button 
                                          type="button"
                                          onClick={() => setFormData((prev: any) => ({ ...prev, tarteel_screenshot_url: null }))}
                                          className="p-1 hover:bg-green-200 rounded-full text-green-700"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="relative w-full">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={handleTarteelUpload}
                                          className="absolute inset-0 opacity-0 cursor-pointer"
                                          disabled={isUploading}
                                        />
                                        <Button
                                          type="button"
                                          disabled={isUploading}
                                          className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[9px] font-black uppercase"
                                        >
                                          {isUploading ? (
                                            <Spinner className="w-3.5 h-3.5 animate-spin mr-2" />
                                          ) : (
                                            <Upload className="w-3.5 h-3.5 mr-2" />
                                          )}
                                          PILIH FILE GAMBAR
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      setShowGhaibMenu(false)
                                      setGhaibCategory(null)
                                    }}
                                    className="w-full h-10 bg-green-900 text-white rounded-xl text-[9px] font-black uppercase"
                                  >
                                    LANJUTKAN
                                  </Button>
                                </div>
                              )}
                              {ghaibCategory === 'keluarga' && (
                                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                                  {[
                                    { id: 'keluarga_40_suami', label: 'Suami' },
                                    { id: 'keluarga_40_ayah', label: 'Ayah' },
                                    { id: 'keluarga_40_ibu', label: 'Ibu' },
                                    { id: 'keluarga_40_kakak', label: 'Kakak' },
                                    { id: 'keluarga_40_adik', label: 'Adik' },
                                    { id: 'keluarga_40_anak', label: 'Anak' },
                                    { id: 'keluarga_40_teman', label: 'Teman' }
                                  ].map((fam, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleGhaibSelection(fam.id)}
                                      className={cn("px-4 py-2.5 rounded-2xl border text-[9px] font-black uppercase tracking-tight transition-all", 
                                        formData.tikrar_bi_al_ghaib_type === fam.id ? "bg-green-600 text-white border-green-500 shadow-md" : "bg-white text-green-900 border-green-100 hover:border-green-300")}
                                    >
                                      {fam.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                           </div>
                         </div>
                       )}
                    </Card>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes Card */}
        <Card className="glass-premium border-none shadow-md p-4 rounded-3xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
             <label className="text-[9px] font-black uppercase tracking-widest text-green-800/80 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Catatan Tambahan (Opsional)
             </label>
             <textarea
               value={formData.catatan_tambahan}
               onChange={(e) => setFormData((prev: any) => ({ ...prev, catatan_tambahan: e.target.value }))}
               placeholder="Tambahkan evaluasi mandiri Ukhti di sini..."
               className="w-full bg-gray-50/50 border-none rounded-2xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-green-500 transition-all placeholder:text-gray-400 h-24 shadow-inner resize-none"
             />
          </div>
          <div className="absolute -right-8 -bottom-8 w-24 h-24 text-green-900/5 rotate-12">
             <MessageSquare className="w-full h-full" />
          </div>
        </Card>

        {/* Submit Section */}
        <div className="flex flex-col gap-2 pt-4">
           <Button
             type="submit"
             disabled={isSubmitting || completedCount === 0}
             className={cn(
               "w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all relative overflow-hidden",
               !isSubmitting && completedCount > 0
                 ? "bg-gradient-to-r from-green-700 to-emerald-700 text-white hover:scale-[1.01] active:scale-95 shadow-green-500/20"
                 : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
             )}
           >
              <div className="flex items-center gap-2">
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                 {isSubmitting ? 'SEDANG MENULIS...' : 'SIMPAN JURNAL HARIAN'}
              </div>
           </Button>
           <Button
             type="button"
             onClick={onCancel}
             variant="ghost"
             className="h-10 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900"
           >
             BATAL & KEMBALI
           </Button>
        </div>
      </form>
    </div>
  )
}

function Loader2(props: any) {
  return <Sparkles className={cn("animate-spin", props.className)} />
}
