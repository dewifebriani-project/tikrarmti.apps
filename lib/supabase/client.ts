import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey } from '../supabase'

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  })
}