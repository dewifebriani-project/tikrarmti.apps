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
  // Create initial response that will be mutated if cookies change
  let response = NextResponse.next({
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
        // This ensures Server Components see the updated cookie
        set(name: string, value: string, options: CookieOptions) {
          // Update request cookies (for Server Components)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Create new response with updated cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Update response cookies (for browser)
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        // Remove cookie from both request and response
        remove(name: string, options: CookieOptions) {
          // Update request cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Create new response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
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
  await supabase.auth.getUser()

  // Return response with potentially updated Set-Cookie headers
  return response
}
