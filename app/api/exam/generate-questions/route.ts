import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const QUESTION_TYPE_CONFIG: Record<number, { name: string; description: string }> = {
  1: { name: 'Tebak Nama Surat', description: 'Pertanyaan tentang nama-nama surat dalam juz' },
  2: { name: 'Tebak Ayat', description: 'Pertanyaan tentang nomor ayat' },
  3: { name: 'Sambung Surat', description: 'Pertanyaan menyambung ayat' },
  4: { name: 'Tebak Awal Ayat', description: 'Pertanyaan tentang awal ayat' },
  5: { name: 'Ayat Mutasyabihat', description: 'Pertanyaan tentang ayat-ayat serupa' },
  6: { name: 'Pengenalan Surat', description: 'Pertanyaan pengenalan surat' },
  7: { name: 'Tebak Halaman', description: 'Pertanyaan nomor halaman' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { juz_code, section_number, question_count } = body;

    // Validate juz_code format (e.g., "30A", "28B")
    const juzCodePattern = /^[0-9]+[AB]$/;
    if (!juz_code || !juzCodePattern.test(juz_code)) {
      return NextResponse.json(
        { error: 'Invalid juz_code. Must be in format like 30A, 28B, etc.' },
        { status: 400 }
      );
    }

    if (!section_number || section_number < 1 || section_number > 7) {
      return NextResponse.json(
        { error: 'Invalid section_number. Must be between 1 and 7.' },
        { status: 400 }
      );
    }

    if (!question_count || question_count < 1 || question_count > 20) {
      return NextResponse.json(
        { error: 'Invalid question_count. Must be between 1 and 20.' },
        { status: 400 }
      );
    }

    // Get juz info from database
    const supabase = createClient();
    const { data: juzData } = await supabase
      .from('juz_options')
      .select('*')
      .eq('code', juz_code)
      .single();

    if (!juzData) {
      return NextResponse.json(
        { error: 'Invalid juz_code. Juz option not found in database.' },
        { status: 400 }
      );
    }

    // Get current max question number for this juz and section
    const { data: existingQuestions } = await supabase
      .from('exam_questions')
      .select('question_number')
      .eq('juz_number', juzData.juz_number)
      .eq('section_number', section_number)
      .order('question_number', { ascending: false })
      .limit(1);

    const nextQuestionNumber = (existingQuestions && existingQuestions[0]?.question_number || 0) + 1;

    // Generate prompt for AI
    const questionTypeInfo = QUESTION_TYPE_CONFIG[section_number];
    const prompt = `Buat ${question_count} soal pilihan ganda tentang ${questionTypeInfo.name} (${questionTypeInfo.description}) untuk ${juzData.name} (${juzData.name}, halaman ${juzData.start_page}-${juzData.end_page}).

Format output HARUS JSON array dengan struktur:
[
  {
    "question_text": "teks pertanyaan",
    "question_type": "multiple_choice",
    "options": [
      {"option_text": "pilihan A", "is_correct": false},
      {"option_text": "pilihan B", "is_correct": true},
      {"option_text": "pilihan C", "is_correct": false},
      {"option_text": "pilihan D", "is_correct": false}
    ],
    "points": 1
  }
]

PENTING:
- Jawaban yang benar harus ditandai dengan "is_correct": true
- Hanya satu jawaban yang benar untuk setiap soal
- Pastikan soal sesuai dengan konteks ${juzData.name}
- Berikan soal yang bervariasi dan tidak monoton
- Bahasa: Indonesia

Output HANYA JSON array tanpa teks lain.`;

    // Call Google Generative AI API
    const aiResponse = await callGenerativeAI(prompt);

    if (!aiResponse || !Array.isArray(aiResponse)) {
      return NextResponse.json(
        { error: 'Failed to generate valid questions from AI' },
        { status: 500 }
      );
    }

    // Prepare questions for database insertion
    const questionsToInsert = aiResponse.map((q: any, index: number) => {
      return {
        juz_number: juzData.juz_number,
        section_number,
        section_title: questionTypeInfo.name,
        question_number: nextQuestionNumber + index,
        question_text: q.question_text,
        question_type: q.question_type || 'multiple_choice',
        options: q.options || [],
        points: q.points || 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // Insert questions into database
    const { data: insertedQuestions, error: insertError } = await supabase
      .from('exam_questions')
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting questions:', insertError);
      return NextResponse.json(
        { error: 'Failed to save questions to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: insertedQuestions,
      message: `Successfully generated and saved ${question_count} questions`,
    });

  } catch (error) {
    console.error('Error in generate-questions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to call Google Generative AI API
async function callGenerativeAI(prompt: string): Promise<any> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Google AI API key is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error('Empty response from AI');
  }

  // Parse JSON response
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (parseError) {
    console.error('Failed to parse AI response:', text);
    throw new Error('Failed to parse AI response as JSON');
  }
}
