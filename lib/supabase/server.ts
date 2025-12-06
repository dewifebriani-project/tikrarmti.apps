import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Load environment variables with fallback
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('ey') ? 'https://nmbvklixthlqtkkgqnjl.supabase.co' : ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials missing - checking environment variables...')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('NODE_ENV:', process.env.NODE_ENV)
  }

  console.log('✅ Creating Supabase client with URL:', supabaseUrl)
  console.log('🔑 Service key present:', !!supabaseServiceKey)

  return createSupabaseClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}