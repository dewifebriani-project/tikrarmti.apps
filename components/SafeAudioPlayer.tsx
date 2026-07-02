'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeAudioPlayerProps {
  src: string;
  className?: string;
}

export function SafeAudioPlayer({ src, className }: SafeAudioPlayerProps) {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!src) return;

    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setLocalUrl(src);
      setIsLoading(false);
      return;
    }

    let active = true;
    let createdUrl: string | null = null;
    setIsLoading(true);
    setError(null);

    // Fetch the audio file as a Blob to prevent premature cutoff/seek issues in Chromium
    fetch(src)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (active) {
          createdUrl = URL.createObjectURL(blob);
          setLocalUrl(createdUrl);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error pre-loading audio:', err);
        if (active) {
          setError('Gagal memuat audio');
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [src]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-500 justify-center", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span>Memuat audio...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-semibold text-red-600 justify-center", className)}>
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span>{error}</span>
      </div>
    );
  }

  if (!localUrl) return null;

  return (
    <div className={cn("w-full", className)}>
      <audio 
        ref={audioRef}
        src={localUrl} 
        controls 
        className="w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg" 
      />
    </div>
  );
}
