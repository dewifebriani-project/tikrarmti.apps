'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { HelpCircle, Info, BookOpen, Shield, GraduationCap, Users, Lightbulb, Star, Save, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, AlertCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { FAQCategory, FAQQuestion } from '@/types/database';

// Import Quill dynamically to avoid SSR errors
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const ICON_OPTIONS = [
  { value: 'HelpCircle', label: 'Help Circle', icon: HelpCircle },
  { value: 'Info', label: 'Info', icon: Info },
  { value: 'BookOpen', label: 'Book', icon: BookOpen },
  { value: 'Shield', label: 'Shield', icon: Shield },
  { value: 'GraduationCap', label: 'Graduation', icon: GraduationCap },
  { value: 'Users', label: 'Users', icon: Users },
  { value: 'Lightbulb', label: 'Lightbulb', icon: Lightbulb },
  { value: 'Star', label: 'Star', icon: Star },
];

const COLOR_OPTIONS = [
  { value: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500' },
  { value: 'blue', bg: 'bg-blue-500', text: 'text-blue-500' },
  { value: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-500' },
  { value: 'purple', bg: 'bg-purple-500', text: 'text-purple-500' },
  { value: 'pink', bg: 'bg-pink-500', text: 'text-pink-500' },
  { value: 'orange', bg: 'bg-orange-500', text: 'text-orange-500' },
  { value: 'amber', bg: 'bg-amber-500', text: 'text-amber-500' },
  { value: 'red', bg: 'bg-red-500', text: 'text-red-500' },
];

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/faqs', { cache: 'no-store' });
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setFaqs(json.data);
        if (json.data.length > 0) {
          setExpandedCat(json.data[0].id);
        }
      }
    } catch (err) {
      toast.error('Gagal memuat data FAQ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Ensure all faqs have valid sort_order before saving
      const faqsToSave = faqs.map((f, i) => ({ ...f, sort_order: i }));
      
      const res = await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqsToSave),
      });
      
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      toast.success('Pengaturan FAQ berhasil disimpan!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan FAQ');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const newId = `temp-${Date.now()}`;
    const newCat: FAQCategory = {
      id: newId,
      category: 'Kategori Baru',
      icon: 'HelpCircle',
      color: 'blue',
      questions: [],
      sort_order: faqs.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setFaqs([...faqs, newCat]);
    setExpandedCat(newId);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini dan semua pertanyaannya?')) return;
    
    // If it's a temp ID, just remove from state
    if (id.startsWith('temp-')) {
      setFaqs(faqs.filter(f => f.id !== id));
      return;
    }

    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      setFaqs(faqs.filter(f => f.id !== id));
      toast.success('Kategori berhasil dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kategori');
    }
  };

  const updateCategory = (id: string, field: string, value: any) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const addQuestion = (catId: string) => {
    setFaqs(faqs.map(f => {
      if (f.id === catId) {
        return {
          ...f,
          questions: [...f.questions, { q: 'Pertanyaan baru', a: '' }]
        };
      }
      return f;
    }));
  };

  const updateQuestion = (catId: string, qIdx: number, field: 'q' | 'a', value: string) => {
    setFaqs(faqs.map(f => {
      if (f.id === catId) {
        const newQ = [...f.questions];
        newQ[qIdx] = { ...newQ[qIdx], [field]: value };
        return { ...f, questions: newQ };
      }
      return f;
    }));
  };

  const deleteQuestion = (catId: string, qIdx: number) => {
    setFaqs(faqs.map(f => {
      if (f.id === catId) {
        const newQ = [...f.questions];
        newQ.splice(qIdx, 1);
        return { ...f, questions: newQ };
      }
      return f;
    }));
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === faqs.length - 1)) return;
    const newFaqs = [...faqs];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    [newFaqs[index], newFaqs[swapIdx]] = [newFaqs[swapIdx], newFaqs[index]];
    setFaqs(newFaqs);
  };

  const moveQuestion = (catId: string, index: number, direction: 'up' | 'down') => {
    setFaqs(faqs.map(f => {
      if (f.id === catId) {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === f.questions.length - 1)) return f;
        const newQ = [...f.questions];
        const swapIdx = direction === 'up' ? index - 1 : index + 1;
        [newQ[index], newQ[swapIdx]] = [newQ[swapIdx], newQ[index]];
        return { ...f, questions: newQ };
      }
      return f;
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Define Quill modules with text color and background color tools
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan FAQ</h1>
          <p className="text-gray-500 mt-1">Kelola pertanyaan yang sering diajukan di halaman utama</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={addCategory}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Kategori Baru</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Menyimpan...' : 'Simpan Semua'}</span>
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-8 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <strong>Perhatian:</strong> Perubahan akan langsung terlihat di halaman utama (Landing Page) setelah Anda menekan tombol "Simpan Semua". 
          Harap pastikan semua pertanyaan dan jawaban sudah benar.
        </div>
      </div>

      <div className="space-y-4">
        {faqs.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada kategori FAQ. Silakan tambahkan kategori baru.</p>
          </div>
        )}
        
        {faqs.map((cat, catIndex) => (
          <div key={cat.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all">
            {/* Category Header */}
            <div 
              className={`p-4 flex items-center justify-between cursor-pointer ${expandedCat === cat.id ? 'bg-gray-50 border-b border-gray-200' : 'hover:bg-gray-50'}`}
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); moveCategory(catIndex, 'up'); }}
                    disabled={catIndex === 0}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); moveCategory(catIndex, 'down'); }}
                    disabled={catIndex === faqs.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                  {expandedCat === cat.id ? (
                    <input
                      type="text"
                      value={cat.category}
                      onChange={(e) => updateCategory(cat.id, 'category', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-lg font-bold bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 max-w-sm"
                      placeholder="Nama Kategori"
                    />
                  ) : (
                    <h3 className="text-lg font-bold text-gray-900">{cat.category || 'Kategori Tanpa Nama'}</h3>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg w-fit">
                    <span>{cat.questions.length} Pertanyaan</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                {expandedCat === cat.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </div>

            {/* Category Content */}
            {expandedCat === cat.id && (
              <div className="p-6">
                {/* Category Settings */}
                <div className="flex flex-wrap gap-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Ikon Kategori</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {ICON_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        const isSelected = cat.icon === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => updateCategory(cat.id, 'icon', opt.value)}
                            className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                            title={opt.label}
                          >
                            <Icon className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Warna Aksen</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_OPTIONS.map(opt => {
                        const isSelected = cat.color === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => updateCategory(cat.id, 'color', opt.value)}
                            className={`w-9 h-9 rounded-full ${opt.bg} transition-transform ${isSelected ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110 opacity-80'}`}
                            title={opt.value}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Daftar Pertanyaan</h4>
                    <button
                      onClick={() => addQuestion(cat.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Tambah
                    </button>
                  </div>
                  
                  {cat.questions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-500 text-sm">Kategori ini belum memiliki pertanyaan.</p>
                    </div>
                  ) : (
                    cat.questions.map((q, qIdx) => (
                      <div key={qIdx} className="flex gap-3">
                        <div className="flex flex-col gap-1 pt-2">
                          <button 
                            onClick={() => moveQuestion(cat.id, qIdx, 'up')}
                            disabled={qIdx === 0}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 bg-gray-50 rounded"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => moveQuestion(cat.id, qIdx, 'down')}
                            disabled={qIdx === cat.questions.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 bg-gray-50 rounded"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative group">
                          <button 
                            onClick={() => deleteQuestion(cat.id, qIdx)}
                            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Pertanyaan"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          <div className="space-y-4 pr-8">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Pertanyaan (Q)</label>
                              <input
                                type="text"
                                value={q.q}
                                onChange={(e) => updateQuestion(cat.id, qIdx, 'q', e.target.value)}
                                className="w-full text-base font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Masukkan pertanyaan..."
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Jawaban (A)</label>
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <ReactQuill 
                                  theme="snow" 
                                  value={q.a} 
                                  onChange={(content, delta, source) => {
                                    if (source === 'user' && content !== q.a) {
                                      updateQuestion(cat.id, qIdx, 'a', content);
                                    }
                                  }}
                                  modules={quillModules}
                                  className="bg-white"
                                />
                              </div>
                              <p className="text-[11px] text-gray-400 mt-1">Anda dapat menggunakan tools di atas untuk mewarnai teks, menebalkan, dll.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
