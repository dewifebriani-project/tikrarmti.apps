import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

/**
 * GET /api/muallimah/list
 * 
 * Public list of muallimah for students to select during tashih entry.
 * Restricted to authenticated users.
 */
export async function GET(request: Request) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    if (!batchId) {
      return ApiResponses.validationError([{ message: 'batch_id is required' } as any]);
    }

    // Use admin client to bypass RLS for this specific public list
    // This allows students to see the teachers even if they don't have direct access to muallimah_registrations
    const supabase = createSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('muallimah_registrations')
      .select('id, user_id, full_name, preferred_juz')
      .eq('batch_id', batchId)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('[Muallimah List API] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    return ApiResponses.success(data || []);
  } catch (error) {
    console.error('[Muallimah List API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
