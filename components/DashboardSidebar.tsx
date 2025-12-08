'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, BookOpen, GraduationCap, Users, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UniversalSidebarProps {
  currentPath?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ currentPath, isOpen, onClose }: UniversalSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  // Role-based navigation items
  const getNavItems = () => {
    const baseItems = [
      {
        href: '/dashboard',
        label: 'Dasbor',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      },
      {
        href: '/pendaftaran',
        label: 'Pendaftaran Program',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        href: '/perjalanan-saya',
        label: 'Perjalanan Saya',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ),
      },
      {
        href: '/jurnal-harian',
        label: 'Jurnal Harian',
        icon: <BookOpen className="h-6 w-6" />,
      },
      {
        href: '/tashih',
        label: 'Catatan Tashih',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" />
          </svg>
        ),
      },
      {
        href: '/ujian',
        label: 'Ujian',
        icon: <GraduationCap className="h-6 w-6" />,
      },
      {
        href: '/kelulusan-sertifikat',
        label: 'Sertifikat',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.417l5.5-5.5m3.118-5.5a11.955 11.955 0 012.824 8.082" />
          </svg>
        ),
      },
      {
        href: '/tagihan-pembayaran',
        label: 'Tagihan & Pembayaran',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
      },
      {
        href: '/alumni',
        label: 'Alumni',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5 9 5zm0 0v6" />
          </svg>
        ),
      },
      {
        href: '/admin',
        label: 'Panel Admin',
        icon: <Users className="h-6 w-6" />,
      },
    ];

    return baseItems;
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  };

  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky inset-y-0 md:top-0 left-0 z-50 md:z-30 w-64 sm:w-72 bg-white shadow-lg border-r border-green-900/20
        transform transition-transform duration-300 ease-in-out md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-20 border-b border-green-900/20 px-4 flex-shrink-0">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10">
              <Image
                src="https://github.com/dewifebriani-project/File-Public/blob/main/Markaz%20Tikrar%20Indonesia.jpg?raw=true"
                alt="Tikrar MTI Apps"
                width={40}
                height={40}
                className="object-contain"
                unoptimized // For external images
              />
            </div>
            <span className="text-xl font-bold text-green-900">Tikrar MTI Apps</span>
          </Link>

          {/* Close button for mobile/tablet */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-green-50 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-green-900" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-green-900/20 scrollbar-track-transparent">
          {navItems.map((item) => {
            return (
              <div key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-2 sm:px-3 py-2 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105 relative min-w-0
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-green-900 to-green-800 text-white shadow-md'
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-900'
                    }
                  `}
                >
                  <div className={`mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full flex-shrink-0 ${
                    isActive(item.href)
                      ? 'bg-yellow-400/20'
                      : 'bg-green-100'
                  }`}>
                    <div className={
                      isActive(item.href)
                        ? 'text-yellow-400'
                        : 'text-green-900'
                    }>
                      {item.icon}
                    </div>
                  </div>
                  <span className="flex-1 truncate">{item.label}</span>

                  </Link>
              </div>
            );
          })}

          {/* Logout Button */}
          <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-green-900/20">
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Logout button clicked in sidebar');
                try {
                  await logout();
                  console.log('Logout successful, redirecting to login');
                  window.location.href = '/login';
                } catch (error) {
                  console.error('Error logging out:', error);
                  // Still redirect even if there's an error
                  window.location.href = '/login';
                }
              }}
              type="button"
              aria-label="Keluar dari akun"
              title="Keluar"
              className="flex items-center justify-center sm:justify-start w-full px-3 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100 active:text-red-800 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 touch-manipulation"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="hidden xs:inline">Keluar</span>
              <span className="xs:hidden">Out</span>
            </button>
          </div>
        </nav>
      </div>
    </aside>
    </>
  );
}