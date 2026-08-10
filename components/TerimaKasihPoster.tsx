'use client';

import { forwardRef } from 'react';

interface TerimaKasihPosterProps {
  ustadzahName: string;
}

export const TerimaKasihPoster = forwardRef<HTMLDivElement, TerimaKasihPosterProps>(
  ({ ustadzahName }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1620,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#fbf8f1',
        }}
      >
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/posters/terima-kasih-bg.jpg" 
          alt="Terima Kasih Ustadzah" 
          crossOrigin="anonymous" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }} 
        />
        
        {/* Dynamic Name */}
        <div style={{
          position: 'absolute',
          top: 452, // Moved slightly up to balance with "Ustadzah"
          left: 445, 
          width: 500, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          zIndex: 2,
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          <span style={{
            color: '#0d4a30',
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 48,
            fontWeight: 700,
            backgroundColor: 'rgba(255, 235, 59, 0.6)', // Stabilo yellow
            padding: '0px 10px',
            borderRadius: '4px'
          }}>
            {ustadzahName || ''}
          </span>
        </div>
      </div>
    );
  }
);

TerimaKasihPoster.displayName = 'TerimaKasihPoster';

