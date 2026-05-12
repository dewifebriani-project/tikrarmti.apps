'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Calendar, Users, FileText } from 'lucide-react';
import { FinalExamSchedules } from '@/components/admin/FinalExamSchedules';
import { FinalExamParticipants } from '@/components/admin/FinalExamParticipants';

export default function AdminExamsPage() {
  const [activeTab, setActiveTab] = useState('schedules');

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-green-700" />
            Manajemen Ujian Akhir
          </h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Kelola jadwal, penguji, dan penilaian ujian thalibah.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white p-1 border border-gray-100 rounded-2xl shadow-sm inline-flex">
          <TabsTrigger value="schedules" className="rounded-xl px-6 data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Jadwal Ujian
          </TabsTrigger>
          <TabsTrigger value="participants" className="rounded-xl px-6 data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Peserta & Penilaian
          </TabsTrigger>
          <TabsTrigger value="questions" className="rounded-xl px-6 data-[state=active]:bg-green-600 data-[state=active]:text-white">
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
          <Card className="rounded-3xl border-none shadow-xl glass-premium">
            <CardContent className="p-10 text-center text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="font-bold">Bank soal Pilihan Ganda akan diimplementasikan pada tahap selanjutnya.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
