import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProtectedClientLayout from './ProtectedClientLayout'
import { validateEnv, getOwnerEmails } from '@/lib/env'
import {
  extractRoles,
  getPrimaryRole,
  getRoleRank,
  consolidateRoles,
  isAdmin,
  ADMIN_RANK,
  STAFF_RANK_THRESHOLD
} from '@/lib/roles'

// Validate environment on server startup
validateEnv()

/**
 * PROTECTED LAYOUT – Server Component Auth Guard
 *
 * SECURITY ARCHITECTURE:
 * - Validates session on server-side
 * - Fetches user data with RLS applied
 * - Passes user data to client via props (no API calls)
 * - Single source of truth for authenticated user data
 *
 * Session validation happens here, NOT in middleware.
 * Authorization happens via RLS policies, NOT client-side checks.
 *
 * IMPORTANT: This is the AUTH GUARD - redirects to login if no valid session
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // 1. SESSION GUARD: Ensure user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[ProtectedLayout] Auth error:', authError?.message)
    redirect('/login')
  }

  // 2. PROFILE FETCH: Get user data from database
  // Use limit(1) instead of maybeSingle() to prevent crash on data integrity issues (duplicates)
  let { data: usersData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .limit(1)
    
  let userData = usersData?.[0] || null;

  // Fallback: If not found by ID, try fetching by email (robustness for ID mismatches)
  if (!userData && user.email) {
    const { data: emailUsers } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .limit(1)

    if (emailUsers && emailUsers.length > 0) {
      userData = emailUsers[0]
      console.log(`[ProtectedLayout] User found by email fallback: ${user.email}`)
    }
  }

  // 3. ROLE SYNTHESIS: Rank-based primary role detection from DATABASE ONLY
  // Consolidate roles from database with owner fallback (from environment)
  const ownerEmails = getOwnerEmails()
  // Include both the new 'roles' array and the legacy 'role' string
  const rawRoles = [...(userData?.roles || [])];
  if (userData?.role) rawRoles.push(userData.role);
  const dbRoles = extractRoles(rawRoles)

  // Consolidate all roles with owner fallback
  // Note: Deprecated 'role' field is no longer used - only 'roles' array
  const distinctRoles = consolidateRoles(dbRoles, user.email, ownerEmails)

  // Get primary role (highest rank)
  const primaryRole = getPrimaryRole(distinctRoles)
  const primaryRank = getRoleRank(primaryRole)

  // Normalize primary role for client (ensure it's one of the valid roles)
  // Map to the actual primary role from the 5-tier system
  const normalizedRole = distinctRoles.includes(primaryRole) ? primaryRole : 'calon_thalibah'

  // FREEZE APPLICATION GUARD:
  // Check if the app is frozen (maintenance mode)
  const { data: freezeSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'app_is_frozen')
    .maybeSingle()
    
  if (freezeSetting && freezeSetting.value?.frozen) {
    if (primaryRank < ADMIN_RANK) {
      console.log('[ProtectedLayout] App is frozen. Redirecting non-admin to /maintenance')
      redirect('/maintenance')
    }
  }

  // 4. PROFILE COMPLETION GUARD:
  // If no database record exists, redirect to profile completion (unless Admin/Staff)
  // We check primaryRank >= STAFF_RANK_THRESHOLD to allow Admin/Staff to bypass
  if (!userData && primaryRank < STAFF_RANK_THRESHOLD) {
    console.log('[ProtectedLayout] Profile incomplete. Redirecting to /lengkapi-profile')
    redirect('/lengkapi-profile')
  }

  // Log synthesis for server-side debugging
  console.log(`[ProtectedLayout] ${user.email} -> Primary: ${normalizedRole} (Rank: ${primaryRank}) Roles: ${distinctRoles.join(', ')}`)

  return (
    <ProtectedClientLayout
      user={{
        id: user.id,
        email: user.email || '',
        full_name: userData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        primaryRole: normalizedRole,
        roles: distinctRoles,
        avatar_url: userData?.avatar_url,
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
      }}
    >
      {children}
    </ProtectedClientLayout>
  )
}
