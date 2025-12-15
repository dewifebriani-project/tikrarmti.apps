import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // These paths should be accessible without authentication
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/pendaftaran', // Allow users to view registration programs without auth
    '/pendaftaran/tikrar-tahfidz', // Allow access to registration form
    '/auth/callback',
    '/syarat-ketentuan',
    '/api/auth',
    '/api/batch',
    '/api/program',
    '/api/health',
    '/_next/static',
    '/favicon.ico',
    '/api/pendaftaran/submit', // Allow submission without auth (will be checked in the route)
    '/api/debug'
  ];

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If it's a public path, continue
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected paths, check authentication using server client
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    // Debug: Log cookies received by middleware
    const requestCookies = request.cookies.getAll();
    const authCookies = requestCookies.filter(c => c.name.includes('sb-') || c.name.includes('auth'));
    console.log('Middleware cookies for path:', pathname, {
      totalCookies: requestCookies.length,
      authCookies: authCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))
    });

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      console.log('Middleware: No valid session found, redirecting to login', { error: error?.message });
      // No valid session, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(url);
    }

    console.log('Middleware: Valid session found for user:', session.user.id);
    // User is authenticated, continue
    return response;
  } catch (error) {
    console.error('Middleware auth error:', error);
    // On error, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|favicon.ico|public).*)',
  ],
};