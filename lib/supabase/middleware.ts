import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates the user's session and handles cookie persistence.
 * This is called by the main middleware for every request.
 */
export async function updateSession(request: NextRequest) {
  // Create an initial response
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  
  // CANONICAL DOMAIN ENFORCEMENT
  // Force www.markaztikrar.id -> markaztikrar.id
  if (host === 'www.markaztikrar.id') {
    const url = new URL(request.url)
    url.hostname = 'markaztikrar.id'
    url.protocol = protocol
    return NextResponse.redirect(url, { status: 301 })
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // SKIP auth check for auth callback and public auth routes to avoid interference
    if (request.nextUrl.pathname.startsWith('/auth/')) {
      return response
    }

    // Determine shared domain for cookies
    const host = request.headers.get('host') || ''
    const domain = (host.includes('markaztikrar.id') && !host.includes('localhost')) ? '.markaztikrar.id' : undefined

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
                ...(domain ? { domain } : {}),
              }
              request.cookies.set({ name, value, ...finalOptions })
              response.cookies.set({ name, value, ...finalOptions })
            })
          },
        },
        cookieOptions: {
          name: 'sb-mti-session',
          path: '/',
          ...(domain ? { domain } : {}),
        },
      }
    )

    // Proactively clear legacy/conflicting cookies if they exist
    const legacyCookies = ['sb-localhost-auth-token', 'sb-markaztikrar-auth-token', 'mti-auth', 'tikrar-mti']
    legacyCookies.forEach(name => {
      if (request.cookies.has(name)) {
        response.cookies.set({ name, value: '', path: '/', maxAge: -1 })
        if (domain) response.cookies.set({ name, value: '', path: '/', domain, maxAge: -1 })
      }
    })

    // Refresh the session (if needed) and validate the user
    // This will trigger setAll if the session was refreshed
    await supabase.auth.getUser()

    return response
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
