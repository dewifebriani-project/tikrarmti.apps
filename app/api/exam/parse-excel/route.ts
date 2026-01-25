// API Route: /api/exam/parse-excel
// Parse Excel/CSV file into structured exam questions

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger-secure';
import { JuzNumber } from '@/types/exam';
import * as xlsx from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const juz_number = parseInt(formData.get('juz_number') as string);

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!juz_number || ![28, 29, 30].includes(juz_number)) {
      return NextResponse.json({ error: 'Invalid juz_number' }, { status: 400 });
    }

    // Read file
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (!rawData || rawData.length < 2) {
      return NextResponse.json({ error: 'File is empty or invalid format' }, { status: 400 });
    }

    // Parse Excel data
    const parsed = parseExcelData(rawData, juz_number as JuzNumber);

    if (!parsed || parsed.sections.length === 0) {
      return NextResponse.json({ error: 'Failed to parse Excel. Please check format.' }, { status: 400 });
    }

    logger.info('Excel file parsed successfully', {
      userId: user.id,
      juzNumber: juz_number,
      sectionsCount: parsed.sections.length,
      totalQuestions: parsed.sections.reduce((sum, s) => sum + s.questions.length, 0)
    });

    return NextResponse.json({
      data: parsed
    }, { status: 200 });

  } catch (error) {
    logger.error('Error in POST /api/exam/parse-excel', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
}

function parseExcelData(rows: any[][], juz_number: JuzNumber) {
  // Expected Excel format:
  // Row 1: Headers (optional, will be skipped if it contains "section" or "question")
  // Columns: Section | Section Title | Question Number | Question Text | Question Type | Option 1 | Option 2 | Option 3 | Option 4 | Correct Answer | Points

  const sectionsMap = new Map<number, {
    section_number: number;
    section_title: string;
    questions: any[];
  }>();

  // Start from row 1 (skip header if exists)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    if (!row || row.length < 4) continue; // Skip empty rows

    const sectionNum = parseInt(row[0]) || 0;
    const sectionTitle = String(row[1] || '').trim();
    const questionNumber = parseInt(row[2]) || 0;
    const questionText = String(row[3] || '').trim();
    const questionType = String(row[4] || 'multiple_choice').trim();
    const option1 = String(row[5] || '').trim();
    const option2 = String(row[6] || '').trim();
    const option3 = String(row[7] || '').trim();
    const option4 = String(row[8] || '').trim();
    const correctAnswer = String(row[9] || '1').trim();
    const points = parseInt(row[10]) || 1;

    // Skip section 1 (it's default for all juz)
    if (sectionNum === 1) continue;

    // Skip if missing required fields
    if (!sectionNum || !questionText) continue;

    // Build options array
    const options: Array<{ text: string; isCorrect: boolean }> = [];
    if (questionType === 'multiple_choice') {
      if (option1) options.push({ text: option1, isCorrect: correctAnswer === '1' || correctAnswer.toLowerCase() === 'a' });
      if (option2) options.push({ text: option2, isCorrect: correctAnswer === '2' || correctAnswer.toLowerCase() === 'b' });
      if (option3) options.push({ text: option3, isCorrect: correctAnswer === '3' || correctAnswer.toLowerCase() === 'c' });
      if (option4) options.push({ text: option4, isCorrect: correctAnswer === '4' || correctAnswer.toLowerCase() === 'd' });
    } else if (questionType === 'introduction') {
      options.push({ text: questionText, isCorrect: true });
    }

    // Get or create section
    if (!sectionsMap.has(sectionNum)) {
      sectionsMap.set(sectionNum, {
        section_number: sectionNum,
        section_title: sectionTitle || `Section ${sectionNum}`,
        questions: []
      });
    }

    const section = sectionsMap.get(sectionNum)!;

    // Add question
    section.questions.push({
      question_number: questionNumber,
      question_text: questionText,
      question_type: questionType,
      options,
      points
    });
  }

  // Convert map to array
  const sections = Array.from(sectionsMap.values())
    .sort((a, b) => a.section_number - b.section_number);

  return {
    juz_number,
    juz_name: `Juz ${juz_number}`,
    total_questions: sections.reduce((sum, s) => sum + s.questions.length, 0),
    sections
  };
}
