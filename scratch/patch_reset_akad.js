const fs = require('fs');
const tabFile = 'components/admin/daftar-ulang-v2/DaftarUlangV2Tab.tsx';
let tabContent = fs.readFileSync(tabFile, 'utf8');

const resetAkadFunc = `
  const handleResetAkad = async (submissionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus file akad dan menolak pendaftaran ini? Thalibah harus mengupload ulang akadnya.')) {
      return;
    }

    setResettingId(submissionId);
    try {
      const response = await fetch(\`/api/admin/daftar-ulang/\${submissionId}/reset-akad\`, {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset akad');
      }

      toast.success(result.message || 'File Akad berhasil dihapus');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('[DaftarUlangTab] Error resetting akad:', error);
      toast.error('Gagal mereset akad: ' + error.message);
    } finally {
      setResettingId(null);
    }
  };
`;

if (!tabContent.includes('handleResetAkad')) {
  tabContent = tabContent.replace('const handleResetHalaqah =', resetAkadFunc + '\n  const handleResetHalaqah =');
  tabContent = tabContent.replace('onResetHalaqah={handleResetHalaqah}', 'onResetHalaqah={handleResetHalaqah}\n        onResetAkad={handleResetAkad}');
  fs.writeFileSync(tabFile, tabContent);
  console.log('Patched DaftarUlangV2Tab.tsx');
} else {
  console.log('Already patched DaftarUlangV2Tab.tsx');
}

const tableFile = 'components/admin/daftar-ulang-v2/DaftarUlangV2Table.tsx';
let tableContent = fs.readFileSync(tableFile, 'utf8');

if (!tableContent.includes('onResetAkad')) {
  tableContent = tableContent.replace('onResetHalaqah: (id: string) => void;', 'onResetHalaqah: (id: string) => void;\n  onResetAkad?: (id: string) => void;');
  tableContent = tableContent.replace('onResetHalaqah,\n', 'onResetHalaqah,\n  onResetAkad,\n');
  tableContent = tableContent.replace('onResetHalaqah={onResetHalaqah}', 'onResetHalaqah={onResetHalaqah}\n                      onResetAkad={onResetAkad}');
  
  const resetAkadButton = `
          {onResetAkad && (
            <button
              onClick={() => { setIsOpen(false); onResetAkad(submission.id); }}
              disabled={resettingId === submission.id}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
              title="Hapus file akad dan set status menjadi Draft"
            >
              <RotateCcw className="w-4 h-4" /> Tolak & Hapus Akad
            </button>
          )}
`;
  tableContent = tableContent.replace('<div className="h-px bg-gray-100 my-1"></div>\n\n          <button\n            onClick={() => { setIsOpen(false); onDelete(submission.id); }}', resetAkadButton + '\n          <div className="h-px bg-gray-100 my-1"></div>\n\n          <button\n            onClick={() => { setIsOpen(false); onDelete(submission.id); }}');
  
  fs.writeFileSync(tableFile, tableContent);
  console.log('Patched DaftarUlangV2Table.tsx');
} else {
  console.log('Already patched DaftarUlangV2Table.tsx');
}
