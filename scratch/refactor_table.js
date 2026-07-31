const fs = require('fs');
const path = '/Users/dewifebrinani/My Projects/tikrarmti.apps/components/admin/muallimah-v2/MuallimahAnalysisTableTab.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Remove analysisMode state
content = content.replace(
  /const \[analysisMode, setAnalysisMode\] = useState<"pendaftar" \| "daftar_ulang">\("pendaftar"\);\n/,
  ''
);

// 2. Change useEffects
content = content.replace(
  /loadHalaqahAvailability\(selectedBatchId, analysisMode, programTab\);/g,
  'loadHalaqahAvailability(selectedBatchId, programTab);'
);
content = content.replace(
  /\[rawAnalysisData, analysisMode, programTab\]/,
  '[rawAnalysisData, programTab]'
);
content = content.replace(
  /processAnalysisData\(rawAnalysisData, analysisMode\);/,
  'processAnalysisData(rawAnalysisData, "pendaftar");' // Fallback for processAnalysisData since it needs a mode
);

// 3. Replace loadHalaqahAvailability
const loadHalaqahAvailabilityRegex = /const loadHalaqahAvailability = async \([\s\S]*?\} finally \{\n\s*setLoading\(false\);\n\s*\}\n\s*\};/;
const newLoadHalaqahAvailability = `const loadHalaqahAvailability = async (
    batchId: string,
    tab: string = "semua",
  ) => {
    try {
      const [resPendaftar, resDaftarUlang] = await Promise.all([
        fetch(\`/api/admin/analysis/halaqah-availability?batch_id=\${batchId}&mode=pendaftar&program_tab=\${tab}\`),
        fetch(\`/api/admin/analysis/halaqah-availability?batch_id=\${batchId}&mode=daftar_ulang&program_tab=\${tab}\`)
      ]);
      
      if (!resPendaftar.ok || !resDaftarUlang.ok) {
        toast.error("Failed to load halaqah availability");
        setLoading(false);
        return;
      }

      const pendaftarData = await resPendaftar.json();
      const daftarUlangData = await resDaftarUlang.json();
      
      const estimasi = pendaftarData.data?.availability || [];
      const aktual = daftarUlangData.data?.availability || [];
      
      const juzMap = new Map<number, any>();
      
      estimasi.forEach((e: any) => {
        juzMap.set(e.juz_number, { juz_number: e.juz_number, juz_name: e.juz_name, estimasi: e, aktual: null });
      });
      
      aktual.forEach((a: any) => {
        if (juzMap.has(a.juz_number)) {
          juzMap.get(a.juz_number)!.aktual = a;
        } else {
          juzMap.set(a.juz_number, { juz_number: a.juz_number, juz_name: a.juz_name, estimasi: null, aktual: a });
        }
      });
      
      const merged = Array.from(juzMap.values()).sort((a, b) => {
         const getNum = (n: any) => parseInt(String(n).replace(/\\D/g, '')) || 0;
         return getNum(a.juz_number) - getNum(b.juz_number);
      });
      
      setHalaqahData(merged);
    } catch (error) {
      toast.error("Failed to load halaqah availability");
    } finally {
      setLoading(false);
    }
  };`;
content = content.replace(loadHalaqahAvailabilityRegex, newLoadHalaqahAvailability);

// 4. Remove toggle UI
const toggleUiRegex = /<div className="flex flex-wrap gap-2 p-1\.5 bg-white border border-gray-100 rounded-xl shadow-sm self-start">[\s\S]*?\{\[\s*\{\s*id: "pendaftar"[\s\S]*?<\/div>/;
content = content.replace(toggleUiRegex, '');

// 5. Replace totals calculation
const totalsRegex = /const totals = halaqahData\.reduce\(\(acc, juz: any\) => \{[\s\S]*?\}, \{ thalibah: 0, muallimah: 0, halaqah: 0, capacity: 0, filled: 0, available: 0 \}\);/;
const newTotals = `const totals = halaqahData.reduce((acc, juz: any) => {
    const est = juz.estimasi || {};
    const akt = juz.aktual || {};
    return {
      est_thalibah: acc.est_thalibah + (est.total_thalibah || 0),
      est_muallimah: acc.est_muallimah + (est.halaqah_details?.length || 0),
      est_capacity: acc.est_capacity + (est.total_capacity || 0),
      est_filled: acc.est_filled + (est.total_filled || 0),
      est_available: acc.est_available + (est.total_available || 0),
      
      akt_thalibah: acc.akt_thalibah + (akt.total_thalibah || 0),
      akt_muallimah: acc.akt_muallimah + (akt.halaqah_details?.length || 0),
      akt_capacity: acc.akt_capacity + (akt.total_capacity || 0),
      akt_filled: acc.akt_filled + (akt.total_filled || 0),
      akt_available: acc.akt_available + (akt.total_available || 0),
    };
  }, { 
    est_thalibah: 0, est_muallimah: 0, est_capacity: 0, est_filled: 0, est_available: 0,
    akt_thalibah: 0, akt_muallimah: 0, akt_capacity: 0, akt_filled: 0, akt_available: 0
  });`;
content = content.replace(totalsRegex, newTotals);

// 6. Replace table UI
const tableHeaderRegex = /<thead className="bg-gray-50\/80 border-b border-gray-200">[\s\S]*?<\/thead>/;
const newTableHeader = `<thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th rowSpan={2} className="px-6 py-4 font-bold text-gray-700 whitespace-nowrap border-r border-gray-200 align-middle">Juz</th>
                  <th colSpan={4} className="px-6 py-3 font-bold text-gray-700 text-center border-r border-gray-200 bg-blue-50/50">Estimasi (Pendaftar)</th>
                  <th colSpan={4} className="px-6 py-3 font-bold text-gray-700 text-center border-r border-gray-200 bg-emerald-50/50">Aktual (Daftar Ulang)</th>
                  <th rowSpan={2} className="px-6 py-4 font-bold text-gray-700 whitespace-nowrap text-right align-middle">Aksi</th>
                </tr>
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-blue-50/30">Thalibah</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-blue-50/30">Muallimah</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-blue-50/30">Kapasitas</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs border-r border-gray-200 bg-blue-50/30">Tersedia</th>
                  
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-emerald-50/30">Thalibah</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-emerald-50/30">Muallimah</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-emerald-50/30">Kapasitas</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs border-r border-gray-200 bg-emerald-50/30">Tersedia</th>
                </tr>
              </thead>`;
content = content.replace(tableHeaderRegex, newTableHeader);

const tableBodyRegex = /<tbody className="divide-y divide-gray-100">[\s\S]*?<\/tbody>/;
const newTableBody = `<tbody className="divide-y divide-gray-100">
                {halaqahData.map((juz: any) => {
                  const est = juz.estimasi || { total_thalibah: 0, halaqah_details: [], total_capacity: 0, total_filled: 0, total_available: 0 };
                  const akt = juz.aktual || { total_thalibah: 0, halaqah_details: [], total_capacity: 0, total_filled: 0, total_available: 0 };
                  
                  const estMuallimahCount = est.halaqah_details?.length || 0;
                  const aktMuallimahCount = akt.halaqah_details?.length || 0;
                  const isExpanded = expandedJuz.has(juz.juz_number.toString());
                  
                  return (
                    <Fragment key={juz.juz_number}>
                      <tr className="hover:bg-gray-50/50 transition-colors align-top cursor-pointer border-b border-gray-100" onClick={() => toggleJuz(juz.juz_number.toString())}>
                        <td className="px-6 py-4 border-r border-gray-100 align-middle">
                          <div className="font-bold text-lg text-gray-900">{juz.juz_name}</div>
                        </td>
                        
                        {/* Estimasi Cols */}
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{est.total_thalibah}</td>
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{estMuallimahCount}</td>
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{est.total_capacity}</td>
                        <td className="px-3 py-4 text-center align-middle border-r border-gray-100">
                           <span className={\`text-xs font-semibold px-2.5 py-1 rounded-full \${est.total_available < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}\`}>
                             {est.total_available < 0 ? \`Kurang \${Math.abs(est.total_available)}\` : est.total_available}
                           </span>
                        </td>

                        {/* Aktual Cols */}
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{akt.total_thalibah}</td>
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{aktMuallimahCount}</td>
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{akt.total_capacity}</td>
                        <td className="px-3 py-4 text-center align-middle border-r border-gray-100">
                           <span className={\`text-xs font-semibold px-2.5 py-1 rounded-full \${akt.total_available < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}\`}>
                             {akt.total_available < 0 ? \`Kurang \${Math.abs(akt.total_available)}\` : akt.total_available}
                           </span>
                        </td>

                        <td className="px-6 py-4 text-right align-middle">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleJuz(juz.juz_number.toString()); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                          >
                            Detail <ChevronDown className={\`w-4 h-4 transition-transform \${isExpanded ? 'rotate-180' : ''}\`} />
                          </button>
                        </td>
                      </tr>
                      {/* Detailed View */}
                      {isExpanded && (
                        <tr>
                           <td colSpan={10} className="p-0 bg-gray-50/30 border-b border-gray-200">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                                 {/* Estimasi List */}
                                 <div className="p-6">
                                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><Users className="w-4 h-4"/> Detail Muallimah (Estimasi)</h4>
                                    {estMuallimahCount > 0 ? (
                                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                        {est.halaqah_details.map((h: any) => (
                                          <div key={h.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-2">
                                              <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{h.muallimah_name}</h4>
                                                <p className="text-xs text-gray-500 font-medium capitalize mt-0.5">{h.class_type?.replace(/_/g, " ")}</p>
                                              </div>
                                            </div>
                                            <div className="flex flex-col gap-2 text-[11px] text-gray-600">
                                              <div className="flex justify-between items-center bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100">
                                                <span className="font-medium text-gray-500">Kapasitas/Terisi:</span>
                                                <span className="font-bold text-gray-800 text-xs">{h.current_students} / {h.max_students}</span>
                                              </div>
                                              {h.schedules?.length > 0 ? (
                                                <div className="space-y-1.5 mt-1">
                                                  {h.schedules.map((s: any, sIdx: number) => (
                                                    <div key={sIdx} className={\`flex justify-between items-center px-2 py-1 rounded \${s.is_allocated_here ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100' : 'text-gray-500 bg-gray-50/50'}\`}>
                                                      <span>{s.type} {s.is_backup ? "(Cadangan)" : ""} :</span>
                                                      <span>{s.day_name} {s.start_time !== "-" ? \`(\${s.start_time}-\${s.end_time})\` : ""}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-gray-400 italic text-center py-2 bg-gray-50 rounded-md mt-1">Jadwal belum tersedia</div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                                        <p className="text-sm text-gray-500">Belum ada data</p>
                                      </div>
                                    )}
                                 </div>
                                 
                                 {/* Aktual List */}
                                 <div className="p-6">
                                    <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Detail Muallimah (Aktual)</h4>
                                    {aktMuallimahCount > 0 ? (
                                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                        {akt.halaqah_details.map((h: any) => (
                                          <div key={h.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-2">
                                              <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{h.muallimah_name}</h4>
                                                <p className="text-xs text-gray-500 font-medium capitalize mt-0.5">{h.name || h.class_type?.replace(/_/g, " ")}</p>
                                              </div>
                                            </div>
                                            <div className="flex flex-col gap-2 text-[11px] text-gray-600">
                                              <div className="flex justify-between items-center bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100">
                                                <span className="font-medium text-gray-500">Kapasitas/Terisi:</span>
                                                <span className="font-bold text-gray-800 text-xs">{h.current_students} / {h.max_students}</span>
                                              </div>
                                              {h.schedules?.length > 0 ? (
                                                <div className="space-y-1.5 mt-1">
                                                  {h.schedules.map((s: any, sIdx: number) => (
                                                    <div key={sIdx} className={\`flex justify-between items-center px-2 py-1 rounded \${s.is_allocated_here ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100' : 'text-gray-500 bg-gray-50/50'}\`}>
                                                      <span>{s.type} {s.is_backup ? "(Cadangan)" : ""} :</span>
                                                      <span>{s.day_name} {s.start_time !== "-" ? \`(\${s.start_time}-\${s.end_time})\` : ""}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-gray-400 italic text-center py-2 bg-gray-50 rounded-md mt-1">Jadwal belum tersedia</div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                                        <p className="text-sm text-gray-500">Belum ada data</p>
                                      </div>
                                    )}
                                 </div>
                              </div>
                           </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>`;
content = content.replace(tableBodyRegex, newTableBody);

const tfootRegex = /<tfoot className="bg-gray-100 border-t-2 border-gray-200">[\s\S]*?<\/tfoot>/;
const newTfoot = `<tfoot className="bg-gray-100 border-t-2 border-gray-200">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900 text-lg border-r border-gray-200">Total</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-blue-900 text-base">{totals.est_thalibah}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-blue-900 text-base">{totals.est_muallimah}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-blue-900 text-base">{totals.est_capacity}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-blue-900 text-base border-r border-gray-200">{totals.est_available}</td>
                  
                  <td className="px-3 py-4 text-center align-middle font-bold text-emerald-900 text-base">{totals.akt_thalibah}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-emerald-900 text-base">{totals.akt_muallimah}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-emerald-900 text-base">{totals.akt_capacity}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-emerald-900 text-base border-r border-gray-200">{totals.akt_available}</td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>`;
content = content.replace(tfootRegex, newTfoot);


fs.writeFileSync(path, content, 'utf8');
console.log('Done rewriting table.');
