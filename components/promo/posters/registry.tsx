import { PosterHero } from './PosterHero';
import { PosterPendaftaran } from './PosterPendaftaran';
import { PosterTimeline } from './PosterTimeline';
import { PosterFeatures } from './PosterFeatures';
import { PosterMuslimah } from './PosterMuslimah';
import { PosterCTA } from './PosterCTA';

export interface PosterEntry {
  slug: string;
  title: string;
  desc: string;
  Component: React.ComponentType;
  accent: 'dark' | 'light' | 'gold' | 'urgent';
}

export const POSTERS: PosterEntry[] = [
  {
    slug: 'hero',
    title: 'Hero — Hafal Al-Qur\'an Lebih Terukur',
    desc: 'Dark emerald hero, mengikuti style poster referensi MTI.',
    Component: PosterHero,
    accent: 'dark',
  },
  {
    slug: 'pendaftaran',
    title: 'Pendaftaran Dibuka',
    desc: 'Minimalist white dengan 3 feature cards.',
    Component: PosterPendaftaran,
    accent: 'light',
  },
  {
    slug: 'timeline',
    title: '14 Pekan Menuju Syahadah',
    desc: 'Infografis timeline 5 fase pembelajaran.',
    Component: PosterTimeline,
    accent: 'light',
  },
  {
    slug: 'features',
    title: 'Fitur Unggulan Tikrar MTI',
    desc: '4 feature cards 2×2 (Real-time, Jurnal, Evaluasi, Modern UI).',
    Component: PosterFeatures,
    accent: 'light',
  },
  {
    slug: 'muslimah',
    title: 'Khusus Muslimah',
    desc: 'Floral motif dengan kutipan hadits Bukhari.',
    Component: PosterMuslimah,
    accent: 'gold',
  },
  {
    slug: 'cta-urgency',
    title: 'Daftar Sekarang (Urgency)',
    desc: 'Kuota tersisa 25/100, dark + red glow.',
    Component: PosterCTA,
    accent: 'urgent',
  },
];

export function getPosterBySlug(slug: string) {
  return POSTERS.find((p) => p.slug === slug);
}
