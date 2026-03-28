import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Load environment variables
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Server-side client that can read cookies - for API routes, Server Actions, and Server Components
export function createClient(options?: { cookies?: { maxAge?: number } }) {
  const cookieStore = cookies()

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
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
              cookieStore.set(name, value, {
                ...cookieOptions,
                // Merge custom maxAge if provided
                ...(options?.cookies?.maxAge !== undefined ? { maxAge: options.cookies.maxAge } : {}),
              })
            )
          } catch (error: any) {
            // This can be ignored if you have middleware refreshing user sessions.
            console.log('[Supabase Server] setAll warning (expected in RSC):', error.message);
          }
        },
      },
      cookieOptions: {
        name: 'sb-mti-session',
        // Apply global maxAge if provided
        ...(options?.cookies?.maxAge !== undefined ? { maxAge: options.cookies.maxAge } : {}),
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
