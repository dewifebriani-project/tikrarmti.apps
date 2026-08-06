const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/admin/daftar-ulang-v2/DaftarUlangV2Tab.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const vcfCode = `
  // Download VCF
  const downloadVCF = async () => {
    setDownloadingVCF(true);
    try {
      const data = await loadAllSubmissionsForDownload();
      
      const filteredData = data.filter(
        (item: any) => item.status === 'approved' || item.status === 'submitted'
      );

      if (filteredData.length === 0) {
        toast.error('Tidak ada data dengan status approved/submitted untuk diunduh');
        return;
      }

      // Sort data alphabetically by name
      const sortedData = [...filteredData].sort((a, b) => {
        const aName = a.confirmed_full_name || a.user?.full_name || '';
        const bName = b.confirmed_full_name || b.user?.full_name || '';
        return aName.localeCompare(bName, 'id-ID');
      });

      function toProperCase(text: string) {
        if (!text) return '';
        return text.split(' ').map((word: string) => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '').join(' ');
      }

      function getYearFromBirthDate(birthDate: string) {
        if (!birthDate) return '';
        try {
          return new Date(birthDate).getFullYear().toString().slice(-2);
        } catch {
          return '';
        }
      }

      function escapeVcfField(field: string) {
        if (!field) return '';
        return field.toString().replace(/\\\\/g, '\\\\\\\\').replace(/;/g, '\\\\;').replace(/,/g, '\\\\,').replace(/\\n/g, '\\\\n');
      }

      function formatPhoneForVcf(phone: string) {
        if (!phone) return '';
        let cleaned = phone.replace(/\\D/g, '');
        if (cleaned.startsWith('0')) {
          cleaned = '62' + cleaned.slice(1);
        }
        return '+' + cleaned;
      }

      // Identify batch number
      const batchObj = batches.find(b => b.id === (localBatchId === 'all' && batches.length > 0 ? batches[0].id : localBatchId));
      const batchNameStr = batchObj ? batchObj.name : '';
      const batchMatch = batchNameStr.match(/Batch\\s*(\\d+)/i);
      const batchNumber = batchMatch ? batchMatch[1] : 'XX';

      const vcfLines: string[] = [];

      sortedData.forEach(item => {
        const fullName = item.confirmed_full_name || item.user?.full_name || '';
        const waPhone = item.confirmed_wa_phone || item.user?.whatsapp || '';
        const birthDate = item.registration?.birth_date || '';
        const domicile = item.registration?.domicile || '';

        const birthYearYY = getYearFromBirthDate(birthDate);
        const formattedName = toProperCase(fullName);
        const formattedDomicile = toProperCase(domicile);
        
        // MTI3_nama_tahun lahir_kota domisili
        const name = \`MTI\${batchNumber}_\${formattedName}_\${birthYearYY}_\${formattedDomicile}\`;

        vcfLines.push('BEGIN:VCARD');
        vcfLines.push('VERSION:3.0');
        vcfLines.push(\`FN:\${escapeVcfField(name)}\`);
        vcfLines.push(\`N:\${escapeVcfField(name)};;;;\`);
        
        const phone = formatPhoneForVcf(waPhone);
        if (phone) {
          vcfLines.push(\`TEL;TYPE=CELL:\${phone}\`);
        }
        
        vcfLines.push('END:VCARD');
      });

      const vcfContent = vcfLines.join('\\n');
      const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', \`Daftar_Ulang_MTI_Batch_\${batchNumber}.vcf\`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('File VCF berhasil diunduh');
    } catch (error) {
      console.error('Download VCF error:', error);
      toast.error('Gagal mengunduh file VCF');
    } finally {
      setDownloadingVCF(false);
    }
  };
`;

code = code.replace('const downloadPDF = async () => {', vcfCode + '\n  const downloadPDF = async () => {');
code = code.replace(
  'isDownloadingExcel={downloadingExcel}',
  'onDownloadVCF={downloadVCF}\n        isDownloadingExcel={downloadingExcel}'
);
code = code.replace(
  'isDownloadingPDF={downloadingPDF}',
  'isDownloadingPDF={downloadingPDF}\n        isDownloadingVCF={downloadingVCF}'
);

fs.writeFileSync(filePath, code);
console.log('Patched VCF functions');
