import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger-secure'
import { getClientIP } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase server client to verify authentication
    const supabase = createServerClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Authentication failed', {
        ip: getClientIP(request),
        endpoint: '/api/user/profile'
      });
      return NextResponse.json(
        { error: 'Unauthorized - Please login to access this resource' },
        { status: 401 }
      )
    }

    // Get userId from query params (must match authenticated user)
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')

    if (!requestedUserId) {
      logger.warn('No userId provided in profile request', {
        authenticatedUserId: user.id
      });
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Security check: Users can only access their own profile
    // Admin users can access any profile (add this check if needed)
    if (user.id !== requestedUserId) {
      logger.warn('Unauthorized profile access attempt', {
        ip: getClientIP(request),
        endpoint: '/api/user/profile',
        authenticatedUserId: user.id.substring(0, 8) + '...',
        requestedUserId: requestedUserId.substring(0, 8) + '...'
      });
      return NextResponse.json(
        { error: 'Access denied - You can only access your own profile' },
        { status: 403 }
      )
    }

    // Use authenticated user's ID instead of requested ID for security
    const userId = user.id

    // Check if mobile for optimization
    const userAgent = request.headers.get('user-agent') || ''
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

    logger.debug('Fetching user profile', {
      userId: userId.substring(0, 8) + '...',
      isMobile
    });

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, whatsapp, telegram, alamat, zona_waktu, tanggal_lahir, kota, tempat_lahir, negara, provinsi')
      .eq('id', userId)
      .single()

    if (error) {
      logger.error('Failed to fetch user profile', {
        userId: userId.substring(0, 8) + '...',
        error: error.message
      });
      return NextResponse.json({
        error: 'Failed to fetch user profile'
      }, { status: 500 })
    }

    if (!data) {
      logger.warn('User not found in database', {
        userId: userId.substring(0, 8) + '...'
      });
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

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

    // Add cache headers for better performance
    return NextResponse.json(userProfile, {
      headers: {
        'Cache-Control': 'public, max-age=60', // 1 minute cache for user data
      }
    })

  } catch (error: any) {
    logger.error('Unhandled error in profile API', {
      error: error
    });
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}