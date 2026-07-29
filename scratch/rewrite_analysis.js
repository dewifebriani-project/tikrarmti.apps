import * as fs from 'fs';

const filePath = 'components/admin/muallimah-v2/MuallimahAnalysisTab.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

if (!content.includes('const [programTab, setProgramTab]')) {
    content = content.replace(
        "const [analysisMode, setAnalysisMode] = useState<'pendaftar' | 'daftar_ulang'>('daftar_ulang');",
        "const [analysisMode, setAnalysisMode] = useState<'pendaftar' | 'daftar_ulang'>('daftar_ulang');\n  const [programTab, setProgramTab] = useState<'semua' | 'tikrar' | 'pra_tikrar' | 'kelas_berbayar'>('semua');"
    );
}

content = content.replace(
    "[rawAnalysisData, analysisMode]",
    "[rawAnalysisData, analysisMode, programTab]"
);

const process_start = `  const processAnalysisData = (data: any, mode: 'pendaftar' | 'daftar_ulang') => {
    try {
      const { batch, muallimahs, thalibahs, halaqahs, students, daftarUlangSubmissions } = data;`;

const process_replacement = `  const processAnalysisData = (data: any, mode: 'pendaftar' | 'daftar_ulang') => {
    try {
      const { batch } = data;
      let { muallimahs, thalibahs, halaqahs, students, daftarUlangSubmissions } = data;

      // Filter by program tab if not 'semua'
      if (programTab !== 'semua') {
        // Filter Muallimah based on preferred_schedule
        muallimahs = (muallimahs || []).filter((m: any) => {
          let pSched = m.preferred_schedule;
          if (typeof pSched === 'string') {
            try { pSched = JSON.parse(pSched); } catch (e) { pSched = null; }
          }
          if (programTab === 'tikrar') return pSched?.tikrar;
          if (programTab === 'pra_tikrar') return pSched?.pra_tahfidz;
          if (programTab === 'kelas_berbayar') return pSched?.berbayar || (m.paid_class_scheme && m.paid_class_scheme !== 'none');
          return true;
        });

        // Filter Thalibah based on programs.class_type
        thalibahs = (thalibahs || []).filter((t: any) => {
          const cType = t.programs?.class_type;
          if (programTab === 'tikrar') return cType === 'tikrar_tahfidz';
          if (programTab === 'pra_tikrar') return cType === 'pra_tahfidz';
          if (programTab === 'kelas_berbayar') return false; // Biasanya tidak ada thalibah untuk kelas berbayar di tabel pendaftaran_tikrar_tahfidz
          return true;
        });

        // Filter Halaqah based on programs.class_type
        halaqahs = (halaqahs || []).filter((h: any) => {
          const cType = h.programs?.class_type;
          if (programTab === 'tikrar') return cType === 'tikrar_tahfidz';
          if (programTab === 'pra_tikrar') return cType === 'pra_tahfidz';
          if (programTab === 'kelas_berbayar') return cType === 'kelas_berbayar';
          return true;
        });
        
        // Filter Daftar Ulang
        daftarUlangSubmissions = (daftarUlangSubmissions || []).filter((d: any) => {
          // Check if halaqah in daftar ulang matches the program
          const halaqahMatch = (halaqahs || []).find((h: any) => h.id === d.ujian_halaqah_id || h.id === d.tashih_halaqah_id);
          return halaqahMatch !== undefined;
        });
      }`;

content = content.replace(process_start, process_replacement);

const tabs_ui = `      {/* Tab Navigation */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-100 flex flex-wrap p-2 gap-2">
          <button
            onClick={() => setProgramTab('semua')}
            className={\`px-4 py-2 text-sm font-semibold rounded-xl transition-colors \${programTab === 'semua' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 border' : 'text-gray-500 hover:bg-gray-50'}\`}
          >
            Semua Program
          </button>
          <button
            onClick={() => setProgramTab('tikrar')}
            className={\`px-4 py-2 text-sm font-semibold rounded-xl transition-colors \${programTab === 'tikrar' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 border' : 'text-gray-500 hover:bg-gray-50'}\`}
          >
            Tikrar Tahfidz
          </button>
          <button
            onClick={() => setProgramTab('pra_tikrar')}
            className={\`px-4 py-2 text-sm font-semibold rounded-xl transition-colors \${programTab === 'pra_tikrar' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 border' : 'text-gray-500 hover:bg-gray-50'}\`}
          >
            Pra Tikrar
          </button>
          <button
            onClick={() => setProgramTab('kelas_berbayar')}
            className={\`px-4 py-2 text-sm font-semibold rounded-xl transition-colors \${programTab === 'kelas_berbayar' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 border' : 'text-gray-500 hover:bg-gray-50'}\`}
          >
            Kelas Berbayar
          </button>
        </div>
        <div className="border-b border-gray-100 flex p-2 gap-2">`;

const existing_tabs = `      {/* Tab Navigation */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-100 flex p-2 gap-2">`;

content = content.replace(existing_tabs, tabs_ui);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated MuallimahAnalysisTab.tsx');
