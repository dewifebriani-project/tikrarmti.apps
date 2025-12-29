import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Test: Try to insert a simple record
    const testData = {
      juz_number: 30,
      section_number: 1,
      section_title: 'Test',
      question_number: 999,
      question_text: 'Test question',
      question_type: 'multiple_choice',
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
      correct_answer: 'A',
      points: 1,
      is_active: true,
      created_by: user.id
    };

    const { data: newQuestion, error: insertError } = await supabaseAdmin
      .from('exam_questions')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({
        error: 'Insert failed',
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        body_received: body
      }, { status: 500 });
    }

    // Delete the test record
    await supabaseAdmin
      .from('exam_questions')
      .delete()
      .eq('id', newQuestion.id);

    return NextResponse.json({
      success: true,
      message: 'Test insert successful',
      test_record: newQuestion
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Exception',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
