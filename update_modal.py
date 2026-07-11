import re

with open('/tmp/modals_backup.tsx', 'r') as f:
    lines = f.readlines()

header = "".join(lines[:399])

new_component = """export function MuallimahEditModal({
  isOpen,
  onClose,
  editData,
  batches,
  onRefresh
}: BaseModalProps & {
  editData: MuallimahV2Type | null;
  batches?: any[];
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'akad' | 'biodata' | 'latar_belakang'>('akad');

  // Akad States
  const [status, setStatus] = useState('pending');
  const [batchId, setBatchId] = useState('');
  const [classTikrar, setClassTikrar] = useState(false);
  const [classPratikrar, setClassPratikrar] = useState(false);
  const [classPaid, setClassPaid] = useState(false);
  const [paidClassScheme, setPaidClassScheme] = useState('none');
  const [preferredJuz, setPreferredJuz] = useState<string[]>([]);
  const [preferredMaxThalibah, setPreferredMaxThalibah] = useState(10);

  // Biodata States
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [timezone, setTimezone] = useState('');
  const [healthCondition, setHealthCondition] = useState('');

  // Latar Belakang States
  const [memorizationLevel, setMemorizationLevel] = useState('');
  const [memorizedJuz, setMemorizedJuz] = useState('');
  const [teachingExperience, setTeachingExperience] = useState('');
  const [teachingYears, setTeachingYears] = useState('');
  const [teachingInstitutions, setTeachingInstitutions] = useState('');
  const [motivation, setMotivation] = useState('');
  const [specialSkills, setSpecialSkills] = useState('');
  const [tajweedInstitution, setTajweedInstitution] = useState('');
  const [quranInstitution, setQuranInstitution] = useState('');
  const [teachingCommunities, setTeachingCommunities] = useState('');
  const [memorizedTajweedMatan, setMemorizedTajweedMatan] = useState('');
  const [studiedMatanExegesis, setStudiedMatanExegesis] = useState('');
  const [examinedJuz, setExaminedJuz] = useState('');
  const [certifiedJuz, setCertifiedJuz] = useState('');

  // Schedule States
  const [scheduleTikrarDay, setScheduleTikrarDay] = useState('');
  const [scheduleTikrarTimeStart, setScheduleTikrarTimeStart] = useState('');
  const [scheduleTikrarTimeEnd, setScheduleTikrarTimeEnd] = useState('');
  const [scheduleTikrarDay2, setScheduleTikrarDay2] = useState('');
  const [scheduleTikrarTimeStart2, setScheduleTikrarTimeStart2] = useState('');
  const [scheduleTikrarTimeEnd2, setScheduleTikrarTimeEnd2] = useState('');

  const [schedulePratikrarDay, setSchedulePratikrarDay] = useState('');
  const [schedulePratikrarTimeStart, setSchedulePratikrarTimeStart] = useState('');
  const [schedulePratikrarTimeEnd, setSchedulePratikrarTimeEnd] = useState('');
  const [schedulePratikrarDay2, setSchedulePratikrarDay2] = useState('');
  const [schedulePratikrarTimeStart2, setSchedulePratikrarTimeStart2] = useState('');
  const [schedulePratikrarTimeEnd2, setSchedulePratikrarTimeEnd2] = useState('');

  const [schedulePaidDay, setSchedulePaidDay] = useState('');
  const [schedulePaidTimeStart, setSchedulePaidTimeStart] = useState('');
  const [schedulePaidTimeEnd, setSchedulePaidTimeEnd] = useState('');
  const [schedulePaidDay2, setSchedulePaidDay2] = useState('');
  const [schedulePaidTimeStart2, setSchedulePaidTimeStart2] = useState('');
  const [schedulePaidTimeEnd2, setSchedulePaidTimeEnd2] = useState('');

  useEffect(() => {
    if (!editData) return;

    // Load Akad data
    setStatus(editData.status || 'pending');
    setBatchId(editData.batch_id || '');
    
    const rawTypes = (editData.class_type || '').split(',').map(t => t.trim().toLowerCase());
    setClassTikrar(rawTypes.includes('tikrar_tahfidz'));
    setClassPratikrar(rawTypes.includes('pra_tahfidz'));
    
    const hasPaid = editData.paid_class_scheme && editData.paid_class_scheme !== 'none';
    setClassPaid(!!hasPaid);
    setPaidClassScheme(editData.paid_class_scheme || 'none');
    
    const juzArray = editData.preferred_juz 
      ? editData.preferred_juz.split(',').map(j => j.trim()) 
      : [];
    setPreferredJuz(juzArray);
    setPreferredMaxThalibah(editData.preferred_max_thalibah || 10);

    // Load Biodata & Background
    setFullName(editData.full_name || editData.user?.full_name || '');
    setWhatsapp(editData.whatsapp || editData.user?.whatsapp || '');
    setEmail(editData.email || editData.user?.email || '');
    setBirthPlace(editData.birth_place || '');
    setBirthDate(editData.birth_date ? new Date(editData.birth_date).toISOString().split('T')[0] : '');
    setAddress(editData.address || '');
    setEducation(editData.education || '');
    setOccupation(editData.occupation || '');
    setTimezone(editData.timezone || '');
    setHealthCondition(editData.health_condition || '');

    setMemorizationLevel(editData.memorization_level || '');
    setMemorizedJuz(editData.memorized_juz || '');
    setTeachingExperience(editData.teaching_experience || '');
    setTeachingYears(editData.teaching_years || '');
    setTeachingInstitutions(editData.teaching_institutions || '');
    setMotivation(editData.motivation || '');
    setSpecialSkills(editData.special_skills || '');
    setTajweedInstitution(editData.tajweed_institution || '');
    setQuranInstitution(editData.quran_institution || '');
    setTeachingCommunities(editData.teaching_communities || '');
    setMemorizedTajweedMatan(editData.memorized_tajweed_matan || '');
    setStudiedMatanExegesis(editData.studied_matan_exegesis || '');
    setExaminedJuz(editData.examined_juz || '');
    setCertifiedJuz(editData.certified_juz || '');

    // Parse schedules
    let preferredObj: any = null;
    if (editData.preferred_schedule) {
      try {
        preferredObj = typeof editData.preferred_schedule === 'string'
          ? JSON.parse(editData.preferred_schedule)
          : editData.preferred_schedule;
      } catch (e) {}
    }

    let backupObj: any = null;
    if (editData.backup_schedule) {
      try {
        backupObj = typeof editData.backup_schedule === 'string'
          ? JSON.parse(editData.backup_schedule)
          : editData.backup_schedule;
      } catch (e) {}
    }

    // Reset Schedules
    setScheduleTikrarDay(''); setScheduleTikrarTimeStart(''); setScheduleTikrarTimeEnd('');
    setScheduleTikrarDay2(''); setScheduleTikrarTimeStart2(''); setScheduleTikrarTimeEnd2('');
    setSchedulePratikrarDay(''); setSchedulePratikrarTimeStart(''); setSchedulePratikrarTimeEnd('');
    setSchedulePratikrarDay2(''); setSchedulePratikrarTimeStart2(''); setSchedulePratikrarTimeEnd2('');
    setSchedulePaidDay(''); setSchedulePaidTimeStart(''); setSchedulePaidTimeEnd('');
    setSchedulePaidDay2(''); setSchedulePaidTimeStart2(''); setSchedulePaidTimeEnd2('');

    if (preferredObj) {
      if (preferredObj.tikrar) {
        setScheduleTikrarDay(preferredObj.tikrar.day || '');
        setScheduleTikrarTimeStart(preferredObj.tikrar.time_start || '');
        setScheduleTikrarTimeEnd(preferredObj.tikrar.time_end || '');
      }
      if (preferredObj.pra_tahfidz) {
        setSchedulePratikrarDay(preferredObj.pra_tahfidz.day || '');
        setSchedulePratikrarTimeStart(preferredObj.pra_tahfidz.time_start || '');
        setSchedulePratikrarTimeEnd(preferredObj.pra_tahfidz.time_end || '');
      }
      if (preferredObj.berbayar) {
        setSchedulePaidDay(preferredObj.berbayar.day || '');
        setSchedulePaidTimeStart(preferredObj.berbayar.time_start || '');
        setSchedulePaidTimeEnd(preferredObj.berbayar.time_end || '');
      }
      if (preferredObj.day && !preferredObj.tikrar && !preferredObj.pra_tahfidz && !preferredObj.berbayar) {
        setScheduleTikrarDay(preferredObj.day || '');
        setScheduleTikrarTimeStart(preferredObj.time_start || '');
        setScheduleTikrarTimeEnd(preferredObj.time_end || '');
      }
    }

    if (backupObj) {
      if (backupObj.tikrar) {
        setScheduleTikrarDay2(backupObj.tikrar.day || '');
        setScheduleTikrarTimeStart2(backupObj.tikrar.time_start || '');
        setScheduleTikrarTimeEnd2(backupObj.tikrar.time_end || '');
      }
      if (backupObj.pra_tahfidz) {
        setSchedulePratikrarDay2(backupObj.pra_tahfidz.day || '');
        setSchedulePratikrarTimeStart2(backupObj.pra_tahfidz.time_start || '');
        setSchedulePratikrarTimeEnd2(backupObj.pra_tahfidz.time_end || '');
      }
      if (backupObj.berbayar) {
        setSchedulePaidDay2(backupObj.berbayar.day || '');
        setSchedulePaidTimeStart2(backupObj.berbayar.time_start || '');
        setSchedulePaidTimeEnd2(backupObj.berbayar.time_end || '');
      }
      if (backupObj.day && !backupObj.tikrar && !backupObj.pra_tahfidz && !backupObj.berbayar) {
        setScheduleTikrarDay2(backupObj.day || '');
        setScheduleTikrarTimeStart2(backupObj.time_start || '');
        setScheduleTikrarTimeEnd2(backupObj.time_end || '');
      }
    }
  }, [editData, isOpen]);

  if (!isOpen || !editData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const preferredScheduleObj: Record<string, any> = {};
      const backupScheduleObj: Record<string, any> = {};

      if (classTikrar) {
        preferredScheduleObj.tikrar = { day: scheduleTikrarDay, time_start: scheduleTikrarTimeStart, time_end: scheduleTikrarTimeEnd };
        if (scheduleTikrarDay2 && scheduleTikrarTimeStart2 && scheduleTikrarTimeEnd2) {
          backupScheduleObj.tikrar = { day: scheduleTikrarDay2, time_start: scheduleTikrarTimeStart2, time_end: scheduleTikrarTimeEnd2 };
        }
      }

      if (classPratikrar) {
        preferredScheduleObj.pra_tahfidz = { day: schedulePratikrarDay, time_start: schedulePratikrarTimeStart, time_end: schedulePratikrarTimeEnd };
        if (schedulePratikrarDay2 && schedulePratikrarTimeStart2 && schedulePratikrarTimeEnd2) {
          backupScheduleObj.pra_tahfidz = { day: schedulePratikrarDay2, time_start: schedulePratikrarTimeStart2, time_end: schedulePratikrarTimeEnd2 };
        }
      }

      if (classPaid) {
        preferredScheduleObj.berbayar = { day: schedulePaidDay, time_start: schedulePaidTimeStart, time_end: schedulePaidTimeEnd };
        if (schedulePaidDay2 && schedulePaidTimeStart2 && schedulePaidTimeEnd2) {
          backupScheduleObj.berbayar = { day: schedulePaidDay2, time_start: schedulePaidTimeStart2, time_end: schedulePaidTimeEnd2 };
        }
      }

      const classTypesSelected = [];
      if (classTikrar) classTypesSelected.push('tikrar_tahfidz');
      if (classPratikrar) classTypesSelected.push('pra_tahfidz');

      // Update Akads
      const akadPayload: any = {
        status,
        class_type: classTypesSelected.join(', ') || 'tikrar_tahfidz',
        paid_class_scheme: classPaid ? (paidClassScheme || 'none') : 'none',
        preferred_juz: preferredJuz.map(j => parseInt(j)).sort((a,b) => a-b).join(', '),
        preferred_max_thalibah: preferredMaxThalibah,
        preferred_schedule: JSON.stringify(preferredScheduleObj),
        backup_schedule: Object.keys(backupScheduleObj).length > 0 ? JSON.stringify(backupScheduleObj) : null,
      };
      if (batchId) akadPayload.batch_id = batchId;

      const { error: akadError } = await supabase
        .from('muallimah_akads')
        .update(akadPayload)
        .eq('id', editData.id);

      if (akadError) throw akadError;

      // Update Registrations (Profile)
      if (editData.profile_id) {
        const profilePayload = {
          full_name: fullName,
          whatsapp,
          email,
          birth_place: birthPlace,
          birth_date: birthDate || null,
          address,
          education,
          occupation,
          timezone,
          health_condition: healthCondition,
          memorization_level: memorizationLevel,
          memorized_juz: memorizedJuz,
          teaching_experience: teachingExperience,
          teaching_years: teachingYears,
          teaching_institutions: teachingInstitutions,
          motivation,
          special_skills: specialSkills,
          tajweed_institution: tajweedInstitution,
          quran_institution: quranInstitution,
          teaching_communities: teachingCommunities,
          memorized_tajweed_matan: memorizedTajweedMatan,
          studied_matan_exegesis: studiedMatanExegesis,
          examined_juz: examinedJuz,
          certified_juz: certifiedJuz
        };
        const { error: profileError } = await supabase
          .from('muallimah_registrations')
          .update(profilePayload)
          .eq('id', editData.profile_id);

        if (profileError) throw profileError;
      }

      // Update User if needed
      if (editData.user_id) {
        const { error: userError } = await supabase
          .from('users')
          .update({
            full_name: fullName,
            whatsapp,
          })
          .eq('id', editData.user_id);
          
        if (userError) console.error("Failed updating user:", userError);
      }

      toast.success('Data pendaftaran Mu\\'allimah berhasil diperbarui');
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error('Gagal memperbarui: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full h-10 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-gray-800";
  const textareaClass = "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-gray-800";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-black text-gray-900">Edit Data Mu'allimah</h3>
            <p className="text-sm text-gray-500 font-medium">Ustadzah: {editData.full_name || editData.user?.full_name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-white gap-6 shrink-0">
          <button 
            onClick={() => setActiveTab('akad')}
            className={cn("py-3 text-sm font-bold border-b-2 transition-all", activeTab === 'akad' ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-400 hover:text-gray-600")}
          >
            Akad & Jadwal
          </button>
          <button 
            onClick={() => setActiveTab('biodata')}
            className={cn("py-3 text-sm font-bold border-b-2 transition-all", activeTab === 'biodata' ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-400 hover:text-gray-600")}
          >
            Biodata Diri
          </button>
          <button 
            onClick={() => setActiveTab('latar_belakang')}
            className={cn("py-3 text-sm font-bold border-b-2 transition-all", activeTab === 'latar_belakang' ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-400 hover:text-gray-600")}
          >
            Latar Belakang & Al-Quran
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
          
          {/* TAB: AKAD & JADWAL */}
          {activeTab === 'akad' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-black uppercase tracking-wider text-gray-400 border-b pb-2 mb-4">Pengaturan Akad & Komitmen</h4>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Batch Program</Label>
                  <select value={batchId} onChange={e => setBatchId(e.target.value)} className={inputClass}>
                    <option value="">Pilih Batch</option>
                    {batches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status Akad</Label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Program Kelas yang Diampu</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center space-x-2 p-2 border rounded-xl hover:bg-emerald-50/10 cursor-pointer">
                      <input type="checkbox" id="edit-class-tikrar" checked={classTikrar} onChange={(e) => setClassTikrar(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer shrink-0 accent-green-600" />
                      <Label htmlFor="edit-class-tikrar" className="text-xs font-bold text-gray-700 cursor-pointer">Tikrar</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 border rounded-xl hover:bg-blue-50/10 cursor-pointer">
                      <input type="checkbox" id="edit-class-pratikrar" checked={classPratikrar} onChange={(e) => setClassPratikrar(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer shrink-0 accent-green-600" />
                      <Label htmlFor="edit-class-pratikrar" className="text-xs font-bold text-gray-700 cursor-pointer">Pra-Tikrar</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 border rounded-xl hover:bg-amber-50/10 cursor-pointer">
                      <input type="checkbox" id="edit-class-paid" checked={classPaid} onChange={(e) => setClassPaid(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer shrink-0 accent-green-600" />
                      <Label htmlFor="edit-class-paid" className="text-xs font-bold text-gray-700 cursor-pointer">Berbayar</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Skema Kelas Berbayar</Label>
                    <select value={paidClassScheme} onChange={e => setPaidClassScheme(e.target.value)} disabled={!classPaid} className={cn(inputClass, !classPaid && "opacity-50 bg-gray-50")}>
                      <option value="none">Tidak Ada</option>
                      <option value="8_pertemuan">8 Pertemuan</option>
                      <option value="16_pertemuan">16 Pertemuan</option>
                      <option value="20_pertemuan">20 Pertemuan</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Maksimum Thalibah</Label>
                    <input type="number" min={1} value={preferredMaxThalibah} onChange={e => setPreferredMaxThalibah(parseInt(e.target.value))} className={inputClass} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Pilihan Juz Mengajar</Label>
                  <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50/50 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {allJuzOptions.map(option => (
                        <label key={option.value} className={cn("flex items-center p-2 rounded-lg cursor-pointer transition-colors border", preferredJuz.includes(option.value) ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200 hover:bg-gray-50")}>
                          <input type="checkbox" checked={preferredJuz.includes(option.value)} onChange={(e) => {
                            if (e.target.checked) setPreferredJuz([...preferredJuz, option.value]);
                            else setPreferredJuz(preferredJuz.filter(j => j !== option.value));
                          }} className="sr-only" />
                          <span className={cn("text-xs font-bold mx-auto", preferredJuz.includes(option.value) ? "text-emerald-700" : "text-gray-600")}>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Jadwal */}
              <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-black uppercase tracking-wider text-gray-400 border-b pb-2 mb-4">Pengaturan Jadwal Mengajar</h4>
                
                {classTikrar && (
                  <div className="space-y-3 p-4 bg-emerald-50/30 rounded-xl border border-emerald-100">
                    <h5 className="font-bold text-emerald-800 text-sm">Jadwal Kelas Tikrar</h5>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={scheduleTikrarDay} onChange={e => setScheduleTikrarDay(e.target.value)} className={inputClass}>
                        <option value="">Hari...</option>{dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      <input type="time" value={scheduleTikrarTimeStart} onChange={e => setScheduleTikrarTimeStart(e.target.value)} className={inputClass} />
                      <input type="time" value={scheduleTikrarTimeEnd} onChange={e => setScheduleTikrarTimeEnd(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                )}

                {classPratikrar && (
                  <div className="space-y-3 p-4 bg-blue-50/30 rounded-xl border border-blue-100">
                    <h5 className="font-bold text-blue-800 text-sm">Jadwal Kelas Pra-Tikrar</h5>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={schedulePratikrarDay} onChange={e => setSchedulePratikrarDay(e.target.value)} className={inputClass}>
                        <option value="">Hari...</option>{dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      <input type="time" value={schedulePratikrarTimeStart} onChange={e => setSchedulePratikrarTimeStart(e.target.value)} className={inputClass} />
                      <input type="time" value={schedulePratikrarTimeEnd} onChange={e => setSchedulePratikrarTimeEnd(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                )}

                {classPaid && (
                  <div className="space-y-3 p-4 bg-amber-50/30 rounded-xl border border-amber-100">
                    <h5 className="font-bold text-amber-800 text-sm">Jadwal Kelas Berbayar</h5>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={schedulePaidDay} onChange={e => setSchedulePaidDay(e.target.value)} className={inputClass}>
                        <option value="">Hari...</option>{dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      <input type="time" value={schedulePaidTimeStart} onChange={e => setSchedulePaidTimeStart(e.target.value)} className={inputClass} />
                      <input type="time" value={schedulePaidTimeEnd} onChange={e => setSchedulePaidTimeEnd(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: BIODATA */}
          {activeTab === 'biodata' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</Label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</Label><input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Email</Label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Tempat Lahir</Label><input type="text" value={birthPlace} onChange={e => setBirthPlace(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Tanggal Lahir</Label><input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Pendidikan Terakhir</Label><input type="text" value={education} onChange={e => setEducation(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Pekerjaan</Label><input type="text" value={occupation} onChange={e => setOccupation(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Zona Waktu</Label><input type="text" value={timezone} onChange={e => setTimezone(e.target.value)} className={inputClass} /></div>
              <div className="col-span-1 md:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Alamat Lengkap</Label><textarea value={address} onChange={e => setAddress(e.target.value)} className={textareaClass} rows={2} /></div>
              <div className="col-span-1 md:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Kondisi Kesehatan Khusus</Label><textarea value={healthCondition} onChange={e => setHealthCondition(e.target.value)} className={textareaClass} rows={2} /></div>
            </div>
          )}

          {/* TAB: LATAR BELAKANG */}
          {activeTab === 'latar_belakang' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Level Hafalan</Label><input type="text" value={memorizationLevel} onChange={e => setMemorizationLevel(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Juz yang Dihafal</Label><input type="text" value={memorizedJuz} onChange={e => setMemorizedJuz(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Juz yang Diujikan</Label><input type="text" value={examinedJuz} onChange={e => setExaminedJuz(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Juz Bersertifikat</Label><input type="text" value={certifiedJuz} onChange={e => setCertifiedJuz(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Pengalaman Mengajar</Label><input type="text" value={teachingExperience} onChange={e => setTeachingExperience(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Lama Mengajar</Label><input type="text" value={teachingYears} onChange={e => setTeachingYears(e.target.value)} className={inputClass} /></div>
              <div className="col-span-1 md:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Institusi Tempat Mengajar</Label><input type="text" value={teachingInstitutions} onChange={e => setTeachingInstitutions(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Lembaga Tahsin/Tajwid</Label><input type="text" value={tajweedInstitution} onChange={e => setTajweedInstitution(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Lembaga Al-Quran</Label><input type="text" value={quranInstitution} onChange={e => setQuranInstitution(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Komunitas Mengajar</Label><input type="text" value={teachingCommunities} onChange={e => setTeachingCommunities(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Matan Tajwid yang Dihafal</Label><input type="text" value={memorizedTajweedMatan} onChange={e => setMemorizedTajweedMatan(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Tafsir Matan yang Dipelajari</Label><input type="text" value={studiedMatanExegesis} onChange={e => setStudiedMatanExegesis(e.target.value)} className={inputClass} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Keahlian Khusus</Label><input type="text" value={specialSkills} onChange={e => setSpecialSkills(e.target.value)} className={inputClass} /></div>
              <div className="col-span-1 md:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Motivasi</Label><textarea value={motivation} onChange={e => setMotivation(e.target.value)} className={textareaClass} rows={2} /></div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-8 sticky bottom-0 bg-gray-50/50">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
              Batal
            </button>
            <button type="submit" disabled={isSaving} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 flex items-center gap-2">
              {isSaving ? <><span className="animate-spin">⟳</span> Menyimpan...</> : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
"""

with open('components/admin/muallimah-v2/MuallimahV2Modals.tsx', 'w') as f:
    f.write(header)
    f.write(new_component)

