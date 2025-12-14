'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, User, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface ProfileCompletionCheckProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProfileCompletionCheck({ children, fallback }: ProfileCompletionCheckProps) {
  const { user } = useAuth();

  // Routes that don't require profile completion
  const excludedRoutes = [
    '/dashboard',
    '/pengaturan',
    '/tagihan-pembayaran',
    '/admin'
  ];

  // Check if current route is excluded
  const isExcludedRoute = () => {
    if (typeof window === 'undefined') return false;
    return excludedRoutes.some(route => window.location.pathname.startsWith(route));
  };

  // Check if profile is complete
  const isProfileComplete = () => {
    if (!user) return false;
    return !!(user.full_name && (user as any).phone);
  };

  // If profile is complete or route is excluded, show children
  if (isProfileComplete() || isExcludedRoute()) {
    return <>{children}</>;
  }

  // If custom fallback is provided, show it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default profile completion prompt
  return (
    <div className="min-h-96 flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Lengkapi Profile Ukhti
          </h2>

          <p className="text-gray-600 mb-6">
            Untuk dapat mengakses seluruh fitur di aplikasi, silakan lengkapi data profile terlebih dahulu.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status Profile</span>
              <span className="text-yellow-600 font-medium">Belum Lengkap</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full w-1/3"></div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900">
                  Data yang diperlukan:
                </p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Nama lengkap</li>
                  <li>• Tanggal lahir</li>
                  <li>• Alamat lengkap</li>
                  <li>• Kota dan provinsi</li>
                  <li>• Nomor WhatsApp</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}