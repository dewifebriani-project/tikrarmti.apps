import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

export type { Database }

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Admin client creation function (server-side only)
export function createSupabaseAdmin() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceKey || 'placeholder-service-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

