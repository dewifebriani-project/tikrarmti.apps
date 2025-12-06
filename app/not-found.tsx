'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-8">
          <img
            src="/mti-logo.jpg"
            alt="Tikrar MTI Apps"
            width={120}
            height={120}
            className="mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404 - Halaman Tidak Ditemukan</h1>
          <p className="text-lg text-gray-600 mb-8">
            Maaf, halaman yang Anda cari tidak tersedia.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Kembali ke Beranda
          </Link>

          <div className="text-sm text-gray-500">
            Atau{' '}
            <Link href="/login" className="text-green-600 hover:underline">
              masuk ke akun Anda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}