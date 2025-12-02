'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginWithEmail, loginWithGoogle } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<{email?: string; password?: string; general?: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check for error message from URL parameters
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setErrors({ general: decodeURIComponent(errorParam) });
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.password) {
      newErrors.password = 'Kata sandi wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await loginWithEmail(formData.email, formData.password);

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (error: any) {
      setErrors({ general: error.message || 'Email atau kata sandi salah. Silakan coba lagi.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    setErrors({});

    try {
      console.log('Starting Google Sign-In...');

      const user = await loginWithGoogle();

      console.log('Google Sign-In successful:', {
        uid: user?.id,
        email: user?.email,
        displayName: user?.user_metadata?.full_name
      });

      // Redirect to dashboard on success
      console.log('Redirecting to dashboard...');
      router.push('/dashboard');

    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      setErrors({ general: error.message || 'Gagal masuk dengan Google. Silakan coba lagi.' });
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-custom-green-50 via-white to-custom-gold-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 space-y-6">
            {/* Logo and Header */}
            <div className="text-center">
              <Link href="/" className="inline-flex items-center justify-center group">
                <img
                  src="https://github.com/dewifebriani-project/File-Public/blob/main/Markaz%20Tikrar%20Indonesia.jpg?raw=true"
                  alt="Markaz Tikrar Indonesia"
                  className="w-20 h-20 object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              <h2 className="mt-6 text-3xl font-bold text-black">
                Markaz Tikrar Indonesia
              </h2>
              <p className="mt-3 text-gray-600">
                Silakan masuk untuk melanjutkan proses belajar, Ukhti. <br />
                <span className="text-sm text-gray-500">Pastikan Anda sudah menyelesaikan pendaftaran terlebih dahulu.</span>
              </p>
            </div>

            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoadingGoogle}
              variant="outline"
              size="lg"
              className="w-full border-gray-300 hover:border-custom-green-400 hover:bg-custom-green-50 transition-all duration-300 py-3"
            >
              {isLoadingGoogle ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isLoadingGoogle ? 'Menghubungkan...' : 'Masuk dengan Google'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">atau</span>
              </div>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Alamat Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`border-gray-300 focus:border-custom-green-500 focus:ring-custom-green-500 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading || isLoadingGoogle}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className={`border-gray-300 focus:border-custom-green-500 focus:ring-custom-green-500 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Masukkan kata sandi"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading || isLoadingGoogle}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center p-1"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || isLoadingGoogle}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                    }
                    disabled={isLoading || isLoadingGoogle}
                  />
                  <Label htmlFor="remember-me" className="text-sm text-gray-700">
                    Ingat saya
                  </Label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-custom-green-600 hover:text-custom-green-700 transition-colors">
                    Lupa kata sandi?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || isLoadingGoogle}
                className="w-full bg-custom-green-600 hover:bg-custom-green-700 text-white font-semibold py-3 transition-all duration-300 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Bismillah, Masuk'
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-600">
              Belum menyelesaikan pendaftaran?{' '}
              <Link href="/register" className="font-medium text-custom-green-600 hover:text-custom-green-700 transition-colors">
                Lengkapi data diri Anda
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}