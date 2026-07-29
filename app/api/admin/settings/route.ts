import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'app_is_frozen')
      .maybeSingle()
      
    if (error) throw error
    
    return NextResponse.json({ 
      success: true, 
      is_frozen: data?.value?.frozen === true 
    })
  } catch (error: any) {
    console.error('[Settings API] GET Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { is_frozen } = await req.json()
    
    // Auth Check
    const supabase = createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createSupabaseAdmin()
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (dbError || !userData || !userData.roles?.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert({ 
        key: 'app_is_frozen', 
        value: { frozen: is_frozen },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
      
    if (error) throw error

    return NextResponse.json({ success: true, is_frozen })
  } catch (error: any) {
    console.error('[Settings API] POST Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
  }
}
