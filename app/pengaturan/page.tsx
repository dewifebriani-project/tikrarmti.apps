'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Settings } from 'lucide-react';

export default function PengaturanPage() {
  const router = useRouter();

  return (
    <AuthenticatedLayout title="Pengaturan">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-green-900" />
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          </div>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Akun</h2>
              <p className="text-sm text-gray-600">
                Kelola informasi akun dan preferensi Anda
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Halaman pengaturan sedang dalam pengembangan.
                Untuk saat ini, Anda dapat mengubah informasi profil di halaman Lengkapi Profil.
              </p>
              <button
                onClick={() => router.push('/lengkapi-profil')}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Pergi ke Lengkapi Profil
              </button>
            </div>

            {/* Placeholder sections */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Notifikasi</h3>
                <p className="text-sm text-gray-500">Atur preferensi notifikasi Anda</p>
                <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Segera hadir
                </span>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Privasi & Keamanan</h3>
                <p className="text-sm text-gray-500">Kelola pengaturan privasi dan keamanan akun</p>
                <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Segera hadir
                </span>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Bahasa & Wilayah</h3>
                <p className="text-sm text-gray-500">Ubah bahasa dan zona waktu</p>
                <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Segera hadir
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
