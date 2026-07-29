const fs = require('fs');

const path = 'app/api/admin/analysis/halaqah-availability/route.ts';
let content = fs.readFileSync(path, 'utf8');

// Add paid_class_scheme to select query in halaqah-availability
content = content.replace(
  `        preferred_schedule, 
        backup_schedule,
        preferred_max_thalibah,
        exclude_from_capacity,`,
  `        preferred_schedule, 
        backup_schedule,
        preferred_max_thalibah,
        exclude_from_capacity,
        paid_class_scheme,`
);

// We should also fix the type error by using (m as any).paid_class_scheme to be safe.
const typeErrorStart = `          if (programTab === 'kelas_berbayar') return pSched?.berbayar || (m.paid_class_scheme && m.paid_class_scheme !== 'none');`;
const typeErrorEnd = `          if (programTab === 'kelas_berbayar') return pSched?.berbayar || ((m as any).paid_class_scheme && (m as any).paid_class_scheme !== 'none');`;

content = content.replace(typeErrorStart, typeErrorEnd);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed type error in halaqah-availability/route.ts');
