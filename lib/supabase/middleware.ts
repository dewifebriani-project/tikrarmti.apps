import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Allowed origins for state-changing API requests (CSRF protection). */
const ALLOWED_ORIGINS =
  process.env.NODE_ENV === 'production'
    ? ['https://markaztikrar.id', 'https://www.markaztikrar.id']
    : ['http://localhost:3000', 'http://localhost:3001']

/**
 * Validates the Origin header for mutating API requests to prevent CSRF.
 * Returns true if the request should be blocked.
 */
function isCsrfViolation(request: NextRequest): boolean {
  const method = request.method.toUpperCase()
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return false
  if (!request.nextUrl.pathname.startsWith('/api/')) return false

  const origin = request.headers.get('origin')
  // Requests from same-origin (no Origin header, e.g. server actions) are allowed
  if (!origin) return false

  return !ALLOWED_ORIGINS.includes(origin)
}

/**
 * Updates the user's session and handles cookie persistence.
 * This is called by the main middleware for every request.
 */
export async function updateSession(request: NextRequest) {
  // FAST-PATH FOR DEVELOPMENT: Skip complex middleware logic to ensure stability
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

  // CSRF check — block state-changing requests from unknown origins
  if (isCsrfViolation(request)) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  // Create an initial response

  // Security headers helper (applied to all responses below)
  const applySecurityHeaders = (res: NextResponse) => {
    // Basic security headers for all environments
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Apply strict CSP only in production as Dev Mode requires unsafe-eval/inline
    if (process.env.NODE_ENV === 'production') {
      res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
      res.headers.set('X-DNS-Prefetch-Control', 'off')
      res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
      
      res.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' blob: data: https: https://*.supabase.co https://*.googleusercontent.com; " +
        "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; " +
        "connect-src 'self' http://localhost:* https://*.supabase.co https://markaztikrar.id https://www.markaztikrar.id https://*.sentry.io https://*.google-analytics.com https://api.aladhan.com https://api.bigdatacloud.net https://ipapi.co; " +
        "media-src 'self' blob: https://*.supabase.co; " +
        "frame-src 'self';"
      )
    }
    
    return res
  }

  try {
    // SKIP auth check for auth callback and public auth routes to avoid interference
    if (request.nextUrl.pathname.startsWith('/auth/')) {
      const res = NextResponse.next({ request: { headers: request.headers } })
      return applySecurityHeaders(res)
    }

    // Determine shared domain for cookies
    const host = request.headers.get('host') || ''
    const domain = (host.includes('markaztikrar.id') && !host.includes('localhost')) ? '.markaztikrar.id' : undefined

    // IMPORTANT: Use the official Supabase pattern — response must be recreated
    // inside setAll so that refreshed cookies are forwarded to Server Components
    // via the mutated request object.
    let response = NextResponse.next({ request: { headers: request.headers } })

    // Persistent Session: Force 1-year maxAge for all auth cookies
    const PERSISTENT_MAX_AGE = 60 * 60 * 24 * 365; // 365 days

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
              const finalOptions = {
                ...cookieOptions,
                path: '/',
                maxAge: PERSISTENT_MAX_AGE,
                ...(domain ? { domain } : {}),
              }
              request.cookies.set({ name, value, ...finalOptions })
            })
            // Recreate response with mutated request so Server Components
            // receive the updated cookies in their cookie store
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
              const finalOptions = {
                ...cookieOptions,
                path: '/',
                maxAge: PERSISTENT_MAX_AGE,
                ...(domain ? { domain } : {}),
              }
              response.cookies.set({ name, value, ...finalOptions })
            })
          },
        },
        cookieOptions: {
          path: '/',
          maxAge: PERSISTENT_MAX_AGE,
          ...(domain ? { domain } : {}),
        },
      }
    )

    // Refresh the session (if needed) and validate the user
    // If the token is refreshed, setAll is called and response is recreated above
    await supabase.auth.getUser()

    return applySecurityHeaders(response)
  } catch (err: any) {
    // CRITICAL: If the Supabase library crashes (e.g. Invalid UTF-8 sequence),
    // we catch it here and return a plain response to avoid a 500 error.
    console.error('CRITICAL: Middleware Supabase Crash caught:', err.message);
    
    // Return a fresh response without the problematic state
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}
