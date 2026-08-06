function toProperCase(text) {
  if (!text) return '';
  return text.split(' ').map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '').join(' ');
}

function getYearFromBirthDate(birthDate) {
  if (!birthDate) return '';
  try {
    return new Date(birthDate).getFullYear().toString().slice(-2);
  } catch {
    return '';
  }
}

function escapeVcfField(field) {
  if (!field) return '';
  return field.toString().replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function formatPhoneForVcf(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return '+' + cleaned;
}

const batchName = "Tikrar Tahfidz MTI Batch 3";
const batchMatch = batchName.match(/Batch\s*(\d+)/i);
const batchNumber = batchMatch ? batchMatch[1] : 'XX';

const s = {
  confirmed_full_name: 'Inna Purwighati',
  confirmed_wa_phone: '08123456789',
  registration: {
    birth_date: '1995-10-12',
    domicile: 'Bandung'
  }
};

const birthYearYY = getYearFromBirthDate(s.registration?.birth_date);
const formattedName = toProperCase(s.confirmed_full_name);
const formattedDomicile = toProperCase(s.registration?.domicile);
const name = `MTI${batchNumber}_${formattedName}_${birthYearYY}_${formattedDomicile}`;
console.log(name);

const vcfLines = [];
vcfLines.push('BEGIN:VCARD');
vcfLines.push('VERSION:3.0');
vcfLines.push(`FN:${escapeVcfField(name)}`);
vcfLines.push(`N:${escapeVcfField(name)};;;;`);
const phone = formatPhoneForVcf(s.confirmed_wa_phone);
vcfLines.push(`TEL;TYPE=CELL:${phone}`);
vcfLines.push('END:VCARD');
console.log(vcfLines.join('\n'));
