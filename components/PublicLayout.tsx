'use client';

import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-main-background text-main">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50">
        <Header />
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}