'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from './DashboardSidebar';
import GlobalAuthenticatedHeader from './GlobalAuthenticatedHeader';
import Footer from './Footer';

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AuthenticatedLayout({ children, title }: AuthenticatedLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize sidebar state based on screen size to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    // Initialize sidebar as closed on mobile/tablet
    if (window.innerWidth >= 768) { // md breakpoint
      setIsSidebarOpen(false);
    }
  }, []);

  // Dynamic title based on route
  const getPageTitle = () => {
    if (title) return title;

    const routeTitles: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/jurnal-harian': 'Jurnal Harian',
      '/tashih': 'Tashih Bacaan',
      '/perjalanan-saya': 'Perjalanan Saya',
      '/ujian': 'Ujian',
      '/alumni': 'Ruang Alumni',
      '/progress': 'Progress Tahfidz',
      '/statistik': 'Statistik',
      '/tagihan-pembayaran': 'Tagihan & Pembayaran',
      '/donasi-dashboard': 'Donasi',
      '/pengaturan': 'Pengaturan',
      '/profil': 'Profil',
      '/admin': 'Panel Admin',
    };

    // Handle nested routes
    for (const route in routeTitles) {
      if (pathname.startsWith(route)) {
        return routeTitles[route];
      }
    }

    return 'Dashboard';
  };

  // Breadcrumb configuration
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Beranda', href: '/dashboard' }
    ];

    if (pathname === '/jurnal-harian') {
      breadcrumbs.push({ label: 'Jurnal Harian', href: '/jurnal-harian' });
    } else if (pathname === '/tashih') {
      breadcrumbs.push({ label: 'Tashih Bacaan', href: '/tashih' });
    } else if (pathname === '/perjalanan-saya') {
      breadcrumbs.push({ label: 'Perjalanan Saya', href: '/perjalanan-saya' });
    } else if (pathname === '/ujian') {
      breadcrumbs.push({ label: 'Ujian', href: '/ujian' });
    } else if (pathname === '/alumni') {
      breadcrumbs.push({ label: 'Ruang Alumni', href: '/alumni' });
    } else if (pathname.startsWith('/progress')) {
      breadcrumbs.push({ label: 'Progress', href: '/progress' });
    } else if (pathname.startsWith('/statistik')) {
      breadcrumbs.push({ label: 'Statistik', href: '/statistik' });
    } else if (pathname.startsWith('/tagihan-pembayaran')) {
      breadcrumbs.push({ label: 'Tagihan & Pembayaran', href: '/tagihan-pembayaran' });
    } else if (pathname.startsWith('/donasi-dashboard')) {
      breadcrumbs.push({ label: 'Donasi', href: '/donasi-dashboard' });
    } else if (pathname.startsWith('/pengaturan')) {
      breadcrumbs.push({ label: 'Pengaturan', href: '/pengaturan' });
    } else if (pathname === '/admin') {
      breadcrumbs.push({ label: 'Panel Admin', href: '/admin' });
    } else if (pathname.startsWith('/admin/pengaturan')) {
      breadcrumbs.push({ label: 'Panel Admin', href: '/admin' });
      breadcrumbs.push({ label: 'Pengaturan', href: '/admin/pengaturan' });
    } else if (pathname.startsWith('/admin/data-master')) {
      breadcrumbs.push({ label: 'Panel Admin', href: '/admin' });
      breadcrumbs.push({ label: 'Data Master', href: '/admin/data-master' });
    } else if (pathname.startsWith('/admin')) {
      breadcrumbs.push({ label: 'Panel Admin', href: '/admin' });
    }

    return breadcrumbs;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to login if not authenticated (client-side protection)
  useEffect(() => {
    // Add a delay for mobile to allow auth context to initialize
    const timer = setTimeout(() => {
      if (isMounted && !loading && !user) {
        console.log('AuthenticatedLayout: No user found after delay, redirecting to login');
        router.push(`/login?redirectedFrom=${pathname}`);
      }
    }, 1500); // 1.5 second delay for mobile

    return () => clearTimeout(timer);
  }, [user, loading, pathname, router, isMounted]);

  useEffect(() => {
    // Close sidebar on mobile/tablet when route changes
    if (isMounted && window.innerWidth < 768) { // md breakpoint
      setIsSidebarOpen(false);
    }
  }, [pathname, isMounted]);

  // Always render the same structure to prevent hydration mismatch
  // Only conditionally render content inside
  const showLoadingOverlay = !isMounted || loading || !user;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Always render to maintain consistent structure */}
      <DashboardSidebar
        isOpen={isMounted ? isSidebarOpen : false}
        onClose={() => isMounted && setIsSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Global Header - Always render to maintain structure, but handle interactive elements inside */}
        <GlobalAuthenticatedHeader
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          isMounted={isMounted}
        />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 pt-0">
          {showLoadingOverlay ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="mt-4 text-gray-600">
                  {!isMounted ? 'Memuat...' : loading ? 'Memeriksa autentikasi...' : 'Mengalihkan ke halaman login...'}
                </p>
              </div>
            </div>
          ) : (
            <main className="p-3 sm:p-4 lg:p-6">
              <div className="max-w-full">
                {children}
              </div>
            </main>
          )}

          {/* Footer - Only show if not loading */}
          {!showLoadingOverlay && <Footer />}
        </div>
      </div>
    </div>
  );
}