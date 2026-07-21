'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, Send, ShieldAlert, CheckSquare, Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question_text: string;
  options: { text: string; isCorrect: boolean }[];
  points: number;
}

export default function KuisAkadPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Results view state
  const [hasPassed, setHasPassed] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [evaluatedAnswers, setEvaluatedAnswers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch questions
      const qRes = await fetch('/api/akad-quiz/questions?active=true');
      const qData = await qRes.json();
      if (!qRes.ok) throw new Error(qData.error || 'Gagal memuat soal');
      setQuestions(qData.data || []);

      // Check if user already passed
      const aRes = await fetch('/api/akad-quiz/attempts');
      const aData = await aRes.json();
      if (aRes.ok && aData.data && aData.data.length > 0) {
        // Just take the latest attempt
        const latest = aData.data[0];
        if (latest.passed) {
          setHasPassed(true);
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (qId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      toast.error(`Harap jawab semua soal! (${answeredCount}/${questions.length} terjawab)`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/akad-quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim jawaban');

      const attempt = data.data;
      setScore(attempt.score);
      setEvaluatedAnswers(attempt.answers || []);
      
      if (attempt.passed) {
        setHasPassed(true);
        toast.success('Selamat! Anda lulus Kuis Pemahaman Akad!');
      } else {
        setShowResults(true);
        toast.error('Nilai Anda belum mencapai 100. Silakan cek bagian yang salah dan ulangi.');
      }
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-green-600 animate-spin" />
          <p className="text-gray-500 font-medium">Memuat Kuis...</p>
        </div>
      </div>
    );
  }

  // ALREADY PASSED VIEW
  if (hasPassed && !showResults) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">Alhamdulillah!</h1>
            <p className="text-gray-600 text-lg mb-8">
              Ukhti telah lulus Kuis Pemahaman Akad dengan nilai sempurna. Ukhti sudah memahami dengan baik seluruh mekanisme dan ketentuan program.
            </p>
            <Link
              href="/perjalanan-saya"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Kembali ke Perjalanan Saya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 mb-8 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 md:py-6 flex items-center gap-4">
          <Link
            href="/perjalanan-saya"
            className="p-2 md:p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all border border-transparent hover:border-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-[0.2em] mb-1">
              <ShieldAlert className="h-3 w-3" />
              Tahap Daftar Ulang
            </div>
            <h1 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">
              Kuis Pemahaman Akad
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {!showResults ? (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-blue-900 mb-1">Syarat Pengisian Form Daftar Ulang</h3>
                <p className="text-blue-800 text-sm">
                  Untuk dapat mengisi Form Daftar Ulang, Ukhti diwajibkan memahami seluruh mekanisme program.
                  Jawablah pertanyaan di bawah ini dengan tepat. Nilai harus mencapai <strong>100</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-8 h-8 flex-shrink-0 bg-green-50 text-green-700 font-bold rounded-full flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">{q.question_text}</h3>
                      <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{q.points} Poin</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pl-0 md:pl-12">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = answers[q.id] === opt.text;
                      return (
                        <label
                          key={oIdx}
                          onClick={() => handleSelectOption(q.id, opt.text)}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                            isSelected
                              ? "border-green-600 bg-green-50/30"
                              : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            checked={isSelected}
                            onChange={() => handleSelectOption(q.id, opt.text)}
                            className="sr-only"
                          />
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors",
                            isSelected ? "border-green-600" : "border-gray-300"
                          )}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                          </div>
                          <span className={cn(
                            "text-sm md:text-base leading-snug",
                            isSelected ? "font-bold text-green-900" : "font-medium text-gray-700"
                          )}>
                            {opt.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm font-medium text-gray-500 text-center md:text-left">
                <span className="font-bold text-gray-900">{Object.keys(answers).length}</span> dari {questions.length} terjawab
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
              >
                {submitting ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                Submit Jawaban
              </button>
            </div>
          </>
        ) : (
          /* RESULTS VIEW (Failed) */
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-black text-red-900 mb-2">Nilai Belum Memenuhi!</h2>
              <div className="inline-block bg-white px-4 py-2 rounded-xl font-black text-3xl text-red-600 shadow-sm border border-red-100 mb-4">
                {score} <span className="text-sm text-gray-400">/ 100</span>
              </div>
              <p className="text-red-800 font-medium">
                Ukhti harus mendapatkan nilai sempurna (100) untuk melanjutkan. Silakan pelajari jawaban yang salah dan coba lagi.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900 px-2 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-gray-400" />
                Review Jawaban
              </h3>
              
              {evaluatedAnswers.map((ans, i) => (
                <div key={ans.questionId} className={cn(
                  "rounded-2xl p-5 md:p-6 border",
                  ans.isCorrect ? "bg-white border-gray-100" : "bg-red-50/50 border-red-200"
                )}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn(
                      "w-8 h-8 flex-shrink-0 font-bold rounded-full flex items-center justify-center",
                      ans.isCorrect ? "bg-green-50 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900 leading-snug">{ans.questionText}</h4>
                      {!ans.isCorrect && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider">
                          <XCircle className="h-3.5 w-3.5" />
                          Jawaban Salah
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pl-0 md:pl-12 space-y-3">
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Jawaban Anda</div>
                      <div className={cn(
                        "font-medium",
                        ans.isCorrect ? "text-green-700" : "text-red-600 line-through opacity-80"
                      )}>
                        {ans.userAnswer || '- Tidak dijawab -'}
                      </div>
                    </div>
                    
                    {!ans.isCorrect && (
                      <div className="bg-green-50 border border-green-200 p-3.5 rounded-xl flex gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Kunci Jawaban</div>
                          <div className="font-bold text-green-900">{ans.correctAnswer}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleRetry}
                className="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                <RefreshCw className="h-5 w-5" />
                Ulangi Kuis Sekarang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
