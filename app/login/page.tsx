'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<React.ReactNode>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  // Set isClient flag after mount to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const message = searchParams.get('message');
    const email = searchParams.get('email');

    if (message === 'registration_success') {
      setSuccessMessage(
        <div className="space-y-2">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Registrasi Berhasil!
          </p>
          <p className="text-base">
            ✅ Akun Anda telah aktif. <strong>Silakan login</strong> dengan email dan password yang telah Anda daftarkan.
          </p>
          <p className="text-sm text-gray-600">
            Tidak perlu konfirmasi email. Akun langsung dapat digunakan.
          </p>
        </div>
      );
    } else if (message === 'password_reset_success') {
      setSuccessMessage(
        <div className="space-y-2">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Password Berhasil Direset!
          </p>
          <p className="text-base">
            ✅ Password Anda telah diperbarui. <strong>Silakan login</strong> dengan password baru Anda.
          </p>
        </div>
      );
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
    setShowNotification(false);

    if (!formData.email || !formData.password) {
      const errorMsg = 'Email dan password harus diisi';
      setErrors({ general: errorMsg });
      setNotificationMessage(errorMsg);
      setNotificationType('error');
      setShowNotification(true);
      setIsLoading(false);
      return;
    }

    try {
      // Use Supabase Auth directly
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        let errorMessage = error.message;

        // Provide more specific error messages for common issues
        if (error.message === 'Invalid login credentials') {
          errorMessage = 'Email atau password salah. Silakan periksa kembali.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email belum dikonfirmasi. Silakan cek inbox Anda.';
        }

        throw new Error(errorMessage);
      }

      if (data.user && data.session) {
        // Show success notification
        setNotificationMessage('Login berhasil! Mengarahkan ke dashboard...');
        setNotificationType('success');
        setShowNotification(true);

        // Check if user profile exists, create if not
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError && userError.code === 'PGRST116') {
          // User not found in database, create profile
          console.log('Creating user profile for authenticated user:', data.user.email);

          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
              role: data.user.user_metadata?.role || 'calon_thalibah',
              created_at: new Date().toISOString(),
            });

          if (createError) {
            console.error('Error creating user profile:', createError);
            // Still allow login even if profile creation fails
          } else {
            console.log('User profile created successfully');
          }
        }

        // CRITICAL: Use server action to set session cookies properly on server
        // This ensures cookies are set correctly for SSR middleware
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
            credentials: 'include',
          });

          if (!response.ok) {
            console.warn('Server session sync failed, but continuing anyway');
          } else {
            console.log('Server session synced successfully');
          }
        } catch (err) {
          console.warn('Server session sync error, but continuing:', err);
        }

        // Wait for server to process
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if there's a redirect URL from middleware
        const redirectUrl = searchParams.get('redirect');
        const targetUrl = redirectUrl && redirectUrl !== '/login' ? redirectUrl : '/dashboard';

        // Use window.location.href for full page reload to ensure
        // middleware picks up the session cookies correctly
        window.location.href = targetUrl;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMsg = error.message || 'Login gagal. Silakan coba lagi.';
      setErrors({ general: errorMsg });
      setNotificationMessage(errorMsg);
      setNotificationType('error');
      setShowNotification(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Mobile Notification Toast */}
      {showNotification && (
        <div className={`fixed top-4 right-4 left-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          notificationType === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            {notificationType === 'success' ? (
              <CheckCircle2 className="w-6 h-6 mr-3" />
            ) : (
              <AlertCircle className="w-6 h-6 mr-3" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-base">
                {notificationType === 'success' ? 'Berhasil!' : 'Error!'}
              </p>
              <p className="text-sm opacity-90">{notificationMessage}</p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-4 text-white hover:opacity-80"
            >
              ×
            </button>
          </div>
        </div>
      )}

      
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8 sm:py-12">
        {/* Minimal Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-5 sm:top-20 sm:left-10 w-24 h-24 sm:w-32 sm:h-32 bg-green-900/5 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-10 right-5 sm:bottom-20 sm:right-20 w-32 h-32 sm:w-40 sm:h-40 bg-yellow-500/5 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="w-full max-w-md sm:max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img
                  src="/mti-logo.jpg"
                  alt="Tikrar MTI Apps"
                  className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
                />
                <div className="absolute inset-0 -z-10 bg-green-500/20 blur-2xl rounded-full scale-150"></div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-green-900 mb-2">Tikrar MTI Apps</h1>
            <p className="text-gray-600">Portal Santri Markaz Tikrar Indonesia</p>
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
                  autoComplete="email"
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
                    autoComplete="current-password"
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

            {/* Forgot Password Link */}
            <div className="text-center mb-4">
              <Link
                href="/forgot-password"
                className="text-sm text-gray-500 hover:text-green-600 transition-colors"
              >
                Lupa password?
              </Link>
            </div>

            {/* Register Link */}
            <div className="text-center">
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
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}