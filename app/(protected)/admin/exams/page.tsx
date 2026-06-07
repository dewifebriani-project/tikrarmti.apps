'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Calendar, Users, FileText, ArrowLeft, Shield } from 'lucide-react';
import { FinalExamSchedules } from '@/components/admin/FinalExamSchedules';
import { FinalExamParticipants } from '@/components/admin/FinalExamParticipants';
import Link from 'next/link';

export default function AdminExamsPage() {
  const [activeTab, setActiveTab] = useState('schedules');

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
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
                  Manajemen Ujian Akhir
                  <span className="px-2 py-0.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                    Portal v2.0
                  </span>
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1.5 border border-gray-100 rounded-2xl shadow-sm inline-flex w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <TabsTrigger 
              value="schedules" 
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-green-800 hover:bg-gray-50/50 data-[state=active]:bg-green-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Jadwal Ujian
            </TabsTrigger>
            <TabsTrigger 
              value="participants" 
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-green-800 hover:bg-gray-50/50 data-[state=active]:bg-green-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Peserta & Penilaian
            </TabsTrigger>
            <TabsTrigger 
              value="questions" 
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-green-800 hover:bg-gray-50/50 data-[state=active]:bg-green-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300"
            >
              <FileText className="w-4 h-4 mr-2" />
              Bank Soal MCQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="animate-fadeInUp">
            <FinalExamSchedules />
          </TabsContent>

          <TabsContent value="participants" className="animate-fadeInUp">
            <FinalExamParticipants />
          </TabsContent>

          <TabsContent value="questions">
            <Card className="rounded-3xl border border-gray-100 bg-white shadow-xl">
              <CardContent className="p-10 text-center text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p className="font-bold">Bank soal Pilihan Ganda akan diimplementasikan pada tahap selanjutnya.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
