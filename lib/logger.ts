import { createServerClient } from '@/lib/supabase/server';

export interface LogEntry {
  user_id?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
}

// Activity logging for audit trail
export async function logActivity(entry: Omit<LogEntry, 'timestamp'>) {
  try {
    const supabase = createServerClient();

    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // In development, also log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ACTIVITY] ${logEntry.level}: ${logEntry.action} on ${logEntry.resource}`, {
        user_id: logEntry.user_id,
        details: logEntry.details,
      });
    }

    // Store in database for audit trail
    // Only attempt to insert if supabase client is available
    if (supabase) {
      try {
        await supabase
          .from('activity_logs')
          .insert(logEntry);
      } catch (dbError) {
        // Don't fail if logging fails
        console.warn('Failed to save activity log to database:', dbError);
      }
    }

    // Alternatively, send to external logging service
    // await sendToLoggingService(logEntry);

  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to avoid breaking the main flow
  }
}

// Specific logging functions
export const logAuth = {
  login: async (userId: string, email: string, ip: string, userAgent?: string) => {
    await logActivity({
      user_id: userId,
      action: 'LOGIN',
      resource: 'auth',
      details: { email },
      ip_address: ip,
      user_agent: userAgent,
      level: 'INFO',
    });
  },

  logout: async (userId: string, ip: string) => {
    await logActivity({
      user_id: userId,
      action: 'LOGOUT',
      resource: 'auth',
      ip_address: ip,
      level: 'INFO',
    });
  },

  loginFailed: async (email: string, reason: string, ip: string, userAgent?: string) => {
    await logActivity({
      action: 'LOGIN_FAILED',
      resource: 'auth',
      details: { email, reason },
      ip_address: ip,
      user_agent: userAgent,
      level: 'WARN',
    });
  },

  passwordChange: async (userId: string, ip: string) => {
    await logActivity({
      user_id: userId,
      action: 'PASSWORD_CHANGE',
      resource: 'auth',
      ip_address: ip,
      level: 'INFO',
    });
  },

  accountLocked: async (email: string, reason: string, ip: string) => {
    await logActivity({
      action: 'ACCOUNT_LOCKED',
      resource: 'auth',
      details: { email, reason },
      ip_address: ip,
      level: 'WARN',
    });
  },
};

export const logUser = {
  profileUpdate: async (userId: string, changes: Record<string, any>, ip: string) => {
    await logActivity({
      user_id: userId,
      action: 'PROFILE_UPDATE',
      resource: 'user',
      details: { fields: Object.keys(changes) },
      ip_address: ip,
      level: 'INFO',
    });
  },

  register: async (userId: string, email: string, role: string, ip: string) => {
    await logActivity({
      user_id: userId,
      action: 'REGISTER',
      resource: 'user',
      details: { email, role },
      ip_address: ip,
      level: 'INFO',
    });
  },

  roleChange: async (userId: string, oldRole: string, newRole: string, changedBy: string, ip: string) => {
    await logActivity({
      user_id: userId,
      action: 'ROLE_CHANGE',
      resource: 'user',
      details: { old_role: oldRole, new_role: newRole, changed_by: changedBy },
      ip_address: ip,
      level: 'WARN',
    });
  },
};

export const logAdmin = {
  batchCreate: async (adminId: string, batchName: string, ip: string) => {
    await logActivity({
      user_id: adminId,
      action: 'CREATE',
      resource: 'batch',
      details: { batch_name: batchName },
      ip_address: ip,
      level: 'INFO',
    });
  },

  batchUpdate: async (adminId: string, batchId: string, changes: Record<string, any>, ip: string) => {
    await logActivity({
      user_id: adminId,
      action: 'UPDATE',
      resource: 'batch',
      details: { batch_id: batchId, fields: Object.keys(changes) },
      ip_address: ip,
      level: 'INFO',
    });
  },

  batchDelete: async (adminId: string, batchId: string, batchName: string, ip: string) => {
    await logActivity({
      user_id: adminId,
      action: 'DELETE',
      resource: 'batch',
      details: { batch_id: batchId, batch_name: batchName },
      ip_address: ip,
      level: 'WARN',
    });
  },

  programCreate: async (adminId: string, programName: string, batchId: string, ip: string) => {
    await logActivity({
      user_id: adminId,
      action: 'CREATE',
      resource: 'program',
      details: { program_name: programName, batch_id: batchId },
      ip_address: ip,
      level: 'INFO',
    });
  },

  userAccess: async (adminId: string, targetUserId: string, action: string, ip: string) => {
    await logActivity({
      user_id: adminId,
      action: 'USER_ACCESS',
      resource: 'admin',
      details: { target_user_id: targetUserId, admin_action: action },
      ip_address: ip,
      level: 'WARN',
    });
  },
};

export const logSecurity = {
  suspiciousActivity: async (ip: string, details: Record<string, any>, userAgent?: string) => {
    await logActivity({
      action: 'SUSPICIOUS_ACTIVITY',
      resource: 'security',
      details,
      ip_address: ip,
      user_agent: userAgent,
      level: 'ERROR',
    });
  },

  rateLimitExceeded: async (ip: string, endpoint: string, userAgent?: string) => {
    await logActivity({
      action: 'RATE_LIMIT_EXCEEDED',
      resource: 'security',
      details: { endpoint },
      ip_address: ip,
      user_agent: userAgent,
      level: 'WARN',
    });
  },

  unauthorizedAccess: async (ip: string, resource: string, details?: Record<string, any>) => {
    await logActivity({
      action: 'UNAUTHORIZED_ACCESS',
      resource: 'security',
      details: { protected_resource: resource, ...details },
      ip_address: ip,
      level: 'ERROR',
    });
  },
};

// Error logging
export const logError = async (error: Error, context?: Record<string, any>) => {
  try {
    console.error('[ERROR]', error.message, {
      stack: error.stack,
      context,
    });

    // Send to error tracking service (e.g., Sentry, LogRocket)
    /*
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, { extra: context });
    }
    */

    // Or store in database
    try {
      const supabase = createServerClient();
      await supabase
        .from('error_logs')
        .insert({
          message: error.message,
          stack: error.stack,
          context,
        });
    } catch (dbError) {
      console.warn('Failed to save error log to database:', dbError);
    }
  } catch (e) {
    console.error('Failed to log error:', e);
  }
};

// Performance monitoring
export const logPerformance = async (metric: string, value: number, unit: string, context?: Record<string, any>) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${metric}: ${value}${unit}`, context);
    }

    // Send to monitoring service (e.g., DataDog, New Relic)
    // monitoringService.gauge(metric, value, { tags: context });
  } catch (error) {
    console.error('Failed to log performance:', error);
  }
};

// Helper to get client info from request
export function getRequestInfo(request: Request) {
  return {
    ip: request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1',
    userAgent: request.headers.get('user-agent') || undefined,
  };
}