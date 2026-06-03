'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Calendar as CalendarIcon, Clock, Users, Link as LinkIcon, Save, X, Loader2, GraduationCap, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useActiveBatch, useBatches } from '@/hooks/useBatches';
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
  const { batches } = useBatches();
  const { activeBatch } = useActiveBatch();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    exam_type: 'oral',
    examiner_id: '',
    max_quota: 5,
    location_link: '',
    sessions: [{ exam_date: '', start_time: '', end_time: '' }]
  });

  useEffect(() => {
    if (activeBatch && !selectedBatchId) {
      setSelectedBatchId(activeBatch.id);
    }
  }, [activeBatch, selectedBatchId]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchSchedules();
    }
  }, [selectedBatchId]);

  useEffect(() => {
    fetchExaminers();
  }, []);

  const fetchSchedules = async () => {
    try {
      const url = selectedBatchId 
        ? `/api/exams/final-exams/schedules?batch_id=${selectedBatchId}`
        : '/api/exams/final-exams/schedules';
      const response = await fetch(url);
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
      // Mengambil daftar muallimah otomatis dari gabungan pendaftaran dan penugasan halaqah
      const response = await fetch(`/api/admin/examiners`, { cache: 'no-store' });
      const result = await response.json();
      
      if (result.success && result.data) {
        const staff = result.data.map((m: any) => ({
          id: m.id,
          full_name: m.full_name
        }));
        console.log('Fetched muallimah for examiners:', staff.length);
        setExaminers(staff);
      } else {
        setExaminers([]);
      }
    } catch (error) {
      console.error('Fetch examiners error:', error);
      setExaminers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.examiner_id) {
      toast.error('Harap pilih penguji (examiner)');
      return;
    }

    const hasEmptySession = formData.sessions.some(s => !s.exam_date || !s.start_time || !s.end_time);
    if (hasEmptySession) {
      toast.error('Harap lengkapi tanggal dan jam pada semua sesi ujian');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const session = formData.sessions[0];
        const response = await fetch('/api/exams/final-exams/schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: editingId,
            exam_type: formData.exam_type,
            examiner_id: formData.examiner_id,
            max_quota: formData.max_quota,
            location_link: formData.location_link,
            exam_date: session.exam_date,
            start_time: session.start_time,
            end_time: session.end_time
          })
        });

        if (response.ok) {
          toast.success('Jadwal berhasil diperbarui');
          setShowAddForm(false);
          resetForm();
          fetchSchedules();
        } else {
          toast.error('Gagal memperbarui jadwal');
        }
      } else {
        const promises = formData.sessions.map(session => 
          fetch('/api/exams/final-exams/schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              batch_id: selectedBatchId,
              exam_type: formData.exam_type,
              examiner_id: formData.examiner_id,
              max_quota: formData.max_quota,
              location_link: formData.location_link,
              exam_date: session.exam_date,
              start_time: session.start_time,
              end_time: session.end_time
            })
          })
        );
        
        const results = await Promise.all(promises);
        const allSuccess = results.every(r => r.ok);

        if (allSuccess) {
          toast.success(`${formData.sessions.length} Jadwal berhasil ditambahkan`);
          setShowAddForm(false);
          resetForm();
          fetchSchedules();
        } else {
          toast.error('Beberapa jadwal mungkin gagal ditambahkan');
          fetchSchedules();
        }
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      exam_type: 'oral',
      examiner_id: '',
      max_quota: 5,
      location_link: '',
      sessions: [{ exam_date: '', start_time: '', end_time: '' }]
    });
    setEditingId(null);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setFormData({
      exam_type: schedule.exam_type,
      examiner_id: schedule.examiner_id || '',
      max_quota: schedule.max_quota,
      location_link: schedule.location_link || '',
      sessions: [{ 
        exam_date: schedule.exam_date, 
        start_time: schedule.start_time, 
        end_time: schedule.end_time 
      }]
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addSession = () => {
    setFormData({
      ...formData,
      sessions: [...formData.sessions, { exam_date: '', start_time: '', end_time: '' }]
    });
  };

  const removeSession = (index: number) => {
    if (formData.sessions.length <= 1) return;
    const newSessions = [...formData.sessions];
    newSessions.splice(index, 1);
    setFormData({ ...formData, sessions: newSessions });
  };

  const updateSession = (index: number, field: string, value: string) => {
    const newSessions = [...formData.sessions];
    newSessions[index] = { ...newSessions[index], [field]: value };
    setFormData({ ...formData, sessions: newSessions });
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
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">Daftar Jadwal Ujian</h2>
          <Select 
            value={selectedBatchId || ""} 
            onValueChange={(v) => setSelectedBatchId(v)}
          >
            <SelectTrigger className="w-[200px] rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Pilih Batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map(batch => (
                <SelectItem key={batch.id} value={batch.id}>{batch.name.replace(/Tikrar Tahfidz MTI /gi, '')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
          <Button 
            onClick={() => {
              if (showAddForm) resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="rounded-xl bg-green-600 hover:bg-green-700"
          >
            {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showAddForm ? 'Batal' : 'Tambah Jadwal'}
          </Button>
      </div>

      {showAddForm && (
        <Card className="rounded-3xl border-2 border-green-100 shadow-xl animate-fadeInDown overflow-hidden">
          <CardHeader className="bg-green-50/50 border-b border-green-100">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-green-800">
              {editingId ? 'Edit Jadwal Ujian' : 'Input Jadwal Baru'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Penguji (Examiner)</Label>
                  <Select 
                    value={formData.examiner_id} 
                    onValueChange={(v) => setFormData({...formData, examiner_id: v})}
                    required
                  >
                    <SelectTrigger className={`rounded-xl border-gray-200 ${!formData.examiner_id ? "text-gray-500" : ""}`}>
                      <SelectValue placeholder="Pilih Penguji" />
                    </SelectTrigger>
                    <SelectContent>
                      {examiners.map(examiner => (
                        <SelectItem key={examiner.id} value={examiner.id}>{examiner.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                  <Label>Maksimal Quota per Sesi</Label>
                  <Input 
                    type="number" 
                    className="rounded-xl border-gray-200" 
                    value={formData.max_quota}
                    onChange={(e) => setFormData({...formData, max_quota: parseInt(e.target.value)})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link Zoom / Lokasi (Opsional)</Label>
                  <Input 
                    placeholder="https://zoom.us/j/..." 
                    className="rounded-xl border-gray-200" 
                    value={formData.location_link}
                    onChange={(e) => setFormData({...formData, location_link: e.target.value})}
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-base font-bold">Sesi Ujian</Label>
                  {!editingId && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addSession}
                      className="rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Sesi
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.sessions.map((session, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-end gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex-1 space-y-2 w-full">
                        <Label>Tanggal</Label>
                        <Input 
                          type="date" 
                          className="rounded-xl bg-white" 
                          value={session.exam_date}
                          onChange={(e) => updateSession(index, 'exam_date', e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex-1 space-y-2 w-full">
                        <Label>Waktu Mulai</Label>
                        <Input 
                          type="time" 
                          className="rounded-xl bg-white" 
                          value={session.start_time}
                          onChange={(e) => updateSession(index, 'start_time', e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex-1 space-y-2 w-full">
                        <Label>Waktu Selesai</Label>
                        <Input 
                          type="time" 
                          className="rounded-xl bg-white" 
                          value={session.end_time}
                          onChange={(e) => updateSession(index, 'end_time', e.target.value)}
                          required
                        />
                      </div>
                      {formData.sessions.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => removeSession(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="rounded-xl bg-green-600 hover:bg-green-700 px-8"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingId ? 'Update Jadwal' : 'Simpan Jadwal'}
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
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(schedule)}
                      className="text-gray-300 hover:text-blue-500 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(schedule.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
                    <span>Penguji: <span className="text-gray-900 font-bold">{schedule.examiner?.full_name || '-'}</span></span>
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
