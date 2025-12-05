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
  const [checkingUser, setCheckingUser] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Check if we're on production domain but coming from localhost
      const currentOrigin = window.location.origin;
      const currentHost = window.location.hostname;
      const hasTokens = window.location.hash.includes('access_token') ||
                       window.location.search.includes('code') ||
                       window.location.search.includes('access_token');

      // If we're on markaztikrar.id but have tokens, and the referrer or navigation indicates we came from localhost
      const isComingFromLocalhost = document.referrer.includes('localhost') ||
                                   document.referrer.includes('127.0.0.1') ||
                                   sessionStorage.getItem('oauth_from_localhost') === 'true';

      // Force redirect to localhost if we detect this scenario
      if (currentHost === 'www.markaztikrar.id' && hasTokens && isComingFromLocalhost) {
        debugOAuth('Force redirect to localhost detected', {
          currentOrigin,
          currentHost,
          hasTokens,
          isComingFromLocalhost,
          referrer: document.referrer
        });

        // Extract the full URL including hash
        const fullUrl = window.location.href;
        const localhostUrl = fullUrl.replace('https://www.markaztikrar.id', 'http://localhost:3003');

        debugOAuth('Redirecting to', { localhostUrl });
        window.location.replace(localhostUrl);
        return;
      }

      // Log callback initiation with all URL details
      debugOAuth('Callback Initiated', {
        currentUrl: window.location.href,
        searchParams: Object.fromEntries(searchParams.entries()),
        hash: window.location.hash,
        origin: window.location.origin,
        isComingFromLocalhost
      });

      try {
        setLoading(true);

        // Check for errors in URL first
        const error = searchParams.get('error');
        if (error) {
          debugOAuth('Callback Error', { error });
          setError(`Authentication error: ${error}`);
          return;
        }

        // Handle hash fragment (for implicit flow)
        // OAuth may return tokens in hash fragment instead of query params
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            console.log('Found access token in hash fragment, setting session...');
            // Set session from hash fragment tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              console.error('Error setting session from hash:', sessionError);
              setError(`Failed to set session: ${sessionError.message}`);
              return;
            }

            // Clear hash from URL
            window.history.replaceState(null, '', window.location.pathname);
          }
        }

        // Wait a moment for Supabase to process the session
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get session after URL processing
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(`Failed to authenticate: ${sessionError.message}`);
          return;
        }

        if (!sessionData.session?.user?.email) {
          console.log('No session found, checking URL parameters...');

          // Check if we have authentication parameters in URL
          const hasAuthParams = searchParams.has('code') || searchParams.has('access_token');

          if (hasAuthParams) {
            console.log('Auth params found, waiting for session...');
            // Wait a bit longer for session to be established
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Try to get session again
            const { data: retryData, error: retryError } = await supabase.auth.getSession();

            if (retryError) {
              setError(`Failed to authenticate: ${retryError.message}`);
              return;
            }

            if (!retryData.session?.user?.email) {
              setError('Authentication failed. Please try again.');
              return;
            }

            // Use retry data for further processing
            sessionData.session = retryData.session;
          } else {
            setError('No authorization code found');
            return;
          }
        }

        // At this point we have a valid session
        const userEmail = sessionData.session.user.email;
        const userId = sessionData.session.user.id;
        console.log('User authenticated:', userEmail);

        // Check if user is registered in our database using API endpoint
        setCheckingUser(true);

        if (!userEmail) {
          throw new Error('User email is required');
        }

        // Call API to check registration status (server-side check)
        const response = await fetch('/api/auth/check-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: userEmail }),
        });

        const registrationStatus = await response.json();

        if (!registrationStatus.registered) {
          console.log('User registration incomplete:', userEmail, registrationStatus.reason);

          // Jika user belum terdaftar sama sekali
          if (registrationStatus.reason?.includes('User tidak ditemukan')) {
            // User not registered - sign them out and redirect to register
            await supabase.auth.signOut();
            router.push(`/register?email=${encodeURIComponent(userEmail || '')}`);
            return;
          } else {
            // User sudah ada di database tapi profil belum lengkap
            // Redirect ke halaman lengkapi profil
            console.log('Redirecting to profile completion page...');
            router.push('/lengkapi-profil');
            return;
          }
        } else {
          console.log('User registered, redirecting to dashboard');
          // User is registered, proceed to dashboard
          router.push('/dashboard');
        }

      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An unexpected error occurred during authentication');
      } finally {
        // Clear the sessionStorage flag
        sessionStorage.removeItem('oauth_from_localhost');
        setLoading(false);
        setCheckingUser(false);
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
            {checkingUser ? 'Memeriksa Data Anda...' : 'Mengautentikasi...'}
          </h1>
          <p className="text-gray-600 mb-6">
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