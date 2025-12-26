'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Upload, CheckCircle, AlertCircle, Loader2, Play, Pause } from 'lucide-react';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<{
    url: string;
    fileName: string;
    submittedAt: string;
  } | null>(null);
  const [hasRegistration, setHasRegistration] = useState<boolean | null>(null); // null = checking, true = has, false = no
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Client-side mount and sync Supabase session
  useEffect(() => {
    setIsClient(true);

    // Sync session from server to Supabase client
    const syncSession = async () => {
      try {
        console.log('[DEBUG] Syncing Supabase session from server...');
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log('[DEBUG] No client session, refreshing from server...');
          // Force refresh session
          await supabase.auth.refreshSession();

          const { data: { session: newSession } } = await supabase.auth.getSession();
          console.log('[DEBUG] Session after refresh:', {
            hasSession: !!newSession,
            userId: newSession?.user?.id
          });
        }
      } catch (error) {
        console.error('[ERROR] Session sync failed:', error);
      }
    };

    syncSession();
  }, []);

  // Debug: Log user info on mount
  useEffect(() => {
    console.log('[DEBUG] ===== REKAM SUARA PAGE MOUNTED =====');
    if (user) {
      console.log('[DEBUG] User object:', {
        id: user.id,
        email: user.email,
        full_object: user
      });
    } else {
      console.log('[DEBUG] No user yet');
    }
  }, [user]);

  // Check for existing submission AND registration
  useEffect(() => {
    console.log('[DEBUG] Registration check effect triggered, user?.id:', user?.id);
    if (!user?.id) {
      console.log('[DEBUG] Skipping registration check - no user.id');
      return;
    }

    const checkExistingSubmission = async () => {
      try {
        console.log('[DEBUG] ========== START REGISTRATION CHECK ==========');
        console.log('[DEBUG] Querying with user.id:', user.id);
        console.log('[DEBUG] User email:', user.email);

        // Use API route instead of direct Supabase client to avoid session issues
        console.log('[DEBUG] Fetching via API route...');
        const response = await fetch(`/api/pendaftaran/my`, {
          method: 'GET',
          credentials: 'include',
        });

        console.log('[DEBUG] API response status:', response.status);

        if (!response.ok) {
          console.error('[ERROR] API error:', response.status, response.statusText);
          setHasRegistration(false);
          return;
        }

        const result = await response.json();
        console.log('[DEBUG] API result:', result);

        const dataArray = result.data || [];
        const error = result.error;

        console.log('[DEBUG] Query completed');
        console.log('[DEBUG] Error:', error);
        console.log('[DEBUG] Data array:', dataArray);
        console.log('[DEBUG] Data array length:', dataArray.length);

        if (error) {
          console.error('[ERROR] Error fetching submission:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          setHasRegistration(false);
          return;
        }

        // FIX: API returns an array, get first element for tikrar registration
        const data = Array.isArray(dataArray) ? dataArray.find(reg => reg.registration_type === 'calon_thalibah') : null;
        console.log('[DEBUG] Filtered tikrar registration:', data);

        if (data) {
          // User HAS registration record
          setHasRegistration(true);

          const submissionData = data as {
            oral_submission_url: string | null;
            oral_submission_file_name: string | null;
            oral_submitted_at: string | null;
          };

          if (submissionData.oral_submission_url) {
            console.log('[DEBUG] Found existing submission, setting state');
            setExistingSubmission({
              url: submissionData.oral_submission_url,
              fileName: submissionData.oral_submission_file_name || 'audio.webm',
              submittedAt: submissionData.oral_submitted_at || new Date().toISOString(),
            });
          } else {
            console.log('[DEBUG] No existing submission URL found');
          }
        } else {
          // User does NOT have registration record
          console.log('[DEBUG] No data returned from database - user has no registration');
          setHasRegistration(false);
        }
      } catch (err) {
        console.error('[ERROR] Error checking submission:', err);
        setHasRegistration(false);
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
      setPermissionDenied(false);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Browser *Ukhti* tidak mendukung perekaman audio. Gunakan browser Chrome, Firefox, atau Safari terbaru.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Detect supported MIME type (prioritize common formats)
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
      ];

      let selectedMimeType = 'audio/webm';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('[RECORDING] Using MIME type:', selectedMimeType);
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error starting recording:', err);

      // Specific error handling
      if (err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Akses mikrofon ditolak. Silakan izinkan akses mikrofon di pengaturan browser *Ukhti*.');
      } else if (err.name === 'NotFoundError') {
        setError('Mikrofon tidak ditemukan. Pastikan perangkat *Ukhti* memiliki mikrofon.');
      } else if (err.name === 'NotReadableError') {
        setError('Mikrofon sedang digunakan oleh aplikasi lain. Tutup aplikasi yang menggunakan mikrofon dan coba lagi.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Mikrofon tidak mendukung pengaturan yang diminta. Gunakan perangkat lain.');
      } else {
        setError('Tidak dapat mengakses mikrofon. Pastikan *Ukhti* memberikan izin akses mikrofon dan tidak ada overlay/aplikasi mengambang yang aktif.');
      }
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

    console.log('[UPLOAD] Starting upload, existingSubmission:', existingSubmission);

    // CRITICAL: Check if user already submitted - prevent duplicate submissions
    if (existingSubmission) {
      console.log('[UPLOAD BLOCKED] Existing submission found in state');
      setError('*Ukhti* sudah mengirimkan rekaman sebelumnya. Tidak dapat mengirim lagi.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Double-check in database before uploading (via API route)
      console.log('[UPLOAD] Double-checking database for user:', user.id);
      const checkResponse = await fetch('/api/pendaftaran/my', {
        method: 'GET',
        credentials: 'include',
      });

      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        // FIX: API returns array, filter for tikrar registration
        const dataArray = checkResult.data || [];
        const checkData = Array.isArray(dataArray) ? dataArray.find(reg => reg.registration_type === 'calon_thalibah') : null;
        console.log('[UPLOAD] DB check result:', checkData);

        if (checkData?.oral_submission_url) {
          console.log('[UPLOAD BLOCKED] Existing submission found in database:', checkData.oral_submission_url);
          setError('*Ukhti* sudah mengirimkan rekaman sebelumnya. Tidak dapat mengirim lagi.');
          setIsUploading(false);
          return;
        }
      }

      console.log('[UPLOAD] No existing submission, proceeding with upload...');

      // Check file size (max 10MB for Supabase free tier)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      const fileSizeMB = (audioBlob.size / (1024 * 1024)).toFixed(2);

      if (audioBlob.size > maxSize) {
        setError(`Ukuran file terlalu besar (${fileSizeMB} MB). Maksimal 10 MB. Coba rekam dengan durasi lebih pendek.`);
        return;
      }

      // Generate unique filename - use audio/* to support all formats
      const timestamp = new Date().getTime();
      const fileExtension = audioBlob.type.split('/')[1].split(';')[0]; // Extract extension from MIME type
      const fileName = `${user.id}_alfath29_${timestamp}.${fileExtension}`;

      console.log('[UPLOAD] Starting storage upload:', { fileName, size: audioBlob.size, type: audioBlob.type });
      setUploadProgress(10);

      // Upload to Supabase Storage with retry
      let uploadError = null;
      let uploadAttempts = 0;
      const maxAttempts = 3;

      while (uploadAttempts < maxAttempts) {
        uploadAttempts++;
        console.log(`[UPLOAD] Attempt ${uploadAttempts}/${maxAttempts}`);
        setUploadProgress(10 + (uploadAttempts * 15));

        const { error } = await supabase.storage
          .from('selection-audios')
          .upload(fileName, audioBlob, {
            contentType: audioBlob.type,
            upsert: false
          });

        if (!error) {
          uploadError = null;
          break;
        }

        uploadError = error;
        console.error(`[UPLOAD] Attempt ${uploadAttempts} failed:`, error);

        if (uploadAttempts < maxAttempts) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
        }
      }

      setUploadProgress(60);

      if (uploadError) {
        console.error('Upload error details after retries:', uploadError);

        // Provide specific error messages
        if (uploadError.message?.includes('Payload too large')) {
          throw new Error(`File terlalu besar (${fileSizeMB} MB). Maksimal 10 MB.`);
        } else if (uploadError.message?.includes('not found')) {
          throw new Error('Bucket storage tidak ditemukan. Hubungi administrator.');
        } else if (uploadError.message?.includes('permission')) {
          throw new Error('Tidak ada izin untuk upload. Hubungi administrator.');
        } else {
          throw new Error(`Gagal upload setelah ${maxAttempts} percobaan. Periksa koneksi internet *Ukhti* dan coba lagi.`);
        }
      }

      setUploadProgress(70);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('selection-audios')
        .getPublicUrl(fileName);

      // Update database via API route (to use server-side session)
      const updateData = {
        oral_submission_url: publicUrl,
        oral_submission_file_name: fileName,
        oral_submitted_at: new Date().toISOString(),
      };

      console.log('[UPLOAD] Updating database via API with:', updateData);
      setUploadProgress(80);

      // First get the registration ID (endpoint needs registration ID, not user ID)
      const myRegistrationResponse = await fetch('/api/pendaftaran/my', {
        method: 'GET',
        credentials: 'include',
      });

      if (!myRegistrationResponse.ok) {
        throw new Error('Gagal mendapatkan data pendaftaran');
      }

      const myRegistration = await myRegistrationResponse.json();
      // FIX: API returns array, filter for tikrar registration
      const dataArray = myRegistration.data || [];
      const tikrarReg = Array.isArray(dataArray) ? dataArray.find(reg => reg.registration_type === 'calon_thalibah') : null;
      const registrationId = tikrarReg?.id;

      if (!registrationId) {
        throw new Error('ID pendaftaran tidak ditemukan. Pastikan *Ukhti* sudah mengisi formulir pendaftaran Tikrar Tahfidz.');
      }

      console.log('[UPLOAD] Using registration ID:', registrationId);
      setUploadProgress(90);

      const updateResponse = await fetch('/api/pendaftaran/tikrar/' + registrationId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      console.log('[UPLOAD] API update response status:', updateResponse.status);

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('[UPLOAD ERROR] API error:', errorData);
        setError(`Error menyimpan ke database: ${errorData.error || 'Unknown error'}`);
        throw new Error(`Error menyimpan ke database: ${errorData.error || 'Unknown error'}`);
      }

      const updateResult = await updateResponse.json();
      console.log('[UPLOAD SUCCESS] Database updated successfully:', updateResult);

      setUploadProgress(100);
      setUploadSuccess(true);
      setExistingSubmission({
        url: publicUrl,
        fileName,
        submittedAt: new Date().toISOString()
      });

      console.log('[UPLOAD] Set existingSubmission state to:', { url: publicUrl, fileName });

      // Keep the audio available for playback after upload
      // Don't clear audioBlob and audioURL so user can still play it

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Gagal mengunggah rekaman. Silakan coba lagi.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioPlayerRef.current) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
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

          {/* No Registration Alert - User must register first */}
          {hasRegistration === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <div>
                    <strong><em>Ukhti</em> belum terdaftar</strong>
                    <br />
                    <span className="text-sm">
                      <em>Ukhti</em> harus mengisi formulir pendaftaran Tikrar Tahfidz terlebih dahulu sebelum dapat mengikuti tes seleksi rekam suara.
                    </span>
                  </div>
                  <Button
                    onClick={() => router.push('/pendaftaran/tikrar-tahfidz')}
                    className="w-full bg-red-700 hover:bg-red-800"
                  >
                    Isi Formulir Pendaftaran
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Existing Submission Alert */}
          {existingSubmission && !uploadSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-3">
                  <div>
                    <strong className="text-green-800">Rekaman sudah terkirim</strong>
                    <br />
                    <span className="text-sm text-gray-600">
                      Dikirim pada: {new Date(existingSubmission.submittedAt).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Audio Player for Existing Submission */}
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Rekaman <em>Ukhti</em>:</p>
                    <audio
                      src={existingSubmission.url}
                      controls
                      controlsList="nodownload"
                      className="w-full"
                      preload="auto"
                    />
                  </div>

                  <p className="text-xs text-gray-600 italic">
                    <em>Ukhti</em> sudah mengirimkan rekaman. Tidak bisa mengirim ulang.
                  </p>

                  {/* Return Button */}
                  <Button
                    onClick={() => router.push('/perjalanan-saya')}
                    className="w-full bg-green-700 hover:bg-green-800"
                  >
                    Kembali ke Perjalanan Saya
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{error}</p>

                  {/* Overlay Permission Help */}
                  {permissionDenied && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
                      <p className="font-semibold mb-2">Cara mengatasi masalah izin mikrofon:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li><strong>Tutup aplikasi overlay:</strong> Tutup aplikasi seperti Messenger bubble, floating apps, atau screen recorder</li>
                        <li><strong>Izinkan di browser:</strong> Klik ikon gembok di address bar → Izinkan Mikrofon</li>
                        <li><strong>Periksa pengaturan HP:</strong> Settings → Apps → Browser → Permissions → Microphone → Allow</li>
                        <li><strong>Refresh halaman</strong> setelah memberikan izin</li>
                        <li><strong>Gunakan browser Chrome</strong> jika masalah berlanjut</li>
                      </ol>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <Alert className="bg-blue-50 border-blue-200">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="text-blue-800 font-medium">Mengunggah rekaman... {uploadProgress}%</p>
                  <div className="w-full bg-blue-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600">
                    {uploadProgress < 60 && 'Mengunggah file ke server...'}
                    {uploadProgress >= 60 && uploadProgress < 90 && 'Menyimpan data ke database...'}
                    {uploadProgress >= 90 && 'Menyelesaikan...'}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Alert with Audio Playback */}
          {uploadSuccess && audioBlob && audioURL && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-4">
                  <div>
                    <strong className="text-green-800">Rekaman berhasil dikirim!</strong>
                    <br />
                    <span className="text-sm text-gray-600">
                      <em>Ukhti</em> dapat mendengarkan rekaman <em>Ukhti</em> sebelum kembali ke dashboard.
                    </span>
                  </div>

                  {/* Audio Player in Success State */}
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Rekaman <em>Ukhti</em>:</p>

                    {/* Large Play/Pause Button */}
                    <div className="flex justify-center mb-3">
                      <Button
                        onClick={togglePlayPause}
                        size="lg"
                        variant="outline"
                        className="h-16 w-16 rounded-full p-0"
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8 ml-1" />
                        )}
                      </Button>
                    </div>

                    {/* Audio Controls */}
                    <audio
                      ref={audioPlayerRef}
                      src={audioURL}
                      controls
                      controlsList="nodownload"
                      className="w-full"
                      preload="auto"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                    />
                  </div>

                  {/* Manual Return Button */}
                  <Button
                    onClick={() => router.push('/perjalanan-saya')}
                    className="w-full bg-green-700 hover:bg-green-800"
                  >
                    Kembali ke Perjalanan Saya
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Recording Controls - Only show if user has registration */}
          {!existingSubmission && !uploadSuccess && hasRegistration === true && (
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
                    {/* CRITICAL WARNING - Listen 3 Times Before Submit */}
                    <Alert className="bg-red-50 border-2 border-red-500">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-bold text-red-900 text-base">⚠️ PERHATIAN PENTING!</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                            <li><strong>Dengarkan rekaman <em>Ukhti</em> minimal 3 kali</strong> sebelum mengirim</li>
                            <li><strong>Kesempatan merekam hanya SATU KALI</strong></li>
                            <li>Setelah dikirim, <strong>TIDAK BISA</strong> merekam ulang</li>
                            <li>Pastikan bacaan sudah benar dan jelas</li>
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>

                    {/* File Size Info */}
                    <div className="text-sm text-gray-600 text-center">
                      Ukuran file: {(audioBlob.size / (1024 * 1024)).toFixed(2)} MB
                      {audioBlob.size > 10 * 1024 * 1024 && (
                        <span className="text-red-600 ml-2">(Terlalu besar! Max 10 MB)</span>
                      )}
                    </div>

                    {/* Audio Player */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <p className="text-sm text-gray-700 mb-2 font-medium">Preview Rekaman:</p>

                      {/* Large Play/Pause Button */}
                      <div className="flex justify-center">
                        <Button
                          onClick={togglePlayPause}
                          size="lg"
                          variant="outline"
                          className="h-16 w-16 rounded-full p-0"
                        >
                          {isPlaying ? (
                            <Pause className="w-8 h-8" />
                          ) : (
                            <Play className="w-8 h-8 ml-1" />
                          )}
                        </Button>
                      </div>

                      {/* Hidden Audio Element with Native Controls */}
                      <audio
                        ref={audioPlayerRef}
                        src={audioURL}
                        controls
                        controlsList="nodownload"
                        className="w-full"
                        preload="auto"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        style={{
                          width: '100%',
                          minHeight: '40px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          // Stop audio if playing
                          if (audioPlayerRef.current) {
                            audioPlayerRef.current.pause();
                            audioPlayerRef.current.currentTime = 0;
                          }
                          setIsPlaying(false);
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
                        disabled={isUploading || (audioBlob.size > 10 * 1024 * 1024) || !!existingSubmission}
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
                  <li className="font-bold text-red-700">⚠️ Dengarkan hasil rekaman minimal 3 kali sebelum mengirim</li>
                  <li className="font-bold text-red-700">⚠️ Kesempatan merekam hanya SATU KALI - tidak bisa diulang setelah dikirim</li>
                  <li>Jika sudah yakin bacaan benar, klik "Kirim Rekaman"</li>
                  <li>Format yang didukung: WebM (kompatibel dengan semua perangkat)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Back Button */}
          <Button
            onClick={() => router.push('/perjalanan-saya')}
            variant="outline"
            className="w-full"
          >
            Kembali ke Perjalanan Saya
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
