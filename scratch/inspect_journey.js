const fs = require('fs');
const content = fs.readFileSync('app/(protected)/perjalanan-saya/page.tsx', 'utf8');

const lines = content.split('\n');
const result = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('registration_end_date') || lines[i].includes('selection_end_date') || lines[i].includes('re_enrollment_end_date') || lines[i].includes('upload') || lines[i].includes('Tahapan Ujian Lisan')) {
    result.push(`${i + 1}: ${lines[i]}`);
  }
}
console.log(result.join('\n'));
