import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Amiri } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Promo Poster - Tikrar MTI',
  description: 'Galeri poster promosi Markaz Tikrar Indonesia',
};

export default function PromoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jakarta.variable} ${amiri.variable}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
      {children}
    </div>
  );
}
