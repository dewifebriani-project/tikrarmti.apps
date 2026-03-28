import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'

// Load environment variables
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Helper to get cookie domain for sharing across subdomains (SSR-friendly)
const getCookieDomain = () => {
  try {
    const headersList = headers()
    const host = headersList.get('host') || ''
    if (host.includes('markaztikrar.id')) {
      return '.markaztikrar.id'
    }
  } catch (e) {
    // Falls back to undefined in contexts where headers() isn't available
  }
  return undefined
}

// Server-side client that can read cookies - for API routes, Server Actions, and Server Components
export function createClient(options?: { 
  cookies?: { maxAge?: number },
  response?: NextResponse 
}) {
  const cookieStore = cookies()
  const domain = getCookieDomain()

  return createSupabaseServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
              const finalOptions = {
                ...cookieOptions,
                ...(options?.cookies?.maxAge !== undefined ? { maxAge: options.cookies.maxAge } : {}),
                path: '/',
                // Always use shared domain if available to prevent www mismatch
                ...(domain ? { domain } : {}),
              }

              // 1. Set in the global cookie store (for current request context)
              cookieStore.set(name, value, finalOptions)

              // 2. If a response object was provided (for Route Handlers), set it there too
              if (options?.response) {
                options.response.cookies.set({
                  name,
                  value,
                  ...finalOptions,
                })
              }
            })
          } catch (error: any) {
            // Expected in Server Components
          }
        },
      },
      cookieOptions: {
        name: 'sb-mti-session',
        path: '/',
        ...(domain ? { domain } : {}),
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      }
    }
  )
}

// Alias for ease of migration
export const createServerClient = createClient
