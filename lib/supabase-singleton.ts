import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Singleton instance to prevent multiple clients
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }
      }
    )
  }
  return supabaseClient
}

export const supabase = getSupabaseClient()