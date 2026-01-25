/**
 * OAuth Debug Utilities
 * Helper functions for debugging OAuth authentication flow
 */

export interface OAuthDebugInfo {
  timestamp: string;
  provider: string;
  step: string;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Log OAuth debug information
 */
export function logOAuthDebug(step: string, data?: Record<string, unknown>, error?: string) {
  const debugInfo: OAuthDebugInfo = {
    timestamp: new Date().toISOString(),
    provider: 'google',
    step,
    data,
    error,
  };

  console.log('[OAuth Debug]', JSON.stringify(debugInfo, null, 2));
}

/**
 * Debug OAuth function - alias for logOAuthDebug
 */
export function debugOAuth(step: string, data?: Record<string, unknown>, error?: string) {
  logOAuthDebug(step, data, error);
}

/**
 * Format error for display
 */
export function formatOAuthError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}
