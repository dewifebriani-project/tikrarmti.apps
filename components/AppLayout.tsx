'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PublicLayout from './PublicLayout';
import LoginLayout from './LoginLayout';
import AuthenticatedLayout from './AuthenticatedLayout';
import DonasiAuthenticatedLayout from './DonasiAuthenticatedLayout';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/metode', '/tentang', '/kontak', '/donasi-dashboard'];
  const loginRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/donasi') || pathname.startsWith('/wakaf');
  const isLoginRoute = loginRoutes.includes(pathname);
  const isDonasiRoute = pathname === '/donasi-dashboard';

  useEffect(() => {
    // Redirect authenticated users away from login/register pages
    if (!loading && user && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
    }

    // Redirect unauthenticated users from protected routes
    if (!loading && !user && !isPublicRoute && !isLoginRoute) {
      router.push('/login');
    }
  }, [user, loading, router, pathname, isPublicRoute, isLoginRoute]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Use login layout for login/register routes (no header)
  if (isLoginRoute) {
    return <LoginLayout>{children}</LoginLayout>;
  }

  // Use public layout for other public routes
  if (isPublicRoute) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  // Use donasi layout for donasi dashboard
  if (user && isDonasiRoute) {
    return <DonasiAuthenticatedLayout title={title}>{children}</DonasiAuthenticatedLayout>;
  }

  // Use authenticated layout for all protected routes including dashboard
  if (user) {
    return <AuthenticatedLayout title={title}>{children}</AuthenticatedLayout>;
  }

  // Return null while redirecting
  return null;
}