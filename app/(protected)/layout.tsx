import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProtectedClientLayout from './ProtectedClientLayout'
import { validateEnv } from '@/lib/env'

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
  // Create Supabase server client - READ ONLY cookies in Server Component
  // Using the standardized helper to ensure correct cookie name 'sb-mti-session'
  const supabase = createClient()

  // PERFORMANCE OPTIMIZATION: Parallel fetching with smart error handling
  //
  // Strategy:
  // 1. Get session from middleware-refreshed cookies (synchronous, instant)
  // 2. Start BOTH auth validation AND database query in parallel
  // 3. Wait for both to complete using Promise.all()
  // 4. Validate results and redirect if needed
  //
  // This works because:
  // - Middleware already refreshed the session
  // - Session contains user.id we need for DB query
  // - We validate auth result before using data
  // - Reduces total latency by ~40-50% (parallel vs sequential)

  // Get session from cookies (fast, synchronous from middleware-refreshed session)
  const { data: { session } } = await supabase.auth.getSession()

  // If no session at all, redirect immediately
  if (!session?.user?.id) {
    redirect('/login')
  }

  // PARALLEL FETCH: Start both auth validation and DB query simultaneously
  const [authResult, userDataResult] = await Promise.all([
    // Validate session with Supabase Auth server (security critical)
    supabase.auth.getUser(),
    // Fetch user data from database
    // Strategy: 
    // 1. Try by ID (Standard)
    // 2. Fallback to Email (if ID lookup fails/missing)
    supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(async ({ data, error }) => {
        if (!data || error) {
          return supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();
        }
        return { data, error } as any;
      })
  ])

  // Extract results
  const { data: { user }, error: authError } = authResult as any
  const { data: userData, error: userError } = userDataResult as any

  // AUTH GUARD: Redirect to login if no valid session in Supabase Auth
  if (!user || authError) {
    console.error('[ProtectedLayout] Auth error (Unauthenticated):', authError?.message)
    redirect('/login')
  }

  // PROFILE GUARD / FALLBACK: If authenticated with Supabase but missing from 'users' table
  // We allow them in with a synthetic profile and attempt to create a record if missing.
  if (!userData || userError) {
    console.warn('[ProtectedLayout] Profile record missing in database for:', user.email)
    
    // Attempt to create the missing profile record in the background (non-blocking)
    if (user.id && user.email) {
      supabase.from('users').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        role: 'calon_thalibah',
        roles: ['calon_thalibah'],
        created_at: new Date().toISOString(),
      } as any).then(({ error }) => {
        if (error) console.error('[ProtectedLayout] Background profile creation failed:', error.message)
        else console.log('[ProtectedLayout] Background profile created successfully for:', user.email)
      })
    }
  }

  // ROLE PRIORITY HIERARCHY – Ensures most important role is first in UI
  const ROLE_PRIORITY: Record<string, number> = {
    'admin': 1,
    'muallimah': 2,
    'musyrifah': 3,
    'thalibah': 4,
    'calon_thalibah': 5
  }

  const rawRoles = [
    ...(userData?.roles || []),
    userData?.role,
    ...(user.app_metadata?.roles || []),
    user.app_metadata?.role,
    ...(user.user_metadata?.roles || []),
    user.user_metadata?.role
  ].filter(Boolean).map((r: any) => r.toString().toLowerCase()) as string[]
  
  // Unique roles, prioritized (Admin > Muallimah > Musyrifah > Thalibah > Calon)
  const synthesizedRoles = rawRoles.length > 0 
    ? Array.from(new Set(rawRoles)).sort((a, b) => {
        const priorityA = ROLE_PRIORITY[a] || 99
        const priorityB = ROLE_PRIORITY[b] || 99
        return priorityA - priorityB
      })
    : ['calon_thalibah']

  // TEMPORARY DEBUG LOG - WILL APPEAR IN SERVER SIDE CONSOLE
  console.log('DEBUG [ProtectedLayout]:', {
    email: user.email,
    dbRole: userData?.role,
    dbRolesArray: userData?.roles,
    appMetadata: user.app_metadata,
    userMetadata: user.user_metadata,
    finalSynthesized: synthesizedRoles
  })

  // Log roles for debugging
  if (synthesizedRoles.length === 0 || synthesizedRoles.includes('calon_thalibah') && synthesizedRoles.length === 1) {
    if (userData && (userData.role === 'admin' || (userData.roles && userData.roles.includes('admin')))) {
       console.warn('[ProtectedLayout] Admin role detection mismatch! Check data:', {
         userId: user.id,
         dbRole: userData.role,
         dbRoles: userData.roles
       })
    }
  }

  // Pass user data to client components via props
  return (
    <ProtectedClientLayout
      user={{
        id: user.id,
        email: user.email || '',
        full_name: userData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        roles: synthesizedRoles,
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
