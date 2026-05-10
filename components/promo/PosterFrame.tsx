'use client';

import { ReactNode } from 'react';

interface PosterFrameProps {
  children: ReactNode;
  scale?: number;
  className?: string;
}

/**
 * Renders the poster at exactly 1080×1080 (Instagram square),
 * scaled down for the viewport via CSS transform so screenshots
 * always capture the same pixel dimensions.
 */
export function PosterFrame({ children, scale = 1, className = '' }: PosterFrameProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: 1080 * scale,
        height: 1080 * scale,
      }}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: 1080,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          fontFamily: 'var(--font-jakarta), system-ui, sans-serif',
        }}
      >
        {children}
      </div>
    </div>
  );
}
