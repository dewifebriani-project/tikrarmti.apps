import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin, getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: Request) {
  try {
    // 1. Authorization check - Standardized via requireAdmin
    const authError = await requireAdmin();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized('Unable to get authorization context');

    // Get all stats using admin client (bypasses RLS)
    const stats: any = {
      totalBatches: 0,
      totalPrograms: 0,
      totalHalaqah: 0,
      totalUsers: 0,
      totalThalibah: 0,
      totalMentors: 0,
      pendingRegistrations: 0,
      pendingTikrar: 0
    };

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 8000);
    });

    // Get counts in parallel with timeout protection
    try {
      const promises = [
        // Basic counts
        supabaseAdmin.from('batches').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('programs').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('halaqah').select('*', { count: 'exact', head: true }),

        // User counts
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
        // Role-based counts
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).contains('roles', ['thalibah']),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).contains('roles', ['admin']),

        // Pending counts
        supabaseAdmin.from('pendaftaran').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('pendaftaran_tikrar_tahfidz').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ];

      // Race between the queries and timeout
      const results = await Promise.race([
        Promise.allSettled(promises),
        timeoutPromise
      ]);

      if (Array.isArray(results)) {
        // Extract counts from results
        if (results[0].status === 'fulfilled') stats.totalBatches = results[0].value.count || 0;
        if (results[1].status === 'fulfilled') stats.totalPrograms = results[1].value.count || 0;
        if (results[2].status === 'fulfilled') stats.totalHalaqah = results[2].value.count || 0;
        if (results[3].status === 'fulfilled') stats.totalUsers = results[3].value.count || 0;
        if (results[4].status === 'fulfilled') stats.totalThalibah = results[4].value.count || 0;
        if (results[5].status === 'fulfilled') stats.totalMentors = results[5].value.count || 0;
        if (results[6].status === 'fulfilled') stats.pendingRegistrations = results[6].value.count || 0;
        if (results[7].status === 'fulfilled') stats.pendingTikrar = results[7].value.count || 0;

        // Log any errors for debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const fieldNames = ['batches', 'programs', 'halaqah', 'users', 'thalibah', 'admins', 'pendaftaran', 'tikrar'];
            console.error(`[Admin Stats API] Error getting ${fieldNames[index]} count:`, result.reason);
          }
        });
      }
    } catch (timeoutErr) {
      console.warn('[Admin Stats API] Query timeout after 8s, returning partial data');
    }

    return ApiResponses.success(stats);
  } catch (error) {
    console.error('[Admin Stats API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
