const fs = require('fs');

const file = 'app/(protected)/perjalanan-saya/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const isAkadSubmittedOld = "const isAkadSubmitted = !!(daftarUlangData && (daftarUlangData.akad_status === 'submitted' || daftarUlangData.akad_status === 'approved' || daftarUlangData.status === 'submitted' || daftarUlangData.status === 'approved'));";
const isAkadSubmittedNew = `const isAkadSubmitted = !!(daftarUlangData && (
    daftarUlangData.akad_status === 'submitted' || 
    daftarUlangData.akad_status === 'approved' || 
    (daftarUlangData.status === 'approved' && !daftarUlangData.akad_status) ||
    (daftarUlangData.status === 'submitted' && !daftarUlangData.akad_status)
  ));`;

const isPartnerSubmittedOld = "const isPartnerSubmitted = !!(daftarUlangData && (daftarUlangData.partner_status === 'submitted' || daftarUlangData.partner_status === 'approved' || daftarUlangData.status === 'submitted' || daftarUlangData.status === 'approved'));";
const isPartnerSubmittedNew = `const isPartnerSubmitted = !!(daftarUlangData && (
    daftarUlangData.partner_status === 'submitted' || 
    daftarUlangData.partner_status === 'approved' || 
    (daftarUlangData.status === 'approved' && !daftarUlangData.partner_status) ||
    (daftarUlangData.status === 'submitted' && !daftarUlangData.partner_status)
  ));`;

content = content.replace(isAkadSubmittedOld, isAkadSubmittedNew);
content = content.replace(isPartnerSubmittedOld, isPartnerSubmittedNew);

fs.writeFileSync(file, content);
console.log('Patched perjalanan-saya/page.tsx');
