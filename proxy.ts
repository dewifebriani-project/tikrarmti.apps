import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Get allowed origins from environment or use defaults
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003',
      process.env.NEXT_PUBLIC_VERCEL_URL && `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`,
      'https://localhost:3003',
      ...(process.env.CORS_ALLOWED_ORIGINS?.split(',') || [])
    ].filter(Boolean);

    const origin = request.headers.get('origin');
    const isAllowedOrigin = origin && allowedOrigins.includes(origin);

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });

      if (isAllowedOrigin || !origin) {
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
      }

      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version'
      );
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
      response.headers.set('Access-Control-Allow-Credentials', 'true');

      return response;
    }

    // Handle actual API requests
    const response = NextResponse.next();

    if (isAllowedOrigin || !origin) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    }

    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version'
    );

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  }

  // For non-API routes, just add security headers
  const response = NextResponse.next();

  // Add security headers for all routes
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add HSTS for HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};