import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('[API /user/profile] Request received:', { userId });

    if (!userId) {
      console.error('[API /user/profile] No userId provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Create Supabase client with user's session (RLS-compliant)
    const supabase = createRouteHandlerClient({ cookies })

    // Verify user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('[API /user/profile] No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[API /user/profile] Authenticated user:', session.user.id);

    // Check if mobile for optimization
    const userAgent = request.headers.get('user-agent') || ''
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

    console.log('[API /user/profile] Device type:', isMobile ? 'mobile' : 'desktop');

    // Direct query without timeout complexity - simpler approach
    console.log('[API /user/profile] Querying users table for userId:', userId);

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, whatsapp, telegram, alamat, zona_waktu, tanggal_lahir, kota, tempat_lahir, negara, provinsi')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[API /user/profile] Supabase error:', error);
      return NextResponse.json({
        error: 'Failed to fetch user profile',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    if (!data) {
      console.error('[API /user/profile] No data returned from Supabase');
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    console.log('[API /user/profile] User data fetched successfully:', {
      userId: data.id,
      full_name: data.full_name,
      hasEmail: !!data.email,
      hasWhatsapp: !!data.whatsapp
    });

    // Optimized age calculation
    let age = 0
    if (data?.tanggal_lahir) {
      const birthDate = new Date(data.tanggal_lahir)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }

    // Minimal object creation for better performance
    const userProfile = {
      id: data.id,
      full_name: data.full_name || '',
      email: data.email || '',
      whatsapp: data.whatsapp || '',
      telegram: data.telegram || '',
      alamat: data.alamat || '',
      zona_waktu: data.zona_waktu || '',
      tanggal_lahir: data.tanggal_lahir || null,
      kota: data.kota || '',
      tempat_lahir: data.tempat_lahir || '',
      negara: data.negara || '',
      provinsi: data.provinsi || '',
      age: age.toString()
    }

    console.log('[API /user/profile] Returning user profile:', userProfile);

    // Add cache headers for better performance
    return NextResponse.json(userProfile, {
      headers: {
        'Cache-Control': 'public, max-age=60', // 1 minute cache for user data
      }
    })

  } catch (error: any) {
    console.error('[API /user/profile] Unhandled error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}