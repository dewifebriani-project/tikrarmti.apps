'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Upload, CheckCircle, AlertCircle, Play, Pause, RotateCcw } from 'lucide-react';

export default function RekamSuaraPage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Tidak dapat mengakses mikrofon. Pastikan Anda telah memberikan izin mikrofon.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      alert('Silakan rekam audio terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'rekaman-seleksi.webm');
      formData.append('type', 'oral');

      const response = await fetch('/api/seleksi/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Gagal mengirim rekaman');
      }

      const result = await response.json();
      console.log('Submission result:', result);

      setSubmitStatus('success');
      setTimeout(() => {
        router.push('/perjalanan-saya');
      }, 2000);
    } catch (error) {
      console.error('Error submitting audio:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AuthenticatedLayout title="Seleksi - Rekam Suara">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ujian Seleksi Lisan</h1>
          <p className="text-gray-600">Rekam suara Anda untuk membaca ayat-ayat Al-Qur'an yang ditentukan</p>
        </div>

        {/* Instructions */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Petunjuk:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Klik tombol "Mulai Rekam" untuk memulai perekaman</li>
              <li>Bacalah Surah Al-Fatihah dengan tartil dan tajwid yang benar</li>
              <li>Klik tombol "Stop Rekam" setelah selesai</li>
              <li>Dengarkan kembali rekaman Anda</li>
              <li>Klik "Kirim" jika sudah yakin dengan rekaman</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Recording Card */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-3">
              {isRecording ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600">Sedang Merekam...</span>
                </div>
              ) : (
                <span className="text-gray-900">Rekaman Suara</span>
              )}
            </CardTitle>
            {isRecording && (
              <p className="text-center text-2xl font-mono text-gray-700">
                {formatTime(recordingTime)}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recording Controls */}
            <div className="flex justify-center space-x-4">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
                  size="lg"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Mulai Rekam
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3"
                  size="lg"
                >
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop Rekam
                </Button>
              )}

              {audioUrl && !isRecording && (
                <Button
                  onClick={resetRecording}
                  variant="outline"
                  className="px-6 py-3"
                  size="lg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Rekam Ulang
                </Button>
              )}
            </div>

            {/* Audio Player */}
            {audioUrl && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Putar Rekaman:</h3>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={playAudio}
                      variant="outline"
                      size="sm"
                      className="w-12 h-12 rounded-full"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    <div className="flex-grow">
                      <audio
                        controls
                        src={audioUrl}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || submitStatus === 'success'}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Mengirim...
                      </>
                    ) : submitStatus === 'success' ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Berhasil Dikirim
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Kirim Rekaman
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Berhasil!</strong> Rekaman Anda telah dikirim. Anda akan dialihkan ke halaman perjalanan...
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === 'error' && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Terjadi kesalahan</strong> Gagal mengirim rekaman. Silakan coba lagi.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Note */}
        <div className="text-center text-sm text-gray-500">
          <p>Pastikan Anda berada di tempat yang tenang dan tidak ada gangguan suara saat merekam.</p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}