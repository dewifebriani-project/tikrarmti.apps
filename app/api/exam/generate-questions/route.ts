import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { JuzNumber } from '@/types/exam';

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
    const { juz_number, section_number, question_count } = body;

    // Validate inputs
    if (![28, 29, 30].includes(juz_number)) {
      return NextResponse.json(
        { error: 'Invalid juz_number. Must be 28, 29, or 30.' },
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

    // Get current max question number for this juz and section
    const supabase = createClient();
    const { data: existingQuestions } = await supabase
      .from('exam_questions')
      .select('question_number')
      .eq('juz_number', juz_number)
      .eq('section_number', section_number)
      .order('question_number', { ascending: false })
      .limit(1);

    const nextQuestionNumber = (existingQuestions && existingQuestions[0]?.question_number || 0) + 1;

    // Generate prompt for AI
    const questionTypeInfo = QUESTION_TYPE_CONFIG[section_number];
    const prompt = `Buat ${question_count} soal pilihan ganda tentang ${questionTypeInfo.name} (${questionTypeInfo.description}) untuk Juz ${juz_number}.

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
- Pastikan soal sesuai dengan konteks Juz ${juz_number}
- Berikan soal yang bervariasi dan tidak monoton
- Bahasa: Indonesia

Output HANYA JSON array tanpa teks lain.`;

    // Call AI API (using OpenAI or similar)
    const aiResponse = await callAIAPI(prompt);

    if (!aiResponse || !Array.isArray(aiResponse)) {
      return NextResponse.json(
        { error: 'Failed to generate valid questions from AI' },
        { status: 500 }
      );
    }

    // Prepare questions for database insertion
    const questionsToInsert = aiResponse.map((q: any, index: number) => {
      const sectionTitle = questionTypeInfo.name;

      return {
        juz_number,
        section_number,
        section_title: sectionTitle,
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

// Function to call AI API
async function callAIAPI(prompt: string): Promise<any> {
  // Check if OpenAI API key is configured
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Islamic education assistant who creates high-quality multiple-choice questions about Quran memorization. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from AI');
  }

  // Parse JSON response
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse AI response as JSON');
  }
}
