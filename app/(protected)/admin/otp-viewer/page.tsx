'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Copy, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOTPViewer() {
  const [otps, setOtps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOTPs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('password_reset_otps')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOtps(data || []);
    } catch (error) {
      console.error('Error fetching OTPs:', error);
      toast.error('Gagal memuat OTP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOTPs();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOTPs, 30000);
    return () => clearInterval(interval);
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Kode berhasil di-copy!');
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Password Reset OTP Codes</h1>
        <button
          onClick={fetchOTPs}
          className="flex items-center gap-2 px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-900 animate-spin" />
        </div>
      ) : otps.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Belum ada kode OTP yang dibuat</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {otps.map((otp) => (
                <tr key={otp.id} className={isExpired(otp.expires_at) ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 text-sm">{otp.email}</td>
                  <td className="px-6 py-4 text-sm font-mono font-bold">{otp.code}</td>
                  <td className="px-6 py-4">
                    {otp.used ? (
                      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">Used</span>
                    ) : isExpired(otp.expires_at) ? (
                      <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-600">Expired</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-600">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(otp.expires_at).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => copyCode(otp.code)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> Halaman ini untuk melihat kode OTP yang diminta user.
          Admin bisa meng-copy kode dan mengirimkannya manual via WhatsApp/Telegram jika email belum terkonfigurasi.
        </p>
      </div>
    </div>
  );
}
