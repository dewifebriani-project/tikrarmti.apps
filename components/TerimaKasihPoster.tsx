'use client';

import { forwardRef } from 'react';

interface TerimaKasihPosterProps {
  ustadzahName: string;
}

const FooterIcon = ({ type }: { type: 'link' | 'web' | 'phone' }) => (
  <span style={{ width: 39, height: 39, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, background: '#08b970', color: '#fff', fontSize: 22, fontWeight: 900 }}>
    {type === 'link' ? '↗' : type === 'web' ? '◎' : '●'}
  </span>
);

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
          color: '#151515',
          fontFamily: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif"
        }}
      >
        {/* Aesthetic Background Elements */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,1) 0%, rgba(251,248,241,1) 60%, rgba(240,230,210,1) 100%)' }} />
        
        {/* Corner Decors (simulated with CSS) */}
        <div style={{ position: 'absolute', top: 30, left: 30, width: 200, height: 200, borderTop: '4px solid #0d4a30', borderLeft: '4px solid #0d4a30', borderRadius: '40px 0 0 0', opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: 30, right: 30, width: 200, height: 200, borderTop: '4px solid #0d4a30', borderRight: '4px solid #0d4a30', borderRadius: '0 40px 0 0', opacity: 0.5 }} />
        <div style={{ position: 'absolute', bottom: 108, left: 30, width: 200, height: 200, borderBottom: '4px solid #0d4a30', borderLeft: '4px solid #0d4a30', borderRadius: '0 0 0 40px', opacity: 0.5 }} />
        <div style={{ position: 'absolute', bottom: 108, right: 30, width: 200, height: 200, borderBottom: '4px solid #0d4a30', borderRight: '4px solid #0d4a30', borderRadius: '0 0 40px 0', opacity: 0.5 }} />

        {/* Logo */}
        <div style={{ position: 'absolute', top: 60, right: 60, width: 140, height: 140, padding: 10, borderRadius: 24, background: 'rgba(255,255,255,.9)', boxShadow: '0 10px 30px rgba(51,38,17,.1)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Markaz Tikrar Indonesia" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 16 }} />
        </div>

        <main style={{ position: 'relative', zIndex: 2, padding: '160px 80px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <h1 style={{ margin: '0 0 10px', color: '#0d4a30', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 80, lineHeight: 1.1, fontWeight: 700, letterSpacing: -1, textAlign: 'center' }}>
            Terima Kasih Ustadzah
          </h1>
          <h2 style={{ margin: '0 0 80px', color: '#c09033', fontFamily: "'Brush Script MT', 'Dancing Script', cursive, serif", fontSize: 60, fontWeight: 400, textAlign: 'center' }}>
            Markaz Tikrar Indonesia
          </h2>

          <div style={{ 
            background: 'rgba(240,248,245, 0.7)',
            border: '2px solid #0d4a30',
            borderRadius: '20px',
            padding: '30px 60px',
            marginBottom: '70px',
            fontSize: 45,
            fontWeight: 700,
            color: '#0d4a30',
            fontFamily: "Georgia, 'Times New Roman', serif",
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            minWidth: '700px',
            justifyContent: 'center'
          }}>
            <span>Ustadzah</span>
            <span style={{ borderBottom: '3px solid #0d4a30', paddingBottom: '5px', minWidth: '400px', textAlign: 'center', color: '#151515' }}>
              {ustadzahName || '..............................'}
            </span>
          </div>

          <div style={{ 
            textAlign: 'center', 
            fontFamily: "'Traditional Arabic', 'Amiri', 'Scheherazade', serif", 
            fontSize: 48, 
            lineHeight: 2, 
            color: '#151515',
            marginBottom: '50px',
            padding: '0 40px'
          }}>
            <p style={{ margin: '0 0 30px', fontSize: 52, fontWeight: 'bold' }}>
              جَزَاكِ اللهُ خَيْرًا الْفِرْدَوْس يَا مُعَلِّمَتَنَا الْغَالِيَةَ الْفَاضِلَةَ
            </p>
            <p style={{ margin: 0 }}>
              أَسْأَلُ اللهَ أَنْ يَحْفَظَكِ مِنْ كُلِّ شَرٍّ، وَيُوَفِّقَ قَلْبَكِ، وَيَجْعَلَكِ مِنْ
              أَحَبِّ خَلْقِهِ إِلَيْهِ، وَيَرْزُقَكِ لَذَّةَ النَّظَرِ إِلَى وَجْهِهِ الْكَرِيمِ، وَيُيَسِّرَ
              جَمِيعَ أُمُورِكِ فِي الدُّنْيَا وَالْآخِرَةِ، وَيُنَسِّرَ لَكِ الْجَنَّةَ وَنَعِيمَهَا.
            </p>
          </div>

          <div style={{ 
            textAlign: 'center', 
            fontFamily: "Georgia, 'Times New Roman', serif", 
            fontSize: 32, 
            lineHeight: 1.6, 
            color: '#333',
            fontStyle: 'italic',
            marginBottom: '60px',
            padding: '0 60px'
          }}>
            "Aku memohon kepada Allah agar menjaga dirimu dari segala
            kejahatan, menerangi hatimu, menjadikanmu termasuk
            hamba yang paling dicintai-Nya, menganugerahkan
            kenikmatan memandang wajah-Nya yang Mulia,
            memudahkan segala urusanmu di dunia dan akhirat, serta
            memberimu kabar gembira dengan Surga dan
            kenikmatannya."
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f0e6d2, #d8caaf)',
            padding: '12px 40px',
            borderRadius: '100px',
            border: '2px solid #c09033',
            color: '#0d4a30',
            fontSize: 28,
            fontWeight: 'bold',
            fontFamily: "Georgia, 'Times New Roman', serif"
          }}>
            Aamiin Ya Rabbal 'Alamiin
          </div>

        </main>

        <footer style={{ position: 'absolute', zIndex: 3, left: 0, right: 0, bottom: 0, height: 78, display: 'grid', gridTemplateColumns: '1.28fr 1fr 1fr', alignItems: 'center', padding: '0 27px', color: '#fff', background: 'linear-gradient(90deg, #57bd75 0%, #128956 58%, #006c47 100%)', boxShadow: '0 -5px 20px rgba(18,88,52,.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 21, fontFamily: 'Georgia, serif', fontWeight: 700 }}><FooterIcon type="link" />lynk.id/markaztikrar.id</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, fontSize: 20, fontFamily: 'Georgia, serif', fontWeight: 700 }}><FooterIcon type="web" />markaztikrar.id</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 11, fontSize: 21, fontFamily: 'Georgia, serif', fontWeight: 700 }}><FooterIcon type="phone" />0813-3000-0784</div>
        </footer>
      </div>
    );
  }
);

TerimaKasihPoster.displayName = 'TerimaKasihPoster';
