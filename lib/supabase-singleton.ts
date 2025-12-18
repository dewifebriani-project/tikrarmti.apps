import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging
// console.log('[Singleton] Environment check:', {
//   supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
//   supabaseAnonKey: supabaseAnonKey ? 'SET' : 'NOT SET'
// })

// Validate environment variables immediately
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Singleton] Missing environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey
  })
  throw new Error('Supabase environment variables are not properly configured. Please check your .env.local file.')
}

// Singleton instance to prevent multiple clients
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    // console.log('[Singleton] Creating new Supabase client instance...')
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // Custom storage key to avoid conflicts
          storageKey: 'mti-auth-token',
          // Enhanced storage with better mobile support
          storage: {
            getItem: (key) => {
              if (typeof window !== 'undefined') {
                try {
                  return localStorage.getItem(key)
                } catch (error) {
                  console.warn('localStorage getItem error:', error)
                  return null
                }
              }
              return null
            },
            setItem: (key, value) => {
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem(key, value)
                } catch (error) {
                  console.warn('localStorage setItem error:', error)
                  // Fallback to sessionStorage if localStorage fails
                  try {
                    sessionStorage.setItem(key, value)
                  } catch (sessionError) {
                    console.error('Storage failed completely:', sessionError)
                  }
                }
              }
            },
            removeItem: (key) => {
              if (typeof window !== 'undefined') {
                try {
                  localStorage.removeItem(key)
                } catch (error) {
                  console.warn('localStorage removeItem error:', error)
                  // Also remove from sessionStorage fallback
                  try {
                    sessionStorage.removeItem(key)
                  } catch (sessionError) {
                    console.error('Storage removal failed:', sessionError)
                  }
                }
              }
            }
          }
        }
      }
    )
  } else {
    // console.log('[Singleton] Using existing Supabase client instance')
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