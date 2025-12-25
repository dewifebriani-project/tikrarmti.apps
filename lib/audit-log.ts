import { createSupabaseAdmin } from './supabase';

const supabaseAdmin = createSupabaseAdmin();

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT'
  | 'IMPORT';

export type AuditLevel = 'INFO' | 'WARN' | 'ERROR';

export interface AuditLogParams {
  userId: string;
  action: AuditAction;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  level?: AuditLevel;
}

/**
 * Log admin activity to activity_logs table
 *
 * @example
 * await logAudit({
 *   userId: user.id,
 *   action: 'UPDATE',
 *   resource: 'batches',
 *   details: { batch_id: 'uuid', changes: { status: 'open' } },
 *   ipAddress: request.headers.get('x-forwarded-for'),
 *   userAgent: request.headers.get('user-agent')
 * });
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: params.userId,
        action: params.action,
        resource: params.resource,
        details: params.details || {},
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        level: params.level || 'INFO',
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log audit:', error);
      // Don't throw error - audit logging should not break main functionality
    }
  } catch (err) {
    console.error('Exception in audit logging:', err);
    // Silently fail - audit is important but not critical
  }
}

/**
 * Helper to get client IP from request headers
 */
export function getClientIp(request: Request): string | null {
  // Try different headers in order of preference
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
    'x-cluster-client-ip'
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can be comma-separated list, take first IP
      return value.split(',')[0].trim();
    }
  }

  return null;
}

/**
 * Helper to get user agent from request
 */
export function getUserAgent(request: Request): string | null {
  return request.headers.get('user-agent');
}

/**
 * Create audit log entry for batch operations
 */
export async function auditBatchOperation(
  userId: string,
  action: AuditAction,
  batchId: string,
  batchName: string,
  changes: Record<string, any>,
  request: Request
) {
  await logAudit({
    userId,
    action,
    resource: 'batches',
    details: {
      batch_id: batchId,
      batch_name: batchName,
      changes
    },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    level: 'INFO'
  });
}

/**
 * Create audit log entry for user management operations
 */
export async function auditUserOperation(
  userId: string,
  action: AuditAction,
  targetUserId: string,
  targetUserEmail: string,
  changes: Record<string, any>,
  request: Request
) {
  await logAudit({
    userId,
    action,
    resource: 'users',
    details: {
      target_user_id: targetUserId,
      target_user_email: targetUserEmail,
      changes
    },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    level: 'INFO'
  });
}

/**
 * Create audit log entry for tikrar registration operations
 */
export async function auditTikrarOperation(
  userId: string,
  action: AuditAction,
  registrationId: string,
  applicantEmail: string,
  changes: Record<string, any>,
  request: Request
) {
  await logAudit({
    userId,
    action,
    resource: 'pendaftaran_tikrar_tahfidz',
    details: {
      registration_id: registrationId,
      applicant_email: applicantEmail,
      changes
    },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    level: action === 'APPROVE' || action === 'REJECT' ? 'INFO' : 'INFO'
  });
}

/**
 * Create audit log entry for data export
 */
export async function auditExport(
  userId: string,
  resource: string,
  count: number,
  filters: Record<string, any>,
  request: Request
) {
  await logAudit({
    userId,
    action: 'EXPORT',
    resource,
    details: {
      record_count: count,
      filters,
      exported_at: new Date().toISOString()
    },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    level: 'INFO'
  });
}
