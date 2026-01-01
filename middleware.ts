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
  // Supabase SSR uses cookies like: sb-<project-ref>-auth-token
  // We check for any cookie starting with 'sb-' that contains 'auth'
  const cookies = request.cookies.getAll()
  const hasSessionCookie = cookies.some(cookie =>
    cookie.name.startsWith('sb-') && cookie.name.includes('auth')
  )

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Redirect to login if accessing protected route without session cookie
  if (isProtectedRoute && !hasSessionCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing login/register with active session
  // But NOT for auth callback routes or forgot/reset password flows
  const authFlowRoutes = ['/forgot-password', '/reset-password', '/auth/callback', '/auth/confirm']
  const isAuthFlowRoute = authFlowRoutes.some(route => pathname.startsWith(route))

  if (hasSessionCookie && !isAuthFlowRoute && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

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
