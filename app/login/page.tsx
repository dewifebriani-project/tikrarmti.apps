'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Eye, EyeOff } from "lucide-react";
import { supabase } from '@/lib/supabase-singleton';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setSuccessMessage('Registrasi berhasil! Silakan login dengan email dan password yang sudah terdaftar.');
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!formData.email || !formData.password) {
      setErrors({ general: 'Email dan password harus diisi' });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        setErrors({ general: error.message || 'Login gagal. Periksa email dan password Anda.' });
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Login gagal. Silakan coba lagi.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8 sm:py-12">
      {/* Minimal Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 sm:top-20 sm:left-10 w-24 h-24 sm:w-32 sm:h-32 bg-green-900/5 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-10 right-5 sm:bottom-20 sm:right-20 w-32 h-32 sm:w-40 sm:h-40 bg-yellow-500/5 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md sm:max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/mti-logo.jpg"
              alt="Tikrar MTI Apps"
              width={64}
              height={64}
              className="object-contain w-12 h-12 sm:w-16 sm:h-16"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">Tikrar MTI Apps</h1>
          <p className="text-gray-600 text-sm sm:text-base">Masuk ke akun Ukhti</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-6 sm:p-8">
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

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email/Username</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1"
                  placeholder="email@example.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="mt-1 pr-12 text-base"
                    placeholder="Masukkan password"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-1 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full bg-green-900 hover:bg-green-800 text-white transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl py-4 sm:py-6 text-base sm:text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <span className="font-semibold">Masuk</span>
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-gray-600 mb-2 text-sm sm:text-base">
                Belum terdaftar di sistem MTI?
              </p>
              <Link
                href="/register"
                className="inline-block text-green-900 hover:text-green-800 font-semibold hover:underline transition-colors text-base sm:text-lg"
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