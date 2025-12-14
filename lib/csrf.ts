import crypto from 'crypto';

// Generate a random CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Validate CSRF token
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false;
  }

  // In production, use a more secure comparison
  if (process.env.NODE_ENV === 'production') {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(sessionToken, 'hex')
    );
  }

  return token === sessionToken;
}

// Get CSRF token from request headers
export function getCSRFTokenFromRequest(request: Request): string | null {
  return request.headers.get('x-csrf-token') ||
         request.headers.get('x-xsrf-token') ||
         null;
}

// Middleware to add CSRF token to response headers
export function addCSRFHeaders(response: Response, token: string): Response {
  response.headers.set('x-csrf-token', token);
  response.headers.set('Access-Control-Expose-Headers', 'x-csrf-token');
  return response;
}

// List of state-changing methods that require CSRF protection
export const STATE_CHANGING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// Check if request requires CSRF protection
export function requiresCSRFProtection(method: string): boolean {
  return STATE_CHANGING_METHODS.includes(method.toUpperCase());
}