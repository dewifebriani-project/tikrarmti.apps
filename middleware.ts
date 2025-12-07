import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // These paths should be accessible without authentication
  const publicPaths = [
    '/',
    '/login',
    '/register',
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

  // For protected paths, check authentication using cookies
  // Extract the access token from cookies
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;

  if (!accessToken) {
    // No token found, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data: { session }, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    });

    if (error || !session) {
      // No valid session, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(url);
    }

    // User is authenticated, continue
    return NextResponse.next();
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