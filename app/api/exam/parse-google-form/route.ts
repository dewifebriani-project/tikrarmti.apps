// API Route: /api/exam/parse-google-form
// Parse Google Form text into structured exam questions using pattern matching

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
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const sections: any[] = [];
  let currentSection: any = null;
  let currentQuestion: any = null;
  let currentOptions: any[] = [];
  let questionCounter = 0;

  // Common section titles
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a section title
    const matchedSection = Object.keys(sectionTitles).find(title =>
      line.includes(title) || line.toLowerCase().includes(title.toLowerCase())
    );

    if (matchedSection) {
      // Save previous question if exists
      if (currentQuestion && currentOptions.length > 0) {
        currentQuestion.options = currentOptions;
        currentSection.questions.push(currentQuestion);
        currentOptions = [];
      }

      // Start new section
      currentSection = {
        section_number: sectionTitles[matchedSection],
        section_title: matchedSection,
        questions: []
      };
      sections.push(currentSection);
      questionCounter = 0;
      continue;
    }

    // Check if this line looks like a question (contains Arabic or question mark or starts with number)
    const isArabic = /[\u0600-\u06FF]/.test(line);
    const isQuestion = line.includes('?') || line.endsWith('surat') || isArabic;

    // Check if line is an option (short text, not Arabic, not question)
    const isOption = !isArabic && !line.includes('?') && line.length < 100 && line.length > 2;

    if (currentSection) {
      if (isQuestion) {
        // Save previous question if exists
        if (currentQuestion && currentOptions.length > 0) {
          currentQuestion.options = currentOptions;
          currentSection.questions.push(currentQuestion);
        }

        // Start new question
        questionCounter++;
        currentQuestion = {
          question_number: questionCounter,
          question_text: line,
          question_type: currentSection.section_number === 1 ? 'introduction' : 'multiple_choice',
          points: currentSection.section_number === 1 ? 0 : 1
        };
        currentOptions = [];

        // For introduction section, add the option immediately
        if (currentSection.section_number === 1) {
          currentQuestion.options = [{ text: line, isCorrect: true }];
          currentSection.questions.push(currentQuestion);
          currentQuestion = null;
        }

      } else if (isOption && currentQuestion) {
        // Add as option
        // First option is assumed correct (adjust if needed)
        currentOptions.push({
          text: line,
          isCorrect: currentOptions.length === 0
        });
      } else if (isArabic && currentQuestion) {
        // Append Arabic text to current question
        currentQuestion.question_text += '\n' + line;
      }
    }
  }

  // Save last question
  if (currentQuestion && currentOptions.length > 0) {
    currentQuestion.options = currentOptions;
    currentSection.questions.push(currentQuestion);
  }

  return {
    juz_number,
    juz_name: `Juz ${juz_number}`,
    total_questions: sections.reduce((sum, s) => sum + s.questions.length, 0),
    sections
  };
}
