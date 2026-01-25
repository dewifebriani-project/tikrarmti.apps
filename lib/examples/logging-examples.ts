// EXAMPLE: How to use the logging functions
// Import these in your components or API routes

import {
  logAuth,
  logUser,
  logAdmin,
  logSecurity,
  logError,
  logPerformance,
  getRequestInfo
} from '@/lib/logger';
import { getClientIP } from '@/lib/rate-limiter';

// ============= AUTHENTICATION LOGGING EXAMPLES =============

// Login success
export const exampleLoginLogging = async (user: any, request: Request) => {
  const { ip, userAgent } = getRequestInfo(request);

  await logAuth.login(user.id, user.email, ip, userAgent);
};

// Login failed
export const exampleLoginFailedLogging = async (email: string, reason: string, request: Request) => {
  const { ip, userAgent } = getRequestInfo(request);

  await logAuth.loginFailed(email, reason, ip, userAgent);
};

// Password change
export const examplePasswordChangeLogging = async (userId: string, request: Request) => {
  const ip = getClientIP(request);

  await logAuth.passwordChange(userId, ip);
};

// ============= USER ACTION LOGGING EXAMPLES =============

// User registration
export const exampleUserRegistrationLogging = async (user: any, request: Request) => {
  const ip = getClientIP(request);

  await logUser.register(user.id, user.email, user.role, ip);
};

// Profile update
export const exampleProfileUpdateLogging = async (userId: string, changes: any, request: Request) => {
  const ip = getClientIP(request);

  await logUser.profileUpdate(userId, changes, ip);
};

// Role change
export const exampleRoleChangeLogging = async (userId: string, oldRole: string, newRole: string, adminId: string, request: Request) => {
  const ip = getClientIP(request);

  await logUser.roleChange(userId, oldRole, newRole, adminId, ip);
};

// ============= ADMIN ACTION LOGGING EXAMPLES =============

// Create batch
export const exampleBatchCreateLogging = async (admin: any, batchName: string, request: Request) => {
  const ip = getClientIP(request);

  await logAdmin.batchCreate(admin.id, batchName, ip);
};

// Update batch
export const exampleBatchUpdateLogging = async (admin: any, batchId: string, changes: any, request: Request) => {
  const ip = getClientIP(request);

  await logAdmin.batchUpdate(admin.id, batchId, changes, ip);
};

// Delete batch
export const exampleBatchDeleteLogging = async (admin: any, batchId: string, batchName: string, request: Request) => {
  const ip = getClientIP(request);

  await logAdmin.batchDelete(admin.id, batchId, batchName, ip);
};

// User access (admin viewing user data)
export const exampleUserAccessLogging = async (admin: any, targetUserId: string, action: string, request: Request) => {
  const ip = getClientIP(request);

  await logAdmin.userAccess(admin.id, targetUserId, action, ip);
};

// ============= SECURITY LOGGING EXAMPLES =============

// Suspicious activity
export const exampleSuspiciousActivityLogging = async (request: Request, details: any) => {
  const { ip, userAgent } = getRequestInfo(request);

  await logSecurity.suspiciousActivity(ip, details, userAgent);
};

// Rate limit exceeded
export const exampleRateLimitLogging = async (request: Request, endpoint: string) => {
  const { ip, userAgent } = getRequestInfo(request);

  await logSecurity.rateLimitExceeded(ip, endpoint, userAgent);
};

// Unauthorized access attempt
export const exampleUnauthorizedAccessLogging = async (request: Request, resource: string, details?: any) => {
  const { ip, userAgent } = getRequestInfo(request);

  await logSecurity.unauthorizedAccess(ip, resource, { user_agent: userAgent, ...details });
};

// ============= ERROR LOGGING EXAMPLES =============

// API error
export const exampleErrorLogging = async (error: Error, context: any) => {
  await logError(error, {
    endpoint: context.endpoint,
    userId: context.userId,
    ip: context.ip,
    additionalInfo: context.additionalInfo
  });
};

// ============= PERFORMANCE LOGGING EXAMPLES =============

// API response time
export const examplePerformanceLogging = async (endpoint: string, duration: number) => {
  await logPerformance('api_response_time', duration, 'ms', {
    endpoint,
    method: 'POST'
  });
};

// Database query time
export const exampleDBPerformanceLogging = async (query: string, duration: number) => {
  await logPerformance('db_query_time', duration, 'ms', {
    query_type: query,
    database: 'supabase'
  });
};

// ============= EXAMPLE IMPLEMENTATION IN API ROUTE =============

// Example: Enhanced API route with comprehensive logging
export async function exampleAPIHandler(request: Request) {
  const startTime = Date.now();
  const { ip, userAgent } = getRequestInfo(request);

  try {
    // ... your API logic here ...

    // Log performance metric
    const duration = Date.now() - startTime;
    await logPerformance('api_response_time', duration, 'ms', {
      endpoint: '/api/example',
      method: request.method
    });

    // Log admin action if applicable
    // if (user.role === 'admin' && isCreateOperation) {
    //   await logAdmin.batchCreate(user.id, resourceName, ip);
    // }

    return Response.json({ success: true });

  } catch (error) {
    // Log error with context
    await logError(error as Error, {
      endpoint: '/api/example',
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });

    // Log security event if it looks suspicious
    if (isSuspiciousError(error)) {
      await logSecurity.suspiciousActivity(ip, {
        error: (error as Error).message,
        endpoint: '/api/example'
      }, userAgent);
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to detect suspicious errors
function isSuspiciousError(error: any): boolean {
  const suspiciousPatterns = [
    'unauthorized',
    'forbidden',
    'authentication',
    'permission denied',
    'sql injection',
    'xss'
  ];

  const errorMessage = error.message.toLowerCase();
  return suspiciousPatterns.some(pattern => errorMessage.includes(pattern));
}