// Exam System Utility Functions
// Helper functions for determining required exam juz and eligibility

import { JuzNumber } from '@/types/exam';

/**
 * Determine which juz exam is required based on chosen juz
 *
 * Logic:
 * - Juz 30A/B → No exam required (null)
 * - Juz 29A/B → Must take Juz 30 exam
 * - Juz 28A/B → Must take Juz 29 exam
 * - Juz 1A/B → Must take Juz 30 exam
 * - Other juz → No exam required (null)
 */
export function getRequiredExamJuz(chosenJuz: string): JuzNumber | null {
  if (!chosenJuz) return null;

  // Extract juz number from format like "30A", "29B", etc.
  const juzNumber = parseInt(chosenJuz.match(/\d+/)?.[0] || '0');

  switch (juzNumber) {
    case 30:
      return null; // No exam required
    case 29:
      return 30; // Must take Juz 30 exam
    case 28:
      return 29; // Must take Juz 29 exam
    case 1:
      return 30; // Must take Juz 30 exam
    default:
      return null; // No exam required for other juz
  }
}

/**
 * Get exam title based on juz number
 */
export function getExamTitle(juzNumber: JuzNumber): string {
  return `Ikhtibar Juz ${juzNumber}`;
}

/**
 * Get exam description
 */
export function getExamDescription(juzNumber: JuzNumber): string {
  return `Ujian muroja'ah Juz ${juzNumber} - 100 soal pilihan ganda`;
}

/**
 * Check if exam is required for a chosen juz
 */
export function isExamRequired(chosenJuz: string): boolean {
  return getRequiredExamJuz(chosenJuz) !== null;
}

/**
 * Calculate exam score (percentage)
 */
export function calculateScore(correctAnswers: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
}

/**
 * Determine if exam is passed (can be customized)
 * Default: 60% passing grade
 */
export function isExamPassed(score: number, passingGrade: number = 60): boolean {
  return score >= passingGrade;
}

/**
 * Get score grade letter
 */
export function getScoreGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'E';
}

/**
 * Get score color for UI
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get score background color for UI
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 70) return 'bg-blue-50 border-blue-200';
  if (score >= 60) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

/**
 * Format time elapsed (seconds to readable format)
 */
export function formatTimeElapsed(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  } else if (minutes > 0) {
    return `${minutes} menit ${secs} detik`;
  } else {
    return `${secs} detik`;
  }
}

/**
 * Shuffle array (for randomizing questions/options if needed)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Validate exam answers before submission
 */
export function validateExamAnswers(
  answers: Map<string, string>,
  totalQuestions: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (answers.size === 0) {
    errors.push('Belum ada jawaban yang diisi');
  }

  if (answers.size < totalQuestions) {
    const unanswered = totalQuestions - answers.size;
    errors.push(`Masih ada ${unanswered} soal yang belum dijawab`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get section titles (based on Juz 30 example)
 */
export const EXAM_SECTIONS = {
  1: 'Ketentuan Ikhtibar',
  2: 'Tebak Nama Surat',
  3: 'Tebak Ayat',
  4: 'Sambung Surat',
  5: 'Tebak Awal Ayat',
  6: 'Ayat Mutasyabihat',
  7: 'Pengenalan Surat',
  8: 'Tebak Halaman',
} as const;

/**
 * Get exam instructions
 */
export function getExamInstructions(juzNumber: JuzNumber): string {
  return `
Bismillah...

Apakah *Ukhti* siap mengerjakan soal muroja'ah Juz ${juzNumber} dengan jujur karena Allah, tanpa melihat Al-Qur'an, HP, Google, atau bertanya kepada teman, saudara, Mama, Papa, ChatGPT, Gemini, Siri, atau siapapun yang dapat membuat hasil ujian ini menjadi tidak valid?

**Kisi-Kisi Soal:**
- Urutan surat
- Awal dan akhir surat
- Ayat-ayat mutasyabihat
- Tebak ayat
- Tebak surat
- Sambung ayat
- Tebak halaman

Tafaddhol, silakan muroja'ah terlebih dahulu..

Kami serahkan persaksian kejujuran menjawab soal-soal ini kepada Allah Asy-Syahid yang Maha Menyaksikan.

Semoga Allah mudahkan, Baarakallahu Fiikunn

**"Tak ada gading yang tak retak."**

Jika *Ukhti* menemukan kesalahan dalam kunci jawaban atau pengetikan, silakan gunakan tombol **Flag** pada soal yang bermasalah.

🚩 **TANBIH**

Protes kesalahan kunci jawaban hanya jika *Ukhti* punya bukti Screenshot saja, setelah selesai submit dan cek Al Quran.

Mohon maaf kami tidak melayani protes saat mengerjakan soal atau setelah mengerjakan soal tanpa bukti kesalahan kami.
  `.trim();
}
