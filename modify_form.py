import re

with open('app/(protected)/jurnal-harian/components/JurnalEntryForm.tsx', 'r') as f:
    content = f.read()

# 1. Update activityOptions
content = re.sub(
    r"const activityOptions = \[.*?\]",
    """const activityOptions = [
  { id: 'rabth_completed', name: 'Rabth', sub: 'Menyambung (+10 Blok Terakhir)', desc: '1x per Hari', icon: BookOpen },
  { id: 'murajaah_completed', name: 'Murajaah', sub: 'Ulang Blok Kemarin', desc: '5x per Hari', icon: Headphones },
  { id: 'simak_murattal_completed', name: 'Simak Murattal', sub: 'Mendengar Qori', desc: '5x per Hari', icon: Headphones },
  { id: 'tikrar_bi_an_nadzar_completed', name: 'Tikrar Bi An Nadzar', sub: 'Baca Melihat Mushaf', desc: '40x per Blok', icon: Sparkles },
  { id: 'tasmi_record_completed', name: 'Tasmi Record', sub: 'Rekam Tanpa Mushaf', desc: '3x Rekaman Lancar', icon: Mic },
  { id: 'simak_record_completed', name: 'Simak Record', sub: 'Dengar Rekaman Sendiri', desc: '1x per Blok', icon: Headphones },
  { id: 'tikrar_bi_al_ghaib_completed', name: 'Tikrar Bi Al Ghaib', sub: 'Baca Tanpa Mushaf', desc: '40x per Blok', icon: Star }
]""",
    content,
    flags=re.DOTALL
)

# 2. Update formData state
content = re.sub(
    r"tafsir_completed: false,\s*menulis_completed: false,",
    "rabth_methods: initialData.rabth_methods || [],\n    tafsir_options: initialData.tafsir_options || [],",
    content
)

# 3. Add showRabthMenu state and update ghaibCategory
content = content.replace(
    "const [showGhaibMenu, setShowGhaibMenu] = useState(false)\n  const [ghaibCategory, setGhaibCategory] = useState<'partner' | 'tarteel' | 'keluarga' | null>(null)",
    "const [showRabthMenu, setShowRabthMenu] = useState(false)\n  const [showGhaibMenu, setShowGhaibMenu] = useState(false)\n  const [ghaibCategory, setGhaibCategory] = useState<'partner' | 'tarteel' | 'keluarga' | 'teman' | null>(null)"
)

# 4. Update toggleActivity
content = content.replace(
    """  const toggleActivity = (id: string) => {
    if (id === 'tikrar_bi_al_ghaib_completed') {
      const isClosing = showGhaibMenu;
      setShowGhaibMenu(!showGhaibMenu)
      if (isClosing) setGhaibCategory(null)
      return
    }
    setFormData((prev: any) => ({ ...prev, [id]: !prev[id] }))
  }""",
    """  const toggleActivity = (id: string) => {
    if (id === 'tikrar_bi_al_ghaib_completed') {
      const isClosing = showGhaibMenu;
      setShowGhaibMenu(!showGhaibMenu)
      if (isClosing) setGhaibCategory(null)
      return
    }
    if (id === 'rabth_completed') {
      setShowRabthMenu(!showRabthMenu)
    }
    setFormData((prev: any) => ({ ...prev, [id]: !prev[id] }))
  }"""
)

# 5. Add 'teman' category and rabth options
new_ghaib_categories = """                             <div className="flex flex-row gap-1 w-full bg-green-900/5 p-1 rounded-2xl border border-green-900/10">
                               {[
                                 { id: 'partner', label: 'Partner', icon: User },
                                 { id: 'tarteel', label: 'Tarteel', icon: Sparkles },
                                 { id: 'keluarga', label: 'Keluarga', icon: Headphones },
                                 { id: 'teman', label: 'Teman', icon: User }
                               ].map(cat => ("""
content = content.replace("""                             <div className="flex flex-row gap-1 w-full bg-green-900/5 p-1 rounded-2xl border border-green-900/10">
                               {[
                                 { id: 'partner', label: 'Partner', icon: User },
                                 { id: 'tarteel', label: 'Tarteel', icon: Sparkles },
                                 { id: 'keluarga', label: 'Keluarga', icon: Headphones }
                               ].map(cat => (""", new_ghaib_categories)

# Add teman block to ghaibCategory
teman_block = """                                {ghaibCategory === 'teman' && (
                                  <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                                    {[
                                      { id: 'teman_mti_40', label: 'Thalibah MTI' },
                                      { id: 'teman_luar_mti_40', label: 'Di Luar MTI' }
                                    ].map((fam, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => { handleGhaibSelection(fam.id); setShowGhaibMenu(false); setGhaibCategory(null); }}
                                        className={cn("px-4 py-2.5 rounded-2xl border text-[9px] font-black uppercase tracking-tight transition-all", 
                                          formData.tikrar_bi_al_ghaib_type === fam.id ? "bg-green-600 text-white border-green-500 shadow-md" : "bg-white text-green-900 border-green-100 hover:border-green-300")}
                                      >
                                        {fam.label}
                                      </button>
                                    ))}
                                  </div>
                                )}"""

content = content.replace("                              </div>\n                           </div>\n                         )}",
teman_block + "\n                              </div>\n                           </div>\n                         )}")


# Add rabth block
rabth_block = """                    {opt.id === 'rabth_completed' && showRabthMenu && isSelected && (
                      <Card className="p-4 bg-green-50/50 border-green-100 border-2 rounded-2xl animate-fadeInDown space-y-4">
                         <div className="flex flex-col items-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-green-800 mb-3">Metode Rabth (Opsional)</p>
                            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                              {[
                                { id: 'pasangan', label: 'Setor Pasangan' },
                                { id: 'tarteel', label: 'Setor Tarteel' },
                                { id: 'solat', label: 'Setor Solat' }
                              ].map(r => {
                                const checked = formData.rabth_methods.includes(r.id);
                                return (
                                  <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev: any) => ({
                                        ...prev,
                                        rabth_methods: checked 
                                          ? prev.rabth_methods.filter((x:string) => x !== r.id) 
                                          : [...prev.rabth_methods, r.id]
                                      }))
                                    }}
                                    className={cn("px-4 py-2.5 rounded-2xl border text-[9px] font-black uppercase tracking-tight transition-all flex items-center gap-2", 
                                      checked ? "bg-green-600 text-white border-green-500 shadow-md" : "bg-white text-green-900 border-green-100 hover:border-green-300")}
                                  >
                                    <div className={cn("w-3 h-3 rounded border flex items-center justify-center", checked ? "border-white bg-green-500" : "border-green-300")}>
                                      {checked && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    {r.label}
                                  </button>
                                )
                              })}
                            </div>
                         </div>
                      </Card>
                    )}"""

# Insert rabth_block right after the toggle button for each item
content = content.replace("                    {isGhaib && showGhaibMenu && (", rabth_block + "\n\n                    {isGhaib && showGhaibMenu && (")


# 6. Add Tafsir options before Catatan Tambahan
tafsir_options_block = """        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-green-800/80 pl-1">
            Kegiatan Opsional
          </label>
          <div className="space-y-2">
            {[
              { id: 'baca_tafsir', label: 'Baca Tafsir', icon: BookOpen },
              { id: 'tulis_ayat', label: 'Tulis Ayat', icon: BookOpen },
              { id: 'audio_tafsir', label: 'Menyimak Video/Audio Tafsir', icon: Headphones },
              { id: 'baca_terjemahan', label: 'Baca Terjemahan', icon: BookOpen },
              { id: 'baca_terjemahan_perkata', label: 'Baca Terjemahan + Perkata', icon: BookOpen },
            ].map(opt => {
              const isChecked = formData.tafsir_options.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setFormData((prev: any) => ({
                      ...prev,
                      tafsir_options: isChecked 
                        ? prev.tafsir_options.filter((x:string) => x !== opt.id) 
                        : [...prev.tafsir_options, opt.id]
                    }))
                  }}
                  className={cn(
                    "w-full p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between relative overflow-hidden group",
                    isChecked ? "bg-white border-green-500 shadow-emerald-600/5 ring-1 ring-green-500 ring-offset-0" : "bg-white border-green-50 text-gray-700 hover:border-green-200 shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all", isChecked ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-green-50 group-hover:text-green-600")}>
                      <opt.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className={cn("text-xs font-black uppercase tracking-tight", isChecked ? "text-green-900" : "text-gray-900")}>{opt.label}</div>
                    </div>
                  </div>
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mr-1", isChecked ? "border-green-600 bg-green-600 text-white" : "border-gray-100 bg-white")}>
                    {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <Card className="glass-premium border-none shadow-md p-4 rounded-3xl relative overflow-hidden">"""

content = content.replace("        </div>\n\n        <Card className=\"glass-premium border-none shadow-md p-4 rounded-3xl relative overflow-hidden\">", tafsir_options_block)


with open('app/(protected)/jurnal-harian/components/JurnalEntryForm.tsx', 'w') as f:
    f.write(content)
