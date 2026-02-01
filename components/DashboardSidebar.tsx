'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, BookOpen, GraduationCap, Users, LogOut, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

interface UniversalSidebarProps {
  currentPath?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ isOpen = false, onClose }: UniversalSidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Set mounted state after hydration - DEFERRED to prevent React Error #310
  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsMounted(true);
      setIsMobile(window.innerWidth < 768);
    }, 0);

    // Listen to window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse on mobile
      if (window.innerWidth < 768) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(mountTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Role-based navigation items
  const getNavItems = () => {
    const userRoles = user?.roles || [];

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
    ];

    // Role checks
    const isAdmin = userRoles.includes('admin');
    const isMusyrifah = userRoles.includes('musyrifah');
    const isMuallimah = userRoles.includes('muallimah');

    // Add musyrifah panel if user has musyrifah role
    if (isMusyrifah) {
      baseItems.push({
        href: '/panel-musyrifah',
        label: 'Panel Musyrifah',
        icon: <Eye className="h-6 w-6" />,
      });
    }

    // Add muallimah panel if user has muallimah or admin role
    if (isMuallimah || isAdmin) {
      baseItems.push({
        href: '/panel-muallimah',
        label: 'Panel Muallimah',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
      });
    }

    // Add admin panel if user has admin role
    if (isAdmin) {
      baseItems.push({
        href: '/admin',
        label: 'Panel Admin',
        icon: <Users className="h-6 w-6" />,
      });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  };

  
  return (
    <>
      {/* Mobile overlay - Only render after mount to prevent hydration mismatch */}
      {isMounted && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Ensure consistent className between server and client */}
      <aside className={`
        fixed md:sticky inset-y-0 md:top-0 left-0 z-50 md:z-20 bg-white shadow-lg border-r border-green-900/20
        transform transition-all duration-300 ease-in-out md:h-screen
        ${isMounted && isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'w-20' : 'w-64 sm:w-72'}
      `}>
        <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 border-b border-green-900/20 px-3 flex-shrink-0">
          {!isCollapsed ? (
            <Link href="/" className="flex items-center space-x-2 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                <Image
                    src="https://github.com/dewifebriani-project/File-Public/blob/main/Markaz%20Tikrar%20Indonesia.jpg?raw=true"
                    alt="Tikrar MTI"
                    width={40}
                    height={40}
                    className="object-contain w-full h-full"
                    sizes="40px"
                    priority
                    unoptimized
                  />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm sm:text-base font-bold text-green-900 leading-tight truncate">Tikrar MTI Apps</span>
              </div>
            </Link>
          ) : (
            <Link href="/" className="flex items-center justify-center w-full">
              <div className="flex-shrink-0 w-10 h-10">
                <Image
                    src="https://github.com/dewifebriani-project/File-Public/blob/main/Markaz%20Tikrar%20Indonesia.jpg?raw=true"
                    alt="Tikrar MTI"
                    width={40}
                    height={40}
                    className="object-contain w-full h-full"
                    sizes="40px"
                    priority
                    unoptimized
                  />
              </div>
            </Link>
          )}

          {/* Close button for mobile, Collapse button for desktop/tablet */}
          <button
            onClick={() => {
              if (isMobile) {
                onClose?.();
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            className="p-2 rounded-lg hover:bg-green-50 transition-colors duration-200"
            title={isMobile ? 'Close menu' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          >
            {isMobile ? (
              <X className="w-5 h-5 text-green-900" />
            ) : isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-green-900" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-green-900" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-green-900/20 scrollbar-track-transparent -webkit-overflow-scrolling:touch ${isCollapsed ? 'px-2' : 'px-3 sm:px-4'}`}>
          {navItems.map((item) => {
            return (
              <div key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={`
                    flex items-center rounded-lg text-sm sm:text-sm font-medium transition-all duration-300 relative min-w-0 touch-manipulation group
                    ${isCollapsed ? 'justify-center px-2 py-3 hover:scale-110' : 'px-3 py-3 sm:px-3 sm:py-2 hover:scale-105'}
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-green-900 to-green-800 text-white shadow-md'
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-900'
                    }
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <div className={`w-5 h-5 sm:w-5 sm:h-5 flex items-center justify-center rounded-full flex-shrink-0 ${
                    isCollapsed ? '' : 'mr-3 sm:mr-3'
                  } ${
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
                  {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                  </Link>
              </div>
            );
          })}

          {/* Logout Button */}
          <div className={`py-3 sm:py-4 border-t border-green-900/20 ${isCollapsed ? 'px-2' : 'px-3 sm:px-4'}`}>
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Show confirmation dialog
                if (!window.confirm('Apakah <em>Ukhti</em> yakin ingin keluar?')) {
                  return;
                }

                // Show loading state
                const buttonElement = e.currentTarget;
                buttonElement.disabled = true;
                buttonElement.innerHTML = '<div class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>' + (isCollapsed ? '' : '<span>Keluar...</span>') + '</div>';

                // Perform logout - the logout function will handle the redirect
                await logout();
              }}
              type="button"
              aria-label="Keluar dari akun"
              title="Keluar"
              className={`flex items-center w-full rounded-lg text-base sm:text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100 active:text-red-800 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 touch-manipulation min-h-[48px] sm:min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed ${
                isCollapsed ? 'justify-center px-2 py-3' : 'justify-center sm:justify-start px-4 py-4 sm:px-3 sm:py-2.5'
              }`}
            >
              <LogOut className={`w-6 h-6 sm:w-5 sm:h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>Keluar</span>}
            </button>
          </div>
        </nav>
      </div>
    </aside>
    </>
  );
}