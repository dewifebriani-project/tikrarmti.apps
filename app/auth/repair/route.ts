import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const newId = formData.get('newId') as string
  
  if (!email || !newId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }
  
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  console.log(`[RepairRoute] Attempting to sync ID for ${email} to ${newId}`)
  
  // 1. Update public.users
  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({ id: newId })
    .eq('email', email)
    
  if (userError) {
    console.error('[RepairRoute] Error updating users table:', userError.message)
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }
  
  // 2. Update pendaftaran_tikrar_tahfidz (if exists and needed)
  await supabaseAdmin
    .from('pendaftaran_tikrar_tahfidz')
    .update({ user_id: newId })
    .eq('email', email)
    
  console.log(`[RepairRoute] Successfully synced ID for ${email}`)
  
  // Redirect back to debug with success
  return NextResponse.redirect(new URL('/debug?success=true', request.url))
}
