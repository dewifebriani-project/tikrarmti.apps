import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Load environment variables
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Server-side client that can read cookies - for API routes
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
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            // Determine maxAge: use passed option, or default to 1 week if not session cookie
            // If options.cookies.maxAge is explicitly 0 or undefined, it acts as session cookie
            let maxAge = options?.cookies?.maxAge;
            
            // If no maxAge provided in options, default to 1 week (preserve existing behavior)
            // UNLESS we want a session cookie (maxAge = 0 or undefined explicitly passed)
            // But to preserve backward compatibility:
            if (maxAge === undefined) {
               maxAge = 60 * 60 * 24 * 7; // Default 1 week
            } else if (maxAge === 0) {
               maxAge = undefined; // Session cookie
            }

            cookieStore.set(name, value, {
              ...cookieOptions,
              // SECURITY: Explicit cookie flags
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: maxAge, 
            })
          })
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // Use PKCE flow for better security (must match client-side)
        debug: process.env.NODE_ENV === 'development', // Enable debug in development
      }
    }
  )
}

// Alias for createClient - for backward compatibility
export const createServerClient = createClient

// Client-side client for use in browser components
export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = '❌ Supabase credentials missing:\n' +
      `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}\n` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'MISSING'}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return createSupabaseClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    }
  )
}

// Create a client for authentication operations (login, signup, etc.)
export function createAuthClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = '❌ Supabase credentials missing:\n' +
      `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}\n` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'MISSING'}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    return createSupabaseClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false
        }
      }
    )
  } catch (error) {
    console.error('❌ Failed to create Supabase auth client:', error);
    throw new Error(`Failed to create Supabase auth client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
