import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireAnyRole, getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';
import { z } from 'zod';

const dropoutSchema = z.object({
  thalibah_id: z.string().uuid(),
  batch_id: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const authError = await requireAnyRole(['admin', 'musyrifah']);
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    const supabase = createClient();
    const body = await request.json();
    const validatedData = dropoutSchema.parse(body);

    // Update the status in daftar_ulang_submissions
    const { data, error } = await supabase
      .from('daftar_ulang_submissions')
      .update({ 
        status: 'dropout',
        updated_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId
      })
      .eq('user_id', validatedData.thalibah_id)
      .eq('batch_id', validatedData.batch_id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[Musyrifah Dropout API] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    if (!data) {
      return ApiResponses.notFound('Pendaftaran ulang thalibah tidak ditemukan');
    }

    revalidatePath('/presensi-jurnal');

    return ApiResponses.success(data, 'Thalibah berhasil dipindahkan ke status Dropout (DO)');
  } catch (error) {
    console.error('[Musyrifah Dropout API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
