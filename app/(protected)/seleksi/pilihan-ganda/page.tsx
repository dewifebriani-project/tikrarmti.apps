'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Clock, FileText, Lock } from 'lucide-react';

// Page is locked for non-admin users (testing mode)
const ADMIN_ONLY_PAGE = true;
const LOCK_MESSAGE = 'Halaman ujian pilihan ganda sedang dalam tahap uji coba. Hanya admin yang dapat mengakses halaman ini.';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const quizData: QuizQuestion[] = [
  {
    id: 1,
    question: "Apa arti dari kata 'Al-Qur'an' secara etimologi?",
    options: [
      "Bacaan atau dibaca berulang-ulang",
      "Kitab suci",
      "Petunjuk",
      "Cahaya"
    ],
    correctAnswer: 0
  },
  {
    id: 2,
    question: "Berapa jumlah surah dalam Al-Qur'an?",
    options: [
      "111",
      "114",
      "116",
      "120"
    ],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "Surah apa yang disebut sebagai 'Ummul Qur'an' (Induk Al-Qur'an)?",
    options: [
      "Surah Al-Ikhlas",
      "Surah Al-Fatihah",
      "Surah Al-Baqarah",
      "Surah Yasin"
    ],
    correctAnswer: 1
  },
  {
    id: 4,
    question: "Hafalan atau menjaga Al-Qur'an dalam Islam disebut dengan istilah:",
    options: [
      "Tilawah",
      "Tahfidz",
      "Tadabbur",
      "Tajwid"
    ],
    correctAnswer: 1
  },
  {
    id: 5,
    question: "Ayat terakhir yang diturunkan adalah ayat:",
    options: [
      "Ayat Riba",
      "Ayat Nabi",
      "Ayat Wudhu",
      "Ayat Puasa"
    ],
    correctAnswer: 1
  },
  {
    id: 6,
    question: "Siapa nama malaikat yang menyampaikan wahyu kepada Nabi Muhammad SAW?",
    options: [
      "Malaikat Mikail",
      "Malaikat Israfil",
      "Malaikat Jibril",
      "Malaikat Izrail"
    ],
    correctAnswer: 2
  },
  {
    id: 7,
    question: "Tempat turunnya Al-Qur'an pertama kali adalah:",
    options: [
      "Masjid Nabawi",
      "Masjidil Haram",
      "Gua Hira",
      "Masjidil Aqsa"
    ],
    correctAnswer: 2
  },
  {
    id: 8,
    question: "Berapa jumlah juz dalam Al-Qur'an?",
    options: [
      "25",
      "30",
      "35",
      "40"
    ],
    correctAnswer: 1
  },
  {
    id: 9,
    question: "Surah terpanjang dalam Al-Qur'an adalah:",
    options: [
      "Al-Baqarah",
      "Ali Imran",
      "An-Nisa",
      "Al-Maidah"
    ],
    correctAnswer: 0
  },
  {
    id: 10,
    question: "Surah terpendek dalam Al-Qur'an adalah:",
    options: [
      "An-Naas",
      "Al-Ikhlas",
      "Al-Kautsar",
      "Al-Falaq"
    ],
    correctAnswer: 2
  }
];

export default function PilihanGandaPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [quizStarted, setQuizStarted] = useState(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isClient) return;

    if (quizStarted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quizStarted) {
      handleSubmit();
    }
  }, [timeLeft, quizStarted, isClient]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quizData.length) {
      alert('Silakan jawab semua pertanyaan terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Get session token
      const { data: { session }, error: sessionError } = await (await import('@/lib/supabase')).supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        throw new Error('Tidak ada session. Silakan login kembali.');
      }

      // Calculate score
      let correctAnswers = 0;
      quizData.forEach(question => {
        if (answers[question.id] === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / quizData.length) * 100);

      const response = await fetch('/api/seleksi/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: 'written',
          answers: answers,
          score: score,
          totalQuestions: quizData.length,
          correctAnswers: correctAnswers
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Submit error:', errorData);
        throw new Error(errorData.error || 'Gagal mengirim jawaban');
      }

      const result = await response.json();
      console.log('Submission result:', result);

      setSubmitStatus('success');
      setTimeout(() => {
        router.push('/perjalanan-saya');
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      setSubmitStatus('error');
      alert(error.message || 'Gagal mengirim jawaban');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const progressPercentage = ((Object.keys(answers).length) / quizData.length) * 100;

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  // Show lock screen if page is admin-only and user is not admin
  if (ADMIN_ONLY_PAGE && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full bg-white shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Ujian Dikunci</h1>
              <p className="text-gray-600">{LOCK_MESSAGE}</p>
            </div>
            <Button
              onClick={() => router.push('/perjalanan-saya')}
              className="w-full"
            >
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        {!quizStarted ? (
          /* Start Quiz Screen */
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <span>Petunjuk Ujian</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Informasi Ujian:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Jumlah soal: {quizData.length} pertanyaan</li>
                    <li>Waktu: 30 menit</li>
                    <li>Setiap soal memiliki 4 pilihan jawaban</li>
                    <li>Pastikan menjawab semua soal sebelum submit</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Petunjuk Pengerjaan:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Baca setiap pertanyaan dengan teliti</li>
                  <li>Pilih salah satu jawaban yang paling tepat</li>
                  <li>Gunakan tombol "Sebelumnya" dan "Selanjutnya" untuk navigasi</li>
                  <li>Pastikan semua soal terjawab sebelum submit</li>
                  <li>Klik "Submit Jawaban" jika sudah selesai</li>
                </ol>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={startQuiz}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                  size="lg"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Mulai Ujian
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Quiz Screen */
          <>
            {/* Timer and Progress Bar */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">
                      Sisa Waktu: {formatTime(timeLeft)}
                    </span>
                  </div>
                  <div className="text-sm text-blue-700">
                    Soal {currentQuestion + 1} dari {quizData.length}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {Object.keys(answers).length} dari {quizData.length} soal terjawab ({Math.round(progressPercentage)}%)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Question Card */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">
                  Pertanyaan {currentQuestion + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 font-medium">
                    {quizData[currentQuestion].question}
                  </p>
                </div>

                <RadioGroup
                  value={answers[quizData[currentQuestion].id]?.toString() || ''}
                  onValueChange={(value) => handleAnswerChange(quizData[currentQuestion].id, value)}
                >
                  <div className="space-y-3">
                    {quizData[currentQuestion].options.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          answers[quizData[currentQuestion].id] === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    variant="outline"
                  >
                    Sebelumnya
                  </Button>

                  {currentQuestion < quizData.length - 1 ? (
                    <Button
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Selanjutnya
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || submitStatus === 'success'}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Mengirim...
                        </>
                      ) : submitStatus === 'success' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Berhasil
                        </>
                      ) : (
                        'Submit Jawaban'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Question Navigator */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base">Navigasi Soal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {quizData.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentQuestion === index
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                          : answers[question.id] !== undefined
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Berhasil!</strong> Jawaban <em>Ukhti</em> telah dikirim. <em>Ukhti</em> akan dialihkan ke halaman perjalanan...
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === 'error' && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Terjadi kesalahan</strong> Gagal mengirim jawaban. Silakan coba lagi.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
  );
}
