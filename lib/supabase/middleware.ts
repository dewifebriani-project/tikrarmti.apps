import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates the user's session and handles cookie persistence.
 * This is called by the main middleware for every request.
 */
export async function updateSession(request: NextRequest) {
  // Create an initial response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // SKIP auth check for auth callback and public auth routes to avoid interference
    if (request.nextUrl.pathname.startsWith('/auth/')) {
      return response
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({
                name,
                value,
                ...options,
              })
              response.cookies.set({
                name,
                value,
                ...options,
              })
            })
          },
        },
        cookieOptions: {
          name: 'sb-mti-session',
        },
      }
    )

    // IMPORTANT: Avoid calling getUser() on every single request if possible
    // for performance, but it's required to refresh the session correctly.
    // We wrap it in try-catch to prevent a malformed cookie from crashing the app.
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // If there's a serious auth error, we might want to clear the session
    if (error) {
      // console.warn('Middleware auth error:', error.message)
    }

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
