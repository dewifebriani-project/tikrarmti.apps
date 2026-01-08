import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Load environment variables
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Server-side client that can read cookies - for API routes
export function createClient() {
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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              // SECURITY: Explicit cookie flags
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
            })
          )
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
