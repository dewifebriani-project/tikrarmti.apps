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

    // Get basic user profile with roles
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, whatsapp, telegram, alamat, zona_waktu, tanggal_lahir, kota, tempat_lahir, negara, provinsi, nama_kunyah, jenis_kelamin, pekerjaan, alasan_daftar, roles')
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

    // Base user profile
    const userProfile: any = {
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
      nama_kunyah: data.nama_kunyah || '',
      jenis_kelamin: data.jenis_kelamin || '',
      pekerjaan: data.pekerjaan || '',
      alasan_daftar: data.alasan_daftar || '',
      roles: data.roles || [],
      age: age.toString()
    }

    // Get role-specific data
    const userRoles = data.roles || []
    const primaryRole = userRoles[0] || 'calon_thalibah'

    if (primaryRole === 'muallimah') {
      const { data: muallimahData } = await supabase
        .from('muallimah_registrations')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (muallimahData) {
        userProfile.muallimah_profile = {
          id: muallimahData.id,
          education: muallimahData.education || '',
          occupation: muallimahData.occupation || '',
          memorization_level: muallimahData.memorization_level || '',
          memorized_juz: muallimahData.memorized_juz || '',
          preferred_juz: muallimahData.preferred_juz || '',
          teaching_experience: muallimahData.teaching_experience || '',
          teaching_years: muallimahData.teaching_years || '',
          teaching_institutions: muallimahData.teaching_institutions || '',
          preferred_schedule: muallimahData.preferred_schedule || '',
          backup_schedule: muallimahData.backup_schedule || '',
          motivation: muallimahData.motivation || '',
          special_skills: muallimahData.special_skills || '',
          health_condition: muallimahData.health_condition || '',
          tajweed_institution: muallimahData.tajweed_institution || '',
          quran_institution: muallimahData.quran_institution || '',
          teaching_communities: muallimahData.teaching_communities || '',
          memorized_tajweed_matan: muallimahData.memorized_tajweed_matan || '',
          studied_matan_exegesis: muallimahData.studied_matan_exegesis || '',
          examined_juz: muallimahData.examined_juz || '',
          certified_juz: muallimahData.certified_juz || '',
          paid_class_interest: muallimahData.paid_class_interest || '',
          class_type: muallimahData.class_type || '',
          preferred_max_thalibah: muallimahData.preferred_max_thalibah || null,
          status: muallimahData.status || ''
        }
      }
    } else if (primaryRole === 'musyrifah') {
      const { data: musyrifahData } = await supabase
        .from('musyrifah_registrations')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (musyrifahData) {
        userProfile.musyrifah_profile = {
          id: musyrifahData.id,
          education: musyrifahData.education || '',
          occupation: musyrifahData.occupation || '',
          leadership_experience: musyrifahData.leadership_experience || '',
          leadership_years: musyrifahData.leadership_years || '',
          leadership_roles: musyrifahData.leadership_roles || '',
          management_skills: musyrifahData.management_skills || [],
          team_management_experience: musyrifahData.team_management_experience || '',
          preferred_schedule: musyrifahData.preferred_schedule || '',
          backup_schedule: musyrifahData.backup_schedule || '',
          motivation: musyrifahData.motivation || '',
          leadership_philosophy: musyrifahData.leadership_philosophy || '',
          special_achievements: musyrifahData.special_achievements || '',
          status: musyrifahData.status || ''
        }
      }
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