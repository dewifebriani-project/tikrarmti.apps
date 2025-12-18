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
import { useAuth } from '@/contexts/AuthContext';

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

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

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

      // Tampilkan notifikasi
      alert('Cache telah dibersihkan! Halaman akan di-reload.');
      window.location.reload();
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
      '/jurnal-harian': 'Jurnal Harian',
      '/tashih': 'Tashih Bacaan',
      '/perjalanan-saya': 'Perjalanan Saya',
      '/ujian': 'Ujian',
      '/alumni': 'Ruang Alumni',
      '/progress': 'Progress Tahfidz',
      '/statistik': 'Statistik',
      '/tagihan-pembayaran': 'Tagihan & Pembayaran',
      '/donasi-dashboard': 'Donasi',
      '/lengkapi-profil': 'Edit Profil',
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
    } else if (pathname.startsWith('/lengkapi-profil')) {
      breadcrumbs.push({ label: 'Edit Profil', href: '/lengkapi-profil' });
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
    <header className="bg-white/98 backdrop-blur-xl shadow-lg border-b border-green-900/20 sticky top-0 z-30 transition-all duration-300 md:relative md:left-auto md:right-auto">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Left Section - Hamburger Menu & Breadcrumbs */}
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

            {/* Mobile Breadcrumbs - Hide "Beranda" on mobile */}
            <nav className="flex md:hidden items-center space-x-1 text-xs overflow-hidden">
              {isMounted && getBreadcrumbs().filter(crumb => crumb.label !== 'Beranda').slice(-2).map((crumb, index, arr) => (
                <div key={crumb.href} className="flex items-center space-x-1">
                  {index > 0 && (
                    <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <span className={`truncate max-w-[120px] ${
                    index === arr.length - 1 ? 'text-green-900 font-medium' : 'text-gray-600'
                  }`}>
                    {crumb.label}
                  </span>
                </div>
              ))}
            </nav>

            {/* Breadcrumbs - Desktop */}
            <nav className="hidden md:flex items-center space-x-2 text-sm">
              {getBreadcrumbs().map((crumb, index) => (
                <div key={crumb.href} className="flex items-center space-x-2">
                  {index > 0 && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <Link
                    href={crumb.href}
                    className={`hover:text-green-700 transition-colors duration-200 font-medium ${
                      index === getBreadcrumbs().length - 1 ? 'text-green-900' : 'text-gray-600'
                    }`}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          {/* Center Section - Spacer */}
          <div className="hidden md:flex items-center flex-1"></div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center space-x-1 md:space-x-4">

            {/* Reload Button - Desktop */}
            <button
              onClick={handleReload}
              className="hidden md:block p-2 rounded-lg text-gray-600 hover:text-green-900 hover:bg-green-50 transition-colors duration-200"
              title="Reload Halaman"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Clear Cache Button - Desktop */}
            <button
              onClick={handleClearCache}
              className="hidden md:block p-2 rounded-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors duration-200"
              title="Bersihkan Cache"
            >
              <Trash2 className="w-5 h-5" />
            </button>

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
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-green-900/20 overflow-hidden z-50">
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
                {user?.photoURL || user?.avatar_url ? (
                  <Image
                    src={user.photoURL || user.avatar_url || ''}
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
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-green-900/20 overflow-hidden z-50">
                  <div className="bg-gradient-to-r from-green-900 to-green-800 text-white p-4">
                    <div className="flex items-center space-x-3">
                      {/* Avatar in dropdown */}
                      {user?.photoURL || user?.avatar_url ? (
                        <Image
                          src={user.photoURL || user.avatar_url || ''}
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
                        <p className="font-semibold">{user?.full_name || user?.displayName || 'Pengguna'}</p>
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
                      href="/lengkapi-profil"
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

                        // Show confirmation dialog
                        if (!window.confirm('Apakah Anda yakin ingin keluar?')) {
                          console.log('BUTTON: User cancelled logout');
                          return;
                        }

                        console.log('BUTTON: User confirmed logout');

                        // Show loading state
                        const buttonElement = e.currentTarget;
                        buttonElement.disabled = true;
                        buttonElement.innerHTML = '<div class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Keluar...</span></div>';

                        try {
                          console.log('BUTTON: Calling logout function');
                          await logout();
                          console.log('BUTTON: Logout function returned');
                        } catch (error) {
                          console.error('BUTTON: Logout error:', error);
                          // Force manual redirect if logout fails
                          window.location.href = '/login';
                        }
                      }}
                      type="button"
                      aria-label="Keluar dari akun"
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100 active:text-red-800 rounded-lg transition-all duration-200 w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 touch-manipulation min-h-[48px] font-medium sm:px-3 sm:py-3 sm:min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
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

  
            {/* Mobile Action Buttons */}
            <div className="mt-4 pt-4 border-t border-green-900/20">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={handleReload}
                  className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-900 rounded-lg transition-colors duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload</span>
                </button>
                <button
                  onClick={handleClearCache}
                  className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Cache</span>
                </button>
              </div>
            </div>

            {/* Mobile Logout Button */}
            <div className="mt-4 pt-4 border-t border-green-900/20">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // Show confirmation dialog
                  if (!window.confirm('Apakah Anda yakin ingin keluar?')) {
                    return;
                  }

                  // Show loading state
                  const buttonElement = e.currentTarget;
                  buttonElement.disabled = true;
                  buttonElement.innerHTML = '<div class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Keluar...</span></div>';

                  // Perform logout - the logout function will handle the redirect
                  await logout();
                }}
                type="button"
                aria-label="Keluar dari akun"
                className="flex items-center space-x-3 px-4 py-4 text-base text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100 active:text-red-800 rounded-lg transition-all duration-200 w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 touch-manipulation min-h-[48px] font-medium border border-red-200 hover:border-red-300 sm:px-4 sm:py-3 sm:text-sm sm:min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
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