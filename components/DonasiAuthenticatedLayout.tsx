'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DonasiSidebar from './DonasiSidebar';
import GlobalAuthenticatedHeader from './GlobalAuthenticatedHeader';

interface DonasiAuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DonasiAuthenticatedLayout({ children, title }: DonasiAuthenticatedLayoutProps) {
  const { user, userData, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Dynamic title based on route
  const getPageTitle = () => {
    if (title) return title;
    return 'Donasi';
  };

  // Breadcrumb configuration
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Beranda', href: '/dashboard' },
      { label: 'Donasi', href: '/donasi-dashboard' }
    ];

    return breadcrumbs;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('DonasiAuthenticatedLayout Debug - No user found');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Donasi Sidebar - lebih sempit dan khusus donasi */}
      <DonasiSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Global Header */}
        <GlobalAuthenticatedHeader />

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}