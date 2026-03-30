import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'

export default async function LengkapiProfilePage() {
  const supabase = createClient()
  
  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Check if profile already exists
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  // If profile exists, they don't belong here
  if (profile) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Lengkapi Profil Anda</h1>
          <p className="mt-2 text-sm text-gray-600">
            Selamat datang di Markaz Tikrar Indonesia. Sebagai langkah awal, silakan lengkapi data diri Anda.
          </p>
        </div>
        
        <ProfileForm user={user} />
      </div>
    </div>
  )
}
