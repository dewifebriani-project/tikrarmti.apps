'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Clock, FileText, Loader2, Flag, X, Send } from 'lucide-react';

interface ExamQuestion {
  id: string;
  juz_number: number;
  juz_code: string;
  section_number: number;
  section_title: string;
  question_number: number;
  question_text: string;
  question_type: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  points: number;
}

interface UserAnswer {
  questionId: string;
  answer: string;
}

export default function PilihanGandaPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [noExamRequired, setNoExamRequired] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [quizStarted, setQuizStarted] = useState(false);

  // Flag modal state
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagType, setFlagType] = useState('');
  const [flagMessage, setFlagMessage] = useState('');
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch questions when component mounts
  useEffect(() => {
    if (isClient && user) {
      fetchQuestions();
    }
  }, [isClient, user]);

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

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    setQuestionsError(null);

    try {
      const response = await fetch('/api/exam/questions/for-user');

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.noExamRequired) {
          setNoExamRequired(true);
        } else {
          setQuestionsError(errorData.error || errorData.details || 'Gagal memuat soal');
        }
        setQuestions([]);
        return;
      }

      const result = await response.json();
      setQuestions(result.data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestionsError('Gagal memuat soal. Silakan coba lagi.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Silakan jawab semua pertanyaan terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Convert answers to array format
      const answersArray: UserAnswer[] = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || ''
      }));

      const response = await fetch('/api/exam/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answersArray,
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

  const openFlagModal = () => {
    setShowFlagModal(true);
    setFlagType('');
    setFlagMessage('');
    setFlagSuccess(false);
  };

  const closeFlagModal = () => {
    setShowFlagModal(false);
    setFlagType('');
    setFlagMessage('');
    setFlagSuccess(false);
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

      const result = await response.json();
      console.log('Flag result:', result);

      setFlagSuccess(true);
      setFlaggedQuestions(prev => new Set(prev).add(questions[currentQuestion].id));

      setTimeout(() => {
        closeFlagModal();
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting flag:', error);
      alert(error.message || 'Gagal mengirim flag');
    } finally {
      setSubmittingFlag(false);
    }
  };

  const progressPercentage = questions.length > 0
    ? ((Object.keys(answers).length) / questions.length) * 100
    : 0;

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (authLoading || loadingQuestions) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="text-gray-600">Memuat soal ujian...</p>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  // Show no exam required message
  if (noExamRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full bg-white shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Tidak Ada Ujian</h1>
              <p className="text-gray-600">
                Untuk pilihan Juz 30A atau 30B, tidak ada ujian pilihan ganda yang diperlukan.
              </p>
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

  // Show error state
  if (questionsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full bg-white shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
              <p className="text-gray-600">{questionsError}</p>
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

  // No questions available
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full bg-white shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Soal Belum Tersedia</h1>
              <p className="text-gray-600">
                Maaf <em>ukhti</em>, soal ujian untuk juz yang <em>ukhti</em> pilih belum tersedia. Silakan hubungi admin.
              </p>
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
                    <li>Jumlah soal: {questions.length} pertanyaan</li>
                    <li>Waktu: 30 menit</li>
                    <li>Setiap soal memiliki pilihan jawaban</li>
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
                    Soal {currentQuestion + 1} dari {questions.length}
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
                    {Object.keys(answers).length} dari {questions.length} soal terjawab ({Math.round(progressPercentage)}%)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Question Card */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {questions[currentQuestion].section_title} - Soal {questions[currentQuestion].question_number}
                  </CardTitle>
                  <Button
                    onClick={openFlagModal}
                    variant="ghost"
                    size="sm"
                    className={`${
                      flaggedQuestions.has(questions[currentQuestion].id)
                        ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                        : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                    disabled={flaggedQuestions.has(questions[currentQuestion].id)}
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    {flaggedQuestions.has(questions[currentQuestion].id) ? 'Sudah Diflag' : 'Lapor Soal'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 font-medium text-lg font-arabic">
                    {questions[currentQuestion].question_text}
                  </p>
                </div>

                <RadioGroup
                  value={answers[questions[currentQuestion].id] || ''}
                  onValueChange={(value) => handleAnswerChange(questions[currentQuestion].id, value)}
                >
                  <div className="space-y-3">
                    {questions[currentQuestion].options.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          answers[questions[currentQuestion].id] === option.text
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <RadioGroupItem value={option.text} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                          {option.text}
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

                  {currentQuestion < questions.length - 1 ? (
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
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                  {questions.map((question, index) => (
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
                        onClick={closeFlagModal}
                        variant="ghost"
                        size="sm"
                        disabled={submittingFlag || flagSuccess}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {flagSuccess ? (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>Terima kasih ukhti!</strong> Laporan berhasil dikirim.
                        </AlertDescription>
                      </Alert>
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
                            onClick={closeFlagModal}
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
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Kirim Laporan
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
  );
}
