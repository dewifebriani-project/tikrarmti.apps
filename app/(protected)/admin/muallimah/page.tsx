'use client';

import { useState, useEffect } from 'react';
import { Shield, ArrowLeft, GraduationCap, BarChart3, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from 'sonner';
import { MuallimahV2Tab } from '@/components/admin/muallimah-v2/MuallimahV2Tab';
import { MuallimahAnalysisTab } from '@/components/admin/muallimah-v2/MuallimahAnalysisTab';
import { cn } from '@/lib/utils';

export default function AdminMuallimahPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'analysis'>('data');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50/50" />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Toaster position="top-right" richColors />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
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
                  Daftar Muallimah
                  <span className="px-2 py-0.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                    V2
                  </span>
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 border-b border-transparent">
            <button
              onClick={() => setActiveTab('data')}
              className={cn(
                "pb-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2",
                activeTab === 'data'
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <Users className="h-4 w-4" />
              Data Muallimah
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={cn(
                "pb-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2",
                activeTab === 'analysis'
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <BarChart3 className="h-4 w-4" />
              Analisis Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {activeTab === 'data' ? (
          <MuallimahV2Tab user={user} />
        ) : (
          <MuallimahAnalysisTab />
        )}
      </div>
    </div>
  );
}
