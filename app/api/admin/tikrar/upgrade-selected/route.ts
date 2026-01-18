import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * Upgrade selected users to thalibah role
 * POST /api/admin/tikrar/upgrade-selected
 * Body: { userIds?: string[] } - optional, if not provided upgrades all selected users
 */
export async function POST(request: Request) {
  const supabase = createClient()

  // 1. Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!userData?.roles?.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const { userIds } = await request.json()

    // Get all selected users if userIds not provided
    let usersToUpgrade: any[] = []

    if (userIds && userIds.length > 0) {
      // Get specific users
      const { data: users } = await supabase
        .from('users')
        .select('id, email, full_name, roles')
        .in('id', userIds)

      usersToUpgrade = users || []
    } else {
      // Get all users with 'selected' status in pendaftaran_tikrar_tahfidz
      const { data: registrations } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('user_id, user:users!id(id, email, full_name, roles)')
        .eq('selection_status', 'selected')

      usersToUpgrade = registrations?.map((reg: any) => reg.user) || []
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; email: string; error: string }[],
      alreadyThalibah: [] as string[]
    }

    // Upgrade each user
    for (const user of usersToUpgrade) {
      try {
        // Check if already has thalibah role
        if (user.roles?.includes('thalibah')) {
          results.alreadyThalibah.push(user.email || user.id)
          continue
        }

        // Remove calon_thalibah and add thalibah
        const newRoles = (user.roles || [])
          .filter((r: string) => r !== 'calon_thalibah')

        if (!newRoles.includes('thalibah')) {
          newRoles.push('thalibah')
        }

        // Update both roles (array) and role (varchar) for compatibility
        const { error: updateError } = await supabase
          .from('users')
          .update({
            roles: newRoles,
            role: 'thalibah' // Also update the legacy role column
          })
          .eq('id', user.id)

        if (updateError) {
          results.failed.push({
            id: user.id,
            email: user.email || 'unknown',
            error: updateError.message
          })
        } else {
          results.success.push(user.email || user.id)

          // Log the role change
          await supabase.from('system_logs').insert({
            error_message: `User ${user.email || user.id} upgraded to thalibah`,
            error_name: 'ROLE_UPGRADE',
            context: {
              user_id: user.id,
              email: user.email,
              old_roles: user.roles,
              new_roles: newRoles
            },
            user_id: user.id,
            severity: 'INFO',
            tags: ['thalibah', 'role', 'upgrade', 'manual']
          })
        }
      } catch (error: any) {
        results.failed.push({
          id: user.id,
          email: user.email || 'unknown',
          error: error?.message || 'Unknown error'
        })
      }
    }

    // Revalidate paths to refresh data
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      message: `Upgraded ${results.success.length} users to thalibah`,
      results
    })

  } catch (error: any) {
    console.error('Upgrade selected users error:', error)
    return NextResponse.json({
      error: error?.message || 'Failed to upgrade users'
    }, { status: 500 })
  }
}
