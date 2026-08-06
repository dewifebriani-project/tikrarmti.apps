const fs = require('fs');

const actionsFile = 'app/(protected)/daftar-ulang/actions.ts';
let actionsContent = fs.readFileSync(actionsFile, 'utf8');

const resetAkadThalibahStr = `
export async function resetAkadThalibah(submissionId: string) {
  const supabase = createClient();
  const supabaseAdmin = createSupabaseAdmin();

  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (!authUser || authError) {
    return { success: false, error: 'Unauthorized. Silakan login kembali.' };
  }

  // Get current submission
  const { data: submission, error: fetchError } = await supabaseAdmin
    .from('daftar_ulang_submissions')
    .select('user_id, status, akad_files')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) {
    return { success: false, error: 'Data pendaftaran tidak ditemukan.' };
  }

  // Only the owner can reset their own akad
  if (submission.user_id !== authUser.id) {
    return { success: false, error: 'Forbidden. Bukan pemilik pendaftaran.' };
  }

  // Can only reset if not yet approved
  if (submission.status !== 'submitted') {
    return { success: false, error: 'File akad hanya dapat direset jika statusnya sedang menunggu persetujuan (submitted).' };
  }

  // Delete files from storage
  if (submission.akad_files && Array.isArray(submission.akad_files)) {
    try {
      const filePaths = submission.akad_files.map((file: any) => {
        const urlParts = file.url.split('/documents/');
        if (urlParts.length > 1) {
          return urlParts[1];
        }
        return null;
      }).filter(Boolean);

      if (filePaths.length > 0) {
        const { error: storageError } = await supabaseAdmin
          .storage
          .from('documents')
          .remove(filePaths);
          
        if (storageError) {
          console.error('[Reset Akad Thalibah] Storage delete error:', storageError);
        }
      }
    } catch (e) {
      console.error('[Reset Akad Thalibah] Error deleting files:', e);
    }
  }

  // Update submission
  const { error: updateError } = await supabaseAdmin
    .from('daftar_ulang_submissions')
    .update({
      akad_files: null,
      akad_status: 'draft',
      status: 'draft',
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId);

  if (updateError) {
    console.error('[Reset Akad Thalibah] Update error:', updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true, message: 'File akad berhasil dihapus.' };
}
`;

if (!actionsContent.includes('resetAkadThalibah')) {
  actionsContent += '\n' + resetAkadThalibahStr;
  fs.writeFileSync(actionsFile, actionsContent);
  console.log('Patched actions.ts');
}

const pageFile = 'app/(protected)/daftar-ulang/page.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');

if (!pageContent.includes('resetAkadThalibah')) {
  pageContent = pageContent.replace('import { submitDaftarUlang, saveDaftarUlangDraft, uploadAkad, updateAkadFiles, approveDaftarUlangSubmission, getReregistrationQuestions } from \'./actions\'', 'import { submitDaftarUlang, saveDaftarUlangDraft, uploadAkad, updateAkadFiles, approveDaftarUlangSubmission, getReregistrationQuestions, resetAkadThalibah } from \'./actions\'');
  
  const resetHandler = `
  const [isResetting, setIsResetting] = useState(false);
  const handleResetAkad = async () => {
    if (!existingSubmission?.id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus file akad dan mengulang pengiriman?')) return;
    
    setIsResetting(true);
    const result = await resetAkadThalibah(existingSubmission.id);
    if (result.success) {
      toast.success(result.message || 'File Akad berhasil dihapus');
      window.location.reload();
    } else {
      toast.error(result.error || 'Gagal mereset akad');
      setIsResetting(false);
    }
  };
`;
  pageContent = pageContent.replace('const handleApprove = async () => {', resetHandler + '\n  const handleApprove = async () => {');
  
  const resetButton = `
        {!isAdmin && isSubmitted && (
          <Button
            onClick={handleResetAkad}
            disabled={isResetting}
            variant="destructive"
            className="w-full mb-2"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isResetting ? 'Menghapus...' : 'Hapus & Re-upload Akad'}
          </Button>
        )}
`;
  pageContent = pageContent.replace('<Button\n          onClick={() => router.push(\'/perjalanan-saya\')}', resetButton + '        <Button\n          onClick={() => router.push(\'/perjalanan-saya\')}');
  
  fs.writeFileSync(pageFile, pageContent);
  console.log('Patched page.tsx');
}
