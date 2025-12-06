'use client';

import { usePathname } from 'next/navigation';
import { Heart, HandCoins, Target, TrendingUp, History, Settings, Home, ArrowLeft, FileText, Users, Receipt } from 'lucide-react';

export default function DonasiSidebar() {
  const pathname = usePathname();

  const donasiMenuItems = [
    {
      href: '/donasi',
      label: 'Dashboard Donasi',
      icon: Heart,
      isActive: pathname === '/donasi'
    },
    {
      href: '/donasi-dashboard/form',
      label: 'Buat Donasi',
      icon: HandCoins,
      isActive: pathname === '/donasi-dashboard/form'
    },
    {
      href: '/donasi-dashboard/riwayat',
      label: 'Riwayat Donasi',
      icon: History,
      isActive: pathname === '/donasi-dashboard/riwayat'
    },
    {
      href: '/donasi-dashboard/program',
      label: 'Program Donasi',
      icon: Target,
      isActive: pathname === '/donasi-dashboard/program'
    },
    {
      href: '/donasi-dashboard/statistik',
      label: 'Statistik',
      icon: TrendingUp,
      isActive: pathname === '/donasi-dashboard/statistik'
    },
    {
      href: '/donasi-dashboard/rekening',
      label: 'Info Rekening',
      icon: Receipt,
      isActive: pathname === '/donasi-dashboard/rekening'
    },
    {
      href: '/donasi-dashboard/laporan',
      label: 'Laporan Donasi',
      icon: FileText,
      isActive: pathname === '/donasi-dashboard/laporan'
    }
  ];

  const quickActions = [
    {
      href: '/dashboard',
      label: 'Kembali ke Dashboard',
      icon: ArrowLeft,
      isActive: false
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Donasi MTI Apps</h3>
            <p className="text-xs text-gray-500">Sistem Pembelajaran Tahfidz</p>
          </div>
        </div>
      </div>

      {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-green-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-900 font-semibold">
                {'P'.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Pengguna
              </p>
              <p className="text-xs text-gray-500 truncate">
                demo@example.com
              </p>
            </div>
          </div>
        </div>

      {/* Donasi Menu */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Menu Donasi
          </h4>
          <nav className="space-y-1">
            {donasiMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.isActive
                      ? 'bg-green-100 text-green-900 border-l-4 border-green-900'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Aksi Cepat
          </h4>
          <nav className="space-y-1">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs font-medium text-gray-700 mb-1">
            Sedekah Jariyah
          </p>
          <p className="text-xs text-gray-500">
            Amal jariyah Ukhti akan terus mengalir
          </p>
          <div className="mt-2">
            <Heart className="w-4 h-4 text-green-600 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}