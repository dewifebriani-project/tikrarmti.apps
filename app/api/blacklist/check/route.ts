import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger-secure'
import { getClientIP } from '@/lib/rate-limiter'
import { ApiResponses } from '@/lib/api-responses'

/**
 * GET /api/blacklist/check
 * Check if a phone number or email is blacklisted
 * Can be called during registration to prevent blacklisted users from registering
 */
export async function GET(request: NextRequest) {
  const ip = getClientIP(request)

  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')

    // At least one parameter is required
    if (!phone && !email) {
      return ApiResponses.validationError([
        { field: 'phone', message: 'Either phone or email parameter is required' }
      ])
    }

    const supabaseAdmin = createSupabaseAdmin()

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select('id, email, whatsapp, full_name, blacklist_reason, blacklisted_at')
      .eq('is_blacklisted', true)

    // Add filters
    if (phone && email) {
      query = query.or(`whatsapp.eq.${phone},email.eq.${email}`)
    } else if (phone) {
      query = query.eq('whatsapp', phone)
    } else if (email) {
      query = query.eq('email', email)
    }

    const { data, error } = await query.limit(1)

    if (error) {
      logger.error('Failed to check blacklist status', {
        error: error.message,
        phone,
        email,
        ip
      })
      // Don't expose error details to potential attackers
      return NextResponse.json({
        isBlacklisted: false,
        message: 'Unable to verify blacklist status'
      })
    }

    // If any matching blacklisted user found
    if (data && data.length > 0) {
      logger.info('Blacklist check positive', {
        phone,
        email,
        matchedUser: data[0].email,
        ip
      })

      return NextResponse.json({
        isBlacklisted: true,
        message: 'This phone number or email has been blacklisted from registering',
        blacklistedUser: {
          email: data[0].email,
          reason: data[0].blacklist_reason,
          blacklistedAt: data[0].blacklisted_at
        }
      })
    }

    return NextResponse.json({
      isBlacklisted: false,
      message: 'No blacklist found for this phone or email'
    })

  } catch (error) {
    logger.error('Unhandled error in blacklist check API', {
      error: error as Error,
      ip
    })
    // Don't expose error details to potential attackers
    return NextResponse.json({
      isBlacklisted: false,
      message: 'Unable to verify blacklist status'
    })
  }
}
