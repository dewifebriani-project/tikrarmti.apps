'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  Settings,
  LogOut,
  Bell,
  User,
  Home,
  Menu,
  X,
  ChevronDown,
  Edit,
  UserCheck
} from 'lucide-react';

interface GlobalAuthenticatedHeaderProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export default function GlobalAuthenticatedHeader({ onMenuToggle, isSidebarOpen }: GlobalAuthenticatedHeaderProps) {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = async () => {
    try {
      // Close dropdown first
      setShowProfileDropdown(false);
      setShowNotifications(false);
      setShowMobileMenu(false);

      // Perform logout
      await logout();

      // Redirect to home page after logout is complete
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect on error to prevent being stuck
      router.push('/');
    }
  };

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
    } else if (pathname.startsWith('/pengaturan')) {
      breadcrumbs.push({ label: 'Pengaturan', href: '/pengaturan' });
    } else if (pathname.startsWith('/admin')) {
      breadcrumbs.push({ label: 'Admin', href: '/admin' });
    }

    return breadcrumbs;
  };

  const notifications = [
    { id: 1, title: 'Jurnal hari ini belum diisi', message: 'Jangan lupa mengisi jurnal harian Antunna', time: '5 menit yang lalu', read: false },
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
    <header className="bg-white/98 backdrop-blur-xl shadow-lg border-b border-green-900/20 sticky top-0 z-40 transition-all duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Left Section - Breadcrumbs */}
          <div className="flex items-center space-x-4 md:space-x-6 flex-1">
            {/* Breadcrumbs - Desktop/Tablet */}
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
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Quick Actions - Mobile/Tablet */}
            <div className="md:hidden">
              <button
                onClick={() => {
                  if (onMenuToggle) {
                    onMenuToggle();
                  } else {
                    setShowMobileMenu(!showMobileMenu);
                  }
                }}
                className="p-2 rounded-lg text-gray-600 hover:text-green-900 hover:bg-green-50 transition-colors duration-200"
              >
                {isSidebarOpen !== undefined ? (
                  isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />
                ) : (
                  showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Notifications - Desktop/Tablet */}
            <div className="relative hidden md:block" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-gray-600 hover:text-green-900 hover:bg-green-50 transition-colors duration-200"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-green-900/20 overflow-hidden">
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
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-green-50 transition-colors duration-200 group"
              >
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                  <span className="text-white font-bold text-sm lg:text-base">
                    {userData?.name || user?.displayName || 'User'
                      ? (userData?.name || user?.displayName || 'U').charAt(0).toUpperCase()
                      : 'U'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                  showProfileDropdown ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-green-900/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-900 to-green-800 text-white p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {userData?.name || user?.displayName || 'User'
                            ? (userData?.name || user?.displayName || 'U').charAt(0).toUpperCase()
                            : 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{userData?.name || user?.displayName || 'Pengguna'}</p>
                        <p className="text-sm opacity-90">{user?.email}</p>
                        <p className="text-xs opacity-75 mt-1">{userData?.role || 'Calon Tahfidzah'}</p>
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

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-green-900/20 py-4">
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

            {/* Mobile Breadcrumbs */}
            <nav className="mt-4 pt-4 border-t border-green-900/20">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center space-x-2">
                    {index > 0 && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    <Link
                      href={crumb.href}
                      className={`hover:text-green-700 transition-colors duration-200 ${
                        index === getBreadcrumbs().length - 1 ? 'text-green-900 font-medium' : ''
                      }`}
                    >
                      {crumb.label}
                    </Link>
                  </div>
                ))}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}