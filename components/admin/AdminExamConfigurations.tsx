'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Save, Settings } from 'lucide-react';

interface ExamConfig {
  id?: string;
  max_attempts: number;
  passing_score: number;
  duration_minutes: number;
  questions_per_attempt: number;
  shuffle_questions: boolean;
  is_active: boolean;
}

export function AdminExamConfigurations() {
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/exams/config');
      const data = await res.json();
      if (data.success && data.data) {
        setConfig(data.data);
      } else {
        // Default config
        setConfig({
          max_attempts: 3,
          passing_score: 80,
          duration_minutes: 300,
          questions_per_attempt: 100,
          shuffle_questions: false,
          is_active: true
        });
      }
    } catch (err) {
      console.error('Failed to fetch config', err);
      toast.error('Gagal mengambil pengaturan ujian');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/exams/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pengaturan berhasil disimpan');
        setConfig(data.data);
      } else {
        toast.error(data.error || 'Gagal menyimpan pengaturan');
      }
    } catch (err) {
      console.error('Failed to save config', err);
      toast.error('Terjadi kesalahan saat menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-10 h-10 text-green-900 animate-spin" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-green-900 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Pengaturan Ujian Akhir</h2>
          <p className="text-green-100/80 text-sm mt-1">
            Konfigurasi aturan ujian secara global untuk semua peserta.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">Maksimal Percobaan</Label>
              <Input 
                type="number" 
                min={1}
                value={config.max_attempts}
                onChange={e => setConfig({ ...config, max_attempts: parseInt(e.target.value) || 1 })}
                className="rounded-xl border-gray-200 focus:border-green-600 focus:ring-green-600"
              />
              <p className="text-xs text-gray-500">Jumlah maksimal peserta boleh mengulang ujian sebelum dinyatakan gagal total dan diturunkan juznya.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">Nilai Kelulusan (Passing Score)</Label>
              <Input 
                type="number" 
                min={0}
                max={100}
                value={config.passing_score}
                onChange={e => setConfig({ ...config, passing_score: parseInt(e.target.value) || 0 })}
                className="rounded-xl border-gray-200 focus:border-green-600 focus:ring-green-600"
              />
              <p className="text-xs text-gray-500">Batas nilai minimum agar peserta dianggap lulus ujian tertulis (misal: 80).</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">Durasi Ujian (Menit)</Label>
              <Input 
                type="number" 
                min={1}
                value={config.duration_minutes}
                onChange={e => setConfig({ ...config, duration_minutes: parseInt(e.target.value) || 1 })}
                className="rounded-xl border-gray-200 focus:border-green-600 focus:ring-green-600"
              />
              <p className="text-xs text-gray-500">Durasi maksimal mengerjakan ujian dalam hitungan menit.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">Jumlah Soal per Percobaan</Label>
              <Input 
                type="number" 
                min={1}
                value={config.questions_per_attempt}
                onChange={e => setConfig({ ...config, questions_per_attempt: parseInt(e.target.value) || 1 })}
                className="rounded-xl border-gray-200 focus:border-green-600 focus:ring-green-600"
              />
              <p className="text-xs text-gray-500">Jumlah soal yang akan ditampilkan pada setiap percobaan.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-gray-700">Acak Soal (Shuffle)</Label>
              <p className="text-xs text-gray-500">Mengacak urutan soal untuk setiap peserta (fitur ini mungkin belum terdukung penuh oleh UI ujian).</p>
            </div>
            <Checkbox 
              checked={config.shuffle_questions}
              onCheckedChange={v => setConfig({ ...config, shuffle_questions: !!v })}
            />
          </div>

          <div className="pt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl px-8 bg-green-900 hover:bg-green-800 text-white font-bold h-12"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Simpan Pengaturan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
