import { ApiResponses, HTTP_STATUS } from '@/lib/api-responses'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getOwnerEmails } from '@/lib/env'
import { consolidateRoles } from '@/lib/roles'

// WORKAROUND: Use anon key instead of service role due to Supabase bug
// Service role JWT has wrong project ref in payload
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseWithAnon = createSupabaseClient(supabaseUrl, anonKey, {
  db: { schema: 'public' },
  auth: { autoRefreshToken: false, persistSession: false }
})

interface EnsureUserRequest {
  userId: string
  email?: string
  full_name?: string
  provider?: string
}

/**
 * Ensure User Exists Endpoint
 *
 * Creates or updates a user record in the database.
 * This is called after authentication to ensure the user exists in the users table.
 *
 * NOTE: This endpoint has relaxed validation to ensure users are created
 * even with incomplete metadata. The user should complete their profile later.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as EnsureUserRequest
    const { userId, email, full_name, provider = 'email' } = body

    // Validate required fields
    if (!userId) {
      return ApiResponses.error(
        'VALIDATION_ERROR',
        'userId is required',
        { field: 'userId' },
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Get server client to read auth session (for user metadata)
    const supabase = createClient()

    // Check if user already exists in users table (using anon key with permissive policies)
    const { data: existingUser, error: checkError } = await supabaseWithAnon
      .from('users')
      .select('id, email, role, roles')
      .eq('id', userId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found, which is ok
      console.error('[ensure-user] Error checking existing user:', checkError)
      return ApiResponses.databaseError(checkError)
    }

    if (existingUser) {
      // Migrate from single role to roles array if needed
      const needsMigration = !existingUser.roles || existingUser.roles.length === 0
      if (needsMigration && existingUser.role) {
        const ownerEmails = getOwnerEmails()
        const consolidatedRoles = consolidateRoles(
          [existingUser.role],
          existingUser.email,
          ownerEmails
        )

        const { error: updateError } = await supabaseWithAnon
          .from('users')
          .update({ roles: consolidatedRoles })
          .eq('id', userId)

        if (updateError) {
          console.error('[ensure-user] Failed to migrate roles:', updateError)
        } else {
          console.log('[ensure-user] Successfully migrated roles for user:', userId)
        }
      }

      return ApiResponses.success(
        { existed: true, userId: existingUser.id },
        'User already exists'
      )
    }

    // User doesn't exist, get user metadata from auth session or request body
    const userEmail = email
    if (!userEmail) {
      return ApiResponses.error(
        'VALIDATION_ERROR',
        'email is required for new users',
        { field: 'email' },
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Determine user role(s) - use defaults since we can't access auth.admin
    const ownerEmails = getOwnerEmails()
    const userRole = 'thalibah' // Default role
    const userRoles = consolidateRoles(
      [userRole],
      userEmail,
      ownerEmails
    )

    // Create user in users table (using anon key with permissive policies)
    const { data: newUser, error: insertError } = await supabaseWithAnon
      .from('users')
      .insert({
        id: userId,
        email: userEmail,
        full_name: full_name || userEmail?.split('@')[0] || '',
        role: userRole,
        roles: userRoles,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, full_name, roles, created_at')
      .single()

    if (insertError) {
      console.error('[ensure-user] Error creating user:', insertError)
      return ApiResponses.databaseError(insertError)
    }

    return ApiResponses.success(
      { existed: false, user: newUser },
      'User created successfully',
      HTTP_STATUS.CREATED
    )

  } catch (error) {
    console.error('[ensure-user] Uncaught error:', error)
    return ApiResponses.handleUnknown(error)
  }
}
