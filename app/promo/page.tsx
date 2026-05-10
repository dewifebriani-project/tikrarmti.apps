'use client';

import Link from 'next/link';
import { POSTERS } from '@/components/promo/posters/registry';
import { ExternalLink, Camera } from 'lucide-react';

export default function PromoIndexPage() {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F4F1EB]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-emerald-700 text-[10px] font-extrabold tracking-[0.3em] uppercase">
              Promo Asset Studio
            </p>
            <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
              Galeri Poster Promosi MTI
            </h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Camera className="w-4 h-4" />
            Klik poster untuk preview ukuran 1080×1080 (siap di-screenshot)
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSTERS.map((poster) => {
            const Poster = poster.Component;
            const SCALE = 0.38; // ~ 410px wide
            return (
              <Link
                key={poster.slug}
                href={`/promo/${poster.slug}`}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200 hover:-translate-y-1 hover:border-emerald-300"
              >
                <div
                  className="relative bg-slate-100 overflow-hidden"
                  style={{ width: '100%', aspectRatio: '1 / 1' }}
                >
                  <div
                    className="absolute top-0 left-0"
                    style={{
                      width: 1080,
                      height: 1080,
                      transform: `scale(${SCALE})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <Poster />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-extrabold text-emerald-950 leading-snug">
                        {poster.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{poster.desc}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition flex-shrink-0 mt-1" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold tracking-wider uppercase">
                      1080 × 1080
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider uppercase ${
                        poster.accent === 'dark'
                          ? 'bg-emerald-900 text-amber-300'
                          : poster.accent === 'gold'
                          ? 'bg-amber-100 text-amber-800'
                          : poster.accent === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {poster.accent}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-white border border-slate-200">
          <h2 className="text-base font-extrabold text-emerald-950 mb-2">Cara ekspor ke PNG</h2>
          <ol className="text-sm text-slate-600 space-y-1.5 list-decimal list-inside">
            <li>Klik poster yang dipilih untuk membuka view 1080×1080.</li>
            <li>Tombol &ldquo;Salin sebagai PNG&rdquo; di sudut akan menyimpan langsung ke clipboard.</li>
            <li>Atau screenshot manual: pilih area 1080×1080 (zoom browser 100%).</li>
            <li>Untuk hasil terbaik, gunakan headless Chrome / Puppeteer untuk render full-resolution.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
