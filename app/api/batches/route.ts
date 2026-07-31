import { createSupabaseAdmin } from '@/lib/supabase';
import { ApiResponses } from '@/lib/api-responses';
import { getAuthorizationContext } from '@/lib/rbac';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: Request) {
  try {
    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized();

    const { data, error } = await supabaseAdmin
      .from('batches')
      .select('id, name, status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching batches:', error);
      return ApiResponses.error('FETCH_FAILED', 'Failed to fetch batches');
    }

    return ApiResponses.success(data);
  } catch (error) {
    console.error('Unexpected error fetching batches:', error);
    return ApiResponses.serverError();
  }
}
