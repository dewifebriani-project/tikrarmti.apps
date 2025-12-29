import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

const supabaseAdmin = createSupabaseAdmin();

// GET: Fetch question analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const juz = searchParams.get('juz');
    const section = searchParams.get('section');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query for questions
    let questionsQuery = supabaseAdmin
      .from('exam_questions')
      .select('*')
      .eq('is_active', true)
      .order('juz_number', { ascending: true })
      .order('section_number', { ascending: true })
      .order('question_number', { ascending: true });

    if (juz) {
      questionsQuery = questionsQuery.eq('juz_number', parseInt(juz));
    }
    if (section) {
      questionsQuery = questionsQuery.eq('section_number', parseInt(section));
    }

    questionsQuery = questionsQuery.limit(limit);

    const { data: questions, error: questionsError } = await questionsQuery;

    if (questionsError) {
      logger.error('Error fetching questions for analytics', { error: questionsError });
      return NextResponse.json({
        error: 'Failed to fetch questions'
      }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({
        data: [],
        summary: {
          totalQuestions: 0,
          totalAttempts: 0,
          overallCorrectRate: 0,
          easyQuestions: 0,
          mediumQuestions: 0,
          hardQuestions: 0,
        }
      });
    }

    // Get all submitted attempts with answers
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('exam_attempts')
      .select('id, answers, submitted_at')
      .eq('status', 'submitted');

    if (attemptsError) {
      logger.error('Error fetching attempts for analytics', { error: attemptsError });
      return NextResponse.json({
        error: 'Failed to fetch attempts'
      }, { status: 500 });
    }

    // Calculate analytics for each question
    const analytics = questions.map((question: any) => {
      const questionId = question.id;
      const correctAnswer = question.correct_answer;

      // Count attempts for this question
      let totalAttempts = 0;
      let correctAnswers = 0;
      const optionCounts: Record<string, number> = {};

      // Initialize option counts from question options
      if (question.options && Array.isArray(question.options)) {
        question.options.forEach((opt: any) => {
          optionCounts[opt.text] = 0;
        });
      }

      // Process each attempt
      attempts?.forEach((attempt: any) => {
        if (attempt.answers && Array.isArray(attempt.answers)) {
          const answer = attempt.answers.find((a: any) => a.questionId === questionId);
          if (answer && answer.answer) {
            totalAttempts++;
            if (answer.answer === correctAnswer) {
              correctAnswers++;
            }
            // Track option selection
            if (optionCounts.hasOwnProperty(answer.answer)) {
              optionCounts[answer.answer]++;
            } else {
              optionCounts[answer.answer] = (optionCounts[answer.answer] || 0) + 1;
            }
          }
        }
      });

      const incorrectAnswers = totalAttempts - correctAnswers;
      const correctRate = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;

      // Calculate difficulty
      let difficulty: 'easy' | 'medium' | 'hard';
      if (correctRate >= 70) {
        difficulty = 'easy';
      } else if (correctRate >= 40) {
        difficulty = 'medium';
      } else {
        difficulty = 'hard';
      }

      // Build option stats
      const optionStats = question.options?.map((opt: any) => ({
        optionText: opt.text,
        timesChosen: optionCounts[opt.text] || 0,
        percentage: totalAttempts > 0 ? ((optionCounts[opt.text] || 0) / totalAttempts) * 100 : 0,
        isCorrect: opt.isCorrect || opt.text === correctAnswer,
      })) || [];

      return {
        questionId,
        question,
        totalAttempts,
        correctAnswers,
        incorrectAnswers,
        correctRate: Math.round(correctRate * 10) / 10,
        optionStats,
        difficulty,
      };
    });

    // Calculate summary
    const totalAttemptsAll = analytics.reduce((sum, a) => sum + a.totalAttempts, 0);
    const totalCorrectAll = analytics.reduce((sum, a) => sum + a.correctAnswers, 0);
    const overallCorrectRate = totalAttemptsAll > 0 ? (totalCorrectAll / totalAttemptsAll) * 100 : 0;

    const easyQuestions = analytics.filter(a => a.difficulty === 'easy').length;
    const mediumQuestions = analytics.filter(a => a.difficulty === 'medium').length;
    const hardQuestions = analytics.filter(a => a.difficulty === 'hard').length;

    return NextResponse.json({
      data: analytics,
      summary: {
        totalQuestions: analytics.length,
        totalAttempts: totalAttemptsAll,
        overallCorrectRate: Math.round(overallCorrectRate * 10) / 10,
        easyQuestions,
        mediumQuestions,
        hardQuestions,
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/exam/questions/analytics', { error: error as Error });
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
