import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * MIDDLEWARE HELPER - The Cookie Refresher
 *
 * ARCHITECTURE V3 COMPLIANCE:
 * This function is the ONLY place where auth token refresh happens in middleware.
 *
 * What it does:
 * 1. Creates a Supabase client with custom cookie handlers
 * 2. Calls supabase.auth.getUser() which triggers token refresh if needed
 * 3. Returns a response with updated cookies in Set-Cookie headers
 *
 * Why this is critical:
 * - Server Components can't write cookies (Next.js streaming limitation)
 * - Without this, users will experience logout loops when token expires
 * - Middleware can write cookies via response headers
 *
 * Reference:
 * - arsitektur.md section 6 "Middleware (The Cookie Refresher)"
 * - https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function updateSession(request: NextRequest) {
  // Create a mutable response reference
  // IMPORTANT: We use the same response object throughout to preserve all cookie updates
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read cookie from request
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // Write cookie to both request and response
        // CRITICAL: Do NOT create new response object here - mutate the existing one
        set(name: string, value: string, options: CookieOptions) {
          // Update request cookies (for Server Components to read)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Update response cookies (for browser - this is what persists across requests)
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        // Remove cookie from both request and response
        // CRITICAL: Do NOT create new response object here - mutate the existing one
        remove(name: string, options: CookieOptions) {
          // Update request cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Update response cookies
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // CRITICAL: This call triggers token refresh if needed
  // DO NOT use getSession() - it doesn't validate with Auth server
  // getUser() ensures the token is valid and refreshes if expired
  //
  // The Supabase SSR client will:
  // 1. Check if access token is expired
  // 2. If expired, use refresh token to get new access token
  // 3. Call our cookie handlers above to persist new tokens
  // 4. Return the updated user data
  const { data: { user } } = await supabase.auth.getUser()

  // Optional: Log for debugging in development
  if (process.env.NODE_ENV === 'development' && user) {
    console.log('[Middleware] Session refreshed for user:', user.email)
  }

  // Return response with potentially updated Set-Cookie headers
  // The response.cookies.set() calls above will be serialized to Set-Cookie headers
  return response
}
