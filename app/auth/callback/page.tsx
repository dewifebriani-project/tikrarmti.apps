'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-singleton';
import { Crown } from "lucide-react";
import { debugOAuth } from '@/lib/oauth-debug';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isHandled = false;
    const handleCallback = async () => {
      // Prevent multiple executions
      if (isHandled) return;
      isHandled = true;

      // Log callback initiation with all URL details
      debugOAuth('Callback Initiated', {
        currentUrl: window.location.href,
        searchParams: Object.fromEntries(searchParams.entries()),
        hash: window.location.hash,
        origin: window.location.origin
      });

      try {
        setLoading(true);

        // Check for errors in URL first
        const error = searchParams.get('error');
        if (error) {
          debugOAuth('Callback Error', { error });
          setError(`Authentication error: ${error}`);
          setLoading(false);
          return;
        }

        // Check for authorization code (PKCE flow)
        const code = searchParams.get('code');

        if (code) {
          console.log('Found authorization code, exchanging for session...');

          // Exchange code for session using PKCE
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError);
            setError(`Failed to authenticate: ${exchangeError.message}`);
            setLoading(false);
            return;
          }

          if (!exchangeData.session?.user?.email) {
            setError('Authentication failed. No user email found.');
            setLoading(false);
            return;
          }

          // Session is now set, ensure user exists in database before redirect
          const userEmail = exchangeData.session.user.email;
          const userId = exchangeData.session.user.id;
          const fullName = exchangeData.session.user.user_metadata?.full_name || exchangeData.session.user.user_metadata?.name;

          console.log('User authenticated:', userEmail);

          // Ensure user exists in database BEFORE redirect
          try {
            await fetch('/api/auth/ensure-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, email: userEmail, full_name: fullName })
            });
          } catch (err) {
            console.error('Failed to ensure user:', err);
            // Continue anyway - user might already exist
          }

          sessionStorage.removeItem('oauth_from_localhost');
          console.log('Redirecting to dashboard...');

          // Redirect after ensuring user exists
          window.location.replace('/dashboard');
          return;
        }

        // Handle hash fragment (for implicit flow - legacy)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            console.log('Found access token in hash fragment, setting session...');
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              console.error('Error setting session from hash:', sessionError);
              setError(`Failed to set session: ${sessionError.message}`);
              setLoading(false);
              return;
            }

            if (!sessionData.session?.user?.email) {
              setError('Authentication failed. No user email found.');
              setLoading(false);
              return;
            }

            // Clear hash from URL
            window.history.replaceState(null, '', window.location.pathname);

            // Session is set, redirect immediately without state updates
            const userEmail = sessionData.session.user.email;
            console.log('User authenticated:', userEmail);

            sessionStorage.removeItem('oauth_from_localhost');
            console.log('Redirecting to dashboard...');

            // Immediate redirect - don't wait for React state updates
            window.location.replace('/dashboard');
            return;
          }
        }

        // If no code or hash, try to get existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !sessionData.session?.user?.email) {
          setError('No authorization code or session found. Please try again.');
          setLoading(false);
          return;
        }

        // At this point we have a valid session - langsung redirect ke dashboard
        const userEmail = sessionData.session.user.email;
        console.log('User authenticated:', userEmail);

        if (!userEmail) {
          throw new Error('User email is required');
        }

        // Clear sessionStorage
        sessionStorage.removeItem('oauth_from_localhost');

        // Langsung redirect ke dashboard tanpa delay
        console.log('Redirecting to dashboard...');

        // Use window.location.replace for immediate redirect (fastest, no history entry)
        window.location.replace('/dashboard');
        return;

      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An unexpected error occurred during authentication');
        setLoading(false);
        sessionStorage.removeItem('oauth_from_localhost');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-900 to-yellow-600 rounded-2xl flex items-center justify-center">
              <Crown className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-green-900 mb-4">
            Mengautentikasi...
          </h1>
          <p className="text-gray-600 mb-6 text-sm">
            Mohon tunggu sebentar
          </p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-green-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-red-900 mb-4">
            Autentikasi Gagal
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-green-900 text-white rounded-lg hover:bg-green-800 transition-colors"
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-900 to-yellow-600 rounded-2xl flex items-center justify-center">
              <Crown className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-green-900 mb-4">
            Memuat...
          </h1>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-green-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}