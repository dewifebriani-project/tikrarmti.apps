import { NextResponse } from 'next/server';
import { ApiResponses } from '@/lib/api-responses';
import { requireAdmin, getAuthorizationContext } from '@/lib/rbac';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;
    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    const batchId = params.id;
    if (!batchId) return ApiResponses.customValidationError([{ field: 'batch_id', message: 'Batch ID required', code: 'REQUIRED' }]);

    const body = await request.json();
    const { whatsapp_group_link, group_reminder_link, group_diskusi_link } = body;

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from('batches')
      .update({
        whatsapp_group_link: whatsapp_group_link || null,
        group_reminder_link: group_reminder_link || null,
        group_diskusi_link: group_diskusi_link || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId);

    if (error) {
      console.error('Error updating communication links:', error);
      return ApiResponses.serverError('Failed to update communication links');
    }

    return ApiResponses.success({ success: true }, 'Berhasil menyimpan pengaturan link komunikasi');
  } catch (error) {
    console.error('Error in communication links API:', error);
    return ApiResponses.serverError('Internal server error');
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const batchId = params.id;
    if (!batchId) return ApiResponses.customValidationError([{ field: 'batch_id', message: 'Batch ID required', code: 'REQUIRED' }]);

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('batches')
      .select('whatsapp_group_link, group_reminder_link, group_diskusi_link')
      .eq('id', batchId)
      .single();

    if (error) {
      console.error('Error fetching communication links:', error);
      return ApiResponses.serverError('Failed to fetch communication links');
    }

    return ApiResponses.success(data);
  } catch (error) {
    console.error('Error in communication links API:', error);
    return ApiResponses.serverError('Internal server error');
  }
}
