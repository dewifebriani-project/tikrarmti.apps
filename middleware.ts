import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
  '/syarat-ketentuan',
  '/api/auth/callback',
  '/favicon.ico',
]

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  console.log('MIDDLEWARE - Request:', {
    pathname,
    method: request.method,
    cookieCount: request.cookies.getAll().length,
    timestamp: new Date().toISOString()
  })

  // Skip middleware for static files and public routes
  // IMPORTANT: API routes should skip middleware auth check - they handle auth themselves
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api') ||  // Skip ALL API routes - they handle their own auth
    publicRoutes.some(route => pathname.startsWith(route))
  ) {
    return response
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return response
  }

  console.log('MIDDLEWARE - Protected route detected:', pathname)

  // Create Supabase server client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          console.log('MIDDLEWARE - Cookies getAll:', {
            count: cookies.length,
            names: cookies.map(c => c.name),
            hasSupabase: cookies.some(c => c.name.includes('supabase') || c.name.includes('sb-'))
          })
          return cookies
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, {
              ...options,
              maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
            })
          })
        },
      },
    }
  )

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('MIDDLEWARE - Auth check:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    elapsed: Date.now() - startTime + 'ms'
  })

  // Redirect to login if user is not authenticated
  if (!user) {
    console.log('MIDDLEWARE - Redirecting to login, no user found')
    // Save the intended URL to redirect back after login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  console.log('MIDDLEWARE - User authenticated, allowing access')
  return response
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
