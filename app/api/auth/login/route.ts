import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const startTime = Date.now()
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json({
        success: false,
        error: { message: 'Missing tokens' }
      }, { status: 400 })
    }

    console.log('API /api/auth/login - Setting session on server')

    // Get the cookie store to properly set cookies
    const cookieStore = cookies()

    // Create server client and set the session
    const supabase = createClient()

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) {
      console.error('API /api/auth/login - Failed to set session:', error)
      return NextResponse.json({
        success: false,
        error: { message: error.message }
      }, { status: 401 })
    }

    console.log('API /api/auth/login - Session set successfully', {
      userId: data.user?.id,
      elapsed: Date.now() - startTime + 'ms'
    })

    // Verify session was set
    const { data: { session } } = await supabase.auth.getSession()
    console.log('API /api/auth/login - Verification:', {
      hasSession: !!session,
      userId: session?.user?.id
    })

    return NextResponse.json({
      success: true,
      user: data.user,
      elapsed: Date.now() - startTime + 'ms'
    })

  } catch (error) {
    console.error('API /api/auth/login - Error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error' }
    }, { status: 500 })
  }
}
