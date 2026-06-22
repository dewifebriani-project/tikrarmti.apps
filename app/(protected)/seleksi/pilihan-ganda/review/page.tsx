'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Home } from 'lucide-react';
import Link from 'next/link';

export default function ExamReviewPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-800 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="max-w-xl w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-md">
        <CardContent className="p-10 text-center space-y-8 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100 animate-pulse">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Jawaban Ujian Tertulis Telah Dikirim
            </h1>
            <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-md mx-auto">
              Jazakillah khairan katsiran, jawaban ujian pilihan ganda Ukhti telah berhasil kami terima dan simpan. Status pendaftaran dan kelulusan seleksi secara keseluruhan akan diumumkan sesuai jadwal pengumuman di dashboard Perjalanan Saya.
            </p>
          </div>

          <div className="w-full pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/perjalanan-saya" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto rounded-2xl h-12 px-8 font-black bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
