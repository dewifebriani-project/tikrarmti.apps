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
  const [isStreamActive, setIsStreamActive] = useState(false); // Track if stream is actually active
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
    assessmentStatus?: string;
    registrationId?: string;
  } | null>(null);
  const [hasRegistration, setHasRegistration] = useState<boolean | null>(null); // null = checking, true = has, false = no
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number>(0);
  const [storageWarning, setStorageWarning] = useState<boolean>(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isEnumeratingDevices, setIsEnumeratingDevices] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

    // Cleanup on unmount - stop recording and release resources
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch (err) {
          console.error('[CLEANUP] Error stopping recorder on unmount:', err);
        }
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
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
            id: string;
            oral_submission_url: string | null;
            oral_submission_file_name: string | null;
            oral_submitted_at: string | null;
            oral_assessment_status?: string | null;
          };

          if (submissionData.oral_submission_url) {
            console.log('[DEBUG] Found existing submission, setting state');
            setExistingSubmission({
              url: submissionData.oral_submission_url,
              fileName: submissionData.oral_submission_file_name || 'audio.webm',
              submittedAt: submissionData.oral_submitted_at || new Date().toISOString(),
              assessmentStatus: submissionData.oral_assessment_status || 'pending',
              registrationId: submissionData.id,
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

  // Enumerate audio devices (check if permission already granted)
  // Permission will be requested when user clicks "Mulai Merekam"
  useEffect(() => {
    const getAudioDevices = async () => {
      // Check if browser supports mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log('[AUDIO DEVICES] Browser does not support mediaDevices');
        return;
      }

      setIsEnumeratingDevices(true);

      try {
        // Try to enumerate devices WITHOUT requesting permission yet
        console.log('[AUDIO DEVICES] Enumerating devices (no permission request)...');
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');

        console.log('[AUDIO DEVICES] Found audio input devices:', audioInputs.map(d => ({
          id: d.deviceId,
          label: d.label || `Microphone ${audioInputs.indexOf(d) + 1}`,
          groupId: d.groupId
        })));

        // Check if we already have permission (devices will have labels if permission granted)
        const hasPermission = audioInputs.some(d => d.label !== '');

        if (hasPermission) {
          setAudioDevices(audioInputs);
          if (audioInputs.length > 0) {
            setSelectedDeviceId(audioInputs[0].deviceId);
            console.log('[AUDIO DEVICES] Permission already granted, selected device:', audioInputs[0].label || audioInputs[0].deviceId);
          }
        } else {
          console.log('[AUDIO DEVICES] No permission yet, will request when user clicks record');
          // Don't set audioDevices - show "click to allow" message instead
        }

        // Listen for device changes (e.g., headphones plugged in/out)
        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

      } catch (err) {
        console.error('[AUDIO DEVICES] Error enumerating devices:', err);
      } finally {
        setIsEnumeratingDevices(false);
      }
    };

    const handleDeviceChange = async () => {
      console.log('[AUDIO DEVICES] Device change detected, re-enumerating...');
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        const hasPermission = audioInputs.some(d => d.label !== '');

        if (hasPermission) {
          setAudioDevices(audioInputs);

          // Update selected device if it still exists, otherwise select first
          if (audioInputs.length > 0) {
            const selectedStillExists = audioInputs.some(d => d.deviceId === selectedDeviceId);
            if (!selectedStillExists) {
              setSelectedDeviceId(audioInputs[0].deviceId);
            }
          }
        }
      } catch (err) {
        console.error('[AUDIO DEVICES] Error re-enumerating devices:', err);
      }
    };

    getAudioDevices();

    // Cleanup event listener
    return () => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, []); // Run once on mount

  // Recording timer with size estimation
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;

          // Estimate file size (roughly: 1 second ~ 12KB for webm audio)
          const estimatedBytes = newTime * 12000;
          setEstimatedSize(estimatedBytes);

          // Warning at 80% capacity (8MB)
          if (estimatedBytes >= 8 * 1024 * 1024 && !storageWarning) {
            setStorageWarning(true);

            // Browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Peringatan Rekam Suara', {
                body: 'Rekaman hampir mencapai batas kapasitas (8MB). Segera hentikan rekaman.',
                icon: '/favicon.ico',
              });
            }
          }

          // Auto-stop at max time (approximately 13 minutes = 10MB)
          const MAX_RECORDING_TIME = 13 * 60; // 13 minutes in seconds
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording();
            setError('Waktu rekaman maksimal (13 menit) tercapai. Rekaman dihentikan otomatis.');
          }

          return newTime;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
      setEstimatedSize(0);
      setStorageWarning(false);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording, storageWarning]);

  const startRecording = async () => {
    try {
      setError(null);
      setPermissionDenied(false);
      setStorageWarning(false);

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Browser *Ukhti* tidak mendukung perekaman audio. Gunakan browser Chrome, Firefox, atau Safari terbaru.');
        return;
      }

      // Determine which device to use and ensure we have fresh device list
      let deviceIdToUse = selectedDeviceId;

      // Always refresh device list when starting recording to ensure we have current devices
      console.log('[RECORDING] Refreshing device list before recording...');
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');

        console.log('[RECORDING] Current available devices:', audioInputs.map(d => d.label || d.deviceId));

        // Check if permission is granted (devices will have labels)
        const hasPermission = audioInputs.some(d => d.label !== '');

        if (!hasPermission) {
          console.log('[RECORDING] No permission yet, requesting...');
          // Request permission first
          const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          permissionStream.getTracks().forEach(track => track.stop());

          // Re-enumerate after permission granted
          const devicesAfterPerm = await navigator.mediaDevices.enumerateDevices();
          const audioInputsAfterPerm = devicesAfterPerm.filter(device => device.kind === 'audioinput');

          console.log('[RECORDING] After permission, devices:', audioInputsAfterPerm.map(d => d.label || d.deviceId));

          setAudioDevices(audioInputsAfterPerm);

          if (audioInputsAfterPerm.length > 0) {
            deviceIdToUse = audioInputsAfterPerm[0].deviceId;
            setSelectedDeviceId(deviceIdToUse);
          }
        } else {
          // Permission already granted, update device list
          setAudioDevices(audioInputs);

          // Verify selected device still exists, otherwise use first available
          if (deviceIdToUse && !audioInputs.some(d => d.deviceId === deviceIdToUse)) {
            console.log('[RECORDING] Selected device no longer available, using first device');
            deviceIdToUse = audioInputs[0].deviceId;
            setSelectedDeviceId(deviceIdToUse);
          } else if (!deviceIdToUse && audioInputs.length > 0) {
            deviceIdToUse = audioInputs[0].deviceId;
            setSelectedDeviceId(deviceIdToUse);
          }
        }
      } catch (enumErr) {
        console.error('[RECORDING] Error enumerating devices:', enumErr);
        // Continue anyway - getUserMedia will fail with proper error
      }

      // Use selected device if available and valid, otherwise use default
      // IMPORTANT: Use 'ideal' instead of 'exact' to avoid OverconstrainedError
      const audioConstraints = deviceIdToUse
        ? { audio: { deviceId: { ideal: deviceIdToUse } } }
        : { audio: true };

      console.log('[RECORDING] Starting recording with constraints:', audioConstraints);

      // Get stream - this is where permission is actually requested
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);

      // Verify stream has audio tracks
      if (!stream.getAudioTracks() || stream.getAudioTracks().length === 0) {
        throw new Error('Tidak ada track audio yang ditemukan dalam stream. Pastikan mikrofon berfungsi.');
      }

      // Check if audio track is enabled
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack.enabled) {
        throw new Error('Track audio tidak diaktifkan. Pastikan izin mikrofon diberikan.');
      }

      console.log('[RECORDING] Stream obtained successfully, audio track:', audioTrack.label || 'unnamed');
      streamRef.current = stream;
      setIsStreamActive(true);

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

          // Check size during recording
          const currentSize = chunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
          setEstimatedSize(currentSize);

          if (currentSize >= 10 * 1024 * 1024) {
            // Auto-stop if exceeds 10MB
            mediaRecorder.stop();
            setError('Ukuran rekaman melebihi 10MB. Rekaman dihentikan otomatis.');
          }
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Check for possible recording errors
      mediaRecorder.onerror = (event) => {
        console.error('[RECORDING] MediaRecorder error:', event);
        setError('Terjadi kesalahan saat merekam. Silakan coba lagi.');
        setIsRecording(false);
      };

      mediaRecorder.start(1000); // Collect data every 1 second
      setIsRecording(true);

      // Notify user that recording started
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Rekaman Dimulai', {
          body: 'Tekan tombol "Hentikan Rekaman" setelah selesai membaca QS. Al-Fath ayat 29.',
          icon: '/favicon.ico',
        });
      }
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

      // Clean up on error
      setIsStreamActive(false);
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('[RECORDING] Error stopping recorder:', err);
      }
    }

    // Clean up stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsStreamActive(false);
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
        submittedAt: new Date().toISOString(),
        assessmentStatus: 'pending',
        registrationId: registrationId,
      });

      console.log('[UPLOAD] Set existingSubmission state to:', { url: publicUrl, fileName, registrationId });

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

  const deleteRecording = async () => {
    if (!existingSubmission?.registrationId) return;

    // Confirm deletion
    if (!window.confirm('Apakah <em>Ukhti</em> yakin ingin menghapus rekaman ini? Setelah dihapus, <em>Ukhti</em> bisa merekam ulang.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      console.log('[DELETE] Starting delete process for registration:', existingSubmission.registrationId);

      // Delete from storage first
      if (existingSubmission.fileName) {
        console.log('[DELETE] Deleting file from storage:', existingSubmission.fileName);
        const { error: storageError } = await supabase.storage
          .from('selection-audios')
          .remove([existingSubmission.fileName]);

        if (storageError) {
          console.error('[DELETE] Storage deletion error:', storageError);
          // Continue anyway - database update is more important
        }
      }

      // Reset database fields via API
      console.log('[DELETE] Resetting database fields');
      const response = await fetch(`/api/pendaftaran/tikrar/${existingSubmission.registrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          oral_submission_url: null,
          oral_submission_file_name: null,
          oral_submitted_at: null,
          oral_assessment_status: 'not_submitted',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus rekaman dari database');
      }

      console.log('[DELETE] Successfully deleted recording');

      // Clear state
      setExistingSubmission(null);
      setError(null);
      setUploadSuccess(false);

      // Show success message
      alert('Rekaman berhasil dihapus. <em>Ukhti</em> sekarang bisa merekam ulang.');

    } catch (err: any) {
      console.error('[DELETE] Error:', err);
      setError(err.message || 'Gagal menghapus rekaman. Silakan coba lagi.');
    } finally {
      setIsDeleting(false);
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
                    <br />
                    <span className="text-xs text-gray-500">
                      Status: {existingSubmission.assessmentStatus === 'pending' ? 'Menunggu penilaian' :
                               existingSubmission.assessmentStatus === 'pass' ? 'Lulus' :
                               existingSubmission.assessmentStatus === 'fail' ? 'Tidak lulus' : 'Belum dinilai'}
                    </span>
                  </div>

                  {/* Audio Player for Existing Submission */}
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Rekaman <em>Ukhti</em>:</p>

                    {/* Large Play/Pause Button */}
                    <div className="flex justify-center mb-3">
                      <Button
                        onClick={() => {
                          const audio = document.getElementById('existing-audio') as HTMLAudioElement;
                          if (audio) {
                            if (audio.paused) {
                              audio.play();
                              setIsPlaying(true);
                            } else {
                              audio.pause();
                              setIsPlaying(false);
                            }
                          }
                        }}
                        size="lg"
                        variant="outline"
                        className="h-16 w-16 rounded-full p-0"
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8 text-green-900" />
                        ) : (
                          <Play className="w-8 h-8 text-green-900" />
                        )}
                      </Button>
                    </div>

                    {/* Hidden audio element */}
                    <audio
                      id="existing-audio"
                      src={existingSubmission.url}
                      className="w-full"
                      preload="auto"
                      onEnded={() => setIsPlaying(false)}
                      onPause={() => setIsPlaying(false)}
                      onPlay={() => setIsPlaying(true)}
                    />
                  </div>

                  {/* Show different message based on assessment status */}
                  {existingSubmission.assessmentStatus === 'pending' || existingSubmission.assessmentStatus === 'not_submitted' ? (
                    <div className="space-y-3">
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          <p className="text-sm text-blue-800">
                            <strong>Salah kirim?</strong> <em>Ukhti</em> bisa menghapus rekaman ini dan merekam ulang selama belum dinilai oleh admin.
                          </p>
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-2">
                        <Button
                          onClick={deleteRecording}
                          disabled={isDeleting}
                          variant="destructive"
                          className="flex-1"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Menghapus...
                            </>
                          ) : (
                            'Hapus & Rekam Ulang'
                          )}
                        </Button>
                        <Button
                          onClick={() => router.push('/perjalanan-saya')}
                          variant="outline"
                          className="flex-1"
                        >
                          Kembali
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-600 italic">
                        Rekaman sudah dinilai. Tidak bisa dihapus atau diubah.
                      </p>
                      <Button
                        onClick={() => router.push('/perjalanan-saya')}
                        className="w-full bg-green-700 hover:bg-green-800"
                      >
                        Kembali ke Perjalanan Saya
                      </Button>
                    </div>
                  )}
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
                {/* Microphone Selection */}
                {audioDevices.length > 0 && (
                  <div className="w-full space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Pilih Mikrofon:
                    </label>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      disabled={isRecording || isUploading}
                    >
                      {audioDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      Pilih mikrofon yang ingin digunakan untuk merekam
                    </p>
                  </div>
                )}

                {/* Microphone Permission Request - Show if no devices found */}
                {audioDevices.length === 0 && !isEnumeratingDevices && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="text-sm text-yellow-800">
                          <strong>Izin mikrofon diperlukan</strong>
                        </p>
                        <p className="text-xs text-yellow-700">
                          Klik tombol "Mulai Merekam" di bawah untuk mengizinkan akses mikrofon.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Storage Warning */}
                {storageWarning && (
                  <Alert variant="destructive" className="animate-pulse">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-bold">⚠️ Peringatan Kapasitas!</p>
                        <p className="text-sm">
                          Estimasi ukuran: {(estimatedSize / (1024 * 1024)).toFixed(1)} MB / 10 MB
                        </p>
                        <p className="text-xs">Segera hentikan rekaman untuk menghindari kehilangan data.</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Timer - Show only when actually recording with active stream */}
                {isStreamActive && isRecording && (
                  <div className="space-y-4 w-full">
                    {/* Recording Indicator */}
                    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="font-bold text-red-700">SEDANG MEREKAM</span>
                      </div>
                      <div className="text-4xl font-mono text-red-600 animate-pulse">
                        {formatTime(recordingTime)}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Estimasi: {(estimatedSize / (1024 * 1024)).toFixed(1)} MB / 10 MB
                      </div>
                    </div>

                    {/* Stop Recording Button */}
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                      className="w-full"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Hentikan Rekaman
                    </Button>
                  </div>
                )}

                {/* Loading/Requesting Permission State */}
                {(!isStreamActive && !audioBlob) && (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Mulai Merekam
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
                            <li><strong>Pastikan bacaan sudah benar dan jelas</strong></li>
                            <li>Periksa dengan teliti sebelum mengirimkan rekaman</li>
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
                  <li>Pilih mikrofon yang akan digunakan dari dropdown di atas</li>
                  <li>Klik "Mulai Merekam" dan izinkan akses mikrofon jika diminta</li>
                  <li>Bacakan QS. Al-Fath ayat 29 dengan tartil</li>
                  <li>Klik "Hentikan Rekaman" setelah selesai</li>
                  <li className="font-bold text-red-700">⚠️ Dengarkan hasil rekaman minimal 3 kali sebelum mengirim</li>
                  <li className="font-bold text-red-700">⚠️ Pastikan <em>Ukhti</em> benar-benar yakin sebelum mengirim</li>
                  <li>Setelah yakin bacaan sudah benar, klik "Kirim Rekaman"</li>
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
