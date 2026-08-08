'use client';

import { forwardRef } from 'react';
import { formatTimeShort, HalaqahForReminder } from '@/lib/reminder-generator';

interface JadwalPosterProps {
  halaqahs: HalaqahForReminder[];
  dayName: string;
  dayNum: number;
}

// Per-day color themes
const THEMES: Record<number, {
  bg: string; primary: string; gold: string; rowAlt: string; footerBg: string;
}> = {
  1: { bg: '#f5f2ea', primary: '#1a5232', gold: '#c9a84c', rowAlt: '#fdf8ea', footerBg: '#1a5232' },
  2: { bg: '#eef3fb', primary: '#1a3464', gold: '#7ca3d8', rowAlt: '#e8f0ff', footerBg: '#1a3464' },
  3: { bg: '#fdf5f2', primary: '#7c1d1d', gold: '#c9a84c', rowAlt: '#fff0ee', footerBg: '#7c1d1d' },
  4: { bg: '#faf4ff', primary: '#5b21b6', gold: '#c084fc', rowAlt: '#f5edff', footerBg: '#5b21b6' },
  5: { bg: '#f0fdf8', primary: '#0d5f52', gold: '#d4a017', rowAlt: '#e8fff9', footerBg: '#0d5f52' },
  6: { bg: '#fff1f4', primary: '#9f1239', gold: '#f9a8c0', rowAlt: '#fff0f3', footerBg: '#9f1239' },
  7: { bg: '#fffbeb', primary: '#92400e', gold: '#f59e0b', rowAlt: '#fff8e1', footerBg: '#92400e' },
};

const DAY_LABELS: Record<number, string> = {
  1: 'SENIN', 2: 'SELASA', 3: 'RABU', 4: 'KAMIS', 5: 'JUMAT', 6: 'SABTU', 7: 'AHAD',
};

/** White Islamic arabesque floral corner ornament (top-right) */
const ArabesqueCorner = () => (
  <svg
    viewBox="0 0 420 420"
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', top: 0, right: 0, width: 420, height: 420 }}
  >
    {/* Large outer fill */}
    <path
      d="M420 0 L420 420 Q300 380 220 300 Q150 220 120 120 Q200 80 300 40 Z"
      fill="white" opacity="0.55"
    />
    {/* Inner layer */}
    <path
      d="M420 0 L420 300 Q340 330 270 270 Q210 210 200 130 Q280 80 380 20 Z"
      fill="white" opacity="0.45"
    />
    {/* Innermost petal */}
    <path
      d="M420 0 L420 180 Q370 220 310 200 Q270 160 280 100 Q340 60 420 0 Z"
      fill="white" opacity="0.35"
    />

    {/* Floral star shapes */}
    {/* Big flower near top-right */}
    <g transform="translate(340, 60)">
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a, i) => {
        const r = 36;
        const rx = Math.cos(a * Math.PI / 180) * r;
        const ry = Math.sin(a * Math.PI / 180) * r;
        return (
          <ellipse
            key={i}
            cx={rx} cy={ry}
            rx={10} ry={20}
            transform={`rotate(${a} ${rx} ${ry})`}
            fill="white" opacity="0.5"
          />
        );
      })}
      <circle cx={0} cy={0} r={12} fill="white" opacity="0.8" />
    </g>

    {/* Medium flower */}
    <g transform="translate(250, 20)">
      {[0,45,90,135,180,225,270,315].map((a, i) => {
        const r = 22;
        const rx = Math.cos(a * Math.PI / 180) * r;
        const ry = Math.sin(a * Math.PI / 180) * r;
        return (
          <ellipse key={i} cx={rx} cy={ry} rx={7} ry={14}
            transform={`rotate(${a} ${rx} ${ry})`}
            fill="white" opacity="0.45"
          />
        );
      })}
      <circle cx={0} cy={0} r={8} fill="white" opacity="0.7" />
    </g>

    {/* Small flower */}
    <g transform="translate(400, 160)">
      {[0,60,120,180,240,300].map((a, i) => {
        const r = 16;
        const rx = Math.cos(a * Math.PI / 180) * r;
        const ry = Math.sin(a * Math.PI / 180) * r;
        return (
          <ellipse key={i} cx={rx} cy={ry} rx={6} ry={12}
            transform={`rotate(${a} ${rx} ${ry})`}
            fill="white" opacity="0.4"
          />
        );
      })}
      <circle cx={0} cy={0} r={6} fill="white" opacity="0.6" />
    </g>

    {/* Curving vine lines */}
    <path d="M420 30 Q380 80 340 140 Q300 200 260 240" stroke="white" strokeWidth="6" fill="none" opacity="0.3" strokeLinecap="round"/>
    <path d="M380 0 Q360 50 320 100 Q290 140 270 180" stroke="white" strokeWidth="4" fill="none" opacity="0.25" strokeLinecap="round"/>
    <path d="M420 100 Q390 140 360 180 Q330 210 310 250" stroke="white" strokeWidth="3" fill="none" opacity="0.2" strokeLinecap="round"/>

    {/* Small circle accents */}
    <circle cx={300} cy={40} r={5} fill="white" opacity="0.5" />
    <circle cx={390} cy={110} r={4} fill="white" opacity="0.4" />
    <circle cx={270} cy={100} r={3} fill="white" opacity="0.4" />
    <circle cx={360} cy={200} r={4} fill="white" opacity="0.35" />
    <circle cx={230} cy={170} r={3} fill="white" opacity="0.3" />
  </svg>
);

/** Octagonal badge for calendar icon */
const OctaBadge = ({ primary, gold }: { primary: string; gold: string }) => (
  <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
    {/* Outer gold ring (rotated square) */}
    <div style={{
      position: 'absolute', inset: 0,
      background: gold,
      clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    }} />
    {/* Inner primary octagon */}
    <div style={{
      position: 'absolute', inset: 6,
      background: primary,
      clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Calendar SVG icon */}
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 40, height: 40 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="14" x2="10" y2="14" />
        <line x1="12" y1="14" x2="16" y2="14" />
      </svg>
    </div>
  </div>
);

export const JadwalPoster = forwardRef<HTMLDivElement, JadwalPosterProps>(
  ({ halaqahs, dayName, dayNum }, ref) => {
    const t = THEMES[dayNum] || THEMES[1];

    // Build Mon–Fri dates for current week
    const now = new Date();
    const jsDay = now.getDay(); // 0=Sun..6=Sat
    const todayNum = jsDay === 0 ? 7 : jsDay; // 1=Mon..7=Sun

    const getWeekDate = (targetNum: number) => {
      const d = new Date(now);
      d.setDate(now.getDate() + (targetNum - todayNum));
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const displayDays = [1, 2, 3, 4, 5];
    const MIN_ROWS = 10;
    const emptyCount = Math.max(0, MIN_ROWS - halaqahs.length);

    const s = {
      root: {
        width: 1080,
        minHeight: 1530,
        backgroundColor: t.bg,
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        display: 'flex' as const,
        flexDirection: 'column' as const,
        position: 'relative' as const,
        overflow: 'hidden' as const,
      },
      headerRow: {
        display: 'flex' as const,
        alignItems: 'flex-start',
        padding: '56px 72px 0 72px',
        gap: 0,
        position: 'relative' as const,
        zIndex: 2,
      },
      logoBox: {
        width: 160,
        height: 160,
        flexShrink: 0,
        backgroundColor: 'white',
        borderRadius: 24,
        border: `3px solid ${t.gold}`,
        padding: 10,
        display: 'flex' as const,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        position: 'relative' as const,
      },
      titleBlock: {
        flex: 1,
        paddingLeft: 40,
        paddingTop: 0,
        display: 'flex' as const,
        flexDirection: 'column' as const,
        justifyContent: 'center',
      },
      h1: {
        margin: 0,
        fontSize: 88,
        fontWeight: 900,
        color: t.primary,
        lineHeight: 1.0,
        letterSpacing: -2,
      },
      script: {
        margin: '6px 0 0 0',
        fontSize: 46,
        fontWeight: 600,
        fontStyle: 'italic' as const,
        color: t.gold,
        lineHeight: 1.2,
      },
      goldLine: {
        marginTop: 20,
        height: 4,
        width: 160,
        borderRadius: 99,
        backgroundColor: t.gold,
      },
      badgeWrapper: {
        flexShrink: 0,
        paddingTop: 8,
      },
      dayTabsWrapper: {
        padding: '40px 72px 0 72px',
        position: 'relative' as const,
        zIndex: 2,
      },
      dayTabsCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 14,
        display: 'flex' as const,
        gap: 12,
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        border: `1.5px solid rgba(0,0,0,0.07)`,
      },
      tableSection: {
        padding: '36px 72px 56px 72px',
        flex: 1,
        position: 'relative' as const,
        zIndex: 2,
      },
      tableWrapper: {
        borderRadius: 20,
        overflow: 'hidden' as const,
        border: `3px solid ${t.primary}`,
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      },
      theadRow: {
        display: 'grid' as const,
        gridTemplateColumns: '90px 1fr 1fr 200px',
        backgroundColor: t.primary,
      },
      footer: {
        backgroundColor: t.footerBg,
        padding: '28px 72px',
        display: 'flex' as const,
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative' as const,
        zIndex: 2,
      },
    };

    return (
      <div ref={ref} style={s.root}>
        {/* Arabesque ornament top right */}
        <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 1, pointerEvents: 'none' }}>
          <ArabesqueCorner />
        </div>

        {/* ===== HEADER ===== */}
        <div style={s.headerRow}>
          {/* Logo */}
          <div style={s.logoBox}>
            {/* Decorative dot */}
            <div style={{
              position: 'absolute', top: -10, right: -10,
              width: 22, height: 22, borderRadius: '50%',
              backgroundColor: t.gold, border: '3px solid white',
            }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="MTI"
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 14 }}
            />
          </div>

          {/* Title */}
          <div style={s.titleBlock}>
            <h1 style={s.h1}>Jadwal Halaqah</h1>
            <p style={s.script}>Markaz Tikrar Indonesia</p>
            <div style={s.goldLine} />
          </div>

          {/* Badge */}
          <div style={s.badgeWrapper}>
            <OctaBadge primary={t.primary} gold={t.gold} />
          </div>
        </div>

        {/* ===== DAY TABS ===== */}
        <div style={s.dayTabsWrapper}>
          <div style={s.dayTabsCard}>
            {displayDays.map((d) => {
              const isActive = d === dayNum;
              return (
                <div key={d} style={{
                  flex: 1,
                  borderRadius: 14,
                  padding: '18px 8px',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: isActive ? t.primary : 'white',
                  border: `2px solid ${isActive ? t.primary : 'rgba(0,0,0,0.07)'}`,
                  position: 'relative' as const,
                  boxShadow: isActive ? `0 6px 20px ${t.primary}50` : 'none',
                }}>
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: -14, right: -8,
                      width: 30, height: 30, borderRadius: '50%',
                      backgroundColor: t.gold, border: '3px solid white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <span style={{
                    fontSize: 20, fontWeight: 800, letterSpacing: 0.5,
                    color: isActive ? 'white' : t.primary,
                  }}>
                    {DAY_LABELS[d]}
                  </span>
                  <span style={{
                    fontSize: 16, fontWeight: 500,
                    color: isActive ? 'rgba(255,255,255,0.8)' : '#94a3b8',
                  }}>
                    {getWeekDate(d)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <div style={s.tableSection}>
          <div style={s.tableWrapper}>
            {/* Header */}
            <div style={s.theadRow}>
              {[
                { label: 'NO', align: 'center' as const },
                { label: 'HALAQAH', align: 'left' as const },
                { label: 'NAMA USTADZAH', align: 'left' as const },
                { label: 'WAKTU (WIB)', align: 'center' as const },
              ].map((col, i) => (
                <div key={i} style={{
                  padding: '26px 28px',
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: 1,
                  textAlign: col.align,
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                }}>
                  {col.label}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {halaqahs.map((halaqah, index) => {
              const bg = index % 2 === 0 ? 'white' : t.rowAlt;
              let label = halaqah.name;
              if ((halaqah as any).class_type === 'pra_tahfidz') {
                label = 'Pra Tikrar Umum';
              } else if ((halaqah as any).class_type === 'tikrar_tahfidz') {
                label = `Tikrar Juz ${halaqah.preferred_juz || '-'}`;
              }
              const borderColor = 'rgba(0,0,0,0.06)';
              return (
                <div key={halaqah.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr 1fr 200px',
                  backgroundColor: bg,
                  borderTop: `1px solid ${borderColor}`,
                }}>
                  <div style={{ padding: '22px 28px', fontSize: 22, fontWeight: 700, color: t.primary, textAlign: 'center', borderRight: `1px solid ${borderColor}` }}>
                    {index + 1}
                  </div>
                  <div style={{ padding: '22px 28px', fontSize: 20, fontWeight: 600, color: '#1e293b', lineHeight: 1.4, borderRight: `1px solid ${borderColor}` }}>
                    {label}
                  </div>
                  <div style={{ padding: '22px 28px', fontSize: 20, fontWeight: 600, color: '#1e293b', lineHeight: 1.4, borderRight: `1px solid ${borderColor}` }}>
                    {halaqah.muallimah?.full_name || '-'}
                  </div>
                  <div style={{ padding: '22px 28px', fontSize: 22, fontWeight: 800, color: t.primary, textAlign: 'center' }}>
                    {formatTimeShort(halaqah.start_time)}
                  </div>
                </div>
              );
            })}

            {/* Empty filler rows */}
            {Array.from({ length: emptyCount }).map((_, i) => {
              const index = halaqahs.length + i;
              const bg = index % 2 === 0 ? 'white' : t.rowAlt;
              const borderColor = 'rgba(0,0,0,0.06)';
              return (
                <div key={`e-${i}`} style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr 1fr 200px',
                  backgroundColor: bg,
                  borderTop: `1px solid ${borderColor}`,
                  height: 76,
                }}>
                  <div style={{ borderRight: `1px solid ${borderColor}` }} />
                  <div style={{ borderRight: `1px solid ${borderColor}` }} />
                  <div style={{ borderRight: `1px solid ${borderColor}` }} />
                  <div />
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div style={s.footer}>
          {/* Gold top stripe */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: t.gold }} />

          {[
            { icon: 'link', text: 'lynk.id/markaztikrar.id' },
            { icon: 'globe', text: 'markaztikrar.id' },
            { icon: 'phone', text: '0813-3000-0784' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.12)',
                border: `2px solid ${t.gold}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon === 'link' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke={t.gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                )}
                {item.icon === 'globe' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke={t.gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                )}
                {item.icon === 'phone' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke={t.gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012.18 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 20, fontWeight: 500, color: 'white' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

JadwalPoster.displayName = 'JadwalPoster';
