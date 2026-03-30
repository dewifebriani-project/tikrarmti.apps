import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side only client - singleton pattern to prevent multiple instances
// Uses createBrowserClient from @supabase/ssr for proper cookie handling
let supabaseClient: any = null

export function createClient() {
  if (typeof window === 'undefined') {
    return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  if (supabaseClient) {
    return supabaseClient
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = '❌ Supabase credentials missing:\n' +
      `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}\n` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'MISSING'}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Determine shared domain for cookies
  const isProd = typeof window !== 'undefined' && window.location.hostname.includes('markaztikrar.id');
  const domain = isProd ? '.markaztikrar.id' : undefined;

  // Use createBrowserClient from @supabase/ssr for proper cookie handling
  // This ensures the client-side auth uses cookies that the server can read
  supabaseClient = createSupabaseBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookieOptions: {
        path: '/',
        ...(domain ? { domain } : {}),
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    }
  )

  return supabaseClient
}