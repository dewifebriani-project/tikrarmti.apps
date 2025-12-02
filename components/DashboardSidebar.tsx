'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, AlertCircle, X, BookOpen, GraduationCap, Users } from 'lucide-react';

interface UniversalSidebarProps {
  currentPath?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ currentPath, isOpen, onClose }: UniversalSidebarProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const {
    isProfileComplete,
    isAdmin,
    isCalonThalibah,
    isThalibah,
    isMusyrifah,
    isMuallimah,
    canAccessAdminPanel,
    canAccessLearning,
    canAccessPendaftaran
  } = useAuth();

  // Routes that require profile completion
  const profileRequiredRoutes = [
    '/perjalanan-saya',
    '/jurnal-harian',
    '/tashih',
    '/ujian',
    '/kelulusan-sertifikat',
    '/alumni'
  ];

  // Routes that require admin role
  const adminRequiredRoutes = [
    '/perjalanan-saya',
    '/jurnal-harian',
    '/tashih',
    '/ujian',
    '/kelulusan-sertifikat',
    '/tagihan-pembayaran',
    '/donasi',
    '/alumni'
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

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
    ];

    // All users can access pendaftaran
    if (canAccessPendaftaran()) {
      baseItems.push({
        href: '/pendaftaran',
        label: isCalonThalibah() ? 'Pendaftaran' : 'Program',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      });
    }

    // Learning menu items - only for approved thalibah and staff
    if (canAccessLearning()) {
      baseItems.push(
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
          label: 'Tashih Umum',
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
        }
      );
    }

    // Payment and alumni - only for thalibah (not calon_thalibah)
    if (isThalibah()) {
      baseItems.push(
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
        }
      );
    }

    // Admin panel - only for admin
    if (canAccessAdminPanel()) {
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

  const requiresProfile = (href: string) => {
    return profileRequiredRoutes.some(route => href.startsWith(route));
  };

  const requiresAdmin = (href: string) => {
    return adminRequiredRoutes.some(route => href.startsWith(route));
  };

  const isProfileRequired = !isProfileComplete();
  const isUserAdmin = isAdmin();

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
        fixed md:static inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white shadow-lg border-r border-green-900/20
        transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-20 border-b border-green-900/20 px-4">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10">
              <img
                src="https://github.com/dewifebriani-project/File-Public/blob/main/Markaz%20Tikrar%20Indonesia.jpg?raw=true"
                alt="Tikrar MTI Apps"
                className="w-10 h-10 object-contain"
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
        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const requiresProfileCompletion = requiresProfile(item.href);
            const requiresAdminRole = requiresAdmin(item.href);
            const isLocked = isProfileRequired && requiresProfileCompletion;
            const isLockedForAdmin = requiresAdminRole && !isUserAdmin && !requiresProfileCompletion;
            const finalLock = isLocked || isLockedForAdmin;

            return (
              <div key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-2 sm:px-3 py-2 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105 relative min-w-0
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-green-900 to-green-800 text-white shadow-md'
                      : finalLock
                      ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-900'
                    }
                  `}
                  onClick={(e) => {
                    if (finalLock) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className={`mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full flex-shrink-0 ${
                    isActive(item.href)
                      ? 'bg-yellow-400/20'
                      : finalLock
                      ? 'bg-gray-200'
                      : 'bg-green-100'
                  }`}>
                    <div className={
                      isActive(item.href)
                        ? 'text-yellow-400'
                        : finalLock
                        ? 'text-gray-400'
                        : 'text-green-900'
                    }>
                      {item.icon}
                    </div>
                  </div>
                  <span className="flex-1 truncate">{item.label}</span>

                  {finalLock && (
                    <div className="ml-1 sm:ml-2 flex-shrink-0">
                      <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    </div>
                  )}
                </Link>

                {finalLock && (
                  <div className="absolute -top-1 -right-1 z-10">
                    <div className={`${isLockedForAdmin ? 'bg-red-500' : 'bg-yellow-500'} rounded-full p-0.5 sm:p-1 animate-pulse`}>
                      <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Role-based status messages */}
          {isCalonThalibah() && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Status: Calon Thalibah</p>
                  <p className="hidden sm:block">Lengkapi pendaftaran untuk menjadi thalibah penuh.</p>
                  <p className="sm:hidden">Lengkapi pendaftaran.</p>
                </div>
              </div>
            </div>
          )}

          {isThalibah() && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-600 rounded-full flex-shrink-0 mt-0.5" />
                <div className="text-xs text-green-700">
                  <p className="font-medium mb-1">Status: Thalibah</p>
                  <p className="hidden sm:block">Selamat datang di program Tikrar Tahfidz!</p>
                  <p className="sm:hidden">Program aktif.</p>
                </div>
              </div>
            </div>
          )}

          {/* Profile completion warning */}
          {isProfileRequired && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-700">
                  <p className="font-medium mb-1">Profile Belum Lengkap</p>
                  <p className="hidden sm:block">Lengkapi profile melalui menu Pengaturan untuk mengakses fitur yang terkunci</p>
                  <p className="sm:hidden">Lengkapi profile di Pengaturan.</p>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
    </aside>
    </>
  );
}