const fs = require('fs');

const path = 'app/api/admin/analysis/halaqah-availability/route.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('const programTab = searchParams.get(\'program_tab\') || \'semua\';')) {
  content = content.replace(
    "const mode = searchParams.get('mode') || 'daftar_ulang';",
    "const mode = searchParams.get('mode') || 'daftar_ulang';\n    const programTab = searchParams.get('program_tab') || 'semua';"
  );
}

// For mode === 'pendaftar'
const pendaftarFilterStart = "      const muallimahRegsFiltered = muallimahRegs.filter(m => !m.exclude_from_capacity);";
const pendaftarFilterReplacement = `      const muallimahRegsFiltered = muallimahRegs.filter(m => {
        if (m.exclude_from_capacity) return false;
        
        if (programTab !== 'semua') {
          let pSched = m.preferred_schedule;
          if (typeof pSched === 'string') {
            try { pSched = JSON.parse(pSched); } catch(e) { pSched = null; }
          }
          if (programTab === 'tikrar') return pSched?.tikrar;
          if (programTab === 'pra_tikrar') return pSched?.pra_tahfidz;
          if (programTab === 'kelas_berbayar') return pSched?.berbayar || (m.paid_class_scheme && m.paid_class_scheme !== 'none');
          return true;
        }
        return true;
      });`;

content = content.replace(pendaftarFilterStart, pendaftarFilterReplacement);

// For mode === 'daftar_ulang'
content = content.replace(
  "programs!inner(batch_id)",
  "programs!inner(batch_id, class_type)"
);

const daftarUlangFilterStart = `    // Filter halaqah by muallimah from this batch
    const batchHalaqahs = (halaqahData || []).filter(h =>
      h.muallimah_id && approvedMuallimahIds.includes(h.muallimah_id)
    );`;

const daftarUlangFilterReplacement = `    // Filter halaqah by muallimah from this batch and program tab
    const batchHalaqahs = (halaqahData || []).filter(h => {
      if (!h.muallimah_id || !approvedMuallimahIds.includes(h.muallimah_id)) return false;
      
      if (programTab !== 'semua') {
        const cType = (h.programs as any)?.class_type;
        if (programTab === 'tikrar') return cType === 'tikrar_tahfidz';
        if (programTab === 'pra_tikrar') return cType === 'pra_tahfidz';
        if (programTab === 'kelas_berbayar') return cType === 'kelas_berbayar' || cType === 'paid_class';
      }
      return true;
    });`;

content = content.replace(daftarUlangFilterStart, daftarUlangFilterReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('halaqah-availability/route.ts patched successfully');
