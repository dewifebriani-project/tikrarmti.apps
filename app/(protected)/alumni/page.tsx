'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { 
  HeartHandshake, 
  Star, 
  MessageSquare, 
  DollarSign, 
  Upload, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronRight,
  BookOpen,
  Copy,
  Check,
  Send
} from 'lucide-react';
import Link from 'next/link';

// Import from components/ui/button
import { Button as UIButton } from "@/components/ui/button";

interface Testimonial {
  id: string;
  content: string;
  rating: number;
  is_approved: boolean;
  created_at: string;
}

interface Donation {
  id: string;
  amount: number;
  donor_name: string;
  whatsapp: string;
  proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
}

export default function AlumniPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'testimonial' | 'donation'>('testimonial');
  const [loading, setLoading] = useState(true);
  const [isAlumni, setIsAlumni] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Testimonial States
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [testimonialContent, setTestimonialContent] = useState('');
  const [testimonialRating, setTestimonialRating] = useState(5);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [savingTestimonial, setSavingTestimonial] = useState(false);
  const [isEditingTestimonial, setIsEditingTestimonial] = useState(false);

  // Donation States
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submittingDonation, setSubmittingDonation] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  useEffect(() => {
    if (user) {
      setDonorName(user.full_name || '');
      setWhatsapp(user.whatsapp || '');
      fetchAlumniData();
    }
  }, [user]);

  const fetchAlumniData = async () => {
    try {
      setLoading(true);
      // Fetch Testimonial
      const tRes = await fetch('/api/alumni/testimonial/my');
      if (tRes.ok) {
        const tData = await tRes.json();
        setIsAlumni(tData.isAlumni);
        setIsAdmin(tData.isAdmin || false);
        if (tData.testimonial) {
          setTestimonial(tData.testimonial);
          setTestimonialContent(tData.testimonial.content);
          setTestimonialRating(tData.testimonial.rating);
        }
      }

      // Fetch Donations
      const dRes = await fetch('/api/alumni/donations/my');
      if (dRes.ok) {
        const dData = await dRes.json();
        if (dData.success) {
          setDonations(dData.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching alumni data:', err);
      toast.error('Gagal memuat data alumni');
    } finally {
      setLoading(false);
    }
  };

  const copyBankNumber = () => {
    navigator.clipboard.writeText('7247754406');
    setCopiedBank(true);
    toast.success('Nomor rekening disalin');
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // Testimonial handlers
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialContent.trim()) {
      toast.error('Konten testimoni tidak boleh kosong');
      return;
    }

    try {
      setSavingTestimonial(true);
      const res = await fetch('/api/alumni/testimonial/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: testimonialContent,
          rating: testimonialRating
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(testimonial ? 'Testimoni berhasil diperbarui!' : 'Testimoni berhasil dikirim!');
        setTestimonial(data.data);
        setIsEditingTestimonial(false);
        fetchAlumniData();
      } else {
        toast.error(data.error || 'Gagal menyimpan testimoni');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat menyimpan testimoni');
    } finally {
      setSavingTestimonial(false);
    }
  };

  // Donation file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format file harus berupa JPG, PNG, atau PDF');
      return;
    }

    try {
      setUploadingProof(true);
      setProofFile(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      const filePath = `donations/${fileName}`;

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setProofUrl(publicUrl);
      toast.success('Bukti transfer berhasil diunggah');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(`Gagal mengunggah file: ${err.message || err}`);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationAmount || Number(donationAmount) <= 0) {
      toast.error('Masukkan jumlah donasi yang valid');
      return;
    }
    if (!donorName.trim()) {
      toast.error('Nama donatur wajib diisi');
      return;
    }
    if (!proofUrl) {
      toast.error('Silakan unggah bukti transfer terlebih dahulu');
      return;
    }

    try {
      setSubmittingDonation(true);
      const res = await fetch('/api/alumni/donations/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(donationAmount),
          donor_name: donorName,
          whatsapp,
          proof_url: proofUrl,
          notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Konfirmasi donasi berhasil dikirim!');
        // Reset form
        setDonationAmount('');
        setNotes('');
        setProofFile(null);
        setProofUrl('');
        // Refresh history
        fetchAlumniData();
      } else {
        toast.error(data.error || 'Gagal mengirim konfirmasi donasi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat mengirim konfirmasi');
    } finally {
      setSubmittingDonation(false);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800 mx-auto mb-4"></div>
          <p className="text-emerald-800 font-medium">Memuat Halaman Alumni...</p>
        </div>
      </div>
    );
  }

  // Not an alumni UI (unless admin)
  if (!isAlumni && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-xl overflow-hidden rounded-2xl bg-white">
            <div className="h-3 bg-emerald-700" />
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                <BookOpen className="w-10 h-10 text-emerald-700 animate-pulse" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Halaman Khusus Alumni MTI</h1>
              
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 mb-8 text-left">
                <h3 className="text-emerald-900 font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                  Informasi Akses
                </h3>
                <p className="text-emerald-800 text-sm leading-relaxed mb-3">
                  Afwan Ukhti, halaman ini dikhususkan bagi alumni Markaz Tikrar Indonesia (peserta yang telah berhasil menyelesaikan pembelajaran di batch sebelumnya).
                </p>
                <p className="text-emerald-700 text-xs leading-relaxed">
                  Jika antum adalah peserta baru atau belum menyelesaikan program, silakan mengakses menu pendaftaran atau menu jurnal harian melalui dashboard.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <UIButton asChild className="bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl px-6 py-6 font-medium shadow-lg hover:shadow-emerald-100 transition-all">
                  <Link href="/dashboard">Kembali ke Dashboard</Link>
                </UIButton>
                <UIButton asChild variant="outline" className="border-emerald-800 text-emerald-800 hover:bg-emerald-50 rounded-xl px-6 py-6 font-medium transition-all">
                  <Link href="/pendaftaran">Cek Menu Pendaftaran</Link>
                </UIButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-850 to-emerald-700 bg-emerald-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl mb-10 overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-44 h-44 rounded-full bg-emerald-800/30 blur-2xl" />
          <div className="absolute left-1/3 bottom-0 translate-y-10 w-60 h-60 rounded-full bg-emerald-600/10 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="bg-emerald-800/60 border border-emerald-600 text-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide uppercase">
                Alumni MTI
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold mt-3 tracking-tight">Barakallahu Fiikum, Ukhti!</h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
                Selamat atas kelulusan antum di program MTI. Halaman ini adalah wadah silaturahmi, pengisian testimoni, dan dukungan operasional dakwah MTI.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-emerald-200">Status Testimoni</p>
                <div className="flex items-center gap-2 mt-1">
                  {testimonial ? (
                    testimonial.is_approved ? (
                      <span className="bg-emerald-500/20 text-emerald-200 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" /> Disetujui
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-200 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/30">
                        <Clock className="w-3 h-3 animate-spin" /> Menunggu Review
                      </span>
                    )
                  ) : (
                    <span className="bg-red-500/20 text-red-200 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-red-500/30">
                      <AlertCircle className="w-3 h-3" /> Wajib Diisi
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-emerald-900/5 p-1.5 rounded-2xl mb-8 max-w-md">
          <button
            onClick={() => setActiveTab('testimonial')}
            className={`flex-1 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'testimonial'
                ? 'bg-white text-emerald-950 shadow-md'
                : 'text-emerald-850/80 hover:text-emerald-950 hover:bg-emerald-50/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Isi Testimoni
          </button>
          <button
            onClick={() => setActiveTab('donation')}
            className={`flex-1 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'donation'
                ? 'bg-white text-emerald-950 shadow-md'
                : 'text-emerald-850/80 hover:text-emerald-950 hover:bg-emerald-50/50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Donasi Operasional
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'testimonial' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-gray-50 pb-6 p-6 sm:p-8">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {testimonial && !isEditingTestimonial ? 'Testimoni Anda' : 'Tulis Testimoni'}
                  </CardTitle>
                  <CardDescription>
                    Berikan umpan balik jujur mengenai pengalaman belajar Anda di MTI untuk memotivasi calon hafidzah lainnya.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  {testimonial && !isEditingTestimonial ? (
                    /* Show testimonial summary */
                    <div className="space-y-6">
                      <div className="bg-[#F8FAF9] border border-gray-100 rounded-2xl p-6 relative">
                        <div className="flex items-center gap-1.5 mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-6 h-6 ${
                                star <= testimonial.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-gray-700 italic leading-relaxed text-base">
                          "{testimonial.content}"
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-550">
                          <span>Dikirim pada: {new Date(testimonial.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          <span className="font-semibold text-emerald-700">
                            {testimonial.is_approved ? 'Ditampilkan di Landing Page' : 'Sedang direview admin'}
                          </span>
                        </div>
                      </div>

                      {testimonial.is_approved && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-emerald-900 text-sm">
                          <CheckCircle className="w-5 h-5 text-emerald-750 flex-shrink-0 mt-0.5" />
                          <p>
                            Jazakumullahu khairan! Testimoni antum telah disetujui dan saat ini tampil di halaman utama Markaz Tikrar Indonesia.
                          </p>
                        </div>
                      )}

                      {!testimonial.is_approved && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-900 text-sm">
                          <Clock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                          <p>
                            Testimoni antum sedang menunggu verifikasi admin sebelum ditampilkan di halaman utama. Namun antum tetap dapat melakukan pendaftaran batch baru.
                          </p>
                        </div>
                      )}

                      <UIButton
                        onClick={() => setIsEditingTestimonial(true)}
                        variant="outline"
                        className="border-emerald-800 text-emerald-800 hover:bg-emerald-50/50 rounded-xl px-6 transition-all"
                      >
                        Ubah Testimoni
                      </UIButton>
                    </div>
                  ) : (
                    /* Edit/New Form */
                    <form onSubmit={handleSaveTestimonial} className="space-y-6">
                      {testimonial && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-900 text-sm">
                          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                          <p>
                            <strong>Perhatian:</strong> Mengubah testimoni akan mereset status persetujuan testimoni antum ke <strong>pending (belum disetujui)</strong> untuk dicek ulang oleh admin.
                          </p>
                        </div>
                      )}

                      {/* Star Rating Selector */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Rating Penilaian</Label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setTestimonialRating(star)}
                              onMouseEnter={() => setRatingHover(star)}
                              onMouseLeave={() => setRatingHover(null)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= (ratingHover ?? testimonialRating)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-200'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-sm text-gray-550 ml-2 font-medium">
                            {testimonialRating === 5 ? 'Sangat Puas' : 
                             testimonialRating === 4 ? 'Puas' : 
                             testimonialRating === 3 ? 'Cukup Baik' : 
                             testimonialRating === 2 ? 'Perlu Peningkatan' : 'Kurang'}
                          </span>
                        </div>
                      </div>

                      {/* Content Input */}
                      <div className="space-y-2">
                        <Label htmlFor="testimonial" className="text-sm font-semibold text-gray-700">Isi Ulasan Testimoni</Label>
                        <Textarea
                          id="testimonial"
                          placeholder="Ceritakan pengalaman berkesan antum selama menghafal di Markaz Tikrar Indonesia..."
                          rows={6}
                          value={testimonialContent}
                          onChange={(e) => setTestimonialContent(e.target.value)}
                          className="rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none text-base"
                        />
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Tuliskan ulasan minimal 10 kata yang menceritakan manfaat nyata yang antum rasakan di MTI.
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <UIButton
                          type="submit"
                          disabled={savingTestimonial}
                          className="bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl px-6 py-6 shadow-lg shadow-emerald-100 flex items-center gap-2"
                        >
                          {savingTestimonial ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Kirim Testimoni
                            </>
                          )}
                        </UIButton>

                        {testimonial && (
                          <UIButton
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setIsEditingTestimonial(false);
                              setTestimonialContent(testimonial.content);
                              setTestimonialRating(testimonial.rating);
                            }}
                            className="text-gray-500 hover:bg-gray-150 rounded-xl"
                          >
                            Batal
                          </UIButton>
                        )}
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Benefit/FAQ Column */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-emerald-900 text-white rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    Mengapa Testimoni Penting?
                  </h3>
                  <ul className="space-y-3.5 text-emerald-100/90 text-sm leading-relaxed">
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2 flex-shrink-0" />
                      Membantu menyebarkan dakwah Al-Qur'an dengan membagikan kisah inspiratif antum.
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2 flex-shrink-0" />
                      Membantu tim manajemen MTI mengevaluasi sistem kurikulum dan pengajaran untuk batch selanjutnya.
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2 flex-shrink-0" />
                      Menjadi prasyarat pendaftaran batch berikutnya sebagai bukti komitmen kelulusan alumni.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md rounded-2xl bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wide">FAQ Testimoni</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-gray-650 leading-relaxed">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Apakah bisa mengubah testimoni?</h4>
                    <p>Bisa Ukhti. Antum dapat menekan tombol "Ubah Testimoni" kapan saja. Pengubahan ulasan akan di-review kembali oleh admin.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Apakah semua testimoni dipublikasi?</h4>
                    <p>Tidak semua. Admin menyaring testimoni demi menjaga kerapian dan keamanan konten dari hal-hal yang kurang pantas.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'donation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Donation Form Card */}
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-gray-50 pb-6 p-6 sm:p-8">
                  <CardTitle className="text-xl font-bold text-gray-900">Konfirmasi Donasi Operasional</CardTitle>
                  <CardDescription>
                    Kirimkan konfirmasi transfer donasi antum untuk keperluan operasional dakwah Markaz Tikrar Indonesia.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleDonationSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Donor Name */}
                      <div className="space-y-2">
                        <Label htmlFor="donorName" className="text-sm font-semibold text-gray-700">Nama Donatur</Label>
                        <Input
                          id="donorName"
                          type="text"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          placeholder="Masukkan nama donatur"
                          className="rounded-xl border-gray-200 focus:border-emerald-500"
                        />
                      </div>
                      
                      {/* Whatsapp */}
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700">Nomor Whatsapp</Label>
                        <Input
                          id="whatsapp"
                          type="text"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="Contoh: 08123456789"
                          className="rounded-xl border-gray-200 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Amount */}
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">Jumlah Transfer (Rp)</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          placeholder="Contoh: 100000"
                          className="rounded-xl border-gray-200 focus:border-emerald-500"
                        />
                      </div>

                      {/* File Proof */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Bukti Transfer</Label>
                        <div className="relative border border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-xl p-3 text-center transition-all cursor-pointer">
                          <input
                            type="file"
                            id="proofFile"
                            onChange={handleFileUpload}
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadingProof}
                          />
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-550">
                            {uploadingProof ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-800"></div>
                                Mengunggah...
                              </>
                            ) : proofUrl ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-emerald-700" />
                                Bukti Terunggah!
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 text-gray-400" />
                                Pilih File (Maks 5MB)
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">Pesan / Catatan Tambahan (Opsional)</Label>
                      <Textarea
                        id="notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Tuliskan catatan khusus atau pesan untuk MTI..."
                        className="rounded-xl border-gray-200 focus:border-emerald-500 resize-none"
                      />
                    </div>

                    <UIButton
                      type="submit"
                      disabled={submittingDonation || uploadingProof}
                      className="w-full bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                    >
                      {submittingDonation ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Mengirim Konfirmasi...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Kirim Konfirmasi Transfer
                        </>
                      )}
                    </UIButton>
                  </form>
                </CardContent>
              </Card>

              {/* Donation History Card */}
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-gray-50 pb-6 p-6 sm:p-8">
                  <CardTitle className="text-xl font-bold text-gray-900">Riwayat Donasi</CardTitle>
                  <CardDescription>Catatan kontribusi operasional yang sudah antum ajukan.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {donations.length === 0 ? (
                    <div className="text-center py-12 text-gray-450 text-sm">
                      Belum ada riwayat donasi yang diajukan.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                      {donations.map((don) => (
                        <div key={don.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <p className="font-bold text-gray-900 text-base">{formatIDR(don.amount)}</p>
                            <p className="text-xs text-gray-450 mt-1 flex items-center gap-1.5">
                              <span>Atas nama: {don.donor_name}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span>{new Date(don.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </p>
                            {don.notes && (
                              <p className="text-xs text-gray-550 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 max-w-lg">
                                "{don.notes}"
                              </p>
                            )}
                            {don.status === 'rejected' && don.notes && (
                              <p className="text-xs text-red-650 mt-1.5 font-medium">
                                Catatan admin: {don.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <UIButton asChild variant="outline" size="sm" className="border-gray-250 text-gray-650 hover:bg-gray-100 rounded-lg text-xs h-8">
                              <a href={don.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Bukti
                              </a>
                            </UIButton>
                            <div>
                              {don.status === 'approved' && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Berhasil
                                </span>
                              )}
                              {don.status === 'rejected' && (
                                <span className="bg-red-50 text-red-700 border border-red-100 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" /> Ditolak
                                </span>
                              )}
                              {don.status === 'pending' && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> Proses Verifikasi
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bank Info / FAQ Column */}
            <div className="space-y-6">
              {/* Bank Transfer Info Card */}
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-b from-emerald-50 to-white pb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-emerald-800" />
                    Informasi Rekening Transfer
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-6">
                  <div className="bg-emerald-900/5 border border-emerald-900/10 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-5 -translate-x-2 translate-y-2">
                      <HeartHandshake className="w-24 h-24 text-emerald-950" />
                    </div>
                    
                    <p className="text-xs text-emerald-800 font-semibold tracking-wider uppercase">Nama Bank</p>
                    <p className="font-extrabold text-emerald-950 text-lg mt-0.5">Bank Syariah Indonesia (BSI)</p>
                    
                    <p className="text-xs text-emerald-800 font-semibold tracking-wider uppercase mt-4">Nomor Rekening</p>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="font-extrabold text-emerald-950 text-xl tracking-wide">7247754406</p>
                      <button
                        onClick={copyBankNumber}
                        className="p-2 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl transition-all border border-emerald-900/10 shadow-sm"
                      >
                        {copiedBank ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <p className="text-xs text-emerald-800 font-semibold tracking-wider uppercase mt-4">Nama Pemilik Rekening</p>
                    <p className="font-bold text-emerald-950 mt-0.5">Yayasan Markaz Tikrar Indonesia</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-900 text-xs leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <p>
                      Mohon pastikan jumlah transfer sesuai dengan nominal donasi antum. Pengiriman bukti transfer sangat penting untuk pencatatan laporan keuangan Yayasan.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Donation FAQ Card */}
              <Card className="border-0 shadow-md rounded-2xl bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wide">FAQ Donasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-gray-650 leading-relaxed">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Ke mana donasi operasional disalurkan?</h4>
                    <p>Donasi antum disalurkan sepenuhnya untuk biaya penyediaan Zoom premium kelas harian, pemeliharaan server website, operasional ujian/tashih, serta pengembangan sarana prasarana dakwah Yayasan Markaz Tikrar Indonesia.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Berapa minimal donasi?</h4>
                    <p>Tidak ada batas minimal. Berapapun dukungan ikhlas yang antum berikan, insyaAllah sangat bernilai di sisi Allah Subhanahu wa Ta'ala sebagai sedekah jariyah.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}