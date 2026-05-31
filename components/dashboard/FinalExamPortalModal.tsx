'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, FileText, Award, Lock, ChevronRight, CheckCircle2, Clock, MessageSquare, AlertCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FinalExamSelectionModal } from './FinalExamSelectionModal';

interface FinalExamPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  hariAktual: number;
  percentage: number;
  isAdmin?: boolean;
  batchName?: string;
}

export function FinalExamPortalModal({ isOpen, onClose, hariAktual, percentage, isAdmin, batchName }: FinalExamPortalModalProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'oral' | 'written' | null>(null);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRegistrations();
    }
  }, [isOpen]);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/exams/final-exams/registrations');
      const result = await response.json();
      if (result.success) {
        setRegistrations(Array.isArray(result.data) ? result.data : result.data ? [result.data] : []);
      }
    } catch (error) {
      console.error('Fetch registrations error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = (type: 'oral' | 'written') => {
    let isLocked = false;
    if (!isAdmin) {
      if (type === 'oral') {
        isLocked = percentage < 100;
      } else {
        isLocked = hariAktual < 40; // Ujian Tulisan requires min 40 days
      }
    }
    
    const reg = registrations.find(r => r.schedule?.exam_type === type);

    if (isLocked) return 'locked';
    if (reg) return reg.status; // 'registered', 'graded', etc.
    return 'available';
  };

  const handleAction = (type: 'oral' | 'written') => {
    const status = getStatus(type);
    if (status === 'locked') return;
    
    // Written exam is done via G-Form, just show info
    if (type === 'written') {
      if (status !== 'graded') {
        import('react-hot-toast').then(m => m.toast('Ujian Tulisan dilakukan via G-Form. Nilai akan diinput oleh Admin.', { icon: 'ℹ️' }));
      }
      return;
    }

    setSelectedType(type);
    setSelectionOpen(true);
  };

  const exams = [
    {
      id: 'oral',
      type: 'oral' as const,
      label: 'Ujian Lisan',
      subtitle: 'Setoran Hafalan',
      description: 'Ujian kelancaran hafalan bersama Penguji (Muallimah).',
      icon: Award,
      minHari: 47,
      color: 'emerald'
    },
    {
      id: 'written',
      type: 'written' as const,
      label: 'Ujian Tulisan',
      subtitle: 'Pilihan Ganda',
      description: 'Tes pemahaman materi melalui 100 soal pilihan ganda.',
      icon: FileText,
      minHari: 40,
      color: 'blue'
    }
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-8 sm:p-12 relative overflow-hidden shrink-0">
            <div className="relative z-10">
              <DialogTitle className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-4 mb-2">
                <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12" />
                Ujian Akhir
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-base sm:text-lg font-medium max-w-md leading-relaxed">
                Tahap akhir perjalanan Ukhti untuk mendapatkan sertifikat kelulusan Tikrar MTI.
                <div className="mt-3 flex flex-wrap gap-2">
                  {batchName && (
                    <span className="inline-block px-4 py-1.5 bg-white/20 text-white font-bold rounded-full text-sm backdrop-blur-sm border border-white/30">
                      {batchName}
                    </span>
                  )}
                  {isAdmin && (
                    <span className="inline-block px-4 py-1.5 bg-purple-500/50 text-white font-bold rounded-full text-sm backdrop-blur-sm border border-purple-300/50 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Mode Admin (Bypass Gembok)
                    </span>
                  )}
                </div>
              </DialogDescription>
            </div>
            
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
          </DialogHeader>

          <div className="flex-1 min-h-0 p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 overflow-y-auto">
            {exams.map((exam) => {
              const status = getStatus(exam.type);
              const isLocked = status === 'locked';
              const isGraded = status === 'graded';
              const isRegistered = status === 'registered';

              return (
                <Card 
                  key={exam.id}
                  onClick={() => handleAction(exam.type)}
                  className={cn(
                    "group relative rounded-[2rem] border-2 transition-all duration-500 overflow-hidden cursor-pointer h-full",
                    isLocked ? "bg-white border-gray-100 opacity-60 grayscale" : 
                    isGraded ? "bg-emerald-50 border-emerald-200 shadow-emerald-900/5" :
                    isRegistered ? "bg-blue-50 border-blue-200 shadow-blue-900/5" :
                    "bg-white border-white hover:border-indigo-100 shadow-xl hover:shadow-indigo-900/10 hover:-translate-y-2"
                  )}
                >
                  <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className={cn(
                        "w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110",
                        exam.color === 'blue' ? "bg-blue-600 text-white shadow-blue-600/20" : "bg-emerald-600 text-white shadow-emerald-600/20"
                      )}>
                        <exam.icon className="w-8 h-8" />
                      </div>
                      
                      {isLocked ? (
                        <div className="bg-gray-100 p-2 rounded-xl text-gray-400">
                          <Lock className="w-5 h-5" />
                        </div>
                      ) : isGraded ? (
                        <div className="bg-emerald-600 text-white p-2 rounded-xl">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : isRegistered ? (
                        <div className="bg-blue-600 text-white p-2 rounded-xl">
                          <Clock className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-2 rounded-xl text-gray-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">
                          {exam.subtitle}
                        </span>
                        <h4 className="text-2xl font-black text-gray-900 tracking-tight">
                          {exam.label}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        {exam.description}
                      </p>
                    </div>

                    <div className="pt-2">
                      {isLocked ? (
                        <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-2 rounded-full w-fit">
                          <AlertCircle className="w-3 h-3" />
                          {exam.type === 'oral' ? 'Selesaikan Jurnal 100%' : 'Selesaikan Pekan 10'}
                        </div>
                      ) : isGraded ? (
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-2 rounded-full w-fit">
                          Sudah Selesai
                        </div>
                      ) : isRegistered ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-black text-blue-700 uppercase tracking-widest bg-blue-100 px-3 py-2 rounded-full w-fit">
                            Terdaftar
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-2 rounded-full w-fit transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                          Pilih Jadwal
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="p-8 text-center border-t border-gray-100 bg-white">
             <p className="text-xs text-gray-400 font-medium italic">
                *Pastikan Ukhti sudah siap secara materi dan hafalan sebelum memilih jadwal ujian.
             </p>
          </div>
        </DialogContent>
      </Dialog>

      <FinalExamSelectionModal 
        isOpen={selectionOpen} 
        onClose={() => setSelectionOpen(false)} 
        examType={selectedType || 'oral'} 
      />
    </>
  );
}
