'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-main-background text-main">
      <Header />

      {/* Content Area */}
      <main>
        {children}
      </main>

      {/* Footer - Only on landing page */}
      {pathname === '/' && <Footer />}
    </div>
  );
}