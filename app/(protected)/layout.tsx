import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ProtectedClientLayout from './ProtectedClientLayout'

// This is a Server Component that validates authentication
// before rendering any protected routes
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()

  // Create Supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session - server-side
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('Protected Layout - Auth check:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
  })

  // Server-side redirect if not authenticated
  if (!user) {
    console.log('Protected Layout - Redirecting to login, no user found')
    redirect('/login')
  }

  // Fetch user data from database for client components
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  console.log('Protected Layout - User authenticated, rendering protected content')

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
