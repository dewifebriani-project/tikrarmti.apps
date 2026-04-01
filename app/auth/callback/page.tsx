'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 as Spinner, Sparkles, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Sedang memverifikasi akses Ukhti...')

  useEffect(() => {
    const supabase = createClient()

    const handleAuth = async () => {
      try {
        // 1. Check for 'code' in query params (PKCE Flow)
        const code = searchParams.get('code')
        const next = searchParams.get('next') || '/dashboard'
        const type = searchParams.get('type')

        console.log('[auth/callback] Initializing verification...')

        if (code) {
          console.log('[auth/callback] Exchanging code for session...')
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('[auth/callback] Exchange error:', exchangeError)
            setStatus('error')
            setMessage(`Gagal memverifikasi: ${exchangeError.message}`)
            return
          }
          
          console.log('[auth/callback] Successful exchange, checking redirect...')
          // Successful exchange
          if (type === 'recovery') {
            router.push('/reset-password')
          } else {
            router.push(next)
          }
          return
        }

        // 2. Check for Hash Fragment (Implicit Flow)
        // Note: Supabase browser client automatically handles hashes on initialization
        // We just need to check the session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('[auth/callback] Session found via hash/auto-detect')
          // Check for recovery type in hash
          const isRecovery = window.location.hash.includes('type=recovery')
          
          if (isRecovery) {
            router.push('/reset-password')
          } else {
            router.push('/dashboard')
          }
          return
        }

        // 3. Listen for the auth event if it's still pending
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
          console.log('[auth/callback] Auth Event Detected:', event)
          
          if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
            subscription.unsubscribe()
            setStatus('success')
            
            if (event === 'PASSWORD_RECOVERY' || window.location.hash.includes('type=recovery')) {
              setMessage('Verifikasi selesai! Mengarahkan ke halaman reset password...')
              router.push('/reset-password')
            } else {
              setMessage('Alhamdulillah! Berhasil masuk, mengarahkan ke dashboard...')
              router.push('/dashboard')
            }
          }
          
          if (event === 'INITIAL_SESSION' && !session && !code) {
             // No session found after initial check and no code to exchange
             // wait a bit longer or fail
             setTimeout(() => {
                if (status === 'loading') {
                   // Final check before failing
                   supabase.auth.getSession().then(({ data: { session: finalSession } }) => {
                      if (!finalSession) {
                        setStatus('error')
                        setMessage('Sesi tidak ditemukan atau link sudah kadaluarsa. Silakan minta link baru.')
                      }
                   })
                }
             }, 3500)
          }
        })

        return () => subscription.unsubscribe()

      } catch (err: any) {
        console.error('[auth/callback] Unexpected error:', err)
        setStatus('error')
        setMessage('Terjadi kesalahan sistem. Silakan coba lagi.')
      }
    }

    handleAuth()
  }, [router, searchParams, status])

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden font-sans">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-green-900/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md glass-premium border-none shadow-2xl relative z-10 rounded-[2.5rem] overflow-hidden animate-fadeInUp">
        <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-8 sm:p-12 text-white items-center flex flex-col text-center relative overflow-hidden">
             {/* Decorative Sparkles */}
             <div className="absolute top-6 left-6 opacity-20">
                <Sparkles className="w-6 h-6 animate-pulse" />
             </div>
             <div className="absolute bottom-6 right-6 opacity-20 rotate-12">
                <Sparkles className="w-8 h-8 animate-pulse text-amber-300" />
             </div>

             <div className={cn(
                "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 border transition-all duration-500",
                status === 'loading' ? "bg-white/10 border-white/20" :
                status === 'success' ? "bg-white/20 border-white/40 scale-110" :
                "bg-red-500/20 border-red-500/40"
             )}>
                {status === 'loading' ? <Spinner className="w-10 h-10 animate-spin text-green-200" /> :
                 status === 'success' ? <CheckCircle className="w-10 h-10 text-white" /> :
                 <AlertCircle className="w-10 h-10 text-red-200" />}
             </div>
             
             <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">
                {status === 'loading' ? 'Verifikasi Akses' :
                 status === 'success' ? 'Verifikasi Sukses' :
                 'Verifikasi Gagal'}
             </h1>
             <p className="text-green-100/60 text-xs sm:text-sm font-medium uppercase tracking-[0.2em]">
                {status === 'loading' ? 'Architecture V3 Security' :
                 status === 'success' ? 'Sesi Teridentifikasi' :
                 'Gagal Autentikasi'}
             </p>
        </div>

        <CardContent className="p-8 sm:p-10 flex flex-col items-center text-center">
             <p className={cn(
                "text-sm sm:text-base font-bold leading-relaxed mb-8",
                status === 'error' ? "text-red-600" : "text-gray-700 font-bold"
             )}>
                {message}
             </p>

             {status === 'error' && (
                <button
                   onClick={() => router.push('/login')}
                   className="w-full h-14 bg-green-900 hover:bg-green-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                >
                   Kembali ke Halaman Login
                </button>
             )}
             
             {status === 'loading' && (
                <div className="flex flex-col items-center gap-3">
                   <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-bounce" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Keamanan Supabase Terenkripsi</p>
                </div>
             )}
        </CardContent>
      </Card>

      <footer className="absolute bottom-8 text-center px-6">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-gray-300">
           Tikrar MTI &copy; 2026 &bull; Authentic Journey
        </p>
      </footer>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-12">
        <Spinner className="w-12 h-12 animate-spin text-green-900" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
