'use client';

import React, { ReactNode } from 'react';
import Footer from './Footer';

interface LoginLayoutProps {
  children: ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-main-background text-main">
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}