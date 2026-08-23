import re

with open('components/dashboard/SitInModal.tsx', 'r') as f:
    content = f.read()

# Add currentSitIn state
content = content.replace(
    "const [availableHalaqahs, setAvailableHalaqahs] = useState<any[]>([]);",
    "const [availableHalaqahs, setAvailableHalaqahs] = useState<any[]>([]);\n  const [currentSitIn, setCurrentSitIn] = useState<any>(null);"
)

# In fetchAvailableHalaqahs, fetch current Sit-In
fetch_sitin = """
      // Get current date and Monday of this week
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);

      const [halaqahsResponse, quotaResponse, sitInResponse] = await Promise.all([
        supabase
          .from('halaqah')
          .select(`
            id, name, day_of_week, start_time, max_students,
            muallimah:users!halaqah_muallimah_id_fkey(full_name),
            program:programs!inner(id, batch_id, class_type),
            students:halaqah_students(status),
            mentors:halaqah_mentors(role, user:users!halaqah_mentors_mentor_id_fkey(full_name))
          `)
          .eq('program.batch_id', activeBatch.id)
          .eq('program.class_type', classType)
          .eq('status', 'active'),
        fetch(`/api/shared/halaqah-quota?batch_id=${activeBatch.id}`),
        supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('action_type', 'SIT_IN')
          .gte('created_at', startOfWeek.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);
"""

content = re.sub(r"const \[halaqahsResponse, quotaResponse\] = await Promise\.all\(\[.*?fetch\(`/api/shared/halaqah-quota\?batch_id=\$\{activeBatch\.id\}`\)\n      \]\);", fetch_sitin, content, flags=re.DOTALL)

# Set current sit in
content = content.replace(
    "const quotaData = quotaResponse.ok ? await quotaResponse.json() : null;",
    """if (sitInResponse.data) {
        setCurrentSitIn(sitInResponse.data.details?.halaqah_id);
      }
      const quotaData = quotaResponse.ok ? await quotaResponse.json() : null;"""
)

# Update handleCancelSitIn
cancel_sitin_func = """
  const handleCancelSitIn = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/alumni/sit-in', {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('Sit-In dibatalkan');
        setCurrentSitIn(null);
        setRegisteredZoom({});
      }
    } catch(e) {
      toast.error('Gagal membatalkan Sit-In');
    } finally {
      setLoading(false);
    }
  };
"""

content = content.replace("  const handleCopyLink = (url: string) => {", cancel_sitin_func + "\n  const handleCopyLink = (url: string) => {")

# Modify rendering to show current Sit In
render_current_sitin = """
              {currentSitIn && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-800 uppercase mb-1">Status Anda</p>
                      <p className="text-sm font-medium text-indigo-900">
                        Anda sedang terdaftar Sit-In di salah satu kelas ini. Memilih kelas lain akan menimpa Sit-In sebelumnya.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCancelSitIn} className="text-red-600 border-red-200 hover:bg-red-50">
                      Batalkan Sit-In
                    </Button>
                  </div>
                </div>
              )}
              {availableHalaqahs.map((halaqah) => {"""

content = content.replace("              {availableHalaqahs.map((halaqah) => {", render_current_sitin)

# Add "Sudah Dipilih" state
content = content.replace("const zoomInfo = registeredZoom[halaqah.id];", "const zoomInfo = registeredZoom[halaqah.id];\n                const isCurrent = currentSitIn === halaqah.id;")
content = content.replace("className={`border p-5 rounded-xl transition-all bg-white shadow-sm ${", "className={`border p-5 rounded-xl transition-all bg-white shadow-sm ${isCurrent ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''} ${")

content = content.replace("""                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full font-bold"
                                    onClick={() => handleRegisterSitIn(halaqah.id)}
                                    disabled={isFull || registeringId === halaqah.id}
                                  >
                                    {registeringId === halaqah.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Daftar Sit-In'}
                                  </Button>""",
"""                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full font-bold"
                                    onClick={() => handleRegisterSitIn(halaqah.id)}
                                    disabled={isFull || registeringId === halaqah.id || isCurrent}
                                  >
                                    {registeringId === halaqah.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (isCurrent ? 'Terpilih' : 'Daftar Sit-In')}
                                  </Button>""")

with open('components/dashboard/SitInModal.tsx', 'w') as f:
    f.write(content)
