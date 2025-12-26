'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Settings,
  Bell,
  User,
  Home,
  Menu,
  X,
  ChevronDown,
  LogOut,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface GlobalAuthenticatedHeaderProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
  isMounted?: boolean;
}

export default function GlobalAuthenticatedHeader({ onMenuToggle, isSidebarOpen, isMounted = false }: GlobalAuthenticatedHeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Perform logout function
  const performLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      console.log('BUTTON: Calling logout function');
      await logout();
      console.log('BUTTON: Logout function returned');
    } catch (error) {
      console.error('BUTTON: Logout error:', error);
      // Force manual redirect if logout fails
      window.location.href = '/login';
    }
  };

  // Fungsi untuk reload halaman
  const handleReload = () => {
    console.log('🔄 Reloading page...');
    window.location.reload();
  };

  // Fungsi untuk clear cache
  const handleClearCache = () => {
    console.log('🧹 Clearing cache...');
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.clear();
      // Clear sessionStorage
      sessionStorage.clear();
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Tampilkan notifikasi dan arahkan ke login
      alert('Cache telah dibersihkan! Anda akan diarahkan ke halaman login.');
      window.location.href = '/login';
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  
  const getPageTitle = () => {
    const routeTitles: { [key: string]: string } = {
      '/dashboard': 'Dasbor',
      '/pendaftaran': 'Pendaftaran Program',
      '/jurnal-harian': 'Jurnal Harian',
      '/tashih': 'Tashih Bacaan',
      '/perjalanan-saya': 'Perjalanan Saya',
      '/ujian': 'Ujian',
      '/alumni': 'Ruang Alumni',
      '/statistik': 'Statistik',
      '/tagihan-pembayaran': 'Tagihan & Pembayaran',
      '/donasi-dashboard': 'Donasi',
      '/lengkapi-profile': 'Edit Profil',
      '/pengaturan': 'Pengaturan',
      '/admin': 'Admin Dashboard',
    };

    // Handle nested routes
    for (const route in routeTitles) {
      if (pathname.startsWith(route)) {
        return routeTitles[route];
      }
    }

    return 'Beranda';
  };

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Beranda', href: '/dashboard' }
    ];

    if (pathname.startsWith('/pendaftaran')) {
      breadcrumbs.push({ label: 'Pendaftaran', href: '/pendaftaran' });
      // Add sub-page breadcrumbs for pendaftaran
      if (pathname.includes('/tikrar-tahfidz')) {
        breadcrumbs.push({ label: 'Tikrar Tahfidz', href: '/pendaftaran/tikrar-tahfidz' });
      } else if (pathname.includes('/muallimah')) {
        breadcrumbs.push({ label: 'Muallimah', href: '/pendaftaran/muallimah' });
      } else if (pathname.includes('/musyrifah')) {
        breadcrumbs.push({ label: 'Musyrifah', href: '/pendaftaran/musyrifah' });
      }
    } else if (pathname === '/jurnal-harian') {
      breadcrumbs.push({ label: 'Jurnal Harian', href: '/jurnal-harian' });
    } else if (pathname === '/tashih') {
      breadcrumbs.push({ label: 'Tashih Bacaan', href: '/tashih' });
    } else if (pathname === '/perjalanan-saya') {
      breadcrumbs.push({ label: 'Perjalanan Saya', href: '/perjalanan-saya' });
    } else if (pathname === '/ujian') {
      breadcrumbs.push({ label: 'Ujian', href: '/ujian' });
    } else if (pathname === '/alumni') {
      breadcrumbs.push({ label: 'Ruang Alumni', href: '/alumni' });
    } else if (pathname.startsWith('/statistik')) {
      breadcrumbs.push({ label: 'Statistik', href: '/statistik' });
    } else if (pathname.startsWith('/tagihan-pembayaran')) {
      breadcrumbs.push({ label: 'Tagihan & Pembayaran', href: '/tagihan-pembayaran' });
    } else if (pathname.startsWith('/donasi-dashboard')) {
      breadcrumbs.push({ label: 'Donasi', href: '/donasi-dashboard' });
    } else if (pathname.startsWith('/lengkapi-profile')) {
      breadcrumbs.push({ label: 'Edit Profil', href: '/lengkapi-profile' });
    } else if (pathname.startsWith('/pengaturan')) {
      breadcrumbs.push({ label: 'Pengaturan', href: '/pengaturan' });
    } else if (pathname.startsWith('/admin')) {
      breadcrumbs.push({ label: 'Admin', href: '/admin' });
    }

    return breadcrumbs;
  };

  const notifications = [
    { id: 1, title: 'Jurnal hari ini belum diisi', message: 'Jangan lupa mengisi jurnal harian Ukhti', time: '5 menit yang lalu', read: false },
    { id: 2, title: 'Ujian Tahfidz terdekat', message: 'Ujian juz 30 akan dilaksanakan besok', time: '1 jam yang lalu', read: false },
    { id: 3, title: 'Pembayaran berhasil', message: 'Pembayaran bulan November telah diterima', time: '3 jam yang lalu', read: true },
  ];

  const quickLinks = [
    { href: '/dashboard', icon: Home, label: 'Dasbor' },
    { href: '/jurnal-harian', icon: Bell, label: 'Jurnal' },
    { href: '/tashih', icon: Settings, label: 'Tashih' },
    { href: '/perjalanan-saya', icon: User, label: 'Progres' },
  ];

  return (
    <header className="bg-white/98 backdrop-blur-xl shadow-lg border-b border-green-900/20 transition-all duration-300 w-full z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Left Section - Hamburger Menu & Page Title */}
          <div className="flex items-center space-x-3 md:space-x-4 md:space-x-6 flex-1">
            {/* Hamburger Menu - Mobile/Tablet */}
            <div className="md:hidden">
              <button
                onClick={() => {
                  if (onMenuToggle) {
                    onMenuToggle();
                  } else {
                    setShowMobileMenu(!showMobileMenu);
                  }
                }}
                className="p-2 rounded-lg text-gray-600 hover:text-green-900 hover:bg-green-50"
                disabled={!isMounted}
              >
                {isMounted && (
                  <>
                    {isSidebarOpen !== undefined ? (
                      isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />
                    ) : (
                      showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Page Title - Only show last breadcrumb (current page) */}
            <h1 className="text-base md:text-lg font-semibold text-green-900 truncate">
              {isMounted && getBreadcrumbs()[getBreadcrumbs().length - 1]?.label || getPageTitle()}
            </h1>
          </div>

          {/* Center Section - Spacer */}
          <div className="hidden md:flex items-center flex-1"></div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center space-x-1 md:space-x-4">

            {/* Notifications - Desktop/Tablet */}
            <div className="relative hidden md:block" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-gray-600 hover:text-green-900 hover:bg-green-50"
                disabled={!isMounted}
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isMounted && showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-green-900/20 overflow-hidden z-[100]">
                  <div className="bg-gradient-to-r from-green-900 to-green-800 text-white p-4">
                    <h3 className="font-semibold">Notifikasi</h3>
                    <p className="text-sm opacity-90">{notifications.filter(n => !n.read).length} belum dibaca</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <button className="w-full text-center text-sm text-green-900 hover:text-green-700 font-medium py-2">
                      Lihat semua notifikasi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 p-1 rounded-lg group hover:bg-green-50"
                disabled={!isMounted}
              >
                {/* Avatar from Google/Gmail or generated from name */}
                {(user as any)?.photoURL || user?.avatar_url ? (
                  <Image
                    src={(user as any)?.photoURL || user?.avatar_url || ''}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-8 h-8 lg:w-10 lg:h-10 rounded-full shadow-md group-hover:shadow-lg transition-all duration-300 object-cover"
                    unoptimized
                    onError={(e) => {
                      // Fallback to generated avatar if image fails to load
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.email || 'User')}&background=15803d&color=fff&size=64&bold=true`;
                    }}
                  />
                ) : user?.email ? (
                  <Image
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.email)}&background=15803d&color=fff&size=64&bold=true`}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-8 h-8 lg:w-10 lg:h-10 rounded-full shadow-md group-hover:shadow-lg transition-all duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                    <span className="text-white font-bold text-sm lg:text-base">
                      {(user?.full_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-600 ${
                  showProfileDropdown ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Profile Dropdown */}
              {isMounted && showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-green-900/20 overflow-hidden z-[100]">
                  <div className="bg-gradient-to-r from-green-900 to-green-800 text-white p-4">
                    <div className="flex items-center space-x-3">
                      {/* Avatar in dropdown */}
                      {(user as any)?.photoURL || user?.avatar_url ? (
                        <Image
                          src={(user as any)?.photoURL || user?.avatar_url || ''}
                          alt="Profile"
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full border-2 border-white/30 object-cover"
                          unoptimized
                          onError={(e) => {
                            // Fallback to generated avatar if image fails to load
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.email || 'User')}&background=ffffff&color=15803d&size=64&bold=true`;
                          }}
                        />
                      ) : user?.email ? (
                        <Image
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.email)}&background=ffffff&color=15803d&size=64&bold=true`}
                          alt="Profile"
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full border-2 border-white/30"
                          unoptimized
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {(user?.full_name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{user?.full_name || (user as any)?.displayName || 'Pengguna'}</p>
                        <p className="text-sm opacity-90">{user?.email || ''}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {user?.role === 'calon_thalibah' ? 'Calon Thalibah' :
                           user?.role === 'thalibah' ? 'Thalibah' :
                           user?.role === 'musyrifah' ? 'Musyrifah' :
                           user?.role === 'muallimah' ? 'Muallimah' :
                           user?.role === 'admin' ? 'Administrator' :
                           'User'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/pengaturan"
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-900 rounded-lg transition-colors duration-200 w-full"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Pengaturan Akun</span>
                    </Link>

                    <Link
                      href="/lengkapi-profile"
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-900 rounded-lg transition-colors duration-200 w-full"
                    >
                      <User className="w-4 h-4" />
                      <span>Edit Profil</span>
                    </Link>

                    <button
                      onClick={handleReload}
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-900 rounded-lg transition-colors duration-200 w-full"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reload Halaman</span>
                    </button>

                    <button
                      onClick={handleClearCache}
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors duration-200 w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Bersihkan Cache</span>
                    </button>

                    <div className="border-t border-gray-100 my-2"></div>

                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('BUTTON: Logout clicked');

                        // Show loading state immediately for fast response
                        const buttonElement = e.currentTarget;
                        buttonElement.disabled = true;
                        buttonElement.innerHTML = '<div class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Keluar...</span></div>';

                        // Show confirmation dialog AFTER showing loading state (non-blocking)
                        setTimeout(() => {
                          if (!window.confirm('Apakah Anda yakin ingin keluar?')) {
                            console.log('BUTTON: User cancelled logout');
                            // Reset button state
                            buttonElement.disabled = false;
                            buttonElement.innerHTML = '<div class="flex items-center justify-center gap-2"><svg class="w-6 h-6 sm:w-5 sm:h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg><span>Keluar</span></div>';
                            return;
                          }

                          console.log('BUTTON: User confirmed logout');
                          performLogout();
                        }, 50);
                      }}
                      type="button"
                      aria-label="Keluar dari akun"
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100 active:text-red-800 rounded-lg transition-all duration-200 w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 touch-manipulation min-h-[48px] font-medium sm:px-3 sm:py-3 sm:min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <LogOut className="w-6 h-6 sm:w-5 sm:h-5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMounted && showMobileMenu && (
          <div className="lg:hidden border-t border-green-900/20 py-4 relative z-40">
            {/* Mobile Quick Links */}
            <nav className="grid grid-cols-2 gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-900 rounded-lg transition-colors duration-200"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile Logout Button */}
            <div className="mt-4 pt-4 border-t border-green-900/20">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // Show loading state immediately for fast response
                  const buttonElement = e.currentTarget;
                  buttonElement.disabled = true;
                  buttonElement.innerHTML = '<div class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Keluar...</span></div>';

                  // Show confirmation dialog AFTER showing loading state
                  setTimeout(() => {
                    if (!window.confirm('Apakah Anda yakin ingin keluar?')) {
                      // Reset button state
                      buttonElement.disabled = false;
                      buttonElement.innerHTML = '<div class="flex items-center justify-center gap-2"><svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg><span>Keluar</span></div>';
                      return;
                    }

                    // Perform logout
                    performLogout();
                  }, 50);
                }}
                type="button"
                aria-label="Keluar dari akun"
                className="flex items-center space-x-3 px-4 py-4 text-base text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100 active:text-red-800 rounded-lg transition-all duration-200 w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 touch-manipulation min-h-[48px] font-medium border border-red-200 hover:border-red-300 sm:px-4 sm:py-3 sm:text-sm sm:min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <LogOut className="w-6 h-6" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}