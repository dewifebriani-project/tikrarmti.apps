import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/perjalanan-saya',
  '/pendaftaran',
  '/alumni',
  '/jurnal-harian',
  '/kelulusan-sertifikat',
  '/tagihan-pembayaran',
  '/tashih',
  '/ujian',
  '/lengkapi-profile',
  '/pengaturan',
  '/seleksi',
  '/admin',
]

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/syarat-ketentuan',
  '/api/auth/callback',
  '/auth/callback',
  '/auth/confirm',
  '/favicon.ico',
]

/**
 * Middleware - REDIRECT ONLY
 *
 * SECURITY ARCHITECTURE:
 * - This middleware ONLY checks for cookie existence
 * - NO Supabase fetch calls (performance & security)
 * - NO session validation (handled by server layout)
 * - Single responsibility: Route protection via redirect
 *
 * Session validation is done in:
 * - app/(protected)/layout.tsx (Server Component)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // API routes handle their own auth - skip middleware
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Check for Supabase session cookies (NOT validation, just existence)
  // Supabase SSR uses cookies like:
  // - sb-<project-ref>-auth-token
  // - sb-refresh-token
  // - sb-refresh-token-fallback
  const cookies = request.cookies.getAll()
  const authCookies = cookies.filter(cookie => {
    const name = cookie.name.toLowerCase()
    return name.startsWith('sb-') ||
           name === 'sb-refresh-token' ||
           name.startsWith('sb-refresh-token')
  })
  const hasSessionCookie = authCookies.length > 0

  // Debug logging
  console.log('[Middleware]', {
    pathname,
    hasSessionCookie,
    authCookieNames: authCookies.map(c => c.name),
    cookieCount: cookies.length
  })

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Redirect to login if accessing protected route without session cookie
  if (isProtectedRoute && !hasSessionCookie) {
    console.log('[Middleware] Redirecting to login (no session cookie)')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // DO NOT redirect to dashboard from login/register
  // Let the protected layout handle session validation properly
  // Cookies can be expired but still present, causing redirect loops
  // Users should be able to access login page even with cookies

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|favicon.ico).*)',
  ],
}
