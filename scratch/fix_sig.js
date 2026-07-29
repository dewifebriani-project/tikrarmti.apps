const fs = require('fs');

const path = 'components/admin/muallimah-v2/MuallimahAnalysisTab.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldSig = `  const loadHalaqahAvailability = async (
    batchId: string,
    mode: "pendaftar" | "daftar_ulang" = "daftar_ulang",
  ) => {`;
const newSig = `  const loadHalaqahAvailability = async (
    batchId: string,
    mode: "pendaftar" | "daftar_ulang" = "daftar_ulang",
    tab: string = "semua"
  ) => {`;

content = content.replace(oldSig, newSig);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed signature');
