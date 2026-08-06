import { createServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const id = params.id;
    if (!id) {
      return ApiResponses.badRequest('ID is required');
    }

    const body = await request.json();
    
    // Filter out null/undefined to avoid overwriting with null unintentionally if they shouldn't be null
    // But since it's an explicit edit, we can just pass the body directly.
    // However we need to handle empty strings for foreign keys (like ujian_halaqah_id) -> they should be null, not ''.
    const dataToUpdate = { ...body };
    
    if (dataToUpdate.ujian_halaqah_id === '') dataToUpdate.ujian_halaqah_id = null;
    if (dataToUpdate.tashih_halaqah_id === '') dataToUpdate.tashih_halaqah_id = null;
    if (dataToUpdate.partner_type === '') dataToUpdate.partner_type = null;
    if (dataToUpdate.pengabdian_choice === '') dataToUpdate.pengabdian_choice = null;

    const supabase = createServerClient();

    const { error } = await supabase
      .from('daftar_ulang_submissions')
      .update(dataToUpdate)
      .eq('id', id);

    if (error) {
      console.error('[Admin Daftar Ulang Edit API] Update error:', error);
      return ApiResponses.databaseError(error);
    }

    return ApiResponses.success(null, 'Data berhasil diperbarui');
  } catch (error) {
    console.error('[Admin Daftar Ulang Edit API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
