import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/server'
import { redirect } from 'next/navigation'
import PanelMusyrifahClientLayout from './PanelMusyrifahClientLayout'
import { validateEnv } from '@/lib/env'

// Validate environment on server startup
validateEnv()

/**
 * PANEL MUSYRIFAH LAYOUT – Minimal layout without header/sidebar/footer
 *
 * Similar to (protected)/layout.tsx but with minimal layout
 * Only provides auth guard and minimal container
 */
export default async function PanelMusyrifahLayout({
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
      },
    }
  )

  // Get session from cookies
  const { data: { session } } = await supabase.auth.getSession()

  // If no session at all, redirect immediately
  if (!session?.user?.id) {
    redirect('/login')
  }

  // PARALLEL FETCH: Auth validation and DB query
  const [authResult, userDataResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
  ])

  const { data: { user }, error: authError } = authResult
  const { data: userData, error: userError } = userDataResult

  // AUTH GUARD: Redirect to login if no valid session
  if (!user || authError) {
    console.error('[PanelMusyrifahLayout] Auth error:', authError)
    redirect('/login')
  }

  // Redirect to login if user not found in database
  if (!userData || userError) {
    console.error('[PanelMusyrifahLayout] User data error:', userError)
    redirect('/login')
  }

  // ROLE CHECK: Only musyrifah and admin can access this page
  const roles = userData?.roles || user.user_metadata?.roles || []
  const isMusyrifah = roles.includes('musyrifah')
  const isAdmin = roles.includes('admin')

  if (!isMusyrifah && !isAdmin) {
    redirect('/dashboard')
  }

  // Pass user data to client components via props
  return (
    <PanelMusyrifahClientLayout
      user={{
        id: user.id,
        email: user.email || '',
        full_name: userData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        roles: roles,
        avatar_url: userData?.avatar_url,
        whatsapp: userData?.whatsapp,
        telegram: userData?.telegram,
      }}
    >
      {children}
    </PanelMusyrifahClientLayout>
  )
}
