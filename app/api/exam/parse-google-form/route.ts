// API Route: /api/exam/parse-google-form
// Parse Google Form text into structured exam questions using smart pattern matching

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger-secure';
import { JuzNumber } from '@/types/exam';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, juz_number } = body;

    if (!text || !juz_number) {
      return NextResponse.json({ error: 'Missing text or juz_number' }, { status: 400 });
    }

    // Parse the Google Form text
    const parsed = parseGoogleFormText(text, juz_number);

    if (!parsed || parsed.sections.length === 0) {
      return NextResponse.json({ error: 'Failed to parse text. Please check format.' }, { status: 400 });
    }

    logger.info('Google Form text parsed successfully', {
      userId: user.id,
      juzNumber: juz_number,
      sectionsCount: parsed.sections.length,
      totalQuestions: parsed.sections.reduce((sum, s) => sum + s.questions.length, 0)
    });

    return NextResponse.json({
      data: parsed
    }, { status: 200 });

  } catch (error) {
    logger.error('Error in POST /api/exam/parse-google-form', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function parseGoogleFormText(text: string, juz_number: JuzNumber) {
  // Split into lines and clean
  const allLines = text.split('\n').map(line => line.trim());

  // Section titles mapping
  const sectionTitles: Record<string, number> = {
    'Ketentuan Ikhtibar': 1,
    'Tebak Nama Surat': 2,
    'Tebak Ayat': 3,
    'Sambung Surat': 4,
    'Tebak Awal Ayat': 5,
    'Ayat Mutasyabihat': 6,
    'Pengenalan Surat': 7,
    'Tebak Halaman': 8,
  };

  // Find section boundaries
  const sectionStarts: Array<{ line: number; title: string; number: number }> = [];

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];

    // Match pattern like "1. Ketentuan Ikhtibar" or just "Ketentuan Ikhtibar"
    for (const [title, number] of Object.entries(sectionTitles)) {
      if (line.includes(title)) {
        sectionStarts.push({ line: i, title, number });
        break;
      }
    }
  }

  // Parse each section
  const sections: any[] = [];

  for (let sIdx = 0; sIdx < sectionStarts.length; sIdx++) {
    const sectionStart = sectionStarts[sIdx];
    const sectionEnd = sIdx < sectionStarts.length - 1 ? sectionStarts[sIdx + 1].line : allLines.length;

    const sectionLines = allLines.slice(sectionStart.line + 1, sectionEnd);

    // Parse questions in this section
    const questions = parseSectionQuestions(
      sectionLines,
      sectionStart.title,
      sectionStart.number
    );

    sections.push({
      section_number: sectionStart.number,
      section_title: sectionStart.title,
      questions
    });
  }

  return {
    juz_number,
    juz_name: `Juz ${juz_number}`,
    total_questions: sections.reduce((sum, s) => sum + s.questions.length, 0),
    sections
  };
}

function parseSectionQuestions(lines: string[], sectionTitle: string, sectionNumber: number) {
  const questions: any[] = [];
  let i = 0;
  let questionNumber = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line || line.length < 2) {
      i++;
      continue;
    }

    // Check if this line contains Arabic or looks like a question
    const hasArabic = /[\u0600-\u06FF]/.test(line);
    const isLongLine = line.length > 50;
    const hasQuestionIndicator = line.includes('?') ||
                                   line.toLowerCase().includes('surat') ||
                                   line.toLowerCase().includes('ayat') ||
                                   line.toLowerCase().includes('halaman');

    if (hasArabic || isLongLine || hasQuestionIndicator) {
      // This is a question
      questionNumber++;
      let questionText = line;
      i++;

      // Collect multi-line question text (especially Arabic)
      while (i < lines.length) {
        const nextLine = lines[i];
        if (!nextLine || nextLine.length < 2) {
          i++;
          continue;
        }

        const nextHasArabic = /[\u0600-\u06FF]/.test(nextLine);
        const nextIsLongLine = nextLine.length > 50;

        // If next line has Arabic or is part of question, append it
        if (nextHasArabic && !nextLine.match(/^[A-Z]/)) {
          questionText += '\n' + nextLine;
          i++;
        } else if (nextIsLongLine && nextLine.includes('surat')) {
          questionText += '\n' + nextLine;
          i++;
        } else {
          break;
        }
      }

      // Now collect options (for multiple choice questions)
      const options: Array<{ text: string; isCorrect: boolean }> = [];

      if (sectionNumber === 1) {
        // Introduction section - just use the question text as the only option
        questions.push({
          question_number: questionNumber,
          question_text: questionText,
          question_type: 'introduction',
          options: [{ text: questionText, isCorrect: true }],
          points: 0
        });
      } else {
        // Multiple choice - collect 4 options
        while (i < lines.length && options.length < 4) {
          const optLine = lines[i];

          if (!optLine || optLine.length < 2) {
            i++;
            continue;
          }

          const optHasArabic = /[\u0600-\u06FF]/.test(optLine);
          const optIsShort = optLine.length < 80;
          const optLooksLikeOption = !optLine.includes('?') &&
                                      !optLine.toLowerCase().includes('bismillah') &&
                                      optIsShort;

          // Stop if we hit another question or section
          if (optHasArabic || optLine.length > 100) {
            break;
          }

          if (optLooksLikeOption) {
            // Add this as an option
            // First option is marked as correct by default (you can change this)
            options.push({
              text: optLine,
              isCorrect: options.length === 0
            });
            i++;
          } else {
            break;
          }
        }

        // Only add question if we have at least 2 options
        if (options.length >= 2) {
          questions.push({
            question_number: questionNumber,
            question_text: questionText,
            question_type: 'multiple_choice',
            options,
            points: 1
          });
        } else {
          // Not enough options, skip this question
          questionNumber--;
        }
      }
    } else {
      // Not a question, skip
      i++;
    }
  }

  return questions;
}
