'use client';

import { ReactNode } from 'react';
import DonasiSidebar from './DonasiSidebar';
import GlobalAuthenticatedHeader from './GlobalAuthenticatedHeader';
import Footer from './Footer';

interface DonasiAuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DonasiAuthenticatedLayout({ children, title }: DonasiAuthenticatedLayoutProps) {

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

  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top section with sidebar and header */}
      <div className="flex flex-1">
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

      {/* Footer */}
      <Footer />
    </div>
  );
}