'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, CheckCircle2, Clock, User, Award, MessageSquare, Save, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Registration {
  id: string;
  user_id: string;
  schedule_id: string;
  status: string;
  score_lisan: number | null;
  score_tulisan: number | null;
  feedback: string | null;
  user: { full_name: string; whatsapp: string };
  schedule: {
    exam_type: string;
    exam_date: string;
    start_time: string;
    examiner: { full_name: string };
  };
}

export function FinalExamParticipants() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [gradingData, setGradingData] = useState({
    score_lisan: 0,
    feedback: ''
  });

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/exams/final-exams/registrations/admin');
      const result = await response.json();
      if (result.success) {
        setRegistrations(result.data || []);
      }
    } catch (error) {
      console.error('Fetch registrations error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenGrading = (reg: Registration) => {
    setSelectedReg(reg);
    setGradingData({
      score_lisan: reg.score_lisan || 0,
      feedback: reg.feedback || ''
    });
  };

  const handleSaveGrade = async () => {
    if (!selectedReg) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/exams/final-exams/registrations/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: selectedReg.id,
          score_lisan: gradingData.score_lisan,
          feedback: gradingData.feedback
        })
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Penilaian berhasil disimpan');
        setSelectedReg(null);
        fetchRegistrations();
      } else {
        toast.error(result.error || 'Gagal menyimpan nilai');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = registrations.filter(r => 
    r.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    r.schedule.examiner.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Cari thalibah atau penguji..." 
              className="pl-10 rounded-xl border-gray-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-xl border-gray-200">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((reg) => (
              <Card 
                key={reg.id} 
                onClick={() => handleOpenGrading(reg)}
                className={cn(
                  "rounded-2xl border-none shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden group",
                  selectedReg?.id === reg.id ? "ring-2 ring-green-500" : ""
                )}
              >
                <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 leading-tight">{reg.user.full_name}</h4>
                      <p className="text-xs text-gray-500 font-medium">
                        {reg.schedule.exam_type === 'oral' ? 'Ujian Lisan' : 'Ujian Tulisan'} • {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(reg.schedule.exam_date))}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                          reg.status === 'completed' || reg.status === 'graded' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {reg.status === 'graded' ? 'Sudah Dinilai' : reg.status}
                        </span>
                        {reg.score_lisan !== null && (
                          <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            Nilai: {reg.score_lisan}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    "w-5 h-5 transition-transform",
                    selectedReg?.id === reg.id ? "translate-x-1 text-green-600" : "text-gray-300"
                  )} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-20 glass-premium rounded-3xl">
            <User className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-gray-400 font-bold">Tidak ada pendaftar ditemukan.</p>
          </div>
        )}
      </div>

      {/* Grading Column */}
      <div className="lg:col-span-1">
        {selectedReg ? (
          <Card className="rounded-3xl border-none shadow-2xl glass-premium sticky top-24 overflow-hidden animate-fadeInRight">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white">
              <h3 className="text-lg font-black tracking-tight">Form Penilaian</h3>
              <p className="text-xs text-green-100 opacity-80 mt-1">Berikan penilaian untuk {selectedReg.user.full_name}</p>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Award className="w-3.5 h-3.5" />
                    Nilai Ujian Lisan (0-100)
                  </Label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    className="rounded-xl border-gray-200 h-12 text-lg font-black"
                    value={gradingData.score_lisan}
                    onChange={(e) => setGradingData({...gradingData, score_lisan: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Catatan / Feedback
                  </Label>
                  <Textarea 
                    placeholder="Contoh: Tajwid sangat bagus, kelancaran perlu ditingkatkan di akhir juz."
                    className="rounded-xl border-gray-200 min-h-[120px] text-sm"
                    value={gradingData.feedback}
                    onChange={(e) => setGradingData({...gradingData, feedback: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  onClick={handleSaveGrade}
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-green-600 hover:bg-green-700 h-12 shadow-lg shadow-green-600/20 font-bold"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Penilaian
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedReg(null)}
                  className="w-full text-gray-400 hover:text-gray-600 font-bold"
                >
                  Batal
                </Button>
              </div>

              <div className="pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  Informasi Jadwal
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Tanggal:</span>
                    <span className="font-bold text-gray-900">{selectedReg.schedule.exam_date}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Waktu:</span>
                    <span className="font-bold text-gray-900">{selectedReg.schedule.start_time} WIB</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Penguji:</span>
                    <span className="font-bold text-gray-900">{selectedReg.schedule.examiner.full_name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-100 rounded-[3rem] p-10 text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200">
                <Award className="w-8 h-8" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Panel Penilaian</h4>
                <p className="text-xs text-gray-300 font-medium">Pilih salah satu thalibah di daftar untuk memberikan nilai ujian.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
