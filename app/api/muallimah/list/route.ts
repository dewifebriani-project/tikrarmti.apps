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
    const supabase = createSupabaseAdmin();
    
    // Get from muallimah_akads for this batch to ensure we only get active teachers for this specific batch
    const { data: akads, error } = await supabase
      .from('muallimah_akads')
      .select('id, user_id, preferred_juz, status, user:users!muallimah_akads_user_id_fkey(full_name)')
      .eq('batch_id', batchId)
      .eq('status', 'approved');

    if (error) {
      console.error('[Muallimah List API] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    // Format the response to match what the frontend expects
    const finalList = (akads || []).map(akad => ({
      id: akad.id,
      user_id: akad.user_id,
      full_name: (akad.user as any)?.full_name || 'Tanpa Nama',
      preferred_juz: akad.preferred_juz || ''
    }));

    // Sort alphabetically
    finalList.sort((a, b) => {
      const nameA = (a.full_name || '').toLowerCase();
      const nameB = (b.full_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return ApiResponses.success(finalList);
  } catch (error) {
    console.error('[Muallimah List API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
