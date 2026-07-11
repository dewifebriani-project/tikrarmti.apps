'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Save, X, Edit, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question_text: string;
  options: { text: string; isCorrect: boolean }[];
  points: number;
  sort_order: number;
  is_active: boolean;
}

export function AdminAkadQuizTab() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    question_text: '',
    options: [] as { text: string; isCorrect: boolean }[],
    points: 10,
    sort_order: 0,
    is_active: true,
  });

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/akad-quiz/questions');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch questions');
      setQuestions(data.data || []);
    } catch (error) {
      toast.error('Gagal mengambil data soal');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleEdit = (q: Question) => {
    setEditingQuestion(q);
    setIsAdding(false);
    setFormData({
      id: q.id,
      question_text: q.question_text,
      options: q.options || [],
      points: q.points,
      sort_order: q.sort_order,
      is_active: q.is_active,
    });
  };

  const handleAdd = () => {
    setEditingQuestion(null);
    setIsAdding(true);
    setFormData({
      id: '',
      question_text: '',
      options: [
        { text: 'Pilihan 1', isCorrect: true },
        { text: 'Pilihan 2', isCorrect: false },
      ],
      points: 10,
      sort_order: questions.length + 1,
      is_active: true,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus soal ini?')) return;
    try {
      const res = await fetch(`/api/akad-quiz/questions?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus soal');
      toast.success('Soal berhasil dihapus');
      fetchQuestions();
    } catch (error) {
      toast.error('Gagal menghapus soal');
    }
  };

  const saveQuestion = async () => {
    if (!formData.question_text) {
      toast.error('Pertanyaan wajib diisi');
      return;
    }
    
    const hasCorrect = formData.options.some(opt => opt.isCorrect);
    if (!hasCorrect) {
      toast.error('Minimal harus ada 1 jawaban yang benar');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/akad-quiz/questions';
      const method = isAdding ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal menyimpan soal');
      }

      toast.success('Soal berhasil disimpan');
      setIsAdding(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan soal');
    } finally {
      setSaving(false);
    }
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...formData.options];
    newOptions[index].text = text;
    setFormData({ ...formData, options: newOptions });
  };

  const setCorrectOption = (index: number) => {
    const newOptions = formData.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { text: `Pilihan ${formData.options.length + 1}`, isCorrect: false }],
    });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    if (newOptions.length > 0 && !newOptions.some(opt => opt.isCorrect)) {
      newOptions[0].isCorrect = true;
    }
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Kuis Pemahaman Akad</h2>
          <p className="text-sm text-gray-500">Kelola soal untuk Kuis Pemahaman Akad pada tahap Daftar Ulang</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchQuestions}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Soal
          </button>
        </div>
      </div>

      {(editingQuestion || isAdding) && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6 relative">
          <button
            onClick={() => { setEditingQuestion(null); setIsAdding(false); }}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
          
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {isAdding ? 'Tambah Soal Baru' : 'Edit Soal'}
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pertanyaan</label>
                <textarea
                  value={formData.question_text}
                  onChange={e => setFormData({ ...formData, question_text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  rows={3}
                  placeholder="Masukkan pertanyaan..."
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Poin</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Urutan</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-600"
                  />
                  <label htmlFor="is_active" className="text-sm font-bold text-gray-700">Aktif (Ditampilkan)</label>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-bold text-gray-700">Pilihan Jawaban</label>
                <button
                  onClick={addOption}
                  className="text-xs font-bold text-green-700 hover:text-green-800 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-lg"
                >
                  <Plus className="h-3 w-3" /> Tambah Pilihan
                </button>
              </div>

              <div className="space-y-3">
                {formData.options.map((opt, index) => (
                  <div key={index} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    opt.isCorrect ? "border-green-300 bg-green-50/50" : "border-gray-200 bg-white"
                  )}>
                    <input
                      type="radio"
                      name="correct_option"
                      checked={opt.isCorrect}
                      onChange={() => setCorrectOption(index)}
                      className="w-4 h-4 text-green-600 focus:ring-green-600"
                      title="Tandai sebagai jawaban benar"
                    />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Pilihan ${index + 1}`}
                      className="flex-1 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-green-600 focus:ring-0 px-0 py-1 text-sm font-medium"
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={formData.options.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => { setEditingQuestion(null); setIsAdding(false); }}
                className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                onClick={saveQuestion}
                disabled={saving}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Menyimpan...' : 'Simpan Soal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!editingQuestion && !isAdding && (
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Memuat soal...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">Belum ada soal kuis.</p>
              <button
                onClick={handleAdd}
                className="mt-4 px-4 py-2 bg-green-50 text-green-700 font-bold rounded-xl transition-all hover:bg-green-100 inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Buat Soal Pertama
              </button>
            </div>
          ) : (
            questions.map((q, idx) => (
              <div key={q.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{q.question_text}</h3>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(q)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {q.options?.map((opt, i) => (
                      <div key={i} className={cn(
                        "px-3 py-2 rounded-lg border text-sm flex items-center justify-between",
                        opt.isCorrect ? "border-green-200 bg-green-50 text-green-800 font-medium" : "border-gray-100 bg-gray-50 text-gray-600"
                      )}>
                        <span>{opt.text}</span>
                        {opt.isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg uppercase tracking-wider">
                      {q.points} Poin
                    </span>
                    <span className={cn(
                      "px-2 py-1 text-xs font-bold rounded-lg uppercase tracking-wider",
                      q.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {q.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
