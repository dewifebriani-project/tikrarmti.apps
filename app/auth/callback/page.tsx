'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Suspense } from 'react';

function AuthCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (error) {
      window.location.replace(`/login?error=${encodeURIComponent(errorDescription || error)}`);
      return;
    }

    const type = searchParams.get('type');
    const supabase = createClient();

    let redirected = false;
    const redirectOnce = (session: any) => {
      if (redirected) return;
      redirected = true;

      // detectSessionInUrl (built into createBrowserClient) already stored the
      // session in browser cookies. Those cookies are sent with every request,
      // so the server can read them directly — no extra set-session call needed.
      if (type === 'recovery') {
        window.location.replace('/reset-password');
      } else {
        window.location.replace('/dashboard');
      }
    };

    // detectSessionInUrl (built into createBrowserClient) auto-exchanges the
    // ?code= param when the client initializes. We just listen for the result.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        redirectOnce(session);
      } else if (event === 'SIGNED_OUT') {
        window.location.replace('/login?error=Authentication+failed');
      }
    });

    // In case detectSessionInUrl already completed before the subscription was set
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirectOnce(session);
      }
    });

    // Timeout fallback: if nothing happens in 10s, redirect to login
    const timeout = setTimeout(() => {
      if (!redirected) {
        window.location.replace('/login?error=Authentication+timeout');
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Mengautentikasi...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-green-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
