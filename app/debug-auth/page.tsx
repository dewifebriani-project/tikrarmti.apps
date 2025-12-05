'use client';

import { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const [info, setInfo] = useState({
    origin: '',
    href: '',
    protocol: '',
    host: '',
    pathname: '',
    redirectUrl: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInfo({
        origin: window.location.origin,
        href: window.location.href,
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        redirectUrl: `${window.location.origin}/auth/callback`,
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Auth Configuration</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current URL Info</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex">
              <span className="w-32 text-gray-600">Origin:</span>
              <span className="font-semibold">{info.origin}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-gray-600">Full URL:</span>
              <span className="font-semibold">{info.href}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-gray-600">Protocol:</span>
              <span className="font-semibold">{info.protocol}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-gray-600">Host:</span>
              <span className="font-semibold">{info.host}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-gray-600">Pathname:</span>
              <span className="font-semibold">{info.pathname}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">OAuth Redirect URL</h2>
          <div className="font-mono text-sm">
            <span className="text-gray-600">redirectTo:</span>
            <div className="mt-2 p-3 bg-white rounded border border-blue-300 font-semibold">
              {info.redirectUrl}
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Required Supabase Configuration</h2>
          <p className="text-sm text-gray-700 mb-4">
            Pastikan URL berikut terdaftar di Supabase Dashboard → Authentication → URL Configuration:
          </p>
          <div className="space-y-2 font-mono text-sm bg-white p-4 rounded border border-yellow-300">
            <div>✓ http://localhost:3000/auth/callback</div>
            <div>✓ https://tikrarmtiapps.vercel.app/auth/callback</div>
            <div>✓ https://markaztikrar.id/auth/callback</div>
            <div>✓ https://www.markaztikrar.id/auth/callback</div>
          </div>
        </div>

        <div className="mt-6 bg-green-50 rounded-lg border border-green-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Test Login</h2>
          <p className="text-sm text-gray-700 mb-4">
            Klik tombol di bawah untuk test Google OAuth dari domain ini:
          </p>
          <button
            onClick={() => {
              console.log('OAuth Redirect URL:', `${window.location.origin}/auth/callback`);
              alert(`OAuth akan redirect ke:\n${window.location.origin}/auth/callback`);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Show Redirect URL
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p>Akses halaman ini dari berbagai domain untuk melihat perbedaan URL:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>http://localhost:3000/debug-auth</li>
            <li>https://tikrarmtiapps.vercel.app/debug-auth</li>
            <li>https://markaztikrar.id/debug-auth</li>
            <li>https://www.markaztikrar.id/debug-auth</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
