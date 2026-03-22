import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger-secure'
import { getClientIP } from '@/lib/rate-limiter'
import { authSchemas } from '@/lib/schemas'
import { ApiResponses } from '@/lib/api-responses'
import {
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
  sanitizeAddress,
  sanitizeCity,
  sanitizeGeneric
} from '@/lib/utils/sanitize'

/**
 * Update user profile endpoint
 * For authenticated users to update their own profile data
 */
export async function PUT(request: NextRequest) {
  const ip = getClientIP(request)

  try {
    // Verify user is authenticated
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized profile update attempt', {
        ip,
        endpoint: '/api/user/profile/update'
      })
      return NextResponse.json({
        error: 'Unauthorized - Please login first'
      }, { status: 401 })
    }

    // Parse and validate request body
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      return ApiResponses.customValidationError([{
        field: 'body',
        message: 'Invalid request body',
        code: 'INVALID_JSON'
      }])
    }

    // Validate with Zod schema (same as register, but without password and email)
    const validation = authSchemas.register.omit({
      password: true,
      recaptchaToken: true,
      email: true // Email cannot be changed via this endpoint
    }).safeParse({
      ...body,
      email: user.email // Use authenticated user's email
    })

    if (!validation.success) {
      return ApiResponses.validationError(validation.error.issues)
    }

    const validatedData = validation.data

    // Sanitize inputs
    try {
      const sanitizedData = {
        nama_kunyah: validatedData.nama_kunyah ? sanitizeName(validatedData.nama_kunyah) : null,
        full_name: sanitizeName(validatedData.full_name),
        negara: sanitizeCity(validatedData.negara),
        provinsi: validatedData.provinsi ? sanitizeCity(validatedData.provinsi) : null,
        kota: sanitizeCity(validatedData.kota),
        alamat: sanitizeAddress(validatedData.alamat),
        whatsapp: sanitizePhone(validatedData.whatsapp, validatedData.negara),
        telegram: validatedData.telegram ? sanitizePhone(validatedData.telegram, validatedData.negara) : null,
        zona_waktu: sanitizeGeneric(validatedData.zona_waktu, 10),
        tanggal_lahir: validatedData.tanggal_lahir,
        tempat_lahir: validatedData.tempat_lahir,
        jenis_kelamin: validatedData.jenis_kelamin,
        pekerjaan: validatedData.pekerjaan,
        alasan_daftar: validatedData.alasan_daftar
      }

      // Check if user exists in users table
      const supabaseAdmin = createSupabaseAdmin()
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('id', user.id)
        .maybeSingle()

      if (checkError) {
        logger.error('Error checking existing user', {
          userId: user.id.substring(0, 8) + '...',
          error: checkError.message
        })
        return ApiResponses.serverError('Failed to verify user profile')
      }

      if (!existingUser) {
        logger.warn('User not found in database', {
          userId: user.id.substring(0, 8) + '...',
          ip
        })
        return ApiResponses.notFound('User profile not found. Please complete your profile first.')
      }

      // Update user profile
      logger.info('Updating user profile', {
        userId: user.id.substring(0, 8) + '...',
        ip
      })

      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          nama_kunyah: sanitizedData.nama_kunyah,
          full_name: sanitizedData.full_name,
          negara: sanitizedData.negara,
          provinsi: sanitizedData.provinsi,
          kota: sanitizedData.kota,
          alamat: sanitizedData.alamat,
          whatsapp: sanitizedData.whatsapp,
          telegram: sanitizedData.telegram,
          zona_waktu: sanitizedData.zona_waktu,
          tanggal_lahir: sanitizedData.tanggal_lahir,
          tempat_lahir: sanitizedData.tempat_lahir,
          jenis_kelamin: sanitizedData.jenis_kelamin,
          pekerjaan: sanitizedData.pekerjaan,
          alasan_daftar: sanitizedData.alasan_daftar,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('id, email, full_name, roles')
        .single()

      if (updateError) {
        logger.error('Failed to update user profile', {
          userId: user.id.substring(0, 8) + '...',
          error: updateError.message,
          code: updateError.code
        })
        return ApiResponses.serverError(`Failed to update profile: ${updateError.message}`)
      }

      // Also update user metadata in auth
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            full_name: sanitizedData.full_name,
            negara: sanitizedData.negara,
            kota: sanitizedData.kota,
            whatsapp: sanitizedData.whatsapp,
            telegram: sanitizedData.telegram,
            zona_waktu: sanitizedData.zona_waktu,
            tanggal_lahir: sanitizedData.tanggal_lahir,
            tempat_lahir: sanitizedData.tempat_lahir,
            jenis_kelamin: sanitizedData.jenis_kelamin,
            pekerjaan: sanitizedData.pekerjaan,
            alasan_daftar: sanitizedData.alasan_daftar
          }
        })
      } catch (metadataError) {
        logger.warn('Failed to update user metadata', {
          userId: user.id.substring(0, 8) + '...',
          error: metadataError
        })
        // Don't fail the request if metadata update fails
      }

      logger.info('User profile updated successfully', {
        userId: user.id.substring(0, 8) + '...',
        ip
      })

      return ApiResponses.success({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          roles: updatedUser.roles
        }
      }, 'Profil berhasil diperbarui')

    } catch (sanitizeError: any) {
      return ApiResponses.customValidationError([{
        field: 'general',
        message: sanitizeError.message || 'Input tidak valid',
        code: 'SANITIZATION_ERROR'
      }])
    }

  } catch (error) {
    logger.error('Unhandled error in update profile API', {
      error: error as Error,
      ip
    })
    return ApiResponses.serverError('Terjadi kesalahan server. Silakan coba lagi.')
  }
}
