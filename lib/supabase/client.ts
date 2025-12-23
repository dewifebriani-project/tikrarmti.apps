import { createBrowserClient } from '@supabase/ssr'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side only client - singleton pattern to prevent multiple instances
// Uses createBrowserClient from @supabase/ssr for proper cookie handling
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
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

  // Use createBrowserClient from @supabase/ssr for proper cookie handling
  // This ensures the client-side auth uses cookies that the server can read
  // IMPORTANT: createBrowserClient automatically handles cookies correctly
  supabaseClient = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // Use PKCE flow for better security
        // No custom storage needed - createBrowserClient handles this internally
      }
    }
  )

  return supabaseClient
}