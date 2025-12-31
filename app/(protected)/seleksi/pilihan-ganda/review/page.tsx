'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Flag, Clock, ArrowLeft, Loader2, Home, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ExamQuestion {
  id: string;
  juz_number: number;
  section_title: string;
  question_number: number;
  question_text: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  correct_answer: string;
  points: number;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
}

interface ExamAttempt {
  id: string;
  answers: UserAnswer[];
  total_questions: number;
  correct_answers: number;
  score: number;
  submitted_at: string;
  juz_number: number;
}

interface FlaggedQuestion {
  questionId: string;
  flagType: string;
  flagMessage?: string;
}

export default function ExamReviewPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagType, setFlagType] = useState('');
  const [flagMessage, setFlagMessage] = useState('');
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && user) {
      fetchExamData();
    }
  }, [isClient, user]);

  const fetchExamData = async () => {
    setLoading(true);
    try {
      // Fetch user's exam attempt
      const attemptRes = await fetch('/api/exam/attempts');
      if (!attemptRes.ok) {
        const errorData = await attemptRes.json();
        if (attemptRes.status === 404) {
          setError('Tidak ada data ujian. Silakan kerjakan ujian terlebih dahulu.');
        } else {
          setError(errorData.error || 'Gagal memuat data ujian');
        }
        setLoading(false);
        return;
      }

      const attemptData = await attemptRes.json();

      if (!attemptData.attempt || attemptData.attempt.status !== 'submitted') {
        setError('Ujian belum selesai. Silakan selesaikan ujian terlebih dahulu.');
        setLoading(false);
        return;
      }

      setAttempt(attemptData.attempt);

      // Fetch questions for the juz
      const juzNumber = attemptData.attempt.juz_number;
      const questionsRes = await fetch(`/api/exam/questions?juz=${juzNumber}`);
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.data || []);
      }

      // Fetch flagged questions
      const flagsRes = await fetch('/api/exam/flags');
      if (flagsRes.ok) {
        const flagsData = await flagsRes.json();
        const flaggedIds = new Set<string>(flagsData.flags?.map((f: any) => f.question_id) || []);
        setFlaggedQuestions(flaggedIds);
      }

    } catch (err) {
      console.error('Error fetching exam data:', err);
      setError('Terjadi kesalahan saat memuat data ujian.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlagSubmit = async () => {
    if (!flagType) {
      alert('Silakan pilih jenis flag');
      return;
    }

    setSubmittingFlag(true);

    try {
      const response = await fetch('/api/exam/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: questions[currentQuestion].id,
          flagType,
          flagMessage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengirim flag');
      }

      setFlagSuccess(true);
      setFlaggedQuestions(prev => new Set(prev).add(questions[currentQuestion].id));

      setTimeout(() => {
        setShowFlagModal(false);
        setFlagSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting flag:', err);
      alert(err.message || 'Gagal mengirim flag');
    } finally {
      setSubmittingFlag(false);
    }
  };

  const getUserAnswerForQuestion = (questionId: string): string => {
    const answerObj = attempt?.answers?.find((a: any) => a.questionId === questionId);
    return answerObj?.answer || '';
  };

  const isAnswerCorrect = (questionId: string): boolean => {
    const answerObj = attempt?.answers?.find((a: any) => a.questionId === questionId);
    return answerObj?.isCorrect === true;
  };

  const getCorrectAnswer = (question: ExamQuestion): string => {
    const correctOption = question.options.find(opt => opt.isCorrect);
    return correctOption?.text || question.correct_answer || '';
  };

  // Calculate stats
  const totalAnswered = attempt?.answers?.length || 0;
  const totalCorrect = attempt?.correct_answers || 0;
  const totalWrong = totalAnswered - totalCorrect;
  const score = attempt?.score || 0;
  const passed = score >= 70;

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat hasil ujian...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <AlertCircle className="w-16 h-16 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Informasi</h1>
              <p className="text-gray-600">{error}</p>
            </div>
            <Link href="/perjalanan-saya">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!attempt || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <AlertCircle className="w-16 h-16 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Tidak Ditemukan</h1>
              <p className="text-gray-600">Data ujian tidak tersedia. Silakan kerjakan ujian terlebih dahulu.</p>
            </div>
            <Link href="/perjalanan-saya">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const userAnswer = getUserAnswerForQuestion(currentQ.id);
  const isCorrect = isAnswerCorrect(currentQ.id);
  const correctAnswer = getCorrectAnswer(currentQ);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <Link href="/perjalanan-saya">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Review Hasil Ujian</h1>
        <div className="w-24"></div>
      </div>

      {/* Score Summary Card */}
      <Card className={`${passed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nilai Akhir</p>
              <p className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-yellow-600'}`}>
                {score}/100
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Benar</p>
              <p className="text-2xl font-bold text-green-600">{totalCorrect}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Salah</p>
              <p className="text-2xl font-bold text-red-600">{totalWrong}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Dijawab</p>
              <p className="text-2xl font-bold text-blue-600">{totalAnswered}/{questions.length}</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className={`text-sm font-medium ${passed ? 'text-green-700' : 'text-yellow-700'}`}>
              {passed
                ? '🎉 Alhamdulillah! Ukhti LULUS ujian ini.'
                : 'Mohon maaf, ukhti belum lulus ujian ini. Jangan menyerah!'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Question Review Card */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {currentQ.section_title} - Soal {currentQ.question_number}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Benar
                </span>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  <XCircle className="w-4 h-4" />
                  Salah
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-900 font-medium text-lg font-arabic">
              {currentQ.question_text}
            </p>
          </div>

          {/* Options with answer indicators */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Pilihan Jawaban:</p>
            {currentQ.options.map((option, index) => {
              const isUserAnswer = userAnswer === option.text;
              const isCorrectOption = option.isCorrect;

              let bgColor = 'bg-white border-gray-200';
              let textColor = 'text-gray-700';
              let icon = null;

              if (isUserAnswer && isCorrectOption) {
                bgColor = 'bg-green-100 border-green-500';
                textColor = 'text-green-900';
                icon = <CheckCircle className="w-4 h-4 text-green-600" />;
              } else if (isUserAnswer && !isCorrectOption) {
                bgColor = 'bg-red-100 border-red-500';
                textColor = 'text-red-900';
                icon = <XCircle className="w-4 h-4 text-red-600" />;
              } else if (isCorrectOption) {
                bgColor = 'bg-green-50 border-green-300';
                textColor = 'text-green-800';
                icon = <CheckCircle className="w-4 h-4 text-green-500" />;
              }

              return (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-4 border-2 rounded-lg ${bgColor}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div className={`flex-grow ${textColor}`}>
                    <span className="text-sm">
                      {isUserAnswer && 'Jawaban ukhti: '}
                      {isCorrectOption && !isUserAnswer && 'Jawaban benar: '}
                    </span>
                    <span className="font-medium">{option.text}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              variant="outline"
            >
              Sebelumnya
            </Button>

            <Button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === questions.length - 1}
              variant="outline"
            >
              Selanjutnya
            </Button>
          </div>

          {/* Flag Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => {
                setShowFlagModal(true);
                setFlagType('');
                setFlagMessage('');
                setFlagSuccess(false);
              }}
              variant="outline"
              className={`${
                flaggedQuestions.has(currentQ.id)
                  ? 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-300'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
              }`}
              disabled={flaggedQuestions.has(currentQ.id)}
            >
              <Flag className="w-4 h-4 mr-2" />
              {flaggedQuestions.has(currentQ.id) ? 'Sudah Diflag' : 'Lapor Kesalahan Soal'}
            </Button>
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
            {questions.map((question, index) => {
              const answered = getUserAnswerForQuestion(question.id);
              const correct = isAnswerCorrect(question.id);
              const isCurrent = currentQuestion === index;

              let bgColor = 'bg-gray-100 text-gray-600';
              if (answered) {
                bgColor = correct
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200';
              }
              if (isCurrent) {
                bgColor = correct ? 'bg-green-600 text-white' : 'bg-red-600 text-white';
              }

              return (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${bgColor}`}
                  title={answered ? (correct ? 'Benar' : 'Salah') : 'Tidak dijawab'}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
              <span className="text-gray-600">Benar</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div>
              <span className="text-gray-600">Salah</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-gray-600">Tidak dijawab</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-orange-600" />
                  Lapor Kesalahan Soal
                </CardTitle>
                <Button
                  onClick={() => setShowFlagModal(false)}
                  variant="ghost"
                  size="sm"
                  disabled={submittingFlag || flagSuccess}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {flagSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-green-800">Terima kasih ukhti!</p>
                  <p className="text-xs text-green-700">Laporan berhasil dikirim.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Jika <em>ukhti</em> menemukan kesalahan pada soal, silakan laporkan kepada kami.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Kesalahan *
                    </label>
                    <select
                      value={flagType}
                      onChange={(e) => setFlagType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      disabled={submittingFlag}
                    >
                      <option value="">Pilih jenis kesalahan</option>
                      <option value="wrong_answer">Jawaban salah</option>
                      <option value="typo">Typo (kesalahan ketik)</option>
                      <option value="unclear">Soal tidak jelas</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keterangan Tambahan
                    </label>
                    <textarea
                      value={flagMessage}
                      onChange={(e) => setFlagMessage(e.target.value)}
                      rows={3}
                      placeholder="Jelaskan lebih lanjut tentang kesalahan yang ditemukan..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      disabled={submittingFlag}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      onClick={() => setShowFlagModal(false)}
                      variant="outline"
                      disabled={submittingFlag}
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handleFlagSubmit}
                      disabled={submittingFlag || !flagType}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {submittingFlag ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        'Kirim Laporan'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
