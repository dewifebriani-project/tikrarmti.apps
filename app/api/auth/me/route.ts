import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * @deprecated This endpoint is deprecated.
 *
 * MIGRATION GUIDE:
 * Instead of fetching user data via API from client:
 * ❌ const { user } = useAuth() // fetches /api/auth/me
 *
 * Use server-side data fetching:
 * ✅ const { data: { user } } = await supabase.auth.getUser() // in server component
 * ✅ const user = useServerUserData() // from server layout via props
 *
 * USER DATA SHOULD COME FROM:
 * 1. Server layout (app/(protected)/layout.tsx) - fetches and passes to client
 * 2. Server components - fetch directly from Supabase
 * 3. NOT from client-side API calls
 *
 * This endpoint is kept for backward compatibility only.
 * It will be removed in a future version.
 */
export async function GET(request: Request) {
  const startTime = Date.now()

  // Log deprecation warning
  console.warn('[DEPRECATED] /api/auth/me endpoint called. Migration to server-side data fetching recommended.')

  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    // Use the centralized server client
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        },
        authenticated: false
      }, { status: 401 })
    }

    // Fetch user data from database (RLS filtered)
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
      roles: userData?.roles || user.user_metadata?.roles || ['calon_thalibah'],
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

    return NextResponse.json({
      success: true,
      data: userResponse,
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
