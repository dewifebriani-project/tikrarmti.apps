'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Upload, CheckCircle, AlertCircle, Play, Pause, RotateCcw } from 'lucide-react';

export default function RekamSuaraPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cleanup audio URL and audio context on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl]);

  // Timer for recording
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

  // Load available audio devices
  const loadAudioDevices = async () => {
    try {
      // Check if navigator.mediaDevices exists
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn('navigator.mediaDevices not available');
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.log('📱 Available audio devices:', audioInputs);
      setAudioDevices(audioInputs);

      // Auto-select first device on mobile (usually the only device)
      const preferredDevice = audioInputs.find(device =>
        !device.label.toLowerCase().includes('stereo mix') &&
        !device.label.toLowerCase().includes('wave out') &&
        !device.label.toLowerCase().includes('what u hear')
      ) || audioInputs[0];

      if (preferredDevice) {
        setSelectedDeviceId(preferredDevice.deviceId);
        console.log('🎤 Auto-selected device:', preferredDevice.label || `Device ${audioInputs.indexOf(preferredDevice) + 1}`);
      }
    } catch (error) {
      console.error('Error loading audio devices:', error);
    }
  };

  // Check microphone permission on mount
  useEffect(() => {
    if (!isClient) return;

    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicPermission(result.state as 'prompt' | 'granted' | 'denied');

          result.addEventListener('change', () => {
            setMicPermission(result.state as 'prompt' | 'granted' | 'denied');
          });
        }
      } catch (error) {
        console.log('Permission API not supported');
      }
    };

    checkPermission();

    // Load devices after checking permission on mobile
    if (micPermission === 'granted') {
      loadAudioDevices();
    }
  }, [isClient]);

  // Reload devices when permission is granted
  useEffect(() => {
    if (micPermission === 'granted' && isClient) {
      loadAudioDevices();
    }
  }, [micPermission, isClient]);

  // Monitor audio levels
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 128) * 100);
    setAudioLevel(normalizedLevel);

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  };

  const startRecording = async () => {
    try {
      setPermissionError(null);

      // Check if running on HTTPS or localhost
      const isSecureContext = window.isSecureContext;
      if (!isSecureContext) {
        setPermissionError('Fitur rekam suara memerlukan koneksi HTTPS yang aman. Pastikan Anda mengakses halaman ini melalui HTTPS.');
        return;
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Browser Anda tidak mendukung fitur rekam suara. Gunakan browser modern seperti Chrome, Firefox, atau Edge.');
        return;
      }

      // console.log('🎤 Requesting microphone access...');
      // console.log('🎯 Using device ID:', selectedDeviceId);

      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000
            }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Reload devices after permission granted (labels will now be visible)
      await loadAudioDevices();

      // console.log('✅ Microphone access granted');
      // console.log('📊 Audio tracks:', stream.getAudioTracks());
      // console.log('🔊 Track settings:', stream.getAudioTracks()[0]?.getSettings());

      setMicPermission('granted');

      // Set up audio context for level monitoring
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        source.connect(analyser);

        // console.log('🎚️ Audio analyser connected');
        monitorAudioLevel();
      } catch (error) {
        console.error('⚠️ Audio context error:', error);
      }

      // Set up MediaRecorder with mobile/tablet specific MIME type handling
      let mimeType: string;

      // Check for mobile/tablet browsers and their supported formats
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

      console.log('📱 Device detection for audio format:', {
        isMobile,
        isIOS,
        isSafari,
        userAgent: navigator.userAgent
      });

      // iOS/Safari have limited audio format support
      if (isIOS || isSafari) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else {
          // Fallback for older browsers
          mimeType = 'audio/ogg';
        }
      } else {
        // Standard format for other browsers
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = 'audio/ogg';
        }
      }

      console.log('🎬 Selected MIME type:', mimeType);

      // Create MediaRecorder with error handling
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType });
      } catch (error) {
        console.warn('⚠️ Failed to create MediaRecorder with MIME type:', mimeType, 'Falling back to default');
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        // console.log('📦 Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped');
        console.log('📦 Total chunks:', chunksRef.current.length);
        console.log('📊 Chunk sizes:', chunksRef.current.map(chunk => chunk.size));

        // Mobile/tablet specific blob handling
        let blob: Blob;

        try {
          // For iOS/Safari, ensure proper MIME type
          if (isIOS || isSafari) {
            // Some iOS browsers have issues with webm, try to convert to mp4 if possible
            if (mimeType === 'audio/webm' || mimeType === 'audio/webm;codecs=opus') {
              blob = new Blob(chunksRef.current, { type: 'audio/mp4' });
              console.log('🔄 Converted webm to mp4 for iOS/Safari');
            } else {
              blob = new Blob(chunksRef.current, { type: mimeType });
            }
          } else {
            blob = new Blob(chunksRef.current, { type: mimeType });
          }
        } catch (blobError) {
          console.warn('⚠️ Error creating blob with MIME type:', mimeType, blobError);
          // Fallback to generic blob
          blob = new Blob(chunksRef.current);
        }

        console.log('🎵 Final blob details:', {
          size: blob.size,
          type: blob.type,
          isAudio: blob.type.startsWith('audio/')
        });

        // Validate blob before setting
        if (blob.size === 0) {
          console.error('❌ Audio blob is empty!');
          setPermissionError('Rekaman audio gagal. Silakan coba lagi dengan pastikan mikrofon berfungsi.');
          return;
        }

        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop audio level monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        stream.getTracks().forEach(track => {
          // console.log('🛑 Stopping track:', track.label);
          track.stop();
        });

        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('❌ MediaRecorder error:', event.error);
      };

      mediaRecorder.onstart = () => {
        // console.log('▶️ Recording started');
      };

      // console.log('🎙️ Starting MediaRecorder...');
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Refresh device list after recording starts (helps on mobile)
      setTimeout(() => {
        loadAudioDevices();
      }, 1000);

      // console.log('✅ Recording active');
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      setMicPermission('denied');

      let errorMessage = 'Tidak dapat mengakses mikrofon. ';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Anda menolak izin akses mikrofon. Silakan klik ikon gembok/info di address bar browser, lalu izinkan akses mikrofon untuk situs ini.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'Tidak ada mikrofon yang terdeteksi di perangkat Anda. Pastikan mikrofon terhubung dan diaktifkan.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Mikrofon sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang menggunakan mikrofon (seperti Zoom, Teams, WhatsApp Desktop) lalu coba lagi.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Pengaturan audio tidak didukung oleh mikrofon Anda.';
      } else if (error.name === 'SecurityError') {
        errorMessage += 'Akses mikrofon diblokir karena alasan keamanan. Pastikan Anda mengakses halaman ini melalui HTTPS.';
      } else {
        errorMessage += 'Error: ' + error.message;
      }

      setPermissionError(errorMessage);
    }
  };

  const stopRecording = () => {
    // console.log('🛑 Stop recording requested');
    if (mediaRecorderRef.current && isRecording) {
      // console.log('⏹️ Stopping MediaRecorder...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);

      // Refresh device list after recording stops (helps on mobile)
      setTimeout(() => {
        loadAudioDevices();
      }, 500);
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
      console.log('🎵 Client: Starting audio upload...');
      console.log('📊 Client: Audio blob details:', {
        size: audioBlob.size,
        type: audioBlob.type,
        isAudio: audioBlob.type.startsWith('audio/'),
        constructor: audioBlob.constructor.name
      });

      // Detect mobile/tablet
      const userAgent = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet = /iPad|Android|Tablet/i.test(userAgent) && !/Mobile/i.test(userAgent);
      console.log('📱 Client: Device detection:', {
        userAgent,
        isMobile,
        isTablet,
        platform: navigator.platform,
        vendor: navigator.vendor
      });

      // Get current session with fresh tokens
      const supabase = (await import('@/lib/supabase')).supabase;
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

      if (sessionError || !session) {
        console.error('❌ Client: Session error:', sessionError);
        throw new Error('Tidak ada session. Silakan login kembali.');
      }

      console.log('✅ Client: Session refreshed successfully');
      console.log('🔑 Client: Token length:', session.access_token?.length);

      // Create FormData with proper error handling
      const formData = new FormData();

      // Determine appropriate file extension based on MIME type
      let fileExtension = 'webm'; // default
      if (audioBlob.type.includes('mp4') || audioBlob.type.includes('m4a')) {
        fileExtension = 'mp4';
      } else if (audioBlob.type.includes('ogg')) {
        fileExtension = 'ogg';
      } else if (audioBlob.type.includes('wav')) {
        fileExtension = 'wav';
      }

      const fileName = `rekaman-seleksi-${Date.now()}.${fileExtension}`;

      try {
        formData.append('audio', audioBlob, fileName);
        console.log('✅ Client: FormData created successfully with file:', fileName);
        console.log('✅ Client: FormData created successfully');
        console.log('📋 Client: FormData entries:', Array.from(formData.entries()).map(([key, value]) => [key, {
          name: (value as File).name,
          size: (value as File).size,
          type: (value as File).type,
          isFile: value instanceof File
        }]));
      } catch (formError) {
        console.error('❌ Client: FormData creation error:', formError);
        throw new Error('Gagal membuat form data audio');
      }

      console.log('📤 Client: Sending request to /api/seleksi/submit');

      const response = await fetch('/api/seleksi/submit', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('📥 Client: Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Client: Submit error:', errorData);
        console.error('❌ Client: Response status:', response.status);
        throw new Error(errorData.error || `Gagal mengirim rekaman (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ Client: Submission successful:', result);

      setSubmitStatus('success');
      setTimeout(() => {
        router.push('/perjalanan-saya');
      }, 2000);
    } catch (error: any) {
      console.error('❌ Client: Error submitting audio:', error);
      setSubmitStatus('error');

      // Show detailed error for debugging
      const errorMessage = error.message || 'Gagal mengirim rekaman';
      console.error('❌ Client: Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        toString: error.toString()
      });

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <AuthenticatedLayout title="Seleksi - Rekam Suara">
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <AuthenticatedLayout title="Seleksi - Rekam Suara">
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <AuthenticatedLayout title="Seleksi - Rekam Suara">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Permission Error Alert */}
        {permissionError && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error Akses Mikrofon:</strong>
              <p className="mt-2">{permissionError}</p>
              {micPermission === 'denied' && (
                <div className="mt-3 p-3 bg-white rounded border border-red-200">
                  <p className="font-semibold mb-2">Cara mengizinkan akses mikrofon:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Klik ikon <strong>gembok</strong> atau <strong>info (i)</strong> di sebelah kiri address bar browser</li>
                    <li>Cari pengaturan "<strong>Mikrofon</strong>" atau "<strong>Microphone</strong>"</li>
                    <li>Ubah dari "Blokir" menjadi "<strong>Izinkan</strong>" atau "<strong>Allow</strong>"</li>
                    <li>Muat ulang halaman ini (tekan F5 atau Ctrl+R)</li>
                  </ol>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Microphone Status */}
        {!permissionError && micPermission === 'granted' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Mikrofon Siap:</strong> Akses mikrofon telah diizinkan. Anda dapat mulai merekam.
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions - Mobile & Desktop */}
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
            <div className="mt-3 p-2 bg-white rounded border border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-1">💡 Tips untuk Mobile:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Gunakan headphone untuk kualitas terbaik</li>
                <li>• Rekam di tempat yang sepi dan minim ganguan</li>
                <li>• Jauhkan ponsel dari sumber noise lain</li>
                <li>• Pastikan volume rekaman cukup terdengar</li>
              </ul>
            </div>
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
              <>
                <p className="text-center text-2xl font-mono text-gray-700">
                  {formatTime(recordingTime)}
                </p>
                {/* Audio Level Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Level Audio:</span>
                    <span className={`font-semibold ${audioLevel > 5 ? 'text-green-600' : 'text-red-600'}`}>
                      {audioLevel > 5 ? '🎤 Mendeteksi suara' : '⚠️ Tidak ada suara'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-100 ${
                        audioLevel > 30 ? 'bg-green-500' :
                        audioLevel > 10 ? 'bg-yellow-500' :
                        audioLevel > 5 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(audioLevel, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-center text-gray-500">
                    {audioLevel < 5 && 'Cobalah berbicara lebih keras atau periksa mikrofon Anda'}
                  </p>
                </div>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Microphone Selector - Mobile & Desktop Friendly */}
            {audioDevices.length > 1 && !isRecording && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <label className="text-sm font-semibold text-blue-900">
                    Pilih Mikrofon ({audioDevices.length} tersedia):
                  </label>
                </div>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full p-3 border border-blue-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-manipulation"
                >
                  {audioDevices.map((device, index) => {
                    const isStereoMix = device.label.toLowerCase().includes('stereo mix') ||
                      device.label.toLowerCase().includes('wave out') ||
                      device.label.toLowerCase().includes('what u hear');

                    const deviceLabel = device.label || `Mikrofon ${index + 1}`;
                    const isDefaultDevice = index === 0;

                    return (
                      <option key={device.deviceId} value={device.deviceId}>
                        {deviceLabel}
                        {isStereoMix ? ' ⚠️' : isDefaultDevice ? ' 📱 (Default)' : ' 🎤'}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-blue-700">
                  💡 <strong>Mobile:</strong> Biasanya hanya ada satu mikrofon. <strong>Desktop:</strong> Pilih mikrofon utama (📱 atau 🎤)
                </p>
              </div>
            )}

            {/* Single Device Info (Mobile) */}
            {audioDevices.length === 1 && !isRecording && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900">Mikrofon Siap</p>
                    <p className="text-xs text-green-700">
                      {audioDevices[0].label || `Mikrofon utama terdeteksi`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* No Devices Found */}
            {audioDevices.length === 0 && !isRecording && micPermission === 'granted' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-900">Mendeteksi Mikrofon...</p>
                    <p className="text-xs text-yellow-700 mb-2">
                      Menunggu deteksi perangkat mikrofon. Pastikan mikrofon tidak digunakan aplikasi lain.
                    </p>
                    <button
                      onClick={loadAudioDevices}
                      className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded transition-colors duration-200"
                    >
                      🔄 Refresh Devices
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recording Controls - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex justify-center space-x-3">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-3 min-h-[48px] touch-manipulation"
                    size="lg"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    <span className="text-sm sm:text-base">Mulai Rekam</span>
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-3 min-h-[48px] touch-manipulation"
                    size="lg"
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    <span className="text-sm sm:text-base">Stop Rekam</span>
                  </Button>
                )}

                {audioUrl && !isRecording && (
                  <Button
                    onClick={resetRecording}
                    variant="outline"
                    className="px-3 sm:px-4 py-3 min-h-[48px] touch-manipulation"
                    size="lg"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Ulang</span>
                  </Button>
                )}
              </div>

              {/* Retry Permission Button */}
              {permissionError && (
                <Button
                  onClick={() => {
                    setPermissionError(null);
                    startRecording();
                  }}
                  variant="outline"
                  className="px-4 py-3 min-h-[48px] touch-manipulation"
                  size="sm"
                >
                  🔄 Coba Lagi
                </Button>
              )}
            </div>

            {/* Audio Player */}
            {audioUrl && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 text-center sm:text-left">Putar Rekaman:</h3>
                  <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <Button
                      onClick={playAudio}
                      variant="outline"
                      size="sm"
                      className="w-14 h-14 sm:w-12 sm:h-12 rounded-full touch-manipulation min-w-[56px]"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 sm:w-5 sm:h-5" />
                      ) : (
                        <Play className="w-6 h-6 sm:w-5 sm:h-5" />
                      )}
                    </Button>
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    <div className="w-full sm:flex-grow">
                      <audio
                        controls
                        src={audioUrl}
                        className="w-full h-10 sm:h-auto"
                        preload="metadata"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center sm:text-left">
                    💡 Gunakan headphone untuk hasil terbaik
                  </p>
                </div>

                {/* Submit Button - Mobile Optimized */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || submitStatus === 'success'}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 min-h-[48px] touch-manipulation w-full sm:w-auto"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        <span className="text-sm sm:text-base">Mengirim...</span>
                      </>
                    ) : submitStatus === 'success' ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="text-sm sm:text-base">Berhasil Dikirim</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        <span className="text-sm sm:text-base">Kirim Rekaman</span>
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
