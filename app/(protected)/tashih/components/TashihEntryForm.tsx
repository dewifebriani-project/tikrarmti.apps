'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, MapPin, School, AlertCircle, ChevronDown, Calendar, Minus, Plus, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MuallimahOption {
  id: string
  full_name: string
}

interface TashihEntryFormProps {
  initialData: {
    blok: string[]
    lokasi: 'mti' | 'luar'
    lokasiDetail: string
    ustadzahId: string | null
    ustadzahName: string | null
    jumlahKesalahanTajwid: number
    masalahTajwid: string[]
    catatanTambahan: string
    tanggalTashih: string
  }
  availableMuallimah: MuallimahOption[]
  isLoadingMuallimah: boolean
  isSubmitting: boolean
  onSubmit: (data: any) => void
  onCancel: () => void
}

const masalahTajwidOptions = [
  { id: 'mad', name: 'Mad' },
  { id: 'qolqolah', name: 'Qolqolah' },
  { id: 'ghunnah', name: 'Ghunnah' },
  { id: 'ikhfa', name: 'Ikhfa' },
  { id: 'idghom', name: 'Idghom' },
  { id: 'izhar', name: 'Izhar' },
  { id: 'waqaf', name: 'Waqaf' },
  { id: 'makhroj', name: 'Makhroj' },
  { id: 'sifat', name: 'Sifat' },
  { id: 'lainnya', name: 'Lainnya' }
]

export function TashihEntryForm({
  initialData,
  availableMuallimah,
  isLoadingMuallimah,
  isSubmitting,
  onSubmit,
  onCancel
}: TashihEntryFormProps) {
  const [formData, setFormData] = useState(initialData)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const toggleMasalahTajwid = (id: string) => {
    setFormData(prev => ({
      ...prev,
      masalahTajwid: prev.masalahTajwid.includes(id)
        ? prev.masalahTajwid.filter(m => m !== id)
        : [...prev.masalahTajwid, id]
    }))
  }

  const isValid = !!(
    formData.blok.length > 0 &&
    formData.lokasi &&
    formData.tanggalTashih &&
    (formData.lokasi === 'luar' ? formData.lokasiDetail : !!formData.ustadzahId)
  )

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Date & Block Info Card - Compact */}
      <Card className="glass-premium border-none shadow-md overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-green-900 to-green-800 p-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-200" />
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-green-200/60 tracking-wider">
                {new Date(formData.tanggalTashih).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          <div className="px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <span className="text-[10px] font-black uppercase tracking-tight">{formData.blok.join(', ')}</span>
          </div>
        </div>
      </Card>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
        {/* Location Selection - ZERO BLUE (Using Amber/Gold for Luar) */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-green-800/80 pl-1">Pilih Lokasi</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, lokasi: 'mti', lokasiDetail: '' }))}
              className={cn(
                "p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-1.5 relative overflow-hidden group shadow-md",
                formData.lokasi === 'mti'
                  ? "border-green-600 bg-green-600 text-white shadow-green-600/10"
                  : "border-transparent bg-white text-gray-900 hover:border-green-200"
              )}
            >
              <School className={cn("w-5 h-5", formData.lokasi === 'mti' ? "text-white" : "text-green-600")} />
              <span className="text-[10px] font-bold uppercase tracking-tight">Markaz (MTI)</span>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, lokasi: 'luar' }))}
              className={cn(
                "p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-1.5 relative overflow-hidden group shadow-md",
                formData.lokasi === 'luar'
                  ? "border-gold-500 bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-amber-500/10"
                  : "border-transparent bg-white text-gray-900 hover:border-amber-200"
              )}
            >
              <MapPin className={cn("w-5 h-5", formData.lokasi === 'luar' ? "text-white" : "text-amber-500")} />
              <span className="text-[10px] font-bold uppercase tracking-tight">Luar MTI</span>
            </button>
          </div>
        </div>

        {/* Location Detail or Teacher Selection - ZERO BLUE */}
        <Card className="glass-premium border-none shadow-md p-4 rounded-3xl relative z-[100]">
          {formData.lokasi === 'luar' ? (
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-green-800/80 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Nama Lokasi Luar
              </label>
              <input
                type="text"
                value={formData.lokasiDetail}
                onChange={(e) => setFormData(prev => ({ ...prev, lokasiDetail: e.target.value }))}
                placeholder="Masjid, Rumah, dll."
                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-gray-400 shadow-inner"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-green-800/80 flex items-center gap-2">
                <School className="w-3 h-3" /> Ustadzah Pemeriksa
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold text-gray-900 text-left flex items-center justify-between shadow-inner transition-all hover:bg-gray-100"
                >
                  <span className={formData.ustadzahId ? "text-gray-900" : "text-gray-400"}>
                    {formData.ustadzahName || 'Pilih Ustadzah...'}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isDropdownOpen && "rotate-180")} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeInScale">
                    <div className="max-h-52 overflow-y-auto p-1.5 scrollbar-hide">
                      {availableMuallimah.length > 0 ? (
                        availableMuallimah.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, ustadzahId: m.id, ustadzahName: m.full_name }));
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left p-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all mb-1",
                              formData.ustadzahId === m.id ? "bg-green-600 text-white shadow-md shadow-green-600/10" : "hover:bg-green-50 text-gray-700"
                            )}
                          >
                            {m.full_name}
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-[9px] font-bold text-gray-400 uppercase">Memuat...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Counter Section - Condensed */}
        <Card className="glass-premium border-none shadow-md p-4 rounded-3xl overflow-hidden relative z-0">
          <div className="relative z-10 flex flex-col items-center">
            <label className="text-[9px] font-black uppercase tracking-widest text-green-800/80 mb-2">Total Kesalahan Tajwid</label>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, jumlahKesalahanTajwid: Math.max(0, prev.jumlahKesalahanTajwid - 1) }))}
                className="w-10 h-10 rounded-xl bg-white border-2 border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-red-500 transition-all active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="text-5xl font-black text-gray-900 tabular-nums tracking-tighter">
                {formData.jumlahKesalahanTajwid}
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, jumlahKesalahanTajwid: prev.jumlahKesalahanTajwid + 1 }))}
                className="w-10 h-10 rounded-xl bg-white border-2 border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-green-600 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-3 opacity-[0.05]">
             <AlertCircle className="w-16 h-16 text-green-900" />
          </div>
        </Card>

        {/* Tajwid Specific Blocks - Compact Chips */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-green-800/80 pl-1">Detail Masalah</label>
          <div className="flex flex-wrap gap-1.5">
            {masalahTajwidOptions.map(opt => {
              const isSelected = formData.masalahTajwid.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleMasalahTajwid(opt.id)}
                  className={cn(
                    "px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all duration-300 border-2",
                    isSelected
                      ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-600/10 scale-105"
                      : "bg-white border-gray-200 text-gray-600 hover:border-red-100"
                  )}
                >
                  {opt.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes - Compact */}
        <Card className="glass-premium border-none shadow-md p-3 rounded-2xl">
          <textarea
            value={formData.catatanTambahan}
            onChange={(e) => setFormData(prev => ({ ...prev, catatanTambahan: e.target.value }))}
            placeholder="Catatan tambahan (opsional)..."
            className="w-full bg-transparent border-none rounded-xl p-1 text-[11px] font-bold text-gray-900 focus:ring-0 transition-all placeholder:text-gray-400 h-16 resize-none"
          />
        </Card>

        {/* Submit Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={cn(
              "w-full h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all",
              isValid && !isSubmitting
                ? "bg-gradient-to-r from-green-700 to-emerald-700 text-white hover:from-green-800 hover:to-emerald-800 shadow-green-500/10"
                : "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none"
            )}
          >
            {isSubmitting ? 'Simpan...' : 'Simpan Tashih'}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            className="h-10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900"
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  )
}
