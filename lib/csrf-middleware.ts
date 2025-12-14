import { NextRequest, NextResponse } from 'next/server';
import { requiresCSRFProtection, getCSRFTokenFromRequest, validateCSRFToken } from './csrf';

export function withCSRFProtection(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Only check CSRF for state-changing methods
    if (requiresCSRFProtection(request.method)) {
      // Get CSRF token from headers
      const csrfToken = getCSRFTokenFromRequest(request);

      // Get token from cookie
      const cookieToken = request.cookies.get('csrf-token')?.value;

      // Validate tokens
      if (!csrfToken || !cookieToken || !validateCSRFToken(csrfToken, cookieToken)) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
    }

    // If validation passes, proceed with the request
    return handler(request);
  };
}