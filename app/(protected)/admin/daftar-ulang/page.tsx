'use client';

import { useState, useEffect } from 'react';
import { Shield, ArrowLeft, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Toaster, toast } from 'sonner';
import { DaftarUlangV2Tab } from '@/components/admin/daftar-ulang-v2/DaftarUlangV2Tab';
import { Button } from "@/components/ui/button";

export default function AdminDaftarUlangPage() {
  const [mounted, setMounted] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50/50" />;
  }

  const handleFinalizeExams = async () => {
    if (!window.confirm("Apakah Ukhti yakin ingin memfinalisasi ujian untuk batch aktif? Aksi ini akan menurukan target hafalan thalibah yang belum lulus ke Juz 30A secara massal. Lanjutkan?")) {
      return;
    }
    
    try {
      setIsFinalizing(true);
      const res = await fetch('/api/admin/daftar-ulang/finalize-exams', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to finalize exams');
      
      if (data.downgradedCount > 0) {
        toast.success(data.message, { duration: 5000 });
        // Optional: reload the page to refresh data in tabs
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.info(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat finalisasi ujian');
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Toaster position="top-right" richColors />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 mb-8 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all border border-transparent hover:border-gray-200"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-[0.2em] mb-1">
                  <Shield className="h-3 w-3" />
                  <span>Authority Console</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  Daftar Ulang
                  <span className="px-2 py-0.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                    V2
                  </span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="destructive" 
                className="h-10 px-4 rounded-xl shadow-sm gap-2"
                onClick={handleFinalizeExams}
                disabled={isFinalizing}
              >
                {isFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Finalisasi Ujian
              </Button>

              <div className="h-10 px-4 rounded-xl bg-gray-100/50 border border-gray-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">
                  Data Daftar Ulang
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <DaftarUlangV2Tab />
      </div>
    </div>
  );
}
