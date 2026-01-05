'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle } from 'lucide-react';
import DaftarUlangContent from './DaftarUlangContent';

export default function DaftarUlangPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [batchId, setBatchId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Get batch_id from URL search params
  useEffect(() => {
    setIsClient(true);
    const params = new URLSearchParams(window.location.search);
    const urlBatchId = params.get('batch_id');
    if (urlBatchId) {
      setBatchId(urlBatchId);
    }
  }, []);

  // Update batchId from user when user data is loaded
  useEffect(() => {
    if (user && !batchId) {
      // Fetch user's current batch from API
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.data?.current_tikrar_batch_id) {
            setBatchId(data.data.current_tikrar_batch_id);
          }
        })
        .catch(() => {
          // Ignore error, will show batch not found message
        });
    }
  }, [user, batchId]);

  // Show loading while auth is loading
  if (authLoading || !isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-900 mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (handled by useAuth hook)
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-yellow-50 p-6 rounded-lg">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Sesi Berakhir</h3>
          <p className="text-yellow-700">Mohon login kembali untuk melanjutkan.</p>
        </div>
      </div>
    );
  }

  if (!batchId) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-4">Batch Tidak Ditemukan</h1>
        <p className="text-gray-600 mb-6">Silakan pilih batch terlebih dahulu dari menu Perjalanan Saya.</p>
        <a
          href="/perjalanan-saya"
          className="inline-block px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors"
        >
          Ke Perjalanan Saya
        </a>
      </div>
    );
  }

  return <DaftarUlangContent userId={user.id} batchId={batchId} />;
}
