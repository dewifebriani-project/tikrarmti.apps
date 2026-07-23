import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const supabaseAdmin = createSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userAnswers = body.answers || {}; // { question_id: "selected text" }

    // Fetch all active questions
    const { data: questions, error: fetchError } = await supabaseAdmin
      .from('akad_quiz_questions')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch questions', details: fetchError }, { status: 500 });
    }

    let totalScore = 0;
    let maxPossibleScore = 0;
    const evaluatedAnswers: any[] = [];

    for (const q of (questions || [])) {
      maxPossibleScore += q.points;
      
      const userAnswerText = userAnswers[q.id];
      const correctOption = q.options?.find((opt: any) => opt.isCorrect === true);
      const isCorrect = correctOption && correctOption.text === userAnswerText;

      if (isCorrect) {
        totalScore += q.points;
      }

      evaluatedAnswers.push({
        questionId: q.id,
        questionText: q.question_text,
        userAnswer: userAnswerText,
        isCorrect: isCorrect,
        correctAnswer: correctOption?.text
      });
    }

    const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const passed = percentage === 100;

    // Save attempt
    const { data: attempt, error: insertError } = await supabaseAdmin
      .from('akad_quiz_attempts')
      .insert({
        user_id: user.id,
        score: percentage,
        passed: passed,
        answers: evaluatedAnswers
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save attempt', details: insertError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: attempt
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
