'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-singleton';

export const dynamic = 'force-dynamic';

export default function RekamSuaraPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [existingSubmission, setExistingSubmission] = useState<{
    url: string;
    fileName: string;
    submittedAt: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Client-side mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check for existing submission
  useEffect(() => {
    if (!user?.id) return;

    const checkExistingSubmission = async () => {
      try {
        const { data, error } = await supabase
          .from('pendaftaran_tikrar_tahfidz')
          .select('oral_submission_url, oral_submission_file_name, oral_submitted_at')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data?.oral_submission_url) {
          setExistingSubmission({
            url: data.oral_submission_url,
            fileName: data.oral_submission_file_name || 'audio.webm',
            submittedAt: data.oral_submitted_at || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error checking submission:', err);
      }
    };

    checkExistingSubmission();
  }, [user?.id]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

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
        setAudioURL(URL.createObjectURL(blob));

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Tidak dapat mengakses mikrofon. Pastikan Anda memberikan izin akses mikrofon.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob || !user?.id) return;

    setIsUploading(true);
    setError(null);

    try {
      // Generate unique filename
      const timestamp = new Date().getTime();
      const fileName = `${user.id}_alfath29_${timestamp}.webm`;
      const filePath = `selection-audios/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('selection-audios')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('selection-audios')
        .getPublicUrl(filePath);

      // Update database
      const { error: dbError } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .update({
          oral_submission_url: publicUrl,
          oral_submission_file_name: fileName,
          oral_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      setUploadSuccess(true);
      setExistingSubmission({
        url: publicUrl,
        fileName,
        submittedAt: new Date().toISOString()
      });

      // Clear recording
      setAudioBlob(null);
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }

      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setError('Gagal mengunggah rekaman. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isClient || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-900" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-green-900">Rekam Suara - Tes Seleksi</CardTitle>
          <CardDescription>
            Bacaan yang harus direkam: <strong>QS. Al-Fath ayat 29</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Arabic Text */}
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <p className="text-2xl leading-loose text-right" dir="rtl">
              مُّحَمَّدٌ رَّسُولُ ٱللَّهِ ۚ وَٱلَّذِينَ مَعَهُۥٓ أَشِدَّآءُ عَلَى ٱلْكُفَّارِ رُحَمَآءُ بَيْنَهُمْ ۖ تَرَىٰهُمْ رُكَّعًا سُجَّدًا يَبْتَغُونَ فَضْلًا مِّنَ ٱللَّهِ وَرِضْوَٰنًا ۖ سِيمَاهُمْ فِى وُجُوهِهِم مِّنْ أَثَرِ ٱلسُّجُودِ ۚ ذَٰلِكَ مَثَلُهُمْ فِى ٱلتَّوْرَىٰةِ ۚ وَمَثَلُهُمْ فِى ٱلْإِنجِيلِ كَزَرْعٍ أَخْرَجَ شَطْـَٔهُۥ فَـَٔازَرَهُۥ فَٱسْتَغْلَظَ فَٱسْتَوَىٰ عَلَىٰ سُوقِهِۦ يُعْجِبُ ٱلزُّرَّاعَ لِيَغِيظَ بِهِمُ ٱلْكُفَّارَ ۗ وَعَدَ ٱللَّهُ ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ مِنْهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًۢا
            </p>
            <p className="text-sm text-gray-600 mt-4">
              QS. Al-Fath (48) : 29
            </p>
          </div>

          {/* Existing Submission Alert */}
          {existingSubmission && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Rekaman sudah terkirim</strong>
                <br />
                Dikirim pada: {new Date(existingSubmission.submittedAt).toLocaleString('id-ID')}
                <br />
                <a
                  href={existingSubmission.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 underline hover:text-green-800"
                >
                  Dengarkan rekaman Anda
                </a>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {uploadSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Rekaman berhasil dikirim! Anda akan diarahkan ke dashboard...
              </AlertDescription>
            </Alert>
          )}

          {/* Recording Controls */}
          {!existingSubmission && (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                {/* Timer */}
                {isRecording && (
                  <div className="text-3xl font-mono text-red-600 animate-pulse">
                    {formatTime(recordingTime)}
                  </div>
                )}

                {/* Record Button */}
                {!audioBlob && (
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    className="w-full sm:w-auto"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    {isRecording ? 'Hentikan Rekaman' : 'Mulai Merekam'}
                  </Button>
                )}

                {/* Audio Preview */}
                {audioBlob && audioURL && (
                  <div className="w-full space-y-4">
                    <audio
                      src={audioURL}
                      controls
                      className="w-full"
                    />

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setAudioBlob(null);
                          if (audioURL) {
                            URL.revokeObjectURL(audioURL);
                            setAudioURL(null);
                          }
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Rekam Ulang
                      </Button>
                      <Button
                        onClick={uploadAudio}
                        disabled={isUploading}
                        className="flex-1"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Mengunggah...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Kirim Rekaman
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-2">
                <p className="font-semibold text-blue-900">Petunjuk:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Klik "Mulai Merekam" dan izinkan akses mikrofon</li>
                  <li>Bacakan QS. Al-Fath ayat 29 dengan tartil</li>
                  <li>Klik "Hentikan Rekaman" setelah selesai</li>
                  <li>Dengarkan hasil rekaman Anda</li>
                  <li>Jika sudah sesuai, klik "Kirim Rekaman"</li>
                  <li>Format yang didukung: WebM (kompatibel dengan semua perangkat)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Back Button */}
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="w-full"
          >
            Kembali ke Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
