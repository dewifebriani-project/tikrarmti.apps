'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from '@/lib/supabase-singleton';

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get the access token from URL parameters
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const [sessionSet, setSessionSet] = useState(false);
  const [isSettingSession, setIsSettingSession] = useState(true);

  useEffect(() => {
    const setSessionFromUrl = async () => {
      console.log('=== Reset Password Debug ===');
      console.log('Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'MISSING');
      console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'MISSING');

      if (!accessToken) {
        console.error('No access token found in URL');
        setError('Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link reset baru.');
        setIsSettingSession(false);
        return;
      }

      // Set the session immediately when page loads
      try {
        console.log('Attempting to set session...');
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        console.log('setSession response:', { data, error: sessionError });

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(`Link reset password tidak valid: ${sessionError.message}`);
          setIsSettingSession(false);
        } else if (data.session) {
          console.log('Session set successfully:', {
            user: data.session.user.email,
            expiresAt: data.session.expires_at
          });
          setSessionSet(true);
          setIsSettingSession(false);
        } else {
          console.error('No session returned');
          setError('Gagal membuat session. Silakan minta link reset baru.');
          setIsSettingSession(false);
        }
      } catch (err: any) {
        console.error('Error setting session:', err);
        setError(`Terjadi kesalahan: ${err.message || 'Unknown error'}`);
        setIsSettingSession(false);
      }
    };

    setSessionFromUrl();
  }, [accessToken, refreshToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!password || !confirmPassword) {
      setError('Password dan konfirmasi password harus diisi');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      setIsLoading(false);
      return;
    }

    if (!sessionSet) {
      setError('Session belum siap. Silakan tunggu sebentar dan coba lagi.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Updating password...');
      // Update the password (session already set in useEffect)
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error('Update password error:', updateError);
        setError('Gagal memperbarui password. Silakan coba lagi.');
      } else {
        console.log('Password updated successfully');
        setSuccess(true);

        // Sign out to clear the recovery session
        await supabase.auth.signOut();

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login?message=password_reset_success');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      setError(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Tidak Valid</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link href="/forgot-password" className="text-green-900 hover:text-green-700">
                Minta Link Reset Baru
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Berhasil Diubah!</h2>
              <p className="text-gray-600">Anda akan dialihkan ke halaman login...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while setting session
  if (isSettingSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-900"></div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Memvalidasi Link</h2>
              <p className="text-gray-600">Mohon tunggu sebentar...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8 sm:py-12">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 sm:top-20 sm:left-10 w-24 h-24 sm:w-32 sm:h-32 bg-green-900/5 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-10 right-5 sm:bottom-20 sm:right-20 w-32 h-32 sm:w-40 sm:h-40 bg-yellow-500/5 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md sm:max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Link href="/">
              <Image
                src="/mti-logo.jpg"
                alt="Tikrar MTI Apps"
                width={64}
                height={64}
                className="object-contain w-12 h-12 sm:w-16 sm:h-16 hover:opacity-80 transition-opacity"
                priority
              />
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">Reset Password</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Masukkan password baru Anda
          </p>
        </div>

        {/* Form */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-6 sm:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 pr-12"
                    placeholder="Minimal 6 karakter"
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-1 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 pr-12"
                    placeholder="Ketik ulang password"
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-1 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-900 hover:bg-green-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Memperbarui...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 mr-2" />
                    Reset Password
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-green-900 hover:text-green-700 text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Kembali ke Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8 sm:py-12">
        {/* Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-5 sm:top-20 sm:left-10 w-24 h-24 sm:w-32 sm:h-32 bg-green-900/5 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-10 right-5 sm:bottom-20 sm:right-20 w-32 h-32 sm:w-40 sm:h-40 bg-yellow-500/5 rounded-full opacity-20 blur-3xl"></div>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
        </div>
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  );
}