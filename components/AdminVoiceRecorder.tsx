'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Play, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminVoiceRecorderProps {
  onAudioReady: (audioBlob: Blob | null) => void;
  existingAudioUrl?: string | null;
}

export function AdminVoiceRecorder({ onAudioReady, existingAudioUrl }: AdminVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioReady(audioBlob);
        
        // Clean up tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Tidak dapat mengakses mikrofon. Pastikan Anda telah memberikan izin.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    onAudioReady(null);
    setRecordingDuration(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-900">Suara Penilaian (Opsional)</h4>
            <p className="text-xs text-gray-500">Berikan catatan atau contoh bacaan lewat suara</p>
          </div>
        </div>
        
        {isRecording ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-red-500 font-medium">
              <span className="animate-pulse h-2 w-2 rounded-full bg-red-500"></span>
              <span className="text-sm">{formatTime(recordingDuration)}</span>
            </div>
            <Button size="sm" variant="destructive" onClick={stopRecording}>
              <Square className="h-4 w-4 mr-2" /> Stop
            </Button>
          </div>
        ) : audioUrl ? (
          <div className="flex items-center space-x-2">
            <audio controls src={audioUrl} className="h-8 w-48 sm:w-64" />
            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={deleteRecording}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={startRecording} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <Mic className="h-4 w-4 mr-2" /> Rekam Suara
          </Button>
        )}
      </div>
    </div>
  );
}
