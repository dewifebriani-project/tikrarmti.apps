'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function MinimalDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4"><em>Antunna</em> belum login. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dashboard MTI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {userData.name}</span>
              <button
                onClick={() => router.push('/')}
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Welcome Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Assalamu'alaikum, {userData.name}! 👋
              </h2>
              <p className="mt-2 text-gray-600">
                Selamat datang di dashboard Markaz Tikrar Indonesia
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Hari Ini
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Jurnal Harian
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Progress
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        12.5%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">🔥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Streak
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        3 Hari
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Menu Cepat
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="text-sm">Jurnal</div>
                </button>
                <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-center">
                  <div className="text-2xl mb-2">🗺️</div>
                  <div className="text-sm">Perjalanan</div>
                </button>
                <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-center">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-sm">Ujian</div>
                </button>
                <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-sm">Alumni</div>
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}