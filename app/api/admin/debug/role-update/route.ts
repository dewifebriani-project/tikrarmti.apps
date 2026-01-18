import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Debug endpoint to test role update directly
 * GET /api/admin/debug/role-update?userId=USER_ID
 */
export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
    }

    // Get current user state
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, email, full_name, role, roles')
      .eq('id', userId)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Try to update
    const newRoles = (currentUser.roles || [])
      .filter((r: string) => r !== 'calon_thalibah')
    if (!newRoles.includes('thalibah')) {
      newRoles.push('thalibah')
    }

    const updateData = {
      roles: newRoles,
      role: 'thalibah'
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({
        error: updateError.message,
        details: updateError,
        hint: 'This might be an RLS policy issue',
        currentState: currentUser,
        attemptedUpdate: updateData
      }, { status: 500 })
    }

    // Verify the update
    const { data: verifyUser } = await supabase
      .from('users')
      .select('id, email, role, roles, updated_at')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      success: true,
      before: currentUser,
      after: updatedUser,
      verify: verifyUser,
      updateData
    })

  } catch (error: any) {
    console.error('Debug role update error:', error)
    return NextResponse.json({
      error: error?.message || 'Failed to debug role update',
      stack: error?.stack
    }, { status: 500 })
  }
}
