const fs = require('fs');

const path = 'components/admin/muallimah-v2/MuallimahAnalysisTab.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /loadHalaqahAvailability\(selectedBatchId,\s*analysisMode\);/g;
content = content.replace(regex, "loadHalaqahAvailability(selectedBatchId, analysisMode, programTab);");

content = content.replace(
  "const loadHalaqahAvailability = async (batchId: string, mode: 'pendaftar' | 'daftar_ulang' = 'daftar_ulang') => {",
  "const loadHalaqahAvailability = async (batchId: string, mode: 'pendaftar' | 'daftar_ulang' = 'daftar_ulang', tab: string = 'semua') => {"
);

content = content.replace(
  "`/api/admin/analysis/halaqah-availability?batch_id=${batchId}&mode=${mode}`",
  "`/api/admin/analysis/halaqah-availability?batch_id=${batchId}&mode=${mode}&program_tab=${tab}`"
);

fs.writeFileSync(path, content, 'utf8');
console.log('MuallimahAnalysisTab.tsx patched successfully');
