import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'

const supabaseAdmin = createSupabaseAdmin()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, email, full_name, provider = 'email' } = body

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required'
      }, { status: 400 })
    }

    // Check if user already exists in users table
    // Use maybeSingle() to avoid error when no rows returned
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({
        success: true,
        existed: true,
        message: 'User already exists'
      })
    }

    // User doesn't exist, create it using data from Supabase auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError || !authUser?.user) {
      return NextResponse.json({
        success: false,
        error: 'User not found in Supabase auth'
      }, { status: 404 })
    }

    const userMetadata = authUser.user.user_metadata || {}
    const userEmail = authUser.user.email

    // Validate that user metadata has all required fields before creating user
    // IMPORTANT: Users should go through proper registration flow via /auth/register
    // This endpoint should NOT create users with incomplete data
    const requiredMetadataFields = {
      tanggal_lahir: userMetadata.tanggal_lahir,
      tempat_lahir: userMetadata.tempat_lahir,
      pekerjaan: userMetadata.pekerjaan,
      alasan_daftar: userMetadata.alasan_daftar,
      jenis_kelamin: userMetadata.jenis_kelamin,
      negara: userMetadata.negara
    }

    const missingMetadata = Object.entries(requiredMetadataFields)
      .filter(([_, value]) => !value)
      .map(([field, _]) => field)

    if (missingMetadata.length > 0) {
      console.warn('Cannot create user - missing required metadata:', {
        userId,
        missingMetadata
      })
      return NextResponse.json({
        success: false,
        error: `User profile incomplete. Please complete registration first. Missing fields: ${missingMetadata.join(', ')}`,
        code: 'INCOMPLETE_METADATA',
        redirect: '/auth/register'
      }, { status: 400 })
    }

    // Create user in users table with validated metadata
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: userEmail,
        full_name: full_name || userMetadata.full_name || userEmail?.split('@')[0] || '',
        role: userMetadata.role || 'calon_thalibah',
        whatsapp: userMetadata.whatsapp,
        telegram: userMetadata.telegram,
        negara: userMetadata.negara,
        provinsi: userMetadata.provinsi,
        kota: userMetadata.kota,
        alamat: userMetadata.alamat,
        zona_waktu: userMetadata.zona_waktu || 'WIB',
        jenis_kelamin: userMetadata.jenis_kelamin,
        tanggal_lahir: userMetadata.tanggal_lahir,
        tempat_lahir: userMetadata.tempat_lahir,
        pekerjaan: userMetadata.pekerjaan,
        alasan_daftar: userMetadata.alasan_daftar,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user in users table:', insertError)
      return NextResponse.json({
        success: false,
        error: insertError.message,
        details: insertError.details
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      existed: false,
      user: newUser,
      message: 'User created successfully'
    })

  } catch (error) {
    console.error('Error in ensure-user endpoint:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
