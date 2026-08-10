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
    
    // 1. Get from muallimah_registrations for this batch
    const { data: registrations, error: regError } = await supabase
      .from('muallimah_registrations')
      .select('id, user_id, full_name, preferred_juz')
      .eq('batch_id', batchId);

    if (regError) {
      console.error('[Muallimah List API] Database error (registrations):', regError);
      return ApiResponses.databaseError(regError);
    }

    // 2. Get from users table (anyone with muallimah role)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, roles')
      .contains('roles', ['muallimah']);

    if (usersError) {
      console.error('[Muallimah List API] Database error (users):', usersError);
      return ApiResponses.databaseError(usersError);
    }

    // Merge and deduplicate
    const combinedMap = new Map();

    // Add registered muallimahs first
    if (registrations) {
      for (const reg of registrations) {
        if (reg.user_id) {
          combinedMap.set(reg.user_id, {
            id: reg.id,
            user_id: reg.user_id,
            full_name: reg.full_name,
            preferred_juz: reg.preferred_juz || ''
          });
        }
      }
    }

    // Add active muallimahs from users table if not already added
    if (users) {
      for (const user of users) {
        if (!combinedMap.has(user.id)) {
          combinedMap.set(user.id, {
            id: user.id, // fallback to user id
            user_id: user.id,
            full_name: user.full_name || 'Tanpa Nama',
            preferred_juz: ''
          });
        }
      }
    }

    const finalList = Array.from(combinedMap.values());
    
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
