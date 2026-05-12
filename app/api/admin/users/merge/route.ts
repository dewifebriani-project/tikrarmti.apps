import { ApiResponses } from '@/lib/api-responses';
import { requireAdmin, getAuthorizationContext } from '@/lib/rbac';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logAudit, getClientIp, getUserAgent } from '@/lib/audit-log';

/**
 * POST /api/admin/users/merge
 * 
 * Merges data from a source user to a target user and deletes the source user.
 * Restricted to admin role.
 */
export async function POST(request: Request) {
  try {
    // 1. Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized('Unable to get authorization context');

    // 2. Parse and validate body
    const { sourceUserId, targetUserId } = await request.json();

    if (!sourceUserId || !targetUserId) {
      return ApiResponses.error('VALIDATION_ERROR', 'Source and Target IDs are required', {}, 400);
    }

    if (sourceUserId === targetUserId) {
      return ApiResponses.error('VALIDATION_ERROR', 'Source and Target must be different', {}, 400);
    }

    const supabase = createSupabaseAdmin();

    // 3. Check if both users exist and get their info for audit log
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', [sourceUserId, targetUserId]);

    if (fetchError || !users || users.length < 2) {
      return ApiResponses.error('NOT_FOUND', 'One or both users not found', {}, 404);
    }

    const sourceUser = users.find(u => u.id === sourceUserId);
    const targetUser = users.find(u => u.id === targetUserId);

    // 4. Execute RPC Merge (Atomic Database Change)
    const { error: rpcError } = await supabase.rpc('merge_users', {
      source_id: sourceUserId,
      target_id: targetUserId
    });

    if (rpcError) {
      console.error('[Admin Merge API] Database Transaction Failed:', {
        code: rpcError.code,
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint
      });
      return ApiResponses.error(
        'DATABASE_ERROR', 
        `Gagal di level database: ${rpcError.message}`, 
        { rpcError }, 
        500
      );
    }

    // 5. Delete from Supabase Auth (Permanent cleanup of login access)
    // We use auth.admin to delete across schemas
    const { error: authErrorDeletion } = await supabase.auth.admin.deleteUser(sourceUserId);
    if (authErrorDeletion) {
      console.warn('[Admin Merge API] Auth deletion warning (user may not have auth record or error occurred):', authErrorDeletion);
      // We don't return error here because the database part (public.users and records) was successful
    }

    // 6. Log Audit Trail
    await logAudit({
      userId: context.userId,
      action: 'UPDATE',
      resource: 'users',
      details: {
        operation: 'merge_user',
        source: { id: sourceUserId, email: sourceUser?.email, name: sourceUser?.full_name },
        target: { id: targetUserId, email: targetUser?.email, name: targetUser?.full_name },
        authDeleted: !authErrorDeletion
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'WARN'
    });

    return ApiResponses.success({ 
      success: true,
      message: `Berhasil menggabungkan data ${sourceUser?.full_name} ke ${targetUser?.full_name}` 
    }, 'Users merged successfully');

  } catch (error) {
    console.error('[Admin Merge API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
