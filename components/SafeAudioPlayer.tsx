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

    // Use same-origin proxy to fetch the audio blob and bypass CORS restrictions
    const fetchUrl = src.startsWith('http')
      ? `/api/audio-proxy?url=${encodeURIComponent(src)}`
      : src;

    fetch(fetchUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.blob();
      })
      .then(async (blob) => {
        if (active) {
          let finalBlob = blob;
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const uint8 = new Uint8Array(arrayBuffer);
            const headerString = new TextDecoder('utf-8').decode(uint8.subarray(0, 128));
            if (headerString.startsWith('------')) {
              console.log('SafeAudioPlayer: Detected corrupted audio file, attempting on-the-fly repair...');
              const webmHeader = [0x1A, 0x45, 0xDF, 0xA3];
              let webmStart = -1;
              for (let i = 0; i < uint8.length - 4; i++) {
                if (uint8[i] === webmHeader[0] && uint8[i+1] === webmHeader[1] && 
                    uint8[i+2] === webmHeader[2] && uint8[i+3] === webmHeader[3]) {
                  webmStart = i;
                  break;
                }
              }
              
              if (webmStart !== -1) {
                let binaryEnd = uint8.length;
                for (let i = webmStart; i < uint8.length - 3; i++) {
                  if (uint8[i] === 0x0D && uint8[i+1] === 0x0A && uint8[i+2] === 0x2D && uint8[i+3] === 0x2D) {
                    binaryEnd = i;
                    break;
                  }
                  if (uint8[i] === 0x0A && uint8[i+1] === 0x2D && uint8[i+2] === 0x2D) {
                    binaryEnd = i;
                    break;
                  }
                }
                const cleanBytes = uint8.subarray(webmStart, binaryEnd);
                finalBlob = new Blob([cleanBytes], { type: 'audio/webm' });
                console.log('SafeAudioPlayer: On-the-fly repair successful.');
              }
            }
          } catch (repairErr) {
            console.error('SafeAudioPlayer: Error checking/repairing blob:', repairErr);
          }

          createdUrl = URL.createObjectURL(finalBlob);
          setLocalUrl(createdUrl);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error pre-loading audio, falling back to direct URL:', err);
        if (active) {
          setLocalUrl(src);
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
        className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg min-h-[54px]" 
      />
    </div>
  );
}
