'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from './DashboardSidebar';
import GlobalAuthenticatedHeader from './GlobalAuthenticatedHeader';
import Footer from './Footer';

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AuthenticatedLayout({ children, title }: AuthenticatedLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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

  useEffect(() => {
    // Close sidebar on mobile/tablet when route changes
    if (isMounted && window.innerWidth < 768) { // md breakpoint
      setIsSidebarOpen(false);
    }
  }, [pathname, isMounted]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Sticky, full height */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Global Header - Sticky at top */}
        <GlobalAuthenticatedHeader
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 pt-0">
          <main className="p-3 sm:p-4 lg:p-6">
            <div className="max-w-full">
              {children}
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}