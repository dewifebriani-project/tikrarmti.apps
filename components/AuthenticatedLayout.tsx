'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from './DashboardSidebar';
import GlobalAuthenticatedHeader from './GlobalAuthenticatedHeader';
import ProfileCompletionCheck from './ProfileCompletionCheck';

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AuthenticatedLayout({ children, title }: AuthenticatedLayoutProps) {
  const { user, loading, logout, isSuperAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    if (!loading && !user) {
      router.push('/login');
    }

    // Hanya redirect dari halaman admin jika user tidak memiliki akses yang sesuai
    if (!loading && user && pathname.startsWith('/admin')) {
      const userRole = user?.role?.toLowerCase();

      // User memiliki akses admin jika: role admin/pengurus ATAU superadmin
      const hasAdminAccess = userRole === 'admin' || userRole === 'pengurus' || isSuperAdmin();

      if (!hasAdminAccess) {
        console.log('Access denied:', {
          userRole,
          email: user?.email,
          isSuperAdmin: isSuperAdmin(),
          hasAdminAccess,
          pathname,
          role: user?.role
        });
        // Tidak langsung redirect, beri kesempatan untuk debugging
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      } else {
        console.log('Access granted:', {
          userRole,
          email: user?.email,
          isSuperAdmin: isSuperAdmin(),
          hasAdminAccess,
          pathname
        });
      }
    }

    // Close sidebar on mobile/tablet when route changes
    if (window.innerWidth < 768) { // md breakpoint
      setIsSidebarOpen(false);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('AuthenticatedLayout Debug - No user found');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Global Header */}
        <GlobalAuthenticatedHeader
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-3 sm:p-4 lg:p-6">
          <div className="max-w-full">
            <ProfileCompletionCheck>
              {children}
            </ProfileCompletionCheck>
          </div>
        </main>
      </div>
    </div>
  );
}