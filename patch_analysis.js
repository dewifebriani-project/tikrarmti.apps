const fs = require('fs');
const file = '/Users/dewifebrinani/My Projects/tikrarmti.apps/components/admin/muallimah-v2/MuallimahAnalysisTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state and process function
content = content.replace(
  "  const [analysisError, setAnalysisError] = useState<string | null>(null);",
  "  const [analysisError, setAnalysisError] = useState<string | null>(null);\n  const [analysisMode, setAnalysisMode] = useState<'pendaftar' | 'daftar_ulang'>('daftar_ulang');\n  const [rawAnalysisData, setRawAnalysisData] = useState<any>(null);"
);

// 2. Add useEffect for re-calculation
content = content.replace(
  "  useEffect(() => {\n    if (selectedBatchId) {\n      if (activeTab === 'overview') {\n        loadAnalysis(selectedBatchId);\n        loadHalaqahAvailability(selectedBatchId);\n      }\n    }\n  }, [selectedBatchId, activeTab]);",
  "  useEffect(() => {\n    if (selectedBatchId) {\n      if (activeTab === 'overview') {\n        loadAnalysis(selectedBatchId);\n        loadHalaqahAvailability(selectedBatchId, analysisMode);\n      }\n    }\n  }, [selectedBatchId, activeTab]);\n\n  useEffect(() => {\n    if (rawAnalysisData) {\n      processAnalysisData(rawAnalysisData, analysisMode);\n    }\n  }, [rawAnalysisData, analysisMode]);"
);

// 3. Extract processing logic
const processLogicStart = `      const { batch, muallimahs, thalibahs, halaqahs, students, daftarUlangSubmissions } = analysisResult.data;`;

// We'll replace the inside of loadAnalysis
const loadAnalysisRegex = /const loadAnalysis = async \(batchId: string\) => \{[\s\S]*?try \{[\s\S]*?analysisResult = await analysisResponse\.json\(\);[\s\S]*?if \(\!analysisResult\.success \|\| \!analysisResult\.data\) \{[\s\S]*?return;\n      \}([\s\S]*?)setAnalysis\(analysisData\);\n      setAnalysisError\(null\);\n    \} catch \(error\) \{/m;

const processAnalysisDataFunc = `
  const processAnalysisData = (data: any, mode: 'pendaftar' | 'daftar_ulang') => {
    try {
      const { batch, muallimahs, thalibahs, halaqahs, students, daftarUlangSubmissions } = data;

      // Process muallimah stats
      const muallimaList = (muallimahs || []) as MuallimaRegistration[];
      const totalMuallimah = muallimaList.length;
      const approvedMuallimah = muallimaList.filter((m: MuallimaRegistration) => m.status === 'approved').length;
      const pendingMuallimah = muallimaList.filter((m: MuallimaRegistration) => m.status === 'pending' || m.status === 'review').length;
      const rejectedMuallimah = muallimaList.filter((m: MuallimaRegistration) => m.status === 'rejected').length;

      // Process thalibah stats
      const thalibahList = (thalibahs || []) as ThalibahRegistration[];
      const totalThalibah = thalibahList.length;
      const approvedThalibah = thalibahList.filter((t: ThalibahRegistration) => t.status === 'approved').length;
      const pendingThalibah = thalibahList.filter((t: ThalibahRegistration) => t.status === 'pending').length;
      const selectedThalibah = thalibahList.filter((t: ThalibahRegistration) => t.selection_status === 'selected').length;

      // Process daftar ulang stats
      const daftarUlangList = (daftarUlangSubmissions || []) as DaftarUlangSubmission[];
      const totalDaftarUlang = daftarUlangList.length;
      const submittedDaftarUlang = daftarUlangList.filter((d: DaftarUlangSubmission) => d.status === 'submitted').length;
      const approvedDaftarUlang = daftarUlangList.filter((d: DaftarUlangSubmission) => d.status === 'approved').length;

      // Filter halaqahs by muallimah from this batch
      const approvedMuallimaIds = muallimaList.filter((m: MuallimaRegistration) => m.status === 'approved').map((m: MuallimaRegistration) => m.user_id);
      const halaqahList = (halaqahs || []) as Halaqah[];
      const batchHalaqahs = halaqahList.filter((h: Halaqah) => h.muallimah_id && approvedMuallimaIds.includes(h.muallimah_id));

      const totalHalaqah = batchHalaqahs.length;
      const halaqahWithProgram = batchHalaqahs.filter((h: Halaqah) => h.program_id !== null).length;
      const halaqahWithoutProgram = batchHalaqahs.filter((h: Halaqah) => h.program_id === null).length;

      const totalCapacity = batchHalaqahs.reduce((sum: number, h: Halaqah) => sum + (h.max_students || 0), 0);
      const batchHalaqahIds = batchHalaqahs.map(h => h.id);
      const halaqahStudentMap = new Map<string, Set<string>>();

      daftarUlangList.forEach((submission: DaftarUlangSubmission) => {
        const uniqueHalaqahIds: string[] = [];
        if (submission.ujian_halaqah_id && batchHalaqahIds.includes(submission.ujian_halaqah_id)) {
          uniqueHalaqahIds.push(submission.ujian_halaqah_id);
        }
        if (submission.tashih_halaqah_id && !submission.is_tashih_umum && batchHalaqahIds.includes(submission.tashih_halaqah_id)) {
          if (!uniqueHalaqahIds.includes(submission.tashih_halaqah_id)) {
            uniqueHalaqahIds.push(submission.tashih_halaqah_id);
          }
        }
        for (let i = 0; i < uniqueHalaqahIds.length; i++) {
          const halaqahId = uniqueHalaqahIds[i];
          if (!halaqahStudentMap.has(halaqahId)) {
            halaqahStudentMap.set(halaqahId, new Set());
          }
          halaqahStudentMap.get(halaqahId)!.add(submission.user_id);
        }
      });

      const filledSlotsFromStudents = students?.length || 0;
      let filledSlotsFromDaftarUlang = 0;
      const halaqahEntries = Array.from(halaqahStudentMap.entries());
      for (const [halaqahId, userSet] of halaqahEntries) {
        filledSlotsFromDaftarUlang += userSet.size;
      }
      const filledSlots = filledSlotsFromStudents + filledSlotsFromDaftarUlang;
      const availableSlots = Math.max(0, totalCapacity - filledSlots);
      const capacityPercentage = totalCapacity > 0 ? Math.round((filledSlots / totalCapacity) * 100) : 0;

      // Use mode to determine base thalibah count
      const activeThalibahCount = mode === 'pendaftar' ? totalThalibah : (approvedDaftarUlang > 0 ? approvedDaftarUlang : selectedThalibah);

      const ratio = approvedMuallimah > 0 ? \`1:\${Math.round(activeThalibahCount / approvedMuallimah)}\` : '0:0';
      const avgThalibahPerMuallimah = approvedMuallimah > 0 ? Math.round(activeThalibahCount / approvedMuallimah) : 0;
      const recommendedRatio = 10;
      const isAdequate = avgThalibahPerMuallimah <= recommendedRatio;

      let recommendation = '';
      if (approvedMuallimah === 0) {
        recommendation = 'Belum ada muallimah yang diapprove. Segera review dan approve muallimah.';
      } else if (activeThalibahCount === 0) {
        recommendation = mode === 'pendaftar' ? 'Belum ada pendaftar thalibah.' : 'Belum ada thalibah yang mendaftar ulang.';
      } else if (avgThalibahPerMuallimah > recommendedRatio) {
        const neededMuallimah = Math.ceil(activeThalibahCount / recommendedRatio) - approvedMuallimah;
        recommendation = \`Jumlah muallimah kurang memadai. Dibutuhkan tambahan \${neededMuallimah} muallimah untuk rasio ideal (1:10 maksimal).\`;
      } else if (avgThalibahPerMuallimah < 5 && activeThalibahCount > 0) {
        recommendation = 'Jumlah muallimah berlebih. Pertimbangkan untuk meningkatkan kuota thalibah per halaqah.';
      } else {
        recommendation = 'Rasio muallimah dan thalibah sudah ideal. Siap untuk dijadwalkan ke halaqah.';
      }

      const analysisData: BatchAnalysis = {
        batch_id: batch.id,
        batch_name: batch.name,
        batch_status: batch.status,
        total_muallimah: totalMuallimah,
        approved_muallimah: approvedMuallimah,
        pending_muallimah: pendingMuallimah,
        rejected_muallimah: rejectedMuallimah,
        total_thalibah: totalThalibah,
        approved_thalibah: approvedThalibah,
        pending_thalibah: pendingThalibah,
        selected_thalibah: selectedThalibah,
        total_daftar_ulang: totalDaftarUlang,
        submitted_daftar_ulang: submittedDaftarUlang,
        approved_daftar_ulang: approvedDaftarUlang,
        total_halaqah: totalHalaqah,
        halaqah_with_program: halaqahWithProgram,
        halaqah_without_program: halaqahWithoutProgram,
        total_halaqah_capacity: totalCapacity,
        total_filled_slots: filledSlots,
        total_available_slots: availableSlots,
        capacity_percentage: capacityPercentage,
        muallimah_thalibah_ratio: ratio,
        avg_thalibah_per_muallimah: avgThalibahPerMuallimah,
        is_adequate: isAdequate,
        recommendation: recommendation
      };

      setAnalysis(analysisData);
      setAnalysisError(null);
    } catch (error) {
      console.error('Error processing analysis data:', error);
      toast.error('Failed to process analysis data');
    }
  };

  const loadAnalysis = async (batchId: string) => {
    setLoading(true);
    setAnalysisError(null);
    try {
      const analysisResponse = await fetch(\`/api/admin/analysis?batch_id=\${batchId}\`);
      if (!analysisResponse.ok) {
        toast.error('Failed to load analysis data');
        setLoading(false);
        return;
      }
      const analysisResult = await analysisResponse.json();
      if (!analysisResult.success || !analysisResult.data) {
        toast.error('Invalid analysis data received');
        setLoading(false);
        return;
      }
      setRawAnalysisData(analysisResult.data);
    } catch (error) {
      toast.error('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };
`;

content = content.replace(loadAnalysisRegex, processAnalysisDataFunc + "\n    } catch (error) {");

// Now we need to update loadHalaqahAvailability to accept mode
content = content.replace(
  "const loadHalaqahAvailability = async (batchId: string) => {",
  "const loadHalaqahAvailability = async (batchId: string, mode: 'pendaftar' | 'daftar_ulang' = 'daftar_ulang') => {"
);
content = content.replace(
  "const response = await fetch(`/api/admin/analysis/halaqah-availability?batch_id=${batchId}`);",
  "const response = await fetch(`/api/admin/analysis/halaqah-availability?batch_id=${batchId}&mode=${mode}`);"
);

// We need to re-run loadHalaqahAvailability when mode changes
content = content.replace(
  "  useEffect(() => {\n    if (rawAnalysisData) {\n      processAnalysisData(rawAnalysisData, analysisMode);\n    }\n  }, [rawAnalysisData, analysisMode]);",
  "  useEffect(() => {\n    if (rawAnalysisData) {\n      processAnalysisData(rawAnalysisData, analysisMode);\n      loadHalaqahAvailability(selectedBatchId, analysisMode);\n    }\n  }, [rawAnalysisData, analysisMode]);"
);


// And finally add UI toggle for the mode.
const toggleUI = `
      {/* Tab Navigation */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-100 flex p-2 gap-2">
          <button
            onClick={() => setAnalysisMode('pendaftar')}
            className={\`px-4 py-2 text-sm font-semibold rounded-xl transition-colors \${analysisMode === 'pendaftar' ? 'bg-green-50 text-green-700 border-green-200 border' : 'text-gray-500 hover:bg-gray-50'}\`}
          >
            Berdasarkan Pendaftar (Estimasi)
          </button>
          <button
            onClick={() => setAnalysisMode('daftar_ulang')}
            className={\`px-4 py-2 text-sm font-semibold rounded-xl transition-colors \${analysisMode === 'daftar_ulang' ? 'bg-green-50 text-green-700 border-green-200 border' : 'text-gray-500 hover:bg-gray-50'}\`}
          >
            Berdasarkan Daftar Ulang (Aktual)
          </button>
        </div>
      </div>
`;

content = content.replace(
  "{/* Tab Navigation */}\n      <div className=\"bg-white rounded-3xl shadow-sm border border-gray-100\">\n        <div className=\"border-b border-gray-100\">\n        </div>\n      </div>",
  toggleUI
);

fs.writeFileSync(file, content);
console.log('done patching UI');
