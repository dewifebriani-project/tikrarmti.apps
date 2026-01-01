import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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
 * IMPORTANT: Redirect is handled by middleware, not here.
 * If user reaches here without auth, middleware should have redirected them.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()

  // Create Supabase server client - READ ONLY cookies in Server Component
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  // Get user session - server-side validation
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, return null - middleware should have redirected
  // This is a fallback to prevent errors
  if (!user) {
    return null
  }

  // Fetch user data from database (RLS filtered)
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Pass user data to client components via props
  return (
    <ProtectedClientLayout
      user={{
        id: user.id,
        email: user.email || '',
        full_name: userData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        role: userData?.role || user.user_metadata?.role || 'calon_thalibah',
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
