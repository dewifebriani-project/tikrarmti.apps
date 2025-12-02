'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { validateGoogleUserRegistration } from '@/lib/auth';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);

        // Get the auth code from URL
        const code = searchParams.get('code');

        if (!code) {
          throw new Error('Kode autentikasi tidak ditemukan');
        }

        // Exchange code for session
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) throw sessionError;

        if (!data.user?.email) {
          throw new Error('Email user tidak ditemukan');
        }

        // Check if user has completed registration
        const isRegistrationComplete = await validateGoogleUserRegistration(data.user.email);

        if (!isRegistrationComplete) {
          // Sign out the user since they haven't completed registration
          await supabase.auth.signOut();
          throw new Error('Anda harus menyelesaikan pendaftaran terlebih dahulu. Silakan lengkapi data diri Anda di halaman pendaftaran.');
        }

        // Redirect to dashboard on successful validation
        router.push('/dashboard');

      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat autentikasi');

        // Redirect to login page with error after a delay
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(err.message || 'Terjadi kesalahan saat autentikasi')}`);
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-custom-green-50 via-white to-custom-gold-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="https://github.com/dewifebriani-project/File-Public/blob/main/Markaz%20Tikrar%20Indonesia.jpg?raw=true"
              alt="Markaz Tikrar Indonesia"
              className="w-20 h-20 object-contain mx-auto"
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-green-600 mx-auto"></div>
              <h2 className="text-xl font-semibold text-gray-800">
                Sedang memproses autentikasi...
              </h2>
              <p className="text-gray-600">
                Mohon tunggu sebentar, Ukhti.
              </p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm font-medium">{error}</p>
              </div>
              <p className="text-gray-600 text-sm">
                Anda akan dialihkan ke halaman login dalam beberapa saat...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <p className="text-sm font-medium">
                  Autentikasi berhasil! Mengalihkan ke dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}