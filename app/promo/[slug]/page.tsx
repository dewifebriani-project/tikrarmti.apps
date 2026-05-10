'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { getPosterBySlug } from '@/components/promo/posters/registry';

export default function PromoPosterPage({ params }: { params: { slug: string } }) {
  const poster = getPosterBySlug(params.slug);
  const [scale, setScale] = useState(1);
  const [actualSize, setActualSize] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (actualSize) {
      setScale(1);
      return;
    }
    const calc = () => {
      const padding = 80;
      const w = window.innerWidth - padding;
      const h = window.innerHeight - 200;
      setScale(Math.min(w / 1080, h / 1080, 1));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [actualSize]);

  if (!poster) {
    notFound();
  }

  const Poster = poster.Component;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1f1f1f]">
      {/* Top bar */}
      <div className="flex-shrink-0 bg-black/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/promo"
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-amber-400 text-[10px] font-extrabold tracking-[0.2em] uppercase">
              Poster Preview
            </p>
            <h1 className="text-white text-base font-bold">{poster.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-xs font-bold">
            1080 × 1080 · {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setActualSize(!actualSize)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition"
            title={actualSize ? 'Fit to screen' : 'Actual size 100%'}
          >
            {actualSize ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {actualSize ? 'Fit' : '100%'}
          </button>
        </div>
      </div>

      {/* Poster stage */}
      <div
        className={`flex-1 flex items-center justify-center p-10 ${
          actualSize ? 'overflow-auto' : 'overflow-hidden'
        }`}
      >
        <div
          ref={containerRef}
          className="relative shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
          style={{
            width: 1080 * scale,
            height: 1080 * scale,
            transform: `scale(1)`,
            background: '#000',
          }}
        >
          <div
            className="absolute top-0 left-0"
            style={{
              width: 1080,
              height: 1080,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <Poster />
          </div>
        </div>
      </div>

      {/* Helper bar */}
      <div className="flex-shrink-0 bg-black/80 border-t border-white/10 px-6 py-3 flex items-center justify-center gap-6">
        <p className="text-white/50 text-xs">
          Tip: aktifkan tombol <span className="text-amber-400 font-bold">100%</span> lalu screenshot area poster, atau pakai
          <span className="text-amber-400 font-bold"> headless Chrome </span>
          untuk render full-resolution PNG.
        </p>
      </div>
    </div>
  );
}
