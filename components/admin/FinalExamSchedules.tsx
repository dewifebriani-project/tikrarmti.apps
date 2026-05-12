'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Calendar as CalendarIcon, Clock, Users, Link as LinkIcon, Save, X, Loader2, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useActiveBatch } from '@/hooks/useBatches';
import { cn } from '@/lib/utils';

interface Examiner {
  id: string;
  full_name: string;
}

interface Schedule {
  id: string;
  exam_type: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  examiner_id: string;
  max_quota: number;
  current_count: number;
  location_link: string;
  status: string;
  examiner?: { full_name: string };
}

export function FinalExamSchedules() {
  const { activeBatch } = useActiveBatch();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    exam_type: 'oral',
    exam_date: '',
    start_time: '',
    end_time: '',
    examiner_id: '',
    max_quota: 5,
    location_link: ''
  });

  useEffect(() => {
    fetchSchedules();
  }, [activeBatch]);

  useEffect(() => {
    fetchExaminers();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/exams/final-exams/schedules');
      const result = await response.json();
      if (result.success) {
        setSchedules(result.data);
      }
    } catch (error) {
      console.error('Fetch schedules error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExaminers = async () => {
    try {
      // Fetch both muallimah and musyrifah as they can both be examiners
      const response = await fetch('/api/admin/users?pageSize=100');
      const result = await response.json();
      if (result.success && result.users) {
        // Filter users who have muallimah or musyrifah role
        const staff = (result.users || []).filter((u: any) => 
          u.roles && (u.roles.includes('muallimah') || u.roles.includes('musyrifah') || u.roles.includes('admin'))
        );
        console.log('Fetched staff for examiners:', staff.length);
        setExaminers(staff);
      } else {
        setExaminers([]);
      }
    } catch (error) {
      console.error('Fetch examiners error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/exams/final-exams/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, batch_id: activeBatch?.id })
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Jadwal berhasil ditambahkan');
        setShowAddForm(false);
        fetchSchedules();
      } else {
        toast.error(result.error || 'Gagal menambahkan jadwal');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus jadwal ini?')) return;
    try {
      const response = await fetch(`/api/exams/final-exams/schedules?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        toast.success('Jadwal berhasil dihapus');
        fetchSchedules();
      }
    } catch (error) {
      toast.error('Gagal menghapus jadwal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Daftar Jadwal Ujian</h2>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-xl bg-green-600 hover:bg-green-700"
        >
          {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showAddForm ? 'Batal' : 'Tambah Jadwal'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="rounded-3xl border-2 border-green-100 shadow-xl animate-fadeInDown overflow-hidden">
          <CardHeader className="bg-green-50/50 border-b border-green-100">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-green-800">Input Jadwal Baru</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Jenis Ujian</Label>
                <Select 
                  value={formData.exam_type} 
                  onValueChange={(v) => setFormData({...formData, exam_type: v})}
                >
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oral">Ujian Lisan (Oral)</SelectItem>
                    <SelectItem value="written">Ujian Tulisan (Written)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Penguji (Muallimah)</Label>
                <Select 
                  value={formData.examiner_id} 
                  onValueChange={(v) => setFormData({...formData, examiner_id: v})}
                >
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Pilih Penguji" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {examiners.length > 0 ? (
                      examiners.map(ex => (
                        <SelectItem key={ex.id} value={ex.id}>{ex.full_name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Tidak ada penguji tersedia</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Ujian</Label>
                <Input 
                  type="date" 
                  className="rounded-xl border-gray-200" 
                  value={formData.exam_date}
                  onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Waktu Mulai</Label>
                  <Input 
                    type="time" 
                    className="rounded-xl border-gray-200" 
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Waktu Selesai</Label>
                  <Input 
                    type="time" 
                    className="rounded-xl border-gray-200" 
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Maksimal Quota (Thalibah)</Label>
                <Input 
                  type="number" 
                  className="rounded-xl border-gray-200" 
                  value={formData.max_quota}
                  onChange={(e) => setFormData({...formData, max_quota: parseInt(e.target.value)})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Link Zoom / Lokasi</Label>
                <Input 
                  placeholder="https://zoom.us/j/..." 
                  className="rounded-xl border-gray-200" 
                  value={formData.location_link}
                  onChange={(e) => setFormData({...formData, location_link: e.target.value})}
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="rounded-xl bg-green-600 hover:bg-green-700 px-8"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Jadwal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
        </div>
      ) : schedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map(schedule => (
            <Card key={schedule.id} className="rounded-3xl border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden group">
              <div className={cn(
                "h-2 w-full",
                schedule.exam_type === 'oral' ? "bg-amber-500" : "bg-blue-500"
              )} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    schedule.exam_type === 'oral' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {schedule.exam_type === 'oral' ? 'Ujian Lisan' : 'Ujian Tulisan'}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(schedule.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-green-600" />
                  {new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date(schedule.exam_date))}
                </h3>

                <div className="space-y-3 text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 opacity-40" />
                    <span>{schedule.start_time} - {schedule.end_time} WIB</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 opacity-40" />
                    <span>Quota: <span className="text-gray-900 font-bold">{schedule.current_count} / {schedule.max_quota}</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 opacity-40" />
                    <span>Penguji: <span className="text-gray-900 font-bold">{schedule.examiner?.full_name || 'Belum Ditentukan'}</span></span>
                  </div>
                  {schedule.location_link && (
                    <div className="flex items-center gap-3 truncate">
                      <LinkIcon className="w-4 h-4 opacity-40" />
                      <a href={schedule.location_link} target="_blank" className="text-blue-600 hover:underline truncate">{schedule.location_link}</a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-20 glass-premium rounded-3xl border border-gray-100">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
          <p className="text-gray-400 font-bold">Belum ada jadwal ujian yang dibuat.</p>
        </div>
      )}
    </div>
  );
}
