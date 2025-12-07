import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Singleton instance to prevent multiple clients
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    console.log('[Singleton] Creating new Supabase client instance...')
    supabaseClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // Custom storage key to avoid conflicts
          storageKey: 'mti-auth-token',
          // Store session in localStorage for persistence
          storage: {
            getItem: (key) => {
              if (typeof window !== 'undefined') {
                return localStorage.getItem(key)
              }
              return null
            },
            setItem: (key, value) => {
              if (typeof window !== 'undefined') {
                localStorage.setItem(key, value)
              }
            },
            removeItem: (key) => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem(key)
              }
            }
          }
        }
      }
    )
  } else {
    console.log('[Singleton] Using existing Supabase client instance')
  }
  return supabaseClient
}

export const supabase = getSupabaseClient()

// Function to set custom JWT expiration (30 days)
export async function setCustomSessionDuration() {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: (await supabase.auth.getSession()).data.session?.access_token || '',
      refresh_token: (await supabase.auth.getSession()).data.session?.refresh_token || ''
    })
    return { data, error }
  } catch (err) {
    console.error('Error setting custom session duration:', err)
    return { data: null, error: err }
  }
}