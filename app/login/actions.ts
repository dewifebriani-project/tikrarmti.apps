'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function loginAction(formData: { email: string; password: string }) {
  const cookieStore = cookies()

  // Create server client with proper cookie handling
  const { createServerClient } = await import('@supabase/ssr')
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email.toLowerCase().trim(),
    password: formData.password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (!data.session) {
    return { success: false, error: 'No session created' }
  }

  // Check if user exists in users table, create if not
  let { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (userError && userError.code === 'PGRST116') {
    const { error: createError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
        role: data.user.user_metadata?.role || 'calon_thalibah',
        created_at: new Date().toISOString(),
      })

    if (createError) {
      console.error('Error creating user profile:', createError)
    }
  }

  revalidatePath('/dashboard')
  return { success: true, user: data.user }
}
