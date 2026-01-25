// API Route: /api/exam/attempts/[attemptId]
// Get exam attempt results

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';
import { calculateScore } from '@/lib/exam-utils';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = params;

    // Get the exam attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    if (attempt.status !== 'submitted') {
      return NextResponse.json({ error: 'Exam not yet submitted' }, { status: 400 });
    }

    // Get all questions for this juz
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('exam_questions')
      .select('*')
      .eq('juz_number', attempt.juz_number)
      .eq('is_active', true);

    if (questionsError || !questions) {
      logger.error('Error fetching questions for results', { error: questionsError });
      return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
    }

    // Calculate section results
    const sectionResults = new Map<number, { total: number; correct: number; title: string }>();

    questions.forEach(q => {
      if (!sectionResults.has(q.section_number)) {
        sectionResults.set(q.section_number, {
          total: 0,
          correct: 0,
          title: q.section_title
        });
      }

      const section = sectionResults.get(q.section_number)!;
      section.total++;

      const answer = attempt.answers?.find((a: any) => a.questionId === q.id);
      if (answer?.isCorrect) {
        section.correct++;
      }
    });

    const sections = Array.from(sectionResults.entries()).map(([section_number, data]) => ({
      section_number,
      section_title: data.title,
      total_questions: data.total,
      correct_answers: data.correct,
      percentage: calculateScore(data.correct, data.total)
    }));

    return NextResponse.json({
      result: {
        attempt,
        sections,
        overall_percentage: attempt.score,
        passed: attempt.score >= 60
      }
    }, { status: 200 });

  } catch (error) {
    logger.error('Error in GET /api/exam/attempts/[attemptId]', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
