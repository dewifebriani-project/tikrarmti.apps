import { createClient } from '@supabase/supabase-js';
import { ApiResponses } from '@/lib/api-responses';
import { requireAdmin, getAuthorizationContext } from '@/lib/rbac';
import { logAudit, getClientIp, getUserAgent } from '@/lib/audit-log';

/**
 * GET /api/admin/users
 *
 * List all users with pagination, search, and filtering.
 * Requires admin role.
 */
export async function GET(request: Request) {
  try {
    // 1. Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized('Unable to get authorization context');

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const pageSize = Math.max(Math.min(parseInt(searchParams.get('pageSize') || '50'), 100), 1);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // WORKAROUND: Use specific settings for supabase client if needed, 
    // but usually createSupabaseAdmin is preferred for admin routes.
    // However, some routes prefer anon key if RLS allows it even for admins 
    // to track the specific admin user in audit logs via session.
    // In this case, we use service role (supabaseAdmin) for full user management.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 3. Build query
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,whatsapp.ilike.%${search}%`);
    }

    if (role && role !== 'all') {
      query = query.contains('roles', [role]);
    }

    if (status && status !== 'all') {
      if (status === 'blacklisted') {
        query = query.eq('is_blacklisted', true);
      } else if (status === 'active') {
        query = query.eq('is_active', true).eq('is_blacklisted', false);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }
    }

    if (sortBy) {
      query = query.order(sortBy as any, { ascending: sortOrder === 'asc' });
    }
    
    query = query.range(from, to);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('[Admin Users API] Query error:', error);
      return ApiResponses.databaseError(error);
    }

    const formattedUsers = users || [];
    const totalCount = count || 0;
    
    console.log('[DEBUG Admin Users API] users data type:', Array.isArray(users) ? 'array' : typeof users);
    console.log('[DEBUG Admin Users API] users length:', users?.length);
    console.log('[DEBUG Admin Users API] count:', count);
    console.log('[DEBUG Admin Users API] from / to:', from, '/', to);

    // 4. Audit log
    await logAudit({
      userId: context.userId,
      action: 'READ',
      resource: 'users',
      details: {
        page,
        pageSize,
        search: search || null,
        role: role || 'all',
        status: status || 'all',
        resultCount: formattedUsers.length,
        totalCount
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return ApiResponses.success({
      users: formattedUsers,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: totalCount ? Math.ceil(totalCount / pageSize) : 0
      }
    });

  } catch (error) {
    console.error('[Admin Users API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
