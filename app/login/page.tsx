'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown } from "lucide-react";
import { loginWithGoogle } from '@/lib/auth';
import { supabase } from '@/lib/supabase-singleton';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Set isClient flag after mount to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const message = searchParams.get('message');
    const email = searchParams.get('email');

    if (message === 'registration_success') {
      setSuccessMessage('Registrasi berhasil! Silakan login dengan akun Google yang sudah terdaftar.');
    } else if (message === 'not_registered') {
      const emailText = email ? ` (${email})` : '';
      setErrors({
        general: `Email${emailText} belum terdaftar di sistem MTI. Silakan daftar terlebih dahulu sebagai anggota baru.`
      });
    } else if (message === 'profile_incomplete') {
      setErrors({
        general: 'Profil Ukhti belum lengkap. Silakan lengkapi data profil terlebih dahulu. Pastikan nama lengkap dan nomor telepon sudah diisi.'
      });
    } else if (message === 'profile_creation_failed') {
      const emailText = email ? ` (${email})` : '';
      setErrors({
        general: `Gagal membuat profil untuk${emailText}. Silakan hubungi admin.`
      });
    } else if (message === 'profile_creation_error') {
      setErrors({
        general: 'Terjadi kesalahan saat membuat profil. Silakan coba login kembali atau hubungi admin.'
      });
    }
  }, [searchParams, isClient]);

  useEffect(() => {
    if (!isClient) return;

    // Check if user is already logged in
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        router.push('/dashboard');
      }
    };

    checkUserSession();
  }, [router, isClient]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      setErrors({ general: error.message || 'Login dengan Google gagal. Silakan coba lagi.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-900/5 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-500/5 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/mti-logo.jpg"
              alt="Tikrar MTI Apps"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">Tikrar MTI Apps</h1>
          <p className="text-gray-600">Masuk ke akun Ukhti</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                {successMessage}
              </div>
            )}

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {errors.general}
              </div>
            )}

            {/* Info Message */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                Silakan login menggunakan akun Google yang sudah terdaftar di sistem MTI
              </p>
            </div>

            {/* Google Login Button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              size="lg"
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-green-900 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl py-6"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-green-900 border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-lg font-semibold">Masuk dengan Google</span>
                </div>
              )}
            </Button>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-2">
                Belum terdaftar di sistem MTI?
              </p>
              <Link
                href="/register"
                className="inline-block text-green-900 hover:text-green-800 font-semibold hover:underline transition-colors text-lg"
              >
                Daftar sebagai anggota baru
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-yellow-600 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/mti-logo.jpg"
              alt="Tikrar MTI Apps"
              width={64}
              height={64}
              className="object-contain animate-pulse"
              priority
            />
          </div>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}