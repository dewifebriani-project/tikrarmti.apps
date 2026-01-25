import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import * as Sentry from '@sentry/nextjs';

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

// ============================================================================
// ROBUST ERROR LOGGING - SENTRY + DATABASE INTEGRATION
// ============================================================================

export interface LogErrorContext extends Record<string, any> {
  userId?: string
  userEmail?: string
  userRole?: string | string[]
  function?: string
  requestPath?: string
  requestMethod?: string
  ipAddress?: string
  userAgent?: string
  errorType?: 'runtime' | 'auth' | 'database' | 'validation' | 'network' | 'unknown'
  severity?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
}

/**
 * Robust error logging function
 *
 * Sends error to Sentry AND stores in system_logs table
 *
 * @param error - Error object
 * @param context - Additional context information
 */
export const logError = async (
  error: Error | unknown,
  context: LogErrorContext = {}
): Promise<{ sentryId?: string; dbId?: string }> => {
  // Normalize error
  const errorObj = error instanceof Error ? error : new Error(String(error))
  const errorMessage = errorObj.message
  const errorStack = errorObj.stack
  const errorName = errorObj.name || 'Error'

  // Auto-detect error type
  let errorType: LogErrorContext['errorType'] = context.errorType || 'runtime'
  if (errorMessage?.includes('auth') || errorMessage?.includes('Unauthorized')) {
    errorType = 'auth'
  } else if (errorMessage?.includes('database') || errorMessage?.includes('PG')) {
    errorType = 'database'
  } else if (errorMessage?.includes('validation')) {
    errorType = 'validation'
  } else if (errorMessage?.includes('network') || errorMessage?.includes('fetch')) {
    errorType = 'network'
  }

  // Auto-detect severity
  const severity: LogErrorContext['severity'] = context.severity ||
    (errorType === 'auth' ? 'ERROR' : 'ERROR')

  // Prepare enhanced context
  const enhancedContext: LogErrorContext = {
    ...context,
    errorType,
    severity,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  }

  // Console logging (always)
  console.error(`[ERROR:${errorType}] ${errorMessage}`, {
    name: errorName,
    stack: errorStack,
    context: enhancedContext,
  })

  let sentryId: string | undefined
  let dbId: string | undefined

  // 1. Send to Sentry (if configured)
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV !== 'development') {
    try {
      // Set user context if available
      if (context.userId) {
        Sentry.setUser({
          id: context.userId,
          email: context.userEmail,
          role: Array.isArray(context.userRole) ? context.userRole.join(',') : context.userRole,
        })
      }

      // Capture exception with context
      sentryId = Sentry.captureException(errorObj, {
        level: severity.toLowerCase() as Sentry.SeverityLevel,
        tags: {
          errorType,
          function: context.function || 'unknown',
          requestPath: context.requestPath || 'unknown',
        },
        extra: {
          ...context,
          timestamp: enhancedContext.timestamp,
        },
      })

      // Clear user context after capture
      Sentry.setUser(null)
    } catch (sentryError) {
      console.error('[Sentry] Failed to send error:', sentryError)
    }
  }

  // 2. Store in system_logs table
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Auto-detect supabase.auth.getUser errors
    const isSupabaseGetUserError =
      errorMessage?.toLowerCase().includes('supabase.auth.getuser') ||
      errorMessage?.toLowerCase().includes('getuser()') ||
      context.function?.toLowerCase().includes('getuser')

    // Auto-detect auth errors
    const isAuthError =
      errorType === 'auth' ||
      isSupabaseGetUserError ||
      errorMessage?.toLowerCase().includes('unauthorized') ||
      errorMessage?.toLowerCase().includes('forbidden')

    const { data, error: dbError } = await supabaseAdmin
      .from('system_logs')
      .insert({
        error_message: errorMessage,
        error_name: errorName,
        error_stack: errorStack,
        context: enhancedContext,
        user_id: context.userId || null,
        user_email: context.userEmail || null,
        user_role: context.userRole ? (Array.isArray(context.userRole) ? context.userRole : [context.userRole]) : null,
        request_path: context.requestPath || null,
        request_method: context.requestMethod || null,
        ip_address: context.ipAddress || null,
        user_agent: context.userAgent || null,
        severity,
        error_type: errorType,
        is_auth_error: isAuthError,
        is_supabase_getuser_error: isSupabaseGetUserError,
        environment: process.env.NODE_ENV,
        release_version: process.env.NEXT_PUBLIC_APP_VERSION,
        sentry_event_id: sentryId || null,
        sentry_sent: !!sentryId,
      })
      .select('id')
      .single()

    if (!dbError && data?.id) {
      dbId = data.id
    } else {
      console.warn('[Database] Failed to insert system_log:', dbError)
    }
  } catch (dbError) {
    console.error('[Database] Exception while logging error:', dbError)
  }

  return { sentryId, dbId }
}

/**
 * Convenience function for logging supabase.auth.getUser() errors
 */
export const logAuthGetUserError = async (
  error: Error | unknown,
  context: Omit<LogErrorContext, 'errorType'> = {}
) => {
  return logError(error, {
    ...context,
    errorType: 'auth',
    isSupabaseGetUserError: true,
  })
}

/**
 * Convenience function for logging database errors
 */
export const logDatabaseError = async (
  error: Error | unknown,
  context: Omit<LogErrorContext, 'errorType'> = {}
) => {
  return logError(error, {
    ...context,
    errorType: 'database',
  })
}

/**
 * Convenience function for logging validation errors
 */
export const logValidationError = async (
  error: Error | unknown,
  context: Omit<LogErrorContext, 'errorType'> = {}
) => {
  return logError(error, {
    ...context,
    errorType: 'validation',
    severity: 'WARN',
  })
}

// Legacy error logging function (deprecated - use logError instead)
export const logErrorLegacy = async (error: Error, context?: Record<string, any>) => {
  return logError(error, context)
}

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