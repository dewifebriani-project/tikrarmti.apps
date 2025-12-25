'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Upload, CheckCircle, AlertCircle, Play, Pause, RotateCcw } from 'lucide-react';
import ErudaConsole from '@/components/ErudaConsole';

export default function RekamSuaraPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isError: authError } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
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
    try {
      setIsClient(true);
      console.log('✅ Recording page mounted successfully');
    } catch (error) {
      console.error('❌ Error mounting recording page:', error);
      setPageError('Gagal memuat halaman. Silakan refresh.');
    }
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

    // Defer permission check to avoid render-time side effects
    const permissionTimer = setTimeout(() => {
      const checkPermission = async () => {
        try {
          // Skip permission check on mobile/iOS as it's not well supported
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

          if (!isMobile && !isIOS && navigator.permissions && navigator.permissions.query) {
            const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setMicPermission(result.state as 'prompt' | 'granted' | 'denied');

            result.addEventListener('change', () => {
              setMicPermission(result.state as 'prompt' | 'granted' | 'denied');
            });
          } else {
            // On mobile, set permission to 'prompt' initially
            // Will be updated when user actually tries to record
            setMicPermission('prompt');
          }
        } catch (error) {
          console.log('Permission API not supported (normal on mobile)');
          setMicPermission('prompt'); // Assume prompt on mobile
        }
      };

      checkPermission();

      // On mobile, load devices without checking permission first
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        loadAudioDevices();
      }
    }, 0);

    return () => clearTimeout(permissionTimer);
  }, [isClient]);

  // Reload devices when permission is granted
  useEffect(() => {
    if (micPermission === 'granted' && isClient) {
      // Defer device loading to avoid render-time side effects
      const deviceTimer = setTimeout(() => {
        loadAudioDevices();
      }, 0);
      return () => clearTimeout(deviceTimer);
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
      console.log('🎯 startRecording function called');
      setPermissionError(null);
      console.log('🎯 Permission error cleared');

      // Detect mobile device first
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
      const isFirefox = /Firefox/.test(navigator.userAgent);

      console.log('📱 Device detection for recording:', {
        isMobile,
        isIOS,
        isSafari,
        isChrome,
        isFirefox,
        userAgent: navigator.userAgent,
        platform: (navigator as any).userAgentData?.platform || navigator.platform
      });

      // Mobile-specific: Try to get user attention first
      if (isMobile || isIOS) {
        // Show a user gesture prompt for mobile
        const userConfirmed = await new Promise<boolean>((resolve) => {
          const promptDiv = document.createElement('div');
          promptDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999999;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          `;

          const contentDiv = document.createElement('div');
          contentDiv.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 90%;
            text-align: center;
          `;

          contentDiv.innerHTML = `
            <h2 style="margin: 0 0 20px 0; color: #333;">🎤 Izinkan Mikrofon</h2>
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
              Aplikasi membutuhkan akses mikrofon untuk merekam suara.<br><br>
              <strong>Setelah klik "OK", akan muncul popup izin.</strong><br>
              Pilih "Allow" atau "Izinkan" pada popup tersebut.
            </p>
            <button id="allow-mic-btn" style="
              background: #4CAF50;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 5px;
              font-size: 16px;
              cursor: pointer;
              width: 100%;
            ">OK, Siap!</button>
            <button id="cancel-mic-btn" style="
              background: #f44336;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              font-size: 14px;
              cursor: pointer;
              margin-top: 10px;
              width: 100%;
            ">Batal</button>
          `;

          promptDiv.appendChild(contentDiv);
          document.body.appendChild(promptDiv);

          const btn = document.getElementById('allow-mic-btn');
          const cancelBtn = document.getElementById('cancel-mic-btn');

          if (btn) {
            btn.onclick = () => {
              promptDiv.remove();
              resolve(true);
            };
          }

          if (cancelBtn) {
            cancelBtn.onclick = () => {
              promptDiv.remove();
              resolve(false);
            };
          }

          // Auto-cancel after 10 seconds
          setTimeout(() => {
            if (document.body.contains(promptDiv)) {
              promptDiv.remove();
              resolve(false);
            }
          }, 10000);
        });

        if (!userConfirmed) {
          return; // Just return, don't throw error to allow retry
        }
      }

      // Enhanced mobile detection
      const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 768;

      console.log('📐 Screen and device info:', {
        isTablet,
        isSmallScreen,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      });

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

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        setPermissionError('Browser Anda tidak mendukung MediaRecorder API. Silakan update browser Anda ke versi terbaru.');
        return;
      }

      console.log('🎤 Requesting microphone access...');
      console.log('🎯 Using device ID:', selectedDeviceId || 'default device');

      // Mobile-optimized audio constraints with better fallbacks
      let audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      };

      // Add Chrome-specific constraints (with type assertion)
      const advancedConstraints: any = {
        latency: 0, // Lowest possible latency
        googEchoCancellation: true,
        googNoiseSuppression: true,
        googAutoGainControl: true,
        googHighpassFilter: false, // Disable highpass filter for mobile
        googAudioMirroring: false
      };

      // Mobile-specific optimizations
      if (isMobile || isTablet) {
        // More conservative settings for mobile/tablet
        audioConstraints.sampleRate = 16000; // Even lower for better mobile compatibility
        audioConstraints.channelCount = 1; // Force mono

        console.log('📱 Using mobile-optimized audio constraints:', audioConstraints);
      } else {
        // Higher quality for desktop
        audioConstraints.sampleRate = 44100; // Standard CD quality
        audioConstraints.channelCount = 2; // Stereo for desktop

        // Add advanced constraints for desktop Chrome
        Object.assign(audioConstraints, advancedConstraints);
      }

      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? {
              ...audioConstraints,
              deviceId: { exact: selectedDeviceId }
            }
          : audioConstraints
      };

      console.log('🎯 Audio constraints:', constraints);

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
      let fallbackOptions: string[] = [];

      console.log('📱 Device detection for audio format:', {
        isMobile,
        isIOS,
        isSafari,
        isChrome,
        isFirefox,
        userAgent: navigator.userAgent
      });

      // Check all supported MIME types
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/mp4;codecs=mp4a.40.2', // AAC-LC for iOS
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/wav',
        'audio/mpeg' // For older mobile browsers
      ];

      console.log('🔍 Checking supported MIME types:');
      supportedTypes.forEach(type => {
        const isSupported = MediaRecorder.isTypeSupported(type);
        console.log(`  ${type}: ${isSupported ? '✅' : '❌'}`);
        if (isSupported) fallbackOptions.push(type);
      });

      // iOS/Safari have limited audio format support
      if (isIOS || isSafari) {
        // iOS prefers mp4/aac format
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (fallbackOptions.length > 0) {
          mimeType = fallbackOptions[0];
        } else {
          // Last resort - create without MIME type
          console.warn('⚠️ No supported MIME types found, using default');
          mimeType = '';
        }
      } else if (isChrome && !isMobile) {
        // Chrome desktop prefers webm with opus
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (fallbackOptions.length > 0) {
          mimeType = fallbackOptions[0];
        } else {
          mimeType = '';
        }
      } else {
        // For mobile Chrome, Firefox, and other browsers
        if (fallbackOptions.length > 0) {
          mimeType = fallbackOptions[0];
        } else {
          mimeType = '';
        }
      }

      console.log('🎬 Selected MIME type:', mimeType || 'default (browser will choose)');

      // Create MediaRecorder with enhanced error handling
      let mediaRecorder: MediaRecorder;
      try {
        const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
        mediaRecorder = new MediaRecorder(stream, recorderOptions);
        console.log('✅ MediaRecorder created successfully with options:', recorderOptions);
      } catch (error) {
        console.warn('⚠️ Failed to create MediaRecorder with options:', { mimeType }, error);

        // Try without MIME type as fallback
        try {
          mediaRecorder = new MediaRecorder(stream);
          console.log('✅ MediaRecorder created with default settings');
        } catch (fallbackError) {
          console.error('❌ Failed to create MediaRecorder at all:', fallbackError);
          throw new Error('Browser Anda tidak mendukung perekaman audio. Silakan gunakan browser lain atau update browser Anda.');
        }
      }
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Set mobile-specific recording parameters
      const recordingConfig = {
        timeSlice: isMobile || isTablet ? 1000 : 100, // Longer intervals for mobile
        maxChunkSize: isMobile || isTablet ? 50000 : 10000, // Larger chunks for mobile
        retryCount: 0,
        maxRetries: 3
      };

      console.log('📱 Recording configuration:', recordingConfig);

      mediaRecorder.ondataavailable = (event) => {
        console.log('📦 Data available:', {
          size: event.data.size,
          type: event.data.type,
          time: new Date().toISOString(),
          chunkNumber: chunksRef.current.length + 1
        });

        if (event.data.size > 0) {
          // Validate the chunk
          if (event.data.size < recordingConfig.maxChunkSize || chunksRef.current.length === 0) {
            chunksRef.current.push(event.data);
            console.log(`✅ Chunk ${chunksRef.current.length} accepted (${event.data.size} bytes)`);
          } else {
            console.warn(`⚠️ Chunk too large (${event.data.size} bytes), but keeping for debugging`);
            chunksRef.current.push(event.data);
          }
        } else {
          console.warn('⚠️ Received empty chunk, ignoring');
        }

        // Mobile-specific: Check total size to prevent memory issues
        if (isMobile || isTablet) {
          const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          const maxMobileSize = 10 * 1024 * 1024; // 10MB limit for mobile

          if (totalSize > maxMobileSize) {
            console.warn(`⚠️ Mobile recording getting large (${(totalSize / 1024 / 1024).toFixed(2)}MB), consider stopping soon`);
          }
        }
      };

      mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped');
        console.log('📦 Total chunks:', chunksRef.current.length);
        console.log('📊 Chunk sizes:', chunksRef.current.map((chunk, i) => `Chunk ${i + 1}: ${chunk.size} bytes`));

        const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log('📊 Total recording size:', `${(totalSize / 1024).toFixed(2)} KB`);

        // Enhanced mobile/tablet blob handling with multiple fallbacks
        let blob: Blob;
        let finalMimeType = mimeType || 'audio/webm';

        // Determine best MIME type for the current platform
        if (isIOS || isSafari) {
          // iOS/Safari work best with mp4
          if (finalMimeType === 'audio/webm' || finalMimeType === 'audio/webm;codecs=opus') {
            finalMimeType = 'audio/mp4';
            console.log('🔄 Converting webm to mp4 for iOS/Safari compatibility');
          }
        } else if (isMobile && !isChrome) {
          // Some mobile browsers prefer basic formats
          if (!finalMimeType.includes('webm') && !finalMimeType.includes('mp4')) {
            finalMimeType = 'audio/webm';
          }
        }

        // Try creating blob with determined MIME type
        try {
          blob = new Blob(chunksRef.current, { type: finalMimeType });
          console.log('✅ Blob created successfully with type:', finalMimeType);
        } catch (primaryError) {
          console.warn('⚠️ Primary blob creation failed:', primaryError);

          // Fallback 1: Try with generic audio type
          try {
            blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            console.log('✅ Blob created with fallback type: audio/webm');
            finalMimeType = 'audio/webm';
          } catch (fallback1Error) {
            console.warn('⚠️ First fallback failed:', fallback1Error);

            // Fallback 2: Try mp4
            try {
              blob = new Blob(chunksRef.current, { type: 'audio/mp4' });
              console.log('✅ Blob created with second fallback type: audio/mp4');
              finalMimeType = 'audio/mp4';
            } catch (fallback2Error) {
              console.warn('⚠️ Second fallback failed:', fallback2Error);

              // Last resort: Create blob without type
              blob = new Blob(chunksRef.current);
              finalMimeType = 'application/octet-stream';
              console.log('⚠️ Created blob without type (last resort)');
            }
          }
        }

        console.log('🎵 Final blob details:', {
          size: blob.size,
          type: blob.type,
          isAudio: blob.type.startsWith('audio/'),
          finalMimeType: finalMimeType
        });

        // Enhanced blob validation
        if (blob.size === 0) {
          console.error('❌ Audio blob is empty!');
          setPermissionError('Rekaman audio gagal menghasilkan data. Pastikan mikrofon berfungsi dan coba lagi.');
          return;
        }

        // Check if blob is suspiciously small (likely failed recording)
        if (blob.size < 1000 && recordingTime > 2) {
          console.warn('⚠️ Blob size is very small for recording duration, may be corrupted');
        }

        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop audio level monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Clean up all media streams
        stream.getTracks().forEach(track => {
          console.log('🛑 Stopping track:', track.label || 'Unknown track');
          try {
            track.stop();
          } catch (trackError) {
            console.warn('⚠️ Error stopping track:', trackError);
          }
        });

        // Clean up audio context
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close();
          } catch (ctxError) {
            console.warn('⚠️ Error closing audio context:', ctxError);
          } finally {
            audioContextRef.current = null;
          }
        }

        console.log('✅ Recording cleanup completed successfully');
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('❌ MediaRecorder error:', event.error);
      };

      mediaRecorder.onstart = () => {
        // console.log('▶️ Recording started');
      };

      console.log('🎙️ Starting MediaRecorder...');

      // Mobile-specific recording settings with adaptive intervals
      let timeSlice: number | undefined;
      let recordingStrategy = 'default';

      if (isMobile || isTablet) {
        // Adaptive time slice based on device capabilities
        const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
        // Check deviceMemory with proper type assertion
        const deviceMemory = (navigator as any).deviceMemory;
        const isLowMemory = deviceMemory !== undefined && deviceMemory <= 4; // deviceMemory might not be available on all browsers

        if (isLowEndDevice || isLowMemory) {
          timeSlice = 2000; // 2 seconds for low-end devices
          recordingStrategy = 'low-end-mobile';
        } else {
          timeSlice = 1000; // 1 second for regular mobile
          recordingStrategy = 'standard-mobile';
        }

        console.log('📱 Using mobile recording strategy:', {
          strategy: recordingStrategy,
          timeSlice: timeSlice,
          isLowEndDevice,
          isLowMemory,
          hardwareCores: navigator.hardwareConcurrency,
          deviceMemory: deviceMemory !== undefined ? deviceMemory + 'GB' : 'unknown'
        });
      } else {
        timeSlice = 100; // Desktop gets more frequent updates
        recordingStrategy = 'desktop';
        console.log('🖥️ Using desktop recording strategy:', { timeSlice, strategy: recordingStrategy });
      }

      // Start recording with error handling
      try {
        if (timeSlice) {
          mediaRecorder.start(timeSlice);
          console.log(`✅ MediaRecorder started with ${timeSlice}ms intervals`);
        } else {
          mediaRecorder.start();
          console.log('✅ MediaRecorder started without intervals (will collect all data at once)');
        }
      } catch (startError) {
        console.error('❌ Failed to start MediaRecorder:', startError);
        throw new Error('Gagal memulai perekaman. Silakan refresh halaman dan coba lagi.');
      }
      setIsRecording(true);

      // Refresh device list after recording starts (helps on mobile)
      setTimeout(() => {
        loadAudioDevices();
      }, 1000);

      console.log('✅ Recording active with settings:', {
        mimeType,
        timeSlice,
        state: mediaRecorder.state,
        audioTracks: stream.getAudioTracks().length
      });
    } catch (error: any) {
      console.error('❌ Error accessing microphone:', error);
      console.error('❌ Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        constraint: error.constraint,
        toString: error.toString()
      });
      setMicPermission('denied');

      // Re-detect mobile for error message
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      let errorMessage = 'Tidak dapat mengakses mikrofon. ';
      let mobileSuggestions = '';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Anda menolak izin akses mikrofon. ';
        if (isIOS) {
          mobileSuggestions = '📱 iOS: Buka Settings > Safari > Microphone, lalu izinkan untuk situs ini. Atau tap ikon "aa" di address bar dan pilih Website Settings > Microphone > Allow.';
        } else if (isMobile) {
          mobileSuggestions = '📱 Android: Tap ikon gembok/info di address bar, lalu izinkan akses mikrofon. Atau buka browser Settings > Site settings > Microphone.';
        } else {
          mobileSuggestions = 'Desktop: Klik ikon gembok/info di address bar browser, lalu izinkan akses mikrofon untuk situs ini.';
        }
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'Tidak ada mikrofon yang terdeteksi di perangkat Anda. ';
        if (isMobile) {
          mobileSuggestions = '📱 Pastikan: 1) Mikrofon tidak digunakan aplikasi lain, 2) Mode panggilan tidak aktif, 3) Perangkat memiliki mikrofon built-in atau headset terhubung.';
        } else {
          mobileSuggestions = 'Pastikan mikrofon terhubung dan diaktifkan di Sound Settings.';
        }
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Mikrofon sedang digunakan oleh aplikasi lain. ';
        if (isMobile) {
          mobileSuggestions = '📱 Tutup semua aplikasi yang menggunakan mikrofon (WhatsApp, Telegram, Zoom, Teams, panggilan telepon). Lalu restart browser.';
        } else {
          mobileSuggestions = 'Tutup aplikasi desktop yang menggunakan mikrofon (Zoom, Teams, WhatsApp Desktop, Discord) lalu coba lagi.';
        }
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage += 'Pengaturan audio tidak didukung oleh mikrofon Anda. ';
        mobileSuggestions = 'Coba gunakan mikrofon default atau hubungkan mikrofon eksternal yang kompatibel.';
      } else if (error.name === 'SecurityError') {
        errorMessage += 'Akses mikrofon diblokir karena alasan keamanan. ';
        mobileSuggestions = 'Pastikan Anda mengakses halaman ini melalui HTTPS, bukan HTTP.';
      } else if (error.name === 'TypeError') {
        errorMessage += 'Tipe data tidak didukung oleh browser. ';
        mobileSuggestions = 'Coba update browser ke versi terbaru atau gunakan browser yang berbeda.';
      } else {
        errorMessage += `Error: ${error.name} - ${error.message}. `;
        mobileSuggestions = 'Coba refresh halaman dan gunakan browser Chrome atau Firefox terbaru.';
      }

      // Additional mobile-specific troubleshooting
      if (isMobile) {
        mobileSuggestions += '\n\n🔧 Mobile Troubleshooting:\n';
        mobileSuggestions += '• Restart browser aplikasi\n';
        mobileSuggestions += '• Clear browser cache\n';
        mobileSuggestions += '• Matikan dan hidupkan kembali perangkat\n';
        mobileSuggestions += '• Coba gunakan browser Chrome/Edge terbaru\n';
        if (isIOS) {
          mobileSuggestions += '• Pastikan iOS versi 14.0 atau lebih tinggi';
        }
      }

      setPermissionError(errorMessage + '\n\n' + mobileSuggestions);
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
      let finalMimeType = audioBlob.type;

      // Fix for mobile browsers that return empty or incorrect MIME type
      if (!finalMimeType || finalMimeType === '' || finalMimeType === 'application/octet-stream') {
        finalMimeType = 'audio/webm';
        fileExtension = 'webm';
      } else if (finalMimeType.includes('mp4') || finalMimeType.includes('m4a')) {
        fileExtension = 'mp4';
      } else if (finalMimeType.includes('ogg')) {
        fileExtension = 'ogg';
      } else if (finalMimeType.includes('wav')) {
        fileExtension = 'wav';
      }

      const fileName = `rekaman-seleksi-${Date.now()}.${fileExtension}`;

      // Create a new File object with proper MIME type if needed
      let fileToUpload: File;
      try {
        fileToUpload = new File([audioBlob], fileName, {
          type: finalMimeType,
          lastModified: Date.now()
        });
        console.log('✅ Client: File created with type:', finalMimeType);
      } catch (fileError) {
        console.warn('⚠️ Could not create File object, using blob directly:', fileError);
        fileToUpload = audioBlob as any;
      }

      try {
        formData.append('audio', fileToUpload);
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

      // Enhanced mobile-specific upload configuration
      // IMPORTANT: Do NOT set Content-Type for FormData - browser will set it automatically with boundary
      const uploadConfig: RequestInit = {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          // Remove User-Agent header as it's automatically set by browser
          'X-Mobile-Device': isMobile ? 'true' : 'false',
          'X-Platform': navigator.platform || 'unknown'
        },
        // Add credentials for cookies/session
        credentials: 'include'
      };

      // Add timeout and retry configuration for mobile
      if (isMobile || isTablet) {
        // Create an AbortController for timeout
        const controller = new AbortController();
        // Increased timeout for slower mobile connections
        const timeoutMs = isTablet ? 180000 : 300000; // 3 minutes for tablet, 5 minutes for mobile
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.log(`📱 Upload timeout after ${timeoutMs}ms`);
        }, timeoutMs);

        uploadConfig.signal = controller.signal;
        console.log(`📱 Mobile/Tablet: Added ${timeoutMs/1000}s timeout`);

        // Store timeout ID for potential cleanup
        (uploadConfig as any).timeoutId = timeoutId;
      } else {
        // Desktop gets moderate timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for desktop
        uploadConfig.signal = controller.signal;
        console.log('🖥️ Desktop: Added 60-second timeout');
      }

      // Upload with progress tracking
      console.log('📤 Starting upload request...');
      const uploadStartTime = Date.now();

      let response: Response;
      try {
        response = await fetch('/api/seleksi/submit', uploadConfig);
      } catch (fetchError: any) {
        const uploadDuration = Date.now() - uploadStartTime;
        console.error('❌ Upload fetch failed:', {
          error: fetchError,
          duration: `${uploadDuration}ms`,
          isAborted: fetchError.name === 'AbortError',
          isMobile,
          isTablet,
          errorName: fetchError.name,
          errorMessage: fetchError.message
        });

        // For mobile/tablet, try Base64 immediately on network failure
        if ((isMobile || isTablet) && fetchError.name !== 'AbortError') {
          console.log('🔄 Network error on mobile, trying Base64 upload immediately...');
          try {
            const base64Result = await tryBase64Upload(audioBlob, session.access_token, fileName);
            console.log('✅ Base64 upload successful after network error:', base64Result);
            setSubmitStatus('success');
            setTimeout(() => {
              router.push('/perjalanan-saya');
            }, 2000);
            return;
          } catch (base64Error: any) {
            console.error('❌ Base64 upload also failed after network error:', base64Error);
            throw new Error(`Gagal mengirim rekaman. Network error: ${fetchError.message}. Base64 error: ${base64Error.message}`);
          }
        }

        if (fetchError.name === 'AbortError') {
          throw new Error(`Upload timeout. Koneksi terlalu lambat (${(uploadDuration/1000).toFixed(1)}s). Coba lagi dengan koneksi yang lebih stabil.`);
        } else {
          throw new Error(`Gagal mengirim ke server: ${fetchError.message || 'Network error'}`);
        }
      }

      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`✅ Upload completed in ${uploadDuration}ms`);

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

        // ALWAYS try Base64 fallback for mobile/tablet if FormData failed
        if (isMobile || isTablet) {
          console.log('🔄 FormData failed on mobile, automatically trying Base64 fallback...');
          try {
            const base64Result = await tryBase64Upload(audioBlob, session.access_token, fileName);
            console.log('✅ Base64 upload successful:', base64Result);
            setSubmitStatus('success');
            setTimeout(() => {
              router.push('/perjalanan-saya');
            }, 2000);
            return;
          } catch (base64Error: any) {
            console.error('❌ Base64 upload also failed:', base64Error);
            const base64ErrorMessage = base64Error?.message || 'Unknown Base64 error';
            throw new Error(`Upload gagal dengan kedua metode. FormData: ${errorData.error || response.status}. Base64: ${base64ErrorMessage}`);
          }
        }

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
      // Re-detect mobile for error context
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      console.error('❌ Client: Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        toString: error.toString(),
        isMobile,
        blobInfo: audioBlob ? {
          size: audioBlob.size,
          type: audioBlob.type,
          constructor: audioBlob.constructor.name
        } : 'No blob'
      });

      // Mobile-specific error logging
      if (isMobile) {
        console.error('📱 Mobile Upload Error Context:', {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          connection: (navigator as any).connection ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink,
            rtt: (navigator as any).connection.rtt
          } : 'No connection info',
          memory: (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize
          } : 'No memory info'
        });
      }

      // Show user-friendly error with debugging info
      const userErrorMessage = `${errorMessage}${isMobile ? ' 📱 Lihat console untuk detail debugging' : ''}`;
      alert(userErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alternative Base64 upload method for mobile fallback
  const tryBase64Upload = async (blob: Blob, token: string, fileName: string) => {
    console.log('🔄 Starting Base64 upload...');

    // Convert blob to base64
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const base64Content = base64Data.split(',')[1]; // Remove data:...;base64, prefix

          console.log('📊 Base64 conversion successful, size:', base64Content.length);

          const payload = {
            audioBase64: base64Content,
            fileName: fileName,
            mimeType: blob.type,
            size: blob.size
          };

          console.log('📤 Sending Base64 payload...');

          const response = await fetch('/api/seleksi/submit-base64', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
            credentials: 'include'
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || `Base64 upload failed (${response.status})`);
          }

          resolve(result);
        } catch (error) {
          console.error('❌ Base64 upload error:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to convert audio to base64'));
      };

      reader.readAsDataURL(blob);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Clean up any existing permission dialogs on mount
  useEffect(() => {
    // Defer DOM manipulation to avoid render-time side effects
    const cleanupTimer = setTimeout(() => {
      try {
        const existingDialogs = document.querySelectorAll('[id^="prompt-"], [id^="allow-"], [id^="cancel-"]');
        existingDialogs.forEach(el => el.remove());
      } catch (error) {
        console.warn('Failed to cleanup dialogs:', error);
      }
    }, 0);

    return () => clearTimeout(cleanupTimer);
  }, []);

  // Handle authentication redirect
  useEffect(() => {
    // Use setTimeout to avoid calling router.push during render
    const redirectTimer = setTimeout(() => {
      if (!authLoading && !user) {
        console.log('🔒 User not authenticated, redirecting to login...');
        router.push('/login');
      }
    }, 0);

    return () => clearTimeout(redirectTimer);
  }, [authLoading, user, router]);

  // Show error if page failed to load
  if (pageError) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">Terjadi Kesalahan</h2>
              <p className="text-gray-600">{pageError}</p>
              <Button onClick={() => window.location.reload()} className="w-full">
                Refresh Halaman
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show auth error
  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">Autentikasi Gagal</h2>
              <p className="text-gray-600">Terjadi kesalahan saat memuat data akun Anda.</p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Kembali ke Login
              </Button>
            </div>
          </CardContent>
        </Card>
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

  // Show loading while redirecting
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Wrap entire render in try-catch for safety
  try {
    return (
      <>
        {/* Mobile Debugging Console - TEMPORARILY DISABLED */}
        {/* <ErudaConsole enabled={true} /> */}

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

        {/* Mobile Debugging Info */}
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>🔍 Mobile Debugging Info:</strong>
            <div className="mt-2 text-xs space-y-1">
              <p>📱 <strong>Console:</strong> Eruda debugging console akan muncul otomatis</p>
              <p>🔄 <strong>Jika tidak muncul:</strong> Cari tombol hijau "Debug Console" di pojok kanan atas</p>
              <p>📊 <strong>Logs:</strong> Semua proses recording dan upload terlihat di console</p>
              <p>🔧 <strong>Debug Tools:</strong> Gunakan tab Console, Network, dan Resources</p>
              <p>💡 <strong>Refresh:</strong> Refresh halaman jika console tidak muncul</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Mobile Permission Helper */}
        {(isClient && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>⚠️ Mobile Permission Guide:</strong>
              <div className="mt-2 text-xs space-y-2">
                <div>
                  <p><strong>🚫 Jika muncul "Situs ini tidak dapat meminta izin":</strong></p>
                  <ol className="list-decimal list-inside mt-1 ml-2 space-y-1">
                    <li>Tutup semua tab browser yang buka website ini</li>
                    <li>Buka kembali website ini di tab baru</li>
                    <li>Klik "Mulai Rekam" SEKALI lagi</li>
                    <li>Saat popup muncul, langsung klik "Allow" atau "Izinkan"</li>
                  </ol>
                </div>
                <div>
                  <p><strong>📱 iPhone/iPad Safari:</strong></p>
                  <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                    <li>Buka Settings → Safari → Mikrofon</li>
                    <li>Izinkan untuk situs ini</li>
                    <li>Refresh halaman ini</li>
                  </ul>
                </div>
                <div>
                  <p><strong>📱 Android Chrome:</strong></p>
                  <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                    <li>Tap ikon gembok di address bar</li>
                    <li>Ubah Mikrofon menjadi "Allow"</li>
                    <li>Refresh halaman</li>
                  </ul>
                </div>
              </div>
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
              <li>Bacalah Surah Al-Fath ayat 29 dengan tartil dan tajwid yang benar</li>
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
                    onClick={() => {
                      console.log('🎯 Recording button clicked');
                      setPermissionError(null);
                      // Add small delay to ensure click is registered
                      setTimeout(() => {
                        startRecording().catch(error => {
                          console.error('❌ Recording error:', error);
                          setPermissionError(error.message || 'Gagal memulai rekaman');
                        });
                      }, 100);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-3 min-h-[48px] touch-manipulation relative"
                    size="lg"
                    disabled={isRecording}
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
                <div className="flex flex-col items-center space-y-3">
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

                  {/* Mobile Bypass Button */}
                  {(isClient && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) && (
                    <Button
                      onClick={() => {
                        setPermissionError(null);
                        window.open('/seleksi/rekam-suara', '_blank');
                      }}
                      variant="outline"
                      className="px-4 py-3 min-h-[48px] touch-manipulation text-orange-600 border-orange-300 hover:bg-orange-50"
                      size="sm"
                    >
                      📱 Buka di Tab Baru
                    </Button>
                  )}
                </div>
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
    </>
    );
  } catch (error) {
    console.error('❌ Fatal error rendering recording page:', error);
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">Oops! Terjadi Kesalahan</h2>
              <p className="text-gray-600">
                Maaf, halaman ini mengalami error. Silakan refresh halaman atau coba lagi nanti.
              </p>
              <div className="space-y-2">
                <Button onClick={() => window.location.reload()} className="w-full">
                  Refresh Halaman
                </Button>
                <Button onClick={() => router.push('/perjalanan-saya')} variant="outline" className="w-full">
                  Kembali ke Perjalanan Saya
                </Button>
              </div>
              {error instanceof Error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer">Detail Error (untuk debugging)</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {error.message}
                    {'\n\n'}
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
