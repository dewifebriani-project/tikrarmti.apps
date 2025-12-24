'use client';

import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-main-background text-main overflow-hidden">
      {/* Fixed Header - stays at top */}
      <div className="flex-shrink-0 z-50">
        <Header />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <main>
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}