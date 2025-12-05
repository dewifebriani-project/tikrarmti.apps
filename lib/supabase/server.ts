import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase credentials missing. Using placeholder values.')
  }

  return createSupabaseClient(
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