import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logSecurity, getRequestInfo } from '@/lib/logger'

export async function requireAuth(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { ip, userAgent } = getRequestInfo(request)

  if (!user) {
    // Log unauthorized access attempt
    await logSecurity.unauthorizedAccess(
      ip,
      request.url,
      { user_agent: userAgent }
    )

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return user
}

export async function requireAdmin(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { ip, userAgent } = getRequestInfo(request)

  if (!user) {
    // Log unauthorized access attempt
    await logSecurity.unauthorizedAccess(
      ip,
      request.url,
      { resource: 'admin_endpoint', user_agent: userAgent }
    )

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'admin') {
    // Log forbidden access attempt
    await logSecurity.unauthorizedAccess(
      ip,
      request.url,
      {
        user_id: user.id,
        user_role: userData?.role || 'unknown',
        required_role: 'admin',
        user_agent: userAgent
      }
    )

    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  return user
}

// Helper function to get user from request
export async function getUser(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}