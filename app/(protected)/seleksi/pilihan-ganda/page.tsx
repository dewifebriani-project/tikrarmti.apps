'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Clock, FileText, Loader2, Flag, X, Send, Save } from 'lucide-react';

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

interface ExamConfig {
  durationMinutes: number;
  maxAttempts: number | null;
  passingScore: number;
  autoSubmitOnTimeout: boolean;
  allowReview: boolean;
  showResults: boolean;
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
  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [timeLeft, setTimeLeft] = useState(30 * 60); // Default 30 minutes
  const [quizStarted, setQuizStarted] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // Flag modal state
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagType, setFlagType] = useState('');
  const [flagMessage, setFlagMessage] = useState('');
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  // Autosave state
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

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

  // Auto-start quiz if user has existing draft
  useEffect(() => {
    if (questions.length > 0 && user) {
      checkAndAutoStart();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [questions.length, user]);

  const checkAndAutoStart = async () => {
    try {
      const response = await fetch('/api/exam/attempts');

      if (response.ok) {
        const data = await response.json();
        if (data.attempt && data.attempt.status === 'draft') {
          // Auto-start quiz if user has existing draft
          setQuizStarted(true);
        }
      }
    } catch (error) {
      console.error('Error checking draft status:', error);
    }
  };

  // Load draft answers on mount (after questions are loaded)
  useEffect(() => {
    if (questions.length > 0 && quizStarted) {
      loadDraftAnswers();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, quizStarted]);

  // Autosave when answers change (debounced)
  // TEMPORARILY DISABLED - Comment out to re-enable
  /*
  useEffect(() => {
    if (!quizStarted || Object.keys(answers).length === 0) return;

    const timeoutId = setTimeout(() => {
      saveDraft();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, quizStarted]);
  */

  // Timer countdown with auto-submit
  useEffect(() => {
    if (!isClient) return;

    if (quizStarted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quizStarted && !autoSubmitted) {
      // Auto-submit when time runs out
      setAutoSubmitted(true);
      handleSubmit(true);
    }
  }, [timeLeft, quizStarted, isClient, autoSubmitted]);

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

      // Set exam configuration
      if (result.config) {
        setExamConfig(result.config);
        setTimeLeft(result.config.durationMinutes * 60);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestionsError('Gagal memuat soal. Silakan coba lagi.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadDraftAnswers = async () => {
    try {
      const response = await fetch('/api/exam/attempts');

      if (!response.ok) {
        console.log('No draft to load');
        return;
      }

      const data = await response.json();

      if (data.attempt && data.attempt.status === 'draft') {
        // Load draft answers
        const draftAnswers: Record<string, string> = {};
        data.attempt.answers?.forEach((a: any) => {
          if (a.answer) {
            draftAnswers[a.questionId] = a.answer;
          }
        });
        setAnswers(draftAnswers);
        setLastSavedTime(new Date(data.attempt.updated_at));
        console.log('Loaded', Object.keys(draftAnswers).length, 'draft answers');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = async () => {
    if (Object.keys(answers).length === 0) return;

    setAutosaveStatus('saving');

    try {
      // Convert answers to array format
      const answersArray: UserAnswer[] = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || ''
      })).filter(a => a.answer !== '');

      const response = await fetch('/api/exam/attempts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answersArray,
        }),
      });

      if (response.ok) {
        setAutosaveStatus('saved');
        setLastSavedTime(new Date());

        // Reset status after 2 seconds
        setTimeout(() => {
          setAutosaveStatus('idle');
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Autosave failed:', response.status, errorData);
        setAutosaveStatus('error');
      }
    } catch (error) {
      console.error('Autosave error:', error);
      setAutosaveStatus('error');
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

  const handleSubmit = async (isAutoSubmit = false) => {
    // Soal tidak wajib diisi, hanya beri peringatan
    if (!isAutoSubmit && Object.keys(answers).length < questions.length) {
      const unanswered = questions.length - Object.keys(answers).length;
      const confirmSubmit = confirm(
        `${unanswered} soal belum diisi. Apakah ukhti yakin ingin submit?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Convert answers to array format
      const answersArray: UserAnswer[] = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || '' // Allow empty answers
      }));

      console.log('Submitting exam with', answersArray.length, 'answers');

      const response = await fetch('/api/exam/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answersArray,
        }),
      });

      const responseData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.log('API Response status:', response.status, 'data:', responseData);

      if (!response.ok) {
        console.error('Submit error:', responseData);
        const errorMessage = responseData.details || responseData.error || 'Gagal mengirim jawaban';
        // Show error in a more prominent way
        alert(`❌ Error: ${errorMessage}\n\nStatus: ${response.status}`);
        throw new Error(errorMessage);
      }

      const result = responseData;
      console.log('Submission result:', result);

      setSubmitStatus('success');

      // Show results immediately with alert
      const passed = result.score >= (examConfig?.passingScore || 70);
      alert(
        `✅ Ujian Berhasil Dikirim!\n\n` +
        `Skor ukhti: ${result.score}/100\n` +
        `Jawaban benar: ${result.correctAnswers}/${result.totalQuestions}\n\n` +
        `${passed ? '🎉 Alhamdulillah! Ukhti LULUS.' : 'Mohon maaf, ukhti belum lulus.'}\n\n` +
        `Halaman akan dialihkan...`
      );

      // Redirect after showing the alert
      setTimeout(() => {
        router.push('/perjalanan-saya');
      }, 1000);
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      setSubmitStatus('error');
      // Error already shown in alert above
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

  // Check if question is answered
  const isQuestionAnswered = (questionId: string) => {
    return answers[questionId] !== undefined && answers[questionId] !== '';
  };

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
                    <li>Waktu: {examConfig ? `${examConfig.durationMinutes} menit` : '30 menit'}</li>
                    <li>Nilai lulus: {examConfig ? `${examConfig.passingScore}/100` : '70/100'}</li>
                    <li>Soal tidak wajib diisi semua</li>
                    {examConfig?.maxAttempts && <li>Maksimal percobaan: {examConfig.maxAttempts}x</li>}
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Petunjuk Pengerjaan:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Bacalah <strong>basmalah</strong> dan <strong>doa</strong> sebelum memulai ujian</li>
                  <li>Baca setiap pertanyaan dengan teliti</li>
                  <li>Pilih salah satu jawaban yang paling tepat</li>
                  <li>Gunakan tombol "Sebelumnya" dan "Selanjutnya" untuk navigasi</li>
                  <li>Soal yang tidak diisi akan dianggap salah</li>
                  <li>Klik "Submit Jawaban" jika sudah selesai</li>
                  <li>Waktu habis = otomatis submit</li>
                  <li>Jangan lupa mengucapkan <em>Alhamdulillah</em> setelah selesai</li>
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
            <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-2 ${
              timeLeft < 300 ? 'border-red-300 bg-red-50' : 'border-blue-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`} />
                    <span className={`font-semibold ${timeLeft < 300 ? 'text-red-900' : 'text-blue-900'}`}>
                      {timeLeft < 300 ? 'Waktu Hampir Habis! ' : ''}Sisa Waktu: {formatTime(timeLeft)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Autosave indicator */}
                    {autosaveStatus !== 'idle' && (
                      <div className={`flex items-center gap-1 text-xs ${
                        autosaveStatus === 'saving' ? 'text-blue-600' :
                        autosaveStatus === 'saved' ? 'text-green-600' :
                        'text-red-600'
                      }`}>
                        {autosaveStatus === 'saving' && (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        )}
                        {autosaveStatus === 'saved' && (
                          <>
                            <Save className="w-3 h-3" />
                            <span>Tersimpan</span>
                          </>
                        )}
                        {autosaveStatus === 'error' && (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            <span>Gagal menyimpan</span>
                          </>
                        )}
                      </div>
                    )}
                    <div className="text-sm text-blue-700">
                      Soal {currentQuestion + 1} dari {questions.length}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-blue-600">
                      {Object.keys(answers).length} dari {questions.length} soal terjawab ({Math.round(progressPercentage)}%)
                    </p>
                    {lastSavedTime && (
                      <p className="text-xs text-gray-500">
                        Terakhir: {lastSavedTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
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
                    {flaggedQuestions.has(questions[currentQuestion].id) ? 'Diflag' : 'Lapor'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 font-medium text-lg font-arabic">
                    {questions[currentQuestion].question_text}
                  </p>
                </div>

                {/* Options with custom radio style like tikrar-tahfidz */}
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option, index) => {
                    const isSelected = answers[questions[currentQuestion].id] === option.text;
                    return (
                      <div
                        key={index}
                        onClick={() => handleAnswerChange(questions[currentQuestion].id, option.text)}
                        className={`flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 border-2 rounded-lg transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${questions[currentQuestion].id}`}
                          id={`option-${index}`}
                          value={option.text}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(questions[currentQuestion].id, option.text)}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-grow cursor-pointer text-gray-700"
                        >
                          {option.text}
                        </Label>
                      </div>
                    );
                  })}
                </div>

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
                      onClick={() => handleSubmit(false)}
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
                  {questions.map((question, index) => {
                    const isAnswered = isQuestionAnswered(question.id);
                    return (
                      <button
                        key={question.id}
                        onClick={() => setCurrentQuestion(index)}
                        title={isAnswered ? 'Sudah diisi' : 'Belum diisi'}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                          currentQuestion === index
                            ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                            : isAnswered
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-6 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
                    <span className="text-gray-600">Sudah diisi</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div>
                    <span className="text-gray-600">Belum diisi</span>
                  </div>
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

            {autoSubmitted && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Waktu Habis!</strong> Jawaban <em>ukhti</em> otomatis dikirim karena waktu ujian sudah habis.
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
