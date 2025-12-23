import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const startTime = Date.now()
  try {
    // Debug: Log all cookies available to server
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    console.log('API /api/auth/me - Cookies available:', {
      count: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      hasSupabaseSession: allCookies.some(c => c.name.includes('supabase') || c.name.includes('sb-')),
      timestamp: new Date().toISOString()
    })

    // Use the centralized server client that properly handles cookies
    const supabase = createClient()

    // Debug: Log cookies for troubleshooting
    const { data: { session } } = await supabase.auth.getSession()
    console.log('API /api/auth/me - Session check:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      elapsed: Date.now() - startTime + 'ms'
    })

    // Get the current user using the centralized server client
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('API /api/auth/me - Supabase auth result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasError: !!authError,
      errorMessage: authError?.message,
      elapsed: Date.now() - startTime + 'ms'
    })

    if (authError || !user) {
      console.log('API /api/auth/me - Returning 401 Unauthorized, elapsed:', Date.now() - startTime + 'ms')
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        },
        authenticated: false
      }, { status: 401 })
    }

    // Fetch user data from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('Database error:', dbError)
    }

    // Return user info in standardized format
    const userResponse = {
      id: user.id,
      email: user.email,
      full_name: userData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
      role: userData?.role || user.user_metadata?.role || 'calon_thalibah',
      avatar_url: userData?.avatar_url,
      created_at: userData?.created_at || user.created_at,
      whatsapp: userData?.whatsapp,
      telegram: userData?.telegram,
      negara: userData?.negara,
      provinsi: userData?.provinsi,
      kota: userData?.kota,
      alamat: userData?.alamat,
      zona_waktu: userData?.zona_waktu,
      tanggal_lahir: userData?.tanggal_lahir,
      tempat_lahir: userData?.tempat_lahir,
      jenis_kelamin: userData?.jenis_kelamin,
      pekerjaan: userData?.pekerjaan,
      alasan_daftar: userData?.alasan_daftar,
    }

    // Return in standardized API response format with data wrapper
    console.log('API /api/auth/me - Success, elapsed:', Date.now() - startTime + 'ms')
    return NextResponse.json({
      success: true,
      data: userResponse,
      // Also include user key for backwards compatibility
      user: userResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API error in /api/auth/me, elapsed:', Date.now() - startTime + 'ms', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}